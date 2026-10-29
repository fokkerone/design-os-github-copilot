import type { Meta, StoryObj } from '@storybook/react-vite'
import { getSectionScreenDesigns } from '@/lib/section-loader'
import { ScreenDesignsCard } from './ScreenDesignsCard'

const meta = {
  title: 'Design OS/Cards/ScreenDesignsCard',
  component: ScreenDesignsCard,
  args: { screenDesigns: getSectionScreenDesigns('meter-readings'), sectionId: 'meter-readings', sectionName: 'Meter Readings' },
} satisfies Meta<typeof ScreenDesignsCard>

export default meta
type Story = StoryObj<typeof meta>

export const WithScreens: Story = {}

export const Empty: Story = { args: { screenDesigns: [] } }
