import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu'

const meta = {
  title: 'Design OS/UI/DropdownMenu',
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

const Example = ({ open }: { open?: boolean }) => (
  <DropdownMenu defaultOpen={open} modal={false}>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">Open menu</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56">
      <DropdownMenuLabel>Step</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem>
          Start with agent <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>Copy command</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Zip</DropdownMenuItem>
            <DropdownMenuItem>Folder</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem checked>Show chat</DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value="dark">
        <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

export const Closed: Story = { render: () => <Example /> }

export const Open: Story = { render: () => <Example open />, parameters: { layout: 'centered' } }
