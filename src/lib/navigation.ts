/**
 * Navigation model of the Design OS app: pure functions, no React, no loaders.
 *
 *   Prototype  (Vision, Shell, Roadmap, Sections, Prototype, Export)
 *   Personas, User Flows, Design System, Tech Stack, Wiki
 *
 * `buildNavigation` derives active entries and step status from the path and a set of
 * facts about the project files. `legacyRedirect` maps the routes of the old
 * phase-based layout to the new ones.
 */

export type NavIconName =
  | 'prototype'
  | 'vision'
  | 'shell'
  | 'roadmap'
  | 'sections'
  | 'preview'
  | 'export'
  | 'personas'
  | 'flows'
  | 'design-system'
  | 'techstack'
  | 'wiki'

export type NavStatus = 'completed' | 'current' | 'upcoming'

export interface NavItem {
  id: string
  label: string
  href: string
  icon: NavIconName
  isActive: boolean
  status: NavStatus
  badge?: number
  children?: NavItem[]
}

/** What exists in the project files. Computed by the loaders, passed in so this stays pure. */
export interface NavFacts {
  hasOverview: boolean
  hasRoadmap: boolean
  hasDataShape: boolean
  hasDesignSystem: boolean
  hasShell: boolean
  sectionsWithScreenDesigns: number
  hasClickdummy: boolean
  hasExport: boolean
  hasTechstack: boolean
  personaCount: number
  flowCount: number
}

interface Def {
  id: string
  label: string
  href: string
  icon: NavIconName
  /** Path prefixes (matched on segment boundaries) that activate this entry */
  match: string[]
  done: (f: NavFacts) => boolean
  badge?: (f: NavFacts) => number | undefined
  children?: Def[]
}

const DEFS: Def[] = [
  {
    id: 'prototype',
    label: 'Prototype',
    href: '/prototype/vision',
    icon: 'prototype',
    match: ['/prototype'],
    done: () => false,
    children: [
      { id: 'vision', label: 'Vision', href: '/prototype/vision', icon: 'vision', match: ['/prototype/vision'], done: (f) => f.hasOverview },
      { id: 'shell', label: 'Shell', href: '/prototype/shell', icon: 'shell', match: ['/prototype/shell'], done: (f) => f.hasShell },
      { id: 'roadmap', label: 'Roadmap', href: '/prototype/roadmap', icon: 'roadmap', match: ['/prototype/roadmap'], done: (f) => f.hasRoadmap },
      { id: 'sections', label: 'Sections', href: '/prototype/sections', icon: 'sections', match: ['/prototype/sections'], done: (f) => f.sectionsWithScreenDesigns > 0 },
      { id: 'preview', label: 'Prototype', href: '/prototype/preview', icon: 'preview', match: ['/prototype/preview'], done: (f) => f.hasClickdummy },
      { id: 'export', label: 'Export', href: '/prototype/export', icon: 'export', match: ['/prototype/export'], done: (f) => f.hasExport },
    ],
  },
  { id: 'personas', label: 'Personas', href: '/personas', icon: 'personas', match: ['/personas'], done: (f) => f.personaCount > 0, badge: (f) => f.personaCount || undefined },
  { id: 'flows', label: 'User Flows', href: '/flows', icon: 'flows', match: ['/flows'], done: (f) => f.flowCount > 0, badge: (f) => f.flowCount || undefined },
  { id: 'design-system', label: 'Design System', href: '/design-system', icon: 'design-system', match: ['/design-system'], done: (f) => f.hasDesignSystem },
  { id: 'techstack', label: 'Tech Stack', href: '/techstack', icon: 'techstack', match: ['/techstack'], done: (f) => f.hasTechstack },
  { id: 'wiki', label: 'Wiki', href: '/wiki', icon: 'wiki', match: ['/wiki'], done: () => false },
]

const normalize = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path)

/** `/a` matches `/a` and `/a/b`, never `/ab` */
const underPrefix = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + '/')

function build(def: Def, path: string, facts: NavFacts): NavItem {
  const children = def.children?.map((c) => build(c, path, facts))
  const isActive = def.match.some((m) => underPrefix(path, m))
  const status: NavStatus = isActive ? 'current' : def.done(facts) ? 'completed' : 'upcoming'
  return {
    id: def.id,
    label: def.label,
    href: def.href,
    icon: def.icon,
    isActive,
    status,
    ...(def.badge?.(facts) !== undefined ? { badge: def.badge(facts) } : {}),
    ...(children ? { children } : {}),
  }
}

export function buildNavigation(pathname: string, facts: NavFacts): NavItem[] {
  const path = normalize(pathname)
  return DEFS.map((d) => build(d, path, facts))
}

/** Routes of the old phase-based layout, in the order they are checked */
const LEGACY: [from: string, to: string][] = [
  ['/shell/design', '/prototype/shell'],
  ['/design-system/shell', '/prototype/shell'],
  ['/data-shape', '/prototype/roadmap/data-shape'],
  ['/design', '/design-system'],
  ['/sections', '/prototype/sections'],
  ['/clickdummy', '/prototype/preview'],
  ['/export', '/prototype/export'],
  ['/product', '/prototype/vision'],
]

/** The new path for an old one, or null when the path is current (or unknown) */
export function legacyRedirect(pathname: string): string | null {
  const path = normalize(pathname)
  if (path === '/' || path === '/prototype') return '/prototype/vision'
  if (path === '/clickdummy/preview') return '/prototype/preview/fullscreen'
  for (const [from, to] of LEGACY) {
    if (underPrefix(path, from)) return to + path.slice(from.length)
  }
  return null
}

/** Fullscreen previews render outside the shell */
export function isFullscreenPath(pathname: string): boolean {
  return normalize(pathname).endsWith('/fullscreen')
}
