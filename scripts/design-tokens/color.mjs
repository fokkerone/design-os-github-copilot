/**
 * Color conversion: sRGB hex <-> OKLCH (Tailwind CSS v4 color space).
 *
 * Pure functions, no dependencies. Output is rounded to a fixed precision so the
 * same hex always yields the same oklch() string (deterministic), and the rounded
 * value still converts back to the original 8-bit hex (lossless round trip).
 *
 * Math: Björn Ottosson, "A perceptual color space for image processing" (OKLab).
 */

/** Fixed output precision. Changing these changes every generated file. */
export const PRECISION = Object.freeze({ lightness: 2, chroma: 5, hue: 2, alpha: 4 })

/** Chroma below this is treated as achromatic (hue is meaningless and noisy). */
const ACHROMATIC_CHROMA = 0.00005

const HEX_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export function isHexColor(value) {
  return typeof value === 'string' && HEX_RE.test(value.trim())
}

/** Parse #rgb, #rgba, #rrggbb, #rrggbbaa into 0..255 channels and 0..1 alpha. */
export function parseHex(hex) {
  if (!isHexColor(hex)) throw new Error(`Invalid hex color: ${JSON.stringify(hex)}`)
  let h = hex.trim().slice(1).toLowerCase()
  if (h.length <= 4) h = [...h].map((c) => c + c).join('')
  const n = (i) => parseInt(h.slice(i, i + 2), 16)
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 }
}

/** Canonical lowercase hex: #rrggbb, or #rrggbbaa when not fully opaque. */
export function normalizeHex(hex) {
  const { r, g, b, a } = parseHex(hex)
  return toHex({ r, g, b, a })
}

export function toHex({ r, g, b, a = 1 }) {
  const byte = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  const alpha = Math.round(a * 255)
  return `#${byte(r)}${byte(g)}${byte(b)}${alpha === 255 ? '' : byte(alpha)}`
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

/** sRGB hex -> unrounded { l (0..1), c, h (deg), alpha } */
export function hexToOklchRaw(hex) {
  const { r, g, b, a } = parseHex(hex)
  const lr = toLinear(r / 255)
  const lg = toLinear(g / 255)
  const lb = toLinear(b / 255)

  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  const c = Math.sqrt(A * A + B * B)
  let h = (Math.atan2(B, A) * 180) / Math.PI
  if (h < 0) h += 360
  return { l: L, c, h, alpha: a }
}

/** OKLCH (l 0..1, c, h deg) -> sRGB 0..255 channels (unclamped floats) */
export function oklchToRgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180
  const A = c * Math.cos(hr)
  const B = c * Math.sin(hr)
  const l_ = l + 0.3963377774 * A + 0.2158037573 * B
  const m_ = l - 0.1055613458 * A - 0.0638541728 * B
  const s_ = l - 0.0894841775 * A - 1.291485548 * B
  const L3 = l_ ** 3
  const M3 = m_ ** 3
  const S3 = s_ ** 3
  const r = 4.0767416621 * L3 - 3.3077115913 * M3 + 0.2309699292 * S3
  const g = -1.2684380046 * L3 + 2.6097574011 * M3 - 0.3413193965 * S3
  const b = -0.0041960863 * L3 - 0.7034186147 * M3 + 1.707614701 * S3
  return { r: toGamma(r) * 255, g: toGamma(g) * 255, b: toGamma(b) * 255 }
}

/** Deterministic number formatting: fixed decimals, trailing zeros trimmed, no "-0". */
export function formatNumber(value, decimals) {
  let s = value.toFixed(decimals)
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '')
  if (s === '-0') s = '0'
  return s
}

/** Rounded OKLCH components, exactly as they appear in the CSS string. */
export function hexToOklch(hex) {
  const raw = hexToOklchRaw(hex)
  const achromatic = raw.c < ACHROMATIC_CHROMA
  const l = formatNumber(raw.l * 100, PRECISION.lightness)
  const c = achromatic ? '0' : formatNumber(raw.c, PRECISION.chroma)
  let h = achromatic ? '0' : formatNumber(raw.h, PRECISION.hue)
  if (h === '360') h = '0'
  const alpha = formatNumber(raw.alpha, PRECISION.alpha)
  return { l, c, h, alpha }
}

/** "#0ba4a1" -> "oklch(64.6% 0.1117 191.9)"; alpha < 1 -> "oklch(... / 0.102)" */
export function hexToOklchCss(hex) {
  const { l, c, h, alpha } = hexToOklch(hex)
  return alpha === '1' ? `oklch(${l}% ${c} ${h})` : `oklch(${l}% ${c} ${h} / ${alpha})`
}

const OKLCH_RE = /^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/

/** Parse an oklch() string produced by hexToOklchCss back to hex (used by tests). */
export function oklchCssToHex(css) {
  const m = OKLCH_RE.exec(css)
  if (!m) throw new Error(`Invalid oklch(): ${css}`)
  const rgb = oklchToRgb({ l: Number(m[1]) / 100, c: Number(m[2]), h: Number(m[3]) })
  return toHex({ ...rgb, a: m[4] === undefined ? 1 : Number(m[4]) })
}

/** Value object stored in the DesignOS token model for every color. */
export function colorValue(hex) {
  const normalized = normalizeHex(hex)
  return { hex: normalized, oklch: hexToOklchCss(normalized), alpha: parseHex(normalized).a === 1 ? 1 : Number(formatNumber(parseHex(normalized).a, PRECISION.alpha)) }
}
