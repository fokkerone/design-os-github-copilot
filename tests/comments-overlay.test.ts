// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCommentsOverlay, elementLabel } from '@/lib/live-edit/comments-overlay'
import type { DesignComment } from '@/lib/comments/format'
import type { FromPreview } from '@/lib/live-edit/protocol'

const SRC = 'src/ui/button.tsx:30:10'
let button: HTMLButtonElement
let posted: FromPreview[]
let overlay: ReturnType<typeof createCommentsOverlay>

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect

const comment = (over: Partial<DesignComment> = {}): DesignComment => ({
  number: 1,
  command: 'polish',
  status: 'open',
  text: 'Make it primary',
  element: '<Button> in LoginForm',
  anchor: { src: SRC, index: 0, x: 50, y: 50 },
  created: '2026-10-24',
  notes: '',
  ...over,
})
const layer = () => document.querySelector('[aria-label="Comments"]') as HTMLElement
const pins = () => [...layer().querySelectorAll<HTMLButtonElement>('button[aria-label^="#"]')]

beforeEach(() => {
  document.body.innerHTML = `<form data-dos-comp="LoginForm"><button data-dos-src="${SRC}" data-dos-comp="Button" data-dos-call="src/sections/account/components/LoginForm.tsx:40:9">Sign in</button></form>`
  button = document.querySelector('button')!
  button.getBoundingClientRect = () => rect(100, 200, 200, 40)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0))
  posted = []
  overlay = createCommentsOverlay(document, (m) => posted.push(m))
})
afterEach(() => {
  overlay.destroy()
  vi.unstubAllGlobals()
})

describe('comments overlay', () => {
  it('labels a primitive by where it is used', () => {
    expect(elementLabel(button)).toBe('<Button> in LoginForm')
  })

  it('drops a draft at the clicked point and posts it with the anchor in percent', () => {
    overlay.setActive(true)
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 150, clientY: 230 }))
    const textarea = layer().querySelector('textarea')!
    textarea.value = 'Make it primary'
    layer().querySelector('select')!.value = 'audit'
    layer().querySelector<HTMLButtonElement>('button[aria-label="Add comment"]')!.click()
    expect(posted).toEqual([
      { type: 'dos:comment-create', comment: { text: 'Make it primary', command: 'audit', element: '<Button> in LoginForm', anchor: { src: SRC, index: 0, x: 25, y: 75 } } },
    ])
  })

  it('keeps the preview inert while commenting', () => {
    const onClick = vi.fn()
    button.addEventListener('click', onClick)
    overlay.setActive(true)
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 150, clientY: 230 })
    button.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('places pins on their element, hides resolved ones and parks lost anchors at the edge', () => {
    overlay.setActive(true)
    overlay.setComments([comment(), comment({ number: 2, status: 'resolved' }), comment({ number: 3, anchor: { src: 'src/gone.tsx:1:1', index: 0, x: 0, y: 0 } })], false)
    expect(pins().map((p) => p.textContent)).toEqual(['1', '3'])
    expect(pins()[0].style.left).toBe(`${100 + 100 - 13}px`)
    expect(pins()[0].style.top).toBe(`${200 + 20 - 13}px`)
    expect(pins()[1].title).toContain('element moved')
    overlay.setComments([comment(), comment({ number: 2, status: 'resolved' })], true)
    expect(pins()).toHaveLength(2)
  })

  it('opens a comment from its pin and sends it with the element and its call site', () => {
    overlay.setActive(true)
    overlay.setComments([comment()], false)
    pins()[0].click()
    layer().querySelector<HTMLButtonElement>('button[aria-label="Send to chat"]')!.click()
    const sent = posted.find((m) => m.type === 'dos:comment-send')
    expect(sent).toMatchObject({ number: 1, call: 'src/sections/account/components/LoginForm.tsx:40:9', element: { tag: 'button', src: SRC } })
  })

  it('a saved draft becomes its comment; Escape and leaving comment mode close it', () => {
    overlay.setActive(true)
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 150, clientY: 230 }))
    overlay.setComments([comment()], false)
    expect(layer().querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Comment 1')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(layer().querySelector('[role="dialog"]')).toBeNull()
    overlay.setActive(false)
    expect(layer().children).toHaveLength(0)
  })

  it('shows a save error in the open composer', () => {
    overlay.setActive(true)
    overlay.setComments([comment()], false)
    pins()[0].click()
    overlay.showError('text must be 1–4000 characters')
    expect(layer().querySelector('[role="alert"]')?.textContent).toContain('text must be')
  })
})
