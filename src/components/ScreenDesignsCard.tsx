import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Layout } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import type { ScreenDesignInfo } from '@/types/section'
import { paths } from '@/lib/paths'

interface ScreenDesignsCardProps {
  screenDesigns: ScreenDesignInfo[]
  sectionId: string
  sectionName?: string
}

export function ScreenDesignsCard({ screenDesigns, sectionId, sectionName }: ScreenDesignsCardProps) {
  // Empty state
  if (screenDesigns.length === 0) {
    return <EmptyState type="screen-designs" sectionName={sectionName} />
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          Screen Designs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {screenDesigns.map((screenDesign) => (
            <li key={screenDesign.name}>
              <Link
                to={paths.screen(sectionId, screenDesign.name)}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Layout className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <span className="font-medium text-foreground truncate">
                    {screenDesign.name}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
