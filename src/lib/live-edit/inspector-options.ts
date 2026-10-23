/**
 * Live Edit: the values the inspector offers. Every option is a design token turned into a
 * Tailwind class: the product's palette, type scale, spacing, sizing, radius, opacity and shadows
 * from DESIGN.md (tokens.json, read as data). Without tokens the agents.md fallback applies:
 * stone and lime plus the Tailwind scale. Typed values off the scale become arbitrary classes
 * (`pt-[13px]`), which the agent treats as an exception to confirm.
 */
import type { DesignTokens } from '@/types/design-tokens'

export interface InspectorOption {
  /** Tailwind class, e.g. "text-6xl" */
  className: string
  /** Token name shown in the control, e.g. "6xl" */
  label: string
  /** CSS the preview applies */
  css: Record<string, string>
  /** The value behind the token, e.g. "60px" */
  value?: string
  /** Swatch color for color options */
  swatch?: string
  /** Palette (or "Roles") a color option belongs to */
  group?: string
  /** Semantic role the color stands for, e.g. "primary" */
  role?: string
}

/** select: dropdown, scale: scrub field over an ordered scale, segmented: icon buttons, color: swatch and palette */
export type ControlKind = 'select' | 'scale' | 'segmented' | 'color'

export interface InspectorProperty {
  /** CSS property, also the key of the edit */
  property: string
  label: string
  /** Accessible name when the label alone is ambiguous, e.g. "Margin top" for "Top" */
  name?: string
  kind: ControlKind
  options: InspectorOption[]
  /** Class prefix for values off the scale, e.g. "pt" for `pt-[13px]` */
  arbitrary?: string
}

export interface InspectorGroup {
  id: string
  title: string
  properties: InspectorProperty[]
}

const FONT_SIZES: [string, string][] = [
  ['xs', '0.75rem'], ['sm', '0.875rem'], ['base', '1rem'], ['lg', '1.125rem'], ['xl', '1.25rem'], ['2xl', '1.5rem'],
  ['3xl', '1.875rem'], ['4xl', '2.25rem'], ['5xl', '3rem'], ['6xl', '3.75rem'], ['7xl', '4.5rem'], ['8xl', '6rem'], ['9xl', '8rem'],
]
const FONT_WEIGHTS: [string, number][] = [
  ['thin', 100], ['extralight', 200], ['light', 300], ['normal', 400], ['medium', 500], ['semibold', 600], ['bold', 700], ['extrabold', 800], ['black', 900],
]
const FONT_FAMILIES: [string, string][] = [
  ['sans', 'ui-sans-serif, system-ui, sans-serif'],
  ['serif', 'ui-serif, Georgia, serif'],
  ['mono', 'ui-monospace, SFMono-Regular, Menlo, monospace'],
]
const SPACING = ['0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24', '32', '40', '48', '64', '80', '96']
const RADII: [string, string][] = [
  ['none', '0'], ['xs', '0.125rem'], ['sm', '0.25rem'], ['md', '0.375rem'], ['lg', '0.5rem'], ['xl', '0.75rem'], ['2xl', '1rem'], ['3xl', '1.5rem'], ['full', '9999px'],
]
const SHADOWS: [string, string][] = [
  ['2xs', '0 1px rgb(0 0 0 / 0.05)'],
  ['xs', '0 1px 2px 0 rgb(0 0 0 / 0.05)'],
  ['sm', '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'],
  ['md', '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'],
  ['lg', '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'],
  ['xl', '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'],
  ['2xl', '0 25px 50px -12px rgb(0 0 0 / 0.25)'],
]
const LEADING: [string, string][] = [['none', '1'], ['tight', '1.25'], ['snug', '1.375'], ['normal', '1.5'], ['relaxed', '1.625'], ['loose', '2']]
const TRACKING: [string, string][] = [
  ['tighter', '-0.05em'], ['tight', '-0.025em'], ['normal', '0em'], ['wide', '0.025em'], ['wider', '0.05em'], ['widest', '0.1em'],
]
// Tailwind v4 default palette, the agents.md fallback colors
const FALLBACK_PALETTES: Record<string, Record<string, string>> = {
  stone: {
    50: 'oklch(98.5% 0.001 106.423)', 100: 'oklch(97% 0.001 106.424)', 200: 'oklch(92.3% 0.003 48.717)', 300: 'oklch(86.9% 0.005 56.366)',
    400: 'oklch(70.9% 0.01 56.259)', 500: 'oklch(55.3% 0.013 58.071)', 600: 'oklch(44.4% 0.011 73.639)', 700: 'oklch(37.4% 0.01 67.558)',
    800: 'oklch(26.8% 0.007 34.298)', 900: 'oklch(21.6% 0.006 56.043)', 950: 'oklch(14.7% 0.004 49.25)',
  },
  lime: {
    50: 'oklch(98.6% 0.031 120.757)', 100: 'oklch(96.7% 0.067 122.328)', 200: 'oklch(93.8% 0.127 124.321)', 300: 'oklch(89.7% 0.196 126.665)',
    400: 'oklch(84.1% 0.238 128.85)', 500: 'oklch(76.8% 0.233 130.85)', 600: 'oklch(64.8% 0.2 131.684)', 700: 'oklch(53.2% 0.157 131.589)',
    800: 'oklch(45.3% 0.124 130.933)', 900: 'oklch(40.5% 0.101 131.063)', 950: 'oklch(27.4% 0.072 132.109)',
  },
}

