/**
 * Boundary tests: Design OS tokens and product tokens stay separate.
 *
 *   Design OS app (src/components, src/lib, src/index.css, src/styles/design-os.css)
 *     - styled only by its own theme (stone/lime, src/index.css)
 *     - reads product tokens as DATA only, through src/lib/design-tokens-loader.ts
 *     - never loads product/design-system/tokens/tokens.css
 *
 *   Product (src/sections, src/shell, src/ui, src/clickdummy)
 *     - src/ui is the product-owned UI layer (primitives ported per the tech stack)
 *     - never imports Design OS UI (@/components/*) or the token loaders
 *     - never uses Design OS semantic utilities (bg-primary, text-muted-foreground, ...):
 *       inside Design OS these resolve to the Design OS theme, not to the product tokens
 *     - product tokens.css is applied only in the exported codebase (product-plan/)
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const rel = (p) => relative(root, p).split('\\').join('/')

function walk(dir, exts) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...walk(path, exts))
    else if (exts.some((e) => name.endsWith(e))) out.push(path)
  }
  return out
}

const CODE = ['.ts', '.tsx', '.css', '.js', '.jsx', '.mjs']
const PRODUCT_DIRS = ['src/sections', 'src/shell', 'src/ui', 'src/clickdummy'].map((d) => join(root, d))
const isProduct = (file) => PRODUCT_DIRS.some((d) => file.startsWith(d + '/') || file.startsWith(d + '\\'))
const appFiles = [...walk(join(root, 'src'), CODE), join(root, 'index.html'), join(root, 'vite.config.ts')].filter(
  (f) => existsSync(f) && !isProduct(f),
)
const productFiles = PRODUCT_DIRS.flatMap((d) => walk(d, CODE))

/** Strip comments so documentation that mentions paths does not count as usage. */
const code = (file) =>
  readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/<!--[\s\S]*?-->/g, '')

const LOADER = 'src/lib/design-tokens-loader.ts'

