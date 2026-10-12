/**
 * Contract tests for the token import pipeline:
 *   deterministic  same input -> same bytes (also across key order and line endings)
 *   idempotent     running the build again changes nothing
 *   strict         every token is classified; Tailwind only knows imported tokens
 *
 * Golden files: tests/fixtures/basic/expected/. Regenerate after an intended change with
 *   UPDATE_GOLDEN=1 npm run test:tokens
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildFromDir, buildFromInputs, readImportDir, OUTPUTS } from '../pipeline.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = join(here, 'fixtures/basic')
const importDir = join(fixture, 'import')
const expectedDir = join(fixture, 'expected')
const cli = join(here, '..', 'cli.mjs')
const repoRoot = join(here, '..', '..', '..')

function shuffleKeys(node, seed = { n: 7 }) {
  if (Array.isArray(node)) return node.map((n) => shuffleKeys(n, seed))
  if (!node || typeof node !== 'object') return node
  const keys = Object.keys(node)
  // deterministic pseudo-shuffle: reverse + rotate
  keys.reverse()
  const rotated = keys.slice(seed.n % (keys.length || 1)).concat(keys.slice(0, seed.n % (keys.length || 1)))
  seed.n += 3
  return Object.fromEntries(rotated.map((k) => [k, shuffleKeys(node[k], seed)]))
}

/** Remove the parts that legitimately depend on input bytes (hashes, sizes). */
function withoutInputHashes(files) {
  return Object.fromEntries(
    Object.entries(files).map(([name, content]) => [
      name,
      content
        .replace(/[0-9a-f]{64}/g, '<sha256>')
        .replace(/sha256 [0-9a-f]{16}/g, 'sha256 <short>')
        .replace(/"bytes": \d+/g, '"bytes": 0')
        .replace(/\| (\d+) \|\n\| `DESIGN/g, '| 0 |\n| `DESIGN')
        .replace(/(\| `[^`]+` \| `<sha256>` \| )\d+( \|)/g, '$10$2'),
    ]),
  )
}

test('golden: fixture output matches the committed expected files', async () => {
  const { files } = await buildFromDir(importDir)
  if (process.env.UPDATE_GOLDEN) {
    for (const [name, content] of Object.entries(files)) {
      mkdirSync(dirname(join(expectedDir, name)), { recursive: true })
      writeFileSync(join(expectedDir, name), content)
    }
  }
  for (const name of Object.values(OUTPUTS)) {
    assert.equal(files[name], readFileSync(join(expectedDir, name), 'utf8'), `${name} differs from golden file`)
  }
})

test('deterministic: two builds produce identical bytes', async () => {
  const a = await buildFromDir(importDir)
  const b = await buildFromDir(importDir)
  assert.deepEqual(a.files, b.files)
})

test('deterministic: key order in tokens.json does not change the output', async () => {
  const inputs = readImportDir(importDir)
  const shuffled = {
    ...inputs,
    tokens: { ...inputs.tokens, text: JSON.stringify(shuffleKeys(JSON.parse(inputs.tokens.text)), null, 2) },
  }
  assert.notEqual(shuffled.tokens.text, inputs.tokens.text)
  const a = await buildFromInputs(inputs)
  const b = await buildFromInputs(shuffled)
  assert.deepEqual(withoutInputHashes(b.files), withoutInputHashes(a.files))
})

test('deterministic: CRLF line endings and BOM produce identical output', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-crlf-'))
  for (const name of readdirSync(importDir)) {
    const text = readFileSync(join(importDir, name), 'utf8')
    writeFileSync(join(dir, name), '\uFEFF' + text.replace(/\n/g, '\r\n'))
  }
  const a = await buildFromDir(importDir)
  const b = await buildFromDir(dir)
  assert.deepEqual(b.files, a.files)
})

test('idempotent: CLI build twice writes once, --check passes, drift is detected', () => {
  const work = mkdtempSync(join(tmpdir(), 'tokens-cli-'))
  const designDir = join(work, 'design-system')
  cpSync(importDir, join(designDir, 'import'), { recursive: true })
  const run = (...args) => spawnSync(process.execPath, [cli, '--dir', designDir, ...args], { cwd: repoRoot, encoding: 'utf8' })

  const first = run()
  assert.equal(first.status, 0, first.stderr)
  assert.match(first.stdout, /Wrote:/)
  const mtimes = Object.values(OUTPUTS).map((f) => statSync(join(designDir, f)).mtimeMs)

  const second = run()
  assert.equal(second.status, 0, second.stderr)
  assert.match(second.stdout, /No changes/)
  assert.deepEqual(Object.values(OUTPUTS).map((f) => statSync(join(designDir, f)).mtimeMs), mtimes)

  assert.equal(run('--check').status, 0)

  writeFileSync(join(designDir, OUTPUTS.css), '/* edited by hand */\n')
  const drift = run('--check')
  assert.equal(drift.status, 1)
  assert.match(drift.stderr, /tokens\.css/)
  assert.equal(readFileSync(join(designDir, OUTPUTS.css), 'utf8'), '/* edited by hand */\n', '--check must not write')

  assert.equal(run('--strict').status, 1, 'fixture has warnings, --strict must fail')
})

test('strict: every token is accounted for (emitted or documented with a reason)', async () => {
  const { model } = await buildFromDir(importDir)
  const tokenCount = (() => {
    let n = 0
    const walk = (node) => {
      if (node && typeof node === 'object' && '$value' in node) return void n++
      if (node && typeof node === 'object') Object.values(node).forEach(walk)
    }
    walk(JSON.parse(readFileSync(join(importDir, 'tokens.json'), 'utf8')))
    return n
  })()
  assert.equal(model.meta.counts.tokens, tokenCount)
  for (const n of model.report.notEmitted) assert.ok(n.reason.length > 0, n.category)
  const codes = model.report.issues.map((i) => i.code)
  for (const expected of ['missing-light', 'line-height-zero', 'mistyped-string', 'unclassified', 'palette-renamed', 'font-family-type']) {
    assert.ok(codes.includes(expected), `report contains ${expected}`)
  }
})

test('tailwind v4: tokens.css compiles and only imported tokens exist', async (t) => {
  const twPath = join(repoRoot, 'node_modules/@tailwindcss/node/dist/index.mjs')
  if (!existsSync(twPath)) return t.skip('@tailwindcss/node not installed')
  const { compile } = await import(twPath)

  const { files } = await buildFromDir(importDir)
  const dir = mkdtempSync(join(tmpdir(), 'tokens-tw-'))
  writeFileSync(join(dir, 'tokens.css'), files[OUTPUTS.css])
  const compiler = await compile(`@import "tailwindcss";\n@import "${join(dir, 'tokens.css')}";\n`, {
    base: repoRoot,
    from: join(repoRoot, 'app.css'),
    onDependency: () => {},
  })
  const css = compiler.build([
    'bg-primary', 'text-primary-foreground', 'border-border', 'bg-fuchsia-500', 'bg-zinc-500',
    'bg-primary-alpha-10', 'bg-backdrop-overlay', 'shadow-sm', 'shadow-ring', 'rounded-full', 'rounded-sm',
    'text-xs', 'font-semibold', 'font-normal', 'font-sans', 'p-4', 'md:flex',
    // Not in the import -> must not be generated
    'bg-red-500', 'rounded-2xl', 'text-2xl', 'shadow-2xl', 'lg:flex',
  ])

  for (const utility of ['bg-primary', 'text-primary-foreground', 'border-border', 'bg-fuchsia-500', 'bg-zinc-500', 'bg-primary-alpha-10', 'bg-backdrop-overlay', 'shadow-sm', 'shadow-ring', 'rounded-full', 'rounded-sm', 'text-xs', 'font-semibold', 'font-normal', 'font-sans', 'p-4']) {
    assert.ok(css.includes(`.${utility} {`) || css.includes(`.${utility}{`), `${utility} generated`)
  }
  assert.ok(css.includes('.md\\:flex'), 'md breakpoint generated')
  for (const utility of ['bg-red-500', 'rounded-2xl', 'text-2xl', 'shadow-2xl']) {
    assert.ok(!css.includes(`.${utility} {`), `${utility} must not exist (strict import)`)
  }
  assert.ok(!css.includes('.lg\\:flex'), 'lg breakpoint must not exist')
  assert.match(css, /\.dark[^{]*\{[^}]*--primary: oklch\(80\.08% 0\.13\d* 181\.21\)/s, '.dark overrides semantic colors')
})
