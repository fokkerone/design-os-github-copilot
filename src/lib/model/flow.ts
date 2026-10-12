/**
 * User flow parsing (product/flows/[flow-id].md).
 * The file format is defined in .claude/skills/designos-userflow/SKILL.md.
 * Pure module: no Vite APIs, so scripts and tests can import it directly.
 */

import { asList, asString, parseFrontmatter } from './frontmatter.ts'
import { bullets, isBlank, labeledBullets, plain, section, table } from './markdown.ts'

export interface FlowStep {
  /** Step id as written in the table, e.g. "S1" */
  id: string
  title: string
  userAction: string
  systemResponse: string
  state: string
  /** Section id from the "Section / Screen" column, or null when the step names none */
  sectionId: string | null
  /** Screen design name from the "Section / Screen" column, or null when the step names none */
  screen: string | null
  rules: string[]
}

export interface FlowEdgeCase {
  id: string
  failure: string
  trigger: string
  handling: string
  /** Step id the user returns to, or null */
  returnsTo: string | null
}

/** One row of the hand-maintained "Prototype Mapping" table */
export interface FlowMappingRow {
  stepId: string
  sectionId: string | null
  screen: string | null
  /** exists | partial | gap | planned | new-section, as written by the flow command */
  status: string
  missing: string
}

export interface FlowTransition {
  from: string
  to: string
  /** Edge label, e.g. "yes" or "card declined" */
  label: string
  /** Dotted edges in the diagram are failure or recovery paths */
  kind: 'happy' | 'failure'
}

export interface FlowContext {
  user: string
  intent: string
  trigger: string
  success: string
  userState: string
}

export interface Flow {
  id: string
  title: string
  status: string
  mode: string
  /** Section ids from the frontmatter */
  sections: string[]
  /** Persona ids from the frontmatter */
  personas: string[]
  artifacts: string[]
  updated: string
  overview: string
  context: FlowContext
  rules: string[]
  mermaid: string | null
  steps: FlowStep[]
  edgeCases: FlowEdgeCase[]
  mapping: FlowMappingRow[]
  /** Edges between step, edge-case, start and done nodes, read from the diagram */
  transitions: FlowTransition[]
  openQuestions: string[]
}

/**
 * Split a "Section / Screen" cell
 * e.g. "`checkout` / `PaymentForm`" -> { sectionId: "checkout", screen: "PaymentForm" }
 */
export function parseScreenRef(cell: string): { sectionId: string | null; screen: string | null } {
  if (isBlank(cell)) return { sectionId: null, screen: null }
  const [first, second] = plain(cell)
    .split('/')
    .map((part) => part.trim().replace(/\.tsx$/, ''))
  if (second === undefined) {
    // A lone PascalCase name is a screen; a lone kebab-case name is a section
    return /^[A-Z]/.test(first) ? { sectionId: null, screen: first } : { sectionId: first, screen: null }
  }
  return { sectionId: isBlank(first) ? null : first, screen: isBlank(second) ? null : second }
}

