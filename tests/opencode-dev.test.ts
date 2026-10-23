import { afterEach, describe, expect, it } from 'vitest'
import { EventEmitter } from 'node:events'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
// @ts-expect-error plain ESM script shared with vite.config.ts
import { authHeader, checkHealth, createOpencodeServer, createProxyMiddleware, parseListening, resolveBackend, serveArgs } from '../scripts/opencode-dev.mjs'
import { FakeOpenCode } from './helpers/fake-opencode'

/** A child process stand-in: tests write its output and end it */
function fakeProcess() {
  const proc = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    exitCode: null as number | null,
    killed: false,
    kill() {
      this.killed = true
    },
  })
  return proc
}

describe('serveArgs', () => {
  it('binds to localhost on the given port', () => {
    expect(serveArgs('127.0.0.1', 0)).toEqual(['serve', '--hostname=127.0.0.1', '--port=0'])
    expect(serveArgs('127.0.0.1', 4096, 'debug')).toEqual(['serve', '--hostname=127.0.0.1', '--port=4096', '--log-level=debug'])
  })
})

describe('parseListening', () => {
  it('reads the URL from the start line of opencode 2.x and 1.x', () => {
    expect(parseListening('Server listening on http://127.0.0.1:61051\n')).toBe('http://127.0.0.1:61051')
    expect(parseListening('opencode server listening on http://127.0.0.1:4096')).toBe('http://127.0.0.1:4096')
    expect(parseListening('starting…')).toBeNull()
  })
})

describe('createOpencodeServer', () => {
  it('starts opencode in the project folder with a password and resolves with the URL it listens on', async () => {
    const proc = fakeProcess()
    let call: { cmd: string; args: string[]; options: { cwd: string; env: Record<string, string> } } | undefined
    const started = createOpencodeServer({
      cwd: '/project',
      password: 'secret',
      spawn: (cmd: string, args: string[], options: { cwd: string; env: Record<string, string> }) => {
        call = { cmd, args, options }
        return proc
      },
    })
    proc.stdout.emit('data', Buffer.from('Server listening on http://127.0.0.1:61051\n'))
    const server = await started
    expect(call?.cmd).toBe('opencode')
    expect(call?.args).toEqual(['serve', '--hostname=127.0.0.1', '--port=0'])
    expect(call?.options.cwd).toBe('/project')
    expect(call?.options.env.OPENCODE_SERVER_PASSWORD).toBe('secret')
    expect(server.url).toBe('http://127.0.0.1:61051')
    expect(server.password).toBe('secret')
    server.close()
    expect(proc.killed).toBe(true)
  })

  it('makes up a random password per start', async () => {
    const passwords: string[] = []
    for (let i = 0; i < 2; i++) {
      const proc = fakeProcess()
      const started = createOpencodeServer({ spawn: (_c: string, _a: string[], o: { env: Record<string, string> }) => (passwords.push(o.env.OPENCODE_SERVER_PASSWORD), proc) })
      proc.stdout.emit('data', Buffer.from('Server listening on http://127.0.0.1:1\n'))
      await started
    }
    expect(passwords[0]).toMatch(/^[\w-]{24,}$/)
    expect(passwords[0]).not.toBe(passwords[1])
  })

  it('reports a missing opencode binary', async () => {
    const proc = fakeProcess()
    const started = createOpencodeServer({ spawn: () => proc })
    proc.emit('error', Object.assign(new Error('spawn opencode ENOENT'), { code: 'ENOENT' }))
    await expect(started).rejects.toThrow(/opencode not found/)
  })

  it('reports an early exit with the output, and gives up after the timeout', async () => {
    const proc = fakeProcess()
    const exited = createOpencodeServer({ spawn: () => proc })
    proc.stderr.emit('data', Buffer.from('port in use'))
    proc.emit('exit', 1)
    await expect(exited).rejects.toThrow(/exited with code 1:\nport in use/)

    const silent = fakeProcess()
    await expect(createOpencodeServer({ spawn: () => silent, timeout: 20 })).rejects.toThrow(/did not start within 20ms/)
    expect(silent.killed).toBe(true)
  })
})

