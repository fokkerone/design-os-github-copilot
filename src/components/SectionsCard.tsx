import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight } from 'lucide-react'
import type { ProductRoadmap } from '@/types/product'

interface SectionsCardProps {
  roadmap: ProductRoadmap
  onSectionClick: (sectionId: string) => void
}

export function SectionsCard({ roadmap, onSectionClick }: SectionsCardProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          Sections
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {roadmap.sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => onSectionClick(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-accent transition-colors"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center">
                    {section.order}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                      {section.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
