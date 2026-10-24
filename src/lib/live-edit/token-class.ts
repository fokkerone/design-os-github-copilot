/**
 * Live Edit: which class renders a design token in the prototype. The prototype does not load
 * the product's tokens.css (token separation), so a token class only shows the token when
 * Tailwind's default theme has the same value under the same name (`p-4`, `text-sm`,
 * `bg-teal-600`). Every other token is written as its exact value, colors in OKLCH
 * (`bg-[oklch(65.03%_0.11008_192.46)]`, `rounded-[0.25rem]`), with the token named in a
 * comment; the export maps it back to the semantic utility.
 */
import twTheme from 'virtual:tailwind-theme'

/** Tailwind's default theme variables, without the leading `--` (`color-teal-600`, `radius-md`, …) */
export const tailwindTheme: ReadonlyMap<string, string> = (() => {
  const vars = new Map<string, string>()
  for (const [, name, value] of twTheme.matchAll(/--([\w.-]+):\s*([^;]+);/g)) {
    if (!vars.has(name)) vars.set(name, value.replace(/\s+/g, ' ').trim())
  }
  // Utilities Tailwind ships without a theme variable
  const builtins: [string, string][] = [['radius-none', '0'], ['radius-full', 'calc(infinity * 1px)'], ['leading-none', '1'], ['shadow-none', '0 0 #0000']]
  for (const [name, value] of builtins) if (!vars.has(name)) vars.set(name, value)
  return vars
})()

/** Names of a theme namespace, in theme order: `themeNames('radius')` → ['xs', 'sm', …] */
export function themeNames(namespace: string): string[] {
  const names: string[] = []
  for (const key of tailwindTheme.keys()) {
    if (!key.startsWith(`${namespace}-`)) continue
    const name = key.slice(namespace.length + 1)
    if (!name.includes('--')) names.push(name)
  }
  return names
}

interface Lab {
  L: number
  a: number
  b: number
  alpha: number
}

const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

/** sRGB hex to OKLab (only Tailwind's `#000` and `#fff` need it) */
function hexToLab(hex: string): Lab | null {
  let h = hex.slice(1)
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('')
  if (h.length !== 6 && h.length !== 8) return null
  const [r, g, b] = [0, 2, 4].map((i) => linear(parseInt(h.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    alpha: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1,
  }
}

/** `oklch(L% C H / A)` (or a hex) to OKLab, null for anything else */
export function parseColor(value: string): Lab | null {
  const v = value.trim()
  if (v.startsWith('#')) return hexToLab(v)
  const m = v.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+|none)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/)
  if (!m) return null
  const L = Number(m[1]) / (m[2] ? 100 : 1)
  const C = Number(m[3])
  const H = m[4] === 'none' ? 0 : (Number(m[4]) * Math.PI) / 180
  const alpha = m[5] === undefined ? 1 : Number(m[5]) / (m[6] ? 100 : 1)
  return { L, a: C * Math.cos(H), b: C * Math.sin(H), alpha }
}

/** Same color up to the rounding of a token export */
export function sameColor(x: string, y: string): boolean {
  const a = parseColor(x)
  const b = parseColor(y)
  if (!a || !b) return false
  return Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b) < 0.0025 && Math.abs(a.alpha - b.alpha) < 0.01
}

/** A CSS length in px; Infinity for "full" radii, NaN when it is no plain length */
export function toPx(value: string): number {
  const v = value.trim()
  if (v === '0') return 0
  if (/infinity/.test(v) || v === '9999px') return Infinity
  const m = v.match(/^(-?[\d.]+)(px|rem)$/)
  return m ? Number(m[1]) * (m[2] === 'rem' ? 16 : 1) : NaN
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').replace(/"/g, "'").replace(/\s*,\s*/g, ',').trim()

/** Same value: colors by OKLab distance, lengths in px, numbers and anything else as text */
export function sameValue(x: string, y: string): boolean {
  if (parseColor(x) || parseColor(y)) return sameColor(x, y)
  const [px, py] = [toPx(x), toPx(y)]
  if (!Number.isNaN(px) || !Number.isNaN(py)) return px === py || Math.abs(px - py) < 0.01
  const [nx, ny] = [Number(x), Number(y)]
  if (!Number.isNaN(nx) && !Number.isNaN(ny)) return Math.abs(nx - ny) < 0.0001
  return normalize(x) === normalize(y)
}

/** A value as the inside of an arbitrary class: spaces become underscores, quotes single (the class sits in a JSX string) */
export const arbitrary = (value: string) => value.trim().replace(/"/g, "'").replace(/\s*,\s*/g, ',').replace(/\s+/g, '_')

export interface TokenClass {
  className: string
  /** The token to name in a `token:` comment; set when the class does not name it already */
  token?: string
}

/**
 * The class for a token: `${prefix}-${name}` when Tailwind's theme has the same value at
 * `themeKey`, else the exact value as an arbitrary class plus the token for the comment.
 * `hint` adds a Tailwind type hint for ambiguous prefixes (`font-[family-name:…]`).
 */
export function tokenClass({
  prefix,
  name,
  value,
  themeKey,
  token,
  hint,
}: {
  prefix: string
  name: string
  value: string
  themeKey: string | null
  token?: string
  hint?: string
}): TokenClass {
  const tw = themeKey ? tailwindTheme.get(themeKey) : undefined
  if (tw !== undefined && sameValue(value, tw)) return { className: `${prefix}-${name}` }
  return { className: `${prefix}-[${hint ? `${hint}:` : ''}${arbitrary(value)}]`, token: token ?? name }
}

/** Spacing steps resolve through `--spacing`: `p-4` is 4 × 0.25rem */
export function spacingClass(prefix: string, name: string, value: string, token?: string): TokenClass {
  const base = toPx(tailwindTheme.get('spacing') ?? '0.25rem')
  const expected = name === 'px' ? 1 : Number(name) * base
  if (!Number.isNaN(expected) && Math.abs(toPx(value) - expected) < 0.01) return { className: `${prefix}-${name}` }
  return { className: `${prefix}-[${arbitrary(value)}]`, token: token ?? `spacing-${name}` }
}
