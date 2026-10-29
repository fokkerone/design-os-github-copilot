import type { Meta, StoryObj } from '@storybook/react-vite'
import { Separator } from './separator'

const meta = {
  title: 'Design OS/UI/Separator',
  component: Separator,
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div className="w-72 text-sm">
      <p>Vision</p>
      <Separator className="my-3" />
      <p>Roadmap</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center gap-3 text-sm">
      <span>Specs</span>
      <Separator orientation="vertical" />
      <span>Data</span>
      <Separator orientation="vertical" />
      <span>Screens</span>
    </div>
  ),
}
