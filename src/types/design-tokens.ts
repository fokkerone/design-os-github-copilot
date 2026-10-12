/**
 * DesignOS token model (schema "designos-tokens/v1").
 *
 * Produced by `npm run tokens:build` (scripts/design-tokens/) from
 * product/design-system/import/ and written to product/design-system/tokens/tokens.json.
 * The app only reads this file — it never interprets raw DTCG itself.
 */

export interface ColorValue {
  hex: string
  oklch: string
  alpha: number
}

export interface ModalColorToken {
  name: string
  cssVar: string
  runtimeVar: string | null
  utility: string
  light: ColorValue | null
  dark: ColorValue | null
  paths: string[]
}

export interface ColorStep {
  step: string
  cssVar: string
  value: ColorValue
  path: string
}

export interface ColorScale {
  name: string
  steps: ColorStep[]
}

export interface GradientStyle {
  name: string
  label: string
  kind: string
  complete: boolean
  stops: { hex: string; oklch: string; position: string }[]
  css: string | null
  raw: string
}

export interface FontFamilyToken {
  name: string
  cssVar: string
  family: string
  stack: string
  path: string
}

export interface FontSizeToken {
  name: string
  cssVar: string
  px: number
  rem: string
  lineHeight: { px: number; rem: string; cssVar: string; path: string } | null
  path: string
}

export interface FontWeightToken {
  name: string
  cssVar: string
  value: number
  path: string
}

export interface TextStyle {
  name: string
  label: string
  family: string
  weight: string
  weightValue: number | null
  sizePx: number
  lineHeightPx: number
  tracking: string
  utilities: string
}

export interface SpacingStep {
  name: string
  px: number
  rem: string
  multiplier: number | null
  conforms: boolean
  path: string
}

export interface SizingGroup {
  group: string
  items: { name: string; px: number; rem: string; matchesSpacing: boolean; path: string }[]
}

export interface RadiusToken {
  name: string
  cssVar: string
  px: number
  css: string
  path: string
}

export interface ShadowLayer {
  offsetX: number
  offsetY: number
  blur: number
  spread: number
  color: ColorValue
  inset?: boolean
}

export interface ShadowToken {
  name: string
  role: string
  size: string | null
  cssVar: string
  runtimeVar: string | null
  light: { css: string; layers: ShadowLayer[] } | null
  dark: { css: string; layers: ShadowLayer[] } | null
  paths: string[]
}

export interface BlurEffect {
  name: string
  label: string
  kind: 'backdrop-blur' | 'blur'
  px: number
}

export interface BreakpointToken {
  name: string
  cssVar: string
  px: number
  rem: string
  path: string
}

export interface ReportIssue {
  code: string
  severity: 'info' | 'warning'
  summary: string
  count: number
  items: { path: string; detail: string }[]
}

export interface DesignTokens {
  $schema: 'designos-tokens/v1'
  meta: {
    name: string | null
    title: string | null
    description: string | null
    source: { figmaFile: string | null; figmaPage: string | null }
    variableCollections: string[]
    generator: { name: string; version: string; styleDictionary: string }
    inputs: { file: string; sha256: string; bytes: number }[]
    counts: { tokens: number; cssVariables: number; documentedOnly: number; warnings: number }
  }
  color: {
    semantic: ModalColorToken[]
    custom: ModalColorToken[]
    alpha: ColorScale[]
    palettes: ColorScale[]
    gradients: GradientStyle[]
  }
  typography: {
    fontFamilies: FontFamilyToken[]
    fontSizes: FontSizeToken[]
    fontWeights: FontWeightToken[]
    textStyles: TextStyle[]
  }
  spacing: {
    base: { px: number; rem: string; cssVar: string } | null
    scale: SpacingStep[]
  }
  sizing: SizingGroup[]
  radius: RadiusToken[]
  shadows: ShadowToken[]
  effects: BlurEffect[]
  breakpoints: BreakpointToken[]
  opacity: { name: string; value: number; path: string }[]
  layout: { name: string; px: number; rem: string; path: string }[]
  other: { path: string; category: string; type: string | null; value: unknown }[]
  guidelines: {
    mission: string | null
    brand: string[]
    writingTone: string | null
    accessibility: string[]
    rulesDo: string[]
    rulesDont: string[]
    componentRules: string[]
    qualityGates: string[]
    components: { families: string[]; variantAxes: { axis: string; values: string[] }[] }
    gridStyles: string[]
    additional: { file: string; heading: string; markdown: string }[]
  }
  report: {
    issues: ReportIssue[]
    notEmitted: { category: string; reason: string; count: number; paths: string[] }[]
    sources: { file: string; heading: string; status: 'used' | 'partial' | 'superseded' | 'dropped' | 'verbatim'; reason: string }[]
  }
}
