import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Vite treats a module as self-accepting only when it finds a literal `import.meta.hot.accept(`.
 * Without it, a new comment in wiki/comments/ hot-updates up to the pages and the preview reloads.
 */
describe('wiki files hot update', () => {
  it('accepts its own updates with a literal import.meta.hot.accept call', () => {
    const code = readFileSync(join(__dirname, '../src/lib/wiki-files.ts'), 'utf8')
    expect(code).toMatch(/import\.meta\.hot\??\.accept\(/)
  })
})
