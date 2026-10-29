/**
 * Vite plugin: the prototype's Tailwind theme as a string module,
 * `import twTheme from 'virtual:tailwind-theme'`. Live Edit reads it as data to tell which token
 * classes render the token in the prototype (src/lib/live-edit/token-class.ts).
 *
 * The prototype preview builds Tailwind's default theme plus the theme slot
 * (scripts/prototype-theme.mjs: the product's tokens.css or a template). This module gives the
 * same result as `--name: value;` lines: the slot's `@theme` variables first, then the defaults
 * the slot keeps (a strict token import resets namespaces with `--color-*: initial`).
 * `{ prototype: false }` serves Tailwind's default theme alone (Storybook, which reads no product).
 *
 * Read in Node rather than through `?raw`: the dev server does not serve node_modules outside the
 * root (a worktree links them), and Vitest hands out CSS files empty.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolvePrototypeTheme } from './prototype-theme.mjs'

const ID = 'virtual:tailwind-theme'
const RESOLVED = `\0${ID}`

const vars = (css) => [...css.matchAll(/--([\w.-]+|[\w-]+-\*):\s*([^;]+);/g)].map(([, name, value]) => [name, value.replace(/\s+/g, ' ').trim()])

/** The variables inside the `@theme` blocks of a stylesheet (not :root, not .dark) */
export function themeBlocks(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/@theme[^{]*\{([^}]*)\}/g)].map((m) => m[1]).join('\n')
}

/** Tailwind's default theme with a theme's `@theme` variables on top, as `--name: value;` lines */
export function effectiveTheme(defaultCss, themeCss = '') {
  const own = vars(themeBlocks(themeCss))
  const resets = own.filter(([name, value]) => name.endsWith('-*') && value === 'initial').map(([name]) => name.slice(0, -1))
  const lines = new Map()
  for (const [name, value] of own) if (!name.endsWith('-*') && !lines.has(name)) lines.set(name, value)
  for (const [name, value] of vars(defaultCss)) {
    if (name.endsWith('-*') || lines.has(name) || resets.some((prefix) => name.startsWith(prefix))) continue
    lines.set(name, value)
  }
  return [...lines].map(([name, value]) => `--${name}: ${value};`).join('\n')
}

export default function tailwindTheme({ prototype = true } = {}) {
  const require = createRequire(import.meta.url)
  let root = process.cwd()
  return {
    name: 'designos-tailwind-theme',
    configResolved(config) {
      root = config.root
    },
    resolveId(id) {
      return id === ID ? RESOLVED : null
    },
    load(id) {
      if (id !== RESOLVED) return null
      const file = require.resolve('tailwindcss/theme.css')
      this.addWatchFile(file)
      const defaults = readFileSync(file, 'utf8')
      if (!prototype) return `export default ${JSON.stringify(defaults)}`
      const slot = resolvePrototypeTheme(root)
      this.addWatchFile(slot.file)
      return `export default ${JSON.stringify(effectiveTheme(defaults, readFileSync(slot.file, 'utf8')))}`
    },
  }
}
