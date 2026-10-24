import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AssistantRuntimeProvider, useAui, useExternalStoreRuntime, type AppendMessage } from '@assistant-ui/react'
import { OPENCODE_PROXY_PATH, resolveBaseUrl, useOpenCodeStatus } from '@/lib/chat/opencode'
import { loadModelChoice, modelKey, parseModels, saveModelChoice, type ModelOption, type ModelRef } from '@/lib/chat/models'
import { loadSessionId, saveSessionId } from '@/lib/chat/session'
import { useAgentActivity } from '@/lib/chat/activity'
import { ChatContext, SHOW_CHAT_EVENT, type ChatContextValue } from '@/lib/chat/chat-context'
import { OpenCodeClient } from '@/lib/chat/v2/api'
import { toThreadMessages } from '@/lib/chat/v2/convert'
import { useOpenCodeSession } from '@/lib/chat/v2/use-session'
import { LiveEditContext } from '@/lib/live-edit/live-edit-context'
import { APPLY_EDITS_REQUEST, buildLiveEditMessage, RECORD_EDITS_REQUEST, type LiveEdit, type LiveSelection } from '@/lib/live-edit/selection'

const textOf = (message: AppendMessage) =>
  message.content.map((part) => (part.type === 'text' ? part.text : '')).join('')

/**
 * One OpenCode chat for the whole app: the chat and the step pages share it, so a page can start
 * a step in the conversation next to it. Talks to OpenCode 2.x through the dev server's proxy.
 */
export function ChatProvider({ baseUrl = OPENCODE_PROXY_PATH, children }: { baseUrl?: string; children: ReactNode }) {
  const url = resolveBaseUrl(baseUrl)
  const client = useMemo(() => new OpenCodeClient({ baseUrl: url }), [url])
  const status = useOpenCodeStatus(url)
  const [options, setOptions] = useState<ModelOption[]>([])
  const [choice, setChoice] = useState<ModelRef | undefined>(loadModelChoice)
  // A remembered model the server no longer offers is ignored (until the list is loaded we trust it)
  const model =
    options.length === 0 || (choice && options.some((o) => modelKey(o) === modelKey(choice))) ? choice : undefined
  // Read once: the session to reopen after a reload
  const [initialSessionId] = useState(loadSessionId)
  const session = useOpenCodeSession(client, {
    model: model ? { id: model.modelID, providerID: model.providerID } : undefined,
    initialSessionId,
    onSessionChange: saveSessionId,
    online: status === 'online',
  })
  const { state, send: sendText, cancel, respond, newChat } = session

  const messages = useMemo(() => toThreadMessages(state), [state])
  const runtime = useExternalStoreRuntime({
    messages,
    convertMessage: (m) => m,
    isRunning: state.running,
    onNew: async (message) => sendText(textOf(message)),
    onCancel: cancel,
    onRespondToToolApproval: respond,
  })

  // The models come from the server, so the list always matches the OpenCode config
  useEffect(() => {
    if (status !== 'online') return
    let cancelled = false
    client
      .models()
      .then((list) => {
        if (!cancelled) setOptions(parseModels(list))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [client, status])

  const setModel = useCallback((next: ModelRef | undefined) => {
    setChoice(next)
    saveModelChoice(next)
  }, [])

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Bridge state={{ status, options, model, setModel, newChat }}>{children}</Bridge>
    </AssistantRuntimeProvider>
  )
}

function Bridge({ state, children }: { state: Omit<ChatContextValue, 'send' | 'activity'>; children: ReactNode }) {
  const aui = useAui()
  const activity = useAgentActivity()
  const send = useCallback((text: string) => aui.thread().append(text), [aui])
  const value = { ...state, activity, send }
  return (
    <ChatContext.Provider value={value}>
      <LiveEditProvider>{children}</LiveEditProvider>
    </ChatContext.Provider>
  )
}

/** The element picked in a preview, between the page that picked it and the composer that sends it */
export function LiveEditProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<LiveSelection | null>(null)
  const [sent, setSent] = useState(false)
  const select = useCallback((next: LiveSelection | null) => {
    setSelection(next)
    setSent(false)
  }, [])
  const setEdits = useCallback((edits: LiveEdit[]) => setSelection((s) => (s ? { ...s, edits } : s)), [])
  const markSent = useCallback(() => setSent(true), [])
  const focusComposer = useCallback(() => {
    // The chat may be collapsed behind the expanded step panel: show it, then focus once it is visible
    window.dispatchEvent(new Event(SHOW_CHAT_EVENT))
    const focus = () => document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Message the agent"]')?.focus()
    focus()
    requestAnimationFrame(() => requestAnimationFrame(focus))
  }, [])
  const aui = useAui()
  const apply = useCallback(() => {
    if (!selection || sent) return
    window.dispatchEvent(new Event(SHOW_CHAT_EVENT))
    aui.thread().append(buildLiveEditMessage(selection, APPLY_EDITS_REQUEST))
    setSent(true)
  }, [aui, selection, sent])
  const record = useCallback(
    (edits: LiveEdit[]) => {
      if (!selection || edits.length === 0) return
      window.dispatchEvent(new Event(SHOW_CHAT_EVENT))
      // The source already has them: the selection stays a draft for further edits
      aui.thread().append(buildLiveEditMessage({ ...selection, edits }, RECORD_EDITS_REQUEST))
    },
    [aui, selection],
  )
  const sendMessage = useCallback(
    (text: string) => {
      window.dispatchEvent(new Event(SHOW_CHAT_EVENT))
      aui.thread().append(text)
    },
    [aui],
  )
  const value = useMemo(
    () => ({ selection, sent, select, setEdits, markSent, focusComposer, apply, record, sendMessage }),
    [selection, sent, select, setEdits, markSent, focusComposer, apply, record, sendMessage],
  )
  return <LiveEditContext.Provider value={value}>{children}</LiveEditContext.Provider>
}
