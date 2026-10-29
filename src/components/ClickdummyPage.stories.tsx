import type { Meta, StoryObj } from '@storybook/react-vite'
import { ClickdummyPage } from './ClickdummyPage'

const meta = {
  title: 'Design OS/Pages/ClickdummyPage',
  component: ClickdummyPage,
  parameters: { layout: 'fullscreen', router: { path: '/prototype/preview', url: '/prototype/preview' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof ClickdummyPage>

export default meta
type Story = StoryObj<typeof meta>

/** The sample project */
export const SampleProject: Story = {}

/** A fresh project without planning files */
export const FreshProject: Story = { parameters: { fixtures: 'empty' } }

export const WithChat: Story = { parameters: { fixtures: 'empty', chat: 'online' } }
