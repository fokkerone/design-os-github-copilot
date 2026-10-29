import type { Meta, StoryObj } from '@storybook/react-vite'
import { loadSectionData } from '@/lib/section-loader'
import { SpecCard } from './SpecCard'

const meta = {
  title: 'Design OS/Cards/SpecCard',
  component: SpecCard,
  args: { spec: loadSectionData('meter-readings').specParsed, sectionTitle: 'Section Overview', sectionName: 'Meter Readings' },
} satisfies Meta<typeof SpecCard>

export default meta
type Story = StoryObj<typeof meta>

/** Spec with linked flows and personas */
export const Linked: Story = {}

export const Plain: Story = { args: { spec: loadSectionData('account').specParsed, sectionName: 'Account' } }

export const Empty: Story = { args: { spec: null } }
