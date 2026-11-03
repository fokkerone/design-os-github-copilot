/**
 * The product's token model (product/design-system/tokens/tokens.json) as Penpot tokens, and the
 * way back: which token a rendered value belongs to.
 *
 * All sets stay active and Penpot themes are not used, because a theme applies to a whole file:
 * light and dark boards live side by side, so they bind `color.light.*` and `color.dark.*`.
 */
export const SETS = { color: 'designos/color', type: 'designos/typography', layout: 'designos/layout', effects: 'designos/effects' }

const safe = (name) => String(name).trim().replace(/[.,\s/]+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '')
const num = (n) => String(n)

function shadowValue(layers) {
  return layers.map((l) => ({ color: l.color.hex, inset: l.inset ? 'true' : 'false', offsetX: num(l.offsetX), offsetY: num(l.offsetY), blur: num(l.blur), spread: num(l.spread) }))
}

/** { sets: [{ name, tokens: [{ type, name, value }] }], skipped: [what Penpot has no token for] } */
export function buildTokens(model) {
  const color = []
  const type = []
  const layout = []
  const effects = []
  const seen = new Set()
  const push = (list, token) => {
    if (seen.has(token.name)) return
    seen.add(token.name)
    list.push(token)
  }
  for (const entry of [...model.color.semantic, ...model.color.custom]) {
    const n = safe(entry.name)
    if (entry.light) push(color, { type: 'color', name: `color.light.${n}`, value: entry.light.hex })
    if (entry.dark) push(color, { type: 'color', name: `color.dark.${n}`, value: entry.dark.hex })
  }
  for (const scale of model.color.alpha) for (const s of scale.steps) push(color, { type: 'color', name: `color.alpha.${safe(scale.name)}.${safe(s.step)}`, value: s.value.hex })
  for (const palette of model.color.palettes) for (const s of palette.steps) push(color, { type: 'color', name: `color.${safe(palette.name)}.${safe(s.step)}`, value: s.value.hex })

  const t = model.typography
  for (const f of t.fontFamilies) push(type, { type: 'fontFamilies', name: `font.family.${safe(f.name)}`, value: f.family })
  for (const f of t.fontSizes) push(type, { type: 'fontSizes', name: `font.size.${safe(f.name)}`, value: num(f.px) })
  for (const f of t.fontWeights) push(type, { type: 'fontWeights', name: `font.weight.${safe(f.name)}`, value: num(f.value) })

  for (const s of model.spacing.scale) push(layout, { type: 'spacing', name: `spacing.${safe(s.name)}`, value: num(s.px) })
  for (const r of model.radius) push(layout, { type: 'borderRadius', name: `radius.${safe(r.name)}`, value: num(r.px) })
  for (const group of model.sizing) for (const s of group.items) push(layout, { type: 'sizing', name: `sizing.${safe(group.group)}.${safe(s.name)}`, value: num(s.px) })
  for (const b of model.breakpoints) push(layout, { type: 'dimension', name: `breakpoint.${safe(b.name)}`, value: num(b.px) })

  // Penpot refuses shadow tokens with a negative spread; shapes keep the exact value of those
  let unsupportedShadows = 0
  for (const s of model.shadows) {
    for (const mode of ['light', 'dark']) {
      const layers = s[mode]?.layers
      if (!layers?.length) continue
      if (layers.some((l) => l.spread < 0)) unsupportedShadows++
      else push(effects, { type: 'shadow', name: `shadow.${mode}.${safe(s.name)}`, value: shadowValue(layers) })
    }
  }
  for (const o of model.opacity) push(effects, { type: 'opacity', name: `opacity.${safe(o.name)}`, value: num(o.value / 100) })

  return {
    sets: [
      { name: SETS.color, tokens: color },
      { name: SETS.type, tokens: type },
      { name: SETS.layout, tokens: layout },
      { name: SETS.effects, tokens: effects },
    ],
    skipped: [
      unsupportedShadows ? `${unsupportedShadows} shadows with a negative spread (Penpot has no token for them)` : null,
      model.color.gradients?.length ? `${model.color.gradients.length} gradients` : null,
      model.effects?.length ? `${model.effects.length} blur effects` : null,
      t.textStyles?.length ? `${t.textStyles.length} text styles (bound as font family, size and weight)` : null,
    ].filter(Boolean),
  }
}

