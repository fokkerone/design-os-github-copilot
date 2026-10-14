import { SquarePen } from 'lucide-react'
import { useAui } from '@assistant-ui/react'
import { ChatProvider } from './ChatProvider'
import { ChatPane } from './ChatPane'
import { ModelPicker } from './ModelPicker'
import { OPENCODE_START_COMMAND } from '@/lib/chat/opencode'
import { useChat } from '@/lib/chat/chat-context'

/** The chat of the current ChatProvider: connection banner, thread, composer and model choice */
export function ChatPanel() {
  const chat = useChat()
  const aui = useAui()
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
          <>
            <button
              type="button"
              aria-label="New chat"
              title="New chat"
              onClick={() => aui.threads().switchToNewThread()}
              className="flex size-7 items-center justify-center rounded-sm text-stone-500 transition-colors hover:bg-rwe-sand-500 hover:text-rwe-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus dark:text-rwe-neutral-400 dark:hover:bg-rwe-neutral-800 dark:hover:text-rwe-neutral-50"
            >
              <SquarePen className="size-4" strokeWidth={1.75} />
            </button>
            {chat.options.length > 0 && <ModelPicker options={chat.options} value={chat.model} onChange={chat.setModel} />}
          </>
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
