import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { loadProductData } from '@/lib/product-loader'
import { SectionsCard } from './SectionsCard'

const meta = {
  title: 'Design OS/Cards/SectionsCard',
  component: SectionsCard,
  args: { roadmap: loadProductData().roadmap!, onSectionClick: fn() },
} satisfies Meta<typeof SectionsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
