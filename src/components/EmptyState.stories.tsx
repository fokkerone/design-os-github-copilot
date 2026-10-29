import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmptyState } from './EmptyState'

const types = ['overview', 'roadmap', 'spec', 'data', 'screen-designs', 'data-shape', 'design-system', 'shell', 'export', 'personas', 'flows', 'techstack'] as const

const meta = {
  title: 'Design OS/Building Blocks/EmptyState',
  component: EmptyState,
  args: { type: 'overview' },
  argTypes: { type: { control: 'select', options: types } },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {}

export const SectionSpec: Story = { args: { type: 'spec', sectionName: 'Meter Readings' } }

export const WithChat: Story = { parameters: { chat: 'online' } }

export const AllTypes: Story = {
  render: () => (
    <div className="grid gap-4">
      {types.map((type) => (
        <EmptyState key={type} type={type} sectionName="Meter Readings" />
      ))}
    </div>
  ),
}
