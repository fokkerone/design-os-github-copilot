import { useParams, Link } from 'react-router-dom'
import { BookOpen, Layout } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/AppLayout'
import { CommandHint, CoverageBar, FlowChip, IssueList, SectionChip } from '@/components/PlanningContext'
import { getProjectModel, sectionTitle } from '@/lib/project-model'
import { getWikiPage } from '@/lib/wiki-loader'
import { paths } from '@/lib/paths'

const cardClass = 'border-stone-200 dark:border-rwe-neutral-700 shadow-sm'
const titleClass = 'text-lg font-semibold text-stone-900 dark:text-rwe-neutral-100'
const labelClass = 'text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-rwe-neutral-400'

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function LabeledList({ items }: { items: Record<string, string> }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-x-4 gap-y-2">
      {Object.entries(items).map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-sm text-stone-500 dark:text-rwe-neutral-400">{capitalize(label)}</dt>
          <dd className="text-sm text-stone-700 dark:text-rwe-neutral-300">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * One persona: job story, goals, pain points, design implications, evidence,
 * and the sections, flows and screens that address it. Read from product/personas/.
 */
export function PersonaPage() {
  const { personaId = '' } = useParams<{ personaId: string }>()
  const model = getProjectModel()
  const persona = model.getPersona(personaId)

  if (!persona) {
    return (
      <AppLayout backTo={paths.personas} backLabel="Personas">
        <div className="text-center py-12">
          <p className="text-stone-600 dark:text-rwe-neutral-400">
            Persona not found: <span className="font-mono">product/personas/{personaId}.md</span>
          </p>
        </div>
      </AppLayout>
    )
  }

  const flows = model.flowsForPersona(persona.id)
  const sections = model.sectionsForPersona(persona.id)
  const screens = model.screensForPersona(persona.id)
  const issues = model.issuesForPersona(persona.id)
  const toValidate = persona.assumptions.filter((item) => ['assumption', 'hypothesis'].includes(item.evidenceLevel)).length

  return (
    <AppLayout backTo={paths.personas} backLabel="Personas" title={persona.name}>
      <div className="space-y-6">
        <div className="mb-8">
          <p className={labelClass}>
            {['Persona', persona.priority, persona.kind, `${persona.confidence} confidence`, persona.status].filter(Boolean).join(' · ')}
          </p>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-rwe-neutral-100 mt-1 mb-2">
            {persona.name}
            {persona.archetype && persona.archetype !== persona.name && (
              <span className="font-normal text-stone-500 dark:text-rwe-neutral-400"> — {persona.archetype}</span>
            )}
          </h1>
          {persona.quote && <p className="text-stone-600 dark:text-rwe-neutral-400 italic">“{persona.quote}”</p>}
          {persona.kind === 'proto' && (
            <p className="mt-4 rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
              Proto-persona: assumptions, not research. Check the evidence levels below before treating anything here as fact.
            </p>
          )}
        </div>

        {/* Job story and goals */}
        <Card className={cardClass}>
          <CardHeader className="pb-4">
            <CardTitle className={titleClass}>Job story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-stone-700 dark:text-rwe-neutral-300 leading-relaxed">{persona.jobStory || persona.overview}</p>
            {Object.keys(persona.goals).length > 0 && <LabeledList items={persona.goals} />}
          </CardContent>
        </Card>

        {/* Where this persona is addressed */}
        <Card className={cardClass}>
          <CardHeader className="pb-4">
            <CardTitle className={titleClass}>Addressed by</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className={`${labelClass} mb-2`}>Sections ({sections.length})</p>
              {sections.length === 0 ? (
                <p className="text-sm text-stone-500 dark:text-rwe-neutral-400">No section links this persona yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sections.map((sectionId) => (
                    <SectionChip key={sectionId} sectionId={sectionId} title={sectionTitle(sectionId)} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className={`${labelClass} mb-2`}>User flows ({flows.length})</p>
              {flows.length === 0 ? (
                <p className="text-sm text-stone-500 dark:text-rwe-neutral-400">No flow is designed for this persona yet.</p>
              ) : (
                <ul className="space-y-2">
                  {flows.map((flow) => (
                    <li key={flow.id} className="flex flex-wrap items-center justify-between gap-2">
                      <FlowChip flow={flow} />
                      <CoverageBar coverage={model.coverage(flow.id)} compact />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className={`${labelClass} mb-2`}>Screens in those flows ({screens.length})</p>
              {screens.length === 0 ? (
                <p className="text-sm text-stone-500 dark:text-rwe-neutral-400">No screen design is part of a flow for this persona yet.</p>
              ) : (
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {screens.map((screen) => (
                    <Link
                      key={`${screen.sectionId}/${screen.name}`}
                      to={paths.screen(screen.sectionId, screen.name)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-stone-700 dark:text-rwe-neutral-300 hover:text-stone-900 dark:hover:text-rwe-neutral-100 underline decoration-stone-300 dark:decoration-rwe-neutral-600 underline-offset-2"
                    >
                      <Layout className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {screen.sectionId}/{screen.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <IssueList issues={issues} />
          </CardContent>
        </Card>

        {/* Pain points */}
        {persona.painPoints.length > 0 && (
          <Card className={cardClass}>
            <CardHeader className="pb-4">
              <CardTitle className={titleClass}>Needs and pain points</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-stone-200 dark:divide-rwe-neutral-700">
                {persona.painPoints.map((point) => (
                  <li key={point.id} className="px-6 py-4 flex items-start gap-3">
                    <span className="font-mono text-xs text-stone-400 dark:text-rwe-neutral-500 mt-1 w-6 shrink-0">{point.id}</span>
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-medium text-stone-900 dark:text-rwe-neutral-100">{point.painPoint}</p>
                      {point.workaround && (
                        <p className="text-sm text-stone-600 dark:text-rwe-neutral-400">Today: {point.workaround}</p>
                      )}
                      {point.need && <p className="text-sm text-stone-600 dark:text-rwe-neutral-400">Needs: {point.need}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Design implications */}
        {persona.implications.length > 0 && (
          <Card className={cardClass}>
            <CardHeader className="pb-4">
              <CardTitle className={titleClass}>Design implications</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {persona.implications.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span
                      className={`shrink-0 w-12 font-medium ${
                        item.kind === 'do' ? 'text-brand-blue-700 dark:text-energy-green-400' : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {item.kind === 'do' ? 'Do' : "Don't"}
                    </span>
                    <span className="text-stone-700 dark:text-rwe-neutral-300">{item.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Context of use and accessibility */}
        {(Object.keys(persona.contextOfUse).length > 0 || Object.keys(persona.accessibility).length > 0) && (
          <Card className={cardClass}>
            <CardHeader className="pb-4">
              <CardTitle className={titleClass}>Context of use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(persona.contextOfUse).length > 0 && <LabeledList items={persona.contextOfUse} />}
              {Object.keys(persona.accessibility).length > 0 && (
                <div>
                  <p className={`${labelClass} mb-2`}>Accessibility and inclusion</p>
                  <LabeledList items={persona.accessibility} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Behaviors */}
        {(persona.behaviors.length > 0 || persona.dimensions.length > 0) && (
          <Card className={cardClass}>
            <CardHeader className="pb-4">
              <CardTitle className={titleClass}>Thinking style and behaviors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {persona.behaviors.length > 0 && (
                <ul className="space-y-1.5 list-disc pl-5">
                  {persona.behaviors.map((behavior, index) => (
                    <li key={index} className="text-sm text-stone-700 dark:text-rwe-neutral-300">
                      {behavior}
                    </li>
                  ))}
                </ul>
              )}
              {persona.dimensions.map((dimension) => (
                <div key={dimension.dimension}>
                  <p className="text-sm text-stone-700 dark:text-rwe-neutral-300 mb-1">{dimension.dimension}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-500 dark:text-rwe-neutral-400 w-24 text-right shrink-0">{dimension.low}</span>
                    <div className="flex gap-1" aria-label={`${dimension.position ?? '?'} of 5`}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <span
                          key={value}
                          className={`w-6 h-1.5 rounded-full ${
                            dimension.position !== null && value <= dimension.position
                              ? 'bg-stone-700 dark:bg-rwe-neutral-300'
                              : 'bg-stone-200 dark:bg-rwe-neutral-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-stone-500 dark:text-rwe-neutral-400">{dimension.high}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Assumptions and evidence */}
        {persona.assumptions.length > 0 && (
          <Card className={cardClass}>
            <CardHeader className="pb-4">
              <CardTitle className={titleClass}>
                Assumptions and evidence
                <span className="ml-2 text-sm font-normal text-stone-500 dark:text-rwe-neutral-400">
                  ({toValidate} of {persona.assumptions.length} to validate)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-stone-200 dark:divide-rwe-neutral-700">
                {persona.assumptions.map((item) => (
                  <li key={item.id} className="px-6 py-4 flex items-start gap-3">
                    <span className="font-mono text-xs text-stone-400 dark:text-rwe-neutral-500 mt-1 w-6 shrink-0">{item.id}</span>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm text-stone-900 dark:text-rwe-neutral-100">{item.assumption}</p>
                        <span className="rounded-full bg-stone-100 dark:bg-rwe-neutral-800 px-2 py-0.5 text-xs text-stone-600 dark:text-rwe-neutral-400 whitespace-nowrap">
                          {item.evidenceLevel || 'assumption'}
                        </span>
                      </div>
                      {item.source && <p className="text-xs text-stone-500 dark:text-rwe-neutral-400">Source: {item.source}</p>}
                      {item.howToValidate && (
                        <p className="text-xs text-stone-500 dark:text-rwe-neutral-400">Validate: {item.howToValidate}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Source and commands */}
        <div className="space-y-3">
          <CommandHint
            label="New evidence arrived? Update the evidence levels"
            step="persona"
            args={`validate ${persona.id}`}
          />
          <CommandHint label="Design a flow for this persona" step="userflow" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs text-stone-400 dark:text-rwe-neutral-500">product/personas/{persona.id}.md</p>
            {getWikiPage(`personas/${persona.id}`) && (
              <Link
                to={`/wiki/personas/${persona.id}`}
                className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-rwe-neutral-400 hover:text-stone-900 dark:hover:text-rwe-neutral-100"
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
