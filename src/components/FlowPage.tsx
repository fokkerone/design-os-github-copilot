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

const cardClass = 'border-stone-200 dark:border-stone-700 shadow-sm'
const titleClass = 'text-lg font-semibold text-stone-900 dark:text-stone-100'
const labelClass = 'text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400'

/**
 * One user flow: context, diagram, every step with its screen design, edge cases,
 * coverage and the conflicts with specs and personas. Read from product/flows/.
 */
export function FlowPage() {
  const { flowId = '' } = useParams<{ flowId: string }>()
  const model = getProjectModel()
  const flow = model.getFlow(flowId)

  if (!flow) {
    return (
      <AppLayout backTo="/sections" backLabel="Sections">
        <div className="text-center py-12">
          <p className="text-stone-600 dark:text-stone-400">
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
    <AppLayout backTo="/sections" backLabel="Sections" title={flow.title}>
      <div className="space-y-6">
        <div className="mb-8">
          <p className={labelClass}>User flow · {flow.status}</p>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mt-1 mb-2">{flow.title}</h1>
          {flow.overview && <p className="text-stone-600 dark:text-stone-400">{flow.overview}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {personas.map((persona) => (
              <PersonaChip key={persona.id} persona={persona} />
            ))}
            {sections.map((sectionId) => (
              <SectionChip key={sectionId} sectionId={sectionId} title={sectionTitle(sectionId)} />
            ))}
            {personas.length === 0 && <span className="text-xs text-stone-500 dark:text-stone-400">No persona linked</span>}
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
              <span className="ml-2 text-sm font-normal text-stone-500 dark:text-stone-400">({steps.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {steps.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-stone-500 dark:text-stone-400">This flow has no step table yet.</p>
            ) : (
              <ol className="divide-y divide-stone-200 dark:divide-stone-700">
                {steps.map((step) => (
                  <li key={step.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="font-mono text-xs text-stone-400 dark:text-stone-500 mt-1 w-6 shrink-0">{step.id}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-stone-900 dark:text-stone-100">{step.title}</p>
                          {(step.userAction || step.systemResponse) && (
                            <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                              {[step.userAction, step.systemResponse].filter(Boolean).join(' → ')}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                            <StepScreen step={step} />
                            {step.rules.length > 0 && (
                              <span className="font-mono text-xs text-stone-400 dark:text-stone-500">{step.rules.join(', ')}</span>
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
                <dl className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
                  {context.map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="text-sm text-stone-500 dark:text-stone-400">{label}</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">{value.replace(/`/g, '')}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {flow.rules.length > 0 && (
                <ul className="space-y-1.5">
                  {flow.rules.map((rule, index) => (
                    <li key={index} className="text-sm text-stone-700 dark:text-stone-300">
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
                <span className="ml-2 text-sm font-normal text-stone-500 dark:text-stone-400">({flow.edgeCases.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-stone-200 dark:divide-stone-700">
                {flow.edgeCases.map((edge) => (
                  <li key={edge.id} className="px-6 py-4 flex items-start gap-3">
                    <span className="font-mono text-xs text-stone-400 dark:text-stone-500 mt-1 w-6 shrink-0">{edge.id}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-100">{edge.failure}</p>
                      <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                        {[edge.trigger, edge.handling].filter(Boolean).join(' → ')}
                      </p>
                      {edge.returnsTo && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Returns to {edge.returnsTo}</p>
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
                  <li key={index} className="text-sm text-stone-700 dark:text-stone-300">
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
            <p className="font-mono text-xs text-stone-400 dark:text-stone-500">product/flows/{flow.id}.md</p>
            {getWikiPage(`flows/${flow.id}`) && (
              <Link
                to={`/wiki/flows/${flow.id}`}
                className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
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
