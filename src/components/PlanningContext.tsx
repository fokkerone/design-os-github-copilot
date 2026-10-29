import { Link } from 'react-router-dom'
import { AlertTriangle, CircleDashed, GitBranch, Layout, UserRound } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { buildPrompt, buildStepMessage, type StepId } from '@/lib/harness'
import { useChat } from '@/lib/chat/chat-context'
import type { FlowCoverage, ProjectIssue, ResolvedStep, StepStatus } from '@/lib/model/project.ts'
import type { Flow } from '@/lib/model/flow.ts'
import type { Persona } from '@/lib/model/persona.ts'
import { paths } from '@/lib/paths'

/**
 * Small building blocks shared by the persona and user flow views:
 * coverage, step status, issues, links and copyable commands.
 */

const STEP_STATUS: Record<StepStatus, { label: string; className: string }> = {
  mapped: {
    label: 'Screen exists',
    className: 'bg-primary/10 text-primary',
  },
  'screen-missing': {
    label: 'Screen missing',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  unassigned: {
    label: 'No screen assigned',
    className: 'bg-muted text-muted-foreground',
  },
  'unknown-section': {
    label: 'Unknown section',
    className: 'bg-destructive/10 text-destructive',
  },
  ambiguous: {
    label: 'Ambiguous screen',
    className: 'bg-destructive/10 text-destructive',
  },
}

export function StepStatusBadge({ step }: { step: ResolvedStep }) {
  const status = STEP_STATUS[step.status]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${status.className}`}>
      {step.partial ? 'Partly covered' : status.label}
    </span>
  )
}

/** Link to the screen design of a step, or the name it asks for when the screen does not exist */
export function StepScreen({ step }: { step: ResolvedStep }) {
  if (step.target) {
    return (
      <Link
        to={paths.screen(step.target.sectionId, step.target.name)}
        className="inline-flex max-w-full items-center gap-1.5 text-sm text-foreground hover:text-foreground underline decoration-border underline-offset-2"
      >
        <Layout className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
        <span className="min-w-0 break-all font-mono text-xs">
          {step.target.sectionId}/{step.target.name}
        </span>
      </Link>
    )
  }
  const wanted = [step.sectionId, step.screen].filter(Boolean).join('/')
  return <span className="break-all font-mono text-xs text-muted-foreground">{wanted || '—'}</span>
}

export function CoverageBar({ coverage, compact = false }: { coverage: FlowCoverage; compact?: boolean }) {
  if (coverage.total === 0) {
    return <span className="text-xs text-muted-foreground">No steps defined</span>
  }
  return (
    <div className={compact ? 'flex items-center gap-2' : 'space-y-1.5'}>
      <div
        className={`h-1.5 rounded-full bg-muted overflow-hidden ${compact ? 'w-16 shrink-0' : 'w-full'}`}
        role="progressbar"
        aria-valuenow={coverage.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Flow steps with a screen design"
      >
        <div className="h-full bg-primary" style={{ width: `${coverage.percent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground whitespace-nowrap">
        {coverage.mapped} of {coverage.total} steps have a screen
        {!compact && ` (${coverage.percent}%)`}
        {!compact && coverage.open > 0 && ` · ${coverage.open} open`}
        {!compact && coverage.partial > 0 && ` · ${coverage.partial} partly covered`}
      </p>
    </div>
  )
}

export function PersonaChip({ persona }: { persona: Persona }) {
  return (
    <Link
      to={`/personas/${persona.id}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent transition-colors"
      title={persona.archetype}
    >
      <UserRound className="w-3 h-3 text-primary" strokeWidth={1.75} />
      {persona.name}
    </Link>
  )
}

export function FlowChip({ flow, detail }: { flow: Flow; detail?: string }) {
  return (
    <Link
      to={`/flows/${flow.id}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent transition-colors"
    >
      <GitBranch className="w-3 h-3 text-primary" strokeWidth={1.75} />
      {flow.title}
      {detail && <span className="font-mono text-muted-foreground">{detail}</span>}
    </Link>
  )
}

export function SectionChip({ sectionId, title }: { sectionId: string; title: string }) {
  return (
    <Link
      to={paths.section(sectionId)}
      className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-foreground hover:bg-accent transition-colors"
    >
      {title}
    </Link>
  )
}

/**
 * Conflicts (two planning files disagree) and gaps (something is not there yet).
 * Nothing is resolved here: the list says what is wrong and where.
 */
export function IssueList({ issues }: { issues: ProjectIssue[] }) {
  if (issues.length === 0) return null
  const conflicts = issues.filter((issue) => issue.severity === 'conflict')
  const gaps = issues.filter((issue) => issue.severity === 'gap')

  return (
    <div className="space-y-3">
      {conflicts.length > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-destructive mb-2">
            <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.75} />
            Conflicts ({conflicts.length})
          </p>
          <ul className="space-y-1.5">
            {conflicts.map((issue, index) => (
              <li key={index} className="text-sm text-destructive">
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {gaps.length > 0 && (
        <div className="rounded-md border border-border p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            <CircleDashed className="w-3.5 h-3.5" strokeWidth={1.75} />
            Open ({gaps.length})
          </p>
          <ul className="space-y-1.5">
            {gaps.map((issue, index) => (
              <li key={index} className="text-sm text-foreground">
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** A step to run with the chat agent, or to copy when there is no chat */
export function CommandHint({ label, step, args }: { label: string; step: StepId; args?: string }) {
  const chat = useChat()
  const command = buildPrompt(step, 'opencode', args)
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md bg-muted px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <code className="text-sm font-mono text-foreground break-all">{command}</code>
      </div>
      <div className="flex items-center gap-3">
        {chat && (
          <button
            type="button"
            disabled={chat.status === 'offline'}
            onClick={() => chat.send(buildStepMessage(step, args))}
            className="text-xs font-medium text-primary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start with agent
          </button>
        )}
        <CopyButton text={command} />
      </div>
    </div>
  )
}
