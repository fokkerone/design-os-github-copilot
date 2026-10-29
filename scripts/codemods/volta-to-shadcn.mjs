#!/usr/bin/env node
/**
 * One-off codemod for the Design OS UI: Volta and stone palette classes become shadcn semantic
 * utilities, so the app follows the shadcn preset in src/styles/design-os.css (plan-split-tailwind,
 * phase B2). A light/dark pair collapses into one semantic class; the dark: half is dropped when its
 * light partner became semantic too. Status colors (amber, emerald, ...) stay Tailwind palettes.
 *
 *   node scripts/codemods/volta-to-shadcn.mjs [--write] [dirs...]   default dirs: src/components src/lib
 *
 * Without --write it prints what would change. It lists every palette class it could not map.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const NEUTRAL = /^(stone|rwe-neutral|rwe-sand)$/
const ACCENT = /^(brand-blue|energy-green|energy-blue)$/
const RED = /^(rwe-red|red)$/
const PALETTE = /^(stone|rwe-neutral|rwe-sand|brand-blue|energy-green|energy-blue|rwe-red|red)$/
const UTILITY = /^(bg|text|border|divide|ring|outline|decoration|accent|fill|stroke)-((?:rwe-)?[a-z]+(?:-[a-z]+)?)-(\d+)(?:\/(\d+))?$/
const INTERACTIVE = new Set(['hover', 'group-hover', 'focus', 'focus-within', 'peer-hover'])

/** Sand shades are all light surfaces; put them on the stone scale */
const SAND = { 25: 25, 50: 50, 100: 100, 200: 150, 500: 200 }
const level = (palette, shade) => (palette === 'rwe-sand' ? (SAND[shade] ?? 200) : shade)

/** Split a class into its variants and the utility, ignoring ':' inside brackets */
function splitClass(cls) {
  const parts = []
  let depth = 0
  let start = 0
  for (let i = 0; i < cls.length; i++) {
    if (cls[i] === '[') depth++
    else if (cls[i] === ']') depth--
    else if (cls[i] === ':' && depth === 0) {
      parts.push(cls.slice(start, i))
      start = i + 1
    }
  }
  return { variants: parts, utility: cls.slice(start) }
}

function neutral(prop, l, dark, interactive, palette) {
  // dark mode reads the scale the other way round
  const light = dark ? 1000 - l : l
  switch (prop) {
    case 'text':
      return light >= 700 ? 'foreground' : light >= 400 ? 'muted-foreground' : 'primary-foreground'
    case 'bg':
      if (interactive && light <= 300) return 'accent'
      if (!dark && l <= 25) return 'card'
      if (!dark && palette === 'rwe-sand' && l === 50) return 'background'
      if (interactive && light >= 600) return 'primary/90'
      if (dark && l >= 950) return 'card'
      if (dark && l >= 900) return 'background'
      return light <= 300 ? 'muted' : light <= 600 ? 'muted-foreground' : 'primary'
    case 'border':
    case 'divide':
      return 'border'
    case 'ring':
    case 'outline':
      return 'ring'
    case 'decoration':
      return light <= 300 ? 'border' : 'muted-foreground'
    case 'fill':
    case 'stroke':
      return light >= 400 ? 'muted-foreground' : 'border'
    default:
      return null
  }
}

function accent(prop, shade, dark, interactive) {
  const soft = dark ? shade >= 800 : shade <= 200
  switch (prop) {
    case 'text':
      return dark && shade >= 800 ? 'primary-foreground' : 'primary'
    case 'bg':
      return soft ? (interactive ? 'primary/15' : 'primary/10') : interactive ? 'primary/90' : 'primary'
    case 'border':
    case 'divide':
      return (dark ? shade >= 700 : shade <= 300) ? 'primary/30' : 'primary'
    case 'ring':
    case 'outline':
      return 'ring'
    case 'decoration':
    case 'accent':
    case 'fill':
    case 'stroke':
      return 'primary'
    default:
      return null
  }
}

function red(prop) {
  return { text: 'destructive', bg: 'destructive/10', border: 'destructive/30', divide: 'destructive/30', ring: 'destructive', outline: 'destructive', fill: 'destructive', stroke: 'destructive' }[prop] ?? null
}

/** The semantic class for one palette class, or undefined when it is no palette class */
export function mapClass(cls) {
  const { variants, utility } = splitClass(cls)
  const m = utility.match(UTILITY)
  if (!m || !PALETTE.test(m[2])) return undefined
  const [, prop, palette, shadeText, opacity] = m
  const shade = Number(shadeText)
  const dark = variants.includes('dark')
  const interactive = variants.some((v) => INTERACTIVE.has(v))
  let token = NEUTRAL.test(palette) ? neutral(prop, level(palette, shade), dark, interactive, palette) : ACCENT.test(palette) ? accent(prop, shade, dark, interactive) : RED.test(palette) ? red(prop) : null
  if (!token) return null
  // keep an explicit opacity unless the token already carries one
  if (opacity && !token.includes('/') && prop === 'bg' && !['card', 'background'].includes(token)) token = `${token}/${opacity}`
  if (opacity && (token === 'card' || token === 'background') && Number(opacity) < 100) token = `${token}/${opacity}`
  return { variants, prop, token, dark }
}

