import type { Meta, StoryObj } from '@storybook/react-vite'
import { WikiLayout } from './WikiLayout'

const meta = {
  title: 'Design OS/Wiki/WikiLayout',
  component: WikiLayout,
  parameters: { layout: 'fullscreen', router: { url: '/wiki/product/vision' } },
  args: {
    currentPath: 'product/vision',
    title: 'Product vision',
    backTo: '/wiki',
    backLabel: 'Wiki',
    toc: [
      { id: 'product-vision', text: 'Product vision', depth: 1 },
      { id: 'problems', text: 'Problems', depth: 2 },
    ],
    children: <p className="text-sm">Page body</p>,
  },
  decorators: [(Story) => <div className="@container"><Story /></div>],
} satisfies Meta<typeof WikiLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Article: Story = {}

export const Overview: Story = { args: { currentPath: '', toc: [], title: undefined, backTo: undefined }, parameters: { router: { url: '/wiki' } } }