describe('resolveBackend', () => {
  it('starts its own server on a free port by default', () => {
    expect(resolveBackend({})).toEqual({ autostart: true, port: 0 })
    expect(resolveBackend({ DESIGNOS_OPENCODE_PORT: '4110' })).toEqual({ autostart: true, port: 4110 })
  })
  it('connects to a given server instead', () => {
    expect(resolveBackend({ DESIGNOS_OPENCODE_URL: 'http://127.0.0.1:4196/', DESIGNOS_OPENCODE_PASSWORD: 'pw' })).toEqual({
      autostart: false,
      target: { url: 'http://127.0.0.1:4196', password: 'pw' },
    })
    expect(resolveBackend({ DESIGNOS_NO_OPENCODE: '1', DESIGNOS_OPENCODE_PORT: '4196' })).toEqual({
      autostart: false,
      target: { url: 'http://127.0.0.1:4196', password: undefined },
    })
    expect(resolveBackend({ DESIGNOS_NO_OPENCODE: '1' }).target.url).toBe('http://127.0.0.1:4096')
  })
})

describe('proxy', () => {
  let fake: FakeOpenCode | undefined
  let app: Server | undefined
  afterEach(async () => {
    await fake?.stop()
    if (app) await new Promise((r) => app!.close(r))
    fake = app = undefined
  })

  async function serve(getTarget: () => { url: string; password?: string } | null) {
    const middleware = createProxyMiddleware(getTarget)
    app = createServer((req, res) => middleware(req, res, () => res.writeHead(404).end('next')))
    await new Promise<void>((r) => app!.listen(0, '127.0.0.1', r))
    return `http://127.0.0.1:${(app.address() as AddressInfo).port}`
  }

  it('forwards /opencode to the server with the password, never the browser credentials', async () => {
    fake = await new FakeOpenCode('secret').start()
    const base = await serve(() => ({ url: fake!.url, password: 'secret' }))
    const res = await fetch(`${base}/opencode/api/info`, { headers: { authorization: 'Bearer from-browser', cookie: 'a=b' } })
    expect(res.status).toBe(200)
    expect((await res.json()).version).toBe('2.1.2')
    expect(fake.auth.at(-1)).toBe(authHeader('secret'))
  })

  it('streams server-sent events through', async () => {
    fake = await new FakeOpenCode().start()
    const base = await serve(() => ({ url: fake!.url }))
    const controller = new AbortController()
    const res = await fetch(`${base}/opencode/api/event`, { signal: controller.signal })
    const reader = res.body!.getReader()
    const { value } = await reader.read()
    expect(new TextDecoder().decode(value)).toContain('server.connected')
    controller.abort()
  })

  it('answers 503 while the server is not up, and leaves other paths alone', async () => {
    const base = await serve(() => null)
    expect((await fetch(`${base}/opencode/api/info`)).status).toBe(503)
    expect(await (await fetch(`${base}/other`)).text()).toBe('next')
    expect(await (await fetch(`${base}/opencodex`)).text()).toBe('next')
  })
})

describe('checkHealth', () => {
  let fake: FakeOpenCode | undefined
  afterEach(async () => {
    await fake?.stop()
    fake = undefined
  })

  it('is true for an OpenCode 2.x server with the right password', async () => {
    fake = await new FakeOpenCode('pw').start()
    expect(await checkHealth(fake.url, 'pw')).toBe(true)
    expect(await checkHealth(fake.url, 'wrong')).toBe(false)
  })

  it('is false for HTML (a 1.x server, a web page) and when nothing listens', async () => {
    const html = async () => new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } })
    expect(await checkHealth('http://x', undefined, { fetchImpl: html })).toBe(false)
    expect(await checkHealth('http://127.0.0.1:1', undefined, { timeoutMs: 200 })).toBe(false)
  })
})
