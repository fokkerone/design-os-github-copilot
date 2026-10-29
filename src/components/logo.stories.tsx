import type { Meta, StoryObj } from '@storybook/react-vite'
import Logo from './logo'

const meta = {
  title: 'Design OS/Building Blocks/Logo',
  component: Logo,
  args: { className: 'h-10 w-auto text-foreground' },
} satisfies Meta<typeof Logo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Small: Story = { args: { className: 'h-5 w-auto text-primary' } }
