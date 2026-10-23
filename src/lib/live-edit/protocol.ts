/**
 * Live Edit: the messages between a step page and the preview iframe it embeds.
 * Both run on the same origin, every message is checked against it.
 */

/** What the picker reports about the element the user clicked */
export interface PickedElement {
  /** Source location from the dev-only Babel plugin, e.g. "src/sections/landing/components/Hero.tsx:42:7" */
  src: string
  /** Which of the elements with this source location (lists render one JSX element many times) */
  index?: number
  /** Component the element is written in */
  component: string | null
  /** Components from the outside in, e.g. ["AppShell", "LandingPage", "Hero"] */
  componentPath: string[]
  tag: string
  classes: string[]
  /** Visible text, shortened */
  text: string
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
  | { type: 'dos:preview'; style: Record<string, string>; text?: string }
  | { type: 'dos:reset' }
  /** Selects the element again after the preview reloaded */
  | { type: 'dos:select'; src: string; index?: number }
  | { type: 'dos:deselect' }
  /** Shows the margins and paddings of the selected element */
  | { type: 'dos:guides'; active: boolean }

/** Iframe → page */
export type FromPreview =
  | { type: 'dos:ready' }
  | { type: 'dos:picked'; element: PickedElement }
  | { type: 'dos:cancel' }
  | { type: 'dos:updated' }

const TYPES = new Set(['dos:pick', 'dos:preview', 'dos:reset', 'dos:select', 'dos:deselect', 'dos:guides', 'dos:ready', 'dos:picked', 'dos:cancel', 'dos:updated'])

/** The Live Edit message in an event, or null for anything else (other origins, other messages) */
export function readMessage<T extends ToPreview | FromPreview>(event: MessageEvent, origin = window.location.origin): T | null {
  if (event.origin !== origin) return null
  const data = event.data as { type?: unknown } | null
  return data && typeof data.type === 'string' && TYPES.has(data.type) ? (data as T) : null
}
