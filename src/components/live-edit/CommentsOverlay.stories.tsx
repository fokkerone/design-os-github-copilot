import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { action } from 'storybook/actions'
import type { DesignComment } from '@/lib/comments/format'
import { createCommentsOverlay, type CommentsOverlay } from '@/lib/live-edit/comments-overlay'
import type { FromPreview } from '@/lib/live-edit/protocol'

/**
 * The comment layer that runs inside the preview iframe (src/lib/live-edit/comments-overlay.ts):
 * numbered pins on the elements, a composer with an impeccable command, edit, send and delete.
 * It is plain DOM, so this story drives it on a neutral sample surface. The elements carry
 * `data-dos-src` like the dev build marks them; no prototype code is loaded.
 */
const SRC = {
  title: 'sample/Surface.tsx:4:7',
  field: 'sample/Surface.tsx:8:9',
  button: 'sample/Surface.tsx:12:9',
}

const sample: DesignComment[] = [
  {
    number: 1,
    command: 'polish',
    status: 'open',
    text: 'The heading feels too loud next to the form.',
    element: 'Surface › h2',
    anchor: { src: SRC.title, index: 0, x: 90, y: 50 },
    created: '2026-10-27 09:12',
    notes: '',
  },
  {
    number: 2,
    command: null,
    status: 'sent',
    text: 'Show the unit next to the value.',
    element: 'Surface › input',
    anchor: { src: SRC.field, index: 0, x: 95, y: 50 },
    created: '2026-10-27 09:15',
    notes: '',
  },
  {
    number: 3,
    command: 'clarify',
    status: 'resolved',
    text: 'Rename the button to "Submit reading".',
    element: 'Surface › button',
    anchor: { src: SRC.button, index: 0, x: 50, y: 0 },
    created: '2026-10-26 17:40',
    notes: 'Renamed in ReadingForm.',
  },
]

const log = {
  create: action('dos:comment-create'),
  update: action('dos:comment-update'),
  delete: action('dos:comment-delete'),
  send: action('dos:comment-send'),
}

function Surface() {
  return (
    <div data-dos-comp="Surface" className="mx-auto mt-16 max-w-md space-y-4 rounded-lg border border-stone-200 bg-rwe-sand-25 p-6 dark:border-rwe-neutral-800 dark:bg-rwe-neutral-950">
      <h2 data-dos-src={SRC.title} className="text-xl font-semibold">Sample surface</h2>
      <label className="block space-y-1 text-sm">
        <span>Value</span>
        <input data-dos-src={SRC.field} defaultValue="18342" className="w-full rounded-md border border-stone-300 px-3 py-2 dark:border-rwe-neutral-700 dark:bg-rwe-neutral-900" />
      </label>
      <button data-dos-src={SRC.button} type="button" className="rounded-md bg-brand-blue-500 px-4 py-2 text-sm font-medium text-white dark:bg-energy-green-500 dark:text-brand-blue-900">
        Submit
      </button>
    </div>
  )
}

/** Plays the page side: keeps the comments and answers the overlay's messages */
function CommentsOverlayDemo({ active, showResolved, comments: initial }: { active: boolean; showResolved: boolean; comments: DesignComment[] }) {
  const overlay = useRef<CommentsOverlay | null>(null)
  const [comments, setComments] = useState(initial)

  useEffect(() => {
    const post = (message: FromPreview) => {
      if (message.type === 'dos:comment-create') {
        log.create(message.comment)
        setComments((list) => [
          ...list,
          { ...message.comment, number: Math.max(0, ...list.map((c) => c.number)) + 1, status: 'open', created: 'now', notes: '' },
        ])
      } else if (message.type === 'dos:comment-update') {
        log.update(message)
        setComments((list) => list.map((c) => (c.number === message.number ? { ...c, text: message.text, command: message.command } : c)))
      } else if (message.type === 'dos:comment-delete') {
        log.delete(message)
        setComments((list) => list.filter((c) => c.number !== message.number))
      } else if (message.type === 'dos:comment-send') {
        log.send(message)
        setComments((list) => list.map((c) => (c.number === message.number && c.status === 'open' ? { ...c, status: 'sent' } : c)))
      }
    }
    overlay.current = createCommentsOverlay(document, post)
    return () => {
      overlay.current?.destroy()
      overlay.current = null
    }
  }, [])

  useEffect(() => overlay.current?.setActive(active), [active])
  useEffect(() => overlay.current?.setComments(comments, showResolved), [comments, showResolved])

  return <Surface />
}

const meta = {
  title: 'Design OS/Live Edit/Comments/CommentsOverlay',
  component: CommentsOverlayDemo,
  parameters: { layout: 'fullscreen' },
  args: { active: true, showResolved: false, comments: sample },
  decorators: [(Story) => <div className="h-[520px]"><Story /></div>],
} satisfies Meta<typeof CommentsOverlayDemo>

export default meta
type Story = StoryObj<typeof meta>

/** Comment mode on: pins of the open and sent comments; click a pin to open it, click an element to add one */
export const CommentMode: Story = {}

export const WithResolved: Story = { args: { showResolved: true } }

/** No comments yet: click an element to drop the first pin and open the composer */
export const FirstComment: Story = { args: { comments: [] } }

/** Comment mode off: the layer hides its pins */
export const Off: Story = { args: { active: false } }
