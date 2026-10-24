import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { buildCommentMessage, COMMENT_COMMAND, parseCommentMessage } from '@/lib/comments/message'
import { COMMAND_GROUPS } from '@/lib/comments/commands'
import type { DesignComment } from '@/lib/comments/format'

const comment: DesignComment = {
  number: 3,
  command: 'audit',
  status: 'open',
  text: 'Check contrast\nand focus',
  element: '<Button> in LoginForm',
  anchor: { src: 'src/ui/button.tsx:30:10', index: 0, x: 33.1, y: 45.8 },
  created: '2026-10-24',
  notes: '',
}
const target = { kind: 'screen', sectionId: 'account', screenDesignName: 'Login' } as const

describe('comment message', () => {
  it('names the command file, the wiki page, the command group and the call site', () => {
    const text = buildCommentMessage(comment, target, null, 'src/sections/account/components/LoginForm.tsx:40:9')
    expect(text.startsWith(`Follow the instructions in ${COMMENT_COMMAND}.`)).toBe(true)
    expect(text).toContain('page: wiki/comments/account.md')
    expect(text).toContain('command: /impeccable audit  # Check: reports findings, changes no file')
    expect(text).toContain('call: src/sections/account/components/LoginForm.tsx:40:9')
    expect(text).toContain('text: |\n  Check contrast\n  and focus')
  })

  it('reads its own message back for the chip', () => {
    expect(parseCommentMessage(buildCommentMessage(comment, { kind: 'shell' }))).toMatchObject({
      number: 3,
      command: 'audit',
      text: 'Check contrast\nand focus',
      element: '<Button> in LoginForm',
    })
    expect(parseCommentMessage('hello')).toBeNull()
  })

  it('a plain comment has no command', () => {
    expect(buildCommentMessage({ ...comment, command: null }, target)).toContain('command: (none)')
  })

  it('the command file exists and covers every offered command, and forbids the impeccable setup commands', () => {
    expect(existsSync(COMMENT_COMMAND)).toBe(true)
    const doc = readFileSync(COMMENT_COMMAND, 'utf8')
    for (const group of COMMAND_GROUPS) for (const c of group.commands) expect(doc).toContain(`\`${c.id}\``)
    expect(doc).toMatch(/Never\*\* run `init`, `document`, `shape`, `craft`, `live`, `generate`/)
    expect(existsSync('.github/agents/comment.agent.md')).toBe(true)
  })
})
