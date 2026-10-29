import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SplitLayout } from './SplitLayout'

const meta = {
  title: 'Design OS/App Shell/SplitLayout',
  component: SplitLayout,
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Roadmap',
    chat: <div className="p-6 text-sm">Chat</div>,
    children: <div className="p-6 text-sm">Page of the current step</div>,
    onPanelModeChange: fn(),
    stepKey: '/prototype/roadmap',
  },
  decorators: [(Story) => <div className="flex h-[560px] flex-col"><Story /></div>],
} satisfies Meta<typeof SplitLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = { args: { panelMode: 'open' } }

export const Expanded: Story = { args: { panelMode: 'expanded' } }

export const ChatOnly: Story = { args: { panelMode: 'hidden' } }

export const AgentWorking: Story = { args: { chatActivity: 'working' } }

export const AgentWaiting: Story = { args: { chatActivity: 'waiting' } }

export const WithoutChat: Story = { args: { chat: undefined } }
