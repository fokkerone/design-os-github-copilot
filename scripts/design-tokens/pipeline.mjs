/**
 * Design token import pipeline (Style Dictionary).
 *
 *   import/tokens.json (DTCG) ─┐
 *   import/DESIGN.md (Figma) ──┼─> Style Dictionary ─> tokens/tokens.json  (DesignOS model)
 *   import/skill.md (typeui) ──┘   preprocess            tokens/tokens.css   (Tailwind v4, OKLCH)
 *                                  transform             DESIGN.md           (merged guide)
 *                                  format
 *
 * Contract: idempotent and deterministic. Same input bytes -> same output bytes.
 * Nothing in the output depends on time, environment, locale or input key order.
 */

import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import StyleDictionary from 'style-dictionary'

import { hexToOklchCss, isHexColor } from './color.mjs'
import { annotateTokens, PX_CATEGORIES } from './classify.mjs'
import { parseGuides } from './guides.mjs'
import { buildModel, pxToRem } from './model.mjs'
import { renderCss } from './render-css.mjs'
import { renderDesignMd } from './render-md.mjs'

const SD_VERSION = StyleDictionary.VERSION

/** Output paths, relative to product/design-system/. */
export const OUTPUTS = Object.freeze({
  model: 'tokens/tokens.json',
  css: 'tokens/tokens.css',
  designMd: 'DESIGN.md',
})

export const INPUT_FILES = Object.freeze({
  tokens: /^tokens\.json$/i,
  designMd: /^design\.md$/i,
  skillMd: /^skill\.md$/i,
})

const FONT_FALLBACKS = {
  sans: 'ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex')

/** Normalize line endings and a leading BOM so the same content hashes identically on every OS. */
const normalizeText = (text) => text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')

export class TokenImportError extends Error {}

/** Locate input files in the import directory (case-insensitive, unambiguous). */
export function readImportDir(importDir) {
  if (!existsSync(importDir)) throw new TokenImportError(`Import directory not found: ${importDir}`)
  const entries = readdirSync(importDir).sort()
  const find = (re, label, required) => {
    const matches = entries.filter((e) => re.test(e))
    if (matches.length > 1) throw new TokenImportError(`Ambiguous ${label}: ${matches.join(', ')}`)
    if (!matches.length) {
      if (required) throw new TokenImportError(`Missing required input ${label} in ${importDir}`)
      return null
    }
    return { file: matches[0], text: normalizeText(readFileSync(join(importDir, matches[0]), 'utf8')) }
  }
  return {
    tokens: find(INPUT_FILES.tokens, 'tokens.json', true),
    designMd: find(INPUT_FILES.designMd, 'DESIGN.md', false),
    skillMd: find(INPUT_FILES.skillMd, 'skill.md', false),
  }
}

/** Minimal DTCG validation: an object tree that contains at least one `$value`. */
export function parseDtcg(text) {
  let json
  try {
    json = JSON.parse(text)
  } catch (error) {
    throw new TokenImportError(`tokens.json is not valid JSON: ${error.message}`)
  }
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new TokenImportError('tokens.json must contain a JSON object')
  }
  let count = 0
  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    if ('$value' in node) return void count++
    for (const [k, v] of Object.entries(node)) if (!k.startsWith('$')) walk(v)
  }
  walk(json)
  if (!count) throw new TokenImportError('tokens.json contains no DTCG tokens ($value)')
  return json
}

const ds = (token) => token.$extensions?.designos ?? {}

