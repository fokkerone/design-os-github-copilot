/**
 * Google Fonts for the product's type scale. Themes and token models name font families but load
 * no font files, so a family like Space Mono would fall back to the system font. Shared by the
 * prototype preview (src/preview/bridge/fonts.ts) and the Design System page, which renders in
 * the product's look. Families the system already has (ui-sans-serif, Georgia, …) are not requested.
 */
import { useEffect } from 'react'
import type { DesignTokens } from '@/types/design-tokens'

const GENERIC = /^(ui-|system-ui|sans-serif|serif|monospace|cursive|fantasy|-apple-system|BlinkMacSystemFont|Segoe UI|Roboto|Helvetica|Arial|Georgia|Cambria|Times|Menlo|Monaco|Consolas|SFMono)/i
const LINK_ATTR = 'data-dos-font'

export const isGenericFont = (family: string) => GENERIC.test(family)

/** The Google Fonts families of the type scale, e.g. ["Inter", "Space Mono", "Merriweather"] */
export function tokenFontFamilies(tokens: DesignTokens | null): string[] {
  const families = (tokens?.typography.fontFamilies ?? []).map((f) => f.family.replace(/['"]/g, '').trim())
  return [...new Set(families.filter((f) => f && !isGenericFont(f)))]
}

/** [family, weights] of the type scale */
export function tokenFonts(tokens: DesignTokens | null): [string, number[]][] {
  const weights = (tokens?.typography.fontWeights ?? []).map((w) => w.value)
  return tokenFontFamilies(tokens).map((family) => [family, weights])
}

/** The stylesheet URL for one family, with the weights of the type scale */
export function fontUrl(family: string, weights: number[]): string {
  const name = family.replace(/ /g, '+')
  const axis = weights.length ? `:wght@${[...new Set(weights)].sort((a, b) => a - b).join(';')}` : ''
  return `https://fonts.googleapis.com/css2?family=${name}${axis}&display=swap`
}

/** Adds a stylesheet link per family to <head> while the component is mounted */
export function useFontLinks(fonts: [string, number[]][]) {
  const key = JSON.stringify(fonts)
  useEffect(() => {
    const links = (JSON.parse(key) as [string, number[]][]).flatMap(([family, weights]) => {
      if (document.head.querySelector(`link[${LINK_ATTR}="${family}"]`)) return []
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = fontUrl(family, weights)
      link.setAttribute(LINK_ATTR, family)
      // A static font without one of the weights answers 400: load its default weights instead
      link.onerror = () => {
        link.onerror = null
        link.href = fontUrl(family, [])
      }
      document.head.appendChild(link)
      return [link]
    })
    return () => links.forEach((l) => l.remove())
  }, [key])
}
