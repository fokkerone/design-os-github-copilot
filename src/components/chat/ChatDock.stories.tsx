import type { Meta, StoryObj } from '@storybook/react-vite'
import { StaticThread } from '../../../.storybook/helpers'
import { ChatDock, ChatPanel } from './ChatDock'

const meta = {
  title: 'Design OS/Chat/ChatDock',
  component: ChatDock,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="flex h-[560px] flex-col"><Story /></div>],
} satisfies Meta<typeof ChatDock>

export default meta
type Story = StoryObj<typeof meta>

/** The standalone dock with the real provider: without OpenCode next to Storybook it shows the offline banner */
export const WithoutOpenCode: Story = {}

/** The panel inside a chat that is online, with the model picker */
export const PanelOnline: Story = {
  render: () => (
    <StaticThread>
      <ChatPanel />
    </StaticThread>
  ),
}

export const PanelOffline: Story = {
  render: () => (
    <StaticThread chat="offline">
      <ChatPanel />
    </StaticThread>
  ),
}
