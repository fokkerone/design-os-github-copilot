import type { Meta, StoryObj } from '@storybook/react-vite'
import { Progress } from './progress'

const meta = {
  title: 'Design OS/UI/Progress',
  component: Progress,
} satisfies Meta<typeof Progress>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { args: { value: 0, 'aria-label': 'Progress' } }
export const Partial: Story = { args: { value: 42, 'aria-label': 'Progress' } }
export const Full: Story = { args: { value: 100, 'aria-label': 'Progress' } }