test('Design OS app never loads the product tokens.css', () => {
  for (const file of appFiles) {
    assert.doesNotMatch(
      code(file),
      /(?:@import\s+(?:url\()?|import\s+(?:[\w{}*,\s]+from\s+)?|import\(|import\.meta\.glob\(|href=)\s*['"`][^'"`]*tokens\.css/,
      `${rel(file)} must not load product tokens.css`,
    )
  }
})

test('product token files are read only by the token loader (as data)', () => {
  for (const file of appFiles) {
    if (rel(file) === LOADER) continue
    assert.doesNotMatch(
      code(file),
      /(?:import\.meta\.glob\(|from\s+|import\(|fetch\(|new URL\()\s*['"`][./]*\/?product\/design-system\/(?:tokens|import)\//,
      `${rel(file)} must use ${LOADER} instead of reading product token files`,
    )
  }
  const loader = code(join(root, LOADER))
  assert.doesNotMatch(loader, /\.css['"`]/, 'the loader must not import CSS')
})

const APP_CSS = 'src/styles/design-os.css'

test('Design OS stylesheet contains no product tokens', () => {
  for (const file of ['src/index.css', APP_CSS]) {
    const css = code(join(root, file))
    assert.doesNotMatch(css, /@import\s+["'][^"']*product\//, `${file} must not import from product/`)
    assert.doesNotMatch(css, /--box-shadow-|-alpha-\d/, `${file} must not contain generated product variables`)
  }
})

test('the Design OS stylesheet scans only the Design OS UI, never the prototype', () => {
  const css = code(join(root, APP_CSS))
  assert.match(css, /@import\s+["']tailwindcss["']\s+source\(none\)/, `${APP_CSS} must turn off automatic source detection`)
  const sources = [...css.matchAll(/@source\s+["']([^"']+)["']/g)].map((m) => m[1])
  assert.deepEqual(sources.sort(), ['../components', '../lib'])
  assert.match(code(join(root, 'src/index.css')), /@import\s+["']\.\/styles\/design-os\.css["']/, 'index.css must build on the Design OS stylesheet')
})

const FORBIDDEN_IMPORTS = [
  /from\s+['"]@\/components\//, // Design OS UI incl. shadcn ui (styled with Design OS tokens)
  /from\s+['"]@\/lib\/design-(tokens|system)-loader['"]/,
  /import\s+['"][^'"]*\.css['"]/, // product code never brings its own global CSS into Design OS
]

const SEMANTIC =
  /(?<![\w-])(?:[a-z0-9]+:)*(?:bg|text|border|ring|ring-offset|fill|stroke|outline|from|via|to|divide|placeholder|caret|decoration|accent|shadow)-(?:primary|secondary|muted|accent|destructive|background|foreground|card|popover|border|input|ring|sidebar|chart)(?:-[a-z0-9-]+)?(?:\/\d+)?(?![\w-])/

test('product code does not import Design OS UI, token loaders or global CSS', () => {
  for (const file of productFiles) {
    const source = code(file)
    for (const pattern of FORBIDDEN_IMPORTS) {
      assert.doesNotMatch(source, pattern, `${rel(file)}: ${pattern}`)
    }
  }
})

test('product code does not use Design OS semantic color utilities', () => {
  for (const file of productFiles) {
    const match = SEMANTIC.exec(code(file))
    assert.equal(
      match,
      null,
      `${rel(file)} uses "${match?.[0]}" — inside Design OS this resolves to the Design OS theme. Use palette steps from DESIGN.md (e.g. teal-600) and a token comment instead.`,
    )
  }
})

test('the semantic utility guard detects leaks (self-check)', () => {
  for (const leak of ['bg-primary', 'hover:bg-primary/90', 'text-muted-foreground', 'border-border', 'dark:bg-card', 'ring-ring']) {
    assert.match(` ${leak} `, SEMANTIC, leak)
  }
  for (const ok of ['bg-teal-600', 'text-zinc-500', 'border-stone-200', 'accent-lime-600', 'shadow-sm', 'rounded-md']) {
    assert.doesNotMatch(` ${ok} `, SEMANTIC, ok)
  }
})

test('the product UI layer exists in the product scope (src/ui)', () => {
  assert.ok(PRODUCT_DIRS.some((dir) => rel(dir) === 'src/ui'), 'src/ui must be checked like the other product directories')
  assert.ok(productFiles.some((file) => rel(file) === 'src/ui/utils.ts'), 'src/ui/utils.ts (cn helper) anchors the layer')
})

test('product UI primitives (src/ui) use palette steps and import no Design OS UI', () => {
  const uiFiles = walk(join(root, 'src/ui'), CODE)
  for (const file of uiFiles) {
    const source = code(file)
    assert.doesNotMatch(source, /from\s+['"]@\/components\//, `${rel(file)} must not import Design OS UI`)
    assert.equal(SEMANTIC.exec(source), null, `${rel(file)} must use palette steps, not semantic utilities`)
  }
})

// --- App chrome look: the Design OS shell uses the Volta palette (same look as the reference app) ---

test('the app chrome theme (src/app-theme.css) defines the Volta palette and is imported by the Design OS stylesheet', () => {
  const themePath = join(root, 'src/app-theme.css')
  assert.ok(existsSync(themePath), 'src/app-theme.css must exist')
  const theme = code(themePath)
  for (const token of [
    '--color-brand-blue-500',
    '--color-energy-green-500',
    '--color-rwe-sand-50',
    '--color-rwe-sand-200',
    '--color-rwe-sand-500',
    '--color-rwe-neutral-700',
    '--color-rwe-neutral-900',
    '--color-rwe-neutral-950',
    '--color-rwe-focus',
    '--color-rwe-black-a-25',
  ]) {
    assert.match(theme, new RegExp(token + '\\s*:'), `${token} must be defined`)
  }
  assert.match(code(join(root, APP_CSS)), /@import\s+["']\.\.\/app-theme\.css["']/, `${APP_CSS} must import app-theme.css`)
})

test('the app chrome theme stays separate from the product tokens', () => {
  const theme = code(join(root, 'src/app-theme.css'))
  assert.doesNotMatch(theme, /product\//, 'app-theme.css must not reference product/')
  assert.doesNotMatch(theme, /--box-shadow-|-alpha-\d/, 'app-theme.css must not contain generated product variables')
})

test('the dark variant lets a nearer .light scope opt out (shell can differ from the page theme)', () => {
  assert.match(
    code(join(root, APP_CSS)),
    /@custom-variant dark \(&:is\(\.dark \*\):not\(:is\(\.light \*\)\)\)/,
  )
})

test('Inter is loaded for the app chrome', () => {
  assert.match(readFileSync(join(root, 'index.html'), 'utf8'), /family=Inter/)
})
