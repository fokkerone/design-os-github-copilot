import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ThreadMessageLike } from '@assistant-ui/react'
import { StaticThread } from '../../../.storybook/helpers'
import { ChatPane } from './ChatPane'

const conversation: ThreadMessageLike[] = [
  { role: 'user', content: 'Follow the instructions in .claude/commands/design-os/product-roadmap.md.' },
  {
    role: 'assistant',
    content: [
      { type: 'tool-call', toolCallId: 't1', toolName: 'read', args: { filePath: 'product/product-overview.md' }, result: 'ok' },
      { type: 'text', text: 'I read the overview. Three sections make sense:\n\n- **Meter Readings**\n- **Account**\n- **Billing**' },
    ],
  },
]

const permission: ThreadMessageLike[] = [
  ...conversation,
  {
    role: 'assistant',
    status: { type: 'requires-action', reason: 'tool-calls' },
    content: [
      {
        type: 'tool-call',
        toolCallId: 't2',
        toolName: 'bash',
        args: { command: 'npm run tokens:build' },
        approval: {
          id: 'permission:p1',
          options: [
            { id: 'once', kind: 'allow-once', label: 'Allow once' },
            { id: 'always', kind: 'allow-always', label: 'Always allow' },
            { id: 'reject', kind: 'reject-once', label: 'Deny' },
          ],
        },
      },
    ],
  },
]

const question: ThreadMessageLike[] = [
  conversation[0],
  {
    role: 'assistant',
    status: { type: 'requires-action', reason: 'tool-calls' },
    content: [
      {
        type: 'tool-call',
        toolCallId: 't3',
        toolName: 'question',
        args: {},
        approval: {
          id: 'form:f1',
          display: 'questions',
          dismissible: true,
          questions: [
            {
              id: 'sections',
              prompt: 'Which sections should the roadmap have?',
              header: 'Sections',
              multiple: true,
              options: [
                { id: 'readings', label: 'Meter Readings' },
                { id: 'account', label: 'Account' },
                { id: 'billing', label: 'Billing' },
              ],
            },
          ],
        },
      },
    ],
  },
]

const meta = {
  title: 'Design OS/Chat/ChatPane',
  component: ChatPane,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="flex h-[560px] flex-col"><Story /></div>],
} satisfies Meta<typeof ChatPane>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  render: () => (
    <StaticThread>
      <ChatPane />
    </StaticThread>
  ),
}

export const Conversation: Story = {
  render: () => (
    <StaticThread messages={conversation}>
      <ChatPane />
    </StaticThread>
  ),
}

export const Running: Story = {
  render: () => (
    <StaticThread messages={conversation} running chat="working">
      <ChatPane />
    </StaticThread>
  ),
}

export const WaitingForPermission: Story = {
  render: () => (
    <StaticThread messages={permission} chat="waiting">
      <ChatPane />
    </StaticThread>
  ),
}

export const WaitingForAnswer: Story = {
  render: () => (
    <StaticThread messages={question} chat="waiting">
      <ChatPane />
    </StaticThread>
  ),
}
