/**
 * Comments, preview side: runs inside the preview iframe next to the picker. In comment mode a
 * click drops a numbered pin on the element under the mouse and opens a composer (text, an
 * impeccable command, save); the saved comments show as pins that follow their element. Plain
 * DOM with inline styles, like the picker, so it adds nothing to the product UI.
 */
import { COMMAND_GROUPS, commandOf } from '@/lib/comments/commands'
import type { CommentAnchor, DesignComment } from '@/lib/comments/format'
import { describe, OVERLAY_ATTR, pickable, withSource } from './picker'
import type { FromPreview } from '@/lib/live-edit/protocol'

const ACCENT = '#2563eb'
const MUTED = '#71717a'
const DONE = '#16a34a'
const PIN = 26
/** The composer grows with its text up to this height, then scrolls */
const MAX_INPUT = 160
const FONT = '13px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'

export interface CommentsOverlay {
  setActive(active: boolean): void
  setComments(items: DesignComment[], showResolved: boolean): void
  showError(error: string): void
  destroy(): void
}

type Open = { kind: 'draft'; anchor: CommentAnchor; element: string; tag: string } | { kind: 'comment'; number: number }

/** Which composer is open, so typed text survives a re-render only in the same composer */
const openKey = (open: Open | null) => (open ? (open.kind === 'draft' ? 'draft' : `comment-${open.number}`) : '')

const css = (el: HTMLElement, style: Partial<CSSStyleDeclaration>) => Object.assign(el.style, style)

/** Where the component around an element is called (a primitive passes `data-dos-call` on to its DOM) */
export const callOf = (el: HTMLElement) => el.getAttribute('data-dos-call')

/** "<Button> in LoginForm" for a primitive's element, "LoginForm › h2" for one written in the screen */
export function elementLabel(el: HTMLElement): string {
  const component = el.getAttribute('data-dos-comp') ?? el.closest('[data-dos-comp]')?.getAttribute('data-dos-comp')
  const call = callOf(el)
  const caller = call?.split('/').pop()?.replace(/\.tsx?(:\d+)*$/, '')
  if (component && caller && caller !== component) return `<${component}> in ${caller}`
  const tag = el.tagName.toLowerCase()
  return component ? `${component} › ${tag}` : tag
}

/** The element an anchor points to, or null when it is no longer rendered */
export function anchorElement(doc: Document, anchor: CommentAnchor): HTMLElement | null {
  return withSource(doc, anchor.src)[anchor.index] ?? null
}

/** Where an anchor sits on screen; null when its element is gone */
export function anchorPoint(doc: Document, anchor: CommentAnchor): { x: number; y: number } | null {
  const el = anchorElement(doc, anchor)
  if (!el || !el.isConnected) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + (r.width * anchor.x) / 100, y: r.top + (r.height * anchor.y) / 100 }
}

