import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { buildNavigation, type NavFacts } from '@/lib/navigation'
import { AppShell } from './AppShell'

const facts: NavFacts = {
  hasOverview: true,
  hasRoadmap: true,
  hasDataShape: true,
  hasDesignSystem: true,
  hasShell: false,
  sectionsWithScreenDesigns: 1,
  hasClickdummy: false,
  hasExport: false,
  hasTechstack: true,
  personaCount: 1,
  flowCount: 1,
}

const meta = {
  title: 'Design OS/App Shell/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  args: {
    navigation: buildNavigation('/prototype/roadmap', facts),
    theme: 'dark',
    onThemeChange: fn(),
    onNavigate: fn(),
    onSidebarCollapsedChange: fn(),
    children: <div className="p-6 text-sm">Content of the current step</div>,
  },
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

export const Dark: Story = {}

export const Light: Story = { args: { theme: 'light' } }

export const SidebarCollapsed: Story = { args: { sidebarCollapsed: true } }

export const FreshProject: Story = {
  args: {
    navigation: buildNavigation('/prototype/vision', {
      ...facts,
      hasOverview: false,
      hasRoadmap: false,
      hasDataShape: false,
      hasDesignSystem: false,
      sectionsWithScreenDesigns: 0,
      hasTechstack: false,
      personaCount: 0,
      flowCount: 0,
    }),
  },
}
