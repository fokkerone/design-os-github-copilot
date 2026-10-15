import { useMemo } from 'react'
import { Check, AlertTriangle, Play, MousePointer2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/AppLayout'
import { AgentPrompt } from '@/components/AgentPrompt'
import { loadProductData, hasClickdummy } from '@/lib/product-loader'
import { getAllSectionIds, getSectionScreenDesigns } from '@/lib/section-loader'
import { paths } from '@/lib/paths'

export function ClickdummyPage() {
  const productData = useMemo(() => loadProductData(), [])

  // Get section stats
  const sectionStats = useMemo(() => {
    const allSectionIds = getAllSectionIds()
    const roadmapSections = productData.roadmap?.sections || []
    const sectionsWithScreenDesigns = allSectionIds.filter(id => {
      const screenDesigns = getSectionScreenDesigns(id)
      return screenDesigns.length > 0
    })
    return {
      totalSections: roadmapSections.length,
      sectionsReady: sectionsWithScreenDesigns.length,
      readySectionIds: sectionsWithScreenDesigns,
    }
  }, [productData.roadmap])

  const hasShell = !!productData.shell
  const hasRoadmap = !!productData.roadmap
  const allSectionsReady = sectionStats.totalSections > 0 &&
    sectionStats.sectionsReady === sectionStats.totalSections

  const canAssemble = hasShell && hasRoadmap && sectionStats.sectionsReady > 0

  // Check if clickdummy has been assembled
  const clickdummyAssembled = hasClickdummy()

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page intro */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-rwe-neutral-100 mb-2">
            Clickdummy
          </h1>
          <p className="text-stone-600 dark:text-rwe-neutral-400">
            Assemble a navigable prototype to demo to stakeholders and gather feedback before final export.
          </p>
        </div>

        {/* Status Card */}
        <Card className="border-stone-200 dark:border-rwe-neutral-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-stone-900 dark:text-rwe-neutral-100 flex items-center gap-2">
              {canAssemble ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-brand-blue-100 dark:bg-energy-green-900/30 flex items-center justify-center">
                    <Check className="w-4 h-4 text-brand-blue-600 dark:text-energy-green-400" strokeWidth={2.5} />
                  </div>
                  {allSectionsReady ? 'Ready to Assemble' : 'Partially Ready'}
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                  </div>
                  Not Ready
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <ChecklistItem label="Product Roadmap" isComplete={hasRoadmap} />
              <ChecklistItem label="Application Shell" isComplete={hasShell} />
              <ChecklistItem
                label={`Sections with screen designs (${sectionStats.sectionsReady}/${sectionStats.totalSections})`}
                isComplete={sectionStats.sectionsReady > 0}
                isWarning={!allSectionsReady && sectionStats.sectionsReady > 0}
              />
            </div>
            {!allSectionsReady && sectionStats.sectionsReady > 0 && (
              <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                Some sections are missing screen designs. The clickdummy will only include completed sections.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Assemble Command */}
        {canAssemble && (
          <Card className="border-stone-200 dark:border-rwe-neutral-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stone-900 dark:text-rwe-neutral-100 flex items-center gap-2">
                <MousePointer2 className="w-5 h-5" strokeWidth={1.5} />
                Assemble Clickdummy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-stone-600 dark:text-rwe-neutral-400">
                Use the following agent to assemble all your screen designs into a navigable prototype:
              </p>
              <AgentPrompt step="clickdummy" prompt="Assemble the clickdummy" />
            </CardContent>
          </Card>
        )}

        {/* What is a Clickdummy? */}
        <Card className="border-stone-200 dark:border-rwe-neutral-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-stone-900 dark:text-rwe-neutral-100">
              What is a Clickdummy?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-stone-600 dark:text-rwe-neutral-400">
            <p>
              A clickdummy is a fully navigable prototype that wraps all your designed sections in the application shell with working inter-section navigation.
            </p>
            <div className="space-y-2">
              <p className="font-medium text-stone-700 dark:text-rwe-neutral-300">Use it to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Demo to stakeholders (POs, UI/UX designers, clients)</li>
                <li>Gather feedback on the overall flow and navigation</li>
                <li>Test the user experience before implementation</li>
                <li>Iterate on designs based on feedback</li>
              </ul>
            </div>
            <p className="text-sm">
              Once assembled, the clickdummy is available at <code className="font-mono text-stone-700 dark:text-rwe-neutral-300">/clickdummy/preview</code> and can be shared with anyone who has access to the dev server.
            </p>
          </CardContent>
        </Card>

        {/* Launch Button (if assembled) */}
        {clickdummyAssembled && (
          <Card className="border-brand-blue-200 dark:border-energy-green-800 bg-brand-blue-50 dark:bg-energy-green-900/20 shadow-sm">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-stone-900 dark:text-rwe-neutral-100 mb-1">
                    Clickdummy Ready
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-rwe-neutral-400">
                    Your navigable prototype is assembled and ready to demo.
                  </p>
                </div>
                <a
                  href={paths.previewFullscreen}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-medium text-sm rounded-md transition-colors"
                >
                  <Play className="w-4 h-4" strokeWidth={2} />
                  Launch Clickdummy
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

interface ChecklistItemProps {
  label: string
  isComplete: boolean
  isWarning?: boolean
}

function ChecklistItem({ label, isComplete, isWarning }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      {isComplete ? (
        isWarning ? (
          <div className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
          </div>
        ) : (
          <div className="w-4 h-4 rounded-full bg-brand-blue-100 dark:bg-energy-green-900/30 flex items-center justify-center">
            <Check className="w-3 h-3 text-brand-blue-600 dark:text-energy-green-400" strokeWidth={2.5} />
          </div>
        )
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-stone-300 dark:border-rwe-neutral-600" />
      )}
      <span className={`text-sm ${isComplete ? 'text-stone-700 dark:text-rwe-neutral-300' : 'text-stone-500 dark:text-rwe-neutral-400'}`}>
        {label}
      </span>
    </div>
  )
}
