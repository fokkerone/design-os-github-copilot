import type { Meta, StoryObj } from '@storybook/react-vite'
import { VisionPage } from './VisionPage'

const meta = {
  title: 'Design OS/Pages/VisionPage',
  component: VisionPage,
  parameters: { layout: 'fullscreen', router: { url: '/prototype/vision' } },
} satisfies Meta<typeof VisionPage>

export default meta
type Story = StoryObj<typeof meta>

export const WithOverview: Story = {}

export const Empty: Story = { parameters: { fixtures: 'empty' } }

export const WithChat: Story = { parameters: { fixtures: 'empty', chat: 'online' } }
