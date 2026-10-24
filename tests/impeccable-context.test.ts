import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM script without types
import { linkContext } from '../scripts/impeccable-context.mjs'

let root: string
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'imp-ctx-'))
})
afterEach(() => fs.rmSync(root, { recursive: true, force: true }))
const write = (file: string, text: string) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  fs.writeFileSync(path.join(root, file), text)
}
const statuses = (r: { links: { name: string; status: string }[] }) => Object.fromEntries(r.links.map((l) => [l.name, l.status]))

describe('linkContext', () => {
  it('links DESIGN.md and PRODUCT.md into .agents/context and records buildPath code', () => {
    write('product/design-system/DESIGN.md', '# Design')
    write('wiki/product/PRODUCT.md', '# Product')
    expect(statuses(linkContext(root))).toEqual({ 'DESIGN.md': 'linked', 'PRODUCT.md': 'linked' })
    expect(fs.readFileSync(path.join(root, '.agents/context/DESIGN.md'), 'utf8')).toBe('# Design')
    expect(fs.readlinkSync(path.join(root, '.agents/context/PRODUCT.md'))).toBe('../../wiki/product/PRODUCT.md')
    expect(JSON.parse(fs.readFileSync(path.join(root, '.impeccable/config.json'), 'utf8'))).toEqual({ buildPath: 'code' })
    // Idempotent
    expect(statuses(linkContext(root))).toEqual({ 'DESIGN.md': 'linked', 'PRODUCT.md': 'linked' })
  })

  it('leaves a missing target out and removes its old link', () => {
    write('product/design-system/DESIGN.md', '# Design')
    write('wiki/product/PRODUCT.md', '# Product')
    linkContext(root)
    fs.rmSync(path.join(root, 'wiki/product/PRODUCT.md'))
    expect(statuses(linkContext(root))['PRODUCT.md']).toBe('missing')
    expect(fs.existsSync(path.join(root, '.agents/context/PRODUCT.md'))).toBe(false)
  })

  it('never replaces a real file and keeps other config keys', () => {
    write('product/design-system/DESIGN.md', '# Design')
    write('.agents/context/DESIGN.md', '# Somebody else')
    write('.impeccable/config.json', '{"stalenessCheck": false}')
    expect(statuses(linkContext(root))['DESIGN.md']).toBe('blocked')
    expect(fs.readFileSync(path.join(root, '.agents/context/DESIGN.md'), 'utf8')).toBe('# Somebody else')
    expect(JSON.parse(fs.readFileSync(path.join(root, '.impeccable/config.json'), 'utf8'))).toEqual({ stalenessCheck: false, buildPath: 'code' })
  })
})
