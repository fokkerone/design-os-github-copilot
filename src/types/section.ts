/**
 * Section types for Design OS v2
 */

export interface SectionData {
  sectionId: string
  spec: string | null
  specParsed: ParsedSpec | null
  data: Record<string, unknown> | null
  screenDesigns: ScreenDesignInfo[]
  screenshots: ScreenshotInfo[]
}

export interface UserFlowItem {
  /** Bullet text with the `(flow: id)` marker removed */
  text: string
  /** Id of a linked flow in product/flows/[flow-id].md, or null for an inline bullet */
  flowId: string | null
}

export interface PersonaLink {
  /** Bullet text with the `(persona: id)` marker removed */
  text: string
  /** Id of a persona in product/personas/[persona-id].md, or null for a plain bullet */
  personaId: string | null
}

export interface ParsedSpec {
  title: string
  overview: string
  userFlows: string[]
  /** Same bullets as userFlows, with linked flow ids resolved */
  userFlowItems: UserFlowItem[]
  /** Bullets under ## Personas */
  personas: PersonaLink[]
  uiRequirements: string[]
  /** Whether screen designs for this section should be wrapped in the app shell. Defaults to true. */
  useShell: boolean
}

export interface ScreenDesignInfo {
  name: string
  path: string
  componentName: string
}

export interface ScreenshotInfo {
  name: string
  path: string
  url: string
}
