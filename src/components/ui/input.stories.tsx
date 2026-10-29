import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './input'

const meta = {
  title: 'Design OS/UI/Input',
  component: Input,
  args: { placeholder: 'Section name', 'aria-label': 'Section name' },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Filled: Story = { args: { defaultValue: 'Meter Readings' } }

export const Invalid: Story = { args: { 'aria-invalid': true, defaultValue: '??' } }

export const Disabled: Story = { args: { disabled: true } }
