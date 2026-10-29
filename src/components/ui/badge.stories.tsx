import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './badge'

const meta = {
  title: 'Design OS/UI/Badge',
  component: Badge,
  args: { children: 'Badge' },
  argTypes: { variant: { control: 'select', options: ['default', 'secondary', 'destructive', 'outline'] } },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(['default', 'secondary', 'destructive', 'outline'] as const).map((variant) => (
        <Badge key={variant} {...args} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
}
