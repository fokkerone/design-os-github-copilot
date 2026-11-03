import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PNG } from 'pngjs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createLineParser, type SyncEvent } from '@/lib/penpot/client'
import { createFakeMcp } from './helpers/fake-penpot-mcp'
// @ts-expect-error plain ESM script without types
import { buildTokens, classHint, createResolver } from '../scripts/penpot/token-map.mjs'
// @ts-expect-error plain ESM script without types
import { chunkOps, createBuilder, isLeaf, variantProperties } from '../scripts/penpot/design-tree.mjs'
// @ts-expect-error plain ESM script without types
import { rpc } from '../scripts/penpot/rpc.mjs'
import { assertLinkedFile, createFile, runSync, status, writeLink } from '../scripts/penpot/sync.mjs'
// @ts-expect-error plain ESM script without types
import { comparePixels } from '../scripts/penpot/verify.mjs'
// @ts-expect-error plain ESM script without types
import { createHandler } from '../scripts/penpot/plugin.mjs'
// @ts-expect-error plain ESM script without types
import { toolText, parseResult } from '../scripts/penpot/mcp-client.mjs'

const hex = (value: string, alpha = 1) => ({ hex: value, alpha })
const model = {
  color: {
    semantic: [{ name: 'primary', light: hex('#0f766e'), dark: hex('#2dd4bf') }],
    custom: [],
    alpha: [{ name: 'primary', steps: [{ step: '10', value: hex('#1717171a', 0.102) }] }],
    palettes: [{ name: 'teal', steps: [{ step: '600', value: hex('#0d9488') }] }, { name: 'stone', steps: [{ step: '900', value: hex('#1c1917') }, { step: '200', value: hex('#e7e5e4') }] }],
    gradients: [{ name: 'g' }],
  },
  typography: { fontFamilies: [{ name: 'sans', family: 'Inter' }], fontSizes: [{ name: 'sm', px: 14 }], fontWeights: [{ name: 'medium', value: 500 }], textStyles: [] },
  spacing: { scale: [{ name: '0.5', px: 2 }, { name: '4', px: 16 }] },
  radius: [{ name: 'md', px: 4 }, { name: 'full', px: 9999 }],
  sizing: [],
  breakpoints: [{ name: 'sm', px: 640 }],
  shadows: [
    { name: 'xs', light: { layers: [{ offsetX: 0, offsetY: 1, blur: 2, spread: 0, color: hex('#00000014', 0.08) }] }, dark: null },
    { name: 'md', light: { layers: [{ offsetX: 0, offsetY: 4, blur: 6, spread: -1, color: hex('#0000001a', 0.1) }] }, dark: null },
  ],
  opacity: [{ name: '50', value: 50 }],
  effects: [],
}

const element = (over: Record<string, unknown> = {}) => ({
  kind: 'element',
  tag: 'div',
  where: 'src/x.tsx:1:1',
  cls: '',
  rect: { x: 0, y: 0, w: 100, h: 40 },
  comps: [],
  owners: [],
  opacity: 1,
  background: null,
  borders: [0, 0, 0, 0].map((width) => ({ width, color: null })),
  radius: [0, 0, 0, 0],
  shadows: [],
  clip: false,
  layout: { display: 'block', direction: 'row', justify: 'normal', align: 'normal', rowGap: 0, columnGap: 0, padding: [0, 0, 0, 0], textAlign: 'start' },
  kids: [],
  ...over,
})
const text = (chars: string) => ({ kind: 'text', chars, rect: { x: 10, y: 10, w: 40, h: 20 }, lineBox: 20, opacity: 1, font: { family: 'Inter', size: 14, weight: 500, style: 'normal', letterSpacing: 0, transform: 'none', decoration: 'none', align: 'start', color: hex('#1c1917') } })
const capture = (tree: unknown) => ({ tree, pageBackground: hex('#ffffff'), pageClasses: '', size: { w: 100, h: 40 }, unsupported: [] })
const ctx = { viewport: 'desktop', mode: 'light', where: 'a/B' }
const builder = () => {
  const resolver = createResolver(buildTokens(model).sets)
  return { resolver, b: createBuilder(resolver) }
}
const button = (label: string, width: number, id = 1) =>
  element({ tag: 'button', rect: { x: 0, y: 0, w: width, h: 40 }, background: hex('#0d9488'), cls: 'bg-teal-600', comps: [{ id, name: 'Button', tier: 'ui', props: { size: 'lg' }, hasChildren: true }], kids: [text(label)] })

