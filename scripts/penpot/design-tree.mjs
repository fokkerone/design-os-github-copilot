/**
 * From a captured screen to what Penpot builds: shapes, tokens, and library components.
 *
 * - A primitive that only holds text and icons becomes a component with a text override.
 * - Anything else that is a component contains what its own render created. What it received as
 *   `children` (slot content) lies next to the instance, because Penpot copies cannot get new layers.
 * - Everything is positioned absolutely with the values the browser measured.
 */
import { createHash } from 'node:crypto'
import { classHint } from './token-map.mjs'

const round = (n) => Math.round(n * 100) / 100
const hash = (value) => createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 10)
const hexOf = (c) => c.hex.toUpperCase()
const elementsOf = (node) => node.kids.filter((k) => k.kind === 'element')

const hasSurface = (n) => !!n.background || n.shadows.length > 0 || n.borders.some((b) => b.width > 0 && b.color)
/** Holds only text and icons, so it can be one component with overrides */
export function isLeaf(node) {
  return elementsOf(node).every((k) => k.tag === 'svg' || (!k.comps.length && !hasSurface(k) && isLeaf(k)))
}
const flatContent = (node) => node.kids.flatMap((k) => (k.kind === 'text' || k.tag === 'svg' ? [k] : flatContent(k)))

