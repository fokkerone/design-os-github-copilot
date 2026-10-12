/**
 * Strict classification of DTCG tokens into the DesignOS token model.
 *
 * Every token gets exactly one category from an ordered rule table. A token that
 * matches no rule is "unclassified" and is reported — nothing is dropped silently.
 * The result is attached to the token as `$extensions.designos` by the Style
 * Dictionary preprocessor, so transforms and formats work from the same decision.
 */

/** Palettes in Tailwind order. Unknown palettes sort after these, alphabetically. */
export const PALETTE_ORDER = [
  'base', 'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
]

/** Known misspellings of Tailwind palette names. */
const PALETTE_ALIASES = { fuschia: 'fuchsia', grey: 'gray' }

/** Figma weight names -> Tailwind v4 font-weight names. */
const FONT_WEIGHT_ALIASES = {
  thin: 'thin', hairline: 'thin', 'extra-light': 'extralight', 'ultra-light': 'extralight',
  extralight: 'extralight', light: 'light', regular: 'normal', normal: 'normal', book: 'normal',
  medium: 'medium', 'semi-bold': 'semibold', semibold: 'semibold', 'demi-bold': 'semibold',
  bold: 'bold', 'extra-bold': 'extrabold', extrabold: 'extrabold', 'ultra-bold': 'extrabold',
  black: 'black', heavy: 'black',
}

/** Categories whose numeric values are pixel dimensions. */
export const PX_CATEGORIES = new Set([
  'spacing', 'sizing', 'radius', 'breakpoint', 'font-size', 'line-height', 'layout',
])

/** Categories that are documented but intentionally not emitted to tokens.css. */
export const DOC_ONLY_REASONS = {
  opacity: 'Tailwind v4 supports opacity-* natively; documented for reference',
  sizing: 'Tailwind v4 derives w-*, h-*, min-w-*, max-w-* from --spacing; documented for reference',
  'line-height': 'Emitted as --text-*--line-height next to the matching font size',
  layout: 'No Tailwind v4 theme namespace; documented for reference',
  'component-config': 'Component configuration value, not a design token',
  'shadow-primitive': 'Decomposed Figma shadow variable; superseded by the composite Light/Dark box-shadow tokens',
  unclassified: 'No classification rule matches this token',
}

