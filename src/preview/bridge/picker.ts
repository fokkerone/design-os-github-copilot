/**
 * Live Edit picker: runs inside the preview iframe. Plain DOM with inline styles, so it adds
 * nothing to the product UI it inspects (no classes, no React, no CSS).
 */
import { boxOf, buildTree, definitionOf, fiberName, hostsOf, serializeProps, type ComponentTree } from './component-tree'
import { applyOverrides, originalsOf, propRenderer } from './prop-override'
import type { FromPreview, PickedElement, TreeNode } from '@/lib/live-edit/protocol'

const SOURCE_ATTR = 'data-dos-src'
const COMPONENT_ATTR = 'data-dos-comp'
export const OVERLAY_ATTR = 'data-dos-overlay'
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
export function withSource(doc: Document, src: string): HTMLElement[] {
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
    dark: el.ownerDocument.documentElement.classList.contains('dark'),
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

type Box = { top: number; left: number; width: number; height: number }

function place(overlay: HTMLElement, box: Box | null, label = '') {
  if (!box) {
    overlay.style.display = 'none'
    return
  }
  Object.assign(overlay.style, { display: 'block', top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px` })
  const tag = overlay.firstChild as HTMLElement
  // Unchanged text stays untouched: every write is a mutation the tree observer would see
  if (tag.textContent !== label) tag.textContent = label
}

const elementBox = (el: HTMLElement | null): Box | null => (el?.isConnected ? el.getBoundingClientRect() : null)

function elementLabel(el: HTMLElement | null): string {
  if (!el) return ''
  const name = el.getAttribute(COMPONENT_ATTR)
  return name ? `${el.tagName.toLowerCase()} · ${name}` : el.tagName.toLowerCase()
}

/** "Button · LoginForm.tsx:40" */
const componentLabel = (node: TreeNode) => `${node.name} · ${(node.call ?? '').split('/').pop()?.replace(/:\d+$/, '') ?? ''}`

/** A component picked in the tree: its call site, definition and props, plus the styles of its outermost element */
export function describeComponent(tree: ComponentTree, node: TreeNode, overridable = false): PickedElement {
  const fiber = tree.fiber(node.id)!
  const host = hostsOf(fiber)[0]
  const base: PickedElement = host
    ? describe(host)
    : { src: '', component: null, componentPath: [], tag: '', classes: [], text: '', textOnly: false, html: '', styles: {} }
  const componentPath: string[] = []
  for (let n: TreeNode | undefined = node; n; n = tree.nodes.find((m) => m.id === n!.parentId)) {
    if (n.kind === 'component') componentPath.unshift(n.name)
  }
  return {
    ...base,
    kind: 'component',
    src: node.call ?? '',
    index: node.index,
    nodeId: node.id,
    component: fiberName(fiber),
    componentPath,
    definition: definitionOf(fiber),
    props: serializeProps(fiber.memoizedProps),
    values: plainValues(fiber.memoizedProps),
    overridable,
    // Text edits belong to the element, not to a component
    textOnly: false,
  }
}

/** The props the inspector can edit: plain values, without children, className and Live Edit attributes */
function plainValues(props: Record<string, unknown> | null): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {}
  for (const [key, value] of Object.entries(props ?? {})) {
    if (key === 'children' || key === 'className' || key.startsWith('data-dos-')) continue
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') out[key] = value
  }
  return out
}

export interface Picker {
  setActive(active: boolean): void
  /** Show inspector edits on the selected element (props on a component) until they are reset */
  preview(style: Record<string, string>, text?: string, props?: Record<string, unknown>): void
  /** Undo every preview on the selected element */
  reset(): void
  /** Select the element (component) by its source location (call site), e.g. after the preview reloaded */
  select(src: string, index?: number, kind?: 'element' | 'component'): void
  /** Send the component tree, e.g. when the page is ready for it */
  sendTree(): void
  /** Highlight a tree node, null removes the highlight */
  hover(id: string | null): void
  /** Select a tree node and report it like a click */
  selectNode(id: string): void
  /** Show the margins and paddings of the selected element */
  setGuides(on: boolean): void
  /** The prop edits went into the source: forget them without putting the old values back */
  commit(): void
  /** Report the selection again with what the source renders now */
  describeAgain(): void
  /** `keep`: leave the props the source renders now, the agent's edit arrived */
  deselect(keep?: boolean): void
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
  let source: { src: string; index: number; kind: 'element' | 'component' } | null = null
  let shown: { style: Record<string, string>; text?: string } | null = null
  // The component tree, rebuilt after renders; the tree node under the mouse in the tree panel
  let tree: ComponentTree = buildTree(doc)
  let sentTree = ''
  let hoveredNode: string | null = null
  // Props the preview sets on the selected component, live through React's DevTools internals
  let overrides: Record<string, unknown> | null = null
  // The source values they replace, put back when the inspector drops them
  let originals: Record<string, unknown> = {}
  const renderer = () => propRenderer(doc.defaultView)

  const rebuild = () => {
    tree = buildTree(doc)
    const json = JSON.stringify(tree.nodes)
    if (json !== sentTree) {
      sentTree = json
      post({ type: 'dos:tree', nodes: tree.nodes })
    }
  }
  const sourceNode = () => (source?.kind === 'component' ? tree.find('component', source.src, source.index) : undefined)
  // The fibers of a tree swap with every commit: override on the current one
  const currentFiber = () => {
    tree = buildTree(doc)
    const node = sourceNode()
    return node ? tree.fiber(node.id) : undefined
  }
  const applyProps = () => {
    const r = renderer()
    const fiber = overrides && r ? currentFiber() : undefined
    if (!r || !fiber || !overrides) return
    originals = originalsOf(fiber, Object.keys(overrides), originals)
    applyOverrides(r, fiber, overrides)
  }
  /** Back to the props in the source; `keep` when the source itself changed (the agent's edit arrived) */
  const releaseProps = (keep = false) => {
    const r = renderer()
    const fiber = overrides && r && !keep ? currentFiber() : undefined
    if (r && fiber) applyOverrides(r, fiber, originals)
    overrides = null
    originals = {}
  }

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
  const find = (src: string, index: number, kind: 'element' | 'component'): HTMLElement | null => {
    if (kind === 'element') return withSource(doc, src)[index] ?? null
    const node = tree.find('component', src, index)
    const fiber = node && tree.fiber(node.id)
    return fiber ? (hostsOf(fiber)[0] ?? null) : null
  }
  const reattach = () => {
    if (!source || (selected && selected.isConnected)) return
    if (source.kind === 'component') rebuild()
    attach(find(source.src, source.index, source.kind))
    apply()
  }

  const nodeBox = (id: string | undefined): Box | null => {
    const fiber = id ? tree.fiber(id) : undefined
    return fiber ? boxOf(fiber) : null
  }
  const reposition = () => {
    const hoverNode = hoveredNode ? tree.nodes.find((n) => n.id === hoveredNode) : undefined
    if (hoverNode) place(hoverBox, nodeBox(hoverNode.id), hoverNode.kind === 'component' ? componentLabel(hoverNode) : elementLabel(tree.fiber(hoverNode.id)?.stateNode as HTMLElement))
    else place(hoverBox, active ? elementBox(hovered) : null, elementLabel(hovered))
    const node = sourceNode()
    if (node) place(selectedBox, nodeBox(node.id), componentLabel(node))
    else place(selectedBox, elementBox(selected), elementLabel(selected))
    placeGuides(marginGuide, paddingGuide, guides ? selected : null)
  }

  const pickElement = (el: HTMLElement) => {
    releaseProps()
    restore()
    const element = describe(el)
    element.nodeId = tree.nodeOfElement(el)
    attach(el)
    source = { src: element.src, index: element.index ?? 0, kind: 'element' }
    shown = null
    reposition()
    post({ type: 'dos:picked', element })
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
    pickElement(el)
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
  let rebuildTimer: ReturnType<typeof setTimeout> | undefined
  const observer = view ? new view.MutationObserver((records) => {
    if (records.every((r) => (r.target as Element).closest?.(`[${OVERLAY_ATTR}]`) || (r.target.parentElement?.closest(`[${OVERLAY_ATTR}]`)))) return
    clearTimeout(rebuildTimer)
    rebuildTimer = setTimeout(() => {
      rebuild()
      // A render of the component around it hands in the source props again
      applyProps()
      reposition()
    }, 100)
    if (!source || selected?.isConnected) return
    reattach()
    reposition()
  }) : null
  // Class changes are renders too (a prop override changes a variant's classes)
  observer?.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
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
    preview(style, text, props) {
      reattach()
      restore()
      shown = { style, text }
      apply()
      // A prop that is no longer overridden gets its source value back
      const back = Object.fromEntries(Object.entries(originals).filter(([k]) => !props || !(k in props)))
      const r = renderer()
      const fiber = r && Object.keys(back).length ? currentFiber() : undefined
      if (r && fiber) applyOverrides(r, fiber, back)
      for (const k of Object.keys(back)) delete originals[k]
      overrides = props && Object.keys(props).length ? props : null
      applyProps()
      reposition()
    },
    reset() {
      reattach()
      releaseProps()
      restore()
      shown = null
      reposition()
    },
    select(src, index = 0, kind = 'element') {
      releaseProps()
      restore()
      source = { src, index, kind }
      shown = null
      if (kind === 'component') rebuild()
      attach(find(src, index, kind))
      reposition()
    },
    sendTree() {
      sentTree = ''
      rebuild()
    },
    hover(id) {
      hoveredNode = id
      reposition()
    },
    selectNode(id) {
      const node = tree.nodes.find((n) => n.id === id)
      const fiber = node && tree.fiber(id)
      if (!node || !fiber) return
      if (node.kind === 'element') {
        pickElement(fiber.stateNode as HTMLElement)
        return
      }
      releaseProps()
      restore()
      // Releasing rebuilt the tree: find the node again by what survives a rebuild
      const again = tree.find('component', node.call ?? '', node.index) ?? node
      const element = describeComponent(tree, again, !!renderer())
      attach(hostsOf(tree.fiber(again.id) ?? fiber)[0] ?? null)
      source = { src: node.call ?? '', index: node.index, kind: 'component' }
      shown = null
      reposition()
      post({ type: 'dos:picked', element })
    },
    setGuides(on) {
      guides = on
      reposition()
    },
    commit() {
      releaseProps(true)
    },
    describeAgain() {
      if (!source) return
      if (source.kind === 'element') {
        reattach()
        if (!selected) return
        const element = describe(selected)
        element.nodeId = tree.nodeOfElement(selected)
        post({ type: 'dos:picked', element })
        return
      }
      rebuild()
      const node = sourceNode()
      if (node) post({ type: 'dos:picked', element: describeComponent(tree, node, !!renderer()) })
    },
    deselect(keep) {
      releaseProps(keep)
      restore()
      attach(null)
      source = null
      shown = null
      reposition()
    },
    destroy() {
      releaseProps()
      if (active) listen(false)
      observer?.disconnect()
      clearTimeout(rebuildTimer)
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
