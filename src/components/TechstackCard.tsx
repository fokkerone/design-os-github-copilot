import { Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { StepName } from '@/components/AgentPrompt'
import { TECHSTACK_GROUPS, checkTechstack, type TechstackGroup } from '@/lib/model/techstack'
import { loadTechstack } from '@/lib/techstack-loader'

const GROUP_ORDER = Object.keys(TECHSTACK_GROUPS) as TechstackGroup[]

/**
 * The tech stack of the prototype: what the screens and the export are built with.
 * Without product/techstack/techstack.md the defaults apply, and the card says so.
 */
export function TechstackCard() {
  const stack = loadTechstack()

  if (stack.origin === 'default') {
    return (
      <div className="space-y-3">
        <EmptyState type="techstack" />
        <p className="text-sm text-muted-foreground">
          Until you decide, the defaults apply: shadcn/ui, lucide-react, Tailwind CSS v4.
        </p>
      </div>
    )
  }

  const problems = checkTechstack(stack)
  const errors = problems.filter((problem) => problem.severity === 'error')
  const undecided = stack.resolved.filter((decision) => !decision.decided)

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Layers className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          Tech Stack
          <span className="text-sm font-normal text-muted-foreground">({stack.status})</span>
        </CardTitle>
        {stack.summary && <p className="text-sm text-muted-foreground mt-1">{stack.summary}</p>}
      </CardHeader>
      <CardContent className="space-y-5">
        {GROUP_ORDER.map((group) => {
          const rows = stack.resolved.filter((decision) => decision.group === group && decision.decided)
          if (rows.length === 0) return null
          return (
            <div key={group}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {TECHSTACK_GROUPS[group]}
              </h3>
              <dl className="grid grid-cols-1 @2xl:grid-cols-2 gap-x-6 gap-y-1.5">
                {rows.map((row) => (
                  <div key={row.area} className="flex items-baseline justify-between gap-3 text-sm">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="min-w-0 break-words text-foreground text-right">
                      {row.choice}
                      {row.source !== 'chosen' && (
                        <span className="ml-1.5 text-xs text-muted-foreground">{row.source}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })}

        {stack.registries.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Registries and repos ({stack.registries.length})
            </h3>
            <ul className="space-y-1 text-sm">
              {stack.registries.map((registry) => (
                <li key={registry.name} className="text-foreground">
                  <span className="font-medium">{registry.name}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {registry.kind || 'other'}
                    {registry.usedFor ? ` · ${registry.usedFor}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {stack.packages.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Packages ({stack.packages.length})
            </h3>
            <p className="text-sm text-foreground font-mono">
              {stack.packages.map((entry) => entry.name).join(', ')}
            </p>
          </div>
        )}

        {undecided.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Undecided, no dependency added: {undecided.map((decision) => decision.label.toLowerCase()).join(', ')}
          </p>
        )}

        {errors.length > 0 && (
          <ul className="text-sm text-destructive list-disc pl-5">
            {errors.map((problem) => (
              <li key={problem.message}>{problem.message}</li>
            ))}
          </ul>
        )}

        <div className="bg-muted rounded-md px-4 py-3">
          <p className="text-sm text-muted-foreground">
            To change the stack, use <StepName step="techstack" /> or edit{' '}
            <code className="font-mono text-foreground">product/techstack/techstack.md</code>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