const px = (rem: string) => (rem === '0' ? '0px' : rem.endsWith('rem') ? `${parseFloat(rem) * 16}px` : rem)
const spacingRem = (name: string) => (name === 'px' ? '1px' : name === '0' ? '0' : `${Number(name) * 0.25}rem`)

interface Step {
  name: string
  css: string
  value: string
}

function spacingSteps(tokens: DesignTokens | null): Step[] {
  if (tokens?.spacing.scale.length) return tokens.spacing.scale.map((s) => ({ name: s.name, css: s.rem, value: `${s.px}px` }))
  return SPACING.map((name) => ({ name, css: spacingRem(name), value: px(spacingRem(name)) }))
}

function sizingSteps(tokens: DesignTokens | null, group: 'width' | 'height'): Step[] {
  const items = tokens?.sizing.find((g) => g.group === group)?.items
  const steps = items?.length ? items.map((i) => ({ name: i.name, css: i.rem, value: `${i.px}px` })) : spacingSteps(tokens)
  // Keywords Tailwind always has next to the scale
  const screen = group === 'width' ? '100vw' : '100vh'
  return [
    ...steps,
    { name: 'auto', css: 'auto', value: 'auto' },
    { name: 'full', css: '100%', value: '100%' },
    { name: 'fit', css: 'fit-content', value: 'fit-content' },
    { name: 'min', css: 'min-content', value: 'min-content' },
    { name: 'max', css: 'max-content', value: 'max-content' },
    { name: 'screen', css: screen, value: screen },
  ]
}

const scale = (property: string, label: string, prefix: string, steps: Step[], name?: string): InspectorProperty => ({
  property,
  label,
  name,
  kind: 'scale',
  arbitrary: prefix,
  options: steps.map((s) => ({
    className: `${prefix}-${s.name}`,
    label: s.name,
    value: s.value,
    css: { [property]: s.css },
  })),
})

const choice = (property: string, label: string, kind: 'select' | 'segmented', values: [string, string, string][]): InspectorProperty => ({
  property,
  label,
  kind,
  options: values.map(([className, optionLabel, css]) => ({ className, label: optionLabel, css: { [property]: css } })),
})

function palettes(tokens: DesignTokens | null): { name: string; steps: { step: string; color: string; hex?: string }[] }[] {
  const fromTokens = tokens?.color.palettes.filter((p) => p.steps.length > 0) ?? []
  if (fromTokens.length) {
    return fromTokens.map((p) => ({ name: p.name, steps: p.steps.map((s) => ({ step: s.step, color: s.value.oklch, hex: s.value.hex?.toLowerCase() })) }))
  }
  return [
    { name: 'base', steps: [{ step: 'black', color: '#000000' }, { step: 'white', color: '#ffffff' }] },
    ...Object.entries(FALLBACK_PALETTES).map(([name, steps]) => ({ name, steps: Object.entries(steps).map(([step, color]) => ({ step, color })) })),
  ]
}

function colorOptions(prefix: 'text' | 'bg' | 'border', cssProp: string, tokens: DesignTokens | null): InspectorOption[] {
  const options: InspectorOption[] = []
  const byHex = new Map<string, InspectorOption>()
  for (const palette of palettes(tokens)) {
    for (const { step, color, hex } of palette.steps) {
      // "base" holds the single colors: text-black, bg-white
      const name = palette.name === 'base' ? step : `${palette.name}-${step}`
      const option = { className: `${prefix}-${name}`, label: name, css: { [cssProp]: color }, swatch: color, group: palette.name }
      options.push(option)
      if (hex && !byHex.has(hex)) byHex.set(hex, option)
    }
  }
  // Semantic roles point at the palette step they resolve to in light mode; the agent marks the role with a comment
  const roles: InspectorOption[] = []
  for (const token of tokens?.color.semantic ?? []) {
    const step = token.light && byHex.get(token.light.hex.toLowerCase())
    if (step) roles.push({ ...step, label: `${token.name} · ${step.label}`, group: 'Roles', role: token.name })
  }
  const transparent = { className: `${prefix}-transparent`, label: 'transparent', css: { [cssProp]: 'transparent' }, swatch: 'transparent', group: 'base' }
  return [...roles, transparent, ...options]
}