export function createBuilder(resolver) {
  const mains = new Map()

  const colorToken = (c, mode, cls, prefix, where) => resolver.color(c.hex, c.alpha, mode, classHint(cls, prefix, mode), where)

  /** Fill, border, radius and shadow of an element, as rectangles at its place */
  function surface(node, mode, origin, name) {
    if (!hasSurface(node)) return []
    const { rect, radius } = node
    const tokens = {}
    const base = { t: 'rect', name, id: node.where, x: round(rect.x - origin.x), y: round(rect.y - origin.y), w: round(rect.w), h: round(rect.h), opacity: node.opacity, radius }
    const fill = node.background ? { fillColor: hexOf(node.background), fillOpacity: node.background.alpha } : null
    if (node.background) tokens.fill = colorToken(node.background, mode, node.cls, 'bg', node.where)
    const widths = node.borders.map((b) => (b.color ? b.width : 0))
    const uniform = widths.every((w) => w === widths[0]) && widths[0] > 0
    const strokes = []
    if (uniform) {
      const b = node.borders[0]
      strokes.push({ strokeColor: hexOf(b.color), strokeOpacity: b.color.alpha, strokeWidth: b.width, strokeAlignment: 'inner', strokeStyle: 'solid' })
      tokens.strokeColor = colorToken(b.color, mode, node.cls, 'border', node.where)
    }
    if (radius.some((r) => r > 0)) {
      const names = ['borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft']
      radius.forEach((r, i) => {
        tokens[names[i]] = r > 0 ? resolver.radius(Math.min(node.radiusToken?.[i] ?? r, 9999), node.where) : null
      })
    }
    const shadows = node.shadows.map((s) => ({ style: s.inset ? 'inner-shadow' : 'drop-shadow', offsetX: s.offsetX, offsetY: s.offsetY, blur: s.blur, spread: s.spread, color: { color: hexOf(s), opacity: s.alpha } }))
    if (shadows.length) tokens.shadow = resolver.shadow(node.shadows, mode, node.where)
    const ops = [{ ...base, fills: fill ? [fill] : [], strokes, shadows, tokens: clean(tokens) }]
    // Penpot strokes are uniform: a single side (border-b) is a thin rectangle
    if (!uniform) {
      const [t, r, b, l] = node.borders
      const side = (border, x, y, w, h, label) => {
        if (!border.width || !border.color) return
        ops.push({ t: 'rect', name: `${name} border-${label}`, x: round(x - origin.x), y: round(y - origin.y), w: round(w), h: round(h), opacity: node.opacity, radius: [0, 0, 0, 0], fills: [{ fillColor: hexOf(border.color), fillOpacity: border.color.alpha }], strokes: [], shadows: [], tokens: clean({ fill: colorToken(border.color, mode, node.cls, 'border', node.where) }) })
      }
      side(t, rect.x, rect.y, rect.w, t.width, 'top')
      side(r, rect.x + rect.w - r.width, rect.y, r.width, rect.h, 'right')
      side(b, rect.x, rect.y + rect.h - b.width, rect.w, b.width, 'bottom')
      side(l, rect.x, rect.y, l.width, rect.h, 'left')
    }
    return ops
  }

  function textOp(item, mode, origin, cls, where, name = item.chars.slice(0, 40)) {
    const f = item.font
    const op = {
      t: 'text',
      name,
      chars: item.chars,
      x: round(item.rect.x - origin.x),
      y: round(item.rect.y - origin.y),
      w: round(item.rect.w),
      h: round(item.rect.h),
      opacity: item.opacity,
      font: { family: f.family, size: f.size, weight: f.weight, style: f.style, lineHeight: Math.round((item.lineBox / f.size) * 10000) / 10000, letterSpacing: f.letterSpacing, transform: f.transform, decoration: f.decoration, align: f.align },
      fills: f.color ? [{ fillColor: hexOf(f.color), fillOpacity: f.color.alpha }] : [],
      // Family first: binding it resets the weight of the text
      tokens: clean({
        fontFamilies: resolver.fontFamily(f.family, where),
        fontSize: resolver.fontSize(f.size, where),
        fontWeight: resolver.fontWeight(f.weight, where),
        fill: f.color ? colorToken(f.color, mode, cls, 'text', where) : null,
      }),
    }
    return op
  }

  function svgOp(node, mode, origin) {
    const s = node.svg
    // A browser scales the stroke with the viewBox; Penpot keeps it when the icon is resized
    const scale = node.rect.w / (Number(s.viewBox.split(/[\s,]+/)[2]) || node.rect.w)
    const attrs = [
      `fill="${s.fill ? s.fill.hex : 'none'}"`,
      s.stroke ? `stroke="${s.stroke.hex}" stroke-width="${round(parseFloat(s.strokeWidth) * scale)}" stroke-linecap="${s.linecap}" stroke-linejoin="${s.linejoin}"` : '',
    ].join(' ')
    return {
      t: 'svg',
      name: 'icon',
      x: round(node.rect.x - origin.x),
      y: round(node.rect.y - origin.y),
      w: round(node.rect.w),
      h: round(node.rect.h),
      opacity: node.opacity,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${node.rect.w}" height="${node.rect.h}" viewBox="${s.viewBox}"><g ${attrs}>${s.inner}</g></svg>`,
      tokens: clean({
        strokeColor: s.stroke ? colorToken(s.stroke, mode, node.cls, 'text', node.where) : null,
        fill: s.fill ? colorToken(s.fill, mode, node.cls, 'fill', node.where) : null,
      }),
    }
  }

  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v))

  /** A main component, once per key; `ctx` says where it was first seen */
  function register(key, spec) {
    if (!mains.has(key)) mains.set(key, spec)
    return key
  }

  /** Text and icons of a primitive in a flex board, so a longer label or a wider instance stays centered */
  function leafMain(node, comp, mode, ctx) {
    const content = flatContent(node)
    const box = { x: node.rect.x, y: node.rect.y }
    const widths = node.borders.map((b) => (b.color ? b.width : 0))
    const padding = node.layout.padding.map((p, i) => p + widths[i])
    // An input centers its value without being a flex box
    const field = node.tag === 'input' || node.tag === 'textarea'
    const inline = /flex/.test(node.layout.display) || field
    const flex = {
      dir: inline && node.layout.direction.startsWith('column') ? 'column' : inline ? 'row' : 'column',
      justify: field ? 'start' : inline ? flexValue(node.layout.justify) : 'start',
      align: field ? 'center' : inline ? flexValue(node.layout.align) : alignOf(node.layout.textAlign),
      rowGap: node.layout.rowGap,
      columnGap: node.layout.columnGap,
      padding,
    }
    // Opacity comes with the instance; the main shows the primitive as it is
    const relative = (k) => ({ ...k, opacity: node.opacity ? Math.round((k.opacity / node.opacity) * 1000) / 1000 : 1 })
    const texts = content.filter((k) => k.kind === 'text')
    // Flex only where a label can change: one label and icons directly inside. Mixed inline text
    // (a label with a <span>) keeps the positions the browser measured.
    const single = texts.length <= 1 && content.every((k) => node.kids.includes(k))
    const kids = content.map((k) => {
      const op = k.kind === 'text' ? textOp(relative(k), mode, box, node.cls, node.where, 'label') : { ...svgOp(relative(k), mode, box) }
      return single ? { ...op, inFlex: true } : op
    })
    const [own] = surface({ ...node, opacity: 1 }, mode, box, comp.name)
    // Size and characters are what an instance overrides; everything else identifies the variant
    const signature = single
      ? { own: own && { ...own, w: 0, h: 0 }, flex, kids: kids.map((k) => (k.t === 'text' ? { ...k, chars: '', x: 0, y: 0, w: 0, h: 0, name: 'label' } : { ...k, x: 0, y: 0 })), props: comp.props }
      : { own, kids, props: comp.props, w: round(node.rect.w), h: round(node.rect.h) }
    const key = `ui:${comp.name}:${mode}:${hash(signature)}`
    register(key, { key, tier: 'ui', name: comp.name, mode, viewport: 'all', props: comp.props, w: round(node.rect.w), h: round(node.rect.h), surface: own ?? null, flex: single ? flex : null, kids, deps: [], where: ctx.where })
    return { key, overrides: single ? texts.map((k) => k.chars) : [] }
  }

  /** Splits a component's subtree: what its own render created stays, the rest is slot content */
  function ownPart(node, comp) {
    const slot = []
    const prune = (n) => ({
      ...n,
      kids: n.kids.flatMap((k) => {
        if (k.kind === 'text' || k.tag === 'svg') return [k]
        if (!k.owners.includes(comp.id)) {
          slot.push(k)
          return []
        }
        return [prune(k)]
      }),
    })
    return { own: prune(node), slot }
  }

  function compositeMain(node, comp, depth, mode, ctx) {
    const { own, slot } = ownPart(node, comp)
    const origin = { x: node.rect.x, y: node.rect.y }
    const deps = []
    const kids = renderNode({ ...own, opacity: own.opacity }, depth + 1, mode, origin, deps, ctx)
    const leafSignature = kids.map(stripIds)
    // A primitive that only holds slot content is its surface: an instance takes any size
    const surfaceOnly = comp.tier === 'ui' && kids.length <= 1 && kids.every((k) => k.t === 'rect')
    const signature = surfaceOnly ? { kids: leafSignature.map((k) => ({ ...k, w: 0, h: 0, x: 0, y: 0 })) } : { kids: leafSignature, w: round(node.rect.w), h: round(node.rect.h) }
    const key = `${comp.tier}:${comp.name}:${mode}:${hash(signature)}`
    const fitted = surfaceOnly ? kids.map((k) => ({ ...k, fit: true })) : kids
    register(key, { key, tier: comp.tier, name: comp.name, mode, viewport: surfaceOnly ? 'all' : ctx.viewport, props: comp.props, w: round(node.rect.w), h: round(node.rect.h), surface: null, flex: null, kids: fitted, deps: [...new Set(deps)], where: ctx.where })
    return { key, slot }
  }

  const stripIds = (op) => {
    const { id: _id, ...rest } = op
    return rest.kids ? { ...rest, kids: rest.kids.map(stripIds) } : rest
  }

  /** Shapes for an element and its subtree, relative to `origin` */
  function renderNode(node, compIndex, mode, origin, deps, ctx) {
    const comp = node.comps[compIndex]
    if (comp) {
      const place = { x: round(node.rect.x - origin.x), y: round(node.rect.y - origin.y), w: round(node.rect.w), h: round(node.rect.h) }
      const name = comp.name
      // Only a primitive takes its text as an override. A composite such as a navigation may hold
      // nothing but text and icons too, but they are laid out and stay where the browser put them.
      if (comp.tier === 'ui' && compIndex === node.comps.length - 1 && isLeaf(node)) {
        const { key, overrides } = leafMain(node, comp, mode, ctx)
        deps.push(key)
        return [{ t: 'instance', name, key, ...place, overrides, opacity: node.opacity, id: node.where }]
      }
      const { key, slot } = compositeMain(node, comp, compIndex, mode, ctx)
      deps.push(key)
      return [{ t: 'instance', name, key, ...place, overrides: [], opacity: 1, id: node.where }, ...slot.flatMap((k) => renderNode(k, 0, mode, origin, deps, ctx))]
    }
    const surfaces = surface(node, mode, origin, node.tag)
    if (node.tag === 'svg') return [svgOp(node, mode, origin)]
    const kids = node.kids.flatMap((k) => (k.kind === 'text' ? [textOp(k, mode, origin, node.cls, node.where)] : renderNode(k, 0, mode, origin, deps, ctx)))
    if (node.clip && kids.length) {
      const inner = { x: node.rect.x, y: node.rect.y }
      const shifted = node.kids.flatMap((k) => (k.kind === 'text' ? [textOp(k, mode, inner, node.cls, node.where)] : renderNode(k, 0, mode, inner, deps, ctx)))
      return [...surfaces, { t: 'board', name: node.tag, x: round(node.rect.x - origin.x), y: round(node.rect.y - origin.y), w: round(node.rect.w), h: round(node.rect.h), clip: true, kids: shifted, id: node.where }]
    }
    return [...surfaces, ...kids]
  }

  return {
    /** The ops of one captured screen; registers the components it uses */
    screen(capture, ctx) {
      const deps = []
      const background = capture.pageBackground
      const ops = renderNode(capture.tree, 0, ctx.mode, { x: 0, y: 0 }, deps, { viewport: ctx.viewport, where: ctx.where })
      const fills = [{ fillColor: hexOf(background), fillOpacity: background.alpha }]
      const tokens = clean({ fill: colorToken(background, ctx.mode, capture.pageClasses, 'bg', 'page background') })
      return { ops, fills, tokens, deps: [...new Set(deps)] }
    },
    /** All components, the ones a component contains first */
    mains() {
      const seen = new Set()
      const out = []
      const visit = (key) => {
        if (seen.has(key)) return
        seen.add(key)
        for (const dep of mains.get(key).deps) visit(dep)
        out.push(mains.get(key))
      }
      for (const key of mains.keys()) visit(key)
      return out
    },
  }
}

