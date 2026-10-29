import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from './select'

const meta = {
  title: 'Design OS/UI/Select',
  component: Select,
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const Example = ({ open, size }: { open?: boolean; size?: 'sm' | 'default' }) => (
  <Select defaultValue="sonnet" defaultOpen={open}>
    <SelectTrigger className="w-56" size={size} aria-label="Model">
      <SelectValue placeholder="Model" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Anthropic</SelectLabel>
        <SelectItem value="sonnet">Claude Sonnet</SelectItem>
        <SelectItem value="opus">Claude Opus</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectItem value="default">Default</SelectItem>
    </SelectContent>
  </Select>
)

export const Default: Story = { render: () => <Example /> }

export const Small: Story = { render: () => <Example size="sm" /> }

export const Open: Story = { render: () => <Example open />, parameters: { layout: 'centered' } }
