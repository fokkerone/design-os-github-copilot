/**
 * A small fake of `opencode serve` 2.x for tests: the /api routes and event shapes the chat uses,
 * recorded from a real server (v2.1.2). Replies are scripted per prompt.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface ScriptedReply {
  /** Text the assistant streams, in chunks */
  chunks: string[]
  /** Wait between chunks (ms), lets tests observe streaming */
  delayMs?: number
  /** The agent asks the user first (the `question` tool) and streams its chunks after the answer */
  question?: { question: string; header?: string; options?: { label: string; description?: string }[] }[]
  /** Wait between the tool call and its form (ms), as the real server does: the chat shows the call first */
  formDelayMs?: number
  /** The event stream drops right before the form, so the chat misses `form.created` and has to catch up */
  dropStreamBeforeForm?: boolean
}

type ModelRef = { id: string; providerID: string }
type History = Record<string, unknown> & { id: string; type: string }

let counter = 0
const id = (prefix: string) => `${prefix}_${(++counter).toString().padStart(6, '0')}`

export const FAKE_MODELS = [
  { id: 'claude-opus-5-5-factory', providerID: 'rwe-factory-claude', name: 'claude-opus-5-5-factory' },
  { id: 'claude-sonnet-5-5-factory', providerID: 'rwe-factory-claude', name: 'claude-sonnet-5-5-factory' },
  { id: 'gpt-6-sol-factory', providerID: 'rwe-factory-gpt', name: 'gpt-6-sol-factory' },
]

export class FakeOpenCode {
  server: Server
  url = ''
  /** Every request received, "METHOD /path" */
  requests: string[] = []
  /** Authorization headers received */
  auth: (string | undefined)[] = []
  /** Prompts, with the model of their session at that time (undefined: server default) */
  prompts: { sessionID: string; text: string; model?: { providerID: string; modelID: string } }[] = []
  aborts: string[] = []
  /** Routes the fake does not implement, the client asked for them */
  unhandled: string[] = []
  /** Answers to forms, one entry per reply (cancelled: null) */
  answers: (Record<string, unknown> | null)[] = []
  sessions = new Map<string, { id: string; model?: ModelRef; time: { created: number; updated: number } }>()
  history = new Map<string, History[]>()
  private forms = new Map<string, { form: Record<string, unknown>; resume: () => void; cancel: () => void }>()
  private clients = new Set<ServerResponse>()
  private replies: ScriptedReply[] = []
  private timers = new Set<NodeJS.Timeout>()

  private readonly password: string | undefined

  /** With a password, every /api request needs Basic auth as opencode 2.x does */
  constructor(password?: string) {
    this.password = password
    this.server = createServer((req, res) => void this.handle(req, res))
  }

