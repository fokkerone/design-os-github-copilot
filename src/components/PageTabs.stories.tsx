import type { Meta, StoryObj } from '@storybook/react-vite'
import { PageTabs } from './PageTabs'

const tabs = [
  { to: '/prototype/roadmap', label: 'Roadmap', end: true },
  { to: '/prototype/roadmap/data-shape', label: 'Data Shape' },
]

const meta = {
  title: 'Design OS/Building Blocks/PageTabs',
  component: PageTabs,
  args: { tabs, label: 'Roadmap' },
} satisfies Meta<typeof PageTabs>

export default meta
type Story = StoryObj<typeof meta>

export const FirstActive: Story = { parameters: { router: { url: '/prototype/roadmap' } } }

export const SecondActive: Story = { parameters: { router: { url: '/prototype/roadmap/data-shape' } } }
