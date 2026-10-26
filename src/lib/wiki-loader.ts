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

import { parseFrontmatter, type FrontmatterValue } from './model/frontmatter.ts'
import { getWikiFiles, getWikiRevision } from './wiki-files.ts'

export { parseFrontmatter, type FrontmatterValue }

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

let parsed: { revision: number; pages: WikiPage[]; byPath: Map<string, WikiPage> } | null = null

/** The parsed pages, rebuilt after a hot update of the wiki files (src/lib/wiki-files.ts) */
function vault() {
  const revision = getWikiRevision()
  if (parsed?.revision !== revision) {
    const pages = Object.entries(getWikiFiles())
      .map(([filePath, md]) => parsePage(filePath, md))
      .sort((a, b) => a.path.localeCompare(b.path))
    parsed = { revision, pages, byPath: new Map(pages.map((page) => [page.path, page])) }
  }
  return parsed
}

export function getWikiPages(): WikiPage[] {
  return vault().pages
}

export function getWikiPage(path: string): WikiPage | null {
  return vault().byPath.get(path.replace(/\/$/, '')) || null
}

/** Domains shipped with the repository instead of compiled from sources */
export const SYSTEM_DOMAINS = ['how-to', 'comments']

/** Whether the vault holds any compiled knowledge (beyond Home, log and the shipped how-to guides) */
export function hasWikiContent(): boolean {
  return getContentPages().some((page) => !SYSTEM_DOMAINS.includes(page.domain))
}

/** Content pages: everything except indexes, the log and underscore files */
export function getContentPages(): WikiPage[] {
  return getWikiPages().filter((page) => !page.isIndex && page.domain !== '' && !page.domain.startsWith('_'))
}

/** Content pages grouped by domain folder, domains sorted by name, system domains last */
export function getWikiDomains(): { domain: string; pages: WikiPage[] }[] {
  const groups = new Map<string, WikiPage[]>()
  for (const page of getContentPages()) {
    groups.set(page.domain, [...(groups.get(page.domain) || []), page])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => Number(SYSTEM_DOMAINS.includes(a)) - Number(SYSTEM_DOMAINS.includes(b)) || a.localeCompare(b))
    .map(([domain, domainPages]) => ({ domain, pages: domainPages }))
}

/**
 * Resolve a [[wikilink]] target the way Obsidian does: by path first, then by
 * file name anywhere in the vault.
 */
export function resolveWikiLink(target: string): string | null {
  const clean = target.trim().replace(/\.md$/, '').replace(/#.*$/, '')
  const { pages, byPath } = vault()
  if (byPath.has(clean)) return clean
  const name = clean.split('/').pop()
  const byName = pages.filter((page) => page.path.split('/').pop() === name)
  return byName.length === 1 ? byName[0].path : null
}

/** Entries of wiki/log.md, newest first */
export function getWikiLog(): WikiLogEntry[] {
  const log = getWikiPage('log')
  if (!log) return []
  const entries: WikiLogEntry[] = []
  for (const match of log.body.matchAll(/^## \[(\d{4}-\d{2}-\d{2})\]\s+([\w-]+)\s*\|\s*(.+)$/gm)) {
    entries.push({ date: match[1], kind: match[2], text: match[3].trim() })
  }
  return entries.reverse()
}
