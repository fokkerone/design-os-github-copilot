/**
 * Frontmatter parsing shared by the wiki, flow and persona loaders.
 * Pure module: no Vite APIs, so scripts and tests can import it directly.
 */

export type FrontmatterValue = string | string[] | Record<string, string>

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

export function asString(value: FrontmatterValue | undefined): string {
  return typeof value === 'string' ? value : ''
}

export function asList(value: FrontmatterValue | undefined): string[] {
  if (Array.isArray(value)) return value
  return typeof value === 'string' && value ? [value] : []
}
