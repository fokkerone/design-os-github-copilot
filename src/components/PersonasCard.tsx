import { Link } from 'react-router-dom'
import { ChevronRight, UserRound } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { getProjectModel } from '@/lib/project-model'

/**
 * Personas of the product: who it is for. Shown on the Product page.
 */
export function PersonasCard() {
  const model = getProjectModel()

  if (model.personas.length === 0) {
    return <EmptyState type="personas" />
  }

  return (
    <Card className="border-stone-200 dark:border-stone-700 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          Personas
          <span className="ml-2 text-sm font-normal text-stone-500 dark:text-stone-400">({model.personas.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-stone-200 dark:divide-stone-700">
          {model.personas.map((persona) => {
            const flowCount = model.flowsForPersona(persona.id).length
            const sectionCount = model.sectionsForPersona(persona.id).length
            const conflicts = model.issuesForPersona(persona.id).filter((issue) => issue.severity === 'conflict').length

            return (
              <li key={persona.id}>
                <Link
                  to={`/personas/${persona.id}`}
                  className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
                      <UserRound className="w-4 h-4 text-stone-600 dark:text-stone-300" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-stone-900 dark:text-stone-100">
                        {persona.name}
                        {persona.archetype && persona.archetype !== persona.name && (
                          <span className="font-normal text-stone-500 dark:text-stone-400"> — {persona.archetype}</span>
                        )}
                      </h3>
                      {persona.jobStory && (
                        <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-2">{persona.jobStory}</p>
                      )}
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                        {[
                          persona.priority,
                          persona.kind === 'proto' ? 'proto: assumptions, not research' : persona.kind,
                          `${persona.confidence} confidence`,
                          `${sectionCount} section${sectionCount === 1 ? '' : 's'}`,
                          `${flowCount} flow${flowCount === 1 ? '' : 's'}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                        {conflicts > 0 && (
                          <span className="text-red-700 dark:text-red-400">
                            {' '}
                            · {conflicts} conflict{conflicts === 1 ? '' : 's'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0 mt-1" strokeWidth={1.5} />
                </Link>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
