/**
 * A small fake of `opencode serve` for tests: the routes and event shapes the assistant-ui
 * OpenCode adapter uses, recorded from a real server (v1.18.35). Replies are scripted per prompt.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface ScriptedReply {
  /** Text the assistant streams, in chunks */
  chunks: string[]
  /** Wait between chunks (ms), lets tests observe streaming */
  delayMs?: number
}

interface Msg {
  info: Record<string, unknown>
  parts: Record<string, unknown>[]
}

let counter = 0
const id = (prefix: string) => `${prefix}_${(++counter).toString().padStart(6, '0')}`

export class FakeOpenCode {
  server: Server
  url = ''
  /** Every request received, "METHOD /path" */
  requests: string[] = []
  /** Bodies of prompt requests */
  prompts: { sessionID: string; text: string; model?: { providerID: string; modelID: string }; agent?: string }[] = []
  aborts: string[] = []
  /** Routes the fake does not implement, the adapter asked for them */
  unhandled: string[] = []
  sessions = new Map<string, Record<string, unknown>>()
  messages = new Map<string, Msg[]>()
  private clients = new Set<ServerResponse>()
  private replies: ScriptedReply[] = []
  private timers = new Set<NodeJS.Timeout>()

  constructor() {
    this.server = createServer((req, res) => this.handle(req, res))
  }

