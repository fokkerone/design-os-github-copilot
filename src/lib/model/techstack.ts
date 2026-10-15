/**
 * Tech stack parsing (product/techstack/techstack.md).
 * The file format is defined in .claude/skills/designos-techstack/SKILL.md.
 * Pure module: no Vite APIs, so scripts and tests can import it directly.
 *
 * The tech stack decides what the prototype and the export are built with.
 * When the step has not been run, DEFAULT_TECHSTACK applies (shadcn/ui on React, Tailwind v4, lucide).
 */

import { asString, parseFrontmatter } from './frontmatter.ts'
import { bullets, isBlank, plain, section, table } from './markdown.ts'

export type TechstackGroup = 'runtime' | 'ui' | 'app' | 'tooling' | 'target'

export interface TechstackArea {
  id: string
  label: string
  group: TechstackGroup
  /** Fixed areas are the runtime of the Design OS prototype and cannot be changed by the tech stack step */
  fixed: boolean
  /** Used when the file does not decide the area. `null` means: undecided, so no dependency is added */
  default: string | null
  /** What the area covers, as a hint for the interview */
  hint: string
}

export const TECHSTACK_GROUPS: Record<TechstackGroup, string> = {
  runtime: 'Prototype runtime (fixed)',
  ui: 'UI',
  app: 'App patterns',
  tooling: 'Quality and tooling',
  target: 'Target codebase',
}

/**
 * Every area the tech stack step can decide. The ids are stable: commands, scripts and the app refer to them.
 */
export const TECHSTACK_AREAS: TechstackArea[] = [
  { id: 'framework', label: 'Framework', group: 'runtime', fixed: true, default: 'React 19 + Vite', hint: 'The prototype is a React and Vite app' },
  { id: 'language', label: 'Language', group: 'runtime', fixed: true, default: 'TypeScript (strict)', hint: 'Screen designs and types are TypeScript' },
  { id: 'styling', label: 'Styling', group: 'runtime', fixed: true, default: 'Tailwind CSS v4', hint: 'Utility classes only, no tailwind.config.js' },
  { id: 'ui-library', label: 'UI library', group: 'ui', fixed: false, default: 'shadcn/ui', hint: 'shadcn/ui is the default' },
  { id: 'ui-base', label: 'Component base', group: 'ui', fixed: false, default: 'Radix UI', hint: 'shadcn/ui only: Radix UI or Base UI' },
  { id: 'ui-style', label: 'UI style', group: 'ui', fixed: false, default: 'new-york', hint: 'shadcn/ui only: the visual style or preset' },
  { id: 'icons', label: 'Icons', group: 'ui', fixed: false, default: 'lucide-react', hint: 'Icon set used in shell and screens' },
  { id: 'forms', label: 'Forms', group: 'app', fixed: false, default: null, hint: 'Form handling, e.g. react-hook-form' },
  { id: 'validation', label: 'Validation', group: 'app', fixed: false, default: null, hint: 'Schema validation, e.g. zod' },
  { id: 'data-fetching', label: 'Data fetching', group: 'app', fixed: false, default: null, hint: 'The prototype reads sample data, so this mostly matters for the export' },
  { id: 'state', label: 'State', group: 'app', fixed: false, default: null, hint: 'Beyond useState and context' },
  { id: 'tables', label: 'Tables', group: 'app', fixed: false, default: null, hint: 'Data tables, e.g. TanStack Table' },
  { id: 'charts', label: 'Charts', group: 'app', fixed: false, default: null, hint: 'Charts, e.g. Recharts' },
  { id: 'animation', label: 'Animation', group: 'app', fixed: false, default: null, hint: 'CSS only, or a library such as Motion' },
  { id: 'routing', label: 'Routing', group: 'app', fixed: false, default: 'State-based navigation in the clickdummy', hint: 'How the clickdummy and the target app navigate' },
  { id: 'i18n', label: 'i18n', group: 'app', fixed: false, default: null, hint: 'Internationalization' },
  { id: 'package-manager', label: 'Package manager', group: 'tooling', fixed: false, default: 'npm', hint: 'npm, pnpm, yarn or bun' },
  { id: 'testing', label: 'Testing', group: 'tooling', fixed: false, default: null, hint: 'Unit and end-to-end tests of the target app' },
  { id: 'linting', label: 'Linting', group: 'tooling', fixed: false, default: null, hint: 'ESLint, Biome, Prettier' },
  { id: 'storybook', label: 'Storybook', group: 'tooling', fixed: false, default: null, hint: 'Component workbench' },
  { id: 'a11y', label: 'Accessibility', group: 'tooling', fixed: false, default: 'WCAG 2.2 AA', hint: 'Conformance level screens are designed for' },
  { id: 'browser-support', label: 'Browser support', group: 'tooling', fixed: false, default: null, hint: 'Evergreen browsers, or older ones that limit CSS features' },
  { id: 'target-framework', label: 'Target framework', group: 'target', fixed: false, default: null, hint: 'What the exported components are integrated into, e.g. Next.js' },
]

