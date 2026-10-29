/**
 * Live Edit: the React component tree of the preview, like the React DevTools show it. Runs inside
 * the preview iframe and reads React's fibers (dev build). Only the product UI is shown:
 * components called in the product folders (`data-dos-call`, from scripts/babel-source-attr.mjs)
 * and the DOM elements written there (`data-dos-src`). Routers, providers, library internals and
 * the Design OS wrappers are left out, their children move up.
 */
import type { TreeNode } from '@/lib/live-edit/protocol'

export const CALL_ATTR = 'data-dos-call'
const NAME_ATTR = 'data-dos-name'
const SOURCE_ATTR = 'data-dos-src'
const COMPONENT_ATTR = 'data-dos-comp'
const MAX_PROP = 80

/** The parts of a React fiber the tree reads */
export interface Fiber {
  tag: number
  type: unknown
  memoizedProps: Record<string, unknown> | null
  stateNode: unknown
  child: Fiber | null
  sibling: Fiber | null
  return?: Fiber | null
  /** Dev builds: the component whose render created this element */
  _debugOwner?: Fiber | null
}

// React's work tags (react-reconciler/src/ReactWorkTags)
const FUNCTION = 0
const CLASS = 1
const HOST_ROOT = 3
const FORWARD_REF = 11
const MEMO = 14
const SIMPLE_MEMO = 15
const COMPOSITE = new Set([FUNCTION, CLASS, FORWARD_REF, MEMO, SIMPLE_MEMO])

const isElement = (value: unknown): value is HTMLElement => !!value && (value as Node).nodeType === 1
const isHost = (fiber: Fiber) => typeof fiber.type === 'string' && isElement(fiber.stateNode)

type Named = { displayName?: string; name?: string; render?: Named; type?: Named }

/** A component type's name, through memo() and forwardRef() */
function typeName(type: unknown): string | undefined {
  if (!type || typeof type === 'string') return (type as string) || undefined
  const t = type as Named
  return t.displayName || t.name || typeName(t.render) || typeName(t.type)
}

/** "Button": as written in the JSX (Babel), else the component's own name */
export function fiberName(fiber: Fiber): string {
  const written = fiber.memoizedProps?.[NAME_ATTR]
  return (typeof written === 'string' && written) || typeName(fiber.type) || 'Anonymous'
}

/** The current HostRoot fiber of the React root in a document */
export function rootFiber(doc: Document): Fiber | null {
  const candidates = [doc.getElementById('root'), ...doc.body.children]
  for (const el of candidates) {
    if (!el) continue
    const key = Object.keys(el).find((k) => k.startsWith('__reactContainer$'))
    const fiber = key ? ((el as unknown as Record<string, Fiber>)[key] ?? null) : null
    if (!fiber) continue
    // The container keeps the fiber of the first render; the FiberRoot knows the current one
    const current = fiber.tag === HOST_ROOT ? (fiber.stateNode as { current?: Fiber } | null)?.current : null
    return current ?? fiber
  }
  return null
}

/** The outermost DOM elements a fiber renders */
export function hostsOf(fiber: Fiber): HTMLElement[] {
  if (isHost(fiber)) return [fiber.stateNode as HTMLElement]
  const hosts: HTMLElement[] = []
  for (let c = fiber.child; c; c = c.sibling) hosts.push(...hostsOf(c))
  return hosts
}

/** The box around everything a fiber renders, null when it renders nothing visible */
export function boxOf(fiber: Fiber): { top: number; left: number; width: number; height: number } | null {
  const rects = hostsOf(fiber)
    .filter((el) => el.isConnected)
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 || r.height > 0)
  if (rects.length === 0) return null
  const top = Math.min(...rects.map((r) => r.top))
  const left = Math.min(...rects.map((r) => r.left))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  const right = Math.max(...rects.map((r) => r.right))
  return { top, left, width: right - left, height: bottom - top }
}

const shorten = (text: string) => (text.length > MAX_PROP ? `${text.slice(0, MAX_PROP)}…` : text)

