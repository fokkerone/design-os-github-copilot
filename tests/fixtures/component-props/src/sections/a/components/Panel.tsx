import * as React from 'react'
import type { Item } from './types'

interface PanelProps {
  /** Shown above the list */
  title: string
  items?: Item[]
  layout?: 'grid' | 'list' | 'compact'
  collapsed?: boolean
  limit?: number
  onSelect?: (id: string) => void
}

export const Panel = React.memo(function Panel({ title, layout = 'list', collapsed = false, limit = 3 }: PanelProps) {
  return <section data-layout={layout}>{collapsed ? null : title.slice(0, limit)}</section>
})
