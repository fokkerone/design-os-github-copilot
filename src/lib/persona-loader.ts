/**
 * Persona loading utilities
 *
 * File structure:
 * - product/personas/[persona-id].md - Persona (frontmatter, quote, job story, goals, pain points, evidence)
 *
 * Personas are created by /design-os:persona and linked from section specs via
 * "- Persona name — archetype (persona: persona-id)" bullets under ## Personas.
 */

import { parseFrontmatter, type FrontmatterValue } from '@/lib/wiki-loader'

export interface PersonaInfo {
  id: string
  name: string
  archetype: string
  kind: string
  priority: string
  status: string
  confidence: string
  quote: string
  jobStory: string
}

// Load persona files from product/personas at build time
const personaFiles = import.meta.glob('/product/personas/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function asString(value: FrontmatterValue | undefined): string {
  return typeof value === 'string' ? value : ''
}

/**
 * Parse a persona markdown file into PersonaInfo
 */
export function parsePersona(id: string, md: string): PersonaInfo {
  const { frontmatter, body } = parseFrontmatter(md)
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim()
  const quote = body.match(/^>\s*"(.+)"\s*$/m)?.[1]?.trim() || ''
  const jobStory = body.match(/## Job Story\s*\n+([\s\S]*?)(?=\n## |\n#[^#]|$)/)?.[1]?.trim() || ''

  return {
    id,
    name: asString(frontmatter.name) || heading || id,
    archetype: asString(frontmatter.archetype),
    kind: asString(frontmatter.kind) || 'proto',
    priority: asString(frontmatter.priority),
    status: asString(frontmatter.status) || 'draft',
    confidence: asString(frontmatter.confidence) || 'low',
    quote,
    // "**When** x, **I want to** y" -> "When x, I want to y"
    jobStory: jobStory.replace(/\*\*/g, ''),
  }
}

/**
 * Load a single persona by id
 */
export function loadPersona(personaId: string): PersonaInfo | null {
  const content = personaFiles[`/product/personas/${personaId}.md`]
  return content ? parsePersona(personaId, content) : null
}
