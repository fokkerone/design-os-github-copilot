/**
 * Live Edit: the values the inspector offers. Every option is a design token from DESIGN.md
 * (tokens.json, read as data) turned into the class that renders it in the prototype (see
 * token-class.ts): Tailwind's class when the default theme has the same value, else the exact
 * value, colors in OKLCH. Without tokens the agents.md fallback applies: stone and lime plus
 * Tailwind's default scales. Typed values off the scale become arbitrary classes without a
 * token (`pt-[13px]`), which the agent treats as an exception to confirm.
 */
import type { ColorValue, DesignTokens } from '@/types/design-tokens'
import { arbitrary, sameColor, spacingClass, tailwindTheme, themeNames, tokenClass, toPx, type TokenClass } from './token-class'

export interface InspectorOption {
  /** Tailwind class, e.g. "text-6xl"; text styles hold several, separated by spaces */
  className: string
  /** Token name shown in the control, e.g. "6xl" */
  label: string
  /** CSS the preview applies */
  css: Record<string, string>
  /** The value behind the token, e.g. "60px" */
  value?: string
  /** Swatch color for color options (OKLCH) */
  swatch?: string
  /** Section of a long list: palette, "Roles", shadow role, … */
  group?: string
  /** Token the agent names in a `token:` comment, when the class does not name it already */
  token?: string
  /** Class for dark mode, e.g. "dark:bg-[oklch(80.08%_0.13033_181.21)]" */
  dark?: string
  darkCss?: Record<string, string>
  darkSwatch?: string
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
  /** Utility prefix of the property, for its `dark:` class (colors) */
  prefix?: string
}

export interface InspectorGroup {
  id: string
  title: string
  properties: InspectorProperty[]
}

const SPACING = ['0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24', '32', '40', '48', '64', '80', '96']
const FALLBACK_PALETTES = ['stone', 'lime']

const theme = (key: string) => tailwindTheme.get(key) ?? ''
const pxLabel = (value: string) => {
  const px = toPx(value)
  return Number.isNaN(px) ? value : px === Infinity ? 'full' : `${Math.round(px * 100) / 100}px`
}
const spacingRem = (name: string) => (name === 'px' ? '1px' : name === '0' ? '0' : `${Number(name) * 0.25}rem`)

const option = (cls: TokenClass, label: string, css: Record<string, string>, extra: Partial<InspectorOption> = {}): InspectorOption => ({
  className: cls.className,
  label,
  css,
  ...(cls.token && { token: cls.token }),
  ...extra,
})

interface Step {
  name: string
  css: string
}

function spacingSteps(tokens: DesignTokens | null): Step[] {
  if (tokens?.spacing.scale.length) return tokens.spacing.scale.map((s) => ({ name: s.name, css: s.rem }))
  return SPACING.map((name) => ({ name, css: spacingRem(name) }))
}

const spacingOptions = (property: string, prefix: string, steps: Step[]) =>
  steps.map((s) => option(spacingClass(prefix, s.name, s.css), s.name, { [property]: s.css }, { value: pxLabel(s.css) }))

const keywords = (property: string, prefix: string, values: [string, string][]): InspectorOption[] =>
  values.map(([name, css]) => ({ className: `${prefix}-${name}`, label: name, css: { [property]: css }, value: css }))

const scale = (property: string, label: string, prefix: string, options: InspectorOption[], name?: string): InspectorProperty => ({
  property,
  label,
  name,
  kind: 'scale',
  arbitrary: prefix,
  options,
})

const choice = (property: string, label: string, kind: 'select' | 'segmented', values: [string, string, string][]): InspectorProperty => ({
  property,
  label,
  kind,
  options: values.map(([className, optionLabel, css]) => ({ className, label: optionLabel, css: { [property]: css } })),
})

const uniqueByClass = (options: InspectorOption[]) => {
  const seen = new Set<string>()
  return options.filter((o) => !seen.has(o.className) && seen.add(o.className))
}

// ── Colors ──────────────────────────────────────────────────────────────────

