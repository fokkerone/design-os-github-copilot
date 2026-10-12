/**
 * User flow loading utilities
 *
 * File structure:
 * - product/flows/[flow-id].md - User flow (frontmatter, overview, Mermaid diagram, steps, edge cases)
 *
 * Flows are created by /design-os:userflow and linked from section specs via
 * "- Flow title (flow: flow-id)" bullets under ## User Flows.
 * Parsing lives in src/lib/model/flow.ts, shared with scripts/context.mjs.
 */

import { parseFlow, type Flow } from './model/flow.ts'

export { parseFlow }
export type FlowInfo = Flow

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
    if (id && id !== 'README') flows.push(parseFlow(id, content))
  }
  return flows.sort((a, b) => a.title.localeCompare(b.title))
}
