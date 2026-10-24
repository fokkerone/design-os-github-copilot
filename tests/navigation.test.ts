import { describe, expect, it } from 'vitest'
import {
  buildNavigation,
  isFullscreenPath,
  legacyRedirect,
  type NavFacts,
  type NavItem,
} from '@/lib/navigation'

const none: NavFacts = {
  hasOverview: false,
  hasRoadmap: false,
  hasDataShape: false,
  hasDesignSystem: false,
  hasShell: false,
  sectionsWithScreenDesigns: 0,
  hasClickdummy: false,
  hasExport: false,
  hasTechstack: false,
  personaCount: 0,
  flowCount: 0,
}

const flat = (items: NavItem[]): NavItem[] => items.flatMap((i) => [i, ...flat(i.children ?? [])])
const byId = (items: NavItem[], id: string) => flat(items).find((i) => i.id === id)!
const activeIds = (items: NavItem[]) => flat(items).filter((i) => i.isActive).map((i) => i.id)

describe('navigation structure', () => {
  it('has the six main entries in order', () => {
    const nav = buildNavigation('/prototype/vision', none)
    expect(nav.map((i) => i.label)).toEqual([
      'Prototype',
      'Personas',
      'User Flows',
      'Design System',
      'Tech Stack',
      'Wiki',
    ])
  })

  it('puts the six steps under Prototype', () => {
    const nav = buildNavigation('/prototype/vision', none)
    expect(nav[0].children?.map((c) => c.label)).toEqual(['Vision', 'Shell', 'Roadmap', 'Sections', 'Prototype', 'Export'])
    expect(nav[0].children?.map((c) => c.href)).toEqual([
      '/prototype/vision',
      '/prototype/shell',
      '/prototype/roadmap',
      '/prototype/sections',
      '/prototype/preview',
      '/prototype/export',
    ])
  })

  it('links the other entries to their routes', () => {
    const nav = buildNavigation('/', none)
    expect(nav.slice(1).map((i) => i.href)).toEqual(['/personas', '/flows', '/design-system', '/techstack', '/wiki'])
  })

  it('links the Prototype group to its first step', () => {
    expect(buildNavigation('/', none)[0].href).toBe('/prototype/vision')
  })
})

describe('active entry', () => {
  it.each([
    ['/prototype/vision', ['prototype', 'vision']],
    ['/prototype/roadmap', ['prototype', 'roadmap']],
    ['/prototype/roadmap/data-shape', ['prototype', 'roadmap']],
    ['/prototype/sections', ['prototype', 'sections']],
    ['/prototype/sections/citizen-chat', ['prototype', 'sections']],
    ['/prototype/sections/citizen-chat/screen-designs/Start', ['prototype', 'sections']],
    ['/prototype/preview', ['prototype', 'preview']],
    ['/prototype/export', ['prototype', 'export']],
    ['/personas', ['personas']],
    ['/personas/anna', ['personas']],
    ['/flows', ['flows']],
    ['/flows/signup', ['flows']],
    ['/design-system', ['design-system']],
    ['/prototype/shell', ['prototype', 'shell']],
    ['/design-system/components', ['design-system']],
    ['/techstack', ['techstack']],
    ['/wiki', ['wiki']],
    ['/wiki/product/overview', ['wiki']],
  ])('%s activates %j', (path, expected) => {
    expect(activeIds(buildNavigation(path, none))).toEqual(expected)
  })

  it('does not confuse similar prefixes', () => {
    expect(activeIds(buildNavigation('/personas-archive', none))).toEqual([])
    expect(activeIds(buildNavigation('/prototype', none))).toEqual(['prototype'])
  })

  it('has no active entry on unknown paths', () => {
    expect(activeIds(buildNavigation('/nope', none))).toEqual([])
  })
})

