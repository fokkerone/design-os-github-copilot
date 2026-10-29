/**
 * The prototype's fonts in the preview: the type scale of the token model when the product has
 * imported tokens, else the fonts of the template (template.json). Loading lives in
 * src/lib/product-fonts.ts, shared with the Design System page.
 */
import templateFonts from 'virtual:designos-prototype-fonts'
import { loadDesignTokens } from '@/lib/design-tokens-loader'
import { isGenericFont, tokenFonts, useFontLinks } from '@/lib/product-fonts'

/** What to load: [family, weights] from the token model, else from the template */
export function previewFonts(): [string, number[]][] {
  const fonts = tokenFonts(loadDesignTokens())
  if (fonts.length) return fonts
  return templateFonts.filter((f) => !isGenericFont(f.family)).map((f) => [f.family, f.weights ?? []])
}

export function usePreviewFonts() {
  useFontLinks(previewFonts())
}
