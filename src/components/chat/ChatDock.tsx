import { ChatProvider } from './ChatProvider'
import { ChatPane } from './ChatPane'
import { ModelPicker } from './ModelPicker'
import { OPENCODE_START_COMMAND } from '@/lib/chat/opencode'
import { useChat } from '@/lib/chat/chat-context'

/** The chat of the current ChatProvider: connection banner, thread, composer and model choice */
export function ChatPanel() {
  const chat = useChat()
  if (!chat) return null
  return (
    <>
      {chat.status === 'offline' && (
        <div
          role="status"
          className="mx-4 mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 sm:mx-6 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-100"
        >
          OpenCode is not running. Start it in the project folder:{' '}
          <code className="rounded-sm bg-black/5 px-1 py-0.5 dark:bg-white/10">{OPENCODE_START_COMMAND}</code>
        </div>
      )}
      <ChatPane
        composerExtras={
          chat.options.length > 0 ? <ModelPicker options={chat.options} value={chat.model} onChange={chat.setModel} /> : null
        }
      />
    </>
  )
}

/** Standalone chat: its own provider plus the panel */
export function ChatDock({ baseUrl }: { baseUrl?: string }) {
  return (
    <ChatProvider baseUrl={baseUrl}>
      <ChatPanel />
    </ChatProvider>
  )
}
