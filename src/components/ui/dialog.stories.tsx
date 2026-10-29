import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

const meta = {
  title: 'Design OS/UI/Dialog',
  component: Dialog,
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

const Example = ({ open }: { open?: boolean }) => (
  <Dialog defaultOpen={open}>
    <DialogTrigger asChild>
      <Button variant="outline">Open dialog</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Start a new chat?</DialogTitle>
        <DialogDescription>The current conversation stays in OpenCode.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button>New chat</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export const Closed: Story = { render: () => <Example /> }

export const Open: Story = { render: () => <Example open /> }
