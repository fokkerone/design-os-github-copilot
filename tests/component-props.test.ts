import { describe, expect, it } from 'vitest'
import path from 'node:path'
// @ts-expect-error plain ESM script
import { collectProps, readVariants } from '../scripts/component-props.mjs'

const fixture = path.join(__dirname, 'fixtures/component-props')

describe('component props', () => {
  const { props } = collectProps(fixture)

  it('reads the props a component declares, not the DOM attributes', () => {
    expect(props['src/ui/card.tsx'].Card).toEqual([{ name: 'size', kind: 'choice', options: ['default', 'sm'], optional: true, default: 'default' }])
  })

  it('reads cva() variants with their default, also for components exported later', () => {
    expect(props['src/ui/card.tsx'].Badge).toEqual([{ name: 'tone', kind: 'choice', options: ['neutral', 'danger'], optional: true, default: 'neutral' }])
  })

  it('turns every type into a field, with defaults from the parameter list, through memo()', () => {
    expect(props['src/sections/a/components/Panel.tsx'].Panel).toEqual([
      { name: 'title', kind: 'string', optional: false },
      { name: 'items', kind: 'readonly', type: 'Item[]', optional: true },
      { name: 'layout', kind: 'choice', options: ['grid', 'list', 'compact'], optional: true, default: 'list' },
      { name: 'collapsed', kind: 'boolean', optional: true, default: false },
      { name: 'limit', kind: 'number', optional: true, default: 3 },
      { name: 'onSelect', kind: 'readonly', type: '(id: string) => void', optional: true },
    ])
  })

  it('keeps library props that are a choice or a boolean, marked with the package, after the own ones', () => {
    const tabs = props['src/ui/tabs.tsx'].Tabs
    expect(tabs[0]).toEqual({ name: 'inset', kind: 'boolean', optional: true })
    expect(tabs.slice(1).map((p: { name: string; from?: string }) => [p.name, p.from])).toEqual([
      ['orientation', '@radix-ui/react-tabs'],
      ['dir', '@radix-ui/react-tabs'],
      ['activationMode', '@radix-ui/react-tabs'],
      ['asChild', '@radix-ui/react-primitive'],
    ])
    // Their strings and functions (value, onValueChange) would bury the component's own props
    expect(tabs.some((p: { name: string }) => p.name === 'onValueChange' || p.name === 'value')).toBe(false)
  })

  it('reads cva() configs without a program', () => {
    expect(readVariants("const v = cva('', { variants: { size: { sm: '', lg: '' } }, defaultVariants: { size: 'sm' } }); export function A() { return v({}) }")).toEqual({
      A: { size: { options: ['sm', 'lg'], default: 'sm' } },
    })
    expect(readVariants('export const A = () => <div />')).toEqual({})
  })
})