describe('step status', () => {
  it('is upcoming when nothing exists yet', () => {
    const nav = buildNavigation('/techstack', none)
    expect(byId(nav, 'vision').status).toBe('upcoming')
    expect(byId(nav, 'export').status).toBe('upcoming')
  })

  it('marks existing artifacts as completed', () => {
    const nav = buildNavigation('/techstack', {
      ...none,
      hasOverview: true,
      hasRoadmap: true,
      sectionsWithScreenDesigns: 2,
      hasClickdummy: true,
      hasExport: true,
    })
    for (const id of ['vision', 'roadmap', 'sections', 'preview', 'export']) {
      expect(byId(nav, id).status, id).toBe('completed')
    }
  })

  it('treats the roadmap step as incomplete without a roadmap, even with an overview', () => {
    const nav = buildNavigation('/techstack', { ...none, hasOverview: true })
    expect(byId(nav, 'vision').status).toBe('completed')
    expect(byId(nav, 'roadmap').status).toBe('upcoming')
  })

  it('marks the active entry as current regardless of completion', () => {
    const nav = buildNavigation('/prototype/roadmap', { ...none, hasRoadmap: true })
    expect(byId(nav, 'roadmap').status).toBe('current')
  })

  it('counts the design system as done with tokens, the shell on its own', () => {
    expect(byId(buildNavigation('/', { ...none, hasDesignSystem: true }), 'design-system').status).toBe('completed')
    expect(byId(buildNavigation('/', { ...none, hasShell: true }), 'design-system').status).toBe('upcoming')
    expect(byId(buildNavigation('/', { ...none, hasShell: true }), 'shell').status).toBe('completed')
    expect(byId(buildNavigation('/', none), 'shell').status).toBe('upcoming')
  })

  it('completes tech stack, personas and flows from their artifacts', () => {
    const nav = buildNavigation('/', { ...none, hasTechstack: true, personaCount: 1, flowCount: 3 })
    expect(byId(nav, 'techstack').status).toBe('completed')
    expect(byId(nav, 'personas').status).toBe('completed')
    expect(byId(nav, 'flows').status).toBe('completed')
  })

  it('shows counts for personas and flows', () => {
    const nav = buildNavigation('/', { ...none, personaCount: 2, flowCount: 5 })
    expect(byId(nav, 'personas').badge).toBe(2)
    expect(byId(nav, 'flows').badge).toBe(5)
    expect(byId(nav, 'techstack').badge).toBeUndefined()
  })
})

describe('legacyRedirect', () => {
  it.each([
    ['/', '/prototype/vision'],
    ['/product', '/prototype/vision'],
    ['/prototype', '/prototype/vision'],
    ['/data-shape', '/prototype/roadmap/data-shape'],
    ['/design', '/design-system'],
    ['/shell/design', '/prototype/shell'],
    ['/shell/design/fullscreen', '/prototype/shell/fullscreen'],
    ['/design-system/shell', '/prototype/shell'],
    ['/design-system/shell/fullscreen', '/prototype/shell/fullscreen'],
    ['/sections', '/prototype/sections'],
    ['/sections/citizen-chat', '/prototype/sections/citizen-chat'],
    [
      '/sections/citizen-chat/screen-designs/Start',
      '/prototype/sections/citizen-chat/screen-designs/Start',
    ],
    [
      '/sections/citizen-chat/screen-designs/Start/fullscreen',
      '/prototype/sections/citizen-chat/screen-designs/Start/fullscreen',
    ],
    ['/clickdummy', '/prototype/preview'],
    ['/clickdummy/preview', '/prototype/preview/fullscreen'],
    ['/export', '/prototype/export'],
  ])('%s -> %s', (from, to) => {
    expect(legacyRedirect(from)).toBe(to)
  })

  it.each([
    '/prototype/vision',
    '/personas',
    '/personas/anna',
    '/flows/signup',
    '/design-system',
    '/techstack',
    '/wiki',
    '/wiki/product/overview',
    '/unknown',
  ])('leaves %s alone', (path) => {
    expect(legacyRedirect(path)).toBeNull()
  })

  it('keeps no trailing slash differences', () => {
    expect(legacyRedirect('/sections/')).toBe('/prototype/sections')
  })
})

describe('isFullscreenPath', () => {
  it('detects fullscreen routes that render outside the shell', () => {
    expect(isFullscreenPath('/prototype/sections/a/screen-designs/B/fullscreen')).toBe(true)
    expect(isFullscreenPath('/prototype/shell/fullscreen')).toBe(true)
    expect(isFullscreenPath('/prototype/preview/fullscreen')).toBe(true)
    expect(isFullscreenPath('/prototype/sections/a')).toBe(false)
    expect(isFullscreenPath('/prototype/preview')).toBe(false)
  })
})
