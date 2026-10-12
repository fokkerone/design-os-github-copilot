/**
 * Persona loading utilities
 *
 * File structure:
 * - product/personas/[persona-id].md - Persona (frontmatter, quote, job story, goals, pain points, evidence)
 *
 * Personas are created by /design-os:persona and linked from section specs via
 * "- Persona name — archetype (persona: persona-id)" bullets under ## Personas.
 * Parsing lives in src/lib/model/persona.ts, shared with scripts/context.mjs.
 */

import { parsePersona, type Persona } from './model/persona.ts'

export { parsePersona }
export type PersonaInfo = Persona

// Load persona files from product/personas at build time
const personaFiles = import.meta.glob('/product/personas/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const PRIORITY_ORDER = ['primary', 'secondary', 'supplemental', 'negative']

/**
 * Load a single persona by id
 */
export function loadPersona(personaId: string): PersonaInfo | null {
  const content = personaFiles[`/product/personas/${personaId}.md`]
  return content ? parsePersona(personaId, content) : null
}

/**
 * Load all personas, primary first
 */
export function loadAllPersonas(): PersonaInfo[] {
  const personas: PersonaInfo[] = []
  for (const [path, content] of Object.entries(personaFiles)) {
    const id = path.match(/\/product\/personas\/([^/]+)\.md$/)?.[1]
    if (id && id !== 'README') personas.push(parsePersona(id, content))
  }
  const rank = (persona: PersonaInfo) => {
    const index = PRIORITY_ORDER.indexOf(persona.priority)
    return index === -1 ? PRIORITY_ORDER.length : index
  }
  return personas.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}
