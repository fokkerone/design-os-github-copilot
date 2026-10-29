import { Link } from 'react-router-dom'
import { ChevronRight, GitBranch } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { CoverageBar } from '@/components/PlanningContext'
import { getProjectModel, sectionTitle } from '@/lib/project-model'

/**
 * User flows of the product with the share of steps that have a screen design.
 * Shown on the Sections page, because a flow can cross several sections.
 */
export function FlowsCard() {
  const model = getProjectModel()

  if (model.flows.length === 0) {
    return <EmptyState type="flows" />
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">
          User Flows
          <span className="ml-2 text-sm font-normal text-muted-foreground">({model.flows.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {model.flows.map((flow) => {
            const sections = model.sectionsForFlow(flow.id)
            const personas = model.personas.filter((persona) => model.flowsForPersona(persona.id).includes(flow))
            const conflicts = model.issuesForFlow(flow.id).filter((issue) => issue.severity === 'conflict').length

            return (
              <li key={flow.id}>
                <Link
                  to={`/flows/${flow.id}`}
                  className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <GitBranch className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground truncate">{flow.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[
                          flow.status,
                          sections.length > 0 ? sections.map(sectionTitle).join(' → ') : 'no section',
                          personas.length > 0 ? `for ${personas.map((persona) => persona.name).join(', ')}` : 'no persona',
                        ].join(' · ')}
                        {conflicts > 0 && (
                          <span className="text-destructive">
                            {' '}
                            · {conflicts} conflict{conflicts === 1 ? '' : 's'}
                          </span>
                        )}
                      </p>
                      <div className="mt-2">
                        <CoverageBar coverage={model.coverage(flow.id)} compact />
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" strokeWidth={1.5} />
                </Link>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
