/**
 * Dev endpoint behind the Penpot panel on the Design System page.
 *
 *   GET  /__designos/penpot                                   → status (keys are never sent)
 *   POST /__designos/penpot { action: 'create-file', name }   → the link
 *   POST /__designos/penpot { action: 'tokens' | 'components' | 'all' | 'section', sectionId? } → NDJSON progress
 *
 * Requests need the header `x-designos-live-edit: 1`, so a page elsewhere cannot trigger writes.
 * One run at a time.
 */
export const PENPOT_ENDPOINT = '/__designos/penpot'
const RUNS = new Set(['tokens', 'components', 'all', 'section'])

const send = (res, code, body) => {
  res.statusCode = code
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}
const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => {
      data += c
      if (data.length > 64 * 1024) reject(new Error('body too large'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })

// Vite reloads this module when a sync script changes, while a run keeps going in the process, so the
// lock lives outside the module. Two runs at once break each other's unfinished components.
const LOCK = Symbol.for('designos.penpot.running')

export function createHandler({ root, baseUrl, load }) {
  return async (req, res) => {
    if (req.headers['x-designos-live-edit'] !== '1') return send(res, 405, { error: 'not allowed' })
    try {
      const { status, createFile, runSync } = await load()
      if (req.method === 'GET') return send(res, 200, { ...(await status({ root })), running: !!globalThis[LOCK] })
      if (req.method !== 'POST') return send(res, 405, { error: 'not allowed' })
      const body = JSON.parse(await readBody(req))
      if (body.action === 'create-file') {
        const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 200) : 'Design OS'
        return send(res, 200, { link: await createFile({ root, name }) })
      }
      if (!RUNS.has(body.action)) return send(res, 400, { error: 'unknown action' })
      if (body.action === 'section' && !/^[a-z0-9][a-z0-9-]*$/.test(body.sectionId ?? '')) return send(res, 400, { error: 'invalid section id' })
      if (globalThis[LOCK]) return send(res, 409, { error: 'A sync is already running.' })
      globalThis[LOCK] = true
      res.statusCode = 200
      res.setHeader('content-type', 'application/x-ndjson')
      const write = (event) => res.write(`${JSON.stringify(event)}\n`)
      try {
        await runSync({ root, baseUrl: baseUrl(), action: body.action, sectionId: body.sectionId, log: write })
      } catch (error) {
        write({ step: 'error', message: String(error?.message ?? error) })
      } finally {
        globalThis[LOCK] = false
        res.end()
      }
    } catch (error) {
      if (!res.headersSent) send(res, error instanceof SyntaxError ? 400 : 500, { error: String(error?.message ?? error) })
    }
  }
}

export default function penpotSync() {
  let root = process.cwd()
  return {
    name: 'designos-penpot-sync',
    apply: 'serve',
    configResolved(config) {
      root = config.root
    },
    configureServer(server) {
      const baseUrl = () => (server.resolvedUrls?.local?.[0] ?? 'http://localhost:3000/').replace(/\/$/, '')
      // Loaded on first use: Playwright and the MCP SDK stay out of the dev server's start
      server.middlewares.use(PENPOT_ENDPOINT, createHandler({ root, baseUrl, load: () => import('./sync.mjs') }))
    },
  }
}