describe('Penpot tokens', () => {
  it('names light and dark apart, so both can show at once without a theme', () => {
    const names = buildTokens(model).sets.flatMap((s: { tokens: { name: string }[] }) => s.tokens.map((t) => t.name))
    expect(names).toEqual(expect.arrayContaining(['color.light.primary', 'color.dark.primary', 'color.teal.600', 'color.alpha.primary.10', 'font.size.sm', 'radius.md', 'spacing.0-5', 'opacity.50', 'shadow.light.xs']))
  })

  it('leaves out what Penpot has no token for and says so', () => {
    const tokens = buildTokens(model)
    const names = tokens.sets.flatMap((s: { tokens: { name: string }[] }) => s.tokens.map((t) => t.name))
    expect(names).not.toContain('shadow.light.md')
    expect(tokens.skipped.join()).toMatch(/negative spread/)
    expect(tokens.skipped.join()).toMatch(/gradients/)
  })

  it('finds the token through the class first, then through the value', () => {
    const { resolver } = builder()
    expect(resolver.color('#0d9488', 1, 'light', ['teal-600'])).toBe('color.teal.600')
    expect(resolver.color('#2dd4bf', 1, 'dark', [])).toBe('color.dark.primary')
    // The browser's conversion may land one step next to the rounded token value
    expect(resolver.color('#0d9489', 1, 'light', [])).toBe('color.teal.600')
  })

  it('records a value without a token as a violation', () => {
    const { resolver } = builder()
    expect(resolver.color('#123456', 1, 'light', [], 'src/a.tsx')).toBeNull()
    expect(resolver.violations()).toEqual([{ kind: 'color', value: '#123456', where: ['src/a.tsx'] }])
  })

  it('reads the class of the current mode first', () => {
    expect(classHint('bg-teal-600 dark:bg-teal-300 hover:bg-teal-700', 'bg', 'dark')).toEqual(['teal-300', 'teal-600'])
    expect(classHint('bg-teal-600 dark:bg-teal-300', 'bg', 'light')).toEqual(['teal-600'])
  })
})

