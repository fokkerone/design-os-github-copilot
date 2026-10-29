import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './input'
import { Label } from './label'

const meta = {
  title: 'Design OS/UI/Label',
  component: Label,
  args: { children: 'Product name' },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithInput: Story = {
  render: (args) => (
    <div className="grid w-72 gap-2">
      <Label {...args} htmlFor="name" />
      <Input id="name" placeholder="Meterly" />
    </div>
  ),
}
