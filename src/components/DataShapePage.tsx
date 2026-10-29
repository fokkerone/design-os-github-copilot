import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/AppLayout'
import { StepName } from '@/components/AgentPrompt'
import { EmptyState } from '@/components/EmptyState'
import { StepIndicator, type StepStatus } from '@/components/StepIndicator'
import { NextPhaseButton } from '@/components/NextPhaseButton'
import { PageTabs } from '@/components/PageTabs'
import { roadmapTabs } from '@/components/tabs'
import { loadProductData } from '@/lib/product-loader'

export function DataShapePage() {
  const productData = useMemo(() => loadProductData(), [])
  const dataShape = productData.dataShape

  const hasDataShape = !!dataShape
  const stepStatus: StepStatus = hasDataShape ? 'completed' : 'current'

  return (
    <AppLayout>
      <PageTabs label="Roadmap views" tabs={roadmapTabs} />
      <div className="space-y-6">
        {/* Page intro */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Data Shape
          </h1>
          <p className="text-muted-foreground">
            Sketch out the general shape of your product's data — the core entities and how they relate.
          </p>
        </div>

        {/* Step 1: Data Shape */}
        <StepIndicator step={1} status={stepStatus} isLast={!hasDataShape}>
          {!dataShape ? (
            <EmptyState type="data-shape" />
          ) : (
            <div className="space-y-6">
              {/* Entities */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Entities
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({dataShape.entities.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dataShape.entities.length === 0 ? (
                    <p className="text-muted-foreground">No entities defined.</p>
                  ) : (
                    <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-4">
                      {dataShape.entities.map((entity, index) => (
                        <div
                          key={index}
                          className="bg-muted rounded-lg p-4"
                        >
                          <h3 className="font-semibold text-foreground mb-1">
                            {entity.name}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {entity.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Relationships */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Relationships
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({dataShape.relationships.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dataShape.relationships.length === 0 ? (
                    <p className="text-muted-foreground">No relationships defined.</p>
                  ) : (
                    <ul className="space-y-2">
                      {dataShape.relationships.map((relationship, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                          <span className="text-foreground">
                            {relationship}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Edit hint */}
              <div className="bg-muted rounded-md px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  To update the data shape, use{' '}
                  <StepName step="data-shape" />{' '}
                  or edit the file directly at{' '}
                  <code className="font-mono text-foreground">
                    product/data-shape/data-shape.md
                  </code>
                </p>
              </div>
            </div>
          )}
        </StepIndicator>

        {/* Next Phase Button - shown when all steps complete */}
        {hasDataShape && (
          <StepIndicator step={2} status="current" isLast>
            <NextPhaseButton nextPhase="design-system" />
          </StepIndicator>
        )}
      </div>
    </AppLayout>
  )
}
