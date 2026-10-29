import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowPage } from './FlowPage'

const meta = {
  title: 'Design OS/Pages/FlowPage',
  component: FlowPage,
  parameters: { layout: 'fullscreen', router: { path: '/flows/:flowId', url: '/flows/submit-meter-reading' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof FlowPage>

export default meta
type Story = StoryObj<typeof meta>

export const SampleProject: Story = {}

export const NotFound: Story = { parameters: { router: { path: '/flows/:flowId', url: '/flows/unknown' } } }
