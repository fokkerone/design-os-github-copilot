import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// Penpot applies changes with a delay that grows with the file. Longer than any fixed wait in the old code
const DELAY = 500
const later = (fn: () => void) => void setTimeout(fn, DELAY)

function fakePenpot(keys: string[], existing?: { properties: string[]; name: string; members: string[] }) {
  const values = new Map<string, unknown[]>()
  const container = {
    id: 'group',
    name: existing?.name ?? 'Component 1',
    isVariantContainer: () => true,
    variants: {
      properties: existing ? [...existing.properties] : ['Property 1'],
      addProperty() {
        later(() => container.variants.properties.push(`Property ${container.variants.properties.length + 1}`))
      },
      renameProperty(pos: number, name: string) {
        if (pos >= container.variants.properties.length) throw new Error(`Value not valid: ${pos}. Code: :pos`)
        later(() => {
          container.variants.properties[pos] = name
        })
      },
      variantComponents: () => comps.filter((c) => c.main.parent === container),
    },
    appendChild(main: { parent: unknown }) {
      later(() => {
        main.parent = container
      })
    },
  }
  const page = { isVariantContainer: () => false }
  const comps = keys.map((key) => {
    const comp = {
      id: key,
      main: { parent: (existing?.members.includes(key) ? container : page) as unknown },
      getSharedPluginData: () => key,
      mainInstance: () => comp.main,
      setVariantProperty(pos: number, value: unknown) {
        if (pos >= container.variants.properties.length) throw new Error(`Value not valid: ${pos}. Code: :pos`)
        values.set(key, [...(values.get(key) ?? []), value])
      },
    }
    return comp
  })
  const penpot = {
    library: { local: { components: comps } },
    createVariantFromComponents(mains: { parent: unknown }[]) {
      for (const m of mains) m.parent = container
      return container
    },
  }
  const penpotUtils = { findShapeById: () => container }
  const source = fs.readFileSync(path.join(process.cwd(), 'scripts/penpot/runtime.js'), 'utf8')
  const dos = new Function('penpot', 'penpotUtils', 'storage', `return (${source.trim().replace(/;$/, '')})`)(penpot, penpotUtils, {})
  return { dos, container, values }
}

const group = (keys: string[]) => ({
  name: 'ui/Card',
  members: keys.map((key, i) => ({ key, properties: { viewport: 'desktop', mode: 'light', state: `s${i + 1}` } })),
})

describe('Penpot layout', () => {
  const dosOn = (children: { x: number; y: number; width: number; height: number }[]) => {
    const source = fs.readFileSync(path.join(process.cwd(), 'scripts/penpot/runtime.js'), 'utf8')
    return new Function('penpot', 'penpotUtils', 'storage', `return (${source.trim().replace(/;$/, '')})`)({ currentPage: { root: { children } } }, {}, {})
  }

  it('keeps the point where Penpot drops new copies free', () => {
    const atOrigin = { x: 0, y: 0, width: 200, height: 50 }
    const elsewhere = { x: 300, y: 0, width: 100, height: 400 }
    const start = dosOn([atOrigin, elsewhere]).layoutStart()
    expect(atOrigin.x).toBeGreaterThan(0)
    expect(atOrigin.y).toBe(500)
    expect(elsewhere).toMatchObject({ x: 300, y: 0 })
    expect(start).toEqual({ x: 100, y: 650 })
  })

  it('starts away from that point on an empty page', () => {
    expect(dosOn([]).layoutStart()).toEqual({ x: 100, y: 100 })
  })
})

describe('Penpot variant groups', () => {
  it('waits until Penpot has applied each property, however long it takes', async () => {
    const { dos, container, values } = fakePenpot(['a', 'b'])
    await dos.variants([group(['a', 'b'])])
    expect(container.variants.properties).toEqual(['viewport', 'mode', 'state'])
    expect(container.name).toBe('ui/Card')
    expect(values.get('b')).toEqual(['desktop', 'light', 's2'])
  }, 20_000)

  it('repairs a group an earlier run left unfinished', async () => {
    const { dos, container, values } = fakePenpot(['a', 'b'], { properties: ['viewport', 'Property 2'], name: 'ui / ui / Card', members: ['a'] })
    await dos.variants([group(['a', 'b'])])
    expect(container.variants.properties).toEqual(['viewport', 'mode', 'state'])
    expect(container.name).toBe('ui/Card')
    expect(values.get('a')).toEqual(['desktop', 'light', 's1'])
    expect(values.get('b')).toEqual(['desktop', 'light', 's2'])
  }, 20_000)

  it('repairs an unfinished group even when all members are already in it', async () => {
    const { dos, container } = fakePenpot(['a', 'b'], { properties: ['viewport', 'Property 2'], name: 'ui / Card', members: ['a', 'b'] })
    await dos.variants([group(['a', 'b'])])
    expect(container.variants.properties).toEqual(['viewport', 'mode', 'state'])
  }, 20_000)

  it('leaves a finished group alone', async () => {
    const { dos, values } = fakePenpot(['a', 'b'], { properties: ['viewport', 'mode', 'state'], name: 'ui / Card', members: ['a', 'b'] })
    const report = await dos.variants([group(['a', 'b'])])
    expect(values.size).toBe(0)
    expect(report).toEqual([])
  }, 20_000)
})
