import type { Meta, StoryObj } from '@storybook/react-vite'
import { loadSectionData } from '@/lib/section-loader'
import { DataCard } from './DataCard'

const meta = {
  title: 'Design OS/Cards/DataCard',
  component: DataCard,
  args: { data: loadSectionData('meter-readings').data, sectionName: 'Meter Readings' },
} satisfies Meta<typeof DataCard>

export default meta
type Story = StoryObj<typeof meta>

export const WithData: Story = {}

export const Empty: Story = { args: { data: null } }
