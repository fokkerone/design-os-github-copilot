/**
 * Persona parsing (product/personas/[persona-id].md).
 * The file format is defined in .claude/skills/designos-persona/SKILL.md.
 * Pure module: no Vite APIs, so scripts and tests can import it directly.
 */

import { asList, asString, parseFrontmatter } from './frontmatter.ts'
import { bullets, isBlank, labeledBullets, plain, section, table } from './markdown.ts'

export interface PersonaPainPoint {
  id: string
  painPoint: string
  workaround: string
  need: string
  evidence: string
}

export interface PersonaAssumption {
  id: string
  assumption: string
  /** assumption | hypothesis | signal | firsthand | pattern */
  evidenceLevel: string
  source: string
  howToValidate: string
}

export interface PersonaDimension {
  dimension: string
  low: string
  high: string
  /** Position on the 1–5 scale, or null when not a number */
  position: number | null
}

export interface PersonaImplication {
  kind: 'do' | 'dont'
  text: string
}

export interface Persona {
  id: string
  name: string
  archetype: string
  kind: string
  priority: string
  status: string
  confidence: string
  /** Section ids from the frontmatter */
  sections: string[]
  /** Flow ids from the frontmatter */
  flows: string[]
  artifacts: string[]
  updated: string
  quote: string
  overview: string
  jobStory: string
  snapshot: Record<string, string>
  goals: Record<string, string>
  behaviors: string[]
  dimensions: PersonaDimension[]
  painPoints: PersonaPainPoint[]
  contextOfUse: Record<string, string>
  accessibility: Record<string, string>
  implications: PersonaImplication[]
  assumptions: PersonaAssumption[]
  openQuestions: string[]
}

/**
 * Parse a persona markdown file
 */
export function parsePersona(id: string, md: string): Persona {
  const { frontmatter, body } = parseFrontmatter(md.replace(/\r\n/g, '\n'))
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim()
  const quote = body.match(/^>\s*"(.+)"\s*$/m)?.[1]?.trim() || ''

  const implications: PersonaImplication[] = bullets(section(body, 'Design Implications')).flatMap((bullet) => {
    const match = bullet.match(/^\*\*(Do|Don['’]t):?\*\*:?\s*(.*)$/i)
    if (!match) return []
    return [{ kind: match[1].toLowerCase() === 'do' ? ('do' as const) : ('dont' as const), text: match[2].trim() }]
  })

  return {
    id,
    name: asString(frontmatter.name) || heading || id,
    archetype: asString(frontmatter.archetype),
    kind: asString(frontmatter.kind) || 'proto',
    priority: asString(frontmatter.priority),
    status: asString(frontmatter.status) || 'draft',
    confidence: asString(frontmatter.confidence) || 'low',
    sections: asList(frontmatter.sections),
    flows: asList(frontmatter.flows),
    artifacts: asList(frontmatter.artifacts),
    updated: asString(frontmatter.updated),
    quote,
    overview: section(body, 'Overview'),
    // "**When** x, **I want to** y" -> "When x, I want to y"
    jobStory: section(body, 'Job Story').replace(/\*\*/g, ''),
    snapshot: labeledBullets(section(body, 'Snapshot')),
    goals: labeledBullets(section(body, 'Goals')),
    behaviors: bullets(section(body, 'Thinking Style & Behaviors')),
    dimensions: table(section(body, 'Behavioral Dimensions'))
      .filter((row) => !isBlank(row['dimension'] ?? ''))
      .map((row) => {
        const position = Number(plain(row['position'] ?? ''))
        return {
          dimension: plain(row['dimension']),
          low: plain(row['1'] ?? ''),
          high: plain(row['5'] ?? ''),
          position: Number.isFinite(position) && position >= 1 && position <= 5 ? position : null,
        }
      }),
    painPoints: table(section(body, 'Needs & Pain Points'))
      .filter((row) => !isBlank(row['#'] ?? ''))
      .map((row) => ({
        id: plain(row['#']),
        painPoint: plain(row['pain point'] ?? ''),
        workaround: plain(row['current workaround'] ?? ''),
        need: plain(row['need'] ?? ''),
        evidence: plain(row['evidence'] ?? ''),
      })),
    contextOfUse: labeledBullets(section(body, 'Context of Use')),
    accessibility: labeledBullets(section(body, 'Accessibility & Inclusion')),
    implications,
    assumptions: table(section(body, 'Assumptions & Evidence'))
      .filter((row) => !isBlank(row['#'] ?? ''))
      .map((row) => ({
        id: plain(row['#']),
        assumption: plain(row['assumption'] ?? ''),
        evidenceLevel: plain(row['evidence level'] ?? '').toLowerCase(),
        source: plain(row['source'] ?? ''),
        howToValidate: plain(row['how to validate'] ?? ''),
      })),
    openQuestions: bullets(section(body, 'Open Questions')).map((item) => item.replace(/^\[[ x]\]\s*/i, '')),
  }
}