const key = (variants, prop) => `${variants.filter((v) => v !== 'dark').join(':')}|${prop === 'divide' ? 'divide' : prop}`

/** Rewrite the classes of one string; returns the new string and the classes it could not map */
export function rewriteClasses(text) {
  const words = text.split(/(\s+)/)
  const mapped = words.map((w) => (/\S/.test(w) ? mapClass(w) : undefined))
  // white/black next to a semantic class: text on primary, or the light half of a dark: palette pair
  words.forEach((w, i) => {
    const { variants, utility } = splitClass(w)
    const bw = utility.match(/^(bg|text|border)-(white|black)$/)
    if (!bw || variants.includes('dark')) return
    const k = key(variants, bw[1])
    const onPrimary = bw[1] === 'text' && mapped.some((m) => m && !m.dark && m.prop === 'bg' && m.token === 'primary' && key(m.variants, 'text') === k)
    const partner = mapped.find((m) => m && m.dark && key(m.variants, m.prop) === k)
    if (onPrimary) mapped[i] = { variants, prop: 'text', token: 'primary-foreground', dark: false }
    else if (partner) mapped[i] = { variants, prop: bw[1], token: partner.token, dark: false }
  })
  const semanticLight = new Set()
  mapped.forEach((m) => m && !m.dark && semanticLight.add(key(m.variants, m.prop)))
  const unmapped = []
  // a dark: class without a semantic light partner keeps its variant (light mode stays as it was)
  const out = words.map((w, i) => {
    const m = mapped[i]
    if (m === undefined) return w
    if (m === null) {
      unmapped.push(w)
      return w
    }
    if (m.dark && semanticLight.has(key(m.variants, m.prop))) return null
    return [...m.variants, `${m.prop}-${m.token}`].join(':')
  })
  if (!mapped.some(Boolean)) return { text, unmapped }
  // drop removed and repeated classes with the space before them; ${…} expressions stay untouched
  const seen = new Set()
  let depth = 0
  let result = ''
  for (let i = 0; i < words.length; i += 2) {
    const original = words[i]
    const w = out[i]
    const cls = depth === 0 && /^[!\w[\]&>_.:/=()#%,*-]+$/.test(original)
    depth += (original.match(/\$\{/g) ?? []).length - (original.match(/\}/g) ?? []).length
    if (cls && (w === null || seen.has(w))) continue
    if (cls) seen.add(w)
    result += (i > 0 ? words[i - 1] : '') + w
  }
  // a removed first class must not leave the leading space of the next one
  return { text: /^\s/.test(text) ? result : result.replace(/^\s+/, ''), unmapped }
}

/** Rewrite every string literal of a source file that contains palette classes */
export function rewriteSource(code) {
  const unmapped = []
  // template literals may span lines; '' and "" strings never do
  const out = code.replace(/`((?:\\.|[^\\`])*)`|(['"])((?:\\.|(?!\2)[^\\\n])*?)\2/g, (all, template, quote, body) => {
    const q = template === undefined ? quote : '`'
    // strings inside ${…} of a template first
    const text = template === undefined ? body : template.replace(/(['"])((?:\\.|(?!\1)[^\\\n])*?)\1/g, (s, nq, nb) => {
      const r = rewriteClasses(nb)
      unmapped.push(...r.unmapped)
      return nq + r.text + nq
    })
    if (!/(stone|rwe-[a-z]+|brand-blue|energy-[a-z]+|red)-\d/.test(text)) return q + text + q
    const r = rewriteClasses(text)
    unmapped.push(...r.unmapped)
    return q + r.text + q
  })
  return { code: out, unmapped }
}

function filesIn(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    return e.isDirectory() ? filesIn(full) : /\.(tsx?|jsx?)$/.test(e.name) ? [full] : []
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2)
  const write = args.includes('--write')
  const dirs = args.filter((a) => !a.startsWith('--'))
  const unmapped = new Map()
  let changed = 0
  for (const file of (dirs.length ? dirs : ['src/components', 'src/lib']).flatMap(filesIn).sort()) {
    const code = fs.readFileSync(file, 'utf8')
    const r = rewriteSource(code)
    for (const u of r.unmapped) unmapped.set(u, [...(unmapped.get(u) ?? []), file])
    if (r.code === code) continue
    changed++
    if (write) fs.writeFileSync(file, r.code)
    else console.log(file)
  }
  console.log(`${changed} files ${write ? 'rewritten' : 'would change'}`)
  for (const [cls, files] of unmapped) console.log(`  not mapped: ${cls}  ${[...new Set(files)].join(', ')}`)
}
