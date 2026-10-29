import type { Meta, StoryObj } from '@storybook/react-vite'
import { WikiArticlePage } from './WikiArticlePage'

const meta = {
  title: 'Design OS/Pages/WikiArticlePage',
  component: WikiArticlePage,
  parameters: { layout: 'fullscreen', router: { path: '/wiki/*', url: '/wiki/product/vision' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof WikiArticlePage>

export default meta
type Story = StoryObj<typeof meta>

export const Article: Story = {}

export const HowTo: Story = { parameters: { router: { path: '/wiki/*', url: '/wiki/how-to/getting-started' } } }

export const NotFound: Story = { parameters: { router: { path: '/wiki/*', url: '/wiki/product/missing' } } }
