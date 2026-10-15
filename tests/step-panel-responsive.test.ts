import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Pages live in a step panel that is narrower than the window (44-46 percent, resizable).
 * Viewport breakpoints (sm:, lg:) would pick desktop columns for a 550px panel, so pages that
 * lay out dense grids use container queries (@2xl: ...) against the panel instead.
 */
const root = join(__dirname, '..', 'src/components')
const tokenFiles = readdirSync(join(root, 'design-tokens')).filter((f) => f.endsWith('.tsx')).map((f) => join(root, 'design-tokens', f))
const viewportPrefix = /(?<![\w@-])(sm|md|lg|xl|2xl):/

describe('step panel is a size container', () => {
  const split = readFileSync(join(root, 'app-shell/SplitLayout.tsx'), 'utf8')
  it('marks the scrolling area of the step as @container in every mode', () => {
    const areas = split.match(/<div className="[^"]*overflow-y-auto[^"]*">\{(?:mode !== 'hidden' && )?children\}<\/div>/g) ?? []
    expect(areas).toHaveLength(2)
    for (const a of areas) expect(a).toContain('@container')
  })
})

const pageFiles = readdirSync(root).filter((f) => f.endsWith('.tsx')).map((f) => join(root, f))

describe('pages follow the panel, not the window', () => {
  it.each([...pageFiles, ...tokenFiles].map((f) => [f.replace(root + '/', ''), f]))('%s has no viewport breakpoints', (_n, file) => {
    expect(readFileSync(file, 'utf8')).not.toMatch(viewportPrefix)
  })
})