describe('Penpot design tree', () => {
  it('makes one component for a primitive, whatever its label or width', () => {
    const { b } = builder()
    const tree = element({ kids: [button('Save', 100), button('A longer label', 300, 2)] })
    const { ops } = b.screen(capture(tree), ctx)
    const instances = ops.filter((o: { t: string }) => o.t === 'instance')
    expect(instances).toHaveLength(2)
    expect(instances[0].key).toBe(instances[1].key)
    expect(instances.map((i: { overrides: string[]; w: number }) => [i.overrides, i.w])).toEqual([[['Save'], 100], [['A longer label'], 300]])
    expect(b.mains()).toHaveLength(1)
  })

  it('makes a separate variant when the look differs', () => {
    const { b } = builder()
    const outline = { ...button('Save', 100), background: null }
    b.screen(capture(element({ kids: [button('Save', 100), outline] })), ctx)
    expect(b.mains()).toHaveLength(2)
  })

  it('puts slot content next to the instance, because copies cannot get new layers', () => {
    const { b } = builder()
    const content = button('Inside', 100, 9)
    const card = element({ tag: 'section', background: hex('#ffffff'), comps: [{ id: 5, name: 'Card', tier: 'ui', props: {}, hasChildren: true }], kids: [content] })
    const { ops } = b.screen(capture(element({ kids: [card] })), ctx)
    expect(ops.map((o: { name: string }) => o.name)).toEqual(['Card', 'Button'])
  })

  it('keeps what a component rendered itself inside its own main', () => {
    const { b } = builder()
    const inner = { ...button('Own', 100, 9), owners: [7] }
    const form = element({ comps: [{ id: 7, name: 'LoginForm', tier: 'composite', props: {}, hasChildren: false }], kids: [inner] })
    const { ops } = b.screen(capture(element({ kids: [form] })), ctx)
    expect(ops.map((o: { name: string }) => o.name)).toEqual(['LoginForm'])
    const mains = b.mains()
    expect(mains.map((m: { name: string }) => m.name)).toEqual(['Button', 'LoginForm'])
  })

  it('keeps a composite of only text and icons where the browser put it', () => {
    const { b } = builder()
    const tab = (x: number, label: string) => element({ tag: 'button', rect: { x, y: 0, w: 50, h: 40 }, owners: [3], kids: [{ ...text(label), rect: { x, y: 10, w: 40, h: 20 } }] })
    const nav = element({ tag: 'nav', comps: [{ id: 3, name: 'MainNav', tier: 'composite', props: {}, hasChildren: false }], kids: [tab(0, 'One'), tab(200, 'Two')] })
    b.screen(capture(element({ kids: [nav] })), ctx)
    const [main] = b.mains()
    expect(main.flex).toBeNull()
    expect(main.kids.map((k: { x: number; chars: string }) => [k.chars, k.x])).toEqual([['One', 0], ['Two', 200]])
  })

  it('keeps mixed inline text of a primitive at its measured positions, with no override', () => {
    const { b } = builder()
    const unit = element({ tag: 'span', kids: [{ ...text('kWh'), rect: { x: 60, y: 10, w: 20, h: 20 } }] })
    const label = element({ comps: [{ id: 4, name: 'Label', tier: 'ui', props: {}, hasChildren: true }], kids: [text('Reading ('), unit] })
    const { ops } = b.screen(capture(element({ kids: [label] })), ctx)
    expect(ops[0].overrides).toEqual([])
    const [main] = b.mains()
    expect(main.flex).toBeNull()
    expect(main.kids.map((k: { x: number }) => k.x)).toEqual([10, 60])
  })

  it('gives a dimmed primitive its opacity on the instance, not in the main', () => {
    const { b } = builder()
    const dimmed = { ...button('Save', 100), opacity: 0.5, kids: [{ ...text('Save'), opacity: 0.5 }] }
    const plain = button('Save', 100, 2)
    const { ops } = b.screen(capture(element({ kids: [dimmed, plain] })), ctx)
    expect(ops.map((o: { opacity: number }) => o.opacity)).toEqual([0.5, 1])
    expect(ops[0].key).toBe(ops[1].key)
    expect(b.mains()[0].kids[0].opacity).toBe(1)
  })

  it('binds the page background to a token', () => {
    const { b } = builder()
    const screen = b.screen({ ...capture(element()), pageBackground: hex('#2dd4bf') }, { ...ctx, mode: 'dark' })
    expect(screen.tokens.fill).toBe('color.dark.primary')
    expect(screen.fills[0].fillColor).toBe('#2DD4BF')
  })

  it('draws a single border side as a thin rectangle', () => {
    const { b } = builder()
    const borders = [{ width: 0, color: null }, { width: 0, color: null }, { width: 1, color: hex('#e7e5e4') }, { width: 0, color: null }]
    const { ops } = b.screen(capture(element({ borders })), ctx)
    const side = ops.find((o: { name: string }) => o.name.includes('border-bottom'))
    expect(side).toMatchObject({ y: 39, h: 1, w: 100, tokens: { fill: 'color.stone.200' } })
  })

  it('sees text and icons as a leaf, nested surfaces not', () => {
    expect(isLeaf(element({ kids: [text('a'), element({ tag: 'svg' })] }))).toBe(true)
    expect(isLeaf(element({ kids: [element({ background: hex('#fff') })] }))).toBe(false)
  })

  it('numbers variants per component', () => {
    const groups = variantProperties([
      { key: 'a', tier: 'ui', name: 'Button', viewport: 'all', mode: 'light' },
      { key: 'b', tier: 'ui', name: 'Button', viewport: 'all', mode: 'dark' },
    ])
    expect(groups[0].members.map((m: { properties: { state: string } }) => m.properties.state)).toEqual(['s1', 's2'])
  })

  it('cuts ops below the MCP body limit and refuses one that cannot fit', () => {
    const op = (n: number) => ({ name: 'x', pad: 'x'.repeat(n) })
    expect(chunkOps([op(600), op(600), op(600)], 1000)).toHaveLength(3)
    expect(() => chunkOps([op(2000)], 1000)).toThrow(/larger than one MCP call/)
  })
})

