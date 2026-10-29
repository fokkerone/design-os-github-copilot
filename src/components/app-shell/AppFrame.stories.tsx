import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatPane } from '@/components/chat/ChatPane'
import { StaticThread } from '../../../.storybook/helpers'
import { AppFrame, LegacyOrNotFound } from './AppFrame'

const meta = {
  title: 'Design OS/App Shell/AppFrame',
  component: AppFrame,
  parameters: { layout: 'fullscreen', router: { url: '/prototype/roadmap' } },
  decorators: [(Story) => <div className="h-screen"><Story /></div>],
} satisfies Meta<typeof AppFrame>

export default meta
type Story = StoryObj<typeof meta>

/** Facts from the sample fixtures, a chat without OpenCode */
export const Default: Story = {
  args: {
    chat: (
      <StaticThread>
        <ChatPane />
      </StaticThread>
    ),
  },
}

/** The real chat provider: no OpenCode runs next to Storybook, so it reports offline */
export const OpenCodeOffline: Story = {}

export const FreshProject: Story = {
  parameters: { fixtures: 'empty', router: { url: '/prototype/vision' } },
  args: Default.args,
}

export const NotFound: Story = {
  render: () => <LegacyOrNotFound />,
  parameters: { layout: 'padded', router: { url: '/does-not-exist' } },
}
