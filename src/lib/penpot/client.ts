/**
 * The Penpot panel's way to the dev endpoint (scripts/penpot/plugin.mjs). Keys stay on the server;
 * the page only sees whether they are set.
 */
export const PENPOT_ENDPOINT = '/__designos/penpot'
const HEADERS = { 'x-designos-live-edit': '1' }

export type ConnectionState = 'no-key' | 'not-connected' | 'wrong-file' | 'connected' | 'error'

export interface BoardReport {
  board: string
  section: string
  shapes: number
  instances: number
  offsets: { name: string; dx: number; dy: number; dw: number; dh: number }[]
  pixels: { sizeMatches?: boolean; share?: number; outsideText?: number; insideText?: number; textShare?: number; web?: string; penpot?: string; error?: string }
}

export interface SyncReport {
  action: string
  at: string
  tokens?: { created: number; updated: number; same: number; failed: string[] } | null
  skippedTokens?: string[]
  components?: { total: number; created: number; unchanged: number; variantFailures?: { name: string; message: string }[] }
  tokenViolations?: { kind: string; value: string; where: string[] }[]
  unsupported?: { kind: string; where: string }[]
  boards?: BoardReport[]
}

export interface PenpotLink {
  fileId: string
  teamId: string
  name: string
  url: string
  lastSync?: SyncReport
}

export interface PenpotStatus {
  configured: { key: boolean; token: boolean }
  link: PenpotLink | null
  /** Name of the linked file when Penpot no longer has it. A new file replaces the link */
  goneFile?: string
  sections: { id: string; screens: string[] }[]
  penpotUrl: string
  connection: { state: ConnectionState; message?: string; file?: { id: string; name: string } }
  running?: boolean
}

export type SyncAction = { action: 'tokens' | 'components' | 'all' } | { action: 'section'; sectionId: string }
export type SyncEvent = { step: string; message: string; percent?: number; report?: SyncReport }

export interface PenpotClient {
  status(): Promise<PenpotStatus>
  createFile(name: string): Promise<PenpotLink>
  run(action: SyncAction, onEvent: (event: SyncEvent) => void): Promise<void>
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null)
  return body?.error ?? `Request failed (${res.status})`
}

/** Splits an NDJSON stream into events; a line can arrive in pieces */
export function createLineParser(onEvent: (event: SyncEvent) => void) {
  let rest = ''
  return (chunk: string) => {
    rest += chunk
    const lines = rest.split('\n')
    rest = lines.pop() ?? ''
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line) as SyncEvent)
  }
}

export const penpotClient: PenpotClient = {
  async status() {
    const res = await fetch(PENPOT_ENDPOINT, { headers: HEADERS })
    if (!res.ok) throw new Error(await readError(res))
    return res.json()
  },
  async createFile(name) {
    const res = await fetch(PENPOT_ENDPOINT, { method: 'POST', headers: { ...HEADERS, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'create-file', name }) })
    if (!res.ok) throw new Error(await readError(res))
    return (await res.json()).link
  },
  async run(action, onEvent) {
    const res = await fetch(PENPOT_ENDPOINT, { method: 'POST', headers: { ...HEADERS, 'content-type': 'application/json' }, body: JSON.stringify(action) })
    if (!res.ok || !res.body) throw new Error(await readError(res))
    const parse = createLineParser(onEvent)
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
    for (;;) {
      const { value, done } = await reader.read()
      if (done) return
      parse(value)
    }
  },
}
