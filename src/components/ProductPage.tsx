import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProductData } from '@/lib/product-loader'
import { hasTechstack } from '@/lib/techstack-loader'
import { AppLayout } from '@/components/AppLayout'
import { EmptyState } from '@/components/EmptyState'
import { ProductOverviewCard } from '@/components/ProductOverviewCard'
import { SectionsCard } from '@/components/SectionsCard'
import { PersonasCard } from '@/components/PersonasCard'
import { TechstackCard } from '@/components/TechstackCard'
import { StepIndicator, type StepStatus } from '@/components/StepIndicator'
import { NextPhaseButton } from '@/components/NextPhaseButton'

/**
 * Determine the status of each step on the Product page
 * Steps: 1. Product Vision, 2. Tech Stack (recommended, defaults apply without it), 3. Roadmap
 */
function getProductPageStepStatuses(
  hasOverview: boolean,
  hasTechstack: boolean,
  hasRoadmap: boolean
): StepStatus[] {
  const statuses: StepStatus[] = []

  // Step 1: Product Vision
  if (hasOverview) {
    statuses.push('completed')
  } else {
    statuses.push('current')
  }

  // Step 2: Tech Stack. Not blocking: without it the defaults (shadcn/ui, lucide-react) apply.
  if (hasTechstack) {
    statuses.push('completed')
  } else if (hasOverview) {
    statuses.push('current')
  } else {
    statuses.push('upcoming')
  }

  // Step 3: Roadmap
  if (hasRoadmap) {
    statuses.push('completed')
  } else if (hasOverview) {
    statuses.push('current')
  } else {
    statuses.push('upcoming')
  }

  return statuses
}

export function ProductPage() {
  const navigate = useNavigate()
  const productData = useMemo(() => loadProductData(), [])

  const hasOverview = !!productData.overview
  const hasRoadmap = !!productData.roadmap
  const techstackDecided = hasTechstack()
  // The tech stack is recommended but not required to continue
  const allStepsComplete = hasOverview && hasRoadmap

  const stepStatuses = getProductPageStepStatuses(hasOverview, techstackDecided, hasRoadmap)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page intro */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
            Product Definition
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            Define your product vision and break it into development sections.
          </p>
        </div>

        {/* Step 1: Product Vision */}
        <div id="step-overview">
          <StepIndicator step={1} status={stepStatuses[0]}>
            {productData.overview ? (
              <div className="space-y-6">
                <ProductOverviewCard overview={productData.overview} />
                {/* Personas: who the product is for. Optional, any time after the overview. */}
                <PersonasCard />
              </div>
            ) : (
              <EmptyState type="overview" />
            )}
          </StepIndicator>
        </div>

        {/* Step 2: Tech Stack */}
        <div id="step-techstack">
          <StepIndicator step={2} status={stepStatuses[1]} optional>
            <TechstackCard />
          </StepIndicator>
        </div>

        {/* Step 3: Roadmap / Sections Definition */}
        <div id="step-roadmap">
          <StepIndicator step={3} status={stepStatuses[2]} isLast={!allStepsComplete}>
            {productData.roadmap ? (
              <SectionsCard
                roadmap={productData.roadmap}
                onSectionClick={(sectionId) => navigate(`/sections/${sectionId}`)}
              />
            ) : (
              <EmptyState type="roadmap" />
            )}
          </StepIndicator>
        </div>

        {/* Next Phase Button - shown when all steps complete */}
        {allStepsComplete && (
          <StepIndicator step={4} status="current" isLast>
            <NextPhaseButton nextPhase="data-shape" />
          </StepIndicator>
        )}
      </div>
    </AppLayout>
  )
}
