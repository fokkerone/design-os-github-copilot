import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExportPage } from './ExportPage'

const meta = {
  title: 'Design OS/Pages/ExportPage',
  component: ExportPage,
  parameters: { layout: 'fullscreen', router: { path: '/prototype/export', url: '/prototype/export' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof ExportPage>

export default meta
type Story = StoryObj<typeof meta>

/** The sample project */
export const SampleProject: Story = {}

/** A fresh project without planning files */
export const FreshProject: Story = { parameters: { fixtures: 'empty' } }

export const WithChat: Story = { parameters: { fixtures: 'empty', chat: 'online' } }
