import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowsCard } from './FlowsCard'

const meta = {
  title: 'Design OS/Cards/FlowsCard',
  component: FlowsCard,
} satisfies Meta<typeof FlowsCard>

export default meta
type Story = StoryObj<typeof meta>

/** Reads the flows of the sample project */
export const Default: Story = {}
