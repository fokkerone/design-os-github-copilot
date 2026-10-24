/**
 * Comments on screen designs and the shell, as the wiki stores them: one page per section
 * (`wiki/comments/<section-id>.md`, `wiki/comments/shell.md`), one `## <Screen>` heading per
 * screen and one `### #<n> · <command> · <status>` entry per comment. Pure: the dev endpoint
 * (scripts/comments-store.mjs) writes with it, the page reads with it.
 *
 *   ### #3 · polish · open
 *   **Element:** LoginForm › button
 *   **Anchor:** `src/sections/account/components/LoginForm.tsx:40:9` #0 @ 42%,61%
 *   **Created:** 2026-10-24
 *
 *   > Make the sign-in button the clear primary action
 *
 * Lines after the quote (`**Resolved:** …`, findings of a check) belong to the agent and are kept
 * as they are.
 */

export type CommentStatus = 'open' | 'sent' | 'resolved'
export const STATUSES: CommentStatus[] = ['open', 'sent', 'resolved']
/** The command entry of a comment without an impeccable command */
export const NO_COMMAND = 'comment'

/** Where a comment sits: the element (source location and index) and the point in its box, in percent */
export interface CommentAnchor {
  src: string
  index: number
  x: number
  y: number
}

export interface DesignComment {
  number: number
  /** impeccable command ("polish"), or null for a plain comment */
  command: string | null
  status: CommentStatus
  text: string
  /** "LoginForm › button" */
  element: string
  anchor: CommentAnchor
  created: string
  /** What the agent wrote below the comment, verbatim */
  notes: string
}

export interface CommentPage {
  /** Everything before the first screen heading (frontmatter, title, summary) */
  head: string
  screens: CommentScreen[]
}

export interface CommentScreen {
  name: string
  comments: DesignComment[]
  /** The highest number ever given on this screen, so a deleted comment's number stays taken */
  last: number
}

const ENTRY = /^### #(\d+) · ([a-z-]+) · (open|sent|resolved)\s*$/
const ANCHOR = /^`([^`]+)` #(\d+) @ (\d+(?:\.\d+)?)%,(\d+(?:\.\d+)?)%$/
const LAST = /^<!-- last-number: (\d+) -->$/
const FIELD = /^\*\*(Element|Anchor|Created):\*\* (.*)$/

/** A clamped percentage with at most one decimal */
const percent = (value: number) => Math.round(Math.min(100, Math.max(0, value)) * 10) / 10

export function formatAnchor(anchor: CommentAnchor): string {
  return `\`${anchor.src}\` #${anchor.index} @ ${percent(anchor.x)}%,${percent(anchor.y)}%`
}

export function parseAnchor(text: string): CommentAnchor | null {
  const m = ANCHOR.exec(text.trim())
  return m ? { src: m[1], index: Number(m[2]), x: Number(m[3]), y: Number(m[4]) } : null
}

function parseEntry(number: number, command: string, status: CommentStatus, lines: string[]): DesignComment {
  const fields: Record<string, string> = {}
  const quote: string[] = []
  let i = 0
  for (; i < lines.length; i++) {
    const field = FIELD.exec(lines[i])
    if (field) fields[field[1]] = field[2]
    else if (lines[i].startsWith('>')) break
    else if (lines[i].trim() !== '') break
  }
  for (; i < lines.length && lines[i].startsWith('>'); i++) quote.push(lines[i].replace(/^> ?/, ''))
  return {
    number,
    command: command === NO_COMMAND ? null : command,
    status,
    text: quote.join('\n').trim(),
    element: fields.Element ?? '',
    anchor: parseAnchor(fields.Anchor ?? '') ?? { src: '', index: 0, x: 0, y: 0 },
    created: fields.Created ?? '',
    notes: lines.slice(i).join('\n').trim(),
  }
}

export function parseCommentPage(markdown: string): CommentPage {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  // Frontmatter may contain lines that look like headings: skip it before looking for screens
  let start = 0
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1)
    start = end > 0 ? end + 1 : 0
  }
  const firstScreen = lines.findIndex((l, i) => i >= start && l.startsWith('## ') && !/^## (Summary|Related)\b/.test(l))
  const head = (firstScreen < 0 ? lines : lines.slice(0, firstScreen)).join('\n').trimEnd()
  const screens: CommentPage['screens'] = []
  if (firstScreen < 0) return { head, screens }
  let screen: CommentScreen | null = null
  let entry: { number: number; command: string; status: CommentStatus; lines: string[] } | null = null
  const close = () => {
    if (entry && screen) screen.comments.push(parseEntry(entry.number, entry.command, entry.status, entry.lines))
    entry = null
  }
  for (const line of lines.slice(firstScreen)) {
    if (line.startsWith('## ')) {
      close()
      screen = { name: line.slice(3).trim(), comments: [], last: 0 }
      screens.push(screen)
      continue
    }
    const last = LAST.exec(line.trim())
    if (last && screen && !entry) {
      screen.last = Number(last[1])
      continue
    }
    const m = ENTRY.exec(line)
    if (m) {
      close()
      entry = { number: Number(m[1]), command: m[2], status: m[3] as CommentStatus, lines: [] }
      continue
    }
    entry?.lines.push(line)
  }
  close()
  for (const s of screens) s.last = Math.max(s.last, ...s.comments.map((c) => c.number))
  return { head, screens }
}

function serializeComment(c: DesignComment): string {
  const lines = [
    `### #${c.number} · ${c.command ?? NO_COMMAND} · ${c.status}`,
    `**Element:** ${c.element}`,
    `**Anchor:** ${formatAnchor(c.anchor)}`,
    `**Created:** ${c.created}`,
    '',
    ...c.text.split('\n').map((l) => (l ? `> ${l}` : '>')),
  ]
  if (c.notes) lines.push('', c.notes)
  return lines.join('\n')
}

export function serializeCommentPage(page: CommentPage): string {
  const parts = [page.head]
  for (const screen of page.screens) {
    parts.push(`## ${screen.name}\n<!-- last-number: ${Math.max(screen.last, ...screen.comments.map((c) => c.number))} -->`)
    for (const c of screen.comments) parts.push(serializeComment(c))
  }
  return `${parts.join('\n\n')}\n`
}

/** The next number on a screen: numbers count up and are never reused */
export function nextNumber(screen: CommentScreen): number {
  return Math.max(screen.last, ...screen.comments.map((c) => c.number)) + 1
}
