import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * The page content of the Design OS app uses the Volta look, like the app chrome:
 * dark mode on rwe-neutral, accents in brand-blue (light) and energy-green (dark), Inter.
 * Light mode may keep stone for borders and muted text, as the reference app does.
 */
const root = join(__dirname, '..')
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(n) ? [p] : []
  })
const files = walk(join(root, 'src/components')).map((f) => ({ name: relative(root, f), source: readFileSync(f, 'utf8') }))
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('page content uses Volta', () => {
  it('has no lime accents', () => {
    const offenders = files.filter((f) => /\blime-\d/.test(strip(f.source))).map((f) => f.name)
    expect(offenders).toEqual([])
  })

  it('has no stone in dark mode', () => {
    const offenders = files.filter((f) => /dark:(?:[\w[\]-]+:)*[\w-]*stone-\d/.test(strip(f.source))).map((f) => f.name)
    expect(offenders).toEqual([])
  })

  it('has no plain white surfaces', () => {
    const offenders = files.filter((f) => /(?<![\w-])bg-white(?![\w-])/.test(strip(f.source))).map((f) => f.name)
    expect(offenders).toEqual([])
  })

  it('does not name DM Sans', () => {
    expect(files.filter((f) => /DM Sans|DM_Sans/.test(f.source)).map((f) => f.name)).toEqual([])
  })
})

describe('theme variables', () => {
  const css = readFileSync(join(root, 'src/index.css'), 'utf8')
  const rootBlock = css.match(/:root\s*\{[\s\S]*?\n\}/)![0]
  const darkBlock = css.match(/\.dark\s*\{[\s\S]*?\n\}/)![0]

  it('uses Inter as the sans font', () => {
    expect(css).toMatch(/--font-sans:\s*"Inter"/)
  })

  it('maps the shadcn variables to the Volta palette in both modes', () => {
    for (const block of [rootBlock, darkBlock]) {
      for (const v of ['--background', '--card', '--primary', '--border', '--muted', '--ring']) {
        expect(block, v).toMatch(new RegExp(`${v}:\\s*var\\(--color-(rwe|brand|energy)-`))
      }
    }
  })

  it('has no raw oklch values left in the app theme', () => {
    expect(rootBlock + darkBlock).not.toMatch(/oklch\(/)
  })

  it('shares the theme choice with the fullscreen previews through the "theme" key', () => {
    const src = readFileSync(join(root, 'src/lib/shell-theme.ts'), 'utf8')
    expect(src).toMatch(/setItem\('theme'/)
  })

  it('has no second theme toggle next to the shell one', () => {
    expect(existsSync(join(root, 'src/components/ThemeToggle.tsx'))).toBe(false)
  })
})
