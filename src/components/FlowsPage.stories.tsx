import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowsPage } from './FlowsPage'

const meta = {
  title: 'Design OS/Pages/FlowsPage',
  component: FlowsPage,
  parameters: { layout: 'fullscreen', router: { path: '/flows', url: '/flows' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof FlowsPage>

export default meta
type Story = StoryObj<typeof meta>

/** The flows of the sample project */
export const SampleProject: Story = {}