  async start(): Promise<this> {
    await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', resolve))
    this.url = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`
    return this
  }

  async stop() {
    for (const t of this.timers) clearTimeout(t)
    for (const c of this.clients) c.end()
    this.server.closeAllConnections()
    await new Promise<void>((resolve) => this.server.close(() => resolve()))
  }

  /** The next prompt is answered with this script */
  reply(script: ScriptedReply) {
    this.replies.push(script)
  }

  emit(type: string, properties: Record<string, unknown>) {
    const data = JSON.stringify({ id: id('evt'), type, properties })
    for (const c of this.clients) c.write(`data: ${data}\n\n`)
  }

  private session(sessionID: string) {
    return this.sessions.get(sessionID)
  }

  private newSession() {
    const now = Date.now()
    const sessionID = id('ses')
    const info = {
      id: sessionID, slug: 'fake-session', projectID: 'p', directory: '/fake', path: '', title: 'New session',
      version: '1.18.35', time: { created: now, updated: now }, summary: { additions: 0, deletions: 0, files: 0 },
    }
    this.sessions.set(sessionID, info)
    this.messages.set(sessionID, [])
    return info
  }

  private async body(req: IncomingMessage): Promise<Record<string, unknown>> {
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    const raw = Buffer.concat(chunks).toString()
    return raw ? JSON.parse(raw) : {}
  }

  private json(res: ServerResponse, data: unknown, status = 200) {
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  private async handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', this.url)
    const path = url.pathname
    this.requests.push(`${req.method} ${path}`)

    if (path === '/global/health') return this.json(res, { healthy: true, version: '1.18.35' })

    if (path === '/event' || path === '/global/event') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' })
      this.clients.add(res)
      res.on('close', () => this.clients.delete(res))
      res.write(`data: ${JSON.stringify({ id: id('evt'), type: 'server.connected', properties: {} })}\n\n`)
      return
    }

    if (path === '/session' && req.method === 'POST') {
      await this.body(req)
      return this.json(res, this.newSession())
    }
    if (path === '/session' || path === '/experimental/session') {
      return this.json(res, [...this.sessions.values()])
    }
    if (path === '/session/status') return this.json(res, {})
    if (path === '/permission' || path === '/question') return this.json(res, [])
    if (path === '/config/providers') {
      const model = (id: string) => [id, { id, name: id }] as const
      return this.json(res, {
        providers: [
          { id: 'rwe-factory-claude', name: 'RWE FACTORY CLAUDE', models: Object.fromEntries([model('claude-opus-5-5-factory'), model('claude-sonnet-5-5-factory')]) },
          { id: 'rwe-factory-gpt', name: 'RWE FACTORY GPT', models: Object.fromEntries([model('gpt-6-sol-factory')]) },
        ],
        default: { 'rwe-factory-claude': 'claude-sonnet-5-5-factory' },
      })
    }

    const m = path.match(/^\/session\/([^/]+)(?:\/(\w+))?$/)
    if (m) {
      const [, sessionID, action] = m
      const info = this.session(sessionID)
      if (!info) return this.json(res, { name: 'NotFoundError' }, 404)
      if (!action && req.method === 'GET') return this.json(res, info)
      if (!action && req.method === 'PATCH') {
        Object.assign(info, await this.body(req))
        return this.json(res, info)
      }
      if (!action && req.method === 'DELETE') {
        this.sessions.delete(sessionID)
        return this.json(res, true)
      }
      if (action === 'message' && req.method === 'GET') return this.json(res, this.messages.get(sessionID) ?? [])
      if (action === 'prompt_async' && req.method === 'POST') {
        const body = await this.body(req)
        const text = ((body.parts as { text?: string }[]) ?? []).map((p) => p.text ?? '').join('')
        this.prompts.push({ sessionID, text, model: body.model as never, agent: body.agent as string | undefined })
        res.writeHead(204).end()
        this.answer(sessionID, text)
        return
      }
      if (action === 'abort' && req.method === 'POST') {
        this.aborts.push(sessionID)
        this.stopTimers()
        this.emit('session.idle', { sessionID })
        return this.json(res, true)
      }
    }

    this.unhandled.push(`${req.method} ${path}`)
    this.json(res, { name: 'NotFoundError', message: `fake: ${req.method} ${path}` }, 404)
  }

  private stopTimers() {
    for (const t of this.timers) clearTimeout(t)
    this.timers.clear()
  }

  private answer(sessionID: string, text: string) {
    const now = Date.now()
    const userID = id('msg')
    const user: Msg = {
      info: { id: userID, sessionID, role: 'user', time: { created: now }, agent: 'build', model: { providerID: 'p', modelID: 'm' } },
      parts: [{ id: id('prt'), sessionID, messageID: userID, type: 'text', text }],
    }
    this.messages.get(sessionID)!.push(user)
    this.emit('message.updated', { sessionID, info: user.info })
    this.emit('message.part.updated', { sessionID, part: user.parts[0], time: now })
    this.emit('session.status', { sessionID, status: { type: 'busy' } })

    const script = this.replies.shift() ?? { chunks: ['ok'] }
    const asstID = id('msg')
    const partID = id('prt')
    const asst: Msg = {
      info: {
        id: asstID, sessionID, role: 'assistant', parentID: userID, modelID: 'm', providerID: 'p', mode: 'build', agent: 'build',
        path: { cwd: '/fake', root: '/fake' }, cost: 0, tokens: { total: 0, input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
        time: { created: now + 1 },
      },
      parts: [],
    }
    this.messages.get(sessionID)!.push(asst)
    this.emit('message.updated', { sessionID, info: asst.info })
    const textPart = { id: partID, sessionID, messageID: asstID, type: 'text', text: '', time: { start: now + 2 } }
    asst.parts.push(textPart)
    this.emit('message.part.updated', { sessionID, part: { ...textPart }, time: now + 2 })

    let i = 0
    const step = () => {
      if (i < script.chunks.length) {
        const delta = script.chunks[i++]
        textPart.text += delta
        this.emit('message.part.delta', { sessionID, messageID: asstID, partID, field: 'text', delta })
        this.timers.add(setTimeout(step, script.delayMs ?? 0))
        return
      }
      const done = Date.now()
      Object.assign(asst.info, { time: { created: now + 1, completed: done }, finish: 'stop' })
      Object.assign(textPart, { time: { start: now + 2, end: done } })
      this.emit('message.part.updated', { sessionID, part: { ...textPart }, time: done })
      this.emit('message.updated', { sessionID, info: asst.info })
      this.emit('session.idle', { sessionID })
    }
    this.timers.add(setTimeout(step, 0))
  }
}