  async start(port = 0): Promise<this> {
    await new Promise<void>((resolve) => this.server.listen(port, '127.0.0.1', resolve))
    this.url = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`
    return this
  }

  async stop() {
    this.stopTimers()
    for (const c of this.clients) c.end()
    this.server.closeAllConnections()
    await new Promise<void>((resolve) => this.server.close(() => resolve()))
  }

  /** The next prompt is answered with this script */
  reply(script: ScriptedReply) {
    this.replies.push(script)
  }

  /** Ends every open event stream, as a dropped connection does */
  dropStreams() {
    for (const c of this.clients) c.end()
    this.clients.clear()
  }

  emit(type: string, data: Record<string, unknown>) {
    const event = JSON.stringify({ id: id('evt'), created: Date.now(), type, data })
    for (const c of this.clients) c.write(`data: ${event}\n\n`)
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
    this.auth.push(req.headers.authorization)

    // Like the real server: everything outside /api is the web UI
    if (!path.startsWith('/api/')) {
      res.writeHead(200, { 'content-type': 'text/html' })
      return res.end('<!doctype html><html></html>')
    }
    const expected = this.password && `Basic ${Buffer.from(`opencode:${this.password}`).toString('base64')}`
    if (expected && req.headers.authorization !== expected) return this.json(res, { _tag: 'UnauthorizedError', message: 'Authentication required' }, 401)

    if (path === '/api/info') return this.json(res, { version: '2.1.2', pid: process.pid, urls: [this.url] })
    if (path === '/api/model') return this.json(res, { data: FAKE_MODELS })

    if (path === '/api/event') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' })
      this.clients.add(res)
      res.on('close', () => this.clients.delete(res))
      res.write(`data: ${JSON.stringify({ id: id('evt'), type: 'server.connected', data: {} })}\n\n`)
      return
    }

    if (path === '/api/session' && req.method === 'POST') {
      const body = await this.body(req)
      const now = Date.now()
      const session = { id: id('ses'), model: (body.model as ModelRef | undefined) ?? undefined, time: { created: now, updated: now } }
      this.sessions.set(session.id, session)
      this.history.set(session.id, [])
      this.emit('session.created', { sessionID: session.id })
      return this.json(res, { data: session })
    }

    const m = path.match(/^\/api\/session\/([^/]+)(?:\/(\w+))?(?:\/([^/]+))?(?:\/(reply))?$/)
    if (m) {
      const [, sessionID, action, sub, reply] = m
      const session = this.sessions.get(sessionID)
      if (!session) return this.json(res, { _tag: 'SessionNotFoundError', message: `Session not found: ${sessionID}` }, 404)
      if (!action && req.method === 'GET') return this.json(res, { data: session })
      if (action === 'message' && req.method === 'GET') return this.json(res, { data: this.history.get(sessionID), cursor: {} })
      if (action === 'model' && req.method === 'POST') {
        session.model = (await this.body(req)).model as ModelRef
        return this.json(res, { data: session })
      }
      if (action === 'prompt' && req.method === 'POST') {
        const body = await this.body(req)
        const messageID = (body.id as string) ?? id('msg')
        const text = body.text as string
        this.prompts.push({ sessionID, text, model: session.model && { providerID: session.model.providerID, modelID: session.model.id } })
        this.json(res, { data: { id: messageID, sessionID, type: 'user', payload: { text }, delivery: 'steer', time: { created: Date.now() } } })
        void this.whenListening().then(() => this.answer(sessionID, messageID, text))
        return
      }
      if (action === 'interrupt' && req.method === 'POST') {
        this.aborts.push(sessionID)
        this.stopTimers()
        this.emit('session.execution.interrupted', { sessionID })
        return this.json(res, { interrupted: true })
      }
      if (action === 'permission' && !sub && req.method === 'GET') return this.json(res, { data: [] })
      if (action === 'form' && !sub && req.method === 'GET') {
        return this.json(res, { data: [...this.forms.values()].map((f) => f.form).filter((f) => f.sessionID === sessionID) })
      }
      if (action === 'form' && sub) {
        const entry = this.forms.get(sub)
        if (!entry) return this.json(res, { _tag: 'FormNotFoundError', message: 'Form not found' }, 404)
        this.forms.delete(sub)
        if (reply && req.method === 'POST') {
          const { answer } = await this.body(req)
          this.answers.push(answer as Record<string, unknown>)
          this.emit('form.replied', { id: sub, sessionID, answer })
          entry.resume()
          res.writeHead(204).end()
          return
        }
        if (!reply && req.method === 'DELETE') {
          this.answers.push(null)
          this.emit('form.cancelled', { id: sub, sessionID })
          entry.cancel()
          res.writeHead(204).end()
          return
        }
      }
    }

    this.unhandled.push(`${req.method} ${path}`)
    this.json(res, { _tag: 'NotFoundError', message: `fake: ${req.method} ${path}` }, 404)
  }

  /** The real server has its event stream open long before a prompt; wait for the client to subscribe */
  private async whenListening(timeoutMs = 3000) {
    const end = Date.now() + timeoutMs
    while (this.clients.size === 0 && Date.now() < end) await new Promise((r) => setTimeout(r, 10))
  }

  private stopTimers() {
    for (const t of this.timers) clearTimeout(t)
    this.timers.clear()
  }

  private later(fn: () => void, ms = 0) {
    const t = setTimeout(() => {
      this.timers.delete(t)
      fn()
    }, ms)
    this.timers.add(t)
  }

  private answer(sessionID: string, userID: string, text: string) {
    const history = this.history.get(sessionID)!
    const now = Date.now()
    history.push({ id: userID, type: 'user', text, time: { created: now } })
    this.emit('session.inbox.enqueued', { sessionID, inboxID: userID, item: { type: 'user', payload: { text }, delivery: 'steer' } })
    this.emit('session.execution.started', { sessionID })

    const script = this.replies.shift() ?? { chunks: ['ok'] }
    const finish = () => {
      this.emit('session.execution.succeeded', { sessionID })
      history.push({ id: id('msg'), type: 'idle', outcome: 'succeeded' })
    }
    const stream = () => {
      const messageID = id('msg')
      const message: History = { id: messageID, type: 'assistant', content: [{ type: 'text', text: '' }], time: { created: Date.now() } }
      history.push(message)
      const part = (message.content as { text: string }[])[0]
      this.emit('session.step.started', { sessionID, assistantMessageID: messageID, agent: 'build' })
      this.emit('session.text.started', { sessionID, assistantMessageID: messageID, ordinal: 0 })
      let i = 0
      const step = () => {
        if (i < script.chunks.length) {
          const delta = script.chunks[i++]
          part.text += delta
          this.emit('session.text.delta', { sessionID, assistantMessageID: messageID, ordinal: 0, delta })
          this.later(step, script.delayMs ?? 0)
          return
        }
        this.emit('session.text.ended', { sessionID, assistantMessageID: messageID, ordinal: 0, text: part.text })
        this.emit('session.step.ended', { sessionID, assistantMessageID: messageID, finish: 'stop' })
        message.finish = 'stop'
        finish()
      }
      this.later(step)
    }

    if (!script.question) return stream()

    // The question tool: a tool call plus a form, the answer resumes the run
    const messageID = id('msg')
    const toolID = id('toolu')
    const input = { questions: script.question }
    const tool: Record<string, unknown> = { type: 'tool', id: toolID, name: 'question', state: { status: 'running', input } }
    history.push({ id: messageID, type: 'assistant', content: [tool], time: { created: Date.now() } })
    this.emit('session.step.started', { sessionID, assistantMessageID: messageID, agent: 'build' })
    this.emit('session.tool.input.started', { sessionID, assistantMessageID: messageID, id: toolID, name: 'question' })
    this.emit('session.tool.called', { sessionID, assistantMessageID: messageID, id: toolID, input })
    const formID = id('frm')
    const form = {
      id: formID,
      sessionID,
      title: 'Questions',
      metadata: { kind: 'question', tool: { messageID, id: toolID } },
      fields: script.question.map((q, i) => ({
        key: `q${i}`,
        title: q.header,
        description: q.question,
        type: 'string',
        options: q.options?.map((o) => ({ value: o.label, label: o.label, description: o.description })),
        custom: true,
      })),
    }
    this.forms.set(formID, {
      form,
      resume: () => {
        const answers = [[String(Object.values(this.answers.at(-1) ?? {})[0] ?? '')]]
        tool.state = { status: 'completed', input, content: [{ type: 'text', text: 'User has answered your questions' }], metadata: { answers } }
        this.emit('session.tool.success', { sessionID, assistantMessageID: messageID, id: toolID, content: [{ type: 'text', text: 'User has answered your questions' }], metadata: { answers } })
        this.emit('session.step.ended', { sessionID, assistantMessageID: messageID, finish: 'tool-calls' })
        stream()
      },
      cancel: () => {
        tool.state = { status: 'error', input, error: { type: 'dismissed', message: 'The user dismissed this question' } }
        this.emit('session.tool.error', { sessionID, assistantMessageID: messageID, id: toolID, error: { type: 'dismissed', message: 'The user dismissed this question' } })
        this.emit('session.step.ended', { sessionID, assistantMessageID: messageID, finish: 'tool-calls' })
        finish()
      },
    })
    this.later(() => {
      if (script.dropStreamBeforeForm) this.dropStreams()
      this.emit('form.created', { form })
    }, script.formDelayMs ?? 0)
  }
}
