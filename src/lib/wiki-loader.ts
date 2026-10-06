/**
 * Project brain (wiki/) loading utilities
 *
 * File structure:
 * - wiki/Home.md, wiki/log.md          - Vault index and activity log
 * - wiki/[domain]/*.md                 - Compiled pages (flows, data, decisions, ...)
 * - wiki/_meta/taxonomy.md             - Domains and tags
 *
 * Templates, raw sources and archives are not loaded.
 */

export type FrontmatterValue = string | string[] | Record<string, string>

export interface WikiPage {
  /** Path without extension, relative to wiki/, e.g. "flows/submit-meter-reading" */
  path: string
  /** First folder, or "" for pages at the vault root */
  domain: string
  title: string
  summary: string
  tags: string[]
  updated: string
  frontmatter: Record<string, FrontmatterValue>
  body: string
  /** Home.md of the vault or of a domain */
  isIndex: boolean
}

export interface WikiLogEntry {
  date: string
  kind: string
  text: string
}

const wikiFiles = import.meta.glob(
  ['/wiki/**/*.md', '!/wiki/_templates/**', '!/wiki/raw/**', '!/wiki/_archives/**', '!/wiki/.obsidian/**'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, '')
}

/**
 * Parse the YAML frontmatter subset the wiki uses: scalars, inline lists,
 * and one level of nested keys (e.g. provenance).
 */
export function parseFrontmatter(md: string): { frontmatter: Record<string, FrontmatterValue>; body: string } {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { frontmatter: {}, body: md }

  const frontmatter: Record<string, FrontmatterValue> = {}
  let parent: string | null = null

  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const nested = line.match(/^\s+([\w-]+):\s*(.*)$/)
    if (nested && parent) {
      const group = frontmatter[parent]
      if (typeof group === 'object' && !Array.isArray(group)) group[nested[1]] = stripQuotes(nested[2].trim())
      continue
    }
    const entry = line.match(/^([\w-]+):\s*(.*)$/)
    if (!entry) continue
    const [, key, rawValue] = entry
    const value = rawValue.replace(/\s+#.*$/, '').trim()
    if (value === '') {
      frontmatter[key] = {}
      parent = key
    } else if (value.startsWith('[') && value.endsWith(']')) {
      frontmatter[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => stripQuotes(item.trim()))
        .filter(Boolean)
      parent = null
    } else {
      frontmatter[key] = stripQuotes(value)
      parent = null
    }
  }

  return { frontmatter, body: md.slice(match[0].length) }
}

function asString(value: FrontmatterValue | undefined): string {
  return typeof value === 'string' ? value : ''
}

function asList(value: FrontmatterValue | undefined): string[] {
  if (Array.isArray(value)) return value
  return typeof value === 'string' && value ? [value] : []
}

function parsePage(filePath: string, md: string): WikiPage {
  const path = filePath.replace(/^\/wiki\//, '').replace(/\.md$/, '')
  const { frontmatter, body } = parseFrontmatter(md)
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim()
  const segments = path.split('/')

  return {
    path,
    domain: segments.length > 1 ? segments[0] : '',
    title: asString(frontmatter.title) || heading || segments[segments.length - 1],
    summary: asString(frontmatter.summary),
    tags: asList(frontmatter.tags),
    updated: asString(frontmatter.updated),
    frontmatter,
    body,
    isIndex: segments[segments.length - 1] === 'Home',
  }
}

const pages: WikiPage[] = Object.entries(wikiFiles)
  .map(([filePath, md]) => parsePage(filePath, md))
  .sort((a, b) => a.path.localeCompare(b.path))

const pagesByPath = new Map(pages.map((page) => [page.path, page]))

export function getWikiPages(): WikiPage[] {
  return pages
}

export function getWikiPage(path: string): WikiPage | null {
  return pagesByPath.get(path.replace(/\/$/, '')) || null
}

/** Whether the vault holds any compiled knowledge (beyond Home and log) */
export function hasWikiContent(): boolean {
  return getContentPages().length > 0
}

/** Content pages: everything except indexes, the log and underscore files */
export function getContentPages(): WikiPage[] {
  return pages.filter((page) => !page.isIndex && page.domain !== '' && !page.domain.startsWith('_'))
}

/** Content pages grouped by domain folder, domains sorted by name */
export function getWikiDomains(): { domain: string; pages: WikiPage[] }[] {
  const groups = new Map<string, WikiPage[]>()
  for (const page of getContentPages()) {
    groups.set(page.domain, [...(groups.get(page.domain) || []), page])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([domain, domainPages]) => ({ domain, pages: domainPages }))
}

/**
 * Resolve a [[wikilink]] target the way Obsidian does: by path first, then by
 * file name anywhere in the vault.
 */
export function resolveWikiLink(target: string): string | null {
  const clean = target.trim().replace(/\.md$/, '').replace(/#.*$/, '')
  if (pagesByPath.has(clean)) return clean
  const name = clean.split('/').pop()
  const byName = pages.filter((page) => page.path.split('/').pop() === name)
  return byName.length === 1 ? byName[0].path : null
}

/** Entries of wiki/log.md, newest first */
export function getWikiLog(): WikiLogEntry[] {
  const log = pagesByPath.get('log')
  if (!log) return []
  const entries: WikiLogEntry[] = []
  for (const match of log.body.matchAll(/^## \[(\d{4}-\d{2}-\d{2})\]\s+([\w-]+)\s*\|\s*(.+)$/gm)) {
    entries.push({ date: match[1], kind: match[2], text: match[3].trim() })
  }
  return entries.reverse()
}
