/**
 * User flow loading utilities
 *
 * File structure:
 * - product/flows/[flow-id].md - User flow (frontmatter, overview, Mermaid diagram, steps, edge cases)
 *
 * Flows are created by /design-os:userflow and linked from section specs via
 * "- Flow title (flow: flow-id)" bullets under ## User Flows.
 */

export interface FlowInfo {
  id: string
  title: string
  status: string
  sections: string[]
  overview: string
  mermaid: string | null
}

// Load flow files from product/flows at build time
const flowFiles = import.meta.glob('/product/flows/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * Extract flow ID from a file path
 * e.g., "/product/flows/checkout.md" -> "checkout"
 */
function extractFlowId(path: string): string | null {
  const match = path.match(/\/product\/flows\/([^/]+)\.md$/)
  return match?.[1] || null
}

/**
 * Read a scalar or inline-list value from YAML frontmatter
 */
function frontmatterValue(frontmatter: string, key: string): string {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  return match?.[1]?.trim().replace(/^["']|["']$/g, '') || ''
}

function frontmatterList(frontmatter: string, key: string): string[] {
  const value = frontmatterValue(frontmatter, key)
  if (!value.startsWith('[')) return value ? [value] : []
  return value
    .slice(1, -1)
    .split(',')
    .map((item) => item.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean)
}

/**
 * Parse a flow markdown file into FlowInfo
 */
export function parseFlow(id: string, md: string): FlowInfo {
  const frontmatterMatch = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n/)
  const frontmatter = frontmatterMatch?.[1] || ''
  const body = frontmatterMatch ? md.slice(frontmatterMatch[0].length) : md

  const headingMatch = body.match(/^#\s+(.+)$/m)
  const title = frontmatterValue(frontmatter, 'title') || headingMatch?.[1]?.trim() || id

  const overviewMatch = body.match(/## Overview\s*\n+([\s\S]*?)(?=\n## |\n#[^#]|$)/)
  const mermaidMatch = body.match(/```mermaid\s*\n([\s\S]*?)```/)

  return {
    id,
    title,
    status: frontmatterValue(frontmatter, 'status') || 'planned',
    sections: frontmatterList(frontmatter, 'sections'),
    overview: overviewMatch?.[1]?.trim() || '',
    mermaid: mermaidMatch?.[1]?.trim() || null,
  }
}

/**
 * Load a single flow by id
 */
export function loadFlow(flowId: string): FlowInfo | null {
  const content = flowFiles[`/product/flows/${flowId}.md`]
  return content ? parseFlow(flowId, content) : null
}

/**
 * Load all flows
 */
export function loadAllFlows(): FlowInfo[] {
  const flows: FlowInfo[] = []
  for (const [path, content] of Object.entries(flowFiles)) {
    const id = extractFlowId(path)
    if (id) flows.push(parseFlow(id, content))
  }
  return flows.sort((a, b) => a.title.localeCompare(b.title))
}
