/**
 * WCAG 2.x contrast ratio between two opaque sRGB hex colors.
 * Colors with transparency return null — their contrast depends on what is behind them.
 */

function channels(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '')
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16)
  return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1]
}

function luminance([r, g, b]: [number, number, number, number]): number {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrastRatio(foreground: string, background: string): number | null {
  const fg = channels(foreground)
  const bg = channels(background)
  if (fg[3] < 1 || bg[3] < 1) return null
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
}

export type ContrastLevel = 'AAA' | 'AA' | 'AA large' | 'fail'

export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA large'
  return 'fail'
}
