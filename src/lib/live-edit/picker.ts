/**
 * Live Edit picker: runs inside the preview iframe. Plain DOM with inline styles, so it adds
 * nothing to the product UI it inspects (no classes, no React, no CSS).
 */
import type { FromPreview, PickedElement } from './protocol'

const SOURCE_ATTR = 'data-dos-src'
const COMPONENT_ATTR = 'data-dos-comp'
const OVERLAY_ATTR = 'data-dos-overlay'
const MAX_HTML = 1500
const MAX_TEXT = 200
const ACCENT = '#2563eb'

/** Computed styles shown in the inspector */
export const INSPECTED_STYLES = [
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-transform',
  'text-decoration-line',
  'color',
  'background-color',
  'display',
  'width',
  'height',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'border-color',
  'border-style',
  'border-width',
  'opacity',
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'box-shadow',
] as const

// Box model colors of the paddings-and-margins guides (browser devtools convention)
const MARGIN_TINT = 'rgba(246, 178, 107, 0.45)'
const PADDING_TINT = 'rgba(147, 196, 125, 0.5)'

const shorten = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text)

/** The element the picker selects for a click target: the nearest one with a source location */
export function pickable(target: EventTarget | null): HTMLElement | null {
  let el = target instanceof Element ? target : null
  while (el && !el.hasAttribute(SOURCE_ATTR)) el = el.parentElement
  return el instanceof HTMLElement && !el.closest(`[${OVERLAY_ATTR}]`) ? el : null
}

/** The elements rendered from one source location, in document order */
function withSource(doc: Document, src: string): HTMLElement[] {
  return [...doc.querySelectorAll<HTMLElement>(`[${SOURCE_ATTR}]`)].filter((el) => el.getAttribute(SOURCE_ATTR) === src)
}

/** Everything the chat and the inspector need to know about an element */
export function describe(el: HTMLElement): PickedElement {
  const componentPath: string[] = []
  for (let node: Element | null = el; node; node = node.parentElement) {
    const name = node.getAttribute(COMPONENT_ATTR)
    if (name && componentPath[0] !== name) componentPath.unshift(name)
  }
  const computed = el.ownerDocument.defaultView?.getComputedStyle(el)
  const styles: Record<string, string> = {}
  for (const prop of INSPECTED_STYLES) styles[prop] = computed?.getPropertyValue(prop) ?? ''
  // Shorthands are empty in some engines: read them from one side
  styles['border-color'] ||= computed?.getPropertyValue('border-top-color') ?? ''
  styles['border-style'] ||= computed?.getPropertyValue('border-top-style') ?? ''
  styles['border-width'] ||= computed?.getPropertyValue('border-top-width') ?? ''
  styles['border-radius'] ||= styles['border-top-left-radius']
  const clone = el.cloneNode(true) as HTMLElement
  for (const node of [clone, ...clone.querySelectorAll('*')]) {
    node.removeAttribute(SOURCE_ATTR)
    node.removeAttribute(COMPONENT_ATTR)
  }
  const src = el.getAttribute(SOURCE_ATTR) ?? ''
  return {
    src,
    index: Math.max(0, withSource(el.ownerDocument, src).indexOf(el)),
    component: el.getAttribute(COMPONENT_ATTR),
    componentPath,
    tag: el.tagName.toLowerCase(),
    classes: [...el.classList],
    text: shorten((el.textContent ?? '').replace(/\s+/g, ' ').trim(), MAX_TEXT),
    textOnly: el.children.length === 0 && (el.textContent ?? '').trim().length > 0,
    html: shorten(clone.outerHTML, MAX_HTML),
    styles,
  }
}

function box(doc: Document, solid: boolean): HTMLElement {
  const el = doc.createElement('div')
  el.setAttribute(OVERLAY_ATTR, '')
  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '2147483647',
    pointerEvents: 'none',
    border: `${solid ? 2 : 1}px ${solid ? 'solid' : 'dashed'} ${ACCENT}`,
    background: solid ? 'transparent' : 'rgba(37, 99, 235, 0.06)',
    borderRadius: '2px',
    display: 'none',
  })
  const label = doc.createElement('span')
  Object.assign(label.style, {
    position: 'absolute',
    left: '-2px',
    bottom: '100%',
    padding: '1px 6px',
    font: '500 11px/16px Inter, system-ui, sans-serif',
    color: 'white',
    background: ACCENT,
    borderRadius: '3px 3px 0 0',
    whiteSpace: 'nowrap',
  })
  el.appendChild(label)
  doc.body.appendChild(el)
  return el
}

/** A guide box: its borders are the margin or padding, so it frames the element like devtools do */
function guide(doc: Document, tint: string): HTMLElement {
  const el = doc.createElement('div')
  el.setAttribute(OVERLAY_ATTR, '')
  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '2147483646',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    borderStyle: 'solid',
    borderColor: tint,
    display: 'none',
  })
  doc.body.appendChild(el)
  return el
}

function placeGuides(margin: HTMLElement, padding: HTMLElement, el: HTMLElement | null) {
  const computed = el?.isConnected ? el.ownerDocument.defaultView?.getComputedStyle(el) : null
  if (!el || !computed) {
    margin.style.display = 'none'
    padding.style.display = 'none'
    return
  }
  const r = el.getBoundingClientRect()
  const side = (prop: string) => Math.max(0, parseFloat(computed.getPropertyValue(prop)) || 0)
  const [mt, mr, mb, ml] = ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'].map(side)
  const [bt, br, bb, bl] = ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'].map(side)
  Object.assign(margin.style, {
    display: 'block',
    top: `${r.top - mt}px`,
    left: `${r.left - ml}px`,
    width: `${r.width + ml + mr}px`,
    height: `${r.height + mt + mb}px`,
    borderWidth: `${mt}px ${mr}px ${mb}px ${ml}px`,
  })
  Object.assign(padding.style, {
    display: 'block',
    top: `${r.top + bt}px`,
    left: `${r.left + bl}px`,
    width: `${r.width - bl - br}px`,
    height: `${r.height - bt - bb}px`,
    borderWidth: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'].map((p) => `${side(p)}px`).join(' '),
  })
}

