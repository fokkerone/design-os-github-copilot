import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { buildLiveEditMessage, LIVE_EDIT_COMMAND, parseLiveEditMessage, selectionLabel, serializeSelection, type LiveSelection } from '@/lib/live-edit/selection'
import { currentClass, currentDarkClass, inspectorGroups, inspectorProperties, optionFromInput } from '@/lib/live-edit/inspector-options'
import { sameColor, spacingClass, tokenClass } from '@/lib/live-edit/token-class'
import { expandSlashCommand } from '@/lib/harness'

const selection: LiveSelection = {
  target: { kind: 'screen', sectionId: 'landing', screenDesignName: 'LandingPage' },
  element: {
    src: 'src/sections/landing/components/Hero.tsx:42:7',
    component: 'Hero',
    componentPath: ['LandingPage', 'Hero'],
    tag: 'h1',
    classes: ['text-6xl', 'font-semibold'],
    text: 'The "platform"',
    textOnly: true,
    html: '<h1 class="text-6xl font-semibold">The platform</h1>',
    styles: { 'font-size': '60px' },
  },
  edits: [{ property: 'font-size', from: 'text-6xl', to: 'text-7xl', css: { 'font-size': '4.5rem' } }],
}

describe('live edit message', () => {
  it('points the agent at the command file, which exists', () => {
    expect(existsSync(LIVE_EDIT_COMMAND)).toBe(true)
    expect(buildLiveEditMessage(selection, ' Make it bigger ')).toMatch(
      /^Follow the instructions in \.claude\/commands\/design-os\/live-edit\.md\.\n\n```live-edit\n[\s\S]*\n```\n\nMake it bigger$/,
    )
  })

  it('carries target, source, component path, classes, edits and html', () => {
    const block = serializeSelection(selection)
    expect(block).toContain('target: screen-design')
    expect(block).toContain('section: landing')
    expect(block).toContain('screen: LandingPage')
    expect(block).toContain('source: src/sections/landing/components/Hero.tsx:42:7')
    expect(block).toContain('component: LandingPage › Hero')
    expect(block).toContain('classes: "text-6xl font-semibold"')
    expect(block).toContain('text: "The \\"platform\\""')
    expect(block).toContain('  - font-size: "text-6xl" -> "text-7xl"  # preview font-size: 4.5rem')
    expect(block).toContain('  <h1 class="text-6xl font-semibold">The platform</h1>')
  })

  it('carries a component with its call site, definition and props', () => {
    const component: LiveSelection = {
      ...selection,
      element: {
        ...selection.element,
        kind: 'component',
        src: 'src/sections/landing/components/Hero.tsx:50:9',
        component: 'Button',
        componentPath: ['LandingPage', 'Hero', 'Button'],
        definition: 'src/ui/button.tsx:41:5',
        props: [['variant', '"outline"'], ['onClick', 'ƒ']],
        tag: 'button',
      },
      edits: [],
    }
    const block = serializeSelection(component)
    expect(block).toContain('kind: component\ncall: src/sections/landing/components/Hero.tsx:50:9\ndefinition: src/ui/button.tsx:41:5')
    expect(block).toContain('component: LandingPage › Hero › Button\nprops:\n  variant: "outline"\n  onClick: ƒ\nroot element: button')
    expect(block).not.toContain('source:')
    expect(selectionLabel(component)).toBe('<Button> in Hero')
    // The command explains the component block
    expect(readFileSync(LIVE_EDIT_COMMAND, 'utf8')).toContain('kind: component')
  })

  it('never lets the html close the fence', () => {
    const block = serializeSelection({ ...selection, element: { ...selection.element, html: '<code>```x```</code>' } })
    expect(block.match(/```/g)).toHaveLength(2)
  })

  it('describes the shell without section and screen', () => {
    const block = serializeSelection({ ...selection, target: { kind: 'shell' } })
    expect(block).toContain('target: shell')
    expect(block).not.toContain('section:')
  })

  it('reads its own message back for the chip in the thread', () => {
    const parsed = parseLiveEditMessage(buildLiveEditMessage(selection, 'Make it bigger'))
    expect(parsed).toMatchObject({ label: 'Hero › h1', source: 'src/sections/landing/components/Hero.tsx:42', edits: 1, request: 'Make it bigger' })
    expect(parseLiveEditMessage('hello')).toBeNull()
    expect(selectionLabel(selection)).toBe('Hero › h1')
  })

  it('can be typed as a slash command too', () => {
    expect(expandSlashCommand('/design-os:live-edit fix the hero')).toBe(`Follow the instructions in ${LIVE_EDIT_COMMAND}.\n\nfix the hero`)
  })
})

const oklch = (value: string, hex = '#000000') => ({ hex, oklch: value, alpha: 1 })

// A Volta-like token model: values that are Tailwind's, and values that are not
const volta = {
  color: {
    palettes: [
      { name: 'base', steps: [{ step: 'white', value: oklch('oklch(100% 0 0)') }] },
      { name: 'teal', steps: [{ step: '600', value: oklch('oklch(60.04% 0.11785 184.7)') }] },
      { name: 'neutral', steps: [{ step: '100', value: oklch('oklch(97.02% 0 0)') }] },
    ],
    semantic: [
      { name: 'primary', light: oklch('oklch(65.03% 0.11008 192.46)'), dark: oklch('oklch(80.08% 0.13033 181.21)') },
      { name: 'muted', light: oklch('oklch(97.02% 0 0)'), dark: oklch('oklch(26.6% 0.0079 285.9)') },
      { name: 'background', light: null, dark: oklch('oklch(21.6% 0.0076 264.4)') },
      { name: 'border', light: oklch('oklch(81.6% 0.011 106.5)'), dark: { hex: '#ffffff1a', oklch: 'oklch(100% 0 0 / 0.102)', alpha: 0.102 } },
    ],
    custom: [{ name: 'alpha-50', light: { hex: '#ffffff80', oklch: 'oklch(100% 0 0 / 0.502)', alpha: 0.502 }, dark: null }],
    alpha: [{ name: 'primary', steps: [{ step: '10', value: { hex: '#0ba4a11a', oklch: 'oklch(65.03% 0.11008 192.46 / 0.102)', alpha: 0.102 } }] }],
    gradients: [{ name: 'primary-gradient', label: 'primary-gradient', kind: 'linear', complete: true, css: 'linear-gradient(oklch(65.03% 0.11008 192.46) 0%, oklch(49.07% 0.24123 292.58) 100%)' }],
  },
  typography: {
    fontFamilies: [{ name: 'sans', family: 'Inter', stack: '"Inter", ui-sans-serif, system-ui, sans-serif' }],
    fontSizes: [
      { name: 'xxs', px: 10, rem: '0.625rem', lineHeight: null },
      { name: 'xs', px: 12, rem: '0.75rem', lineHeight: { px: 16, rem: '1rem' } },
    ],
    fontWeights: [{ name: 'light', value: 300 }],
    textStyles: [{ name: 'xs-light', label: 'Tailwind/XS/Light', family: 'Inter', weight: 'Light', weightValue: 300, sizePx: 12, lineHeightPx: 16, tracking: '0%', utilities: 'text-xs font-light' }],
  },
  spacing: { scale: [{ name: '4', px: 16, rem: '1rem' }] },
  sizing: [{ group: 'max-width', items: [{ name: 'px', px: 1, rem: '0.0625rem' }] }],
  radius: [
    { name: 'xs', px: 2, css: '0.125rem' },
    { name: 'md', px: 4, css: '0.25rem' },
  ],
  opacity: [{ name: '50', value: 50 }],
  shadows: [{ name: 'primary-md', role: 'primary', light: { css: '0px 2px 4px -1px oklch(0% 0 0 / 0.0118)' }, dark: null }],
  effects: [{ name: 'card-bg-blur', label: 'card-bg-blur', kind: 'backdrop-blur', px: 8 }],
  layout: [{ name: 'block-width', px: 1440, rem: '90rem' }],
} as unknown as Parameters<typeof inspectorProperties>[0]

describe('token classes', () => {
  it('keeps Tailwind classes for tokens with Tailwind values, within rounding', () => {
    expect(tokenClass({ prefix: 'bg', name: 'teal-600', value: 'oklch(60.04% 0.11785 184.7)', themeKey: 'color-teal-600' })).toEqual({ className: 'bg-teal-600' })
    expect(tokenClass({ prefix: 'rounded', name: 'xs', value: '0.125rem', themeKey: 'radius-xs' })).toEqual({ className: 'rounded-xs' })
    expect(spacingClass('p', '4', '1rem')).toEqual({ className: 'p-4' })
  })

  it('writes the exact value for tokens Tailwind has with another value, or not at all', () => {
    expect(tokenClass({ prefix: 'rounded', name: 'md', value: '0.25rem', themeKey: 'radius-md', token: 'radius-md' })).toEqual({ className: 'rounded-[0.25rem]', token: 'radius-md' })
    expect(tokenClass({ prefix: 'text', name: 'xxs', value: '0.625rem', themeKey: 'text-xxs' }).className).toBe('text-[0.625rem]')
  })

  it('compares colors in OKLab, Tailwind hex included', () => {
    expect(sameColor('oklch(100% 0 0)', '#fff')).toBe(true)
    expect(sameColor('oklch(60.04% 0.11785 184.7)', 'oklch(60% 0.118 184.704)')).toBe(true)
    expect(sameColor('oklch(65.03% 0.11008 192.46)', 'oklch(60% 0.118 184.704)')).toBe(false)
  })
})

describe('inspector options', () => {
  it('falls back to stone, lime and Tailwind\'s default theme without design tokens', () => {
    const byName = Object.fromEntries(inspectorProperties(null).map((p) => [p.property, p]))
    expect(byName['font-size'].options.map((o) => o.className)).toContain('text-7xl')
    expect(byName.color.options.map((o) => o.className)).toEqual(expect.arrayContaining(['text-stone-900', 'text-lime-500', 'text-white']))
    expect(byName.color.options.some((o) => /teal|blue/.test(o.className))).toBe(false)
    expect(byName['border-radius'].options.find((o) => o.label === 'md')).toMatchObject({ className: 'rounded-md', value: '6px' })
    expect(byName['padding-top'].options.find((o) => o.className === 'pt-4')).toMatchObject({ css: { 'padding-top': '1rem' }, value: '16px' })
  })

  it('has the sections and properties of the inspector', () => {
    expect(inspectorGroups(volta).map((g) => g.title)).toEqual(['Typography', 'Color', 'Background', 'Layout', 'Border', 'Appearance', 'Shadow'])
    const props = inspectorProperties(volta).map((p) => p.property)
    for (const prop of ['text-style', 'font-family', 'line-height', 'text-transform', 'background-image', 'min-width', 'max-width', 'padding-right', 'border-width', 'border-top-left-radius', 'backdrop-filter', 'box-shadow']) {
      expect(props).toContain(prop)
    }
  })

  it('offers every role in OKLCH, with its dark value, and reuses palette steps it equals', () => {
    const bg = inspectorProperties(volta).find((p) => p.property === 'background-color')!
    const roles = bg.options.filter((o) => o.group === 'Roles')
    expect(roles.map((o) => o.label)).toEqual(['primary', 'muted', 'background', 'border', 'alpha-50'])
    expect(roles[0]).toMatchObject({
      className: 'bg-[oklch(65.03%_0.11008_192.46)]',
      dark: 'dark:bg-[oklch(80.08%_0.13033_181.21)]',
      token: 'primary',
      css: { 'background-color': 'oklch(65.03% 0.11008 192.46)' },
      darkCss: { 'background-color': 'oklch(80.08% 0.13033 181.21)' },
    })
    expect(roles[1].className).toBe('bg-neutral-100')
    expect(roles[2]).toMatchObject({ className: 'bg-[oklch(21.6%_0.0076_264.4)]', token: 'background' })
    expect(roles[2].dark).toBeUndefined()
    expect(roles[3].dark).toBe('dark:bg-[oklch(100%_0_0_/_0.102)]')
    expect(bg.options.find((o) => o.group === 'Alpha')).toMatchObject({ label: 'primary-alpha-10', className: 'bg-[oklch(65.03%_0.11008_192.46_/_0.102)]' })
    expect(bg.options.find((o) => o.label === 'teal-600')?.className).toBe('bg-teal-600')
    // Named like Tailwind's, a step keeps Tailwind's class even off its value (v3 hex export)
    expect(inspectorProperties({ ...volta, color: { ...volta!.color, palettes: [{ name: 'teal', steps: [{ step: '400', value: oklch('oklch(78.45% 0.13253 181.91)') }] }, { name: 'brand', steps: [{ step: '500', value: oklch('oklch(55% 0.2 30)') }] }] } } as typeof volta)
      .find((p) => p.property === 'background-color')!.options.filter((o) => o.group !== 'Roles' && o.group !== 'Alpha').map((o) => o.className)).toEqual(['bg-transparent', 'bg-teal-400', 'bg-[oklch(55%_0.2_30)]'])
    expect(JSON.stringify(bg.options)).not.toMatch(/#[0-9a-f]{3,8}/i)
  })

  it('writes the exact value of non-Tailwind tokens across the scales', () => {
    const byName = Object.fromEntries(inspectorProperties(volta).map((p) => [p.property, p]))
    expect(byName['border-radius'].options.map((o) => o.className)).toEqual(['rounded-xs', 'rounded-[0.25rem]'])
    expect(byName['font-size'].options.map((o) => o.className)).toEqual(['text-[0.625rem]', 'text-xs'])
    expect(byName['font-family'].options[0]).toMatchObject({ className: "font-[family-name:'Inter',ui-sans-serif,system-ui,sans-serif]", token: 'font-sans' })
    expect(byName['box-shadow'].options[1]).toMatchObject({ className: 'shadow-[0px_2px_4px_-1px_oklch(0%_0_0_/_0.0118)]', token: 'shadow-primary-md', group: 'primary' })
    expect(byName['backdrop-filter'].options[0]).toMatchObject({ className: 'backdrop-blur-[8px]', css: { 'backdrop-filter': 'blur(8px)' } })
    expect(byName['max-width'].options.find((o) => o.token === 'block-width')?.className).toBe('max-w-[90rem]')
    expect(byName['background-image'].options[1]).toMatchObject({ token: 'primary-gradient', css: { 'background-image': expect.stringContaining('oklch(') } })
    expect(byName.opacity.options[0]).toMatchObject({ className: 'opacity-50', css: { opacity: '0.5' } })
  })

  it('turns a text style into one edit of several classes', () => {
    const style = inspectorProperties(volta).find((p) => p.property === 'text-style')!
    expect(style.options[0]).toMatchObject({ className: 'text-xs font-light leading-4', label: 'XS/Light', token: 'xs-light' })
    expect(currentClass(style, ['leading-4', 'text-xs', 'font-light', 'p-4'])).toBe('text-xs font-light leading-4')
  })

  it('finds the class that sets a property today, raw values and dark classes included', () => {
    const props = inspectorProperties(null)
    const size = props.find((p) => p.property === 'font-size')!
    expect(currentClass(size, ['md:text-7xl', 'text-6xl', 'text-stone-900'])).toBe('text-6xl')
    expect(currentClass(size, ['font-bold'])).toBeNull()
    const pt = props.find((p) => p.property === 'padding-top')!
    expect(currentClass(pt, ['p-4', 'pt-[13px]'])).toBe('pt-[13px]')
    const bg = inspectorProperties(volta).find((p) => p.property === 'background-color')!
    expect(currentDarkClass(bg, ['bg-white', 'dark:bg-[oklch(80.08%_0.13033_181.21)]'])).toBe('dark:bg-[oklch(80.08%_0.13033_181.21)]')
  })

  it('turns typed values into tokens, or raw values off the scale', () => {
    const pt = inspectorProperties(null).find((p) => p.property === 'padding-top')!
    expect(optionFromInput(pt, '16px')?.className).toBe('pt-4')
    expect(optionFromInput(pt, '4')?.className).toBe('pt-4')
    expect(optionFromInput(pt, '13')).toMatchObject({ className: 'pt-[13px]', css: { 'padding-top': '13px' } })
    expect(optionFromInput(pt, 'big')).toBeNull()
  })

  it('tells the agent the token, the exact value and the dark class', () => {
    const text = serializeSelection({
      ...selection,
      edits: [
        {
          property: 'background-color',
          from: null,
          to: 'bg-[oklch(65.03%_0.11008_192.46)]',
          css: {},
          token: 'primary',
          dark: { from: null, to: 'dark:bg-[oklch(80.08%_0.13033_181.21)]' },
        },
        { property: 'color', from: null, to: 'text-neutral-100', css: {}, token: 'muted' },
        { property: 'padding-top', from: null, to: 'pt-[13px]', css: { 'padding-top': '13px' } },
      ],
    })
    expect(text).toContain(
      '- background-color: "(none)" -> "bg-[oklch(65.03%_0.11008_192.46)]"; dark "(none)" -> "dark:bg-[oklch(80.08%_0.13033_181.21)]"  # token: primary; exact value',
    )
    expect(text).toContain('- color: "(none)" -> "text-neutral-100"  # token: muted')
    expect(text).toContain('- padding-top: "(none)" -> "pt-[13px]"  # not a token; preview padding-top: 13px')
  })
})