describe('Penpot sync', () => {
  let root: string
  const LINKED = { id: 'file-1', name: 'Linked' }
  const emptyCapture = async () => []
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'penpot-'))
    fs.mkdirSync(path.join(root, 'product/design-system/tokens'), { recursive: true })
    fs.writeFileSync(path.join(root, 'product/design-system/tokens/tokens.json'), JSON.stringify(model))
    fs.mkdirSync(path.join(root, 'scripts/penpot'), { recursive: true })
    fs.writeFileSync(path.join(root, 'scripts/penpot/runtime.js'), '({})')
    fs.mkdirSync(path.join(root, 'src/sections/account'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src/sections/account/Login.tsx'), '')
    writeLink(root, { fileId: 'file-1', teamId: 't', name: 'Linked', url: 'u' })
  })
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }))
  const env = { url: 'http://p', key: 'k', token: 't' }

  it('refuses a file that is not the linked one', () => {
    expect(() => assertLinkedFile({ id: 'other', name: 'Other' }, { fileId: 'file-1', name: 'Linked' })).toThrow(/not the linked file/)
    expect(() => assertLinkedFile({ id: 'x' }, null)).toThrow(/Create the file first/)
  })

  it('writes nothing when another file is connected', async () => {
    const fake = createFakeMcp({ id: 'other', name: 'Other' })
    await expect(runSync({ root, baseUrl: 'b', action: 'all', env, connect: fake.connect, capture: emptyCapture })).rejects.toThrow(/not the linked file/)
    expect(fake.calls).toEqual([])
  })

  it('runs tokens, then components, then the section', async () => {
    const fake = createFakeMcp(LINKED)
    const captures = async () => [{ section: 'account', screen: 'Login', variant: { viewport: 'desktop', mode: 'light' }, data: capture(element()) }]
    await runSync({ root, baseUrl: 'b', action: 'section', sectionId: 'account', env, connect: fake.connect, capture: captures })
    const order = ['install', 'upsertTokens', 'existingKeys', 'startBoard'].map((c) => fake.calls.indexOf(c))
    expect(order.every((n) => n >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('reports a percentage that only rises and ends at 100', async () => {
    const fake = createFakeMcp(LINKED)
    const captures = async (_r: string, _b: string, _s: unknown, log: (m: string) => void) => {
      log('capture')
      return [{ section: 'account', screen: 'Login', variant: { viewport: 'desktop', mode: 'light' }, data: capture(element()) }]
    }
    const events: { step: string; percent?: number }[] = []
    await runSync({ root, baseUrl: 'b', action: 'all', env, connect: fake.connect, capture: captures, log: (e: { step: string; percent?: number }) => events.push(e) })
    const percents = events.map((e) => e.percent as number)
    expect(percents.every((p) => Number.isFinite(p) && p >= 0 && p <= 100)).toBe(true)
    expect([...percents].sort((a, b) => a - b)).toEqual(percents)
    expect(percents.at(-1)).toBe(100)
    // This screen has no component, so nothing in the components phase reports
    expect(new Set(events.map((e) => e.step))).toEqual(new Set(['tokens', 'capture', 'section', 'verify', 'done']))
  })

  it('says where a run stopped and that a new run continues', async () => {
    const fake = createFakeMcp(LINKED)
    fake.failures.set('startBoard', new Error('Error handling task: [PENPOT PLUGIN] Value not valid: 2. Code: :pos'))
    const captures = async () => [{ section: 'account', screen: 'Login', variant: { viewport: 'desktop', mode: 'light' }, data: capture(element()) }]
    await expect(runSync({ root, baseUrl: 'b', action: 'all', env, connect: fake.connect, capture: captures })).rejects.toThrow(/^Stopped at "Building account: Login \/ desktop \/ light": Value not valid: 2\. Code: :pos What is finished stays/)
  })

  it('names a suspended tab in words', async () => {
    const fake = createFakeMcp(LINKED)
    fake.failures.set('existingKeys', new Error('The Penpot plugin tab appears to be suspended by the browser (no heartbeat for 31s).'))
    await expect(runSync({ root, baseUrl: 'b', action: 'components', env, connect: fake.connect, capture: emptyCapture })).rejects.toThrow(/Click into it and keep it visible/)
  })

  describe('when a variant group fails', () => {
    const twoLooks = async () => [
      { section: 'account', screen: 'Login', variant: { viewport: 'desktop', mode: 'light' }, data: capture(element({ kids: [button('Save', 100), { ...button('Back', 100), background: null }] })) },
    ]

    it('finishes the run and names the group', async () => {
      const fake = createFakeMcp(LINKED)
      fake.failures.set('variants', new Error('Error handling task: [PENPOT PLUGIN] Value not valid: 2. Code: :pos'))
      const report = await runSync({ root, baseUrl: 'b', action: 'all', env, connect: fake.connect, capture: twoLooks })
      expect(report.components.variantFailures).toEqual([{ name: expect.stringContaining('/'), message: 'Value not valid: 2. Code: :pos' }])
      expect(fake.calls).toContain('startBoard')
    })

    it('tidies the component page after the groups, and goes on when that fails', async () => {
      const fake = createFakeMcp(LINKED)
      fake.failures.set('arrangeComponents', new Error('Value not valid'))
      await runSync({ root, baseUrl: 'b', action: 'all', env, connect: fake.connect, capture: twoLooks })
      expect(fake.calls.indexOf('arrangeComponents')).toBeGreaterThan(fake.calls.indexOf('variants'))
      expect(fake.calls).toContain('startBoard')
    })

    it('still stops when the tab is gone, because nothing after it can work', async () => {
      const fake = createFakeMcp(LINKED)
      fake.failures.set('variants', new Error('No Penpot instance connected for user token.'))
      await expect(runSync({ root, baseUrl: 'b', action: 'all', env, connect: fake.connect, capture: twoLooks })).rejects.toThrow(/no longer connected/)
      expect(fake.calls).not.toContain('startBoard')
    })
  })

  it('stops after the tokens when only they are asked for', async () => {
    const fake = createFakeMcp(LINKED)
    await runSync({ root, baseUrl: 'b', action: 'tokens', env, connect: fake.connect, capture: emptyCapture })
    expect(fake.calls).not.toContain('startBoard')
    expect(fake.calls).not.toContain('existingKeys')
  })

  it('refuses an unknown section', async () => {
    const fake = createFakeMcp(LINKED)
    await expect(runSync({ root, baseUrl: 'b', action: 'section', sectionId: 'nope', env, connect: fake.connect, capture: emptyCapture })).rejects.toThrow(/Unknown section/)
  })

  it('stores the report with the link, without any key', async () => {
    const fake = createFakeMcp(LINKED)
    await runSync({ root, baseUrl: 'b', action: 'tokens', env: { ...env, key: 'SECRET-KEY', token: 'SECRET-TOKEN' }, connect: fake.connect, capture: emptyCapture })
    const stored = fs.readFileSync(path.join(root, 'product/penpot/penpot.json'), 'utf8')
    expect(JSON.parse(stored).lastSync.action).toBe('tokens')
    expect(stored).not.toContain('SECRET')
  })

  it('creates the file in the default team once', async () => {
    fs.rmSync(path.join(root, 'product/penpot'), { recursive: true })
    const rpcCall = async (_auth: unknown, method: string) =>
      ({ 'get-teams': [{ id: 't1', isDefault: true }], 'get-projects': [{ id: 'p1', isDefault: true }], 'create-file': { id: 'f1', name: 'Mine', data: { pages: ['pg'] } } })[method]
    const link = await createFile({ root, name: 'Mine', env, rpcCall })
    expect(link).toMatchObject({ fileId: 'f1', teamId: 't1', url: 'http://p/#/workspace?team-id=t1&file-id=f1&page-id=pg' })
    await expect(createFile({ root, name: 'Mine', env, rpcCall })).rejects.toThrow(/already linked/)
  })

  describe('when the linked file was deleted in Penpot', () => {
    const notFound = () => Object.assign(new Error('Penpot get-file-summary failed (404)'), { code: 'object-not-found' })
    const deleted = async (_auth: unknown, method: string) => {
      if (method === 'get-file-summary') throw notFound()
      return ({ 'get-teams': [{ id: 't1', isDefault: true }], 'get-projects': [{ id: 'p1', isDefault: true }], 'create-file': { id: 'f2', name: 'New', data: { pages: ['pg'] } } } as Record<string, unknown>)[method]
    }

    it('offers a new file instead of the dead link', async () => {
      const result = await status({ root, env: { ...env, key: '' }, rpcCall: deleted })
      expect(result.link).toBeNull()
      expect(result.goneFile).toBe('Linked')
    })

    it('replaces the link and forgets the old report', async () => {
      writeLink(root, { fileId: 'file-1', teamId: 't', name: 'Linked', url: 'u', lastSync: { action: 'all' } })
      const link = await createFile({ root, name: 'New', env, rpcCall: deleted })
      expect(link.fileId).toBe('f2')
      const stored = JSON.parse(fs.readFileSync(path.join(root, 'product/penpot/penpot.json'), 'utf8'))
      expect(stored.fileId).toBe('f2')
      expect(stored.lastSync).toBeUndefined()
    })

    it('keeps the link when Penpot is only unreachable or refuses the token', async () => {
      for (const failure of [new Error('fetch failed'), Object.assign(new Error('401'), { status: 401, code: 'authentication-required' })]) {
        const rpcCall = async () => {
          throw failure
        }
        const result = await status({ root, env: { ...env, key: '' }, rpcCall })
        expect(result.link?.fileId).toBe('file-1')
        expect(result.goneFile).toBeUndefined()
        await expect(createFile({ root, name: 'New', env, rpcCall })).rejects.toThrow(/already linked/)
      }
    })
  })

  it('reports a missing key and a tab that is not connected', async () => {
    const rpcCall = async () => ({})
    expect((await status({ root, env: { ...env, key: '' }, rpcCall })).connection.state).toBe('no-key')
    const connect = async () => ({ execute: async () => Promise.reject(new Error('No Penpot instance connected for user token')), close: async () => {} })
    expect((await status({ root, env, connect, rpcCall })).connection.state).toBe('not-connected')
    const wrong = createFakeMcp({ id: 'other', name: 'Other' })
    expect((await status({ root, env, connect: wrong.connect, rpcCall })).connection.state).toBe('wrong-file')
  })
})

describe('Penpot endpoint', () => {
  const response = () => {
    const r = { statusCode: 0, headers: {} as Record<string, string>, body: '', headersSent: false, setHeader(k: string, v: string) { r.headers[k] = v }, write(c: string) { r.body += c }, end(c = '') { r.body += c } }
    return r
  }
  const request = (method: string, body?: unknown, header = '1') => {
    const handlers: Record<string, (c?: string) => void> = {}
    const req = { method, headers: { 'x-designos-live-edit': header }, on(e: string, fn: (c?: string) => void) { handlers[e] = fn; if (e === 'end') queueMicrotask(() => { if (body !== undefined) handlers.data?.(JSON.stringify(body)); handlers.end?.() }) } }
    return req
  }
  const load = async () => ({ status: async () => ({ connection: { state: 'connected' } }), createFile: async () => ({ fileId: 'f' }), runSync: async ({ log }: { log: (e: SyncEvent) => void }) => log({ step: 'done', message: 'Done' }) })
  const handler = () => createHandler({ root: '/r', baseUrl: () => 'b', load })

  it('needs the header, so a page elsewhere cannot trigger a sync', async () => {
    const res = response()
    await handler()(request('GET', undefined, '0'), res)
    expect(res.statusCode).toBe(405)
  })

  it('streams progress and refuses unknown actions and section ids', async () => {
    const ok = response()
    await handler()(request('POST', { action: 'tokens' }), ok)
    expect(ok.body).toContain('"step":"done"')
    const unknown = response()
    await handler()(request('POST', { action: 'wipe' }), unknown)
    expect(unknown.statusCode).toBe(400)
    const bad = response()
    await handler()(request('POST', { action: 'section', sectionId: '../x' }), bad)
    expect(bad.statusCode).toBe(400)
  })

  it('runs one sync at a time', async () => {
    let release = () => {}
    const slow = async () => ({ ...(await load()), runSync: () => new Promise<void>((r) => { release = r }) })
    const h = createHandler({ root: '/r', baseUrl: () => 'b', load: slow })
    const first = h(request('POST', { action: 'all' }), response())
    await new Promise((r) => setTimeout(r, 5))
    const second = response()
    await h(request('POST', { action: 'all' }), second)
    expect(second.statusCode).toBe(409)
    release()
    await first
  })
})

describe('Penpot helpers', () => {
  it('keeps Penpot\'s error code on a failed call', async () => {
    const fetchImpl = async () => new Response(JSON.stringify({ code: 'object-not-found', hint: 'gone' }), { status: 404 })
    await expect(rpc({ url: 'http://p', token: 't', fetchImpl }, 'get-file-summary', { id: 'x' })).rejects.toMatchObject({ status: 404, code: 'object-not-found' })
  })

  it('treats the server\'s plain text failure as an error', () => {
    expect(() => toolText({ content: [{ type: 'text', text: 'Tool execution failed: Error: No Penpot instance' }] })).toThrow('No Penpot instance')
    expect(parseResult('{"result":{"a":1}}')).toEqual({ a: 1 })
    expect(parseResult('plain')).toBe('plain')
  })

  it('parses NDJSON across chunks', () => {
    const events: SyncEvent[] = []
    const parse = createLineParser((e) => events.push(e))
    parse('{"step":"a","mess')
    parse('age":"m"}\n{"step":"b","message":"n"}\n')
    expect(events.map((e) => e.step)).toEqual(['a', 'b'])
  })

  it('counts differences inside and outside text apart', () => {
    const image = (paint?: [number, number]) => {
      const p = new PNG({ width: 20, height: 20 })
      p.data.fill(255)
      if (paint) for (let y = paint[1]; y < paint[1] + 3; y++) for (let x = paint[0]; x < paint[0] + 3; x++) { const i = (y * 20 + x) * 4; p.data[i] = p.data[i + 1] = p.data[i + 2] = 0 }
      return PNG.sync.write(p)
    }
    const tree = { kids: [{ kind: 'text', rect: { x: 2, y: 2, w: 4, h: 4 } }] }
    const same = comparePixels(image(), image(), tree)
    expect(same).toMatchObject({ sizeMatches: true, changed: 0 })
    const outside = comparePixels(image(), image([14, 14]), tree)
    expect(outside.outsideText).toBeGreaterThan(0)
    expect(outside.insideText).toBe(0)
    const inside = comparePixels(image(), image([3, 3]), tree)
    expect(inside.insideText).toBeGreaterThan(0)
    expect(inside.outsideText).toBe(0)
  })

  it('reports a different size instead of comparing', () => {
    const png = (w: number) => PNG.sync.write(new PNG({ width: w, height: 5 }))
    expect(comparePixels(png(5), png(6), { kids: [] })).toMatchObject({ sizeMatches: false, web: '5x5', penpot: '6x5' })
  })
})
