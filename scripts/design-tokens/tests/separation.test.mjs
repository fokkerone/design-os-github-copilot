/**
 * Boundary tests: the Design OS UI and the prototype are two Tailwind setups that never mix.
 *
 *   Design OS app (index.html → src/main.tsx → src/styles/design-os.css; src/components, src/lib)
 *     - styled only by its own theme, scanning only src/components and src/lib
 *     - reads product tokens as DATA only, through src/lib/design-tokens-loader.ts
 *     - never loads product/design-system/tokens/tokens.css, never imports prototype code
 *       (it lists prototype files by name only, `?designos-file`)
 *
 *   Prototype preview (preview.html → src/preview/main.tsx → src/preview/preview.css)
 *     - its own Tailwind build: Tailwind plus the theme slot `designos:prototype-theme`
 *       (the product's tokens.css or a template, scripts/prototype-theme.mjs)
 *     - imports only the prototype, the preview bridge and the shared message contract
 *
 *   Product (src/sections, src/shell, src/ui, src/clickdummy)
 *     - src/ui is the product-owned UI layer (primitives ported per the tech stack)
 *     - never imports Design OS UI (@/components/*), the token loaders or global CSS
 *     - semantic utilities (bg-primary, ...) resolve to the prototype theme in the preview
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
const PREVIEW_DIR = join(root, 'src/preview')
const under = (dir) => (file) => file.startsWith(dir + '/') || file.startsWith(dir + '\\')
const isProduct = (file) => PRODUCT_DIRS.some((d) => under(d)(file))
const appFiles = [...walk(join(root, 'src'), CODE), join(root, 'index.html'), join(root, 'vite.config.ts')].filter(
  (f) => existsSync(f) && !isProduct(f) && !under(PREVIEW_DIR)(f),
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
  const css = code(join(root, APP_CSS))
  assert.doesNotMatch(css, /@import\s+["'][^"']*product\//, `${APP_CSS} must not import from product/`)
  assert.doesNotMatch(css, /--box-shadow-|-alpha-\d/, `${APP_CSS} must not contain generated product variables`)
})

test('the Design OS stylesheet scans only the Design OS UI, never the prototype', () => {
  const css = code(join(root, APP_CSS))
  assert.match(css, /@import\s+["']tailwindcss["']\s+source\(none\)/, `${APP_CSS} must turn off automatic source detection`)
  const sources = [...css.matchAll(/@source\s+["']([^"']+)["']/g)].map((m) => m[1])
  assert.deepEqual(sources.sort(), ['../components', '../lib'])
  assert.ok(!existsSync(join(root, 'src/index.css')), 'src/index.css bundled both setups; the app loads src/styles/design-os.css')
  assert.match(code(join(root, 'src/main.tsx')), /import\s+['"]\.\/styles\/design-os\.css['"]/, 'src/main.tsx must load the Design OS stylesheet')
})

const PREVIEW_CSS = 'src/preview/preview.css'

test('the preview stylesheet is Tailwind plus the prototype theme slot and scans only the prototype', () => {
  const css = code(join(root, PREVIEW_CSS))
  const imports = [...css.matchAll(/@import\s+["']([^"']+)["']([^;]*);/g)].map((m) => [m[1], m[2].trim()])
  assert.deepEqual(imports, [['tailwindcss', 'source(none)'], ['designos:prototype-theme', '']])
  const sources = [...css.matchAll(/@source\s+["']([^"']+)["']/g)].map((m) => m[1])
  assert.deepEqual(sources.sort(), ['../clickdummy', '../sections', '../shell', '../ui', './'])
  assert.doesNotMatch(css, /design-os\.css|app-theme\.css|tokens\.css/, `${PREVIEW_CSS} gets its theme only through the slot`)
})

test('preview.html loads only the preview entry', () => {
  const html = readFileSync(join(root, 'preview.html'), 'utf8')
  const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual(scripts, ['/src/preview/main.tsx'])
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ''), /<link[^>]+stylesheet/, 'the preview gets its fonts from the prototype theme')
})

/** What the preview may reach besides its own files and the prototype */
const PREVIEW_SHARED = new Set([
  'src/lib/live-edit/protocol.ts',
  'src/lib/comments/format.ts',
  'src/lib/comments/commands.ts',
  'src/lib/design-tokens-loader.ts',
  'src/lib/product-fonts.ts',
  'src/lib/model/spec.ts',
  'src/lib/shell-loader.ts',
])
const PREVIEW_PACKAGES_FORBIDDEN = /^(react-router|react-router-dom|@assistant-ui\/)/

function resolveImport(from, spec) {
  const base = spec.startsWith('@/') ? join(root, 'src', spec.slice(2)) : spec.startsWith('.') ? join(dirname(from), spec) : null
  if (!base) return null
  const clean = base.replace(/\?.*$/, '')
  for (const candidate of [clean, `${clean}.ts`, `${clean}.tsx`, join(clean, 'index.ts'), join(clean, 'index.tsx')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return clean
}

// Raw source: glob patterns like '/src/sections/*/*.tsx' look like comments to code()
const importsOf = (file) =>
  [...readFileSync(file, 'utf8').matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]|import\.meta\.glob\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1] ?? m[2])

