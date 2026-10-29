import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus } from 'lucide-react'
import { fn } from 'storybook/test'
import { Button } from './button'

const meta = {
  title: 'Design OS/UI/Button',
  component: Button,
  args: { children: 'Button', onClick: fn() },
  argTypes: {
    variant: { control: 'select', options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const).map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="sm">Small</Button>
      <Button {...args}>Default</Button>
      <Button {...args} size="lg">Large</Button>
      <Button {...args} size="icon" aria-label="Add"><Plus /></Button>
    </div>
  ),
}

export const WithIcon: Story = { args: { children: <><Plus /> New section</> } }

export const Disabled: Story = { args: { disabled: true } }
