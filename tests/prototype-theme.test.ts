import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM script without types
import { resolvePrototypeTheme, TOKENS_CSS } from '../scripts/prototype-theme.mjs'
// @ts-expect-error plain ESM script without types
import { effectiveTheme, themeBlocks } from '../scripts/tailwind-theme.mjs'
// @ts-expect-error plain ESM script without types
import prototypeFiles from '../scripts/prototype-files.mjs'
// @ts-expect-error plain ESM script without types
import { candidatesOf, missingClasses } from '../scripts/preview-classes.mjs'
import { parseRoute, routeHref } from '@/preview/route'

let root: string
const write = (file: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  fs.writeFileSync(path.join(root, file), content)
}
const rel = (file: string) => path.relative(root, file).split(path.sep).join('/')

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'prototype-theme-'))
  write('templates/volta/theme.css', '@theme { --color-brand-blue-500: #1d4477; }')
  write('templates/volta/template.json', JSON.stringify({ id: 'volta', fonts: [{ family: 'Inter', weights: [400] }] }))
  write('templates/mono/theme.css', '@theme { --color-*: initial; --color-ink: #111; }')
})
afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

describe('prototype theme slot', () => {
  it('uses the volta template without a token import or a template choice', () => {
    const slot = resolvePrototypeTheme(root)
    expect(slot.source).toBe('template')
    expect(rel(slot.file)).toBe('templates/volta/theme.css')
    expect(slot.template.fonts).toEqual([{ family: 'Inter', weights: [400] }])
  })

  it('uses the template the product names', () => {
    write('product/design-system/template.json', JSON.stringify({ template: 'mono' }))
    expect(rel(resolvePrototypeTheme(root).file)).toBe('templates/mono/theme.css')
  })

  it('prefers the product token import over any template', () => {
    write('product/design-system/template.json', JSON.stringify({ template: 'mono' }))
    write(TOKENS_CSS, '@theme { --color-primary: red; }')
    const slot = resolvePrototypeTheme(root)
    expect(slot.source).toBe('tokens')
    expect(rel(slot.file)).toBe(TOKENS_CSS)
  })

  it('names an unknown template or an invalid choice', () => {
    write('product/design-system/template.json', JSON.stringify({ template: 'neon' }))
    expect(() => resolvePrototypeTheme(root)).toThrow('Unknown template "neon": templates/neon/theme.css not found')
    write('product/design-system/template.json', JSON.stringify({ template: '../x' }))
    expect(() => resolvePrototypeTheme(root)).toThrow('"template" must be a template id')
  })

  it('ships a volta template with its fonts', () => {
    const slot = resolvePrototypeTheme(path.join(__dirname, '..'))
    expect(slot.template.id).toBe('volta')
    expect(slot.template.fonts.map((f: { family: string }) => f.family)).toContain('Inter')
  })
})

describe('prototype theme as data for Live Edit', () => {
  const defaults = '@theme { --color-teal-600: oklch(60% 0.1 185); --radius-md: 0.375rem; --spacing: 0.25rem; }'

  it('reads only the @theme blocks of a theme, not :root or .dark', () => {
    expect(themeBlocks(':root { --primary: red; } @theme { --color-x: blue; } .dark { --primary: green; }')).toContain('--color-x: blue;')
    expect(themeBlocks(':root { --primary: red; }')).toBe('')
  })

  it('puts the theme first and keeps the defaults it does not reset', () => {
    const out = effectiveTheme(defaults, '@theme { --radius-md: 0.25rem; --color-brand: #f00; }')
    expect(out.split('\n')).toEqual(['--radius-md: 0.25rem;', '--color-brand: #f00;', '--color-teal-600: oklch(60% 0.1 185);', '--spacing: 0.25rem;'])
  })

  it('drops the defaults of a namespace a strict theme resets', () => {
    const out = effectiveTheme(defaults, '@theme { --color-*: initial; --color-brand: #f00; }')
    expect(out).toContain('--color-brand: #f00;')
    expect(out).not.toContain('teal-600')
    expect(out).toContain('--radius-md: 0.375rem;')
  })
})

describe('prototype files by name only', () => {
  it('answers ?designos-file with a stub that accepts its own updates', () => {
    const plugin = prototypeFiles()
    const stub = plugin.load('/repo/src/sections/account/Login.tsx?designos-file')
    expect(stub).toContain('export default true')
    expect(stub).toMatch(/import\.meta\.hot\.accept\(/)
    expect(plugin.load('/repo/src/sections/account/Login.tsx')).toBeNull()
  })
})

describe('preview routes', () => {
  it('round-trips screens, the shell and the clickdummy', () => {
    const screen = { kind: 'screen', sectionId: 'meter readings', screenDesignName: 'Form' } as const
    expect(routeHref(screen)).toBe('/preview.html#/screen/meter%20readings/Form')
    expect(parseRoute('#/screen/meter%20readings/Form')).toEqual(screen)
    expect(parseRoute(new URL(`http://x${routeHref({ kind: 'shell' })}`).hash)).toEqual({ kind: 'shell' })
    expect(parseRoute('#/clickdummy')).toEqual({ kind: 'clickdummy' })
    expect(parseRoute('#/screen/only-section')).toEqual({ kind: 'unknown' })
    expect(parseRoute('')).toEqual({ kind: 'unknown' })
  })
})

describe('class coverage of the prototype', () => {
  it('finds class-like words in string literals', () => {
    const words = candidatesOf(`<div className="bg-teal-600 p-4 hover:bg-teal-700" title="Hello world" />`)
    expect([...words]).toEqual(['bg-teal-600', 'p-4', 'hover:bg-teal-700'])
  })

  it('lists classes that render with the defaults but not in a strict theme', async () => {
    write('product/design-system/template.json', JSON.stringify({ template: 'mono' }))
    write('src/sections/a/A.tsx', `export const A = () => <p className="bg-teal-600 bg-ink p-4" />`)
    const report = await missingClasses(root)
    expect(report.theme).toBe('templates/mono/theme.css')
    expect(report.missing).toEqual([{ className: 'bg-teal-600', files: ['src/sections/a/A.tsx'] }])
  })
})
