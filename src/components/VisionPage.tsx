import { useMemo } from 'react'
import { loadProductData } from '@/lib/product-loader'
import { AppLayout } from '@/components/AppLayout'
import { EmptyState } from '@/components/EmptyState'
import { ProductOverviewCard } from '@/components/ProductOverviewCard'

/** Step 1 of the prototype: what the product is and why */
export function VisionPage() {
  const overview = useMemo(() => loadProductData().overview, [])
  return (
    <AppLayout>
      <div className="space-y-6">
        {overview ? <ProductOverviewCard overview={overview} /> : <EmptyState type="overview" />}
      </div>
    </AppLayout>
  )
}
