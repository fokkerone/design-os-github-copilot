/**
 * Starts `opencode serve` next to the Vite dev server, so `npm run dev` brings up the chat backend.
 * Pure functions with injectable spawn and health check; `opencodeServePlugin` is the Vite wrapper.
 */
import { spawn as nodeSpawn } from 'node:child_process'

export const serveArgs = (port) => ['serve', '--port', String(port), '--hostname', '127.0.0.1']

async function defaultCheck(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/global/health`, { signal: AbortSignal.timeout(1500) })
    return res.ok && (await res.json()).healthy === true
  } catch {
    return false
  }
}

export async function ensureOpenCode({
  port = 4096,
  cwd = process.cwd(),
  check = () => defaultCheck(port),
  spawn = nodeSpawn,
  waitMs = 15000,
  pollMs = 250,
} = {}) {
  if (await check()) return { started: false, stop() {} }

  const child = spawn('opencode', serveArgs(port), { cwd, stdio: 'ignore' })
  let error
  child.on('error', (e) => {
    error = e.code === 'ENOENT' ? 'opencode not found. Install it from https://opencode.ai' : e.message
  })
  const stop = () => child.kill()

  const deadline = Date.now() + waitMs
  while (Date.now() < deadline) {
    if (error) break
    if (await check()) return { started: true, stop }
    await new Promise((r) => setTimeout(r, pollMs))
  }
  stop()
  return { started: false, stop() {}, error: error ?? `opencode did not become healthy on port ${port}` }
}

/** Vite plugin: serve only (never in build), stops the child with the dev server */
export function opencodeServePlugin(options = {}) {
  return {
    name: 'designos-opencode-serve',
    apply: 'serve',
    configureServer(server) {
      let running
      ensureOpenCode({ cwd: server.config.root, ...options }).then((r) => {
        running = r
        if (r.error) server.config.logger.warn(`[opencode] ${r.error}. Chat is offline.`)
        else if (r.started) server.config.logger.info('[opencode] started opencode serve')
      })
      server.httpServer?.on('close', () => running?.stop())
      process.on('exit', () => running?.stop())
    },
  }
}
