// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { propEdit, propFields } from '@/lib/live-edit/component-props'
import { createPicker } from '@/lib/live-edit/picker'
import type { PickedElement } from '@/lib/live-edit/protocol'
import { serializeSelection, type LiveSelection } from '@/lib/live-edit/selection'

const element: PickedElement = {
  kind: 'component',
  src: 'src/sections/account/components/LoginForm.tsx:40:11',
  component: 'Button',
  componentPath: ['Login', 'LoginForm', 'Button'],
  definition: 'src/ui/button.tsx:30:10',
  props: [['type', '"submit"'], ['size', '"lg"'], ['onClick', 'ƒ']],
  values: { type: 'submit', size: 'lg', disabled: false },
  tag: 'button',
  classes: [],
  text: '',
  textOnly: false,
  html: '',
  styles: {},
}
const declared = {
  'src/ui/button.tsx': {
    Button: [
      { name: 'variant', kind: 'choice' as const, options: ['default', 'outline'], default: 'default', optional: true },
      { name: 'size', kind: 'choice' as const, options: ['default', 'sm', 'lg'], default: 'default', optional: true },
      { name: 'loading', kind: 'boolean' as const, optional: true },
      { name: 'onDone', kind: 'readonly' as const, type: '() => void', optional: true },
    ],
  },
}

describe('prop fields', () => {
  it('lists the declared props, also those not set, then what else the call site passes', () => {
    expect(propFields(element, declared).map((f) => [f.name, f.kind, f.value, f.declared])).toEqual([
      ['variant', 'choice', undefined, true],
      ['size', 'choice', 'lg', true],
      ['loading', 'boolean', undefined, true],
      ['onDone', 'readonly', undefined, true],
      ['type', 'string', 'submit', false],
      ['disabled', 'boolean', false, false],
      ['onClick', 'readonly', undefined, false],
    ])
  })

  it('turns a choice into a prop edit; the default removes the prop, the source value is no edit', () => {
    const [variant, size, loading, , , disabled] = propFields(element, declared)
    expect(propEdit(size, 'sm')).toEqual({ property: 'prop:size', from: '"lg"', to: '"sm"', css: {}, prop: { name: 'size', value: 'sm', options: ['default', 'sm', 'lg'] } })
    expect(propEdit(size, 'default')).toMatchObject({ from: '"lg"', to: '(none)', prop: { value: undefined } })
    expect(propEdit(size, 'lg')).toBeNull()
    expect(propEdit(variant, 'default')).toBeNull()
    expect(propEdit(variant, 'outline')).toMatchObject({ from: '(none)', to: '"outline"' })
    expect(propEdit(disabled, true)).toMatchObject({ from: 'false', to: 'true', prop: { value: true } })
    // A prop the call site does not set yet
    expect(propEdit(loading, true)).toMatchObject({ from: '(none)', to: 'true' })
    expect(propEdit(loading, undefined)).toBeNull()
  })

  it('serializes prop edits for the agent', () => {
    const [variant, size] = propFields(element, declared)
    const selection: LiveSelection = { target: { kind: 'shell' }, element, edits: [propEdit(size, 'default')!, propEdit(variant, 'outline')!] }
    const block = serializeSelection(selection)
    expect(block).toContain('  - prop size: "lg" -> (none)  # options of Button: default, sm, lg; remove the prop')
    expect(block).toContain('  - prop variant: (none) -> "outline"  # options of Button: default, outline')
  })
})

describe('live prop override', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps the renderer React hands to the DevTools hook and overrides props through it', async () => {
    // tests/setup.ts runs the hook script before react-dom loads, as the dev server's index.html does
    const renderers = (window as { __DOS_REACT_RENDERERS__?: { overrideProps?: unknown }[] }).__DOS_REACT_RENDERERS__
    expect(renderers?.some((r) => typeof r.overrideProps === 'function')).toBe(true)
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

    const h = React.createElement
    const classes = { default: 'bg-teal-600', outline: 'border' } as const
    function Button({ variant = 'default', size = 'lg' }: { variant?: keyof typeof classes; size?: string }) {
      return h('button', { className: `${classes[variant]} ${size}`.trim(), 'data-dos-src': 'src/ui/button.tsx:5:5', 'data-dos-comp': 'Button' }, 'Go')
    }
    function Form() {
      return h('form', { 'data-dos-src': 'src/sections/a/components/Form.tsx:2:3', 'data-dos-comp': 'Form' }, h(Button, { size: 'lg', 'data-dos-call': 'src/sections/a/components/Form.tsx:3:5', 'data-dos-name': 'Button' } as object))
    }
    document.body.innerHTML = '<div id="root"></div>'
    const root = createRoot(document.getElementById('root')!)
    await React.act(async () => root.render(h(Form)))

    const picker = createPicker(document, () => {})
    picker.select('src/sections/a/components/Form.tsx:3:5', 0, 'component')
    const button = () => document.querySelector('button')!
    expect(button().className).toBe('bg-teal-600 lg')

    // Several props at once: one set, one removed (the component's default applies)
    await React.act(async () => picker.preview({}, undefined, { variant: 'outline', size: undefined }))
    expect(button().className).toBe('border lg')
    await React.act(async () => picker.preview({}, undefined, { variant: 'outline', size: 'sm' }))
    expect(button().className).toBe('border sm')
    // Back to the source props: by reset, or by dropping the prop edits
    await React.act(async () => picker.reset())
    expect(button().className).toBe('bg-teal-600 lg')
    await React.act(async () => picker.preview({}, undefined, { variant: 'outline', size: 'sm' }))
    await React.act(async () => picker.preview({}, undefined, {}))
    expect(button().className).toBe('bg-teal-600 lg')
    // The agent's edit arrived: the preview keeps what renders now
    await React.act(async () => picker.preview({}, undefined, { variant: 'outline' }))
    await React.act(async () => picker.deselect(true))
    expect(button().className).toBe('border lg')

    picker.destroy()
    await React.act(async () => root.unmount())
  })
})
