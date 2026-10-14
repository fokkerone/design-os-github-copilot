import { ArrowUp, Bot, Square } from 'lucide-react'
import {
  AuiIf,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePartPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
} from '@assistant-ui/react'
import { ChatMarkdown } from './ChatMarkdown'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus'
const muted = 'text-stone-500 dark:text-rwe-neutral-400'

/**
 * The agent chat: thread and composer, styled like the reference app.
 * Needs an AssistantRuntimeProvider above it, the runtime decides who answers.
 */
export function ChatPane({ composerExtras }: { composerExtras?: React.ReactNode }) {
  return (
    <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col text-rwe-neutral-900 dark:text-rwe-neutral-100">
      <ThreadPrimitive.Viewport className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] space-y-5 px-4 py-6 sm:px-6">
          <AuiIf condition={(s) => s.thread.isEmpty}>
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-rwe-sand-500 dark:bg-rwe-neutral-800">
                <Bot className={`size-4 ${muted}`} />
              </div>
              <p className="text-[15px] font-medium">Ask the agent</p>
              <p className={`mt-1 text-[13px] ${muted}`}>Plan the product, design screens or change the pages next to this chat.</p>
            </div>
          </AuiIf>

          <ThreadPrimitive.Messages>
            {({ message }) => (message.role === 'user' ? <UserMessage /> : <AssistantMessage />)}
          </ThreadPrimitive.Messages>
        </div>
      </ThreadPrimitive.Viewport>

      <div className="shrink-0 px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-[720px]">
          <Composer extras={composerExtras} />
        </div>
      </div>
    </ThreadPrimitive.Root>
  )
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-rwe-sand-500 px-3.5 py-2 text-[14px] leading-relaxed dark:bg-rwe-neutral-800">
        <MessagePrimitive.Parts>
          {({ part }) => (part.type === 'text' ? <MessagePartPrimitive.Text /> : null)}
        </MessagePrimitive.Parts>
      </div>
    </MessagePrimitive.Root>
  )
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex gap-3">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-rwe-sand-500 dark:bg-rwe-neutral-800" aria-hidden>
        <Bot className={`size-3.5 ${muted}`} />
      </span>
      <div className="min-w-0 flex-1">
        <MessagePrimitive.Parts>
          {({ part }) => {
            if (part.type === 'text') return <AssistantText />
            if (part.type === 'tool-call') return part.toolUI ?? null
            return null
          }}
        </MessagePrimitive.Parts>
        <MessagePrimitive.Error>
          <ErrorPrimitive.Root
            role="alert"
            className="mt-2 rounded-md border border-rwe-red-200 bg-rwe-red-50 px-3 py-2 text-[13px] text-rwe-red-700 dark:border-rwe-red-800 dark:bg-rwe-red-900/20 dark:text-rwe-red-200"
          >
            <ErrorPrimitive.Message />
          </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
      </div>
    </MessagePrimitive.Root>
  )
}

function AssistantText() {
  const text = useAuiState((s) => ('text' in s.part ? (s.part.text as string) : ''))
  return <ChatMarkdown text={text} />
}

function Composer({ extras }: { extras?: React.ReactNode }) {
  return (
    <ComposerPrimitive.Root className="rounded-lg border border-stone-200 bg-rwe-sand-25 px-3.5 pb-2.5 pt-3 transition-colors focus-within:border-stone-300 dark:border-rwe-neutral-800 dark:bg-rwe-neutral-950/60 dark:focus-within:border-rwe-neutral-700">
      <ComposerPrimitive.Input
        aria-label="Message the agent"
        placeholder="Reply to the agent…"
        rows={1}
        className="block max-h-40 min-h-6 w-full resize-none bg-transparent text-[14px] text-rwe-neutral-900 placeholder:text-stone-500 focus:outline-none dark:text-rwe-neutral-50 dark:placeholder:text-rwe-neutral-500"
      />
      <div className="mt-2 flex items-center gap-1">
        {extras}
        <span className="ml-auto" />
        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send
            aria-label="Send"
            className={`flex size-7 items-center justify-center rounded-full bg-brand-blue-500 text-white transition-colors hover:bg-brand-blue-600 disabled:bg-rwe-sand-500 disabled:text-stone-400 dark:bg-energy-green-500 dark:text-brand-blue-900 dark:hover:bg-energy-green-400 dark:disabled:bg-rwe-neutral-800 dark:disabled:text-rwe-neutral-500 ${focusRing}`}
          >
            <ArrowUp className="size-4" strokeWidth={2.25} />
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel
            aria-label="Stop"
            className={`flex size-7 items-center justify-center rounded-full bg-rwe-neutral-800 text-white transition-colors hover:bg-rwe-neutral-700 dark:bg-rwe-neutral-100 dark:text-rwe-neutral-900 ${focusRing}`}
          >
            <Square className="size-3 fill-current" />
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
    </ComposerPrimitive.Root>
  )
}
