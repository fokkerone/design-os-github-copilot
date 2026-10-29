import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { LiveSelection } from '@/lib/live-edit/selection'
import type { TreeNode } from '@/lib/live-edit/protocol'
import { LiveEditPanel } from './LiveEditPanel'
import type { useLivePreview } from './useLivePreview'

type Live = NonNullable<ReturnType<typeof useLivePreview>>

const nodes: TreeNode[] = [
  { id: 'n1', parentId: null, name: 'ReadingForm', kind: 'component', call: 'sample/Preview.tsx:11:7', index: 0, depth: 0 },
  { id: 'n2', parentId: 'n1', name: 'h2', kind: 'element', src: 'sample/ReadingForm.tsx:21:7', index: 0, depth: 1 },
  { id: 'n3', parentId: 'n1', name: 'Button', kind: 'component', call: 'sample/ReadingForm.tsx:30:7', index: 0, depth: 1 },
]

const heading: LiveSelection = {
  target: { kind: 'screen', sectionId: 'meter-readings', screenDesignName: 'ReadingForm' },
  element: {
    src: 'sample/ReadingForm.tsx:21:7',
    component: 'ReadingForm',
    componentPath: ['ReadingForm'],
    tag: 'h2',
    classes: ['text-2xl', 'font-semibold'],
    text: 'Submit a reading',
    textOnly: true,
    html: '<h2 class="text-2xl font-semibold">Submit a reading</h2>',
    styles: {},
  },
  edits: [],
}

/** The fields of useLivePreview the panel reads, with actions instead of a preview */
const live = (selection: LiveSelection | null): Live =>
  ({
    nodes,
    selectedNodeId: selection ? 'n2' : null,
    hoverNode: fn(),
    selectNode: fn(),
    writeToSource: fn(async () => ({ ok: true as const, file: 'sample/ReadingForm.tsx' })),
    record: fn(),
    picking: !selection,
    setPicking: fn(),
    selection,
    setEdits: fn(),
    dismiss: fn(),
    focusComposer: fn(),
    apply: fn(),
    guides: false,
    setGuides: fn(),
  }) as unknown as Live

const meta = {
  title: 'Design OS/Live Edit/LiveEditPanel',
  component: LiveEditPanel,
  args: { live: live(null), onClose: fn() },
  decorators: [(Story) => <div className="h-[600px]"><Story /></div>],
} satisfies Meta<typeof LiveEditPanel>

export default meta
type Story = StoryObj<typeof meta>

/** Picking, nothing selected yet: the layers */
export const Layers: Story = {}

/** An element is selected: its inspector */
export const Inspect: Story = { args: { live: live(heading) } }
