import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { TreeNode } from '@/lib/live-edit/protocol'
import { ComponentTree } from './ComponentTree'

/** A tree as the preview reports it (sample values, no prototype is loaded) */
const nodes: TreeNode[] = [
  { id: 'n1', parentId: null, name: 'AppShell', kind: 'component', call: 'sample/Preview.tsx:10:5', index: 0, depth: 0 },
  { id: 'n2', parentId: 'n1', name: 'ReadingForm', kind: 'component', call: 'sample/Preview.tsx:11:7', index: 0, depth: 1 },
  { id: 'n3', parentId: 'n2', name: 'form', kind: 'element', src: 'sample/ReadingForm.tsx:20:5', index: 0, depth: 2 },
  { id: 'n4', parentId: 'n3', name: 'h2', kind: 'element', src: 'sample/ReadingForm.tsx:21:7', index: 0, depth: 3 },
  { id: 'n5', parentId: 'n3', name: 'Input', kind: 'component', call: 'sample/ReadingForm.tsx:24:7', index: 0, depth: 3 },
  { id: 'n6', parentId: 'n3', name: 'Button', kind: 'component', call: 'sample/ReadingForm.tsx:30:7', index: 0, depth: 3 },
  { id: 'n7', parentId: 'n3', name: 'Button', kind: 'component', call: 'sample/ReadingForm.tsx:33:7', index: 0, depth: 3 },
]

const meta = {
  title: 'Design OS/Live Edit/ComponentTree',
  component: ComponentTree,
  args: { nodes, selectedId: null, onHover: fn(), onSelect: fn() },
  decorators: [(Story) => <div className="h-[420px] w-[248px] rounded-lg border border-border"><Story /></div>],
} satisfies Meta<typeof ComponentTree>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Selected: Story = { args: { selectedId: 'n6' } }

export const Empty: Story = { args: { nodes: [] } }
