import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { buildNavigation, type NavFacts } from '@/lib/navigation'
import { MainNav } from './MainNav'

const facts: NavFacts = {
  hasOverview: true,
  hasRoadmap: true,
  hasDataShape: false,
  hasDesignSystem: true,
  hasShell: false,
  sectionsWithScreenDesigns: 1,
  hasClickdummy: false,
  hasExport: false,
  hasTechstack: false,
  personaCount: 2,
  flowCount: 3,
}

const meta = {
  title: 'Design OS/App Shell/MainNav',
  component: MainNav,
  args: { items: buildNavigation('/prototype/sections', facts), onNavigate: fn() },
  decorators: [(Story) => <div className="w-[238px] bg-rwe-sand-200 py-2 dark:bg-rwe-neutral-950"><Story /></div>],
} satisfies Meta<typeof MainNav>

export default meta
type Story = StoryObj<typeof meta>

export const SectionsActive: Story = {}

export const WikiActive: Story = { args: { items: buildNavigation('/wiki', facts) } }
