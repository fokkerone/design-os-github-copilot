import type { Meta, StoryObj } from '@storybook/react-vite'
import { loadShellInfo } from '@/lib/shell-loader'
import { ShellCard } from './ShellCard'

const shell = loadShellInfo()!

const meta = {
  title: 'Design OS/Cards/ShellCard',
  component: ShellCard,
  args: { shell },
} satisfies Meta<typeof ShellCard>

export default meta
type Story = StoryObj<typeof meta>

export const Designed: Story = {}

export const SpecOnly: Story = { args: { shell: { ...shell, hasComponents: false } } }
