/**
 * The chat thread of one OpenCode v2 session: built from the history, then kept current by the
 * server's events. Pure functions, so every event shape is testable without a server.
 */
import type { FormInfo, HistoryMessage, PermissionRequest, ServerEvent, StructuredError, ToolState } from './api'

export type ToolPart = {
  type: 'tool'
  id: string
  name: string
  input?: unknown
  inputText?: string
  result?: string
  /** Tool metadata, e.g. the answers of a `question` call */
  metadata?: Record<string, unknown>
  error?: string
  done: boolean
}
export type AssistantPart = { type: 'text'; text: string; ordinal?: number } | { type: 'reasoning'; text: string; ordinal?: number } | ToolPart

export type ChatMessage =
  | { role: 'user'; id: string; text: string }
  | { role: 'assistant'; id: string; parts: AssistantPart[]; done: boolean; error?: string; notice?: string }

export interface ThreadState {
  sessionID: string | undefined
  messages: ChatMessage[]
  running: boolean
  forms: FormInfo[]
  permissions: PermissionRequest[]
  /** Run-level error (failed execution) that belongs to no assistant message */
  error?: string
}

export const emptyThread = (sessionID?: string): ThreadState => ({ sessionID, messages: [], running: false, forms: [], permissions: [] })

const toolText = (content: { type: string; text?: unknown }[] | undefined) =>
  (content ?? []).map((c) => (c.type === 'text' && typeof c.text === 'string' ? c.text : '')).join('')

const errorText = (e: StructuredError | undefined) => e?.message

function toolFromState(id: string, name: string, state: ToolState): ToolPart {
  const part: ToolPart = { type: 'tool', id, name, input: state.input, done: state.status === 'completed' || state.status === 'error' }
  if (state.status === 'completed') {
    part.result = toolText(state.content as { type: string; text?: unknown }[])
    part.metadata = state.metadata
  }
  if (state.status === 'error') part.error = errorText(state.error)
  return part
}

/** The thread as the server stored it */
export function fromHistory(sessionID: string, history: HistoryMessage[]): ThreadState {
  const state = emptyThread(sessionID)
  for (const m of history) {
    if (m.type === 'user' && 'text' in m) state.messages.push({ role: 'user', id: m.id, text: m.text })
    else if (m.type === 'assistant' && 'content' in m) {
      const parts: AssistantPart[] = m.content.map((c) => (c.type === 'tool' ? toolFromState(c.id, c.name, c.state) : { type: c.type, text: c.text }))
      state.messages.push({ role: 'assistant', id: m.id, parts, done: true, error: errorText(m.error) })
    }
  }
  return state
}

// Immutable updates: assistant-ui and React compare by identity

function updateAssistant(state: ThreadState, id: string, update: (m: Extract<ChatMessage, { role: 'assistant' }>) => Extract<ChatMessage, { role: 'assistant' }>): ThreadState {
  const index = state.messages.findIndex((m) => m.id === id)
  const current = index >= 0 ? state.messages[index] : undefined
  const base = current?.role === 'assistant' ? current : { role: 'assistant' as const, id, parts: [], done: false }
  const next = update(base)
  const messages = index >= 0 ? state.messages.map((m, i) => (i === index ? next : m)) : [...state.messages, next]
  return { ...state, messages }
}

function updatePart<P extends AssistantPart>(parts: AssistantPart[], match: (p: AssistantPart) => p is P, create: () => P, update: (p: P) => P): AssistantPart[] {
  const index = parts.findIndex(match)
  if (index < 0) return [...parts, update(create())]
  return parts.map((p, i) => (i === index ? update(p as P) : p))
}

const textPart = (kind: 'text' | 'reasoning', ordinal: number) => (p: AssistantPart): p is Extract<AssistantPart, { type: 'text' | 'reasoning' }> =>
  p.type === kind && p.ordinal === ordinal
const toolPart = (id: string) => (p: AssistantPart): p is ToolPart => p.type === 'tool' && p.id === id

