import { describe, expect, it } from 'vitest'
import { fontUrl, tokenFontFamilies } from '@/lib/product-fonts'
import type { DesignTokens } from '@/types/design-tokens'

const tokens = {
  typography: {
    fontFamilies: [
      { name: 'sans', cssVar: '--font-sans', family: 'Inter', stack: '"Inter", ui-sans-serif, sans-serif', path: '' },
      { name: 'mono', cssVar: '--font-mono', family: 'Space Mono', stack: '"Space Mono", ui-monospace, monospace', path: '' },
      { name: 'system', cssVar: '--font-system', family: 'ui-sans-serif', stack: 'ui-sans-serif', path: '' },
    ],
    fontWeights: [],
  },
} as unknown as DesignTokens

describe('product fonts for the token samples', () => {
  it('loads only web fonts from Google Fonts', () => {
    expect(tokenFontFamilies(tokens)).toEqual(['Inter', 'Space Mono'])
    expect(fontUrl('Space Mono', [700, 400])).toBe('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap')
  })
})
