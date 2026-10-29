import type { Meta, StoryObj } from '@storybook/react-vite'
import { TechstackPage } from './TechstackPage'

const meta = {
  title: 'Design OS/Pages/TechstackPage',
  component: TechstackPage,
  parameters: { layout: 'fullscreen', router: { path: '/techstack', url: '/techstack' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof TechstackPage>

export default meta
type Story = StoryObj<typeof meta>

/** The sample project */
export const SampleProject: Story = {}

/** A fresh project without planning files */
export const FreshProject: Story = { parameters: { fixtures: 'empty' } }

export const WithChat: Story = { parameters: { fixtures: 'empty', chat: 'online' } }
