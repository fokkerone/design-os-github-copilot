import type { Meta, StoryObj } from '@storybook/react-vite'
import { AgentPrompt, StepName } from './AgentPrompt'

const meta = {
  title: 'Design OS/Building Blocks/AgentPrompt',
  component: AgentPrompt,
  args: { step: 'product-roadmap', prompt: 'Plan the sections of the product.' },
} satisfies Meta<typeof AgentPrompt>

export default meta
type Story = StoryObj<typeof meta>

/** Without a chat the step shows the command to copy */
export const WithoutChat: Story = {}

/** With a chat the step starts in the conversation */
export const WithChat: Story = { parameters: { chat: 'online' } }

export const Compact: Story = { args: { compact: true }, parameters: { chat: 'online' } }

export const StepNames: Story = {
  render: () => (
    <ul className="space-y-1 text-sm">
      <li><StepName step="product-vision" /></li>
      <li><StepName step="design-screen" /></li>
      <li><StepName step="export-product" /></li>
    </ul>
  ),
}