interface PaletteStep {
  /** "teal-600", or "white" for the single colors */
  name: string
  palette: string
  color: string
}

function paletteSteps(tokens: DesignTokens | null): PaletteStep[] {
  const fromTokens = tokens?.color.palettes.filter((p) => p.steps.length > 0) ?? []
  if (fromTokens.length) {
    return fromTokens.flatMap((p) =>
      p.steps.map((s) => ({ name: p.name === 'base' ? s.step : `${p.name}-${s.step}`, palette: p.name, color: s.value.oklch })),
    )
  }
  return [
    { name: 'black', palette: 'base', color: 'oklch(0% 0 0)' },
    { name: 'white', palette: 'base', color: 'oklch(100% 0 0)' },
    ...FALLBACK_PALETTES.flatMap((palette) =>
      themeNames(`color-${palette}`).map((step) => ({ name: `${palette}-${step}`, palette, color: theme(`color-${palette}-${step}`) })),
    ),
  ]
}

function colorOptions(prefix: 'text' | 'bg' | 'border', cssProp: string, tokens: DesignTokens | null): InspectorOption[] {
  const steps = paletteSteps(tokens)
  // A step named like Tailwind's is Tailwind's class, even where the export rounds it differently
  // (Figma palettes are often Tailwind v3 hex, the prototype runs v4); other palettes are exact
  const palette = steps.map((s) =>
    option(
      tailwindTheme.has(`color-${s.name}`) ? { className: `${prefix}-${s.name}` } : { className: `${prefix}-[${arbitrary(s.color)}]`, token: s.name },
      s.name,
      { [cssProp]: s.color },
      { swatch: s.color, group: s.palette },
    ),
  )
  // A role value that is a palette step (within rounding) uses the step's class, else its exact OKLCH value
  const classFor = (value: ColorValue) => {
    const step = steps.findIndex((s) => sameColor(s.color, value.oklch))
    return step >= 0 ? palette[step].className : `${prefix}-[${arbitrary(value.oklch)}]`
  }
  const roles: InspectorOption[] = []
  for (const token of [...(tokens?.color.semantic ?? []), ...(tokens?.color.custom ?? [])]) {
    const light = token.light ?? token.dark
    if (!light) continue
    const lightClass = classFor(light)
    const darkClass = token.dark && token.light ? classFor(token.dark) : null
    roles.push({
      className: lightClass,
      label: token.name,
      css: { [cssProp]: light.oklch },
      swatch: light.oklch,
      group: 'Roles',
      token: token.name,
      ...(darkClass && darkClass !== lightClass && { dark: `dark:${darkClass}`, darkCss: { [cssProp]: token.dark!.oklch }, darkSwatch: token.dark!.oklch }),
    })
  }
  const alpha = (tokens?.color.alpha ?? []).flatMap((scale) =>
    scale.steps.map((s) => {
      const name = `${scale.name}-alpha-${s.step}`
      return option({ className: `${prefix}-[${arbitrary(s.value.oklch)}]`, token: name }, name, { [cssProp]: s.value.oklch }, { swatch: s.value.oklch, group: 'Alpha' })
    }),
  )
  const transparent = { className: `${prefix}-transparent`, label: 'transparent', css: { [cssProp]: 'transparent' }, swatch: 'transparent', group: 'base' }
  return [...roles, ...alpha, transparent, ...palette]
}

const color = (property: string, label: string, prefix: 'text' | 'bg' | 'border', tokens: DesignTokens | null, name?: string): InspectorProperty => ({
  property,
  label,
  name,
  kind: 'color',
  prefix,
  options: colorOptions(prefix, property, tokens),
})

// ── Typography ──────────────────────────────────────────────────────────────

