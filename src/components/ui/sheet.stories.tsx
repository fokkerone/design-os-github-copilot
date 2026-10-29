import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './sheet'

const meta = {
  title: 'Design OS/UI/Sheet',
  component: Sheet,
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

const Example = ({ open, side }: { open?: boolean; side?: 'top' | 'right' | 'bottom' | 'left' }) => (
  <Sheet defaultOpen={open}>
    <SheetTrigger asChild>
      <Button variant="outline">Open step</Button>
    </SheetTrigger>
    <SheetContent side={side}>
      <SheetHeader>
        <SheetTitle>Roadmap</SheetTitle>
        <SheetDescription>On narrow screens the step page opens as a sheet.</SheetDescription>
      </SheetHeader>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">Close</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
)

export const Closed: Story = { render: () => <Example /> }

export const OpenRight: Story = { render: () => <Example open /> }

export const OpenLeft: Story = { render: () => <Example open side="left" /> }