/** "#rrggbb" or "#rrggbbaa" → { r, g, b, a } */
export function parseHex(hex) {
  const h = hex.replace('#', '')
  const channel = (i) => parseInt(h.slice(i, i + 2), 16)
  return { r: channel(0), g: channel(2), b: channel(4), a: h.length === 8 ? channel(6) / 255 : 1 }
}

// tokens.json rounds OKLCH to hex; the browser's own conversion may land one step next to it
const sameColor = (a, b) => Math.abs(a.r - b.r) <= 1 && Math.abs(a.g - b.g) <= 1 && Math.abs(a.b - b.b) <= 1 && Math.abs(a.a - b.a) <= 0.012

/** The class that sets a property in this mode: `dark:bg-teal-300` before `bg-teal-600` */
export function classHint(classes, prefix, mode) {
  const list = String(classes ?? '').split(/\s+/)
  const pick = (variant) => list.filter((c) => c.startsWith(`${variant}${prefix}-`)).map((c) => c.slice(variant.length + prefix.length + 1))
  return [...(mode === 'dark' ? pick('dark:') : []), ...pick('')]
}

/** Finds the token of a rendered value; a value without a token is recorded as a violation */
export function createResolver(tokenSets) {
  const all = tokenSets.flatMap((s) => s.tokens)
  const byName = new Map(all.map((t) => [t.name, t]))
  const colors = all.filter((t) => t.type === 'color').map((t) => ({ name: t.name, value: parseHex(t.value) }))
  const ofType = (type) => all.filter((t) => t.type === type)
  const violations = new Map()
  const violate = (kind, value, where) => {
    const key = `${kind}:${value}`
    const entry = violations.get(key) ?? { kind, value, where: [] }
    if (where && !entry.where.includes(where)) entry.where.push(where)
    violations.set(key, entry)
  }
  const rank = (name, mode) => {
    if (name.startsWith(`color.${mode}.`)) return 0
    if (name.startsWith('color.light.') || name.startsWith('color.dark.')) return 3
    if (name.startsWith('color.alpha.')) return 2
    return 1
  }

  const byValue = (type, value) => ofType(type).find((t) => Number(t.value) === Number(value))?.name ?? null

  return {
    /** hex: "#rrggbb", alpha 0..1, hints: names from the class list ("teal-600", "primary") */
    color(hex, alpha, mode, hints = [], where) {
      const wanted = { ...parseHex(hex), a: alpha }
      for (const hint of hints) {
        for (const name of [`color.${hint.replace('-', '.')}`, `color.${mode}.${hint}`]) {
          const token = byName.get(name)
          if (token?.type === 'color' && sameColor(parseHex(token.value), wanted)) return name
        }
      }
      const match = colors.filter((c) => sameColor(c.value, wanted)).sort((a, b) => rank(a.name, mode) - rank(b.name, mode))[0]
      if (match) return match.name
      violate('color', alpha < 1 ? `${hex} / ${alpha}` : hex, where)
      return null
    },
    radius: (px, where) => {
      const name = byValue('borderRadius', px)
      if (!name && px > 0 && px < 9999) violate('radius', `${px}px`, where)
      return name
    },
    spacing: (px) => byValue('spacing', px),
    fontSize(px, where) {
      const name = byValue('fontSizes', px)
      if (!name) violate('font-size', `${px}px`, where)
      return name
    },
    fontWeight(value, where) {
      const name = byValue('fontWeights', value)
      if (!name) violate('font-weight', String(value), where)
      return name
    },
    fontFamily(family, where) {
      const name = ofType('fontFamilies').find((t) => t.value === family)?.name ?? null
      if (!name) violate('font-family', family, where)
      return name
    },
    opacity: (value) => byValue('opacity', value),
    shadow(layers, mode, where) {
      const same = (t) =>
        t.value.length === layers.length &&
        t.value.every((v, i) => {
          const l = layers[i]
          return Number(v.offsetX) === l.offsetX && Number(v.offsetY) === l.offsetY && Number(v.blur) === l.blur && Number(v.spread) === l.spread && (v.inset === 'true') === !!l.inset && sameColor(parseHex(v.color), { ...parseHex(l.hex), a: l.alpha })
        })
      const match = ofType('shadow').filter(same).sort((a, b) => Number(!a.name.startsWith(`shadow.${mode}.`)) - Number(!b.name.startsWith(`shadow.${mode}.`)))[0]
      if (match) return match.name
      violate('shadow', layers.map((l) => `${l.offsetX} ${l.offsetY} ${l.blur} ${l.spread} ${l.hex}/${l.alpha}`).join(', '), where)
      return null
    },
    violations: () => [...violations.values()],
  }
}