function fontSizeOptions(tokens: DesignTokens | null): InspectorOption[] {
  const sizes = tokens?.typography.fontSizes.length
    ? tokens.typography.fontSizes.map((s) => ({ name: s.name, rem: s.rem }))
    : themeNames('text').map((name) => ({ name, rem: theme(`text-${name}`) }))
  return sizes.map((s) =>
    option(tokenClass({ prefix: 'text', name: s.name, value: s.rem, themeKey: `text-${s.name}`, token: `text-${s.name}` }), s.name, { 'font-size': s.rem }, { value: pxLabel(s.rem) }),
  )
}

function fontWeightOptions(tokens: DesignTokens | null): InspectorOption[] {
  const weights = tokens?.typography.fontWeights.length
    ? tokens.typography.fontWeights.map((w) => ({ name: w.name, value: String(w.value) }))
    : themeNames('font-weight').map((name) => ({ name, value: theme(`font-weight-${name}`) }))
  return weights.map((w) =>
    option(
      tokenClass({ prefix: 'font', name: w.name, value: w.value, themeKey: `font-weight-${w.name}`, token: `font-weight-${w.name}` }),
      `${w.name} · ${w.value}`,
      { 'font-weight': w.value },
    ),
  )
}

function fontFamilyOptions(tokens: DesignTokens | null): InspectorOption[] {
  const families = tokens?.typography.fontFamilies.length
    ? tokens.typography.fontFamilies.map((f) => ({ name: f.name, stack: f.stack, family: f.family }))
    : themeNames('font')
        .filter((n) => !n.startsWith('weight-'))
        .map((name) => ({ name, stack: theme(`font-${name}`), family: name }))
  return families.map((f) =>
    option(
      tokenClass({ prefix: 'font', name: f.name, value: f.stack, themeKey: `font-${f.name}`, token: `font-${f.name}`, hint: 'family-name' }),
      f.family === f.name ? f.name : `${f.family} · ${f.name}`,
      { 'font-family': f.stack },
    ),
  )
}

/** Line heights: the ones the type scale pairs with its sizes first, then Tailwind's */
function lineHeightOptions(tokens: DesignTokens | null): InspectorOption[] {
  const paired = (tokens?.typography.fontSizes ?? []).flatMap((s) => {
    if (!s.lineHeight) return []
    const px = s.lineHeight.px
    const cls = px % 4 === 0 ? spacingClass('leading', String(px / 4), s.lineHeight.rem) : { className: `leading-[${s.lineHeight.rem}]`, token: `text-${s.name}--line-height` }
    return [option(cls, cls.className.slice('leading-'.length), { 'line-height': s.lineHeight.rem }, { value: `${px}px` })]
  })
  const named = themeNames('leading').map((name) => ({ className: `leading-${name}`, label: name, css: { 'line-height': theme(`leading-${name}`) }, value: theme(`leading-${name}`) }))
  const steps = spacingOptions('line-height', 'leading', ['3', '4', '5', '6', '7', '8', '9', '10'].map((n) => ({ name: n, css: spacingRem(n) })))
  return uniqueByClass([...paired, ...named, ...steps])
}

const trackingOptions = (): InspectorOption[] =>
  themeNames('tracking').map((name) => ({ className: `tracking-${name}`, label: name, css: { 'letter-spacing': theme(`tracking-${name}`) }, value: theme(`tracking-${name}`) }))

