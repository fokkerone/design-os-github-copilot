/**
 * Comments, to the chat: one comment per message, as a fenced `design-comment` block the agent
 * reads with .claude/commands/design-os/comment.md.
 */
import type { PickedElement } from '@/lib/live-edit/protocol'
import type { LiveTarget } from '@/lib/live-edit/selection'
import { commentsPage } from './client'
import { commandOf } from './commands'
import { formatAnchor, type DesignComment } from './format'

export const COMMENT_COMMAND = '.claude/commands/design-os/comment.md'
const FENCE = 'design-comment'
const unfence = (text: string) => text.replace(/```/g, "'''")
const block = (name: string, text: string) => [`${name}: |`, ...unfence(text).split('\n').map((l) => `  ${l}`)]

export function serializeComment(comment: DesignComment, target: LiveTarget, element?: PickedElement | null, call?: string | null): string {
  const command = commandOf(comment.command)
  const lines = [
    `comment: ${comment.number}`,
    `page: ${commentsPage(target)}`,
    target.kind === 'screen' ? 'target: screen-design' : 'target: shell',
    ...(target.kind === 'screen' ? [`section: ${target.sectionId}`, `screen: ${target.screenDesignName}`] : []),
    command
      ? `command: /impeccable ${command.id}  # ${command.group.label}: ${command.group.edits ? 'edits the source' : 'reports findings, changes no file'}`
      : 'command: (none)  # a plain request',
    ...block('text', comment.text),
    `element: ${comment.element}`,
    `anchor: ${formatAnchor(comment.anchor)}`,
    ...(call ? [`call: ${call}  # where the component around the element is used: change it here unless every usage should change`] : []),
  ]
  if (element) {
    lines.push(`component: ${element.componentPath.join(' › ') || '(unknown)'}`, `classes: ${JSON.stringify(element.classes.join(' '))}`)
    lines.push(...block('html', element.html))
  } else lines.push('# the element was not found in the preview: look it up at the anchor')
  return ['```' + FENCE, ...lines, '```'].join('\n')
}

export function buildCommentMessage(comment: DesignComment, target: LiveTarget, element?: PickedElement | null, call?: string | null): string {
  return `Follow the instructions in ${COMMENT_COMMAND}.\n\n${serializeComment(comment, target, element, call)}`
}

/** Reads a message built by `buildCommentMessage` back, for the chip in the thread */
export function parseCommentMessage(text: string): { number: number; command: string | null; text: string; element: string; context: string } | null {
  const head = `Follow the instructions in ${COMMENT_COMMAND}.`
  if (!text.startsWith(head)) return null
  const match = text.slice(head.length).match(new RegExp('^\\s*```' + FENCE + '\\n([\\s\\S]*?)\\n```'))
  if (!match) return null
  const context = match[1]
  const field = (name: string) => context.match(new RegExp(`^${name}: (.*)$`, 'm'))?.[1] ?? ''
  const body = context.match(/^text: \|\n((?: {2}.*\n?)*)/m)?.[1] ?? ''
  return {
    number: Number(field('comment')),
    command: field('command').match(/^\/impeccable ([a-z-]+)/)?.[1] ?? null,
    text: body.split('\n').map((l) => l.replace(/^ {2}/, '')).join('\n').trim(),
    element: field('element'),
    context,
  }
}
