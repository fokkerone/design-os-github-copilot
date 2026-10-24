import { describe, expect, it } from 'vitest'
import { uiComponents } from '@/lib/ui-components'

describe('uiComponents', () => {
  it('lists the primitives of src/ui/ by file, without section or shell components', () => {
    const all = {
      'src/ui/button.tsx': { Button: [{ name: 'size', kind: 'choice' as const, options: ['sm', 'lg'], optional: true }] },
      'src/ui/badge.tsx': { Badge: [] },
      'src/sections/account/components/Login.tsx': { Login: [] },
    }
    expect(uiComponents(all, {}).map((c) => `${c.file}:${c.name}`)).toEqual(['src/ui/badge.tsx:Badge', 'src/ui/button.tsx:Button'])
    expect(uiComponents(all, {})[1].props[0].options).toEqual(['sm', 'lg'])
  })

  it('adds where each component is used, and components only the usage knows', () => {
    const all = { 'src/ui/card.tsx': { Card: [] } }
    const usage = { 'src/ui/card.tsx': { Card: ['src/sections/a/components/A.tsx'], CardHeader: [] } }
    expect(uiComponents(all, usage).map((c) => [c.name, c.usedIn])).toEqual([
      ['Card', ['src/sections/a/components/A.tsx']],
      ['CardHeader', []],
    ])
  })
})
