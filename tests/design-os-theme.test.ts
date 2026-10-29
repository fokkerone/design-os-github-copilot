import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * The Design OS UI follows the shadcn preset beqC8BzE (style rhea, zinc, Inter): every color comes
 * from a semantic token (bg-background, text-muted-foreground, border-border, ...), so the app has
 * one look in light and dark mode. The Volta palette belongs to the prototype (templates/volta/).
 * Status colors (amber, emerald, ...) may stay Tailwind palettes.
 */
const root = join(__dirname, '..')
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(n) ? [p] : []
  })
const files = ['src/components', 'src/lib'].flatMap((dir) => walk(join(root, dir))).map((f) => ({ name: relative(root, f), source: readFileSync(f, 'utf8') }))
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const offenders = (pattern: RegExp) => files.filter((f) => pattern.test(strip(f.source))).map((f) => f.name)

describe('the Design OS UI uses semantic tokens', () => {
  it('has no Volta palette classes', () => {
    expect(offenders(/(?<![\w-])(?:[\w[\]&>_.:/=-]+:)?[a-z]+-(?:rwe-[a-z]+|brand-blue|energy-green|energy-blue)-\d/)).toEqual([])
  })

  it('has no neutral palette classes (stone, zinc, neutral, gray, slate)', () => {
    expect(offenders(/(?<![\w-])(?:[\w[\]&>_.:/=-]+:)?(?:bg|text|border|divide|ring|outline|decoration|fill|stroke)-(?:stone|zinc|neutral|gray|slate)-\d/)).toEqual([])
  })

  it('has no lime accents', () => {
    expect(offenders(/\blime-\d/)).toEqual([])
  })

  it('names no font other than the theme fonts', () => {
    expect(offenders(/DM Sans|DM_Sans|Nunito|JetBrains/)).toEqual([])
  })
})

describe('the Design OS theme', () => {
  const css = readFileSync(join(root, 'src/styles/design-os.css'), 'utf8')
  const lightBlock = css.match(/:root,\s*\.light\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
  const darkBlock = css.match(/\n\.dark\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

  it('is the shadcn preset: rhea style, zinc base color, subtle menu accent', () => {
    const config = JSON.parse(readFileSync(join(root, 'components.json'), 'utf8'))
    expect(config.style).toBe('radix-rhea')
    expect(config.tailwind.baseColor).toBe('zinc')
    expect(config.tailwind.css).toBe('src/styles/design-os.css')
    expect(config.menuAccent).toBe('subtle')
  })

  it('defines the shadcn variables in light (with the .light opt-out) and dark mode', () => {
    for (const block of [lightBlock, darkBlock]) {
      for (const v of ['--background', '--foreground', '--card', '--primary', '--muted-foreground', '--border', '--ring', '--sidebar']) {
        expect(block, v).toMatch(new RegExp(`${v}:\\s*oklch\\(`))
      }
    }
  })

  it('imports no Volta theme and loads the shadcn utilities', () => {
    expect(existsSync(join(root, 'src/app-theme.css'))).toBe(false)
    expect(css).not.toMatch(/app-theme\.css|templates\//)
    expect(css).toMatch(/@import "shadcn\/tailwind\.css";/)
  })

  it('sets its own text and code fonts, and index.html loads fonts only from Google Fonts', () => {
    expect(css).toMatch(/--font-sans:\s*['"]/)
    expect(css).toMatch(/--font-mono:\s*['"]/)
    const html = readFileSync(join(root, 'index.html'), 'utf8')
    const sheets = [...html.matchAll(/<link\b[^>]*>/g)].map((m) => m[0]).filter((tag) => /rel="stylesheet"/.test(tag))
    const hrefs = sheets.map((tag) => tag.match(/href="([^"]+)"/)![1])
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) expect(href).toMatch(/^https:\/\/fonts\.googleapis\.com\//)
  })

  it('shares the theme choice with the preview through the "theme" key', () => {
    expect(readFileSync(join(root, 'src/lib/shell-theme.ts'), 'utf8')).toMatch(/setItem\('theme'/)
  })

  it('has no second theme toggle next to the shell one', () => {
    expect(existsSync(join(root, 'src/components/ThemeToggle.tsx'))).toBe(false)
  })
})
