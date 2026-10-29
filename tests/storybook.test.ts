import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { redirectGlobs, REDIRECTED_ROOTS } from '../.storybook/fixture-globs'

/**
 * Storybook shows the Design OS UI only: one story file per component in src/components, and no
 * story or Storybook file reaches into the product or the prototype.
 */
const root = join(__dirname, '..')
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
const rel = (p: string) => relative(root, p).split('\\').join('/')

const components = walk(join(root, 'src/components')).filter((f) => f.endsWith('.tsx') && !f.endsWith('.stories.tsx'))
const stories = walk(join(root, 'src')).filter((f) => f.endsWith('.stories.tsx'))
const storybookFiles = walk(join(root, '.storybook')).filter((f) => /\.(tsx?|css|html)$/.test(f) && !rel(f).startsWith('.storybook/fixtures/'))

const PROTOTYPE_IMPORT = /(?:from\s+|import\s*\(\s*|import\s+|@import\s+|@source\s+)['"][^'"]*(?:\/product\/|\/product-plan\/|src\/(?:sections|shell|ui|clickdummy)\/|@\/(?:sections|shell|ui|clickdummy)\/)/

describe('Storybook of the Design OS UI', () => {
  it('has a story file next to every component in src/components', () => {
    const missing = components.filter((f) => !stories.includes(f.replace(/\.tsx$/, '.stories.tsx'))).map(rel)
    expect(missing).toEqual([])
  })

  it('keeps stories in src/components only', () => {
    expect(stories.map(rel).filter((f) => !f.startsWith('src/components/'))).toEqual([])
  })

  it('collects stories only from src/components', () => {
    const main = readFileSync(join(root, '.storybook/main.ts'), 'utf8')
    const globs = [...main.matchAll(/['"](\.\.\/[^'"]+)['"]/g)].map((m) => m[1])
    expect(globs).toEqual(['../src/components/**/*.stories.tsx'])
  })

  it('never imports the product or the prototype in stories or the Storybook config', () => {
    const offenders = [...stories, ...storybookFiles].filter((f) => PROTOTYPE_IMPORT.test(readFileSync(f, 'utf8'))).map(rel)
    expect(offenders).toEqual([])
  })

  it('loads the Design OS stylesheet, not the app entry with the prototype sources', () => {
    const css = readFileSync(join(root, '.storybook/preview.css'), 'utf8')
    expect(css).toMatch(/@import\s+["']\.\.\/src\/styles\/design-os\.css["']/)
    expect(css).not.toMatch(/index\.css/)
  })

  it('leaves out the dev-server plugins that read or write the product', () => {
    const vite = readFileSync(join(root, '.storybook/vite.config.ts'), 'utf8')
    for (const plugin of ['opencode-dev', 'babel-source-attr', 'live-edit-writer', 'comments-store', 'react-devtools-hook', 'component-props.mjs', 'impeccable-context']) {
      expect(vite, plugin).not.toContain(plugin)
    }
  })
})

describe('fixture globs', () => {
  it('redirects product, wiki and prototype globs to the fixtures, keys mapped back at runtime', () => {
    const code = `const a = import.meta.glob('/product/*.md', { eager: true })\nconst b = import.meta.glob(['/wiki/**/*.md', '!/wiki/raw/**'], { eager: true })\nconst c = import.meta.glob('/src/sections/*/*.tsx')`
    const out = redirectGlobs(code)!
    expect(out).toContain(`__designosFixtureGlob(import.meta.glob('/.storybook/fixtures/product/*.md', { eager: true }))`)
    expect(out).toContain(`['/.storybook/fixtures/wiki/**/*.md', '!/.storybook/fixtures/wiki/raw/**']`)
    expect(out).toContain(`import.meta.glob('/.storybook/fixtures/src/sections/*/*.tsx')`)
    expect(out.startsWith(`import { fixtureGlob as __designosFixtureGlob } from '/.storybook/fixtures/glob.ts'`)).toBe(true)
  })

  it('leaves other globs alone', () => {
    expect(redirectGlobs(`import.meta.glob('/src/assets/*.svg')`)).toBeNull()
  })

  it('covers every product and prototype root the loaders glob', () => {
    const loaders = walk(join(root, 'src')).filter((f) => /\.(tsx?)$/.test(f) && !f.endsWith('.stories.tsx'))
    const patterns = loaders.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/import\.meta\.glob\(\s*\[?\s*['"](\/[^'"]+)['"]/g)].map((m) => m[1]))
    const uncovered = patterns.filter((p) => /^\/(product|wiki|src\/(sections|shell|ui|clickdummy))/.test(p) && !REDIRECTED_ROOTS.some((r: string) => p.startsWith(r)))
    expect(patterns.length).toBeGreaterThan(0)
    expect(uncovered).toEqual([])
  })
})
