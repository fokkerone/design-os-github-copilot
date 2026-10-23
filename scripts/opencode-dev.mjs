/**
 * The chat backend of `npm run dev`: starts an OpenCode 2.x server for this checkout and proxies
 * `/opencode` to it, so the browser talks to the same origin (no CORS) and never sees the server
 * password or API keys.
 *
 * - Autostart (default): `createOpencodeServer` starts `opencode serve` in the project folder on a
 *   free port (`DESIGNOS_OPENCODE_PORT` pins one) with a random password. Every checkout and
 *   worktree gets its own server, so the agent always edits the files of the app it runs in.
 * - External server: `DESIGNOS_OPENCODE_URL=http://127.0.0.1:4196` (+ `DESIGNOS_OPENCODE_PASSWORD`)
 *   connects to a running server; e2e uses a fake one. `DESIGNOS_NO_OPENCODE=1` skips the autostart
 *   and expects a server on `DESIGNOS_OPENCODE_PORT` or 4096.
 *
 * OpenCode 2.x serves its API under /api with HTTP Basic auth (user "opencode", password from
 * OPENCODE_SERVER_PASSWORD). The npm SDK (@opencode-ai/sdk) still targets the 1.x API, and its
 * `createOpencodeServer` waits for the 1.x start line, so the launcher here follows its shape
 * ({ url, close }) without depending on it.
 *
 * Pure functions with injectable spawn, fetch and request; `opencodeServePlugin` is the Vite wrapper.
 */
import { randomBytes } from 'node:crypto'
import { spawn as nodeSpawn } from 'node:child_process'
import { request as httpRequest } from 'node:http'

export const PROXY_PATH = '/opencode'
export const DEFAULT_PORT = 4096

export const serveArgs = (hostname, port, logLevel) => [
  'serve',
  `--hostname=${hostname}`,
  `--port=${port}`,
  ...(logLevel ? [`--log-level=${logLevel}`] : []),
]

/**
 * The URL from the server's start line. opencode 1.x prints "opencode server listening on <url>",
 * 2.x prints "Server listening on <url>"; the SDK's own launcher only knows the first.
 */
export function parseListening(output) {
  for (const line of output.split('\n')) {
    const match = line.match(/server listening on\s+(https?:\/\/\S+)/i)
    if (match) return match[1]
  }
  return null
}

export const USERNAME = 'opencode'

/** The Authorization header for a server password, or undefined without one */
export const authHeader = (password) => (password ? `Basic ${Buffer.from(`${USERNAME}:${password}`).toString('base64')}` : undefined)

/** Healthy: GET /api/info answers JSON with a version (a 1.x server answers HTML there) */
export async function checkHealth(url, password, { timeoutMs = 1500, fetchImpl = fetch } = {}) {
  try {
    const auth = authHeader(password)
    const res = await fetchImpl(`${url}/api/info`, { headers: auth ? { authorization: auth } : {}, signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return false
    return typeof (await res.json()).version === 'string'
  } catch {
    return false
  }
}

/**
 * Starts `opencode serve` like the SDK's `createOpencodeServer` ({ url, close }, same options),
 * plus `cwd` (the project the agent works in) and both start line formats.
 */
export function createOpencodeServer({
  hostname = '127.0.0.1',
  port = 0,
  timeout = 15000,
  config = {},
  cwd = process.cwd(),
  password = randomBytes(24).toString('base64url'),
  spawn = nodeSpawn,
} = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('opencode', serveArgs(hostname, port, config.logLevel), {
      cwd,
      env: { ...process.env, OPENCODE_CONFIG_CONTENT: JSON.stringify(config), OPENCODE_SERVER_PASSWORD: password },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    let settled = false
    const close = () => {
      if (proc.exitCode === null && !proc.killed) proc.kill()
    }
    const fail = (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      close()
      reject(error)
    }
    const timer = setTimeout(() => fail(new Error(`opencode did not start within ${timeout}ms${output ? `:\n${output.trim()}` : ''}`)), timeout)
    const onData = (chunk) => {
      output += chunk.toString()
      const url = settled ? null : parseListening(output)
      if (!url) return
      settled = true
      clearTimeout(timer)
      resolve({ url, password, close, process: proc })
    }
    proc.stdout?.on('data', onData)
    proc.stderr?.on('data', onData)
    proc.on('error', (e) => fail(new Error(e.code === 'ENOENT' ? 'opencode not found. Install it from https://opencode.ai' : e.message)))
    proc.on('exit', (code) => fail(new Error(`opencode exited with code ${code}${output ? `:\n${output.trim()}` : ''}`)))
  })
}

/** Which server the dev server proxies to, and whether it starts one itself */
export function resolveBackend(env = process.env) {
  const password = env.DESIGNOS_OPENCODE_PASSWORD || undefined
  if (env.DESIGNOS_OPENCODE_URL) return { autostart: false, target: { url: env.DESIGNOS_OPENCODE_URL.replace(/\/+$/, ''), password } }
  const port = Number(env.DESIGNOS_OPENCODE_PORT) || 0
  if (env.DESIGNOS_NO_OPENCODE) return { autostart: false, target: { url: `http://127.0.0.1:${port || DEFAULT_PORT}`, password } }
  return { autostart: true, port }
}

/**
 * Connect middleware: forwards `/opencode/*` to the server, streaming both ways (SSE included).
 * `getTarget` returns the current server ({ url, password }), or null while it is starting or down (→ 503).
 * The password goes into the Authorization header here, so the browser never holds it.
 */
export function createProxyMiddleware(getTarget, { request = httpRequest } = {}) {
  return (req, res, next) => {
    if (!req.url || (req.url !== PROXY_PATH && !req.url.startsWith(`${PROXY_PATH}/`) && !req.url.startsWith(`${PROXY_PATH}?`))) return next()
    const target = getTarget()
    if (!target) {
      res.statusCode = 503
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ error: 'opencode is not running' }))
      return
    }
    const url = new URL(req.url.slice(PROXY_PATH.length) || '/', target.url)
    const headers = { ...req.headers, host: url.host }
    delete headers.authorization
    delete headers.cookie
    const auth = authHeader(target.password)
    if (auth) headers.authorization = auth
    const upstream = request(
      url,
      { method: req.method, headers },
      (upRes) => {
        res.writeHead(upRes.statusCode ?? 502, upRes.headers)
        upRes.pipe(res)
      },
    )
    upstream.on('error', () => {
      if (res.headersSent) return res.end()
      res.statusCode = 502
      res.end()
    })
    // An event stream lives until the page goes away: end the upstream request with it
    res.on('close', () => upstream.destroy())
    req.pipe(upstream)
  }
}

/** Vite plugin: serve only (never in build), stops the server with the dev server */
export function opencodeServePlugin({ env = process.env, start = createOpencodeServer } = {}) {
  return {
    name: 'designos-opencode-serve',
    apply: 'serve',
    configureServer(server) {
      const log = server.config.logger
      const backend = resolveBackend(env)
      let target = backend.autostart ? null : backend.target
      let running
      server.middlewares.use(createProxyMiddleware(() => target))
      if (!backend.autostart) return

      start({ port: backend.port, cwd: server.config.root })
        .then((r) => {
          running = r
          target = { url: r.url, password: r.password }
          log.info(`[opencode] ${r.url} (${server.config.root})`)
        })
        .catch((e) => log.warn(`[opencode] ${e.message}. Chat is offline.`))
      const stop = () => running?.close()
      server.httpServer?.on('close', stop)
      process.on('exit', stop)
    },
  }
}
