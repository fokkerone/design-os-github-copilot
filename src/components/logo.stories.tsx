import type { Meta, StoryObj } from '@storybook/react-vite'
import Logo from './logo'

const meta = {
  title: 'Design OS/Building Blocks/Logo',
  component: Logo,
  args: { className: 'h-10 w-auto text-rwe-neutral-900 dark:text-rwe-neutral-50' },
} satisfies Meta<typeof Logo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Small: Story = { args: { className: 'h-5 w-auto text-brand-blue-500 dark:text-energy-green-500' } }