const color = (property: string, label: string, prefix: 'text' | 'bg' | 'border', tokens: DesignTokens | null): InspectorProperty => ({
  property,
  label,
  kind: 'color',
  options: colorOptions(prefix, property, tokens),
})

const SIDES = [
  ['top', 't', 'Top'],
  ['bottom', 'b', 'Bottom'],
  ['left', 'l', 'Left'],
  ['right', 'r', 'Right'],
] as const

export const CORNERS = [
  ['top-left', 'tl', 'Top left'],
  ['top-right', 'tr', 'Top right'],
  ['bottom-left', 'bl', 'Bottom left'],
  ['bottom-right', 'br', 'Bottom right'],
] as const

/** The inspector's sections, with the values the design system allows */
export function inspectorGroups(tokens: DesignTokens | null): InspectorGroup[] {
  const families: Step[] = tokens?.typography.fontFamilies.length
    ? tokens.typography.fontFamilies.map((f) => ({ name: f.name, css: f.stack, value: f.family }))
    : FONT_FAMILIES.map(([name, stack]) => ({ name, css: stack, value: name }))
  const sizes: Step[] = tokens?.typography.fontSizes.length
    ? tokens.typography.fontSizes.map((s) => ({ name: s.name, css: s.rem, value: `${s.px}px` }))
    : FONT_SIZES.map(([name, rem]) => ({ name, css: rem, value: px(rem) }))
  const weights = tokens?.typography.fontWeights.length
    ? tokens.typography.fontWeights.map((w) => ({ name: w.name, value: w.value }))
    : FONT_WEIGHTS.map(([name, value]) => ({ name, value }))
  const leading: Step[] = [
    ...LEADING.map(([name, css]) => ({ name, css, value: css })),
    ...['3', '4', '5', '6', '7', '8', '9', '10'].map((n) => ({ name: n, css: spacingRem(n), value: px(spacingRem(n)) })),
  ]
  const spacing = spacingSteps(tokens)
  const margin = [...spacing, { name: 'auto', css: 'auto', value: 'auto' }]
  const radii: Step[] = tokens?.radius.length
    ? tokens.radius.map((r) => ({ name: r.name, css: r.css, value: r.px >= 9999 ? 'full' : `${r.px}px` }))
    : RADII.map(([name, css]) => ({ name, css, value: name === 'full' ? 'full' : px(css) }))
  const opacity: Step[] = tokens?.opacity.length
    ? tokens.opacity.map((o) => ({ name: o.name, css: String(o.value / 100), value: `${o.value}%` }))
    : Array.from({ length: 21 }, (_, i) => ({ name: String(i * 5), css: String(i / 20), value: `${i * 5}%` }))
  const shadows: [string, string][] = tokens?.shadows.length
    ? tokens.shadows.filter((s) => s.light).map((s) => [s.name, s.light!.css])
    : SHADOWS

  return [
    {
      id: 'typography',
      title: 'Typography',
      properties: [
        {
          property: 'font-family',
          label: 'Font',
          kind: 'select',
          options: families.map((f) => ({ className: `font-${f.name}`, label: f.value === f.name ? f.name : `${f.value} · ${f.name}`, css: { 'font-family': f.css } })),
        },
        scale('font-size', 'Size', 'text', sizes),
        {
          property: 'font-weight',
          label: 'Weight',
          kind: 'select',
          options: weights.map((w) => ({ className: `font-${w.name}`, label: `${w.name} · ${w.value}`, css: { 'font-weight': String(w.value) } })),
        },
        choice('font-style', 'Style', 'segmented', [['not-italic', 'Normal', 'normal'], ['italic', 'Italic', 'italic']]),
        scale('line-height', 'Line Height', 'leading', leading),
        scale('letter-spacing', 'Letter Spacing', 'tracking', TRACKING.map(([name, css]) => ({ name, css, value: css }))),
        choice('text-align', 'Alignment', 'segmented', [
          ['text-left', 'Left', 'left'], ['text-center', 'Center', 'center'], ['text-right', 'Right', 'right'], ['text-justify', 'Justify', 'justify'],
        ]),
        choice('text-transform', 'Case', 'segmented', [
          ['normal-case', 'None', 'none'], ['capitalize', 'Capitalize', 'capitalize'], ['uppercase', 'Uppercase', 'uppercase'], ['lowercase', 'Lowercase', 'lowercase'],
        ]),
        choice('text-decoration-line', 'Decoration', 'segmented', [
          ['no-underline', 'None', 'none'], ['underline', 'Underline', 'underline'], ['line-through', 'Strikethrough', 'line-through'], ['overline', 'Overline', 'overline'],
        ]),
      ],
    },
    { id: 'color', title: 'Color', properties: [color('color', 'Text', 'text', tokens)] },
    { id: 'background', title: 'Background', properties: [color('background-color', 'Color', 'bg', tokens)] },
    {
      id: 'layout',
      title: 'Layout',
      properties: [
        choice('display', 'Display', 'select', [
          ['block', 'block', 'block'], ['inline-block', 'inline-block', 'inline-block'], ['inline', 'inline', 'inline'], ['flex', 'flex', 'flex'],
          ['inline-flex', 'inline-flex', 'inline-flex'], ['grid', 'grid', 'grid'], ['inline-grid', 'inline-grid', 'inline-grid'], ['hidden', 'hidden', 'none'],
        ]),
        scale('width', 'Width', 'w', sizingSteps(tokens, 'width')),
        scale('height', 'Height', 'h', sizingSteps(tokens, 'height')),
        ...SIDES.map(([side, short, label]) => scale(`margin-${side}`, label, `m${short}`, margin, `Margin ${side}`)),
        ...SIDES.map(([side, short, label]) => scale(`padding-${side}`, label, `p${short}`, spacing, `Padding ${side}`)),
      ],
    },
    {
      id: 'border',
      title: 'Border',
      properties: [
        color('border-color', 'Color', 'border', tokens),
        choice('border-style', 'Style', 'select', [
          ['border-solid', 'solid', 'solid'], ['border-dashed', 'dashed', 'dashed'], ['border-dotted', 'dotted', 'dotted'],
          ['border-double', 'double', 'double'], ['border-none', 'none', 'none'],
        ]),
        {
          property: 'border-width',
          label: 'Width',
          kind: 'scale',
          arbitrary: 'border',
          options: [['border-0', '0', '0px'], ['border', '1', '1px'], ['border-2', '2', '2px'], ['border-4', '4', '4px'], ['border-8', '8', '8px']].map(
            ([className, label, value]) => ({ className, label, value, css: { 'border-width': value } }),
          ),
        },
      ],
    },
    {
      id: 'appearance',
      title: 'Appearance',
      properties: [
        scale('opacity', 'Opacity', 'opacity', opacity),
        scale('border-radius', 'All Corners', 'rounded', radii, 'Radius'),
        ...CORNERS.map(([corner, short, label]) => scale(`border-${corner}-radius`, label, `rounded-${short}`, radii)),
      ],
    },
    {
      id: 'shadow',
      title: 'Shadow',
      properties: [
        {
          property: 'box-shadow',
          label: 'Shadow',
          kind: 'select',
          options: [
            { className: 'shadow-none', label: 'None', css: { 'box-shadow': 'none' } },
            ...shadows.map(([name, css]) => ({ className: `shadow-${name}`, label: name, css: { 'box-shadow': css } })),
          ],
        },
      ],
    },
  ]
}

