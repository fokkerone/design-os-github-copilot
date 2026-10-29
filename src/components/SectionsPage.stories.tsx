import type { Meta, StoryObj } from '@storybook/react-vite'
import { SectionsPage } from './SectionsPage'

const meta = {
  title: 'Design OS/Pages/SectionsPage',
  component: SectionsPage,
  parameters: { layout: 'fullscreen', router: { path: '/prototype/sections', url: '/prototype/sections' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof SectionsPage>

export default meta
type Story = StoryObj<typeof meta>

/** The sample project */
export const SampleProject: Story = {}

/** A fresh project without planning files */
export const FreshProject: Story = { parameters: { fixtures: 'empty' } }

export const WithChat: Story = { parameters: { fixtures: 'empty', chat: 'online' } }