const NODE_SHAPE = /([A-Za-z_][\w-]*)\s*(\[\[[^\]]*\]\]|\(\[[^\]]*\]\)|\["[^"]*"\]|\{"[^"]*"\}|\[[^\]]*\]|\{[^}]*\}|\([^)]*\))/g
const ARROW = /\s*(--\s*"([^"]*)"\s*-->|-\.\s*"([^"]*)"\s*\.->|-\.->\|([^|]*)\||-->\|([^|]*)\||-\.->|-->)\s*/

/**
 * Read the edges of a flowchart written to the conventions in the userflow skill.
 * Node shapes are stripped first, then each line is read as `id arrow id [arrow id ...]`.
 */
export function parseTransitions(mermaid: string | null): FlowTransition[] {
  if (!mermaid) return []
  const transitions: FlowTransition[] = []

  for (const rawLine of mermaid.split('\n')) {
    const line = rawLine.trim()
    if (!line.includes('->') || /^(classDef|class|style|linkStyle|subgraph|%%)/.test(line)) continue

    const parts = line.replace(NODE_SHAPE, '$1').split(ARROW)
    // split() with capture groups yields: id, arrow, label, label, label, label, id, ...
    for (let index = 0; index + 6 < parts.length; index += 6) {
      const from = parts[index]?.trim()
      const to = parts[index + 6]?.trim()
      const arrow = parts[index + 1] ?? ''
      if (!from || !to || !/^[\w-]+$/.test(from) || !/^[\w-]+$/.test(to)) continue
      transitions.push({
        from,
        to,
        label: (parts[index + 2] ?? parts[index + 3] ?? parts[index + 4] ?? parts[index + 5] ?? '').trim(),
        kind: arrow.startsWith('-.') ? 'failure' : 'happy',
      })
    }
  }
  return transitions
}

/**
 * Parse a flow markdown file
 */
export function parseFlow(id: string, md: string): Flow {
  const { frontmatter, body } = parseFrontmatter(md.replace(/\r\n/g, '\n'))
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim()
  const mermaid = body.match(/```mermaid\s*\n([\s\S]*?)```/)?.[1]?.trim() || null
  const context = labeledBullets(section(body, 'Context'))

  const steps: FlowStep[] = table(section(body, 'Steps'))
    .filter((row) => !isBlank(row['#'] ?? ''))
    .map((row) => ({
      id: plain(row['#']),
      title: plain(row['step'] ?? ''),
      userAction: plain(row['user action'] ?? ''),
      systemResponse: plain(row['system response'] ?? ''),
      state: plain(row['state'] ?? ''),
      ...parseScreenRef(row['section / screen'] ?? ''),
      rules: isBlank(row['rules'] ?? '')
        ? []
        : plain(row['rules'])
            .split(/[,\s]+/)
            .filter(Boolean),
    }))

  const edgeCases: FlowEdgeCase[] = table(section(body, 'Edge Cases'))
    .filter((row) => !isBlank(row['#'] ?? ''))
    .map((row) => ({
      id: plain(row['#']),
      failure: plain(row['failure'] ?? ''),
      trigger: plain(row['trigger'] ?? ''),
      handling: plain(row['handling'] ?? ''),
      returnsTo: isBlank(row['returns to'] ?? '') ? null : plain(row['returns to']),
    }))

  const mapping: FlowMappingRow[] = table(section(body, 'Prototype Mapping'))
    .filter((row) => !isBlank(row['step'] ?? ''))
    .map((row) => ({
      stepId: plain(row['step']),
      sectionId: isBlank(row['section'] ?? '') ? null : plain(row['section']),
      screen: isBlank(row['screen design'] ?? '') ? null : plain(row['screen design']).replace(/\.tsx$/, ''),
      status: plain(row['status'] ?? '').toLowerCase(),
      missing: isBlank(row['missing'] ?? '') ? '' : plain(row['missing']),
    }))

  return {
    id,
    title: asString(frontmatter.title) || heading || id,
    status: asString(frontmatter.status) || 'planned',
    mode: asString(frontmatter.mode),
    sections: asList(frontmatter.sections),
    personas: asList(frontmatter.personas),
    artifacts: asList(frontmatter.artifacts),
    updated: asString(frontmatter.updated),
    overview: section(body, 'Overview'),
    context: {
      user: context['user'] ?? '',
      intent: context['intent'] ?? '',
      trigger: context['trigger'] ?? '',
      success: context['success'] ?? '',
      userState: context['user state'] ?? '',
    },
    rules: bullets(section(body, 'Rules')),
    mermaid,
    steps,
    edgeCases,
    mapping,
    transitions: parseTransitions(mermaid),
    openQuestions: bullets(section(body, 'Open Questions')).map((item) => item.replace(/^\[[ x]\]\s*/i, '')),
  }
}
