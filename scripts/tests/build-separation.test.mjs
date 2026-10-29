/**
 * The production build keeps the two setups apart (run after `vite build`: npm run test:build).
 *
 *   index.html   (Design OS UI)  reaches no module of src/sections, src/shell, src/clickdummy, src/ui
 *                                (names only: `?designos-file` stubs), and its CSS is design-os.css
 *   preview.html (prototype)     reaches no module of src/components or src/styles, and its CSS is
 *                                preview.css with the prototype theme
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const dist = join(root, 'dist')
const read = (file) => JSON.parse(readFileSync(join(dist, '.vite', file), 'utf8'))

assert.ok(existsSync(join(dist, '.vite/modules.json')), 'run vite build first (npm run test:build)')
const chunks = read('modules.json')
const manifest = read('manifest.json')

/** Every module the entry can load, statically or on demand */
function reachable(html) {
  const entry = Object.entries(chunks).find(([, c]) => c.entry?.endsWith(`/${html}`))
  assert.ok(entry, `no chunk for ${html}`)
  const seen = new Set()
  const queue = [entry[0]]
  while (queue.length) {
    const file = queue.pop()
    if (seen.has(file)) continue
    seen.add(file)
    queue.push(...chunks[file].imports)
  }
  return [...seen].flatMap((file) => chunks[file].modules)
}

const css = (html) => manifest[html].css.map((file) => readFileSync(join(dist, file), 'utf8')).join('\n')
const PROTOTYPE = /^\/src\/(sections|shell|clickdummy|ui)\//

test('the Design OS entry loads no prototype code', () => {
  const leaks = reachable('index.html').filter((id) => PROTOTYPE.test(id) && !id.includes('?designos-file'))
  assert.deepEqual(leaks, [])
})

test('the preview entry loads no Design OS UI', () => {
  const leaks = reachable('preview.html').filter((id) => /^\/src\/(components|styles)\//.test(id))
  assert.deepEqual(leaks, [])
})

test('each entry has its own stylesheet', () => {
  const app = css('index.html')
  const preview = css('preview.html')
  assert.match(app, /--designos-scope:\s*app/)
  assert.doesNotMatch(app, /--designos-scope:\s*prototype/)
  assert.match(preview, /--designos-scope:\s*prototype/)
  assert.doesNotMatch(preview, /--designos-scope:\s*app/)
})
