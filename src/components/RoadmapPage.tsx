import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProductData } from '@/lib/product-loader'
import { paths } from '@/lib/paths'
import { AppLayout } from '@/components/AppLayout'
import { EmptyState } from '@/components/EmptyState'
import { SectionsCard } from '@/components/SectionsCard'
import { PageTabs } from '@/components/PageTabs'
import { roadmapTabs } from '@/components/tabs'

/** Step 2 of the prototype: the sections of the product (tab: Data Shape) */
export function RoadmapPage() {
  const navigate = useNavigate()
  const roadmap = useMemo(() => loadProductData().roadmap, [])
  return (
    <AppLayout>
      <PageTabs label="Roadmap views" tabs={roadmapTabs} />
      {roadmap ? (
        <SectionsCard roadmap={roadmap} onSectionClick={(id) => navigate(paths.section(id))} />
      ) : (
        <EmptyState type="roadmap" />
      )}
    </AppLayout>
  )
}