const flexValue = (v) => (/center/.test(v) ? 'center' : /end/.test(v) ? 'end' : /between/.test(v) ? 'space-between' : /stretch/.test(v) ? 'stretch' : 'start')
const alignOf = (v) => (v === 'center' ? 'center' : v === 'right' || v === 'end' ? 'end' : 'start')

/** Variant properties of the components of one name, state numbered in order of appearance */
export function variantProperties(mains) {
  const groups = new Map()
  for (const m of mains) {
    const id = `${m.tier}/${m.name}`
    if (!groups.has(id)) groups.set(id, [])
    groups.get(id).push(m)
  }
  return [...groups.entries()].map(([name, list]) => ({
    name,
    members: list.map((m, i) => ({ key: m.key, properties: { viewport: m.viewport, mode: m.mode, state: `s${i + 1}` } })),
  }))
}

/** Cuts a list of ops into calls the MCP server accepts (its JSON body limit is 100 KB) */
export function chunkOps(ops, maxBytes = 80_000) {
  const chunks = []
  let current = []
  let size = 0
  for (const op of ops) {
    const bytes = JSON.stringify(op).length
    if (bytes > maxBytes) throw new Error(`A single shape is larger than one MCP call allows (${op.name}, ${bytes} bytes)`)
    if (size + bytes > maxBytes && current.length) {
      chunks.push(current)
      current = []
      size = 0
    }
    current.push(op)
    size += bytes
  }
  if (current.length) chunks.push(current)
  return chunks
}