/** Applies one server event. Events of other sessions and unknown events leave the state as it is. */
export function applyEvent(state: ThreadState, event: ServerEvent): ThreadState {
  const d = event.data ?? {}
  if (!state.sessionID || d.sessionID !== state.sessionID) {
    // Form events carry the session inside the form
    const form = (d as { form?: FormInfo }).form
    if (!(event.type === 'form.created' && form?.sessionID === state.sessionID)) return state
  }
  const messageID = d.assistantMessageID as string | undefined
  const ordinal = (d.ordinal as number | undefined) ?? 0

  switch (event.type) {
    case 'session.inbox.enqueued': {
      const id = d.inboxID as string
      const item = d.item as { type?: string; payload?: { text?: string } } | undefined
      if (item?.type !== 'user' || state.messages.some((m) => m.id === id)) return state
      return { ...state, messages: [...state.messages, { role: 'user', id, text: item.payload?.text ?? '' }] }
    }
    case 'session.execution.started':
      return { ...state, running: true, error: undefined }
    case 'session.step.started':
      return messageID ? updateAssistant(state, messageID, (m) => ({ ...m, done: false, notice: undefined })) : state
    case 'session.retry.scheduled': {
      const error = d.error as StructuredError | undefined
      return messageID ? updateAssistant(state, messageID, (m) => ({ ...m, notice: `Retrying (attempt ${d.attempt}): ${error?.message ?? 'provider error'}` })) : state
    }
    case 'session.text.started':
    case 'session.reasoning.started': {
      if (!messageID) return state
      const kind = event.type.startsWith('session.text') ? 'text' : 'reasoning'
      return updateAssistant(state, messageID, (m) => ({ ...m, parts: updatePart(m.parts, textPart(kind, ordinal), () => ({ type: kind, text: '', ordinal }), (p) => p) }))
    }
    case 'session.text.delta':
    case 'session.reasoning.delta': {
      if (!messageID) return state
      const kind = event.type.startsWith('session.text') ? 'text' : 'reasoning'
      const delta = (d.delta as string) ?? ''
      return updateAssistant(state, messageID, (m) => ({ ...m, parts: updatePart(m.parts, textPart(kind, ordinal), () => ({ type: kind, text: '', ordinal }), (p) => ({ ...p, text: p.text + delta })) }))
    }
    case 'session.text.ended':
    case 'session.reasoning.ended': {
      if (!messageID || typeof d.text !== 'string') return state
      const kind = event.type.startsWith('session.text') ? 'text' : 'reasoning'
      const text = d.text
      return updateAssistant(state, messageID, (m) => ({ ...m, parts: updatePart(m.parts, textPart(kind, ordinal), () => ({ type: kind, text: '', ordinal }), (p) => ({ ...p, text })) }))
    }
    case 'session.tool.input.started': {
      if (!messageID) return state
      const id = d.id as string
      return updateAssistant(state, messageID, (m) => ({ ...m, parts: updatePart(m.parts, toolPart(id), () => ({ type: 'tool', id, name: d.name as string, done: false }), (p) => p) }))
    }
    case 'session.tool.input.ended':
    case 'session.tool.called': {
      if (!messageID) return state
      const id = d.id as string
      return updateAssistant(state, messageID, (m) => ({
        ...m,
        parts: updatePart(
          m.parts,
          toolPart(id),
          () => ({ type: 'tool', id, name: (d.name as string) ?? 'tool', done: false }),
          (p) => (event.type === 'session.tool.called' ? { ...p, input: d.input } : { ...p, inputText: d.text as string }),
        ),
      }))
    }
    case 'session.tool.success':
    case 'session.tool.error':
    case 'session.tool.failed': {
      if (!messageID) return state
      const id = d.id as string
      const failed = event.type !== 'session.tool.success'
      return updateAssistant(state, messageID, (m) => ({
        ...m,
        parts: updatePart(
          m.parts,
          toolPart(id),
          () => ({ type: 'tool', id, name: 'tool', done: false }),
          (p) => ({
            ...p,
            done: true,
            result: failed ? p.result : toolText(d.content as { type: string; text?: unknown }[]),
            metadata: failed ? p.metadata : (d.metadata as Record<string, unknown> | undefined),
            error: failed ? errorText(d.error as StructuredError) ?? 'Tool failed' : undefined,
          }),
        ),
      }))
    }
    case 'session.step.ended': {
      if (!messageID) return state
      const error = d.error as StructuredError | undefined
      return updateAssistant(state, messageID, (m) => ({ ...m, done: true, notice: undefined, error: error?.message ?? m.error }))
    }
    case 'form.created': {
      const form = d.form as FormInfo
      return state.forms.some((f) => f.id === form.id) ? state : { ...state, forms: [...state.forms, form] }
    }
    case 'form.replied':
    case 'form.cancelled':
    case 'form.canceled':
    case 'form.expired':
      return { ...state, forms: state.forms.filter((f) => f.id !== d.id) }
    default:
      if (event.type.startsWith('session.execution.') && event.type !== 'session.execution.started') {
        // succeeded, failed, interrupted: the run is over, every open step with it
        const error = errorText(d.error as StructuredError | undefined)
        return {
          ...state,
          running: false,
          error: event.type === 'session.execution.failed' ? error ?? 'The agent stopped with an error' : undefined,
          messages: state.messages.map((m) => (m.role === 'assistant' && !m.done ? { ...m, done: true, notice: undefined } : m)),
          forms: [],
          permissions: [],
        }
      }
      return state
  }
}
