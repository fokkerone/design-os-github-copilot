import { describe, expect, it } from 'vitest'
import type { FormInfo, ServerEvent } from '@/lib/chat/v2/api'
import { applyEvent, emptyThread, fromHistory, type ThreadState } from '@/lib/chat/v2/thread'
import { approvalAction, toThreadMessages } from '@/lib/chat/v2/convert'

// Event shapes as recorded from opencode serve 2.1.2 (ids shortened, location/durable dropped)
const S = 'ses_1'
const ev = (type: string, data: Record<string, unknown>): ServerEvent => ({ id: `evt_${type}`, type, data: { sessionID: S, ...data } })

const form: FormInfo = {
  id: 'frm_1',
  sessionID: S,
  title: 'Questions',
  metadata: { kind: 'question', tool: { messageID: 'msg_a1', id: 'toolu_1' } },
  fields: [
    {
      key: 'q0',
      title: 'Color choice',
      description: 'Choose a color:',
      type: 'string',
      options: [
        { value: 'Red', label: 'Red', description: 'Choose Red' },
        { value: 'Blue', label: 'Blue', description: 'Choose Blue' },
      ],
      custom: true,
    },
  ],
}

const run = (events: ServerEvent[], state: ThreadState = emptyThread(S)) => events.reduce(applyEvent, state)

const textReply = [
  ev('session.inbox.enqueued', { inboxID: 'msg_u1', item: { type: 'user', payload: { text: 'Reply with pong' }, delivery: 'steer' } }),
  ev('session.execution.started', {}),
  ev('session.step.started', { agent: 'build', assistantMessageID: 'msg_a1' }),
  ev('session.text.started', { assistantMessageID: 'msg_a1', ordinal: 0 }),
  ev('session.text.delta', { assistantMessageID: 'msg_a1', ordinal: 0, delta: 'po' }),
  ev('session.text.delta', { assistantMessageID: 'msg_a1', ordinal: 0, delta: 'ng' }),
]

describe('thread from events', () => {
  it('streams a text answer and ends the run', () => {
    const streaming = run(textReply)
    expect(streaming.running).toBe(true)
    expect(streaming.messages).toEqual([
      { role: 'user', id: 'msg_u1', text: 'Reply with pong' },
      { role: 'assistant', id: 'msg_a1', parts: [{ type: 'text', text: 'pong', ordinal: 0 }], done: false, notice: undefined },
    ])
    const done = run([
      ev('session.text.ended', { assistantMessageID: 'msg_a1', ordinal: 0, text: 'pong!' }),
      ev('session.step.ended', { assistantMessageID: 'msg_a1', finish: 'stop' }),
      ev('session.execution.succeeded', {}),
    ], streaming)
    expect(done.running).toBe(false)
    expect(done.messages[1]).toMatchObject({ done: true, parts: [{ type: 'text', text: 'pong!' }] })
  })

  it('keeps a user message it already shows (sent with its own id)', () => {
    const state = { ...emptyThread(S), messages: [{ role: 'user' as const, id: 'msg_u1', text: 'Reply with pong' }] }
    expect(run(textReply.slice(0, 1), state).messages).toHaveLength(1)
  })

  it('ignores events of other sessions', () => {
    const other = { ...textReply[0], data: { ...textReply[0].data, sessionID: 'ses_other' } }
    expect(applyEvent(emptyThread(S), other).messages).toEqual([])
  })

  it('shows a provider retry while it waits, and an error when the run fails', () => {
    const retry = run([
      ev('session.step.started', { assistantMessageID: 'msg_a1' }),
      ev('session.retry.scheduled', { assistantMessageID: 'msg_a1', attempt: 2, error: { type: 'provider.internal', message: 'Endpoint is unavailable.' } }),
    ])
    expect(retry.messages[0]).toMatchObject({ notice: 'Retrying (attempt 2): Endpoint is unavailable.' })
    const failed = applyEvent(retry, ev('session.execution.failed', { error: { type: 'provider.internal', message: 'gave up' } }))
    expect(failed).toMatchObject({ running: false, error: 'gave up' })
  })

  it('follows a tool call from input to result', () => {
    const state = run([
      ev('session.step.started', { assistantMessageID: 'msg_a1' }),
      ev('session.tool.input.started', { assistantMessageID: 'msg_a1', id: 'toolu_1', name: 'question' }),
      ev('session.tool.input.ended', { assistantMessageID: 'msg_a1', id: 'toolu_1', text: '{"questions":[]}' }),
      ev('session.tool.called', { assistantMessageID: 'msg_a1', id: 'toolu_1', input: { questions: [{ question: 'Choose a color:', header: 'Color choice', options: [{ label: 'Red' }, { label: 'Blue' }] }] } }),
    ])
    expect(state.messages[0]).toMatchObject({ parts: [{ type: 'tool', id: 'toolu_1', name: 'question', done: false, inputText: '{"questions":[]}' }] })
    const done = run([
      ev('session.tool.success', { assistantMessageID: 'msg_a1', id: 'toolu_1', content: [{ type: 'text', text: 'User has answered' }], metadata: { answers: [['Blue']] } }),
    ], state)
    expect(done.messages[0]).toMatchObject({ parts: [{ done: true, result: 'User has answered', metadata: { answers: [['Blue']] } }] })
  })

  it('tracks open forms: created with the form, gone once replied', () => {
    const asked = applyEvent(emptyThread(S), { id: 'e', type: 'form.created', data: { form } as never })
    expect(asked.forms).toEqual([form])
    expect(applyEvent(asked, ev('form.replied', { id: 'frm_1', answer: { q0: 'Blue' } })).forms).toEqual([])
  })
})

