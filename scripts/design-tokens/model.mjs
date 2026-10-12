/**
 * Build the DesignOS token model from Style Dictionary tokens.
 *
 * Determinism rules:
 * - Records are sorted by path before anything else, so key order in the input
 *   file never changes the output.
 * - All lists are sorted with explicit comparators (code-point / numeric), never
 *   with locale-dependent comparison.
 * - No timestamps, random ids or environment data end up in the model.
 */

import { colorValue, formatNumber } from './color.mjs'
import { PALETTE_ORDER, DOC_ONLY_REASONS, fontWeightAlias } from './classify.mjs'

export const SCHEMA = 'designos-tokens/v1'

// ---------------------------------------------------------------------------
// Comparators
// ---------------------------------------------------------------------------

export const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

const isNumeric = (s) => /^-?\d+(\.\d+)?$/.test(s)

/** Numeric names compare numerically, everything else by code point. */
export function naturalCompare(a, b) {
  if (isNumeric(a) && isNumeric(b)) return Number(a) - Number(b)
  if (isNumeric(a)) return -1
  if (isNumeric(b)) return 1
  return byCodePoint(a, b)
}

const SIZE_ORDER = ['none', '3xs', '2xs', 'xxs', 'xs', 'sm', 'base', 'default', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl', 'full']
function sizeCompare(a, b) {
  const ia = SIZE_ORDER.indexOf(a)
  const ib = SIZE_ORDER.indexOf(b)
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1
  return naturalCompare(a, b)
}

const paletteCompare = (a, b) => {
  const ia = PALETTE_ORDER.indexOf(a)
  const ib = PALETTE_ORDER.indexOf(b)
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1
  return byCodePoint(a, b)
}

/** Semantic colors: group "x" and "x-foreground" together, alphabetical by base name. */
function semanticCompare(a, b) {
  const base = (n) => n.replace(/-foreground$/, '')
  return byCodePoint(base(a), base(b)) || byCodePoint(a, b)
}

// ---------------------------------------------------------------------------
// Value helpers
// ---------------------------------------------------------------------------

export function pxToRem(px) {
  if (px === 0) return '0'
  return `${formatNumber(px / 16, 4)}rem`
}

/** Tailwind utility that best represents a semantic color. */
export function colorUtility(name) {
  if (/(^|-)foreground$/.test(name)) return `text-${name}`
  if (/(^|-)(border|input)$/.test(name)) return `border-${name}`
  if (/(^|-)ring$/.test(name)) return `ring-${name}`
  return `bg-${name}`
}

const toPx = (v) => (typeof v === 'number' ? v : Number(String(v).replace(/px$/, '')))

function shadowLayers(raw) {
  const layers = Array.isArray(raw) ? raw : [raw]
  return layers.map((l) => ({
    offsetX: toPx(l.offsetX),
    offsetY: toPx(l.offsetY),
    blur: toPx(l.blur),
    spread: toPx(l.spread),
    color: colorValue(l.color),
    ...(l.inset ? { inset: true } : {}),
  }))
}

const SEVERITY = {
  'palette-renamed': 'info',
  'mistyped-string': 'warning',
  'font-family-type': 'info',
  'radius-alias': 'info',
  'font-weight-alias': 'info',
  'number-as-px': 'info',
  'dark-suffix': 'info',
  'missing-light': 'warning',
  'line-height-zero': 'warning',
  'line-height-orphan': 'warning',
  collision: 'warning',
  duplicate: 'info',
  'text-style-unmapped': 'warning',
  unclassified: 'warning',
}

const SUMMARY = {
  'palette-renamed': 'Palette names corrected to Tailwind names',
  'mistyped-string': 'String values typed as "number"',
  'font-family-type': 'Font family tokens re-typed as "fontFamily"',
  'radius-alias': 'Radius names normalized',
  'font-weight-alias': 'Font weight names mapped to Tailwind names',
  'number-as-px': 'Unitless numbers interpreted as px and converted to rem',
  'dark-suffix': 'Dark mode values derived from the "-dark" key suffix',
  'missing-light': 'Tokens with a dark value but no light value (add them to tokens.json)',
  'line-height-zero': 'Line heights of 0 treated as "not set"',
  'line-height-orphan': 'Line heights without a matching font size',
  collision: 'Conflicting tokens for the same CSS variable (first by path wins)',
  duplicate: 'Duplicate tokens with identical values merged',
  'text-style-unmapped': 'Figma text styles without a matching font-size token',
  unclassified: 'Tokens that match no classification rule',
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

/**
 * @param {object} args
 * @param {Array<{ path: string[], type: string, css: unknown, raw: unknown, ds: object }>} args.records
 * @param {ReturnType<import('./guides.mjs').parseGuides>} args.guides
 * @param {object} args.meta { inputs: [{file, sha256, bytes}], styleDictionary: string }
 */
export function buildModel({ records, guides, meta }) {
  const sorted = [...records]
    .map((r) => ({ ...r, id: r.path.join('.') }))
    .sort((a, b) => byCodePoint(a.id, b.id))

  const notes = new Map() // code -> [{ path, detail }]
  const addNote = (code, path, detail) => {
    if (!notes.has(code)) notes.set(code, [])
    notes.get(code).push({ path, detail })
  }
  const notEmitted = new Map() // category -> [path]
  const docOnly = (category, id) => {
    if (!notEmitted.has(category)) notEmitted.set(category, [])
    notEmitted.get(category).push(id)
  }

  for (const r of sorted) for (const n of r.ds.notes ?? []) addNote(n.code, r.id, n.message)

  const byCat = (cat) => sorted.filter((r) => r.ds.category === cat)

  // Claim CSS variables; detect collisions deterministically (first sorted id wins).
  const claimed = new Map() // cssVar -> { id, value }
  const claim = (cssVar, id, valueKey) => {
    const prev = claimed.get(cssVar)
    if (!prev) {
      claimed.set(cssVar, { id, valueKey })
      return true
    }
    if (prev.valueKey === valueKey) {
      addNote('duplicate', id, `Same value as ${prev.id} (${cssVar})`)
    } else {
      addNote('collision', id, `Conflicts with ${prev.id} for ${cssVar}; skipped`)
    }
    return false
  }

  // --- Colors -------------------------------------------------------------
  const palettes = new Map()
  for (const r of byCat('color.palette')) {
    const group = r.ds.group
    const cssVar = group === 'base' ? `--color-${r.ds.name}` : `--color-${group}-${r.ds.name}`
    const value = colorValue(r.raw)
    if (!claim(cssVar, r.id, value.hex)) continue
    if (!palettes.has(group)) palettes.set(group, [])
    palettes.get(group).push({ step: r.ds.name, cssVar, value, path: r.id })
  }
  const paletteList = [...palettes]
    .sort(([a], [b]) => paletteCompare(a, b))
    .map(([name, steps]) => ({ name, steps: steps.sort((a, b) => naturalCompare(a.step, b.step)) }))

  const alpha = new Map()
  for (const r of byCat('color.alpha')) {
    const cssVar = `--color-${r.ds.group}-alpha-${r.ds.name}`
    const value = colorValue(r.raw)
    if (!claim(cssVar, r.id, value.hex)) continue
    if (!alpha.has(r.ds.group)) alpha.set(r.ds.group, [])
    alpha.get(r.ds.group).push({ step: r.ds.name, cssVar, value, path: r.id })
  }
  const alphaList = [...alpha]
    .sort(([a], [b]) => byCodePoint(a, b))
    .map(([name, steps]) => ({ name, steps: steps.sort((a, b) => naturalCompare(a.step, b.step)) }))

  /** Group light/dark records by name. */
  const modal = (records) => {
    const map = new Map()
    for (const r of records) {
      if (!map.has(r.ds.name)) map.set(r.ds.name, { light: null, dark: null })
      const entry = map.get(r.ds.name)
      if (entry[r.ds.mode]) {
        addNote('collision', r.id, `Second ${r.ds.mode} value for "${r.ds.name}"; skipped`)
        continue
      }
      entry[r.ds.mode] = r
      if (r.ds.mode === 'dark') addNote('dark-suffix', r.id, `Dark value of "${r.ds.name}"`)
    }
    return map
  }

  const semantic = []
  for (const [name, { light, dark }] of modal(byCat('color.semantic'))) {
    const cssVar = `--color-${name}`
    const runtimeVar = `--${name}`
    const key = `${light ? colorValue(light.raw).hex : '-'}|${dark ? colorValue(dark.raw).hex : '-'}`
    if (!claim(cssVar, (light ?? dark).id, key)) continue
    claim(runtimeVar, (light ?? dark).id, key)
    if (!light) addNote('missing-light', dark.id, `"${name}" has no light value; it is only defined in .dark`)
    semantic.push({
      name,
      cssVar,
      runtimeVar,
      utility: colorUtility(name),
      light: light ? colorValue(light.raw) : null,
      dark: dark ? colorValue(dark.raw) : null,
      paths: [light?.id, dark?.id].filter(Boolean),
    })
  }
  semantic.sort((a, b) => semanticCompare(a.name, b.name))

  const custom = []
  for (const [name, { light, dark }] of modal(byCat('color.custom'))) {
    const cssVar = `--color-${name}`
    const key = `${light ? colorValue(light.raw).hex : '-'}|${dark ? colorValue(dark.raw).hex : '-'}`
    if (!claim(cssVar, (light ?? dark).id, key)) continue
    const hasModes = !!dark
    if (hasModes && !claim(`--${name}`, (light ?? dark).id, key)) continue
    if (!light) addNote('missing-light', dark.id, `"${name}" has no light value; it is only defined in .dark`)
    custom.push({
      name,
      cssVar,
      runtimeVar: hasModes ? `--${name}` : null,
      utility: colorUtility(name),
      light: light ? colorValue(light.raw) : null,
      dark: dark ? colorValue(dark.raw) : null,
      paths: [light?.id, dark?.id].filter(Boolean),
    })
  }
  custom.sort((a, b) => byCodePoint(a.name, b.name))

  // --- Typography ---------------------------------------------------------
  const fontFamilies = []
  for (const r of byCat('font-family')) {
    const cssVar = `--font-${r.ds.name}`
    if (!claim(cssVar, r.id, String(r.css))) continue
    fontFamilies.push({ name: r.ds.name, cssVar, family: String(r.raw), stack: String(r.css), path: r.id })
  }
  fontFamilies.sort((a, b) => byCodePoint(a.name, b.name))

  const lineHeights = new Map(byCat('line-height').map((r) => [r.ds.name, r]))
  const fontSizes = []
  for (const r of byCat('font-size')) {
    const cssVar = `--text-${r.ds.name}`
    const px = Number(r.raw)
    if (!claim(cssVar, r.id, String(px))) continue
    const lh = lineHeights.get(r.ds.name)
    let lineHeight = null
    if (lh && Number(lh.raw) > 0) {
      lineHeight = { px: Number(lh.raw), rem: pxToRem(Number(lh.raw)), cssVar: `${cssVar}--line-height`, path: lh.id }
    } else if (lh) {
      addNote('line-height-zero', lh.id, `Line height for "${r.ds.name}" is 0`)
    }
    fontSizes.push({ name: r.ds.name, cssVar, px, rem: pxToRem(px), lineHeight, path: r.id })
  }
  for (const [name, lh] of lineHeights) {
    if (!fontSizes.some((f) => f.name === name)) addNote('line-height-orphan', lh.id, `No font size "${name}"`)
  }
  fontSizes.sort((a, b) => a.px - b.px || sizeCompare(a.name, b.name))

  const fontWeights = []
  for (const r of byCat('font-weight')) {
    const cssVar = `--font-weight-${r.ds.name}`
    if (!claim(cssVar, r.id, String(r.raw))) continue
    fontWeights.push({ name: r.ds.name, cssVar, value: Number(r.raw), path: r.id })
  }
  fontWeights.sort((a, b) => a.value - b.value || byCodePoint(a.name, b.name))

  const textStyles = guides.textStyles.map((style) => {
    const size = fontSizes.find((f) => f.px === style.sizePx) ?? null
    const weightName = fontWeightAlias(style.weight)
    const weight = fontWeights.find((w) => w.name === weightName) ?? null
    if (!size) addNote('text-style-unmapped', style.label, `${style.sizePx}px has no font-size token`)
    const lineHeightMatches = size?.lineHeight ? size.lineHeight.px === style.lineHeightPx : false
    const classes = [
      size ? `text-${size.name}` : null,
      size && !lineHeightMatches ? `leading-[${pxToRem(style.lineHeightPx)}]` : null,
      weight ? `font-${weight.name}` : null,
    ].filter(Boolean)
    return { ...style, weightValue: weight?.value ?? null, utilities: classes.join(' ') }
  })

  // --- Spacing & sizing ---------------------------------------------------
  const spacingRecords = byCat('spacing')
  const unit = spacingRecords.find((r) => r.ds.name === '1')
  const basePx = unit ? Number(unit.raw) : null
  const spacingScale = spacingRecords
    .map((r) => {
      const px = Number(r.raw)
      const multiplier = isNumeric(r.ds.name) ? Number(r.ds.name) : null
      const conforms = r.ds.name === 'px' ? px === 1 : basePx !== null && multiplier !== null && multiplier * basePx === px
      return { name: r.ds.name, px, rem: pxToRem(px), multiplier, conforms, path: r.id }
    })
    .sort((a, b) => a.px - b.px || naturalCompare(a.name, b.name))
  for (const s of spacingScale) {
    if (!s.conforms) claim(`--spacing-${s.name}`, s.path, String(s.px))
  }
  const spacing = {
    base: basePx === null ? null : { px: basePx, rem: pxToRem(basePx), cssVar: '--spacing' },
    scale: spacingScale,
  }

  const spacingPx = new Map(spacingScale.map((s) => [s.name, s.px]))
  const sizingGroups = new Map()
  for (const r of byCat('sizing')) {
    const px = Number(r.raw)
    if (!sizingGroups.has(r.ds.group)) sizingGroups.set(r.ds.group, [])
    sizingGroups.get(r.ds.group).push({ name: r.ds.name, px, rem: pxToRem(px), matchesSpacing: spacingPx.get(r.ds.name) === px, path: r.id })
    docOnly('sizing', r.id)
  }
  const sizing = [...sizingGroups]
    .sort(([a], [b]) => byCodePoint(a, b))
    .map(([group, items]) => ({ group, items: items.sort((a, b) => a.px - b.px || naturalCompare(a.name, b.name)) }))

  // --- Radius ---------------------------------------------------------------
  const radius = []
  for (const r of byCat('radius')) {
    const cssVar = `--radius-${r.ds.name}`
    const px = Number(r.raw)
    if (!claim(cssVar, r.id, String(px))) continue
    radius.push({ name: r.ds.name, cssVar, px, css: String(r.css), path: r.id })
  }
  radius.sort((a, b) => a.px - b.px || sizeCompare(a.name, b.name))

  // --- Shadows --------------------------------------------------------------
  const shadowMap = modal(byCat('shadow'))
  const shadows = []
  for (const [name, { light, dark }] of shadowMap) {
    const any = light ?? dark
    const cssVar = `--shadow-${name}`
    const key = `${light ? light.css : '-'}|${dark ? dark.css : '-'}`
    if (!claim(cssVar, any.id, key)) continue
    const hasModes = !!dark
    if (!light) addNote('missing-light', dark.id, `Shadow "${name}" has no light value; it is only defined in .dark`)
    const role = any.ds.group
    shadows.push({
      name,
      role,
      size: name === role ? null : role === 'default' ? name : name.slice(role.length + 1),
      cssVar,
      runtimeVar: hasModes ? `--box-shadow-${name}` : null,
      light: light ? { css: String(light.css), layers: shadowLayers(light.raw) } : null,
      dark: dark ? { css: String(dark.css), layers: shadowLayers(dark.raw) } : null,
      paths: [light?.id, dark?.id].filter(Boolean),
    })
  }
  const roleRank = (role) => (role === 'default' ? 0 : role === 'ring' ? 1 : 2)
  shadows.sort(
    (a, b) =>
      roleRank(a.role) - roleRank(b.role) ||
      byCodePoint(a.role, b.role) ||
      sizeCompare(a.size ?? '', b.size ?? ''),
  )

  // --- Breakpoints ------------------------------------------------------------
  const breakpoints = []
  for (const r of byCat('breakpoint')) {
    const cssVar = `--breakpoint-${r.ds.name}`
    const px = Number(r.raw)
    if (!claim(cssVar, r.id, String(px))) continue
    breakpoints.push({ name: r.ds.name, cssVar, px, rem: pxToRem(px), path: r.id })
  }
  breakpoints.sort((a, b) => a.px - b.px || byCodePoint(a.name, b.name))

  // --- Documented-only categories ---------------------------------------------
  const opacity = byCat('opacity')
    .map((r) => ({ name: r.ds.name, value: Number(r.raw), path: r.id }))
    .sort((a, b) => a.value - b.value || naturalCompare(a.name, b.name))
  opacity.forEach((o) => docOnly('opacity', o.path))

  const layout = byCat('layout')
    .map((r) => ({ name: r.ds.name, px: Number(r.raw), rem: pxToRem(Number(r.raw)), path: r.id }))
    .sort((a, b) => byCodePoint(a.name, b.name))
  layout.forEach((l) => docOnly('layout', l.path))

  const other = []
  for (const cat of ['component-config', 'shadow-primitive', 'unclassified']) {
    for (const r of byCat(cat)) {
      docOnly(cat, r.id)
      if (cat !== 'shadow-primitive') other.push({ path: r.id, category: cat, type: r.ds.originalType, value: r.raw })
      if (cat === 'unclassified') addNote('unclassified', r.id, 'No rule matches')
    }
  }
  for (const r of byCat('line-height')) docOnly('line-height', r.id)

  // number-as-px: one info entry per px-category token typed as plain number
  for (const r of sorted) {
    if (r.ds.originalType === 'number' && typeof r.raw === 'number' && ['spacing', 'sizing', 'radius', 'breakpoint', 'font-size', 'line-height', 'layout'].includes(r.ds.category)) {
      addNote('number-as-px', r.id, `${r.raw} -> ${pxToRem(r.raw)}`)
    }
  }

  // --- Report -------------------------------------------------------------------
  const codes = [...notes.keys()].sort(byCodePoint)
  const issues = codes.map((code) => ({
    code,
    severity: SEVERITY[code] ?? 'warning',
    summary: SUMMARY[code] ?? code,
    count: notes.get(code).length,
    items: notes.get(code).sort((a, b) => byCodePoint(a.path, b.path) || byCodePoint(a.detail, b.detail)),
  }))

  const notEmittedList = [...notEmitted.keys()]
    .sort(byCodePoint)
    .map((category) => ({
      category,
      reason: DOC_ONLY_REASONS[category] ?? 'Not emitted',
      count: notEmitted.get(category).length,
      paths: notEmitted.get(category).sort(byCodePoint),
    }))

  const documentedCount = notEmittedList.reduce((sum, c) => sum + c.count, 0)

  return {
    $schema: SCHEMA,
    meta: {
      name: guides.name,
      title: guides.title,
      description: guides.description,
      source: guides.source,
      variableCollections: guides.variableCollections,
      generator: { name: 'designos-tokens', version: '1.0.0', styleDictionary: meta.styleDictionary },
      inputs: meta.inputs,
      counts: {
        tokens: sorted.length,
        cssVariables: claimed.size,
        documentedOnly: documentedCount,
        warnings: issues.filter((i) => i.severity === 'warning').reduce((s, i) => s + i.count, 0),
      },
    },
    color: { semantic, custom, alpha: alphaList, palettes: paletteList, gradients: guides.gradients },
    typography: { fontFamilies, fontSizes, fontWeights, textStyles },
    spacing,
    sizing,
    radius,
    shadows,
    effects: guides.effects,
    breakpoints,
    opacity,
    layout,
    other,
    guidelines: {
      mission: guides.mission,
      brand: guides.brand,
      writingTone: guides.writingTone,
      accessibility: guides.accessibility,
      rulesDo: guides.rulesDo,
      rulesDont: guides.rulesDont,
      componentRules: guides.componentRules,
      qualityGates: guides.qualityGates,
      components: guides.components,
      gridStyles: guides.gridStyles,
      additional: guides.additional.map((a) => ({ file: a.file, heading: a.heading, markdown: a.lines.join('\n') })),
    },
    report: { issues, notEmitted: notEmittedList, sources: guides.sections },
  }
}
