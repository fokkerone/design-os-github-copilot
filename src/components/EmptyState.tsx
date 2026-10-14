import { FileText, Map, ClipboardList, Database, Layout, Package, Boxes, Palette, PanelLeft, UserRound, GitBranch, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AgentPrompt } from '@/components/AgentPrompt'
import type { StepId } from '@/lib/harness'

type EmptyStateType = 'overview' | 'roadmap' | 'spec' | 'data' | 'screen-designs' | 'data-shape' | 'design-system' | 'shell' | 'export' | 'personas' | 'flows' | 'techstack'

interface EmptyStateProps {
  type: EmptyStateType
  sectionName?: string
}

const config: Record<EmptyStateType, {
  icon: typeof FileText
  title: string
  step: StepId
  starter: string | ((name?: string) => string)
  description: string
}> = {
  overview: {
    icon: FileText,
    title: 'No product defined yet',
    step: 'product-vision',
    starter: 'Let\'s define my product vision',
    description: 'Define your product vision, key problems, and features',
  },
  techstack: {
    icon: Layers,
    title: 'No tech stack decided yet',
    step: 'techstack',
    starter: 'Let\'s decide the tech stack of my prototype',
    description: 'Choose the UI library (shadcn/ui is the default), icons, registries, repos and the target framework',
  },
  roadmap: {
    icon: Map,
    title: 'No roadmap defined yet',
    step: 'product-roadmap',
    starter: 'Create my product roadmap',
    description: 'Break down your product into development sections',
  },
  spec: {
    icon: ClipboardList,
    title: 'No specification defined yet',
    step: 'shape-section',
    starter: (name?: string) => name ? `Let's shape the ${name} section` : 'Let\'s shape this section',
    description: 'Define the user flows and UI requirements',
  },
  data: {
    icon: Database,
    title: 'No sample data generated yet',
    step: 'sample-data',
    starter: (name?: string) => name ? `Generate sample data for the ${name} section` : 'Generate sample data for this section',
    description: 'Create realistic sample data for screen designs',
  },
  'screen-designs': {
    icon: Layout,
    title: 'No screen designs created yet',
    step: 'design-screen',
    starter: (name?: string) => name ? `Create a screen design for the ${name} section` : 'Create a screen design for this section',
    description: 'Create screen designs for this section',
  },
  'data-shape': {
    icon: Boxes,
    title: 'No data shape defined yet',
    step: 'data-shape',
    starter: 'Define the data shape for my product',
    description: 'Sketch out the general shape of your product\'s data',
  },
  'design-system': {
    icon: Palette,
    title: 'No design system defined yet',
    step: 'design-system',
    starter: 'Help me define my design system',
    description: 'Define colors, typography, and brand identity for your product',
  },
  shell: {
    icon: PanelLeft,
    title: 'No application shell designed yet',
    step: 'design-shell',
    starter: 'Design the application shell',
    description: 'Design the navigation and layout',
  },
  personas: {
    icon: UserRound,
    title: 'No personas yet',
    step: 'persona',
    starter: 'Create a proto-persona for my product',
    description: 'Say who the product is for: job story, goals, pain points and what they mean for the design',
  },
  flows: {
    icon: GitBranch,
    title: 'No user flows yet',
    step: 'userflow',
    starter: 'Design the most important user flow of my product',
    description: 'Describe how a user reaches a goal step by step, across sections, including what can go wrong',
  },
  export: {
    icon: Package,
    title: 'Ready to export',
    step: 'export-product',
    starter: 'Export the product design package',
    description: 'Generate the complete handoff package',
  },
}

export function EmptyState({ type, sectionName }: EmptyStateProps) {
  const { icon: Icon, title, step, starter: starterConfig, description } = config[type]
  const starter = typeof starterConfig === 'function' ? starterConfig(sectionName) : starterConfig

  return (
    <Card className="border-stone-200 dark:border-rwe-neutral-700 shadow-sm border-dashed">
      <CardContent className="py-8">
        <div className="flex flex-col items-center text-center max-w-sm mx-auto">
          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-rwe-neutral-800 flex items-center justify-center mb-3">
            <Icon className="w-5 h-5 text-stone-400 dark:text-rwe-neutral-500" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-medium text-stone-600 dark:text-rwe-neutral-400 mb-1">
            {title}
          </h3>
          <p className="text-sm text-stone-500 dark:text-rwe-neutral-400 mb-4">
            {description}
          </p>
          <AgentPrompt step={step} prompt={starter} compact />
        </div>
      </CardContent>
    </Card>
  )
}
