import type { Meta, StoryObj } from '@storybook/react-vite'
import { PersonasCard } from './PersonasCard'

const meta = {
  title: 'Design OS/Cards/PersonasCard',
  component: PersonasCard,
} satisfies Meta<typeof PersonasCard>

export default meta
type Story = StoryObj<typeof meta>

/** Reads the personas of the sample project */
export const Default: Story = {}
