/* Runs inside preview.html (Playwright page.evaluate): the rendered DOM with its React components, as data. */
export function walkPage(known) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const cache = new Map()
  /** Any CSS color (oklch, color-mix ...) → { hex: "#rrggbb", alpha } */
  const color = (css) => {
    if (!css || css === 'transparent') return null
    if (cache.has(css)) return cache.get(css)
    const m = css.match(/^rgba\(.*,\s*([\d.]+)\)$/) ?? css.match(/\/\s*([\d.]+%?)\s*\)$/)
    let alpha = m ? (m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1])) : 1
    const opaque = css.replace(/\/\s*[\d.]+%?\s*\)$/, ')').replace(/^rgba\((.*),\s*[\d.]+\)$/, 'rgb($1)')
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = opaque
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
    const value = alpha === 0 ? null : { hex, alpha: Math.round(alpha * 1000) / 1000 }
    cache.set(css, value)
    return value
  }
  const px = (v) => parseFloat(v) || 0
  const rectOf = (r) => ({ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height })

  /** "oklch(0 0 0 / .1) 0px 1px 3px 0px, ..." → layers without the empty ones Tailwind keeps as placeholders */
  const shadows = (css) => {
    if (!css || css === 'none') return []
    const parts = []
    let depth = 0
    let current = ''
    for (const ch of css) {
      if (ch === '(') depth++
      if (ch === ')') depth--
      if (ch === ',' && depth === 0) {
        parts.push(current)
        current = ''
      } else current += ch
    }
    parts.push(current)
    return parts.flatMap((part) => {
      const c = part.match(/^\s*((?:[a-z-]+\([^)]*\)|#\w+|[a-z]+))/i)?.[1]
      const nums = [...part.replace(c ?? '', '').matchAll(/(-?[\d.]+)px/g)].map((m) => parseFloat(m[1]))
      const value = color(c)
      if (!value) return []
      const [offsetX = 0, offsetY = 0, blur = 0, spread = 0] = nums
      if (!offsetX && !offsetY && !blur && !spread) return []
      return [{ ...value, offsetX, offsetY, blur, spread, inset: /\binset\b/.test(part) }]
    })
  }

  const fontOf = (cs, c = cs.color) => {
    const size = px(cs.fontSize)
    return {
      family: cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, ''),
      size,
      weight: Number(cs.fontWeight) || 400,
      style: cs.fontStyle === 'italic' ? 'italic' : 'normal',
      lineHeight: cs.lineHeight === 'normal' ? null : px(cs.lineHeight),
      letterSpacing: cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing),
      transform: cs.textTransform,
      decoration: (cs.textDecorationLine ?? 'none').split(' ')[0],
      align: cs.textAlign,
      color: color(c),
    }
  }

  /** A text node, one rect per rendered line, broken where the browser broke it */
  const textItem = (node, cs, opacity) => {
    const raw = node.nodeValue
    if (!raw.trim()) return null
    const range = document.createRange()
    const lines = []
    for (let i = 0; i < raw.length; i++) {
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      const r = range.getClientRects()[0]
      if (!r || r.width === 0 && /\s/.test(raw[i])) continue
      const space = /\s/.test(raw[i])
      let last = lines[lines.length - 1]
      if (!last || Math.abs(last.top - r.top) >= r.height / 2) {
        last = { chars: '', top: r.top, height: r.height, left: Infinity, right: -Infinity }
        lines.push(last)
      }
      last.chars += raw[i]
      // Spaces at the ends of a run do not count: "on 2 Oct" starts at its "o"
      if (!space) {
        last.left = Math.min(last.left, r.left)
        last.right = Math.max(last.right, r.right)
      }
    }
    lines.splice(0, lines.length, ...lines.filter((l) => l.chars.trim()))
    if (!lines.length) return null
    const pre = /^pre/.test(cs.whiteSpace)
    const font = fontOf(cs)
    const lineBox = font.lineHeight ?? lines[0].height
    const left = Math.min(...lines.map((l) => l.left))
    const right = Math.max(...lines.map((l) => l.right))
    return {
      kind: 'text',
      chars: lines.map((l) => (pre ? l.chars : l.chars.replace(/\s+/g, ' ').trim())).join('\n'),
      // The line box, not the glyph box a Range reports: Penpot positions text by its line height
      rect: { x: left + scrollX, y: lines[0].top + scrollY + (lines[0].height - lineBox) / 2, w: right - left, h: lineBox * lines.length },
      lineBox,
      font,
      opacity,
    }
  }

  /** The value or placeholder an input shows: inputs have no text node to measure */
  const inputText = (el, cs, opacity) => {
    const placeholder = !el.value
    const chars = el.value ? (el.type === 'password' ? '•'.repeat(el.value.length) : el.value) : el.placeholder
    if (!chars) return null
    const font = fontOf(cs, placeholder ? getComputedStyle(el, '::placeholder').color : cs.color)
    const b = el.getBoundingClientRect()
    const lineBox = font.lineHeight ?? font.size * 1.2
    ctx.font = `${font.style} ${font.weight} ${font.size}px "${font.family}"`
    const left = px(cs.paddingLeft) + px(cs.borderLeftWidth)
    return {
      kind: 'text',
      chars,
      rect: { x: b.left + scrollX + left, y: b.top + scrollY + (b.height - lineBox) / 2, w: ctx.measureText(chars).width, h: lineBox },
      lineBox,
      font,
      opacity,
    }
  }

  const fiberOf = (el) => {
    const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'))
    return key ? el[key] : null
  }
  const typeName = (t) => (!t || typeof t === 'string' ? null : t.displayName || t.name || typeName(t.render) || typeName(t.type))
  const isHost = (f) => typeof f.type === 'string'
  const hosts = (f) => {
    if (isHost(f)) return [f.stateNode]
    const out = []
    for (let c = f.child; c; c = c.sibling) out.push(...hosts(c))
    return out
  }
  const ids = new Map()
  const idOf = (f) => {
    const seen = ids.get(f) ?? (f.alternate && ids.get(f.alternate))
    if (seen) return seen
    const id = ids.size + 1
    ids.set(f, id)
    return id
  }
  const propsOf = (props) => {
    const out = {}
    for (const [k, v] of Object.entries(props ?? {})) {
      if (k === 'children' || k === 'className' || k === 'style' || k === 'key' || k === 'ref' || k.startsWith('data-') || k.startsWith('aria-')) continue
      if (['string', 'number', 'boolean'].includes(typeof v)) out[k] = v
    }
    return out
  }
  /** Product components whose only outermost element is this one, outermost first */
  const componentsAt = (el) => {
    const fiber = fiberOf(el)
    const out = []
    for (let f = fiber?.return; f && !isHost(f); f = f.return) {
      const name = typeName(f.type)
      if (!name || !known[name]) continue
      const roots = hosts(f)
      if (roots.length !== 1 || roots[0] !== el) continue
      out.unshift({ id: idOf(f), name, tier: known[name], props: propsOf(f.memoizedProps), hasChildren: f.memoizedProps?.children != null })
    }
    return out
  }
  /** The components whose render created this element (React's dev-only owner chain) */
  const ownersOf = (el) => {
    const out = []
    for (let f = fiberOf(el)?._debugOwner; f; f = f._debugOwner) if (known[typeName(f.type)]) out.push(idOf(f))
    return out
  }

  const unsupported = []
  const walk = (el, parentOpacity) => {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') return null
    const opacity = parentOpacity * (parseFloat(cs.opacity) || 0)
    const tag = el.tagName.toLowerCase()
    const r = el.getBoundingClientRect()
    const where = el.getAttribute('data-dos-src') ?? tag
    if (cs.backgroundImage !== 'none') unsupported.push({ kind: 'background-image', where })
    for (const pseudo of ['::before', '::after']) if (getComputedStyle(el, pseudo).content !== 'none') unsupported.push({ kind: pseudo, where })

    const node = {
      kind: 'element',
      tag,
      where,
      cls: typeof el.className === 'string' ? el.className : (el.getAttribute('class') ?? ''),
      rect: rectOf(r),
      comps: componentsAt(el),
      owners: ownersOf(el),
      opacity,
      background: color(cs.backgroundColor),
      borders: ['Top', 'Right', 'Bottom', 'Left'].map((s) => ({ width: cs[`border${s}Style`] === 'none' ? 0 : px(cs[`border${s}Width`]), color: color(cs[`border${s}Color`]) })),
      radius: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map((v) => Math.min(px(v), Math.min(r.width, r.height) / 2)),
      // As written: rounded-full is 9999px in the token, clamped to half the height on screen
      radiusToken: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(px),
      shadows: shadows(cs.boxShadow),
      clip: cs.overflowX !== 'visible' || cs.overflowY !== 'visible',
      layout: {
        display: cs.display,
        direction: cs.flexDirection,
        justify: cs.justifyContent,
        align: cs.alignItems,
        rowGap: px(cs.rowGap),
        columnGap: px(cs.columnGap),
        padding: ['Top', 'Right', 'Bottom', 'Left'].map((s) => px(cs[`padding${s}`])),
        textAlign: cs.textAlign,
      },
      kids: [],
    }
    if (tag === 'svg') {
      const clone = el.cloneNode(true)
      for (const a of ['class', 'style', 'data-dos-src', 'data-dos-comp', 'data-dos-call', 'data-dos-name', 'aria-hidden']) clone.removeAttribute(a)
      const stroke = color(cs.stroke)
      const fill = color(cs.fill)
      node.svg = {
        viewBox: el.getAttribute('viewBox') ?? `0 0 ${r.width} ${r.height}`,
        inner: clone.innerHTML,
        stroke: el.getAttribute('stroke') === 'none' ? null : stroke,
        fill: el.getAttribute('fill') === 'none' ? null : fill,
        strokeWidth: el.getAttribute('stroke-width') ?? cs.strokeWidth,
        linecap: el.getAttribute('stroke-linecap') ?? 'butt',
        linejoin: el.getAttribute('stroke-linejoin') ?? 'miter',
      }
      return node
    }
    if (tag === 'img') unsupported.push({ kind: 'image', where })
    if (tag === 'input' || tag === 'textarea') {
      const item = inputText(el, cs, opacity)
      if (item) node.kids.push(item)
      return node
    }
    for (const child of el.childNodes) {
      if (child.nodeType === 3) {
        const item = textItem(child, cs, opacity)
        if (item) node.kids.push(item)
      } else if (child.nodeType === 1) {
        const item = walk(child, opacity)
        if (item) node.kids.push(item)
      }
    }
    return node
  }

  const root = document.getElementById('root')
  const pageBackground = color(getComputedStyle(document.body).backgroundColor) ?? color(getComputedStyle(document.documentElement).backgroundColor) ?? { hex: '#ffffff', alpha: 1 }
  return { tree: walk(root, 1), unsupported, pageBackground, pageClasses: `${document.documentElement.className} ${document.body.className}`, size: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight } }
}
