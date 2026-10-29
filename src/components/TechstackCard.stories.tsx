import type { Meta, StoryObj } from '@storybook/react-vite'
import { TechstackCard } from './TechstackCard'

const meta = {
  title: 'Design OS/Cards/TechstackCard',
  component: TechstackCard,
} satisfies Meta<typeof TechstackCard>

export default meta
type Story = StoryObj<typeof meta>

/** The stack of the sample project */
export const Decided: Story = {}

/** Without a techstack file the defaults apply */
export const Defaults: Story = { parameters: { fixtures: 'empty' } }
