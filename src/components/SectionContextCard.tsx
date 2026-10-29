import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CommandHint,
  CoverageBar,
  FlowChip,
  IssueList,
  PersonaChip,
  StepScreen,
  StepStatusBadge,
} from '@/components/PlanningContext'
import { getProjectModel } from '@/lib/project-model'
import type { ProjectIssue } from '@/lib/model/project.ts'

interface SectionContextCardProps {
  sectionId: string
  hasSpec: boolean
}

/**
 * Who a section is designed for and which user flows run through it:
 * the flow steps that belong to this section, their screen designs, and what is still open.
 */
export function SectionContextCard({ sectionId, hasSpec }: SectionContextCardProps) {
  const model = getProjectModel()
  const personas = model.personasForSection(sectionId)
  const flows = model.flowsForSection(sectionId)
  const unused = model.screensWithoutFlow(sectionId)

  // Issues of this section plus the issues of its flows' steps in this section, without duplicates
  const issues: ProjectIssue[] = [...new Set([
    ...model.issuesForSection(sectionId),
    ...flows.flatMap((flow) => model.issuesForFlow(flow.id).filter((issue) => issue.sectionId === sectionId)),
  ])]

  if (personas.length === 0 && flows.length === 0) {
    // Personas and flows are optional: a hint, not an error
    if (!hasSpec) return null
    return (
      <Card className="border-border shadow-sm border-dashed">
        <CardContent className="py-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            This section is not linked to a persona or a user flow yet. Both are optional. They tell the screen designs who
            the section is for and how the user moves through it.
          </p>
          <CommandHint label="Say who this section is for" step="persona" />
          <CommandHint label="Design a flow through this section" step="userflow" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Personas and user flows</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Designed for</p>
          {personas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No persona linked.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {personas.map((persona) => (
                <PersonaChip key={persona.id} persona={persona} />
              ))}
            </div>
          )}
        </div>

        {flows.map((flow) => {
          const steps = model
            .resolveSteps(flow.id)
            .filter((step) => (step.target?.sectionId ?? step.sectionId) === sectionId)

          return (
            <div key={flow.id} className="rounded-md border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border">
                <FlowChip flow={flow} />
                <CoverageBar coverage={model.coverage(flow.id)} compact />
              </div>
              {steps.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">No step of this flow is in this section.</p>
              ) : (
                <ol className="divide-y divide-border">
                  {steps.map((step) => (
                    <li key={step.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs text-muted-foreground w-6 shrink-0">{step.id}</span>
                        <span className="text-sm text-foreground">{step.title}</span>
                        <StepScreen step={step} />
                      </div>
                      <StepStatusBadge step={step} />
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )
        })}

        {unused.length > 0 && flows.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Not part of any flow step: <span className="font-mono">{unused.map((screen) => screen.name).join(', ')}</span>
          </p>
        )}

        <IssueList issues={issues} />
      </CardContent>
    </Card>
  )
}
