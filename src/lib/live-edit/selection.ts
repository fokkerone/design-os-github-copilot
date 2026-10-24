/**
 * Live Edit: an element picked in a preview, the inspector edits on it, and how both travel to the
 * chat agent. The context goes into the message text as a fenced `live-edit` block, so it works
 * without an attachment adapter and the agent reads it like any other prompt.
 */
import type { PickedElement } from './protocol'

/** Which preview the element was picked in */
export type LiveTarget = { kind: 'screen'; sectionId: string; screenDesignName: string } | { kind: 'shell' }

/** One inspector edit, expressed as a Tailwind class swap */
export interface LiveEdit {
  /** Inspector property, e.g. "font-size" */
  property: string
  /** The class it replaces, null when the element had none for this property */
  from: string | null
  /** The new class, e.g. "text-6xl"; for content edits the new text */
  to: string
  /** The CSS the preview shows meanwhile, e.g. { "font-size": "3.75rem" } */
  css: Record<string, string>
  /** Token the class stands for, e.g. "primary" or "radius-md": the agent names it in a `token:` comment */
  token?: string
  /** The `dark:` class swap that goes with it (semantic colors, shadows) */
  dark?: { from: string | null; to: string }
}

export interface LiveSelection {
  target: LiveTarget
  element: PickedElement
  edits: LiveEdit[]
}

export const LIVE_EDIT_COMMAND = '.claude/commands/design-os/live-edit.md'
const FENCE = 'live-edit'

/** "Hero › h1" — what the chip shows */
export function selectionLabel(selection: LiveSelection): string {
  const { component, tag } = selection.element
  return component ? `${component} › ${tag}` : tag
}

/** "src/.../Hero.tsx:42" without the column */
export function shortSource(src: string): string {
  return src.replace(/:\d+$/, '')
}

const q = (value: string) => JSON.stringify(value)
// A fence inside the html would end the block early
const unfence = (text: string) => text.replace(/```/g, "'''")

/** The fenced context block the agent reads */
export function serializeSelection(selection: LiveSelection): string {
  const { target, element, edits } = selection
  const lines = [
    target.kind === 'screen' ? 'target: screen-design' : 'target: shell',
    ...(target.kind === 'screen' ? [`section: ${target.sectionId}`, `screen: ${target.screenDesignName}`] : []),
    `source: ${element.src}`,
    `component: ${element.componentPath.join(' › ') || '(unknown)'}`,
    `element: ${element.tag}`,
    `classes: ${q(element.classes.join(' '))}`,
  ]
  if (element.text) lines.push(`text: ${q(element.text)}`)
  if (edits.length) {
    lines.push('edits:')
    for (const edit of edits) {
      const css = Object.entries(edit.css).map(([k, v]) => `${k}: ${v}`).join('; ')
      const raw = /\[.+\]/.test(edit.to)
      const notes = [
        edit.token && `token: ${edit.token}`,
        edit.token && raw && 'exact value',
        !edit.token && raw && 'not a token',
        css && `preview ${css}`,
      ].filter(Boolean)
      const dark = edit.dark ? `; dark ${q(edit.dark.from ?? '(none)')} -> ${q(edit.dark.to)}` : ''
      lines.push(`  - ${edit.property}: ${q(edit.from ?? '(none)')} -> ${q(edit.to)}${dark}${notes.length ? `  # ${notes.join('; ')}` : ''}`)
    }
  }
  lines.push('html: |', ...unfence(element.html).split('\n').map((l) => `  ${l}`))
  return ['```' + FENCE, ...lines, '```'].join('\n')
}

/** The request sent with "Apply with agent": the inspector edits are the whole change */
export const APPLY_EDITS_REQUEST = 'Apply the inspector edits to the source as listed.'

/** The chat message for a change request on a picked element */
export function buildLiveEditMessage(selection: LiveSelection, request: string): string {
  return `Follow the instructions in ${LIVE_EDIT_COMMAND}.\n\n${serializeSelection(selection)}\n\n${request.trim()}`
}

export interface ParsedLiveEditMessage {
  /** "Hero › h1" */
  label: string
  source: string
  edits: number
  context: string
  request: string
}

/** Reads a message built by `buildLiveEditMessage` back, so the thread shows a chip instead of the raw block */
export function parseLiveEditMessage(text: string): ParsedLiveEditMessage | null {
  const head = `Follow the instructions in ${LIVE_EDIT_COMMAND}.`
  if (!text.startsWith(head)) return null
  const match = text.slice(head.length).match(new RegExp('^\\s*```' + FENCE + '\\n([\\s\\S]*?)\\n```\\s*([\\s\\S]*)$'))
  if (!match) return null
  const [, context, request] = match
  const field = (name: string) => context.match(new RegExp(`^${name}: (.*)$`, 'm'))?.[1] ?? ''
  const component = field('component').split(' › ').at(-1) ?? ''
  const tag = field('element')
  return {
    label: component && component !== '(unknown)' ? `${component} › ${tag}` : tag,
    source: shortSource(field('source')),
    edits: (context.match(/^ {2}- /gm) ?? []).length,
    context,
    request: request.trim(),
  }
}
