import { useCallback, useEffect, useRef, useState } from 'react'
import type { RespondToToolApprovalOptions } from '@assistant-ui/react'
import { newMessageId, type ModelRef, type OpenCodeClient } from './api'
import { approvalAction } from './convert'
import { applyEvent, emptyThread, fromHistory, type ThreadState } from './thread'

const RECONNECT_MS = 1500

export interface SessionOptions {
  /** Sent when a session is created and when the user switches; undefined: the server's default */
  model: ModelRef | undefined
  /** The session to reopen (remembered across reloads) */
  initialSessionId: string | undefined
  onSessionChange: (id: string | undefined) => void
  /** Only connect while the server is up */
  online: boolean
}

/**
 * One OpenCode v2 session as chat state: reopens the remembered session, follows the server's
 * event stream (reconnecting and catching up after a drop) and sends prompts, interrupts and
 * answers to questions and permissions.
 */
export function useOpenCodeSession(client: OpenCodeClient, { model, initialSessionId, onSessionChange, online }: SessionOptions) {
  const [state, setState] = useState<ThreadState>(() => emptyThread(initialSessionId))
  const stateRef = useRef(state)
  const update = useCallback((next: (s: ThreadState) => ThreadState) => {
    setState((s) => {
      const n = next(s)
      stateRef.current = n
      return n
    })
  }, [])
  const sessionID = state.sessionID

  // The history of the session, plus its open questions and permissions
  const load = useCallback(
    async (id: string) => {
      try {
        const [history, forms, permissions] = await Promise.all([client.messages(id), client.forms(id), client.permissions(id).catch(() => [])])
        update((s) => (s.sessionID === id ? { ...fromHistory(id, history), forms, permissions, running: s.running } : s))
      } catch {
        // The remembered session is gone (other server, deleted): start fresh
        update((s) => (s.sessionID === id ? emptyThread() : s))
        onSessionChange(undefined)
      }
    },
    [client, update, onSessionChange],
  )

  // Events: one stream for the server, filtered to this session by the reducer
  useEffect(() => {
    if (!online) return
    const controller = new AbortController()
    const refetch = (kind: 'forms' | 'permissions') => {
      const id = stateRef.current.sessionID
      if (!id) return
      const request = kind === 'forms' ? client.forms(id) : client.permissions(id)
      request.then((list) => update((s) => (s.sessionID === id ? { ...s, [kind]: list } : s))).catch(() => {})
    }
    const run = async () => {
      while (!controller.signal.aborted) {
        try {
          await client.events((event) => {
            if (event.type === 'server.connected') {
              // Every (re)connect may have missed events, a question among them: load the session from the server
              const id = stateRef.current.sessionID
              if (id) void load(id)
              return
            }
            update((s) => applyEvent(s, event))
            if (event.type.startsWith('permission.')) refetch('permissions')
            else if (event.type.startsWith('form.') && event.type !== 'form.created') refetch('forms')
          }, controller.signal)
        } catch {
          /* dropped: reconnect below */
        }
        if (!controller.signal.aborted) await new Promise((r) => setTimeout(r, RECONNECT_MS))
      }
    }
    void run()
    return () => controller.abort()
  }, [client, online, update, load])

  // Model choice: a running session switches, a new one is created with it
  const modelKey = model ? `${model.providerID}/${model.id}` : ''
  const lastModel = useRef(modelKey)
  useEffect(() => {
    if (lastModel.current === modelKey) return
    lastModel.current = modelKey
    if (sessionID && model) void client.switchModel(sessionID, model).catch(() => {})
  }, [client, sessionID, model, modelKey])

  const send = useCallback(
    async (text: string) => {
      let id = stateRef.current.sessionID
      try {
        if (!id) {
          id = (await client.createSession(model)).id
          const created = id
          update((s) => ({ ...s, sessionID: created }))
          onSessionChange(id)
        }
        const messageID = newMessageId()
        update((s) => ({ ...s, running: true, error: undefined, messages: [...s.messages, { role: 'user', id: messageID, text }] }))
        await client.prompt(id, text, messageID)
      } catch (e) {
        update((s) => ({ ...s, running: false, error: e instanceof Error ? e.message : String(e) }))
      }
    },
    [client, model, update, onSessionChange],
  )

  const cancel = useCallback(async () => {
    const id = stateRef.current.sessionID
    if (id) await client.interrupt(id).catch(() => {})
  }, [client])

  const respond = useCallback(
    async (options: RespondToToolApprovalOptions) => {
      const id = stateRef.current.sessionID
      if (!id) return
      const action = approvalAction(options, stateRef.current.forms)
      try {
        if (action.kind === 'form-reply') {
          await client.replyForm(id, action.formID, action.answer)
          update((s) => ({ ...s, forms: s.forms.filter((f) => f.id !== action.formID) }))
        } else if (action.kind === 'form-cancel') {
          await client.cancelForm(id, action.formID)
          update((s) => ({ ...s, forms: s.forms.filter((f) => f.id !== action.formID) }))
        } else if (action.kind === 'permission') {
          await client.replyPermission(id, action.requestID, action.decision)
          update((s) => ({ ...s, permissions: s.permissions.filter((p) => p.id !== action.requestID) }))
        }
      } catch (e) {
        update((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) }))
      }
    },
    [client, update],
  )

  const newChat = useCallback(() => {
    update(() => emptyThread())
    onSessionChange(undefined)
  }, [update, onSessionChange])

  return { state, send, cancel, respond, newChat }
}