export function createCommentsOverlay(doc: Document, post: (message: FromPreview) => void): CommentsOverlay {
  const view = doc.defaultView
  const layer = doc.createElement('div')
  layer.setAttribute(OVERLAY_ATTR, '')
  layer.setAttribute('aria-label', 'Comments')
  css(layer, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '2147483646', font: FONT })
  doc.body.appendChild(layer)

  let active = false
  let items: DesignComment[] = []
  let showResolved = false
  let open: Open | null = null
  let error = ''

  const visible = () => items.filter((c) => showResolved || c.status !== 'resolved')
  const nextNumber = () => Math.max(0, ...items.map((c) => c.number)) + 1

  // Pins and the composer stay the same nodes while they move (scroll, a class change in the
  // preview). A rebuilt button between mousedown and mouseup gets no click, and the click on the
  // common ancestor used to close the composer: Delete and Send to chat did nothing.
  const pins = new Map<string, HTMLElement>()
  let composerBox: HTMLElement | null = null
  let composerSig = ''

  const pin = (key: string, label: string, color: string, x: number, y: number, title: string, onClick?: () => void) => {
    let el = pins.get(key)
    if (!el) {
      el = doc.createElement(onClick ? 'button' : 'div')
      css(el, {
        position: 'fixed',
        width: `${PIN}px`,
        height: `${PIN}px`,
        borderRadius: '9999px',
        color: '#fff',
        border: '2px solid #fff',
        boxShadow: '0 1px 4px rgba(0,0,0,.35)',
        font: '600 12px/1 ui-sans-serif, system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
        cursor: onClick ? 'pointer' : 'default',
        pointerEvents: 'auto',
      })
      if (onClick) {
        el.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          onClick()
        })
      }
      pins.set(key, el)
      layer.appendChild(el)
    }
    el.textContent = label
    el.title = title
    if (onClick) el.setAttribute('aria-label', title)
    css(el, { left: `${x - PIN / 2}px`, top: `${y - PIN / 2}px`, background: color })
    return el
  }

  const commandSelect = (value: string | null) => {
    const select = doc.createElement('select')
    select.setAttribute('aria-label', 'impeccable command')
    const none = doc.createElement('option')
    none.value = ''
    none.textContent = 'No command'
    select.appendChild(none)
    for (const group of COMMAND_GROUPS) {
      const optgroup = doc.createElement('optgroup')
      optgroup.label = group.label
      for (const c of group.commands) {
        const option = doc.createElement('option')
        option.value = c.id
        option.textContent = c.label
        option.title = c.hint
        optgroup.appendChild(option)
      }
      select.appendChild(optgroup)
    }
    select.value = value ?? ''
    css(select, { background: '#18181b', color: '#e4e4e7', border: '1px solid #3f3f46', borderRadius: '8px', padding: '4px 6px', font: FONT, maxWidth: '130px' })
    return select
  }

  const iconButton = (label: string, text: string, primary = false) => {
    const b = doc.createElement('button')
    b.type = 'button'
    b.setAttribute('aria-label', label)
    b.title = label
    b.textContent = text
    css(b, {
      flexShrink: '0',
      height: '30px',
      minWidth: '30px',
      padding: '0 8px',
      borderRadius: '8px',
      border: primary ? 'none' : '1px solid #3f3f46',
      background: primary ? ACCENT : 'transparent',
      color: primary ? '#fff' : '#e4e4e7',
      font: '600 12px/1 ui-sans-serif, system-ui, sans-serif',
      cursor: 'pointer',
    })
    return b
  }

  /** The composer next to a pin: a new comment, or an existing one to edit, send or delete */
  const composer = () => {
    if (!open) return null
    const current = open.kind === 'comment' ? items.find((c) => c.number === (open as { number: number }).number) : undefined
    if (open.kind === 'comment' && !current) return null
    const box = doc.createElement('div')
    box.setAttribute('role', 'dialog')
    box.dataset.open = openKey(open)
    box.setAttribute('aria-label', current ? `Comment ${current.number}` : 'New comment')
    css(box, { position: 'fixed', zIndex: '1', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' })

    const chip = doc.createElement('span')
    chip.textContent = current ? `#${current.number} · ${current.element}` : `<${open.kind === 'draft' ? open.tag : ''}>`
    css(chip, { alignSelf: 'flex-start', background: ACCENT, color: '#fff', borderRadius: '9999px', padding: '2px 8px', font: '500 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace' })
    box.appendChild(chip)

    const panel = doc.createElement('div')
    css(panel, { background: '#09090b', border: '1px solid #3f3f46', borderRadius: '14px', padding: '6px', boxShadow: '0 8px 24px rgba(0,0,0,.35)', display: 'flex', flexDirection: 'column', gap: '6px' })
    const row = doc.createElement('div')
    // Command and save stay at the bottom while a multi-line text grows the field
    css(row, { display: 'flex', alignItems: 'flex-end', gap: '6px' })
    const input = doc.createElement('textarea')
    input.rows = 1
    input.placeholder = 'Add annotation'
    input.setAttribute('aria-label', 'Comment')
    input.value = current?.text ?? ''
    css(input, { flex: '1', minWidth: '0', resize: 'none', background: 'transparent', color: '#fafafa', border: 'none', outline: 'none', font: FONT, padding: '6px 8px', overflowWrap: 'anywhere', overflowY: 'hidden', maxHeight: `${MAX_INPUT}px` })
    input.addEventListener('input', () => {
      grow(input)
      schedule()
    })
    const select = commandSelect(current?.command ?? null)
    const save = iconButton(current ? 'Save comment' : 'Add comment', '↑', true)
    row.append(input, select, save)
    panel.appendChild(row)

    if (current) {
      const actions = doc.createElement('div')
      css(actions, { display: 'flex', alignItems: 'center', gap: '6px', padding: '0 4px 2px' })
      const status = doc.createElement('span')
      status.textContent = current.status
      css(status, { color: current.status === 'resolved' ? DONE : MUTED, font: '500 11px/1 ui-sans-serif, system-ui, sans-serif', marginRight: 'auto', textTransform: 'uppercase', letterSpacing: '.04em' })
      const sendButton = iconButton('Send to chat', current.status === 'open' ? 'Send to chat' : 'Send again', current.status === 'open')
      const remove = iconButton('Delete comment', 'Delete')
      sendButton.addEventListener('click', () => {
        const el = anchorElement(doc, current.anchor)
        post({ type: 'dos:comment-send', number: current.number, element: el ? describe(el) : null, call: el ? callOf(el) : null })
        close()
      })
      remove.addEventListener('click', () => {
        post({ type: 'dos:comment-delete', number: current.number })
        close()
      })
      actions.append(status, sendButton, remove)
      panel.appendChild(actions)
      if (current.notes) {
        const notes = doc.createElement('div')
        notes.textContent = current.notes
        css(notes, { color: '#a1a1aa', whiteSpace: 'pre-wrap', maxHeight: '120px', overflow: 'auto', padding: '0 6px 4px', font: '12px/1.45 ui-sans-serif, system-ui, sans-serif' })
        panel.appendChild(notes)
      }
    }
    if (error) {
      const note = doc.createElement('div')
      note.setAttribute('role', 'alert')
      note.textContent = `Could not save: ${error}`
      css(note, { color: '#fca5a5', padding: '0 6px 4px', font: '12px/1.4 ui-sans-serif, system-ui, sans-serif' })
      panel.appendChild(note)
    }
    box.appendChild(panel)

    const submit = () => {
      const text = input.value.trim()
      if (!text || !open) return
      const command = commandOf(select.value)?.id ?? null
      if (open.kind === 'draft') post({ type: 'dos:comment-create', comment: { text, command, element: open.element, anchor: open.anchor } })
      else post({ type: 'dos:comment-update', number: open.number, text, command })
    }
    save.addEventListener('click', submit)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        submit()
      }
    })
    return { box, input, select, focus: open.kind === 'draft' || doc.activeElement === doc.body }
  }

  /** Fits the field to its text; jsdom measures nothing, so it keeps its one row there */
  const grow = (input: HTMLTextAreaElement) => {
    input.style.height = 'auto'
    if (!input.scrollHeight) return
    input.style.height = `${Math.min(input.scrollHeight, MAX_INPUT)}px`
    input.style.overflowY = input.scrollHeight > MAX_INPUT ? 'auto' : 'hidden'
  }

  /** Right of the pin when it fits, else below it (above it near the bottom), so the pin stays visible */
  const place = (box: HTMLElement, x: number, y: number) => {
    const viewWidth = view?.innerWidth ?? 800
    const viewHeight = view?.innerHeight ?? 600
    const width = Math.min(380, viewWidth - 24)
    css(box, { width: `${width}px` })
    const height = box.offsetHeight
    const besides = x + PIN / 2 + 8 + width <= viewWidth - 12
    const left = besides ? x + PIN / 2 + 8 : Math.max(12, Math.min(x - width / 2, viewWidth - width - 12))
    const below = y + PIN / 2 + 6
    const top = besides
      ? Math.max(12, Math.min(y - 34, viewHeight - height - 12))
      : below + height <= viewHeight - 12 ? below : Math.max(12, y - PIN / 2 - 6 - height)
    css(box, { left: `${left}px`, top: `${top}px` })
  }

  /** What the open composer shows; it is rebuilt only when this changes, else just moved */
  const signature = () => {
    if (!open) return ''
    const current = open.kind === 'comment' ? items.find((c) => c.number === (open as { number: number }).number) : undefined
    const shown = current ? [current.text, current.command, current.status, current.notes, current.element] : open.kind === 'draft' ? [open.anchor, open.tag] : []
    return JSON.stringify([openKey(open), shown, error])
  }

  const render = () => {
    if (!active) {
      layer.replaceChildren()
      pins.clear()
      composerBox = null
      composerSig = ''
      return
    }
    const seen = new Set<string>()
    let at: { x: number; y: number } | null = null
    let edge = 0
    for (const c of visible()) {
      const point = anchorPoint(doc, c.anchor)
      const color = c.status === 'open' ? ACCENT : c.status === 'resolved' ? DONE : MUTED
      // An anchor whose element is gone (renamed, removed) waits at the edge
      const x = point?.x ?? 20
      const y = point?.y ?? 20 + edge++ * (PIN + 6)
      const title = `#${c.number} ${c.command ? `/impeccable ${c.command} · ` : ''}${c.status}${point ? '' : ' · element moved'}: ${c.text}`
      const key = `comment-${c.number}`
      seen.add(key)
      pin(key, String(c.number), color, x, y, title, () => {
        open = { kind: 'comment', number: c.number }
        error = ''
        render()
      })
      if (open?.kind === 'comment' && open.number === c.number) at = { x, y }
    }
    if (open?.kind === 'draft') {
      const point = anchorPoint(doc, open.anchor)
      if (point) {
        seen.add('draft')
        pin('draft', String(nextNumber()), ACCENT, point.x, point.y, 'New comment')
        at = point
      }
    }
    for (const [key, el] of pins) {
      if (seen.has(key)) continue
      el.remove()
      pins.delete(key)
    }

    const sig = at ? signature() : ''
    if (sig !== composerSig) {
      // Keep what the user changed when the same composer is rebuilt (an error, a new anchor);
      // what they left alone shows the new comment
      const typing = composerBox?.querySelector('textarea')
      const picked = composerBox?.querySelector('select')
      const same = composerBox?.dataset.open === openKey(open)
      const kept = same && typing && picked ? { value: typing.value !== typing.dataset.initial ? typing.value : undefined, command: picked.value !== picked.dataset.initial ? picked.value : undefined } : null
      composerBox?.remove()
      composerBox = null
      composerSig = sig
      const built = at ? composer() : null
      if (built) {
        composerBox = built.box
        layer.appendChild(built.box)
        built.input.dataset.initial = built.input.value
        built.select.dataset.initial = built.select.value
        if (kept?.value !== undefined) built.input.value = kept.value
        if (kept?.command !== undefined) built.select.value = kept.command
        grow(built.input)
        if (kept || built.focus) built.input.focus()
      }
    }
    if (composerBox && at) place(composerBox, at.x, at.y)
  }

  const close = () => {
    open = null
    error = ''
    render()
  }

  const onClick = (e: MouseEvent) => {
    if ((e.target as Element | null)?.closest?.(`[${OVERLAY_ATTR}]`)) return
    // The preview stays inert while commenting: no links, no buttons, no navigation
    e.preventDefault()
    e.stopPropagation()
    const el = pickable(e.target)
    if (!el) {
      close()
      return
    }
    const r = el.getBoundingClientRect()
    const x = r.width ? ((e.clientX - r.left) / r.width) * 100 : 50
    const y = r.height ? ((e.clientY - r.top) / r.height) * 100 : 50
    const src = el.getAttribute('data-dos-src') ?? ''
    const index = Math.max(0, withSource(doc, src).indexOf(el))
    open = { kind: 'draft', anchor: { src, index, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }, element: elementLabel(el), tag: el.tagName.toLowerCase() }
    error = ''
    render()
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation()
      close()
    }
  }

  const listen = (on: boolean) => {
    for (const [type, handler] of [
      ['click', onClick],
      ['keydown', onKey],
    ] as [string, EventListener][]) {
      if (on) doc.addEventListener(type, handler, true)
      else doc.removeEventListener(type, handler, true)
    }
  }

  let frame = 0
  const schedule = () => {
    if (!active || frame) return
    frame = view?.requestAnimationFrame(() => {
      frame = 0
      render()
    }) ?? 0
  }
  view?.addEventListener('scroll', schedule, true)
  view?.addEventListener('resize', schedule)
  const observer = view
    ? new view.MutationObserver((records) => {
        if (records.every((r) => (r.target as Element).closest?.(`[${OVERLAY_ATTR}]`) || r.target.parentElement?.closest(`[${OVERLAY_ATTR}]`))) return
        schedule()
      })
    : null
  observer?.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] })

  return {
    setActive(next) {
      if (next === active) return
      active = next
      listen(active)
      doc.documentElement.style.cursor = active ? 'crosshair' : ''
      if (!active) open = null
      render()
    },
    setComments(next, resolved) {
      const created = open?.kind === 'draft' ? next.find((c) => !items.some((o) => o.number === c.number)) : undefined
      items = next
      showResolved = resolved
      error = ''
      // A saved draft becomes its comment; a deleted one closes
      if (created) open = { kind: 'comment', number: created.number }
      else if (open?.kind === 'comment' && !next.some((c) => c.number === (open as { number: number }).number)) open = null
      render()
    },
    showError(message) {
      error = message
      render()
    },
    destroy() {
      if (active) listen(false)
      observer?.disconnect()
      if (frame) view?.cancelAnimationFrame(frame)
      view?.removeEventListener('scroll', schedule, true)
      view?.removeEventListener('resize', schedule)
      doc.documentElement.style.cursor = ''
      layer.remove()
    },
  }
}
