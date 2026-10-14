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
        <p className="text-sm text-stone-500 dark:text-rwe-neutral-400">
          Until you decide, the defaults apply: shadcn/ui, lucide-react, Tailwind CSS v4.
        </p>
      </div>
    )
  }

  const problems = checkTechstack(stack)
  const errors = problems.filter((problem) => problem.severity === 'error')
  const undecided = stack.resolved.filter((decision) => !decision.decided)

  return (
    <Card className="border-stone-200 dark:border-rwe-neutral-700 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-stone-900 dark:text-rwe-neutral-100">
          <Layers className="w-5 h-5 text-stone-500 dark:text-rwe-neutral-400" strokeWidth={1.5} />
          Tech Stack
          <span className="text-sm font-normal text-stone-500 dark:text-rwe-neutral-400">({stack.status})</span>
        </CardTitle>
        {stack.summary && <p className="text-sm text-stone-600 dark:text-rwe-neutral-400 mt-1">{stack.summary}</p>}
      </CardHeader>
      <CardContent className="space-y-5">
        {GROUP_ORDER.map((group) => {
          const rows = stack.resolved.filter((decision) => decision.group === group && decision.decided)
          if (rows.length === 0) return null
          return (
            <div key={group}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-rwe-neutral-400 mb-2">
                {TECHSTACK_GROUPS[group]}
              </h3>
              <dl className="grid grid-cols-1 @2xl:grid-cols-2 gap-x-6 gap-y-1.5">
                {rows.map((row) => (
                  <div key={row.area} className="flex items-baseline justify-between gap-3 text-sm">
                    <dt className="text-stone-500 dark:text-rwe-neutral-400">{row.label}</dt>
                    <dd className="min-w-0 break-words text-stone-900 dark:text-rwe-neutral-100 text-right">
                      {row.choice}
                      {row.source !== 'chosen' && (
                        <span className="ml-1.5 text-xs text-stone-400 dark:text-rwe-neutral-500">{row.source}</span>
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
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-rwe-neutral-400 mb-2">
              Registries and repos ({stack.registries.length})
            </h3>
            <ul className="space-y-1 text-sm">
              {stack.registries.map((registry) => (
                <li key={registry.name} className="text-stone-700 dark:text-rwe-neutral-300">
                  <span className="font-medium">{registry.name}</span>
                  <span className="text-stone-500 dark:text-rwe-neutral-400">
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
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-rwe-neutral-400 mb-2">
              Packages ({stack.packages.length})
            </h3>
            <p className="text-sm text-stone-700 dark:text-rwe-neutral-300 font-mono">
              {stack.packages.map((entry) => entry.name).join(', ')}
            </p>
          </div>
        )}

        {undecided.length > 0 && (
          <p className="text-xs text-stone-500 dark:text-rwe-neutral-400">
            Undecided, no dependency added: {undecided.map((decision) => decision.label.toLowerCase()).join(', ')}
          </p>
        )}

        {errors.length > 0 && (
          <ul className="text-sm text-red-700 dark:text-red-400 list-disc pl-5">
            {errors.map((problem) => (
              <li key={problem.message}>{problem.message}</li>
            ))}
          </ul>
        )}

        <div className="bg-stone-100 dark:bg-rwe-neutral-800 rounded-md px-4 py-3">
          <p className="text-sm text-stone-600 dark:text-rwe-neutral-400">
            To change the stack, use <StepName step="techstack" /> or edit{' '}
            <code className="font-mono text-stone-800 dark:text-rwe-neutral-200">product/techstack/techstack.md</code>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
