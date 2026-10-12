/**
 * Section spec parsing (product/sections/[section-id]/spec.md).
 * Pure module: no Vite APIs, so scripts and tests can import it directly.
 */

import type { ParsedSpec, PersonaLink, UserFlowItem } from '../../types/section.ts'

/**
 * Split a User Flows bullet into text and an optional linked flow id
 * e.g., "Checkout — cart to confirmation (flow: checkout)" -> { text: "Checkout — cart to confirmation", flowId: "checkout" }
 */
function parseUserFlowItem(bullet: string): UserFlowItem {
  const match = bullet.match(/^(.*?)\s*\(flow:\s*([a-z0-9-]+)\s*\)\s*$/i)
  if (!match) return { text: bullet, flowId: null }
  return { text: match[1].trim(), flowId: match[2].toLowerCase() }
}

/**
 * Split a Personas bullet into text and an optional persona id
 * e.g., "Ana — The cautious first-timer (persona: cautious-first-timer)" -> { text: "Ana — The cautious first-timer", personaId: "cautious-first-timer" }
 */
function parsePersonaLink(bullet: string): PersonaLink {
  const match = bullet.match(/^(.*?)\s*\(persona:\s*([a-z0-9-]+)\s*\)\s*$/i)
  if (!match) return { text: bullet, personaId: null }
  return { text: match[1].trim(), personaId: match[2].toLowerCase() }
}

/**
 * Parse spec.md content into ParsedSpec structure
 *
 * Expected format:
 * # Section Specification
 *
 * ## Overview
 * [Brief description of the section]
 *
 * ## User Flows
 * - Flow 1
 * - Flow 2 — short summary (flow: flow-id)   <- links product/flows/flow-id.md
 *
 * ## Personas (optional)
 * - Persona name — archetype (persona: persona-id)   <- links product/personas/persona-id.md
 *
 * ## UI Requirements
 * - Requirement 1
 * - Requirement 2
 *
 * ## Configuration (optional)
 * - shell: false (to disable app shell wrapping for this section's screen designs)
 */
export function parseSpec(md: string): ParsedSpec | null {
  if (!md || !md.trim()) return null

  try {
    // Extract title from first # heading
    const titleMatch = md.match(/^#\s+(.+)$/m)
    const title = titleMatch?.[1]?.trim() || 'Section Specification'

    // Extract overview - content between ## Overview and next ##
    const overviewMatch = md.match(/## Overview\s*\n+([\s\S]*?)(?=\n## |\n#[^#]|$)/)
    const overview = overviewMatch?.[1]?.trim() || ''

    // Extract user flows - bullet list after ## User Flows
    const userFlowsSection = md.match(/## User Flows\s*\n+([\s\S]*?)(?=\n## |\n#[^#]|$)/)
    const userFlows: string[] = []
    const userFlowItems: UserFlowItem[] = []

    if (userFlowsSection?.[1]) {
      const lines = userFlowsSection[1].split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('- ')) {
          const item = parseUserFlowItem(trimmed.slice(2).trim())
          userFlows.push(item.text)
          userFlowItems.push(item)
        }
      }
    }

    // Extract personas - bullet list after ## Personas
    const personasSection = md.match(/## Personas\s*\n+([\s\S]*?)(?=\n## |\n#[^#]|$)/)
    const personas: PersonaLink[] = []

    if (personasSection?.[1]) {
      for (const line of personasSection[1].split('\n')) {
        const trimmed = line.trim()
        if (trimmed.startsWith('- ')) personas.push(parsePersonaLink(trimmed.slice(2).trim()))
      }
    }

    // Extract UI requirements - bullet list after ## UI Requirements
    const uiReqSection = md.match(/## UI Requirements\s*\n+([\s\S]*?)(?=\n## |\n#[^#]|$)/)
    const uiRequirements: string[] = []

    if (uiReqSection?.[1]) {
      const lines = uiReqSection[1].split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('- ')) {
          uiRequirements.push(trimmed.slice(2).trim())
        }
      }
    }

    // Extract configuration - check for shell: false
    // Look for "shell: false" or "- shell: false" anywhere in the document
    const shellDisabled = /(?:^|\n)\s*-?\s*shell\s*:\s*false/i.test(md)
    const useShell = !shellDisabled

    return { title, overview, userFlows, userFlowItems, personas, uiRequirements, useShell }
  } catch {
    return null
  }
}
