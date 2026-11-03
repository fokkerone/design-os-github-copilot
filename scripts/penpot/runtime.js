/* Runs in the Penpot plugin (execute_code), installed as storage.dos: builds what scripts/penpot/design-tree.mjs describes. */
(function () {
  const NS = 'designos'
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const VARIANT_PROPS = ['viewport', 'mode', 'state']
  const LAYOUT_ORIGIN = 100
  /** Penpot applies changes with a delay that grows with the file, so this waits for the result, not for a set time */
  const waitUntil = async (done, what, ms = 25_000) => {
    const end = Date.now() + ms
    while (!done()) {
      if (Date.now() > end) throw new Error(`Penpot did not finish ${what} in time`)
      await sleep(100)
    }
  }
  const local = () => penpot.library.local
  let tokenCache = null
  const tokenByName = (name) => {
    if (!tokenCache) {
      tokenCache = new Map()
      for (const set of local().tokens.sets) for (const t of set.tokens) tokenCache.set(t.name, t)
    }
    return tokenCache.get(name)
  }
  const missing = new Set()
  const bind = (shape, tokens) => {
    for (const [prop, name] of Object.entries(tokens ?? {})) {
      const token = tokenByName(name)
      if (!token) {
        missing.add(name)
        continue
      }
      // Penpot refuses "fontFamilies" as a property name although its API lists it; without one the default applies
      try {
        if (prop === 'fontFamilies') shape.applyToken(token)
        else shape.applyToken(token, [prop])
      } catch (e) {
        missing.add(`bind:${prop}:${name}`)
      }
    }
  }
  const place = (shape, parent, x, y) => {
    parent.appendChild(shape)
    penpotUtils.setParentXY(shape, x, y)
  }
  const fonts = new Map()
  const fontOf = (family) => {
    if (!fonts.has(family)) fonts.set(family, penpot.fonts.all.find((f) => f.name === family) ?? null)
    return fonts.get(family)
  }
  const styleText = (t, op) => {
    const f = op.font
    const font = fontOf(f.family)
    if (font) {
      const variant = font.variants.find((v) => String(v.fontWeight) === String(f.weight) && (v.fontStyle ?? 'normal') === f.style) ?? font.variants.find((v) => String(v.fontWeight) === String(f.weight))
      font.applyToText(t, variant)
    } else missing.add(`font:${f.family}`)
    t.fontSize = String(f.size)
    t.lineHeight = String(f.lineHeight)
    t.letterSpacing = String(f.letterSpacing)
    if (f.transform && f.transform !== 'none') t.textTransform = f.transform
    if (f.decoration && f.decoration !== 'none') t.textDecoration = f.decoration
    t.align = f.align === 'center' ? 'center' : f.align === 'right' || f.align === 'end' ? 'right' : 'left'
    t.verticalAlign = 'top'
    t.fills = op.fills
    t.growType = 'auto-width'
  }
  const componentByKey = () => {
    const map = new Map()
    const add = (c) => {
      const key = c.getSharedPluginData(NS, 'key')
      if (key) map.set(key, c)
    }
    for (const c of local().components) {
      add(c)
      // The library lists a variant group by one entry; its members are reached through the group
      if (c.isVariant?.()) for (const v of c.variants?.variantComponents?.() ?? []) add(v)
    }
    return map
  }
  const applyBox = (shape, op) => {
    if (op.opacity !== undefined && op.opacity !== 1) shape.opacity = op.opacity
    if (op.fills) shape.fills = op.fills
    if (op.strokes) shape.strokes = op.strokes
    if (op.shadows) shape.shadows = op.shadows
    if (op.radius) {
      shape.borderRadiusTopLeft = op.radius[0]
      shape.borderRadiusTopRight = op.radius[1]
      shape.borderRadiusBottomRight = op.radius[2]
      shape.borderRadiusBottomLeft = op.radius[3]
    }
  }
  const walk = (shape, fn) => {
    fn(shape)
    for (const c of shape.children ?? []) walk(c, fn)
  }
  const build = (op, parent, comps, record) => {
    let shape
    if (op.t === 'rect') {
      shape = penpot.createRectangle()
      shape.name = op.name
      shape.resize(Math.max(op.w, 0.01), Math.max(op.h, 0.01))
      applyBox(shape, op)
      place(shape, parent, op.x, op.y)
      bind(shape, op.tokens)
      // The surface of a container primitive grows with its instance
      if (op.fit) {
        shape.constraintsHorizontal = 'leftright'
        shape.constraintsVertical = 'topbottom'
      }
    } else if (op.t === 'text') {
      shape = penpot.createText(op.chars)
      shape.name = op.name
      styleText(shape, op)
      if (op.opacity !== 1) shape.opacity = op.opacity
      place(shape, parent, op.x, op.y)
      bind(shape, op.tokens)
    } else if (op.t === 'svg') {
      shape = penpot.createShapeFromSvg(op.svg)
      shape.name = op.name
      if (op.opacity !== 1) shape.opacity = op.opacity
      // Penpot imports an icon at its viewBox size
      shape.resize(op.w, op.h)
      place(shape, parent, op.x, op.y)
      walk(shape, (s) => {
        if (s.type === 'group') return
        // The transparent background keeps the icon's box, so it takes as much room as in the browser
        if (s.name === 'base-background') return
        if (op.tokens.strokeColor && s.strokes?.length) bind(s, { strokeColor: op.tokens.strokeColor })
        if (op.tokens.fill && s.fills?.length) bind(s, { fill: op.tokens.fill })
      })
    } else if (op.t === 'board') {
      shape = penpot.createBoard()
      shape.name = op.name
      shape.resize(op.w, op.h)
      shape.fills = []
      shape.clipContent = !!op.clip
      place(shape, parent, op.x, op.y)
      for (const k of op.kids) build(k, shape, comps, record)
    } else if (op.t === 'instance') {
      const comp = comps.get(op.key)
      if (!comp) throw new Error('Component missing: ' + op.key)
      shape = comp.instance()
      shape.name = op.name
      place(shape, parent, op.x, op.y)
      const texts = []
      walk(shape, (s) => {
        if (s.type === 'text') texts.push(s)
      })
      op.overrides.forEach((chars, i) => {
        if (texts[i] && texts[i].characters !== chars) texts[i].characters = chars
      })
      if (Math.abs(shape.width - op.w) > 0.01 || Math.abs(shape.height - op.h) > 0.01) shape.resize(op.w, op.h)
      if (op.opacity !== undefined && op.opacity !== 1) shape.opacity = op.opacity
      penpotUtils.setParentXY(shape, op.x, op.y)
    } else throw new Error('Unknown op ' + op.t)
    if (op.check !== undefined) record[op.check] = shape.id
    return shape
  }

  // Penpot stores values in its own form: ["Inter"] for "Inter", false for "false"
  const comparable = (v) =>
    JSON.stringify(Array.isArray(v) && v.length === 1 && typeof v[0] === 'string' ? v[0] : v, (k, x) => {
      if (typeof x === 'boolean' || typeof x === 'number') return String(x)
      if (typeof x === 'string') return x.toLowerCase()
      if (x && typeof x === 'object' && !Array.isArray(x)) return Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)))
      return x
    })
  const dos = {
    status: () => ({ file: { id: penpot.currentFile.id, name: penpot.currentFile.name }, page: penpot.currentPage.name }),
    async page(name) {
      const found = penpotUtils.getPageByName(name) ?? (() => {
        const p = penpot.createPage()
        p.name = name
        return p
      })()
      if (penpot.currentPage.id !== found.id) {
        await penpot.openPage(found)
        for (let i = 0; i < 40 && penpot.currentPage.id !== found.id; i++) await sleep(100)
        await sleep(300)
      }
      return found.id
    },
    /** Creates or updates tokens in place, so shapes that use them keep their binding */
    upsertTokens(sets) {
      const out = { created: 0, updated: 0, same: 0, failed: [] }
      const catalog = local().tokens
      for (const s of sets) {
        let set = catalog.sets.find((x) => x.name === s.name)
        if (!set) set = catalog.addSet({ name: s.name, active: true })
        if (!set.active) set.toggleActive()
        const existing = new Map(set.tokens.map((t) => [t.name, t]))
        for (const t of s.tokens) {
          try {
            const had = existing.get(t.name)
            if (!had) {
              set.addToken(t)
              out.created++
            } else if (comparable(had.value) !== comparable(t.value)) {
              had.value = t.value
              out.updated++
            } else out.same++
          } catch (e) {
            out.failed.push(t.name + ': ' + String(e).slice(0, 160))
          }
        }
      }
      tokenCache = null
      return out
    },
    existingKeys: () => [...componentByKey().keys()],
    /** Components no screen uses any more. Boards that still show one keep their look until the next sync */
    async removeStale(current) {
      const keep = new Set(current)
      let removed = 0
      for (const [key, comp] of componentByKey()) {
        if (keep.has(key)) continue
        comp.mainInstance().remove()
        removed++
      }
      await sleep(300)
      return removed
    },
    /** Boards of a component whose build was interrupted */
    clearUnfinished() {
      let removed = 0
      for (const s of [...penpot.currentPage.root.children]) {
        if (s.getSharedPluginData(NS, 'wip')) {
          s.remove()
          removed++
        }
      }
      return removed
    },
    async startMain(spec, x, y) {
      tokenCache = null
      const b = penpot.createBoard()
      b.name = spec.tier + '/' + spec.name
      b.resize(Math.max(spec.w, 1), Math.max(spec.h, 1))
      b.x = x
      b.y = y
      b.fills = []
      b.clipContent = false
      if (spec.surface) {
        applyBox(b, { ...spec.surface, opacity: undefined })
        bind(b, spec.surface.tokens)
      }
      if (spec.flex) {
        const f = b.addFlexLayout()
        const norm = (v) => v
        f.dir = spec.flex.dir
        f.justifyContent = norm(spec.flex.justify === 'stretch' ? 'start' : spec.flex.justify)
        f.alignItems = spec.flex.align
        f.rowGap = spec.flex.rowGap
        f.columnGap = spec.flex.columnGap
        f.topPadding = spec.flex.padding[0]
        f.rightPadding = spec.flex.padding[1]
        f.bottomPadding = spec.flex.padding[2]
        f.leftPadding = spec.flex.padding[3]
        f.horizontalSizing = 'fix'
        f.verticalSizing = 'fix'
      }
      b.setSharedPluginData(NS, 'wip', '1')
      storage.currentMain = b.id
      return b.id
    },
    async appendMain(ops, spec) {
      const b = penpotUtils.findShapeById(storage.currentMain)
      const comps = componentByKey()
      const rec = {}
      for (const op of ops) {
        const shape = build(op, b, comps, rec)
        if (op.inFlex && shape.layoutChild) {
          shape.layoutChild.horizontalSizing = 'auto'
          shape.layoutChild.verticalSizing = 'auto'
        }
      }
      await sleep(150)
      return Object.keys(rec).length
    },
    async finishMain(spec) {
      const b = penpotUtils.findShapeById(storage.currentMain)
      b.resize(Math.max(spec.w, 1), Math.max(spec.h, 1))
      await sleep(150)
      b.setSharedPluginData(NS, 'wip', '')
      const comp = local().createComponent([b])
      comp.name = spec.tier + '/' + spec.name
      comp.setSharedPluginData(NS, 'key', spec.key)
      await sleep(150)
      return { id: comp.id, w: b.width, h: b.height }
    },
    /**
     * Where to lay out new shapes on the current page. Penpot drops every new copy at the page's (0,0),
     * into whatever board covers that point, and a copy inside another copy can never be moved out
     * ("Cannot change the structure of a component copy"). So nothing may cover that point.
     */
    layoutStart() {
      const shapes = [...penpot.currentPage.root.children]
      let bottom = shapes.reduce((max, s) => Math.max(max, s.y + s.height), 0)
      for (const s of shapes) {
        if (s.x <= 0 && s.y <= 0 && s.x + s.width >= 0 && s.y + s.height >= 0) {
          s.x = LAYOUT_ORIGIN
          s.y = bottom + LAYOUT_ORIGIN
          bottom = s.y + s.height
        }
      }
      return { x: LAYOUT_ORIGIN, y: bottom > 0 ? bottom + LAYOUT_ORIGIN : LAYOUT_ORIGIN }
    },
    /** Groups components of one name as variants; new ones join an existing group */
    async variants(groups) {
      const report = []
      const comps = componentByKey()
      for (const g of groups) {
        const members = g.members.map((m) => ({ ...m, comp: comps.get(m.key) })).filter((m) => m.comp)
        if (members.length < 2) continue
        const mainOf = (m) => m.comp.mainInstance()
        const inGroup = (m) => mainOf(m).parent?.isVariantContainer?.()
        const fresh = members.filter((m) => !inGroup(m))
        let id = members.map((m) => mainOf(m).parent).find((p) => p?.isVariantContainer?.())?.id
        const created = !id
        if (created) {
          id = penpot.createVariantFromComponents(fresh.map(mainOf)).id
          await waitUntil(() => penpotUtils.findShapeById(id)?.variants, `variant group ${g.name}`)
        }
        const group = () => penpotUtils.findShapeById(id)
        const finished = () => VARIANT_PROPS.every((n, i) => group().variants.properties[i] === n) && group().name.replace(/\s*\/\s*/g, '/') === g.name
        // An interrupted run can leave a group without all its properties, so this runs for any group
        if (!created && !fresh.length && finished()) continue
        for (const [i, name] of VARIANT_PROPS.entries()) {
          if (group().variants.properties.length <= i) {
            group().variants.addProperty()
            await waitUntil(() => group().variants.properties.length > i, `property ${i + 1} of ${g.name}`)
          }
          if (group().variants.properties[i] !== name) {
            group().variants.renameProperty(i, name)
            await waitUntil(() => group().variants.properties[i] === name, `property ${name} of ${g.name}`)
          }
        }
        group().name = g.name
        if (!created) {
          for (const m of fresh) group().appendChild(mainOf(m))
          await waitUntil(() => members.every(inGroup), `members of ${g.name}`)
        }
        const current = group().variants.variantComponents()
        for (const m of members) {
          const vc = current.find((c) => c.id === m.comp.id)
          if (!vc) continue
          VARIANT_PROPS.forEach((n, i) => vc.setVariantProperty(i, m.properties[n]))
        }
        await sleep(400)
        report.push({ name: g.name, members: members.length })
      }
      return report
    },
    /** Removes the boards of earlier syncs on the current page */
    clearBoards() {
      let removed = 0
      for (const s of [...penpot.currentPage.root.children]) {
        if (s.getSharedPluginData(NS, 'board')) {
          s.remove()
          removed++
        }
      }
      return removed
    },
    startBoard(spec) {
      tokenCache = null
      const b = penpot.createBoard()
      b.name = spec.name
      b.resize(spec.w, spec.h)
      b.x = spec.x
      b.y = spec.y
      b.fills = spec.fills ?? []
      bind(b, spec.tokens)
      b.clipContent = true
      b.setSharedPluginData(NS, 'board', spec.id)
      storage.currentBoard = b.id
      return b.id
    },
    async appendBoard(ops) {
      const b = penpotUtils.findShapeById(storage.currentBoard)
      const comps = componentByKey()
      const rec = {}
      for (const op of ops) build(op, b, comps, rec)
      await sleep(200)
      return Object.keys(rec).length
    },
    /** What verify compares with the browser: every shape of a board, relative to the board */
    measure(boardId) {
      const board = penpotUtils.findShapeById(boardId)
      const out = []
      for (const s of board.children) out.push({ name: s.name, type: s.type, x: s.x - board.x, y: s.y - board.y, w: s.width, h: s.height, instance: s.isComponentInstance?.() ?? false, tokens: Object.keys(s.tokens ?? {}).length })
      return { w: board.width, h: board.height, shapes: out }
    },
    missing: () => [...missing],
  }
  return dos
})()
