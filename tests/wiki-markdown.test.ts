import { describe, expect, it } from 'vitest'
import { createSlugger, createWikiMarked, extractWikiHeadings, slugify } from '../src/lib/wiki-markdown.ts'

const body = `Intro

## Summary
text

## Steps
### 1. Start the app
\`\`\`mermaid
flowchart TD
  A --> B
\`\`\`
\`\`\`bash
# not a heading
\`\`\`

## Summary
again

#### Too deep
`

describe('wiki headings', () => {
  it('slugifies like a heading anchor', () => {
    expect(slugify('1. Start the app')).toBe('1-start-the-app')
    expect(slugify('Rules & limits')).toBe('rules-limits')
    expect(slugify('Über uns')).toBe('uber-uns')
  })

  it('lists h2 and h3 with unique ids in document order and skips code', () => {
    expect(extractWikiHeadings(body)).toEqual([
      { id: 'section-summary', text: 'Summary', depth: 2 },
      { id: 'section-steps', text: 'Steps', depth: 2 },
      { id: 'section-1-start-the-app', text: '1. Start the app', depth: 3 },
      { id: 'section-summary-1', text: 'Summary', depth: 2 },
    ])
  })

  it('renders the same ids the table of contents links to', () => {
    const html = createWikiMarked(createSlugger()).parse(body, { async: false })
    for (const heading of extractWikiHeadings(body)) {
      expect(html).toContain(`id="${heading.id}"`)
    }
  })

  it('renders headings without ids unless asked', () => {
    expect(createWikiMarked().parse('## Summary', { async: false })).not.toContain('id=')
  })

  it('uses the label of a wikilink in the heading text', () => {
    expect(extractWikiHeadings('## See [[missing-page|the page]]')[0].text).toBe('See the page')
  })
})
