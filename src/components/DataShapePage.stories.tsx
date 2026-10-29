import type { Meta, StoryObj } from '@storybook/react-vite'
import { DataShapePage } from './DataShapePage'

const meta = {
  title: 'Design OS/Pages/DataShapePage',
  component: DataShapePage,
  parameters: { layout: 'fullscreen', router: { path: '/prototype/roadmap/data-shape', url: '/prototype/roadmap/data-shape' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof DataShapePage>

export default meta
type Story = StoryObj<typeof meta>

/** The sample project */
export const SampleProject: Story = {}

/** A fresh project without planning files */
export const FreshProject: Story = { parameters: { fixtures: 'empty' } }

export const WithChat: Story = { parameters: { fixtures: 'empty', chat: 'online' } }