/** Every property of every section */
export function inspectorProperties(tokens: DesignTokens | null): InspectorProperty[] {
  return inspectorGroups(tokens).flatMap((g) => g.properties)
}

/** The class of `classes` that sets this property today (base classes only, no `md:` or `dark:` variants) */
export function currentClass(property: InspectorProperty, classes: string[]): string | null {
  const known = new Set(property.options.map((o) => o.className))
  const arbitrary = property.arbitrary ? `${property.arbitrary}-[` : null
  return classes.find((c) => known.has(c) || (arbitrary !== null && c.startsWith(arbitrary))) ?? null
}

/**
 * The option for what the user typed into a scale field: a token by name or by value, else an
 * arbitrary class with the raw value (null when the text is no CSS length or number).
 */
export function optionFromInput(property: InspectorProperty, input: string): InspectorOption | null {
  const text = input.trim()
  if (!text) return null
  // Token names win over values: "4" is the spacing token 4 (16px), not 4px
  const found =
    property.options.find((o) => o.label === text || o.className === text) ??
    property.options.find((o) => o.value === text || o.value === `${text}px`)
  if (found) return found
  if (!property.arbitrary || !/^-?\d*\.?\d+(px|rem|em|%|vh|vw)?$/.test(text)) return null
  const raw = property.property === 'opacity' && text.endsWith('%') ? String(parseFloat(text) / 100) : /^-?\d*\.?\d+$/.test(text) && property.property !== 'opacity' && property.property !== 'line-height' ? `${text}px` : text
  return { className: `${property.arbitrary}-[${raw}]`, label: raw, value: raw, css: { [property.property]: raw } }
}

/** True for a class with a raw value instead of a token */
export const isArbitrary = (className: string) => /\[.+\]$/.test(className)