export interface TechstackDecision {
  area: string
  choice: string
  /** default | chosen | existing | constraint */
  source: string
  rationale: string
}

export interface TechstackRegistry {
  name: string
  /** shadcn-registry | github-repo | npm-package | design-system | other */
  kind: string
  location: string
  usedFor: string
}

export interface TechstackPackage {
  name: string
  purpose: string
  area: string
  /** Computed by scripts/techstack.mjs from the prototype's package.json, never stored in the file */
  installed: boolean
}

export interface Techstack {
  /** `file` when product/techstack/techstack.md exists, `default` when the step has not been run */
  origin: 'file' | 'default'
  status: string
  updated: string
  summary: string
  /** One entry per area of TECHSTACK_AREAS, file decisions merged over the defaults */
  resolved: ResolvedDecision[]
  /** Decisions as written in the file, including areas that are not in TECHSTACK_AREAS */
  decisions: TechstackDecision[]
  registries: TechstackRegistry[]
  packages: TechstackPackage[]
  constraints: string[]
  openQuestions: string[]
}

export interface ResolvedDecision extends TechstackDecision {
  label: string
  group: TechstackGroup
  fixed: boolean
  /** `false` for an area nobody decided and that has no default: no dependency is added */
  decided: boolean
}

export interface TechstackProblem {
  severity: 'error' | 'warning'
  area?: string
  message: string
}

const areaById = new Map(TECHSTACK_AREAS.map((area) => [area.id, area]))

/** `UI library`, `ui_library` and `` `ui-library` `` all name the area `ui-library` */
export function areaId(cell: string): string {
  const value = plain(cell).toLowerCase().replace(/[\s_]+/g, '-')
  if (areaById.has(value)) return value
  const byLabel = TECHSTACK_AREAS.find((area) => area.label.toLowerCase() === plain(cell).toLowerCase())
  return byLabel?.id ?? value
}

/** True for choices that mean "nothing": none, n/a, undecided and unfilled placeholders */
export function isNoChoice(choice: string): boolean {
  return isBlank(choice) || /^(none|n\/a|undecided|not decided|tbd|no)$/i.test(plain(choice))
}

function resolve(decisions: TechstackDecision[]): ResolvedDecision[] {
  return TECHSTACK_AREAS.map((area) => {
    const decision = decisions.find((entry) => entry.area === area.id)
    if (decision && !isBlank(decision.choice)) {
      return {
        ...decision,
        label: area.label,
        group: area.group,
        fixed: area.fixed,
        decided: !isNoChoice(decision.choice),
      }
    }
    return {
      area: area.id,
      choice: area.default ?? 'none',
      source: area.default === null ? 'undecided' : 'default',
      rationale: '',
      label: area.label,
      group: area.group,
      fixed: area.fixed,
      decided: area.default !== null,
    }
  })
}

/** What applies when the tech stack step has not been run */
export function defaultTechstack(): Techstack {
  return {
    origin: 'default',
    status: 'default',
    updated: '',
    summary: '',
    resolved: resolve([]),
    decisions: [],
    registries: [],
    packages: [],
    constraints: [],
    openQuestions: [],
  }
}

/**
 * Parse a tech stack markdown file
 */
