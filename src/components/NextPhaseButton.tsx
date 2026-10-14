import { Link } from 'react-router-dom'
import { Boxes, Palette, LayoutList, Package, ArrowRight, type LucideIcon } from 'lucide-react'
import { paths } from '@/lib/paths'

type NextPhase = 'data-shape' | 'design-system' | 'sections' | 'export'

interface NextPhaseButtonProps {
  nextPhase: NextPhase
}

const phaseConfig: Record<NextPhase, { label: string; icon: LucideIcon; path: string }> = {
  'data-shape': { label: 'Data Shape', icon: Boxes, path: paths.dataShape },
  'design-system': { label: 'Design System', icon: Palette, path: paths.designSystem },
  sections: { label: 'Sections', icon: LayoutList, path: paths.sections },
  export: { label: 'Export', icon: Package, path: paths.export },
}

export function NextPhaseButton({ nextPhase }: NextPhaseButtonProps) {
  const config = phaseConfig[nextPhase]
  const Icon = config.icon

  return (
    <Link
      to={config.path}
      className="w-full flex items-center justify-between gap-4 px-6 py-4 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
        <span className="font-medium">Continue to {config.label}</span>
      </div>
      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
    </Link>
  )
}
