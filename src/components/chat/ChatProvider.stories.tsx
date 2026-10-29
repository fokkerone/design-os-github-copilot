import type { Meta, StoryObj } from '@storybook/react-vite'
import { useChat } from '@/lib/chat/chat-context'
import { useLiveEdit } from '@/lib/live-edit/live-edit-context'
import { StaticThread } from '../../../.storybook/helpers'
import { ChatProvider, LiveEditProvider } from './ChatProvider'

/** Shows what a provider hands to the components below it */
function ProviderState() {
  const chat = useChat()
  const live = useLiveEdit()
  return (
    <dl className="grid max-w-md grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
      <dt className="text-stone-500 dark:text-rwe-neutral-400">OpenCode</dt>
      <dd>{chat?.status ?? 'no chat'}</dd>
      <dt className="text-stone-500 dark:text-rwe-neutral-400">Agent</dt>
      <dd>{chat?.activity ?? '-'}</dd>
      <dt className="text-stone-500 dark:text-rwe-neutral-400">Models</dt>
      <dd>{chat?.options.length ?? 0}</dd>
      <dt className="text-stone-500 dark:text-rwe-neutral-400">Live Edit</dt>
      <dd>{live ? (live.selection ? 'element picked' : 'ready') : 'no provider'}</dd>
    </dl>
  )
}

const meta = {
  title: 'Design OS/Chat/ChatProvider',
  component: ChatProvider,
  args: { children: <ProviderState /> },
} satisfies Meta<typeof ChatProvider>

export default meta
type Story = StoryObj<typeof meta>

/** No OpenCode runs next to Storybook: the provider checks, then reports offline */
export const WithoutOpenCode: Story = {}

export const LiveEdit: Story = {
  render: () => (
    <StaticThread>
      <LiveEditProvider>
        <ProviderState />
      </LiveEditProvider>
    </StaticThread>
  ),
}