/** Style Dictionary hooks: one preprocessor, four value transforms, three formats. */
function createHooks({ guides, meta }) {
  let model = null
  const getModel = (dictionary) => {
    if (!model) {
      const records = dictionary.allTokens.map((t) => ({
        path: t.path,
        type: t.$type,
        css: t.$value,
        raw: t.original.$value,
        ds: ds(t),
      }))
      model = buildModel({ records, guides, meta })
    }
    return model
  }

  return {
    preprocessors: {
      'designos/annotate': (tokens) => annotateTokens(tokens),
    },
    transforms: {
      'designos/name': {
        type: 'name',
        transform: (token) => token.path.join('.'),
      },
      'designos/color/oklch': {
        type: 'value',
        filter: (token) => token.$type === 'color' && isHexColor(token.$value),
        transform: (token) => hexToOklchCss(token.$value),
      },
      'designos/shadow/css': {
        type: 'value',
        filter: (token) => token.$type === 'shadow',
        transform: (token) => {
          const layers = Array.isArray(token.$value) ? token.$value : [token.$value]
          return layers
            .map((l) => {
              const color = isHexColor(l.color) ? hexToOklchCss(l.color) : l.color
              const px = (v) => (typeof v === 'number' ? `${v}px` : v)
              return `${l.inset ? 'inset ' : ''}${px(l.offsetX)} ${px(l.offsetY)} ${px(l.blur)} ${px(l.spread)} ${color}`
            })
            .join(', ')
        },
      },
      'designos/size/rem': {
        type: 'value',
        filter: (token) => PX_CATEGORIES.has(ds(token).category) && typeof token.$value === 'number',
        transform: (token) =>
          ds(token).category === 'radius' && token.$value >= 9999 ? 'calc(infinity * 1px)' : pxToRem(token.$value),
      },
      'designos/font-family/css': {
        type: 'value',
        filter: (token) => ds(token).category === 'font-family',
        transform: (token) => {
          const families = Array.isArray(token.$value) ? token.$value : [token.$value]
          const quoted = families.map((f) => (/^[a-z-]+$/.test(f) ? f : `"${f}"`)).join(', ')
          const fallback = FONT_FALLBACKS[ds(token).name]
          return fallback ? `${quoted}, ${fallback}` : quoted
        },
      },
    },
    formats: {
      'designos/model-json': ({ dictionary }) => `${JSON.stringify(getModel(dictionary), null, 2)}\n`,
      'designos/tailwind-css': ({ dictionary }) => renderCss(getModel(dictionary)),
      'designos/design-md': ({ dictionary }) => renderDesignMd(getModel(dictionary)),
    },
  }
}

/**
 * Run the full pipeline in memory.
 * @param {{ tokens: {file,text}, designMd?: {file,text}|null, skillMd?: {file,text}|null }} inputs
 * @returns {Promise<{ files: Record<string,string>, model: object }>}
 */
export async function buildFromInputs(inputs) {
  const tokenTree = parseDtcg(inputs.tokens.text)
  const guides = parseGuides({ designMd: inputs.designMd?.text ?? null, skillMd: inputs.skillMd?.text ?? null })
  const meta = {
    styleDictionary: SD_VERSION,
    inputs: [
      ['tokens.json', inputs.tokens],
      ['DESIGN.md', inputs.designMd],
      ['skill.md', inputs.skillMd],
    ]
      .filter(([, input]) => input)
      .map(([file, input]) => ({ file, sha256: sha256(input.text), bytes: Buffer.byteLength(input.text) })),
  }

  const hooks = createHooks({ guides, meta })
  const sd = new StyleDictionary(
    {
      tokens: tokenTree,
      usesDtcg: true,
      log: { verbosity: 'silent', warnings: 'disabled' },
      preprocessors: ['designos/annotate'],
      hooks,
      platforms: {
        designos: {
          transforms: [
            'designos/name',
            'designos/color/oklch',
            'designos/shadow/css',
            'designos/size/rem',
            'designos/font-family/css',
          ],
          files: [
            { destination: OUTPUTS.model, format: 'designos/model-json' },
            { destination: OUTPUTS.css, format: 'designos/tailwind-css' },
            { destination: OUTPUTS.designMd, format: 'designos/design-md' },
          ],
        },
      },
    },
    { verbosity: 'silent' },
  )

  const outputs = await sd.formatPlatform('designos')
  const files = {}
  for (const { output, destination } of outputs) files[destination] = output

  // Formats share the model lazily; parse it back so the caller gets the exact written data.
  return { files, model: JSON.parse(files[OUTPUTS.model]) }
}

export async function buildFromDir(importDir) {
  return buildFromInputs(readImportDir(importDir))
}
