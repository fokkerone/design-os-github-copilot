import { CopyButton } from '@/components/CopyButton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  HARNESSES,
  buildPrompt,
  harnessLabel,
  isHarness,
  stepInvocation,
  useHarness,
  type Harness,
  type StepId,
} from '@/lib/harness'

const RUN_LABEL: Record<Harness, string> = {
  copilot: 'Select Copilot agent:',
  claude: 'Run Claude Code command:',
  opencode: 'Run OpenCode command:',
}

/** Choose the tool the planning steps are run with. The choice is remembered in localStorage. */
export function HarnessSelect({ className = '' }: { className?: string }) {
  const [harness, setHarness] = useHarness()

  return (
    <Select
      value={harness}
      onValueChange={(value) => {
        if (isHarness(value)) setHarness(value)
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label="Tool to run the planning steps with"
        title="Tool to run the planning steps with. Your choice is remembered."
        className={`h-6 gap-1.5 border-stone-200 bg-white px-2 py-0 text-xs text-stone-700 shadow-none data-[size=sm]:h-6 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 ${className}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" position="popper">
        {HARNESSES.map((entry) => (
          <SelectItem key={entry.id} value={entry.id} className="text-xs">
            {entry.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** The agent or command of a step for the selected tool, as inline code */
export function StepName({ step }: { step: StepId }) {
  const [harness] = useHarness()
  return <code className="font-mono text-stone-700 dark:text-stone-300">{stepInvocation(step, harness)}</code>
}

interface AgentPromptProps {
  step: StepId
  /** What to say after starting the step. Copied together with the command. */
  prompt: string
  /** Tighter padding, for use inside empty states */
  compact?: boolean
}

/** Which agent or command to start and what to say, for the selected tool, with a copy button */
export function AgentPrompt({ step, prompt, compact = false }: AgentPromptProps) {
  const [harness] = useHarness()

  return (
    <div
      className={`w-full space-y-2 rounded-md bg-stone-100 px-4 text-left dark:bg-stone-800 ${compact ? 'py-2.5' : 'py-3'}`}
    >
      <div>
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <p className="text-xs text-stone-500 dark:text-stone-400">{RUN_LABEL[harness]}</p>
          <HarnessSelect />
        </div>
        <code className="text-sm font-mono text-stone-700 dark:text-stone-300">{stepInvocation(step, harness)}</code>
      </div>
      <div className="border-t border-stone-200 pt-2 dark:border-stone-700">
        <div className="mb-0.5 flex items-center justify-between">
          <p className="text-xs text-stone-500 dark:text-stone-400">Then say:</p>
          <CopyButton
            text={buildPrompt(step, harness, prompt)}
            title={`Copy the ${harnessLabel(harness)} command together with the prompt`}
          />
        </div>
        <p className="text-sm italic text-stone-600 dark:text-stone-300">"{prompt}"</p>
      </div>
    </div>
  )
}