/** Lowercase, kebab-case, keeps digits, dots and dashes ("0,5" -> "0.5", "Semi Bold" -> "semi-bold"). */
export function slug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/,/g, '.')
    .replace(/[\s_/]+/g, '-')
    .replace(/[^a-z0-9.-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Split a "-dark" suffix into a mode. */
function splitMode(name) {
  return name.endsWith('-dark') ? { name: name.slice(0, -5), mode: 'dark' } : { name, mode: 'light' }
}

const note = (code, message) => ({ code, message })

/**
 * Classify one token.
 * @param {string[]} path raw DTCG path
 * @param {{ $type?: string, $value: unknown }} token
 * @returns {{ category: string, group?: string, name: string, mode?: 'light'|'dark', fixType?: string, notes: {code:string,message:string}[] }}
 */
export function classify(path, token) {
  const [root, a, b, c] = path
  const type = token.$type
  const value = token.$value
  const notes = []
  const isColor = type === 'color'

  // Generic data-quality notes
  if (type === 'number' && typeof value === 'string') {
    notes.push(note('mistyped-string', `String value ${JSON.stringify(value)} is typed as "number"`))
  }

  // 1. Palette colors: colors.<palette>.<step>
  if (root === 'colors' && path.length === 3 && isColor) {
    let palette = slug(a)
    if (PALETTE_ALIASES[palette]) {
      notes.push(note('palette-renamed', `Palette "${a}" renamed to "${PALETTE_ALIASES[palette]}"`))
      palette = PALETTE_ALIASES[palette]
    }
    return { category: 'color.palette', group: palette, name: slug(b), notes }
  }

  // 2. Semantic theme colors: theme.<name>[-dark]
  if (root === 'theme' && path.length === 2 && isColor) {
    const { name, mode } = splitMode(slug(a))
    return { category: 'color.semantic', name, mode, notes }
  }

  // 3. Custom colors: custom.<name>[-dark]
  if (root === 'custom' && path.length === 2 && isColor) {
    const { name, mode } = splitMode(slug(a))
    return { category: 'color.custom', name, mode, notes }
  }

  // 4. Alpha colors: opacity.<role>.<step>
  if (root === 'opacity' && path.length === 3 && isColor) {
    return { category: 'color.alpha', group: slug(a), name: slug(b), notes }
  }

  // 5. Opacity scale: opacity.opacity-<n>
  if (root === 'opacity' && path.length === 2 && type === 'number') {
    return { category: 'opacity', name: slug(a).replace(/^opacity-/, ''), notes }
  }

  // 6. Decomposed shadow primitives: shadow.*
  if (root === 'shadow') {
    return { category: 'shadow-primitive', name: path.slice(1).map(slug).join('.'), notes }
  }

  // 7. Composite shadows: Light|Dark.box-shadow.<role>.<size>
  if ((root === 'Light' || root === 'Dark') && a === 'box-shadow' && path.length === 4 && type === 'shadow') {
    const role = slug(b)
    const size = slug(c)
    return {
      category: 'shadow',
      group: role,
      name: role === 'default' ? size : `${role}-${size}`,
      mode: root === 'Dark' ? 'dark' : 'light',
      notes,
    }
  }
  if (path.length === 1 && type === 'shadow') {
    const name = slug(root).replace(/^shadow-/, '')
    return { category: 'shadow', group: name, name, mode: 'light', notes }
  }

  // 8. Breakpoints
  if (root === 'breakpoints' && path.length === 2) {
    return { category: 'breakpoint', name: slug(a), notes }
  }

  // 9. Spacing
  if (root === 'spacing' && path.length === 2) {
    return { category: 'spacing', name: slug(a), notes }
  }

  // 10. Sizing scales
  const sizingPrefixes = { height: 'h-', width: 'w-', 'min-width': 'min-w-', 'max-width': 'max-w-' }
  if (root in sizingPrefixes && path.length === 2) {
    return { category: 'sizing', group: root, name: slug(a).replace(sizingPrefixes[root], ''), notes }
  }

  // 11. Radius: borders.radius.rounded-<k> | "border radius".<k>
  if ((root === 'borders' && a === 'radius' && path.length === 3) || (slug(root) === 'border-radius' && path.length === 2)) {
    const raw = slug(path[path.length - 1])
    let name = raw.replace(/^rounded-/, '')
    if (name === 'rounded') {
      notes.push(note('radius-alias', `Radius "${path.join('.')}" (pill) mapped to "full"`))
      name = 'full'
    }
    return { category: 'radius', name, notes }
  }

  // 12. Typography scales
  if (root === 'typography' && path.length === 3) {
    if (a === 'font-size') return { category: 'font-size', name: slug(b), notes }
    if (a === 'line-height') return { category: 'line-height', name: slug(b), notes }
    if (a === 'font-weight') {
      const raw = slug(b)
      const name = FONT_WEIGHT_ALIASES[raw] ?? raw
      if (name !== raw) notes.push(note('font-weight-alias', `Font weight "${b}" mapped to Tailwind name "${name}"`))
      return { category: 'font-weight', name, notes }
    }
  }

  // 13. Font families: "font family".font-<k>
  if (slug(root) === 'font-family' && path.length === 2) {
    const fixType = type === 'fontFamily' ? undefined : 'fontFamily'
    const filtered = notes.filter((n) => n.code !== 'mistyped-string')
    if (fixType) filtered.push(note('font-family-type', `$type "${type}" corrected to "fontFamily"`))
    return { category: 'font-family', name: slug(a).replace(/^font-/, ''), fixType, notes: filtered }
  }

  // 14. Layout widths
  if (path.length === 1 && type === 'number' && typeof value === 'number' && /width$/.test(slug(root))) {
    return { category: 'layout', name: slug(root), notes }
  }

  // 15. Component configuration strings (e.g. button-size = "lg")
  if (typeof value === 'string' && !isColor) {
    return { category: 'component-config', name: path.map(slug).join('.'), notes }
  }

  return { category: 'unclassified', name: path.map(slug).join('.'), notes }
}

/**
 * Style Dictionary preprocessor: annotate every token with its classification.
 * Walks the raw DTCG tree in key order; returns a new tree (input is not mutated).
 */
export function annotateTokens(tree) {
  const walk = (node, path) => {
    if (node && typeof node === 'object' && !Array.isArray(node) && '$value' in node) {
      const result = classify(path, node)
      const { fixType, ...designos } = result
      return {
        ...node,
        ...(fixType ? { $type: fixType } : {}),
        $extensions: { ...(node.$extensions ?? {}), designos: { ...designos, originalType: node.$type ?? null } },
      }
    }
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      const out = {}
      for (const [key, child] of Object.entries(node)) {
        out[key] = key.startsWith('$') ? child : walk(child, [...path, key])
      }
      return out
    }
    return node
  }
  return walk(tree, [])
}

export function fontWeightAlias(name) {
  return FONT_WEIGHT_ALIASES[slug(name)] ?? slug(name)
}
