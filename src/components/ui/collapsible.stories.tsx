import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChevronsUpDown } from 'lucide-react'
import { Button } from './button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'

const meta = {
  title: 'Design OS/UI/Collapsible',
  component: Collapsible,
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

const Example = ({ open }: { open?: boolean }) => (
  <Collapsible defaultOpen={open} className="w-72 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">3 sections</span>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Toggle">
          <ChevronsUpDown />
        </Button>
      </CollapsibleTrigger>
    </div>
    <div className="rounded-md border px-3 py-2 text-sm">Meter Readings</div>
    <CollapsibleContent className="space-y-2">
      <div className="rounded-md border px-3 py-2 text-sm">Account</div>
      <div className="rounded-md border px-3 py-2 text-sm">Billing</div>
    </CollapsibleContent>
  </Collapsible>
)

export const Closed: Story = { render: () => <Example /> }

export const Open: Story = { render: () => <Example open /> }
