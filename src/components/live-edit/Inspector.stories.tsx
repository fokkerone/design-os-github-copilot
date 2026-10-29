import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { LiveSelection } from '@/lib/live-edit/selection'
import { Inspector, PickButton } from './Inspector'

/** A picked element as the preview reports it (sample values, no prototype is loaded) */
const heading: LiveSelection = {
  target: { kind: 'screen', sectionId: 'meter-readings', screenDesignName: 'ReadingForm' },
  element: {
    src: 'src/sections/meter-readings/components/ReadingForm.tsx:24:7',
    component: 'ReadingForm',
    componentPath: ['ReadingFormView', 'ReadingForm'],
    tag: 'h1',
    classes: ['text-2xl', 'font-semibold', 'text-teal-900'],
    text: 'Submit a reading',
    textOnly: true,
    html: '<h1 class="text-2xl font-semibold text-teal-900">Submit a reading</h1>',
    styles: {},
  },
  edits: [],
}

const box: LiveSelection = {
  ...heading,
  element: { ...heading.element, tag: 'div', classes: ['rounded-md', 'p-4', 'shadow-sm'], text: '', textOnly: false, html: '<div class="rounded-md p-4 shadow-sm">…</div>' },
}

const meta = {
  title: 'Design OS/Live Edit/Inspector',
  component: Inspector,
  args: { selection: heading, onChange: fn(), onClose: fn(), onAddToChat: fn(), onApply: fn() },
  decorators: [(Story) => <div className="h-[600px]"><Story /></div>],
} satisfies Meta<typeof Inspector>

export default meta
type Story = StoryObj<typeof meta>

export const TextElement: Story = {}

export const BoxElement: Story = { args: { selection: box } }

export const WithEdits: Story = {
  args: { selection: { ...heading, edits: [{ property: 'font-size', from: 'text-2xl', to: 'text-3xl', css: { 'font-size': '1.875rem' } }] } },
}

export const PickButtonStates: Story = {
  render: () => (
    <div className="flex gap-3">
      <PickButton active={false} onToggle={fn()} />
      <PickButton active onToggle={fn()} />
    </div>
  ),
}
