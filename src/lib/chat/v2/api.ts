/**
 * Client for the OpenCode v2 HTTP API (`opencode serve` 2.x, "opencode HttpApi").
 *
 * The npm SDK (`@opencode-ai/sdk`) speaks the 1.x API, whose paths the 2.x server answers with its
 * web UI. This client covers the routes the chat uses, typed from the server's `/openapi.json`.
 * It talks to the dev server's `/opencode` proxy, which adds the server password, so the browser
 * never sees it (scripts/opencode-dev.mjs).
 */

export interface ModelRef {
  id: string
  providerID: string
  variant?: string
}

export interface ModelInfo {
  id: string
  providerID: string
  name?: string
  family?: string
}

export interface SessionInfo {
  id: string
  model?: ModelRef
  time: { created: number; updated: number }
}

export interface StructuredError {
  type: string
  message: string
  status?: number
}

export type ToolState =
  | { status: 'streaming'; input?: unknown }
  | { status: 'running'; input: unknown }
  | { status: 'completed'; input: unknown; content: ToolContent[]; metadata?: Record<string, unknown> }
  | { status: 'error'; input: unknown; error: StructuredError; content?: ToolContent[] }

export type ToolContent = { type: 'text'; text: string } | { type: string; [key: string]: unknown }

export type AssistantContent =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string }
  | { type: 'tool'; id: string; name: string; state: ToolState }

/** One entry of `GET /api/session/{id}/message`; types the chat does not show are kept as `other` */
export type HistoryMessage =
  | { id: string; type: 'user'; text: string; time: { created: number } }
  | { id: string; type: 'assistant'; content: AssistantContent[]; finish?: string; error?: StructuredError; time: { created: number; completed?: number } }
  | { id: string; type: 'idle'; outcome?: 'succeeded' | 'failed' | 'interrupted' }
  | { id: string; type: string }

export interface FormOption {
  value: string
  label?: string
  description?: string
}

export interface FormField {
  key: string
  type: 'string' | 'number' | 'integer' | 'boolean' | 'multiselect' | 'external'
  title?: string
  description?: string
  options?: FormOption[]
  custom?: boolean
  hidden?: boolean
}

/** A question the agent asks (the `question` tool creates one) */
export interface FormInfo {
  id: string
  sessionID: string
  title: string
  metadata?: { kind?: string; tool?: { messageID: string; id: string } }
  fields: FormField[]
}

export type FormAnswer = Record<string, string | string[] | number | boolean>

/** A permission the agent waits for */
export interface PermissionRequest {
  id: string
  sessionID: string
  action: string
  resources: string[]
  message?: string
  metadata?: { tool?: { messageID?: string; id?: string } } & Record<string, unknown>
}

export type PermissionDecision = 'once' | 'always' | 'reject'

/** An event of `GET /api/event` (server-sent events) */
export interface ServerEvent {
  id: string
  type: string
  data: Record<string, unknown> & { sessionID?: string }
}

export class OpenCodeError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export interface OpenCodeClientOptions {
  /** The proxy (e.g. `http://localhost:3000/opencode`) or the server itself */
  baseUrl: string
  fetch?: typeof fetch
}

const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 22)

/** A message id the server accepts (`msg_…`), so the chat can show a prompt before the server echoes it */
export const newMessageId = () => `msg_${randomId()}`

export class OpenCodeClient {
  readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor({ baseUrl, fetch: fetchImpl }: OpenCodeClientOptions) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    // Bound, or the browser throws "Illegal invocation"
    this.fetchImpl = fetchImpl ?? globalThis.fetch.bind(globalThis)
  }

  private async call<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = text || res.statusText
      try {
        message = (JSON.parse(text) as { message?: string }).message ?? message
      } catch {
        /* not JSON */
      }
      throw new OpenCodeError(message, res.status)
    }
    if (res.status === 204) return undefined as T
    const type = res.headers.get('content-type') ?? ''
    // A 1.x server or a page answers these paths with HTML: not the server we expect
    if (!type.includes('json')) throw new OpenCodeError(`Expected JSON from ${path}, got ${type || 'nothing'}`, res.status)
    return (await res.json()) as T
  }

  /** Server version, or throws: the health check */
  info(signal?: AbortSignal) {
    return this.call<{ version: string }>('GET', '/api/info', undefined, signal)
  }

  async models(): Promise<ModelInfo[]> {
    return (await this.call<{ data: ModelInfo[] }>('GET', '/api/model')).data
  }

  async createSession(model?: ModelRef): Promise<SessionInfo> {
    return (await this.call<{ data: SessionInfo }>('POST', '/api/session', model ? { model } : {})).data
  }

  async getSession(id: string): Promise<SessionInfo> {
    return (await this.call<{ data: SessionInfo }>('GET', `/api/session/${id}`)).data
  }

  /** The conversation, oldest first */
  async messages(sessionID: string): Promise<HistoryMessage[]> {
    const res = await this.call<{ data: HistoryMessage[] }>('GET', `/api/session/${sessionID}/message?limit=200&order=asc`)
    return res.data
  }

  switchModel(sessionID: string, model: ModelRef) {
    return this.call<unknown>('POST', `/api/session/${sessionID}/model`, { model })
  }

  prompt(sessionID: string, text: string, id = newMessageId()) {
    return this.call<{ data: { id: string } }>('POST', `/api/session/${sessionID}/prompt`, { id, text })
  }

  interrupt(sessionID: string) {
    return this.call<{ interrupted: boolean }>('POST', `/api/session/${sessionID}/interrupt`)
  }

  async forms(sessionID: string): Promise<FormInfo[]> {
    return (await this.call<{ data: FormInfo[] }>('GET', `/api/session/${sessionID}/form`)).data
  }

  replyForm(sessionID: string, formID: string, answer: FormAnswer) {
    return this.call<void>('POST', `/api/session/${sessionID}/form/${formID}/reply`, { answer })
  }

  cancelForm(sessionID: string, formID: string) {
    return this.call<void>('DELETE', `/api/session/${sessionID}/form/${formID}`)
  }

  async permissions(sessionID: string): Promise<PermissionRequest[]> {
    return (await this.call<{ data: PermissionRequest[] }>('GET', `/api/session/${sessionID}/permission`)).data
  }

  replyPermission(sessionID: string, requestID: string, decision: PermissionDecision) {
    return this.call<void>('POST', `/api/session/${sessionID}/permission/${requestID}/reply`, { decision })
  }

  /**
   * Subscribes to the server's events until `signal` aborts. Resolves when the stream ends,
   * so the caller decides when to reconnect.
   */
  async events(onEvent: (event: ServerEvent) => void, signal: AbortSignal): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/api/event`, { headers: { accept: 'text/event-stream' }, signal })
    if (!res.ok || !res.body) throw new OpenCodeError(`Event stream failed: ${res.status}`, res.status)
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return
      buffer += value
      let end: number
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, end)
        buffer = buffer.slice(end + 2)
        const data = block
          .split('\n')
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trimStart())
          .join('\n')
        if (!data) continue
        try {
          onEvent(JSON.parse(data) as ServerEvent)
        } catch {
          /* a malformed event is skipped */
        }
      }
    }
  }
}
