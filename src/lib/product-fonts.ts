/**
 * The product's font families in the fullscreen previews. The prototype does not load the
 * product's tokens.css, so a family the type scale names (Space Mono, Merriweather) would fall
 * back to the system font. The previews load them from Google Fonts, read from the token model
 * as data. Families the system already has (ui-sans-serif, Georgia, …) are not requested.
 */
import { useEffect } from 'react'
import { loadDesignTokens } from '@/lib/design-tokens-loader'

const GENERIC = /^(ui-|system-ui|sans-serif|serif|monospace|cursive|fantasy|-apple-system|BlinkMacSystemFont|Segoe UI|Roboto|Helvetica|Arial|Georgia|Cambria|Times|Menlo|Monaco|Consolas|SFMono)/i
const LINK_ATTR = 'data-dos-font'

/** The Google Fonts families of the type scale, e.g. ["Inter", "Space Mono", "Merriweather"] */
export function productFontFamilies(): string[] {
  const tokens = loadDesignTokens()
  const families = (tokens?.typography.fontFamilies ?? []).map((f) => f.family.replace(/['"]/g, '').trim())
  return [...new Set(families.filter((f) => f && !GENERIC.test(f)))]
}

/** The stylesheet URL for one family, with the weights of the type scale */
export function fontUrl(family: string, weights: number[]): string {
  const name = family.replace(/ /g, '+')
  const axis = weights.length ? `:wght@${[...new Set(weights)].sort((a, b) => a - b).join(';')}` : ''
  return `https://fonts.googleapis.com/css2?family=${name}${axis}&display=swap`
}

export function useProductFonts() {
  useEffect(() => {
    const weights = (loadDesignTokens()?.typography.fontWeights ?? []).map((w) => w.value)
    const links = productFontFamilies().flatMap((family) => {
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
  }, [])
}
