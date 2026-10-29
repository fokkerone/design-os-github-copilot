import type { Meta, StoryObj } from '@storybook/react-vite'
import { SectionContextCard } from './SectionContextCard'

const meta = {
  title: 'Design OS/Cards/SectionContextCard',
  component: SectionContextCard,
  args: { sectionId: 'meter-readings', hasSpec: true },
} satisfies Meta<typeof SectionContextCard>

export default meta
type Story = StoryObj<typeof meta>

export const WithFlowsAndPersonas: Story = {}

export const SectionWithoutContext: Story = { args: { sectionId: 'account' } }

/** Without a spec and without links the card renders nothing */
export const WithoutSpec: Story = { args: { sectionId: 'billing', hasSpec: false } }