/** Props as the inspector shows them: `variant: "outline"`, `onClick: ƒ`; children, className and Live Edit attributes left out */
export function serializeProps(props: Record<string, unknown> | null): [string, string][] {
  const out: [string, string][] = []
  for (const [key, value] of Object.entries(props ?? {})) {
    if (key === 'children' || key === 'className' || key === 'key' || key === 'ref' || key.startsWith('data-dos-') || value === undefined) continue
    let shown: string
    if (value === null) shown = 'null'
    else if (typeof value === 'string') shown = JSON.stringify(shorten(value))
    else if (typeof value === 'number' || typeof value === 'boolean') shown = String(value)
    else if (typeof value === 'function') shown = 'ƒ'
    else if (Array.isArray(value)) shown = `[${value.length}]`
    else if ((value as { $$typeof?: unknown }).$$typeof) {
      const element = value as { type?: unknown; props?: Record<string, unknown> }
      const written = element.props?.[NAME_ATTR]
      shown = `<${(typeof written === 'string' && written) || typeName(element.type) || 'Component'} />`
    } else shown = '{…}'
    out.push([key, shown])
  }
  return out
}

export interface ComponentTree {
  nodes: TreeNode[]
  fiber(id: string): Fiber | undefined
  /** The node of a DOM element the picker selected */
  nodeOfElement(el: Element): string | undefined
  /** A node by what survives a re-render: kind, call site or source, and index */
  find(kind: TreeNode['kind'], key: string, index: number): TreeNode | undefined
}

/** Builds the tree from the current fibers; ids are only valid until the next build */
export function buildTree(doc: Document): ComponentTree {
  const nodes: TreeNode[] = []
  const fibers = new Map<string, Fiber>()
  const ofElement = new Map<Element, string>()
  const counts = new Map<string, number>()
  // Wrappers for top-level nodes: the component that renders them (the screen design, the shell preview)
  const wrappers = new Map<Fiber, TreeNode>()

  const add = (fiber: Fiber, node: Omit<TreeNode, 'id' | 'index'>, countKey: string): TreeNode => {
    const index = counts.get(countKey) ?? 0
    counts.set(countKey, index + 1)
    const full: TreeNode = { ...node, id: String(nodes.length), index }
    nodes.push(full)
    fibers.set(full.id, fiber)
    return full
  }

  const wrapperOf = (owner: Fiber | null): TreeNode | null => {
    if (!owner) return null
    let node = wrappers.get(owner)
    if (!node) {
      node = add(owner, { parentId: null, name: fiberName(owner), kind: 'component', depth: 0 }, `root:${fiberName(owner)}`)
      wrappers.set(owner, node)
    }
    return node
  }

  const visit = (fiber: Fiber, parent: TreeNode | null, owner: Fiber | null) => {
    const props = fiber.memoizedProps
    let node: TreeNode | null = null
    const call = COMPOSITE.has(fiber.tag) && typeof props?.[CALL_ATTR] === 'string' ? (props[CALL_ATTR] as string) : null
    const src = isHost(fiber) ? (fiber.stateNode as HTMLElement).getAttribute(SOURCE_ATTR) : null
    // A component that hands its props on (memo, Slot, a wrapper spreading props) repeats the call site
    if ((call && parent?.call !== call) || src) {
      const top = parent ?? wrapperOf(owner)
      const depth = top ? top.depth + 1 : 0
      node = call
        ? add(fiber, { parentId: top?.id ?? null, name: fiberName(fiber), kind: 'component', call, depth }, `component:${call}`)
        : add(fiber, { parentId: top?.id ?? null, name: fiber.type as string, kind: 'element', src: src!, depth }, `element:${src}`)
      if (src) ofElement.set(fiber.stateNode as Element, node.id)
    }
    const nextOwner = COMPOSITE.has(fiber.tag) ? fiber : owner
    for (let c = fiber.child; c; c = c.sibling) visit(c, node ?? parent, node || parent ? null : nextOwner)
  }

  const root = rootFiber(doc)
  for (let c = root?.child ?? null; c; c = c.sibling) visit(c, null, null)

  return {
    nodes,
    fiber: (id) => fibers.get(id),
    nodeOfElement: (el) => ofElement.get(el),
    find: (kind, key, index) => nodes.find((n) => n.kind === kind && (kind === 'component' ? n.call : n.src) === key && n.index === index),
  }
}

/** Where a component's own markup is written: its first element marked with its name */
export function definitionOf(fiber: Fiber): string | undefined {
  // The Babel plugin names the function the markup is written in: CardHeader for <Card.Header>
  const written = fiberName(fiber)
  const names = [...new Set([written, written.replace(/\./g, ''), written.split('.').pop(), typeName(fiber.type)].filter(Boolean))]
  for (const host of hostsOf(fiber)) {
    for (const name of names) {
      const el = host.getAttribute(COMPONENT_ATTR) === name ? host : host.querySelector(`[${COMPONENT_ATTR}="${name}"]`)
      const src = el?.getAttribute(SOURCE_ATTR)
      if (src) return src
    }
  }
  return undefined
}
