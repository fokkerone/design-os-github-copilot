import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { buildLiveEditMessage, LIVE_EDIT_COMMAND, parseLiveEditMessage, selectionLabel, serializeSelection, type LiveSelection } from '@/lib/live-edit/selection'
import { currentClass, inspectorGroups, inspectorProperties, optionFromInput } from '@/lib/live-edit/inspector-options'
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

describe('inspector options', () => {
  it('falls back to stone, lime and the Tailwind scale without design tokens', () => {
    const byName = Object.fromEntries(inspectorProperties(null).map((p) => [p.property, p]))
    expect(byName['font-size'].options.map((o) => o.className)).toContain('text-7xl')
    expect(byName.color.options.map((o) => o.className)).toEqual(expect.arrayContaining(['text-stone-900', 'text-lime-500', 'text-white']))
    expect(byName.color.options.some((o) => /teal|blue/.test(o.className))).toBe(false)
    expect(byName['padding-top'].options.find((o) => o.className === 'pt-4')).toMatchObject({ css: { 'padding-top': '1rem' }, value: '16px' })
  })

  it('has the sections and properties of the inspector', () => {
    const groups = inspectorGroups(null)
    expect(groups.map((g) => g.title)).toEqual(['Typography', 'Color', 'Background', 'Layout', 'Border', 'Appearance', 'Shadow'])
    const props = inspectorProperties(null).map((p) => p.property)
    for (const prop of ['font-family', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'text-decoration-line', 'display', 'width', 'height', 'margin-left', 'padding-right', 'border-style', 'border-width', 'opacity', 'border-top-left-radius', 'box-shadow']) {
      expect(props).toContain(prop)
    }
  })

  it('offers only the palette and scales of the design tokens when they exist', () => {
    const tokens = {
      color: {
        palettes: [{ name: 'teal', steps: [{ step: '600', value: { oklch: 'oklch(60% 0.1 180)', hex: '#0D9488' } }] }],
        semantic: [{ name: 'primary', light: { hex: '#0d9488' } }],
      },
      typography: { fontFamilies: [{ name: 'sans', family: 'Inter', stack: 'Inter, sans-serif' }], fontSizes: [{ name: 'display', px: 72, rem: '4.5rem' }], fontWeights: [] },
      spacing: { scale: [{ name: '4', px: 16, rem: '1rem' }] },
      sizing: [],
      radius: [{ name: 'card', px: 12, css: '0.75rem' }],
      opacity: [{ name: '50', value: 50 }],
      shadows: [{ name: 'card', light: { css: '0 1px 2px red' } }],
    } as unknown as Parameters<typeof inspectorProperties>[0]
    const byName = Object.fromEntries(inspectorProperties(tokens).map((p) => [p.property, p]))
    expect(byName.color.options.map((o) => o.className)).toEqual(['text-teal-600', 'text-transparent', 'text-teal-600'])
    expect(byName.color.options[0]).toMatchObject({ role: 'primary', group: 'Roles' })
    expect(byName['font-size'].options.map((o) => o.className)).toEqual(['text-display'])
    expect(byName['font-family'].options[0]).toMatchObject({ className: 'font-sans', css: { 'font-family': 'Inter, sans-serif' } })
    expect(byName['border-radius'].options.map((o) => o.className)).toEqual(['rounded-card'])
    expect(byName.opacity.options[0]).toMatchObject({ className: 'opacity-50', css: { opacity: '0.5' } })
    expect(byName['box-shadow'].options.map((o) => o.className)).toEqual(['shadow-none', 'shadow-card'])
    expect(byName['padding-left'].options.map((o) => o.className)).toEqual(['pl-4'])
  })

  it('finds the class that sets a property today, raw values included', () => {
    const props = inspectorProperties(null)
    const size = props.find((p) => p.property === 'font-size')!
    expect(currentClass(size, ['md:text-7xl', 'text-6xl', 'text-stone-900'])).toBe('text-6xl')
    expect(currentClass(size, ['font-bold'])).toBeNull()
    const pt = props.find((p) => p.property === 'padding-top')!
    expect(currentClass(pt, ['p-4', 'pt-[13px]'])).toBe('pt-[13px]')
  })

  it('turns typed values into tokens, or raw values off the scale', () => {
    const pt = inspectorProperties(null).find((p) => p.property === 'padding-top')!
    expect(optionFromInput(pt, '16px')?.className).toBe('pt-4')
    expect(optionFromInput(pt, '4')?.className).toBe('pt-4')
    expect(optionFromInput(pt, '13')).toMatchObject({ className: 'pt-[13px]', css: { 'padding-top': '13px' } })
    expect(optionFromInput(pt, 'big')).toBeNull()
  })

  it('marks roles and raw values for the agent', () => {
    const text = serializeSelection({
      ...selection,
      edits: [
        { property: 'color', from: null, to: 'text-teal-600', css: {}, role: 'primary' },
        { property: 'padding-top', from: null, to: 'pt-[13px]', css: { 'padding-top': '13px' } },
      ],
    })
    expect(text).toContain('- color: "(none)" -> "text-teal-600"  # token: primary')
    expect(text).toContain('- padding-top: "(none)" -> "pt-[13px]"  # not a token; preview padding-top: 13px')
  })
})
