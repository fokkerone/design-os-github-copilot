/**
 * Boundary tests: Design OS tokens and product tokens stay separate.
 *
 *   Design OS app (src/components, src/lib, src/index.css)
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

test('Design OS stylesheet contains no product tokens', () => {
  const css = code(join(root, 'src/index.css'))
  assert.doesNotMatch(css, /@import\s+["'][^"']*product\//, 'src/index.css must not import from product/')
  assert.doesNotMatch(css, /--box-shadow-|-alpha-\d/, 'src/index.css must not contain generated product variables')
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
