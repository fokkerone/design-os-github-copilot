/**
 * Live Edit: the messages between a step page and the preview iframe it embeds.
 * Both run on the same origin, every message is checked against it.
 */

/** One node of the component tree (src/lib/live-edit/component-tree.ts) */
export interface TreeNode {
  /** Valid until the next tree the preview sends */
  id: string
  parentId: string | null
  /** Component name ("Button") or tag ("div") */
  name: string
  kind: 'component' | 'element'
  /** Where the component is called, e.g. "src/sections/account/components/LoginForm.tsx:40:9" */
  call?: string
  /** Where the element is written */
  src?: string
  /** Which of the nodes with this call site or source (lists render one JSX element many times) */
  index: number
  depth: number
}

/** What the picker reports about the element or component the user selected */
export interface PickedElement {
  /** An element (the default) or a component picked in the tree */
  kind?: 'element' | 'component'
  /**
   * Source location from the dev-only Babel plugin, e.g. "src/sections/landing/components/Hero.tsx:42:7".
   * For a component its call site.
   */
  src: string
  /** Which of the elements (components) with this source location (lists render one JSX element many times) */
  index?: number
  /** The tree node, to reveal it in the tree */
  nodeId?: string
  /** Component only: where its own markup is written, e.g. "src/ui/button.tsx:41:5" */
  definition?: string
  /** Component only: its props, e.g. [["variant", '"outline"'], ["onClick", "ƒ"]] */
  props?: [string, string][]
  /** Component only: the props with a plain value (string, number, boolean), as they are */
  values?: Record<string, string | number | boolean | null>
  /** Component only: the preview can change its props live */
  overridable?: boolean
  /** Component the element is written in */
  component: string | null
  /** Components from the outside in, e.g. ["AppShell", "LandingPage", "Hero"] */
  componentPath: string[]
  tag: string
  classes: string[]
  /** Visible text, shortened */
  text: string
  /** True when the preview renders in dark mode, so the inspector previews the dark values */
  dark?: boolean
  /** True when the element holds only text, so its content can be edited in place */
  textOnly: boolean
  /** outerHTML, shortened */
  html: string
  /** Computed styles the inspector shows */
  styles: Record<string, string>
}

/** Page → iframe */
export type ToPreview =
  | { type: 'dos:pick'; active: boolean }
  /** Inspector edits: CSS and text on the element, props on a component (undefined removes one) */
  | { type: 'dos:preview'; style: Record<string, string>; text?: string; props?: Record<string, unknown> }
  | { type: 'dos:reset' }
  /** Selects the element (component) again after the preview reloaded */
  | { type: 'dos:select'; src: string; index?: number; kind?: 'element' | 'component' }
  /** Highlights a tree node in the preview, null removes it */
  | { type: 'dos:hover'; id: string | null }
  /** Selects a tree node; the preview answers with dos:picked */
  | { type: 'dos:select-node'; id: string }
  /** `keep`: the agent's change arrived, the preview keeps what the source now renders */
  | { type: 'dos:deselect'; keep?: boolean }
  /** Shows the margins and paddings of the selected element */
  | { type: 'dos:guides'; active: boolean }

/** Iframe → page */
export type FromPreview =
  | { type: 'dos:ready' }
  | { type: 'dos:picked'; element: PickedElement }
  | { type: 'dos:cancel' }
  | { type: 'dos:updated' }
  /** The component tree, after every render */
  | { type: 'dos:tree'; nodes: TreeNode[] }

const TYPES = new Set(['dos:pick', 'dos:preview', 'dos:reset', 'dos:select', 'dos:deselect', 'dos:guides', 'dos:hover', 'dos:select-node', 'dos:tree', 'dos:ready', 'dos:picked', 'dos:cancel', 'dos:updated'])

/** The Live Edit message in an event, or null for anything else (other origins, other messages) */
export function readMessage<T extends ToPreview | FromPreview>(event: MessageEvent, origin = window.location.origin): T | null {
  if (event.origin !== origin) return null
  const data = event.data as { type?: unknown } | null
  return data && typeof data.type === 'string' && TYPES.has(data.type) ? (data as T) : null
}