/** A text style sets size, weight, line height and tracking at once */
function textStyleOptions(tokens: DesignTokens | null, sizes: InspectorOption[], weights: InspectorOption[], tracking: InspectorOption[]): InspectorOption[] {
  return (tokens?.typography.textStyles ?? []).flatMap((t) => {
    const size = sizes.find((o) => toPx(o.css['font-size']) === t.sizePx)
    const weight = weights.find((o) => Number(o.css['font-weight']) === t.weightValue)
    if (!size || !weight) return []
    const lineHeight = `${t.lineHeightPx / 16}rem`
    const leading = t.lineHeightPx % 4 === 0 ? spacingClass('leading', String(t.lineHeightPx / 4), lineHeight).className : `leading-[${lineHeight}]`
    const em = `${parseFloat(t.tracking) / 100}em`
    const track = parseFloat(t.tracking) === 0 ? null : (tracking.find((o) => o.css['letter-spacing'] === em)?.className ?? `tracking-[${em}]`)
    const css: Record<string, string> = { ...size.css, ...weight.css, 'line-height': lineHeight, ...(track && { 'letter-spacing': em }) }
    return [
      {
        className: [size.className, weight.className, leading, track].filter(Boolean).join(' '),
        label: t.label.replace(/^Tailwind\//, ''),
        css,
        group: t.family,
        token: t.name,
      },
    ]
  })
}

// ── Effects ─────────────────────────────────────────────────────────────────

function radiusOptions(tokens: DesignTokens | null, prefix: string, property: string): InspectorOption[] {
  const radii = tokens?.radius.length
    ? tokens.radius.map((r) => ({ name: r.name, css: r.css }))
    : ['none', ...themeNames('radius'), 'full'].map((name) => ({ name, css: theme(`radius-${name}`) }))
  return radii.map((r) =>
    option(tokenClass({ prefix, name: r.name, value: r.css, themeKey: `radius-${r.name}`, token: `radius-${r.name}` }), r.name, { [property]: r.css }, { value: pxLabel(r.css) }),
  )
}

function shadowOptions(tokens: DesignTokens | null): InspectorOption[] {
  const none = { className: 'shadow-none', label: 'None', css: { 'box-shadow': 'none' } }
  if (!tokens?.shadows.length) {
    return [none, ...themeNames('shadow').map((name) => ({ className: `shadow-${name}`, label: name, css: { 'box-shadow': theme(`shadow-${name}`) } }))]
  }
  const shadows = tokens.shadows.flatMap((s) => {
    const light = s.light ?? s.dark
    if (!light) return []
    const cls = tokenClass({ prefix: 'shadow', name: s.name, value: light.css, themeKey: `shadow-${s.name}`, token: `shadow-${s.name}` })
    const dark = s.dark && s.light && s.dark.css !== s.light.css ? tokenClass({ prefix: 'shadow', name: s.name, value: s.dark.css, themeKey: null }) : null
    return [option(cls, s.name, { 'box-shadow': light.css }, { group: s.role, ...(dark && { dark: `dark:${dark.className}`, darkCss: { 'box-shadow': s.dark!.css } }) })]
  })
  return [none, ...shadows]
}

function blurOptions(tokens: DesignTokens | null, kind: 'backdrop-blur' | 'blur'): InspectorOption[] {
  const property = kind === 'blur' ? 'filter' : 'backdrop-filter'
  const effects = tokens?.effects.length
    ? tokens.effects.filter((e) => e.kind === kind).map((e) => ({ name: e.name, css: `${e.px}px` }))
    : themeNames('blur').map((name) => ({ name, css: theme(`blur-${name}`) }))
  return effects.map((e) =>
    option(tokenClass({ prefix: kind, name: e.name, value: e.css, themeKey: `blur-${e.name}` }), e.name, { [property]: `blur(${e.css})` }, { value: e.css }),
  )
}

function gradientOptions(tokens: DesignTokens | null): InspectorOption[] {
  const gradients = (tokens?.color.gradients ?? []).filter((g) => g.complete && g.css)
  return [
    { className: 'bg-none', label: 'None', css: { 'background-image': 'none' } },
    ...gradients.map((g) => ({ className: `bg-[${arbitrary(g.css!)}]`, label: g.label, css: { 'background-image': g.css! }, token: g.name, group: g.kind })),
  ]
}

// ── Layout ──────────────────────────────────────────────────────────────────

function sizingOptions(tokens: DesignTokens | null, group: 'width' | 'height', property: string, prefix: string): InspectorOption[] {
  const items = tokens?.sizing.find((g) => g.group === group)?.items
  const steps = items?.length ? items.map((i) => ({ name: i.name, css: i.rem })) : spacingSteps(tokens)
  const screen = group === 'width' ? '100vw' : '100vh'
  return [
    ...spacingOptions(property, prefix, steps),
    ...keywords(property, prefix, [['auto', 'auto'], ['full', '100%'], ['fit', 'fit-content'], ['min', 'min-content'], ['max', 'max-content'], ['screen', screen]]),
  ]
}

function maxWidthOptions(tokens: DesignTokens | null): InspectorOption[] {
  const sized = (tokens?.sizing.find((g) => g.group === 'max-width')?.items ?? [])
    .filter((i) => i.name !== 'none')
    .map((i) => ({ name: i.name, css: i.rem }))
  const layout = (tokens?.layout ?? []).map((l) =>
    option({ className: `max-w-[${l.rem}]`, token: l.name }, l.name, { 'max-width': l.rem }, { value: `${l.px}px` }),
  )
  const containers = themeNames('container').map((name) => ({
    className: `max-w-${name}`,
    label: name,
    css: { 'max-width': theme(`container-${name}`) },
    value: pxLabel(theme(`container-${name}`)),
  }))
  return uniqueByClass([
    ...keywords('max-width', 'max-w', [['none', 'none']]),
    ...layout,
    ...spacingOptions('max-width', 'max-w', sized),
    ...containers,
    ...keywords('max-width', 'max-w', [['prose', '65ch'], ['full', '100%'], ['screen', '100vw'], ['fit', 'fit-content'], ['min', 'min-content'], ['max', 'max-content']]),
  ])
}

function minWidthOptions(tokens: DesignTokens | null): InspectorOption[] {
  const sized = (tokens?.sizing.find((g) => g.group === 'min-width')?.items ?? []).map((i) => ({ name: i.name, css: i.rem }))
  return uniqueByClass([
    ...spacingOptions('min-width', 'min-w', [...sized, ...spacingSteps(tokens)]),
    ...keywords('min-width', 'min-w', [['full', '100%'], ['screen', '100vw'], ['fit', 'fit-content'], ['min', 'min-content'], ['max', 'max-content']]),
  ])
}

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
  const sizes = fontSizeOptions(tokens)
  const weights = fontWeightOptions(tokens)
  const tracking = trackingOptions()
  const textStyles = textStyleOptions(tokens, sizes, weights, tracking)
  const spacing = spacingSteps(tokens)
  const opacity = tokens?.opacity.length
    ? tokens.opacity.map((o) => ({ name: o.name, value: o.value }))
    : Array.from({ length: 21 }, (_, i) => ({ name: String(i * 5), value: i * 5 }))
  const gradients = gradientOptions(tokens)

  return [
    {
      id: 'typography',
      title: 'Typography',
      properties: [
        ...(textStyles.length ? [{ property: 'text-style', label: 'Text style', kind: 'select' as const, options: textStyles }] : []),
        { property: 'font-family', label: 'Font', kind: 'select', options: fontFamilyOptions(tokens) },
        scale('font-size', 'Size', 'text', sizes),
        { property: 'font-weight', label: 'Weight', kind: 'select', options: weights },
        choice('font-style', 'Style', 'segmented', [['not-italic', 'Normal', 'normal'], ['italic', 'Italic', 'italic']]),
        scale('line-height', 'Line Height', 'leading', lineHeightOptions(tokens)),
        scale('letter-spacing', 'Letter Spacing', 'tracking', tracking),
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
    {
      id: 'background',
      title: 'Background',
      properties: [
        color('background-color', 'Color', 'bg', tokens, 'Background color'),
        ...(gradients.length > 1 ? [{ property: 'background-image', label: 'Gradient', kind: 'select' as const, options: gradients }] : []),
      ],
    },
    {
      id: 'layout',
      title: 'Layout',
      properties: [
        choice('display', 'Display', 'select', [
          ['block', 'block', 'block'], ['inline-block', 'inline-block', 'inline-block'], ['inline', 'inline', 'inline'], ['flex', 'flex', 'flex'],
          ['inline-flex', 'inline-flex', 'inline-flex'], ['grid', 'grid', 'grid'], ['inline-grid', 'inline-grid', 'inline-grid'], ['hidden', 'hidden', 'none'],
        ]),
        scale('width', 'Width', 'w', sizingOptions(tokens, 'width', 'width', 'w')),
        scale('height', 'Height', 'h', sizingOptions(tokens, 'height', 'height', 'h')),
        scale('min-width', 'Min width', 'min-w', minWidthOptions(tokens)),
        scale('max-width', 'Max width', 'max-w', maxWidthOptions(tokens)),
        ...SIDES.map(([side, short, label]) =>
          scale(
            `margin-${side}`,
            label,
            `m${short}`,
            [...spacingOptions(`margin-${side}`, `m${short}`, spacing), ...keywords(`margin-${side}`, `m${short}`, [['auto', 'auto']])],
            `Margin ${side}`,
          ),
        ),
        ...SIDES.map(([side, short, label]) => scale(`padding-${side}`, label, `p${short}`, spacingOptions(`padding-${side}`, `p${short}`, spacing), `Padding ${side}`)),
      ],
    },
    {
      id: 'border',
      title: 'Border',
      properties: [
        color('border-color', 'Color', 'border', tokens, 'Border color'),
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
        scale(
          'opacity',
          'Opacity',
          'opacity',
          opacity.map((o) => ({
            className: Number(o.name) === o.value ? `opacity-${o.name}` : `opacity-[${o.value / 100}]`,
            label: o.name,
            css: { opacity: String(o.value / 100) },
            value: `${o.value}%`,
          })),
        ),
        scale('border-radius', 'All Corners', 'rounded', radiusOptions(tokens, 'rounded', 'border-radius'), 'Radius'),
        ...CORNERS.map(([corner, short, label]) =>
          scale(`border-${corner}-radius`, label, `rounded-${short}`, radiusOptions(tokens, `rounded-${short}`, `border-${corner}-radius`)),
        ),
        scale('backdrop-filter', 'Backdrop blur', 'backdrop-blur', blurOptions(tokens, 'backdrop-blur')),
        scale('filter', 'Blur', 'blur', blurOptions(tokens, 'blur')),
      ],
    },
    { id: 'shadow', title: 'Shadow', properties: [{ property: 'box-shadow', label: 'Shadow', kind: 'select', options: shadowOptions(tokens) }] },
  ]
}

/** Every property of every section */
export function inspectorProperties(tokens: DesignTokens | null): InspectorProperty[] {
  return inspectorGroups(tokens).flatMap((g) => g.properties)
}

const hasAll = (classes: Set<string>, className: string) => className.split(' ').every((c) => classes.has(c))

/** The class (or classes, for text styles) of `classes` that sets this property today; base classes only, no `md:` or `dark:` */
export function currentClass(property: InspectorProperty, classes: string[]): string | null {
  const set = new Set(classes)
  const known = property.options.find((o) => hasAll(set, o.className))
  if (known) return known.className
  const arbitrary = property.arbitrary ? `${property.arbitrary}-[` : null
  return classes.find((c) => arbitrary !== null && c.startsWith(arbitrary)) ?? null
}

/** The `dark:` class that sets this color property today */
export function currentDarkClass(property: InspectorProperty, classes: string[]): string | null {
  if (!property.prefix) return null
  const darks = new Set(property.options.flatMap((o) => [o.dark, `dark:${o.className}`]))
  return classes.find((c) => darks.has(c) || c.startsWith(`dark:${property.prefix}-[`)) ?? null
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
  const unitless = property.property === 'opacity' || property.property === 'line-height'
  const raw = property.property === 'opacity' && text.endsWith('%') ? String(parseFloat(text) / 100) : /^-?\d*\.?\d+$/.test(text) && !unitless ? `${text}px` : text
  const css = property.property === 'filter' || property.property === 'backdrop-filter' ? `blur(${raw})` : raw
  return { className: `${property.arbitrary}-[${raw}]`, label: raw, value: raw, css: { [property.property]: css } }
}

/** True for a class with a raw value instead of a token */
export const isArbitrary = (className: string) => /\[.+\]$/.test(className)
