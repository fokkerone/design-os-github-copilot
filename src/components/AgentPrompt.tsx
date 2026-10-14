import { Play } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { buildPrompt, buildStepMessage, stepInvocation, type StepId } from '@/lib/harness'
import { useChat } from '@/lib/chat/chat-context'

/** The agent or command of a step for the selected tool, as inline code */
export function StepName({ step }: { step: StepId }) {
  return <code className="font-mono text-stone-700 dark:text-stone-300">{stepInvocation(step, 'opencode')}</code>
}

interface AgentPromptProps {
  step: StepId
  /** What to say after starting the step. Copied together with the command. */
  prompt: string
  /** Tighter padding, for use inside empty states */
  compact?: boolean
}

/** Starts a step with the chat agent, or shows the command to copy when there is no chat */
export function AgentPrompt({ step, prompt, compact = false }: AgentPromptProps) {
  const chat = useChat()

  return (
    <div
      className={`w-full space-y-2 rounded-md bg-stone-100 px-4 text-left dark:bg-stone-800 ${compact ? 'py-2.5' : 'py-3'}`}
    >
      <div>
        <p className="mb-0.5 text-xs text-stone-500 dark:text-stone-400">Agent command:</p>
        <code className="text-sm font-mono text-stone-700 dark:text-stone-300">{stepInvocation(step, 'opencode')}</code>
      </div>
      <div className="border-t border-stone-200 pt-2 dark:border-stone-700">
        <div className="mb-0.5 flex items-center justify-between">
          <p className="text-xs text-stone-500 dark:text-stone-400">Then say:</p>
          <CopyButton text={buildPrompt(step, 'opencode', prompt)} title="Copy the command together with the prompt" />
        </div>
        <p className="text-sm italic text-stone-600 dark:text-stone-300">"{prompt}"</p>
      </div>
      {chat && (
        <div className="border-t border-stone-200 pt-2 dark:border-stone-700">
          <button
            type="button"
            disabled={chat.status === 'offline'}
            onClick={() => chat.send(buildStepMessage(step, prompt))}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-brand-blue-500 px-3 text-[13px] font-medium text-white transition-colors hover:bg-brand-blue-600 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 dark:bg-energy-green-500 dark:text-brand-blue-900 dark:hover:bg-energy-green-400 dark:disabled:bg-rwe-neutral-800 dark:disabled:text-rwe-neutral-500"
          >
            <Play className="size-3.5" strokeWidth={2} />
            Start with agent
          </button>
          {chat.status === 'offline' && (
            <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">OpenCode is not running, see the chat.</p>
          )}
        </div>
      )}
    </div>
  )
}
