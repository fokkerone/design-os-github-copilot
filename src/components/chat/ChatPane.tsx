import { ArrowUp, Bot, MousePointerClick, Square, X } from 'lucide-react'
import {
  AuiIf,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePartPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
} from '@assistant-ui/react'
import { expandSlashCommand } from '@/lib/harness'
import { useLiveEdit } from '@/lib/live-edit/live-edit-context'
import { buildLiveEditMessage, parseLiveEditMessage, selectionLabel, shortSource } from '@/lib/live-edit/selection'
import { parseCommentMessage } from '@/lib/comments/message'
import { ACTIVITY_LABEL, useAgentActivity } from '@/lib/chat/activity'
import { ChatMarkdown } from './ChatMarkdown'
import { ToolCall } from './ToolCall'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus'
const muted = 'text-muted-foreground'

/**
 * The agent chat: thread and composer, styled like the reference app.
 * Needs an AssistantRuntimeProvider above it, the runtime decides who answers.
 */
export function ChatPane({ composerExtras }: { composerExtras?: React.ReactNode }) {
  return (
    <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col text-foreground">
      <ThreadPrimitive.Viewport className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] space-y-5 px-4 py-6 sm:px-6">
          <AuiIf condition={(s) => s.thread.isEmpty}>
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-muted">
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
      <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-muted px-3.5 py-2 text-[14px] leading-relaxed">
        <MessagePrimitive.Parts>
          {({ part }) => (part.type === 'text' ? <UserText /> : null)}
        </MessagePrimitive.Parts>
      </div>
    </MessagePrimitive.Root>
  )
}

/** A Live Edit request shows as a chip plus the request, the context block stays folded */
function UserText() {
  const text = useAuiState((s) => ('text' in s.part ? (s.part.text as string) : ''))
  const live = parseLiveEditMessage(text)
  const comment = live ? null : parseCommentMessage(text)
  if (comment) {
    return (
      <>
        <details className="mb-1.5 text-[12px]">
          <summary className={`flex cursor-pointer list-none items-center gap-1.5 ${muted}`}>
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground" aria-hidden>
              {comment.number}
            </span>
            <span className="font-medium text-foreground">{comment.element}</span>
            {comment.command && <span className="font-mono">/impeccable {comment.command}</span>}
          </summary>
          <pre className="mt-1.5 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-card p-2 font-mono text-[11px]">{comment.context}</pre>
        </details>
        {comment.text}
      </>
    )
  }
  if (!live) return <MessagePartPrimitive.Text />
  return (
    <>
      <details className="mb-1.5 text-[12px]">
        <summary className={`flex cursor-pointer list-none items-center gap-1.5 ${muted}`}>
          <MousePointerClick className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="font-medium text-foreground">{live.label}</span>
          <span className="truncate font-mono">{live.source}</span>
          {live.edits > 0 && <span>· {live.edits} edit{live.edits === 1 ? '' : 's'}</span>}
        </summary>
        <pre className="mt-1.5 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-card p-2 font-mono text-[11px]">{live.context}</pre>
      </details>
      {live.request}
    </>
  )
}

function AssistantMessage() {
  const live = useAuiState((s) => s.message.isLast)
  const activity = useAgentActivity()
  const working = live && activity !== 'idle'
  return (
    <MessagePrimitive.Root className="flex gap-3">
      <span
        data-working={working ? 'true' : undefined}
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted"
        aria-hidden
      >
        <Bot className={`size-3.5 ${working ? 'animate-pulse text-primary' : muted}`} />
      </span>
      <div className="min-w-0 flex-1">
        <MessagePrimitive.Parts>
          {({ part }) => {
            if (part.type === 'text') return <AssistantText />
            if (part.type === 'tool-call') return part.toolUI ?? <ToolCall {...part} />
            return null
          }}
        </MessagePrimitive.Parts>
        {working && <ActivityNote activity={activity} />}
        <MessagePrimitive.Error>
          <ErrorPrimitive.Root
            role="alert"
            className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive"
          >
            <ErrorPrimitive.Message />
          </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
      </div>
    </MessagePrimitive.Root>
  )
}

function ActivityNote({ activity }: { activity: 'working' | 'waiting' | 'idle' }) {
  return (
    <p role="status" aria-label={ACTIVITY_LABEL[activity]} className={`mt-1 flex items-center gap-1.5 text-[12px] ${muted}`}>
      <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
      {ACTIVITY_LABEL[activity]}…
    </p>
  )
}

function AssistantText() {
  const text = useAuiState((s) => ('text' in s.part ? (s.part.text as string) : ''))
  return <ChatMarkdown text={text} />
}

function Composer({ extras }: { extras?: React.ReactNode }) {
  const aui = useAui()
  const live = useLiveEdit()
  const picked = live?.selection && !live.sent ? live.selection : null
  return (
    <ComposerPrimitive.Root
      // OpenCode does not parse slash commands from a prompt: expand them into the step instruction first
      onSubmit={() => {
        const text = aui.composer().getState().text
        const expanded = expandSlashCommand(text)
        // A picked element turns the message into a Live Edit request with the element as context
        if (picked && expanded === text) {
          aui.composer().setText(buildLiveEditMessage(picked, text))
          live?.markSent()
        } else if (expanded !== text) aui.composer().setText(expanded)
      }}
      className="rounded-lg border border-border bg-card px-3.5 pb-2.5 pt-3 transition-colors focus-within:border-border">
      {picked && (
        <div className="mb-2 flex items-center gap-1.5">
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-primary py-0.5 pl-2 pr-1 text-[12px] text-primary-foreground">
            <MousePointerClick className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="font-medium">{selectionLabel(picked)}</span>
            {picked.edits.length > 0 && <span className="opacity-80">· {picked.edits.length}</span>}
            <button
              type="button"
              aria-label="Remove selected element"
              onClick={() => live?.select(null)}
              className={`flex size-4 items-center justify-center rounded-full hover:bg-black/15 ${focusRing}`}
            >
              <X className="size-3" strokeWidth={2} />
            </button>
          </span>
          <span className={`truncate font-mono text-[11px] ${muted}`} title={picked.element.src}>
            {shortSource(picked.element.src)}
          </span>
        </div>
      )}
      <ComposerPrimitive.Input
        aria-label="Message the agent"
        placeholder={picked ? 'Describe the change…' : 'Reply to the agent…'}
        rows={1}
        className="block max-h-40 min-h-6 w-full resize-none bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-1">
        {extras}
        <span className="ml-auto" />
        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send
            aria-label="Send"
            className={`flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground ${focusRing}`}
          >
            <ArrowUp className="size-4" strokeWidth={2.25} />
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel
            aria-label="Stop"
            className={`flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 ${focusRing}`}
          >
            <Square className="size-3 fill-current" />
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
    </ComposerPrimitive.Root>
  )
}