export function parseTechstack(md: string): Techstack {
  const { frontmatter, body } = parseFrontmatter(md.replace(/\r\n/g, '\n'))

  const decisions: TechstackDecision[] = table(section(body, 'Decisions'))
    .map((row) => ({
      area: areaId(row.area ?? ''),
      choice: plain(row.choice ?? ''),
      source: plain(row.source ?? '').toLowerCase() || 'chosen',
      rationale: plain(row.rationale ?? ''),
    }))
    .filter((decision) => decision.area)

  const registries: TechstackRegistry[] = table(section(body, 'Registries and Repos'))
    .map((row) => ({
      name: plain(row.name ?? ''),
      kind: plain(row.kind ?? '').toLowerCase(),
      location: plain(row.location ?? ''),
      usedFor: plain(row['used for'] ?? ''),
    }))
    .filter((registry) => !isBlank(registry.name))

  const packages: TechstackPackage[] = table(section(body, 'Packages'))
    .map((row) => ({
      name: plain(row.package ?? ''),
      purpose: plain(row.purpose ?? ''),
      area: row.area ? areaId(row.area) : '',
      installed: false,
    }))
    .filter((entry) => !isBlank(entry.name))

  const clean = (block: string) => bullets(block).filter((bullet) => !isBlank(bullet) && !/^_.*_$/.test(bullet))

  return {
    origin: 'file',
    status: asString(frontmatter.status) || 'draft',
    updated: asString(frontmatter.updated),
    summary: section(body, 'Summary').replace(/\n+/g, ' ').trim(),
    resolved: resolve(decisions),
    decisions,
    registries,
    packages,
    constraints: clean(section(body, 'Constraints')),
    openQuestions: clean(section(body, 'Open Questions')),
  }
}

/**
 * Check a tech stack against the rules of the prototype.
 * Errors make `npm run techstack -- --check` fail, warnings are reported.
 */
export function checkTechstack(stack: Techstack): TechstackProblem[] {
  const problems: TechstackProblem[] = []
  if (stack.origin === 'default') return problems

  const seen = new Set<string>()
  for (const decision of stack.decisions) {
    const area = areaById.get(decision.area)
    if (!area) {
      problems.push({ severity: 'error', area: decision.area, message: `Unknown area "${decision.area}". Use one of: ${TECHSTACK_AREAS.map(({ id }) => id).join(', ')}.` })
      continue
    }
    if (seen.has(decision.area)) problems.push({ severity: 'error', area: decision.area, message: `Area "${decision.area}" is decided twice.` })
    seen.add(decision.area)
    if (isBlank(decision.choice)) problems.push({ severity: 'error', area: decision.area, message: `Area "${decision.area}" has no choice. Write "none" if nothing is used.` })
    if (area.fixed && area.default && !isBlank(decision.choice) && decision.choice !== area.default) {
      problems.push({
        severity: 'error',
        area: decision.area,
        message: `"${area.label}" is the runtime of the Design OS prototype and stays "${area.default}". Record the target codebase's choice in "target-framework" instead.`,
      })
    }
  }

  const byId = new Map(stack.resolved.map((decision) => [decision.area, decision]))
  const library = byId.get('ui-library')
  if (library && !/shadcn/i.test(library.choice) && !isNoChoice(library.choice)) {
    const installable = stack.packages.some((entry) => entry.area === 'ui-library')
    if (!installable) {
      problems.push({ severity: 'error', area: 'ui-library', message: `"${library.choice}" needs a row in "Packages" (area ui-library) so the design steps know what to install.` })
    }
  }
  if (library && isNoChoice(library.choice)) {
    problems.push({ severity: 'warning', area: 'ui-library', message: 'No UI library: screens are built with Tailwind and native elements only.' })
  }

  for (const decision of stack.decisions) {
    if (decision.source === 'default' || isNoChoice(decision.choice)) continue
    if (!areaById.get(decision.area)?.default && !stack.packages.some((entry) => entry.area === decision.area) && /^(forms|validation|data-fetching|state|tables|charts|animation|i18n|testing|linting|storybook)$/.test(decision.area)) {
      problems.push({ severity: 'warning', area: decision.area, message: `"${decision.choice}" has no row in "Packages". Add one if the prototype needs to install it, or ignore if it only applies to the target codebase.` })
    }
  }

  for (const registry of stack.registries) {
    if (isBlank(registry.location)) problems.push({ severity: 'warning', message: `Registry or repo "${registry.name}" has no location.` })
  }
  if (!stack.decisions.some((decision) => decision.area === 'ui-library')) {
    problems.push({ severity: 'warning', area: 'ui-library', message: 'The file does not decide "ui-library", so the default (shadcn/ui) applies.' })
  }
  return problems
}

/** True when the UI library is shadcn/ui, the default */
export function usesShadcn(stack: Techstack): boolean {
  const library = stack.resolved.find((decision) => decision.area === 'ui-library')
  return !!library && /shadcn/i.test(library.choice)
}
