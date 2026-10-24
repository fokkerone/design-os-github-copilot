/**
 * Comments, preview side: runs inside the preview iframe next to the picker. In comment mode a
 * click drops a numbered pin on the element under the mouse and opens a composer (text, an
 * impeccable command, save); the saved comments show as pins that follow their element. Plain
 * DOM with inline styles, like the picker, so it adds nothing to the product UI.
 */
import { COMMAND_GROUPS, commandOf } from '@/lib/comments/commands'
import type { CommentAnchor, DesignComment } from '@/lib/comments/format'
import { describe, OVERLAY_ATTR, pickable, withSource } from './picker'
import type { FromPreview } from './protocol'

const ACCENT = '#2563eb'
const MUTED = '#71717a'
const DONE = '#16a34a'
const PIN = 26
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

  const pin = (label: string, color: string, x: number, y: number, title: string, onClick?: () => void) => {
    const el = doc.createElement(onClick ? 'button' : 'div')
    el.textContent = label
    el.title = title
    css(el, {
      position: 'fixed',
      left: `${x - PIN / 2}px`,
      top: `${y - PIN / 2}px`,
      width: `${PIN}px`,
      height: `${PIN}px`,
      borderRadius: '9999px',
      background: color,
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
      el.setAttribute('aria-label', title)
      el.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      })
    }
    layer.appendChild(el)
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
  const composer = (x: number, y: number) => {
    if (!open) return
    const current = open.kind === 'comment' ? items.find((c) => c.number === (open as { number: number }).number) : undefined
    if (open.kind === 'comment' && !current) return
    const box = doc.createElement('div')
    box.setAttribute('role', 'dialog')
    box.dataset.open = openKey(open)
    box.setAttribute('aria-label', current ? `Comment ${current.number}` : 'New comment')
    const viewWidth = view?.innerWidth ?? 800
    const width = Math.min(380, viewWidth - 24)
    // Right of the pin when it fits, else below it, so the pin stays visible
    const besides = x + PIN / 2 + 8 + width <= viewWidth - 12
    const left = besides ? x + PIN / 2 + 8 : Math.max(12, Math.min(x - width / 2, viewWidth - width - 12))
    const top = besides ? Math.max(12, y - 34) : y + PIN / 2 + 6
    css(box, { position: 'fixed', left: `${left}px`, top: `${top}px`, width: `${width}px`, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' })

    const chip = doc.createElement('span')
    chip.textContent = current ? `#${current.number} · ${current.element}` : `<${open.kind === 'draft' ? open.tag : ''}>`
    css(chip, { alignSelf: 'flex-start', background: ACCENT, color: '#fff', borderRadius: '9999px', padding: '2px 8px', font: '500 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace' })
    box.appendChild(chip)

    const panel = doc.createElement('div')
    css(panel, { background: '#09090b', border: '1px solid #3f3f46', borderRadius: '14px', padding: '6px', boxShadow: '0 8px 24px rgba(0,0,0,.35)', display: 'flex', flexDirection: 'column', gap: '6px' })
    const row = doc.createElement('div')
    css(row, { display: 'flex', alignItems: 'center', gap: '6px' })
    const input = doc.createElement('textarea')
    input.rows = 1
    input.placeholder = 'Add annotation'
    input.setAttribute('aria-label', 'Comment')
    input.value = current?.text ?? ''
    css(input, { flex: '1', minWidth: '0', resize: 'none', background: 'transparent', color: '#fafafa', border: 'none', outline: 'none', font: FONT, padding: '6px 8px' })
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
    layer.appendChild(box)
    if (open.kind === 'draft' || doc.activeElement === doc.body) input.focus()
  }

  const render = () => {
    // Keep what the user is typing when pins move (scroll, re-render)
    const typing = layer.querySelector('textarea')
    const typedIn = typing?.closest<HTMLElement>('[data-open]')?.dataset.open
    const draft = typing && open && typedIn === openKey(open) ? { value: typing.value, command: (layer.querySelector('select') as HTMLSelectElement | null)?.value } : null
    layer.replaceChildren()
    if (!active) return
    let edge = 0
    for (const c of visible()) {
      const at = anchorPoint(doc, c.anchor)
      const color = c.status === 'open' ? ACCENT : c.status === 'resolved' ? DONE : MUTED
      // An anchor whose element is gone (renamed, removed) waits at the edge
      const x = at?.x ?? 20
      const y = at?.y ?? 20 + edge++ * (PIN + 6)
      const title = `#${c.number} ${c.command ? `/impeccable ${c.command} · ` : ''}${c.status}${at ? '' : ' · element moved'}: ${c.text}`
      pin(String(c.number), color, x, y, title, () => {
        open = { kind: 'comment', number: c.number }
        error = ''
        render()
      })
      if (open?.kind === 'comment' && open.number === c.number) composer(x, y)
    }
    if (open?.kind === 'draft') {
      const at = anchorPoint(doc, open.anchor)
      if (at) {
        pin(String(nextNumber()), ACCENT, at.x, at.y, 'New comment')
        composer(at.x, at.y)
      }
    }
    if (draft) {
      const input = layer.querySelector('textarea')
      const select = layer.querySelector('select') as HTMLSelectElement | null
      if (input) input.value = draft.value
      if (select && draft.command !== undefined) select.value = draft.command
      input?.focus()
    }
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
