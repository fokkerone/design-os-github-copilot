import type { Meta, StoryObj } from '@storybook/react-vite'
import { loadProductData } from '@/lib/product-loader'
import { ProductOverviewCard } from './ProductOverviewCard'

const overview = loadProductData().overview!

const meta = {
  title: 'Design OS/Cards/ProductOverviewCard',
  component: ProductOverviewCard,
  args: { overview },
} satisfies Meta<typeof ProductOverviewCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Minimal: Story = { args: { overview: { ...overview, problems: [], features: [] } } }