test('the preview imports only the prototype, the preview bridge and the shared contract', () => {
  const seen = new Set()
  const queue = [join(root, 'src/preview/main.tsx')]
  const offenders = []
  while (queue.length) {
    const file = queue.pop()
    if (seen.has(file)) continue
    seen.add(file)
    for (const spec of importsOf(file)) {
      if (spec.startsWith('/')) {
        // import.meta.glob: the prototype and its data only
        if (!/^\/(src\/(sections|shell|clickdummy|ui)|product)\//.test(spec)) offenders.push(`${rel(file)} globs ${spec}`)
        continue
      }
      const target = resolveImport(file, spec)
      if (!target) {
        if (PREVIEW_PACKAGES_FORBIDDEN.test(spec)) offenders.push(`${rel(file)} imports ${spec}`)
        continue
      }
      const path = rel(target)
      if (/\.css$/.test(path) && path !== PREVIEW_CSS) offenders.push(`${rel(file)} imports ${path}`)
      else if (!(path.startsWith('src/preview/') || isProduct(target) || path.startsWith('src/types/') || path.startsWith('product/') || PREVIEW_SHARED.has(path))) offenders.push(`${rel(file)} imports ${path}`)
      else if (/\.(tsx?|jsx?)$/.test(path)) queue.push(target)
    }
  }
  assert.deepEqual(offenders, [])
  assert.ok(seen.size > 5, 'the walk must reach the preview modules')
})

test('the Design OS UI never imports prototype code (it lists the files by name only)', () => {
  const offenders = []
  for (const file of appFiles) {
    if (!/\.(tsx?|jsx?|mjs)$/.test(file)) continue
    const source = readFileSync(file, 'utf8')
    for (const m of source.matchAll(/import\.meta\.glob\(\s*['"](\/src\/(?:sections|shell|clickdummy|ui)\/[^'"]*)['"]\s*(,\s*\{[^}]*\})?/g)) {
      if (!/query:\s*['"]\?designos-file['"]/.test(m[2] ?? '')) offenders.push(`${rel(file)} globs ${m[1]} without ?designos-file`)
    }
    for (const spec of importsOf(file)) {
      const target = resolveImport(file, spec)
      if (target && isProduct(target)) offenders.push(`${rel(file)} imports ${rel(target)}`)
      if (target && under(PREVIEW_DIR)(target)) {
        const path = rel(target)
        const story = file.endsWith('.stories.tsx')
        if (!(path === 'src/preview/route.ts' || (story && path.startsWith('src/preview/bridge/')))) offenders.push(`${rel(file)} imports ${path}`)
      }
    }
  }
  assert.deepEqual(offenders, [])
})

test('the Volta template is a complete prototype theme', () => {
  const template = code(join(root, 'templates/volta/theme.css'))
  for (const token of [
    '--color-brand-blue-500',
    '--color-energy-green-500',
    '--color-rwe-sand-50',
    '--color-rwe-sand-500',
    '--color-rwe-neutral-900',
    '--color-rwe-neutral-950',
    '--color-rwe-focus',
    '--color-rwe-black-a-25',
  ]) {
    assert.match(template, new RegExp(token + '\\s*:'), `templates/volta/theme.css must define ${token}`)
  }
  for (const v of ['--background', '--foreground', '--primary', '--border', '--ring']) {
    assert.match(template, new RegExp(`--color-${v.slice(2)}:\\s*var\\(${v}\\)`), `templates/volta/theme.css must map ${v}`)
  }
  assert.match(template, /@custom-variant dark \(&:where\(\.dark, \.dark \*\)\);/)
  assert.doesNotMatch(template, /@import\s+["']tailwindcss|@source/, 'a template is a theme: the preview imports Tailwind and scans the prototype')
  assert.doesNotMatch(template, /product\//, 'a template does not reference product/')
})

const FORBIDDEN_IMPORTS = [
  /from\s+['"]@\/components\//, // Design OS UI incl. shadcn ui (styled with Design OS tokens)
  /from\s+['"]@\/lib\/design-(tokens|system)-loader['"]/,
  /import\s+['"][^'"]*\.css['"]/, // product code never brings its own global CSS into Design OS
]

test('product code does not import Design OS UI, token loaders or global CSS', () => {
  for (const file of productFiles) {
    const source = code(file)
    for (const pattern of FORBIDDEN_IMPORTS) {
      assert.doesNotMatch(source, pattern, `${rel(file)}: ${pattern}`)
    }
  }
})

test('the product UI layer exists in the product scope (src/ui)', () => {
  assert.ok(PRODUCT_DIRS.some((dir) => rel(dir) === 'src/ui'), 'src/ui must be checked like the other product directories')
  assert.ok(productFiles.some((file) => rel(file) === 'src/ui/utils.ts'), 'src/ui/utils.ts (cn helper) anchors the layer')
})

test('product UI primitives (src/ui) import no Design OS UI', () => {
  for (const file of walk(join(root, 'src/ui'), CODE)) {
    assert.doesNotMatch(code(file), /from\s+['"]@\/components\//, `${rel(file)} must not import Design OS UI`)
  }
})

// --- Design OS look: the shadcn preset (tests/design-os-theme.test.ts checks the palette) ---

test('the dark variant lets a nearer .light scope opt out (shell can differ from the page theme)', () => {
  assert.match(
    code(join(root, APP_CSS)),
    /@custom-variant dark \(&:is\(\.dark \*\):not\(:is\(\.light \*\)\)\)/,
  )
})

test('Inter is loaded for the app chrome', () => {
  assert.match(readFileSync(join(root, 'index.html'), 'utf8'), /family=Inter/)
})
