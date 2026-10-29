import type { Meta, StoryObj } from '@storybook/react-vite'
import { RoadmapPage } from './RoadmapPage'

const meta = {
  title: 'Design OS/Pages/RoadmapPage',
  component: RoadmapPage,
  parameters: { layout: 'fullscreen', router: { path: '/prototype/roadmap', url: '/prototype/roadmap' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof RoadmapPage>

export default meta
type Story = StoryObj<typeof meta>

/** The sample project */
export const SampleProject: Story = {}

/** A fresh project without planning files */
export const FreshProject: Story = { parameters: { fixtures: 'empty' } }

export const WithChat: Story = { parameters: { fixtures: 'empty', chat: 'online' } }
