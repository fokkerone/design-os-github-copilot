import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppLayout } from './AppLayout'

const meta = {
  title: 'Design OS/Building Blocks/AppLayout',
  component: AppLayout,
  parameters: { layout: 'fullscreen' },
  args: { children: <p className="text-sm">Content of a step page</p> },
  decorators: [(Story) => <div className="@container"><Story /></div>],
} satisfies Meta<typeof AppLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SubPage: Story = { args: { backTo: '/prototype/sections', backLabel: 'Sections', title: 'Meter Readings' } }
