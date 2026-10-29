import type { Meta, StoryObj } from '@storybook/react-vite'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable'

const meta = {
  title: 'Design OS/UI/Resizable',
  component: ResizablePanelGroup,
} satisfies Meta<typeof ResizablePanelGroup>

export default meta
type Story = StoryObj<typeof meta>

const Pane = ({ label }: { label: string }) => (
  <div className="flex h-full items-center justify-center p-6 text-sm">{label}</div>
)

export const Horizontal: Story = {
  render: () => (
    <ResizablePanelGroup orientation="horizontal" className="min-h-48 max-w-xl rounded-lg border">
      <ResizablePanel defaultSize="50%">
        <Pane label="Chat" />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="50%">
        <Pane label="Step" />
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}

export const Vertical: Story = {
  render: () => (
    <ResizablePanelGroup orientation="vertical" className="min-h-64 max-w-xl rounded-lg border">
      <ResizablePanel defaultSize="40%">
        <Pane label="Top" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="60%">
        <Pane label="Bottom" />
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}
