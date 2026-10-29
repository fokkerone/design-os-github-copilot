import type { Meta, StoryObj } from '@storybook/react-vite'
import { CopyButton } from './CopyButton'

const meta = {
  title: 'Design OS/Building Blocks/CopyButton',
  component: CopyButton,
  args: { text: '/design-os:product-roadmap' },
} satisfies Meta<typeof CopyButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CustomTitle: Story = { args: { title: 'Copy command' } }
