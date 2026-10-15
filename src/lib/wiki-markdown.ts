/**
 * Wiki markdown helpers shared by the page renderer and the table of contents.
 *
 * Heading ids are generated in exactly one place (the marked renderer below), so the
 * rendered anchors and the TOC links can never drift apart.
 */

import { Marked } from 'marked'
import { resolveWikiLink } from './wiki-loader.ts'

export interface WikiHeading {
  id: string
  text: string
  depth: number
}

/** Prefix keeps ids clear of DOM property names (DOMPurify drops those) and of the app's own ids */
const ID_PREFIX = 'section-'

export const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Replace [[wikilinks]] and ^[provenance] markers, leaving code untouched */
export function transformInline(text: string): string {
  return text
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, index) => {
      if (index % 2 === 1) return part
      return part
        .replace(/\[\[([^\]|\\]+?)(?:\\?\|([^\]]+))?\]\]/g, (_, target: string, alias?: string) => {
          const label = escapeHtml((alias || target.split('/').pop() || target).trim())
          const resolved = resolveWikiLink(target)
          return resolved
            ? `<a href="/wiki/${resolved}" data-wiki="${resolved}" class="wiki-link">${label}</a>`
            : `<span class="wiki-link-broken" title="No wiki page for ${escapeHtml(target)}">${label}</span>`
        })
        .replace(/\^\[(inferred|ambiguous)\]/g, '<span class="wiki-provenance">$1</span>')
    })
    .join('')
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

/** Plain text of rendered inline html, e.g. for a heading label */
function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Unique ids in document order: "summary", "summary-1", ... */
export function createSlugger(): (text: string) => string {
  const used = new Map<string, number>()
  return (text) => {
    const base = ID_PREFIX + (slugify(text) || 'heading')
    const count = used.get(base) ?? 0
    used.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }
}

/**
 * A marked instance whose headings carry anchor ids.
 * Pass one slugger across several `parse` calls to keep ids unique over the whole page.
 * Without a slugger, headings render without ids.
 */
export function createWikiMarked(slug?: (text: string) => string, onHeading?: (heading: WikiHeading) => void): Marked {
  return new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens)
        const text = plainText(html)
        if (!slug) return `<h${depth}>${html}</h${depth}>\n`
        const id = slug(text)
        onHeading?.({ id, text, depth })
        return `<h${depth} id="${id}">${html}</h${depth}>\n`
      },
    },
  })
}

/** Headings of a wiki page body (h2 and h3 by default), in the ids the renderer will produce */
export function extractWikiHeadings(markdown: string, maxDepth = 3): WikiHeading[] {
  const headings: WikiHeading[] = []
  const marked = createWikiMarked(createSlugger(), (heading) => headings.push(heading))
  marked.parse(transformInline(markdown), { async: false })
  return headings.filter((heading) => heading.depth >= 2 && heading.depth <= maxDepth)
}
