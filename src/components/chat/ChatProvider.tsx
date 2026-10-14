import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AssistantRuntimeProvider, useAui } from '@assistant-ui/react'
import { createOpencodeClient, useOpenCodeRuntime } from '@assistant-ui/react-opencode'
import { OPENCODE_PROXY_PATH, resolveBaseUrl, useOpenCodeStatus } from '@/lib/chat/opencode'
import { loadModelChoice, modelKey, parseProviders, saveModelChoice, type ModelOption, type ModelRef } from '@/lib/chat/models'
import { useAgentActivity } from '@/lib/chat/activity'
import { ChatContext, type ChatContextValue } from '@/lib/chat/chat-context'

/**
 * One OpenCode runtime for the whole app: the chat and the step pages share it,
 * so a page can start a step in the conversation next to it.
 */
export function ChatProvider({ baseUrl = OPENCODE_PROXY_PATH, children }: { baseUrl?: string; children: ReactNode }) {
  const url = resolveBaseUrl(baseUrl)
  // The runtime keeps its connection per client, so the client is created once per URL
  const [client] = useState(() => createOpencodeClient({ baseUrl: url }))
  const status = useOpenCodeStatus(url)
  const [options, setOptions] = useState<ModelOption[]>([])
  const [choice, setChoice] = useState<ModelRef | undefined>(loadModelChoice)
  // A remembered model the server no longer offers is ignored (until the list is loaded we trust it)
  const model =
    options.length === 0 || (choice && options.some((o) => modelKey(o) === modelKey(choice))) ? choice : undefined
  // Sent with every prompt; undefined lets OpenCode use the model from opencode.json
  const runtime = useOpenCodeRuntime({ client, defaultModel: model })

  // The models come from the server, so the list always matches opencode.json
  useEffect(() => {
    if (status !== 'online') return
    let cancelled = false
    client.config
      .providers()
      .then((res) => {
        if (!cancelled) setOptions(parseProviders(res.data))
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
      <Bridge state={{ status, options, model, setModel }}>{children}</Bridge>
    </AssistantRuntimeProvider>
  )
}

function Bridge({ state, children }: { state: Omit<ChatContextValue, 'send' | 'activity'>; children: ReactNode }) {
  const aui = useAui()
  const activity = useAgentActivity()
  const send = useCallback((text: string) => aui.thread().append(text), [aui])
  const value = useMemo(() => ({ ...state, activity, send }), [activity, state.status, state.options, state.model, state.setModel, send]) // eslint-disable-line react-hooks/exhaustive-deps
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
