/**
 * The v2 thread in assistant-ui's message format. Questions (forms) and permissions become
 * `approval`s on tool-call parts, so the chat renders them with the same ToolCall component.
 */
import type { RespondToToolApprovalOptions, ThreadMessageLike, ToolApprovalQuestion, ToolCallMessagePart } from '@assistant-ui/react'
import type { FormAnswer, FormInfo, PermissionDecision, PermissionRequest } from './api'
import type { ChatMessage, ThreadState, ToolPart } from './thread'

type Approval = NonNullable<ToolCallMessagePart['approval']>
type Part = Exclude<ThreadMessageLike['content'], string>[number]

const FORM = 'form:'
const PERMISSION = 'permission:'

function formQuestions(form: FormInfo): ToolApprovalQuestion[] {
  return form.fields
    .filter((f) => !f.hidden)
    .map((f) => ({
      id: f.key,
      prompt: f.description || f.title || form.title,
      header: f.description ? f.title : undefined,
      options: f.options?.map((o) => ({ id: o.value, label: o.label ?? o.value, description: o.description })),
      multiple: f.type === 'multiselect',
      allowFreeform: f.custom ?? !f.options?.length,
    }))
}

const formApproval = (form: FormInfo): Approval => ({ id: `${FORM}${form.id}`, display: 'questions', questions: formQuestions(form), dismissible: true })

const permissionApproval = (p: PermissionRequest): Approval => ({
  id: `${PERMISSION}${p.id}`,
  prompt: p.message,
  options: [
    { id: 'once', kind: 'allow-once', label: 'Allow once' },
    { id: 'always', kind: 'allow-always', label: 'Always allow', grants: p.resources },
    { id: 'reject', kind: 'reject-once', label: 'Deny' },
  ],
})

/** A `question` call that is answered: its questions from the input, the answers from the metadata */
function answeredQuestions(tool: ToolPart): Approval | undefined {
  const input = tool.input as { questions?: { question: string; header?: string; multiple?: boolean; options?: { label: string; description?: string }[] }[] } | undefined
  if (tool.name !== 'question' || !input?.questions?.length) return undefined
  const given = (tool.metadata?.answers as string[][] | undefined) ?? []
  const questions = input.questions.map((q, i) => ({
    id: `q${i}`,
    prompt: q.question,
    header: q.header,
    multiple: q.multiple,
    options: q.options?.map((o) => ({ id: o.label, label: o.label, description: o.description })),
  }))
  const answers = Object.fromEntries(questions.map((q, i) => [q.id, { optionIds: given[i] ?? [] }]))
  return { id: `answered:${tool.id}`, display: 'questions', questions, approved: tool.done && !tool.error, answers, resolution: tool.done && !given.length ? 'cancelled' : undefined }
}

function toolCall(tool: ToolPart, approval: Approval | undefined): Part {
  const args = tool.input && typeof tool.input === 'object' ? (tool.input as Record<string, never>) : undefined
  return {
    type: 'tool-call',
    toolCallId: tool.id,
    toolName: tool.name,
    ...(args ? { args } : { argsText: tool.inputText ?? '' }),
    result: tool.done ? (tool.error ?? tool.result ?? '') : undefined,
    isError: !!tool.error,
    ...(approval ? { approval } : {}),
  }
}

/** Messages for the external store runtime */
export function toThreadMessages(state: ThreadState): ThreadMessageLike[] {
  // Each pending request goes to its tool call; one without (or with an unknown) tool is shown at the end
  const pending = new Map<string, Approval>()
  const loose: { id: string; name: string; approval: Approval; args?: Record<string, never> }[] = []
  const toolIds = new Set(state.messages.flatMap((m) => (m.role === 'assistant' ? m.parts.filter((p) => p.type === 'tool').map((p) => (p as ToolPart).id) : [])))
  for (const form of state.forms) {
    const tool = form.metadata?.tool?.id
    if (tool && toolIds.has(tool)) pending.set(tool, formApproval(form))
    else loose.push({ id: `${FORM}${form.id}`, name: 'question', approval: formApproval(form) })
  }
  for (const p of state.permissions) {
    const tool = p.metadata?.tool?.id
    if (tool && toolIds.has(tool)) pending.set(tool, permissionApproval(p))
    else loose.push({ id: `${PERMISSION}${p.id}`, name: p.action, approval: permissionApproval(p), args: { resources: p.resources } as unknown as Record<string, never> })
  }
  const waiting = pending.size > 0 || loose.length > 0

  const out: ThreadMessageLike[] = state.messages.map((m: ChatMessage, index) => {
    if (m.role === 'user') return { role: 'user', id: m.id, content: [{ type: 'text', text: m.text }] }
    const content: Part[] = m.parts.map((p) =>
      p.type === 'tool' ? toolCall(p, pending.get(p.id) ?? answeredQuestions(p)) : { type: p.type, text: p.text },
    )
    if (m.notice && !m.done) content.push({ type: 'reasoning', text: m.notice })
    const last = index === state.messages.length - 1
    const status: ThreadMessageLike['status'] = m.error
      ? { type: 'incomplete', reason: 'error', error: m.error }
      : last && waiting
        ? { type: 'requires-action', reason: 'tool-calls' }
        : m.done || !state.running
          ? { type: 'complete', reason: 'stop' }
          : { type: 'running' }
    return { role: 'assistant', id: m.id, content, status }
  })

  if (loose.length) {
    const parts: Part[] = loose.map((l) => ({ type: 'tool-call', toolCallId: l.id, toolName: l.name, args: l.args ?? {}, approval: l.approval }))
    const last = out.at(-1)
    if (last?.role === 'assistant') out[out.length - 1] = { ...last, content: [...(last.content as Part[]), ...parts], status: { type: 'requires-action', reason: 'tool-calls' } }
    else out.push({ role: 'assistant', id: 'pending-requests', content: parts, status: { type: 'requires-action', reason: 'tool-calls' } })
  }
  if (state.error) out.push({ role: 'assistant', id: 'run-error', content: [], status: { type: 'incomplete', reason: 'error', error: state.error } })
  return out
}

/** What an approval response means for the server */
export type ApprovalAction =
  | { kind: 'form-reply'; formID: string; answer: FormAnswer }
  | { kind: 'form-cancel'; formID: string }
  | { kind: 'permission'; requestID: string; decision: PermissionDecision }
  | { kind: 'none' }

export function approvalAction(options: RespondToToolApprovalOptions, forms: FormInfo[]): ApprovalAction {
  const { approvalId } = options
  if (approvalId.startsWith(FORM)) {
    const formID = approvalId.slice(FORM.length)
    if (!options.answers) return { kind: 'form-cancel', formID }
    const form = forms.find((f) => f.id === formID)
    const answer: FormAnswer = {}
    for (const [key, a] of Object.entries(options.answers)) {
      const values = [...(a.optionIds ?? []), ...(a.text?.trim() ? [a.text.trim()] : [])]
      const multiple = form?.fields.find((f) => f.key === key)?.type === 'multiselect'
      if (values.length) answer[key] = multiple ? values : values[0]
    }
    return { kind: 'form-reply', formID, answer }
  }
  if (approvalId.startsWith(PERMISSION)) {
    const id = options.optionId
    const decision: PermissionDecision = id === 'once' || id === 'always' || id === 'reject' ? id : options.approved ? 'once' : 'reject'
    return { kind: 'permission', requestID: approvalId.slice(PERMISSION.length), decision }
  }
  return { kind: 'none' }
}
