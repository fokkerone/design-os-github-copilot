import { describe, expect, it } from 'vitest'
import { formatAnchor, nextNumber, parseAnchor, parseCommentPage, serializeCommentPage, type DesignComment } from '@/lib/comments/format'

const comment = (over: Partial<DesignComment> = {}): DesignComment => ({
  number: 1,
  command: 'polish',
  status: 'open',
  text: 'Make the sign-in the primary action',
  element: '<Button> in LoginForm',
  anchor: { src: 'src/ui/button.tsx:30:10', index: 0, x: 33.1, y: 45.8 },
  created: '2026-10-24',
  notes: '',
  ...over,
})

const head = '---\ntitle: Comments — Account\nupdated: 2026-10-24\n---\n\n# Comments — Account\n\n## Summary\nAbout comments.'

describe('comment pages', () => {
  it('round-trips screens, comments, multi-line text and the agent notes', () => {
    const page = {
      head,
      screens: [
        {
          name: 'Login',
          last: 4,
          comments: [
            comment(),
            comment({ number: 4, command: null, status: 'resolved', text: 'Two lines\nof text', notes: '**Resolved:** 2026-10-25 — size lg, `LoginForm.tsx:40`' }),
          ],
        },
        { name: 'Profile', last: 1, comments: [comment({ command: 'audit', status: 'sent' })] },
      ],
    }
    const md = serializeCommentPage(page)
    expect(md).toContain('### #1 · polish · open')
    expect(md).toContain('### #4 · comment · resolved')
    expect(md).toContain('> Two lines\n> of text')
    expect(parseCommentPage(md)).toEqual(page)
  })

  it('keeps a deleted number taken', () => {
    const md = serializeCommentPage({ head, screens: [{ name: 'Login', last: 5, comments: [comment()] }] })
    const screen = parseCommentPage(md).screens[0]
    expect(screen.last).toBe(5)
    expect(nextNumber(screen)).toBe(6)
  })

  it('keeps Summary and Related in the head, also a heading inside the frontmatter', () => {
    const page = parseCommentPage('---\ntitle: x\nnote: "## not a screen"\n---\n\n# T\n\n## Summary\nText\n\n## Login\n')
    expect(page.screens.map((s) => s.name)).toEqual(['Login'])
    expect(page.head).toContain('## Summary')
  })

  it('formats and parses anchors, clamped to the box', () => {
    expect(formatAnchor({ src: 'src/a.tsx:1:2', index: 3, x: 120, y: -4 })).toBe('`src/a.tsx:1:2` #3 @ 100%,0%')
    expect(parseAnchor('`src/a.tsx:1:2` #3 @ 42.5%,61%')).toEqual({ src: 'src/a.tsx:1:2', index: 3, x: 42.5, y: 61 })
    expect(parseAnchor('nonsense')).toBeNull()
  })
})