describe('thread from history', () => {
  it('rebuilds user, text and tool messages and skips idle markers', () => {
    const state = fromHistory(S, [
      { id: 'msg_u1', type: 'user', text: 'hi', time: { created: 1 } },
      { id: 'msg_a1', type: 'assistant', content: [{ type: 'text', text: 'pong' }], time: { created: 2 } },
      { id: 'msg_a2', type: 'assistant', content: [{ type: 'tool', id: 'toolu_1', name: 'question', state: { status: 'completed', input: {}, content: [{ type: 'text', text: 'answered' }], metadata: { answers: [['Blue']] } } }], time: { created: 3 } },
      { id: 'msg_i', type: 'idle', outcome: 'succeeded' },
    ])
    expect(state.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'assistant'])
    expect(state.messages[2]).toMatchObject({ parts: [{ type: 'tool', done: true, result: 'answered' }] })
  })
})

describe('messages for assistant-ui', () => {
  const asking = run([
    ev('session.execution.started', {}),
    ev('session.step.started', { assistantMessageID: 'msg_a1' }),
    ev('session.tool.called', { assistantMessageID: 'msg_a1', id: 'toolu_1', input: {} }),
  ])

  it('puts an open form on its tool call as questions and marks the message as waiting', () => {
    const [message] = toThreadMessages({ ...asking, forms: [form] })
    expect(message.status).toEqual({ type: 'requires-action', reason: 'tool-calls' })
    const part = (message.content as { approval?: unknown }[])[0]
    expect(part.approval).toEqual({
      id: 'form:frm_1',
      display: 'questions',
      dismissible: true,
      questions: [
        {
          id: 'q0',
          prompt: 'Choose a color:',
          header: 'Color choice',
          multiple: false,
          allowFreeform: true,
          options: [
            { id: 'Red', label: 'Red', description: 'Choose Red' },
            { id: 'Blue', label: 'Blue', description: 'Choose Blue' },
          ],
        },
      ],
    })
  })

  it('shows a form without a known tool call at the end of the thread', () => {
    const loose = { ...form, metadata: {} }
    const messages = toThreadMessages({ ...emptyThread(S), forms: [loose] })
    expect(messages).toHaveLength(1)
    expect((messages[0].content as { toolName: string }[])[0].toolName).toBe('question')
  })

  it('shows an answered question with its answers', () => {
    const answered = run([
      ev('session.tool.success', { assistantMessageID: 'msg_a1', id: 'toolu_1', content: [{ type: 'text', text: 'ok' }], metadata: { answers: [['Blue']] } }),
    ], {
      ...asking,
      messages: [{ role: 'assistant', id: 'msg_a1', done: false, parts: [{ type: 'tool', id: 'toolu_1', name: 'question', done: false, input: { questions: [{ question: 'Choose a color:', options: [{ label: 'Red' }, { label: 'Blue' }] }] } }] }],
    })
    const part = (toThreadMessages(answered)[0].content as { approval?: { answers?: unknown; approved?: boolean } }[])[0]
    expect(part.approval).toMatchObject({ approved: true, answers: { q0: { optionIds: ['Blue'] } } })
  })

  it('reports a failed run as an error message', () => {
    const messages = toThreadMessages({ ...emptyThread(S), error: 'gave up' })
    expect(messages.at(-1)?.status).toEqual({ type: 'incomplete', reason: 'error', error: 'gave up' })
  })
})

describe('answers for the server', () => {
  it('turns question answers into a form reply, a list for multiselect fields', () => {
    const multi: FormInfo = { ...form, fields: [{ ...form.fields[0], type: 'multiselect' }] }
    expect(approvalAction({ approvalId: 'form:frm_1', approved: true, answers: { q0: { optionIds: ['Blue'] } } }, [form])).toEqual({
      kind: 'form-reply',
      formID: 'frm_1',
      answer: { q0: 'Blue' },
    })
    expect(approvalAction({ approvalId: 'form:frm_1', approved: true, answers: { q0: { optionIds: ['Red'], text: 'Green' } } }, [multi])).toEqual({
      kind: 'form-reply',
      formID: 'frm_1',
      answer: { q0: ['Red', 'Green'] },
    })
    expect(approvalAction({ approvalId: 'form:frm_1', approved: true, answers: { q0: { text: ' Teal ' } } }, [form]).kind === 'form-reply').toBe(true)
  })

  it('cancels a skipped form and maps permission decisions', () => {
    expect(approvalAction({ approvalId: 'form:frm_1', approved: false }, [form])).toEqual({ kind: 'form-cancel', formID: 'frm_1' })
    expect(approvalAction({ approvalId: 'permission:per_1', approved: true, optionId: 'always' }, [])).toEqual({ kind: 'permission', requestID: 'per_1', decision: 'always' })
    expect(approvalAction({ approvalId: 'permission:per_1', approved: false }, [])).toEqual({ kind: 'permission', requestID: 'per_1', decision: 'reject' })
  })
})
