import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/AppLayout'
import { EmptyState } from '@/components/EmptyState'
import { PhaseWarningBanner } from '@/components/PhaseWarningBanner'
import { NextPhaseButton } from '@/components/NextPhaseButton'
import { getProjectModel } from '@/lib/project-model'
import { loadProductData } from '@/lib/product-loader'
import { getSectionScreenDesigns, getSectionScreenshots, hasSectionSpec, hasSectionData } from '@/lib/section-loader'
import { ChevronRight, Check, Circle } from 'lucide-react'
import { paths } from '@/lib/paths'

interface SectionProgress {
  hasSpec: boolean
  hasData: boolean
  hasScreenDesigns: boolean
  screenDesignCount: number
  hasScreenshots: boolean
  screenshotCount: number
}

function getSectionProgress(sectionId: string): SectionProgress {
  const screenDesigns = getSectionScreenDesigns(sectionId)
  const screenshots = getSectionScreenshots(sectionId)
  return {
    hasSpec: hasSectionSpec(sectionId),
    hasData: hasSectionData(sectionId),
    hasScreenDesigns: screenDesigns.length > 0,
    screenDesignCount: screenDesigns.length,
    hasScreenshots: screenshots.length > 0,
    screenshotCount: screenshots.length,
  }
}

export function SectionsPage() {
  const navigate = useNavigate()
  const productData = useMemo(() => loadProductData(), [])

  const sections = useMemo(() => productData.roadmap?.sections || [], [productData])

  // Calculate progress for each section
  const sectionProgressMap = useMemo(() => {
    const map: Record<string, SectionProgress> = {}
    for (const section of sections) {
      map[section.id] = getSectionProgress(section.id)
    }
    return map
  }, [sections])

  // Count completed sections (those with spec, data, AND screen designs)
  const completedSections = sections.filter(s => {
    const p = sectionProgressMap[s.id]
    return p?.hasSpec && p?.hasData && p?.hasScreenDesigns
  }).length

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page intro */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-rwe-neutral-100 mb-2">
            Sections
          </h1>
          <p className="text-stone-600 dark:text-rwe-neutral-400">
            Design each section of your product with specifications, sample data, and screen designs.
          </p>
          {sections.length > 0 && (
            <p className="text-sm text-stone-500 dark:text-rwe-neutral-400 mt-2">
              {completedSections} of {sections.length} sections completed
            </p>
          )}
        </div>

        {/* Warning banner for incomplete prerequisite phases */}
        <PhaseWarningBanner />

        {/* Sections list */}
        {sections.length === 0 ? (
          <EmptyState type="roadmap" />
        ) : (
          <Card className="border-stone-200 dark:border-rwe-neutral-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-stone-900 dark:text-rwe-neutral-100">
                All Sections
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-stone-200 dark:divide-rwe-neutral-700">
                {sections.map((section) => {
                  const progress = sectionProgressMap[section.id]
                  const isComplete = progress?.hasSpec && progress?.hasData && progress?.hasScreenDesigns

                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => navigate(paths.section(section.id))}
                        className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-stone-50 dark:hover:bg-rwe-neutral-800/50 transition-colors"
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          {/* Status indicator */}
                          <div className="shrink-0 mt-0.5">
                            {isComplete ? (
                              <div className="w-6 h-6 rounded-full bg-brand-blue-100 dark:bg-energy-green-900/30 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-brand-blue-600 dark:text-energy-green-400" strokeWidth={2.5} />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-rwe-neutral-700 flex items-center justify-center">
                                <span className="text-xs font-medium text-stone-600 dark:text-rwe-neutral-400">
                                  {section.order}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-stone-900 dark:text-rwe-neutral-100 truncate">
                              {section.title}
                            </h3>
                            <p className="text-sm text-stone-500 dark:text-rwe-neutral-400 mt-0.5 line-clamp-1">
                              {section.description}
                            </p>

                            {/* Progress indicators */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                              <ProgressDot label="Spec" done={progress?.hasSpec} />
                              <ProgressDot label="Data" done={progress?.hasData} />
                              <ProgressDot
                                label={progress?.screenDesignCount ? `${progress.screenDesignCount} screen design${progress.screenDesignCount !== 1 ? 's' : ''}` : 'Screen Designs'}
                                done={progress?.hasScreenDesigns}
                              />
                              <ProgressDot
                                label={progress?.screenshotCount ? `${progress.screenshotCount} screenshot${progress.screenshotCount !== 1 ? 's' : ''}` : 'Screenshots'}
                                done={progress?.hasScreenshots}
                                optional
                              />
                              <SectionLinks sectionId={section.id} />
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-stone-400 dark:text-rwe-neutral-500 flex-shrink-0" strokeWidth={1.5} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Next Phase Button - shown when all sections are complete */}
        {sections.length > 0 && completedSections === sections.length && (
          <NextPhaseButton nextPhase="export" />
        )}
      </div>
    </AppLayout>
  )
}

/** Linked personas, flows and open flow steps of a section. Renders nothing when there are none. */
function SectionLinks({ sectionId }: { sectionId: string }) {
  const model = getProjectModel()
  const personas = model.personasForSection(sectionId).length
  const flows = model.flowsForSection(sectionId)
  const open = flows
    .flatMap((flow) => model.resolveSteps(flow.id))
    .filter((step) => (step.target?.sectionId ?? step.sectionId) === sectionId && step.status !== 'mapped').length
  if (personas === 0 && flows.length === 0) return null

  return (
    <span className="text-xs text-stone-500 dark:text-rwe-neutral-400">
      {[
        personas > 0 && `${personas} persona${personas === 1 ? '' : 's'}`,
        flows.length > 0 && `${flows.length} flow${flows.length === 1 ? '' : 's'}`,
        open > 0 && `${open} flow step${open === 1 ? '' : 's'} without screen`,
      ]
        .filter(Boolean)
        .join(' · ')}
    </span>
  )
}

interface ProgressDotProps {
  label: string
  done?: boolean
  optional?: boolean
}

function ProgressDot({ label, done, optional }: ProgressDotProps) {
  return (
    <span className={`flex items-center gap-1 text-xs ${
      done
        ? 'text-stone-700 dark:text-rwe-neutral-300'
        : optional
          ? 'text-stone-300 dark:text-rwe-neutral-600'
          : 'text-stone-400 dark:text-rwe-neutral-500'
    }`}>
      {done ? (
        <Check className="w-3 h-3 text-brand-blue-600 dark:text-energy-green-400" strokeWidth={2.5} />
      ) : (
        <Circle className={`w-3 h-3 ${optional ? 'opacity-50' : ''}`} strokeWidth={1.5} />
      )}
      {label}
    </span>
  )
}