function place(overlay: HTMLElement, el: HTMLElement | null) {
  if (!el || !el.isConnected) {
    overlay.style.display = 'none'
    return
  }
  const r = el.getBoundingClientRect()
  Object.assign(overlay.style, { display: 'block', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` })
  const name = el.getAttribute(COMPONENT_ATTR)
  ;(overlay.firstChild as HTMLElement).textContent = name ? `${el.tagName.toLowerCase()} · ${name}` : el.tagName.toLowerCase()
}

export interface Picker {
  setActive(active: boolean): void
  /** Show inspector edits on the selected element until they are reset */
  preview(style: Record<string, string>, text?: string): void
  /** Undo every preview on the selected element */
  reset(): void
  /** Select the element by its source location, e.g. after the preview reloaded */
  select(src: string, index?: number): void
  /** Show the margins and paddings of the selected element */
  setGuides(on: boolean): void
  deselect(): void
  destroy(): void
}

export function createPicker(doc: Document, post: (message: FromPreview) => void): Picker {
  const hoverBox = box(doc, false)
  const selectedBox = box(doc, true)
  const marginGuide = guide(doc, MARGIN_TINT)
  const paddingGuide = guide(doc, PADDING_TINT)
  let guides = false
  let active = false
  let hovered: HTMLElement | null = null
  let selected: HTMLElement | null = null
  let original: { style: string | null; text: string | null } | null = null
  // The text the preview put in, so a restore never overwrites text an HMR update brought
  let previewText: string | null = null
  // Where the selection comes from and what it shows, so a re-rendered element gets both again
  let source: { src: string; index: number } | null = null
  let shown: { style: Record<string, string>; text?: string } | null = null

  const attach = (el: HTMLElement | null) => {
    selected = el
    original = el ? { style: el.getAttribute('style'), text: el.children.length === 0 ? el.textContent : null } : null
    previewText = null
  }
  const apply = () => {
    if (!selected || !shown) return
    for (const [prop, value] of Object.entries(shown.style)) selected.style.setProperty(prop, value)
    if (shown.text !== undefined && selected.children.length === 0) {
      selected.textContent = shown.text
      previewText = shown.text
    }
  }
  // HMR and React re-renders can swap the element for a new one: look it up again
  const reattach = () => {
    if (!source || (selected && selected.isConnected)) return
    attach(withSource(doc, source.src)[source.index] ?? null)
    apply()
  }

  const reposition = () => {
    place(hoverBox, active ? hovered : null)
    place(selectedBox, selected)
    placeGuides(marginGuide, paddingGuide, guides ? selected : null)
  }

  const onMove = (e: MouseEvent) => {
    hovered = pickable(e.target)
    reposition()
  }
  const onClick = (e: MouseEvent) => {
    const el = pickable(e.target)
    // The preview stays inert while picking: no links, no buttons, no navigation
    e.preventDefault()
    e.stopPropagation()
    if (!el) return
    restore()
    const element = describe(el)
    attach(el)
    source = { src: element.src, index: element.index ?? 0 }
    shown = null
    reposition()
    post({ type: 'dos:picked', element })
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') post({ type: 'dos:cancel' })
  }

  const restore = () => {
    if (!selected || !original) return
    if (original.style === null) selected.removeAttribute('style')
    else selected.setAttribute('style', original.style)
    if (original.text !== null && previewText !== null && selected.textContent === previewText) selected.textContent = original.text
    previewText = null
  }

  const listen = (on: boolean) => {
    const handlers: [string, EventListener][] = [
      ['mousemove', onMove as EventListener],
      ['click', onClick as EventListener],
      ['keydown', onKey as EventListener],
    ]
    for (const [type, handler] of handlers) {
      if (on) doc.addEventListener(type, handler, true)
      else doc.removeEventListener(type, handler, true)
    }
  }
  const view = doc.defaultView
  view?.addEventListener('scroll', reposition, true)
  const observer = view ? new view.MutationObserver(() => {
    if (!source || selected?.isConnected) return
    reattach()
    reposition()
  }) : null
  observer?.observe(doc.body, { childList: true, subtree: true })
  view?.addEventListener('resize', reposition)

  return {
    setActive(next) {
      if (next === active) return
      active = next
      listen(active)
      doc.documentElement.style.cursor = active ? 'crosshair' : ''
      if (!active) hovered = null
      reposition()
    },
    preview(style, text) {
      reattach()
      restore()
      shown = { style, text }
      apply()
      reposition()
    },
    reset() {
      reattach()
      restore()
      shown = null
      reposition()
    },
    select(src, index = 0) {
      restore()
      source = { src, index }
      shown = null
      attach(withSource(doc, src)[index] ?? null)
      reposition()
    },
    setGuides(on) {
      guides = on
      reposition()
    },
    deselect() {
      restore()
      attach(null)
      source = null
      shown = null
      reposition()
    },
    destroy() {
      if (active) listen(false)
      observer?.disconnect()
      view?.removeEventListener('scroll', reposition, true)
      view?.removeEventListener('resize', reposition)
      doc.documentElement.style.cursor = ''
      hoverBox.remove()
      selectedBox.remove()
      marginGuide.remove()
      paddingGuide.remove()
    },
  }
}
