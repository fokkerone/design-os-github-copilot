import { useParams, Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/AppLayout'
import { MermaidDiagram } from '@/components/MermaidDiagram'
import {
  CommandHint,
  CoverageBar,
  IssueList,
  PersonaChip,
  SectionChip,
  StepScreen,
  StepStatusBadge,
} from '@/components/PlanningContext'
import { getProjectModel, sectionTitle } from '@/lib/project-model'
import { getWikiPage } from '@/lib/wiki-loader'
import { useWikiRevision } from '@/lib/use-wiki-revision'
import { paths } from '@/lib/paths'

const cardClass = 'border-border shadow-sm'
const titleClass = 'text-lg font-semibold text-foreground'
const labelClass = 'text-xs font-medium uppercase tracking-wide text-muted-foreground'

/**
 * One user flow: context, diagram, every step with its screen design, edge cases,
 * coverage and the conflicts with specs and personas. Read from product/flows/.
 */
export function FlowPage() {
  const { flowId = '' } = useParams<{ flowId: string }>()
  useWikiRevision()
  const model = getProjectModel()
  const flow = model.getFlow(flowId)

  if (!flow) {
    return (
      <AppLayout backTo={paths.flows} backLabel="User Flows">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Flow not found: <span className="font-mono">product/flows/{flowId}.md</span>
          </p>
        </div>
      </AppLayout>
    )
  }

  const steps = model.resolveSteps(flow.id)
  const coverage = model.coverage(flow.id)
  const sections = model.sectionsForFlow(flow.id)
  const personas = model.personas.filter((persona) => model.flowsForPersona(persona.id).includes(flow))
  const issues = model.issuesForFlow(flow.id)
  const open = steps.filter((step) => step.status !== 'mapped')
  const context = [
    ['User', flow.context.user],
    ['Intent', flow.context.intent],
    ['Trigger', flow.context.trigger],
    ['Success', flow.context.success],
    ['User state', flow.context.userState],
  ].filter(([, value]) => value)

  return (
    <AppLayout backTo={paths.flows} backLabel="User Flows" title={flow.title}>
      <div className="space-y-6">
        <div className="mb-8">
          <p className={labelClass}>User flow · {flow.status}</p>
          <h1 className="text-2xl font-semibold text-foreground mt-1 mb-2">{flow.title}</h1>
          {flow.overview && <p className="text-muted-foreground">{flow.overview}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {personas.map((persona) => (
              <PersonaChip key={persona.id} persona={persona} />
            ))}
            {sections.map((sectionId) => (
              <SectionChip key={sectionId} sectionId={sectionId} title={sectionTitle(sectionId)} />
            ))}
            {personas.length === 0 && <span className="text-xs text-muted-foreground">No persona linked</span>}
          </div>
        </div>

        {/* Coverage and issues */}
        <Card className={cardClass}>
          <CardHeader className="pb-4">
            <CardTitle className={titleClass}>Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CoverageBar coverage={coverage} />
            <IssueList issues={issues} />
            {open.length > 0 && (
              <CommandHint
                label="Design a missing screen. Name it as the step does."
                step="design-screen"
              />
            )}
          </CardContent>
        </Card>

        {/* Steps */}
        <Card className={cardClass}>
          <CardHeader className="pb-4">
            <CardTitle className={titleClass}>
              Steps
              <span className="ml-2 text-sm font-normal text-muted-foreground">({steps.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {steps.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">This flow has no step table yet.</p>
            ) : (
              <ol className="divide-y divide-border">
                {steps.map((step) => (
                  <li key={step.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="font-mono text-xs text-muted-foreground mt-1 w-6 shrink-0">{step.id}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{step.title}</p>
                          {(step.userAction || step.systemResponse) && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {[step.userAction, step.systemResponse].filter(Boolean).join(' → ')}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                            <StepScreen step={step} />
                            {step.rules.length > 0 && (
                              <span className="font-mono text-xs text-muted-foreground">{step.rules.join(', ')}</span>
                            )}
                          </div>
                          {step.partial && step.missing && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Missing: {step.missing}</p>
                          )}
                        </div>
                      </div>
                      <StepStatusBadge step={step} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Diagram */}
        {flow.mermaid && (
          <Card className={cardClass}>
            <CardHeader className="pb-4">
              <CardTitle className={titleClass}>Diagram</CardTitle>
            </CardHeader>
            <CardContent>
              <MermaidDiagram chart={flow.mermaid} />
            </CardContent>
          </Card>
        )}

        {/* Context and rules */}
        {(context.length > 0 || flow.rules.length > 0) && (
          <Card className={cardClass}>
            <CardHeader className="pb-4">
              <CardTitle className={titleClass}>Context and rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {context.length > 0 && (
                <dl className="grid grid-cols-1 @2xl:grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
                  {context.map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="text-sm text-foreground">{value.replace(/`/g, '')}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {flow.rules.length > 0 && (
                <ul className="space-y-1.5">
                  {flow.rules.map((rule, index) => (
                    <li key={index} className="text-sm text-foreground">
                      {rule.replace(/\*\*/g, '')}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edge cases */}
        {flow.edgeCases.length > 0 && (
          <Card className={cardClass}>
            <CardHeader className="pb-4">
              <CardTitle className={titleClass}>
                Edge cases
                <span className="ml-2 text-sm font-normal text-muted-foreground">({flow.edgeCases.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {flow.edgeCases.map((edge) => (
                  <li key={edge.id} className="px-6 py-4 flex items-start gap-3">
                    <span className="font-mono text-xs text-muted-foreground mt-1 w-6 shrink-0">{edge.id}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{edge.failure}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {[edge.trigger, edge.handling].filter(Boolean).join(' → ')}
                      </p>
                      {edge.returnsTo && (
                        <p className="text-xs text-muted-foreground mt-1">Returns to {edge.returnsTo}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Open questions */}
        {flow.openQuestions.length > 0 && (
          <Card className={cardClass}>
            <CardHeader className="pb-4">
              <CardTitle className={titleClass}>Open questions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 list-disc pl-5">
                {flow.openQuestions.map((question, index) => (
                  <li key={index} className="text-sm text-foreground">
                    {question}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Source and commands */}
        <div className="space-y-3">
          <CommandHint label="Change this flow" step="userflow" args={`update ${flow.id}`} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs text-muted-foreground">product/flows/{flow.id}.md</p>
            {getWikiPage(`flows/${flow.id}`) && (
              <Link
                to={`/wiki/flows/${flow.id}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                Open in wiki
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
