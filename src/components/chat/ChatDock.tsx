import { useEffect, useState } from 'react'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { createOpencodeClient, useOpenCodeRuntime } from '@assistant-ui/react-opencode'
import { OPENCODE_PROXY_PATH, OPENCODE_START_COMMAND, resolveBaseUrl, useOpenCodeStatus } from '@/lib/chat/opencode'
import { loadModelChoice, parseProviders, saveModelChoice, modelKey, type ModelOption, type ModelRef } from '@/lib/chat/models'
import { ChatPane } from './ChatPane'
import { ModelPicker } from './ModelPicker'

interface ChatDockProps {
  /** Where `opencode serve` is reachable. Defaults to the Vite proxy. */
  baseUrl?: string
}

/** The agent chat wired to OpenCode: runtime, connection state and the thread */
export function ChatDock({ baseUrl = OPENCODE_PROXY_PATH }: ChatDockProps) {
  const url = resolveBaseUrl(baseUrl)
  // The runtime keeps its connection per client, so the client is created once per URL
  const [client] = useState(() => createOpencodeClient({ baseUrl: url }))
  const status = useOpenCodeStatus(url)
  const [options, setOptions] = useState<ModelOption[]>([])
  const [choice, setChoice] = useState<ModelRef | undefined>(loadModelChoice)
  // A remembered model the server no longer offers is ignored (until the list is loaded we trust it)
  const effective = options.length === 0 || (choice && options.some((o) => modelKey(o) === modelKey(choice))) ? choice : undefined
  // Sent with every prompt; undefined lets OpenCode use the model from opencode.json
  const runtime = useOpenCodeRuntime({ client, defaultModel: effective })

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

  const change = (next: ModelRef | undefined) => {
    setChoice(next)
    saveModelChoice(next)
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {status === 'offline' && (
        <div
          role="status"
          className="mx-4 mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 sm:mx-6 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-100"
        >
          OpenCode is not running. Start it in the project folder:{' '}
          <code className="rounded-sm bg-black/5 px-1 py-0.5 dark:bg-white/10">{OPENCODE_START_COMMAND}</code>
        </div>
      )}
      <ChatPane composerExtras={options.length > 0 ? <ModelPicker options={options} value={effective} onChange={change} /> : null} />
    </AssistantRuntimeProvider>
  )
}
