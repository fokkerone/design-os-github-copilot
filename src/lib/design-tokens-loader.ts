/**
 * Design token loader.
 *
 * Strict import: the app reads only the generated, normalized model
 * (product/design-system/tokens/tokens.json, schema "designos-tokens/v1").
 * Raw DTCG files in product/design-system/import/ are never read here — run
 * `npm run tokens:build` to (re)generate the model.
 */

import type { DesignTokens } from '@/types/design-tokens'

export const DESIGN_TOKENS_SCHEMA = 'designos-tokens/v1'
const MODEL_PATH = '/product/design-system/tokens/tokens.json'
const GUIDE_PATH = '/product/design-system/DESIGN.md'

const modelFiles = import.meta.glob('/product/design-system/tokens/tokens.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

const guideFiles = import.meta.glob('/product/design-system/DESIGN.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const importFiles = import.meta.glob('/product/design-system/import/*.{json,md}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export type DesignTokensState =
  | { status: 'ok'; tokens: DesignTokens }
  | { status: 'missing'; pendingImport: boolean }
  | { status: 'invalid'; reason: string }

function isDesignTokens(value: unknown): value is DesignTokens {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { $schema?: unknown }).$schema === DESIGN_TOKENS_SCHEMA &&
    typeof (value as { meta?: unknown }).meta === 'object' &&
    typeof (value as { color?: unknown }).color === 'object'
  )
}

/** Load the token model, distinguishing "not imported yet" from "invalid file". */
export function loadDesignTokensState(): DesignTokensState {
  const model = modelFiles[MODEL_PATH]
  if (model === undefined) return { status: 'missing', pendingImport: hasPendingTokenImport() }
  if (!isDesignTokens(model)) {
    const schema = (model as { $schema?: unknown })?.$schema
    return {
      status: 'invalid',
      reason: `Expected schema "${DESIGN_TOKENS_SCHEMA}", found ${schema === undefined ? 'none' : JSON.stringify(schema)}`,
    }
  }
  return { status: 'ok', tokens: model }
}

export function loadDesignTokens(): DesignTokens | null {
  const state = loadDesignTokensState()
  return state.status === 'ok' ? state.tokens : null
}

export function hasDesignTokens(): boolean {
  return loadDesignTokensState().status === 'ok'
}

/** Merged DESIGN.md (generated next to the tokens). */
export function loadDesignGuide(): string | null {
  return guideFiles[GUIDE_PATH] ?? null
}

/** Files waiting in product/design-system/import/ (names only). */
export function getTokenImportFiles(): string[] {
  return Object.keys(importFiles)
    .map((path) => path.replace('/product/design-system/import/', ''))
    .sort()
}

const sha256 = async (text: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Same normalization as the pipeline: strip BOM, LF line endings. */
const normalizeText = (text: string) => text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')

const CANONICAL_INPUTS: Record<string, string> = { 'tokens.json': 'tokens.json', 'design.md': 'DESIGN.md', 'skill.md': 'skill.md' }

/**
 * Compare the import files with the hashes recorded in the model.
 * Returns the inputs that changed, were added or were removed since the last build.
 */
export async function findStaleInputs(tokens: DesignTokens): Promise<string[]> {
  const current = new Map<string, string>()
  for (const [path, text] of Object.entries(importFiles)) {
    const file = CANONICAL_INPUTS[path.replace('/product/design-system/import/', '').toLowerCase()]
    if (file) current.set(file, await sha256(normalizeText(text)))
  }
  const recorded = new Map(tokens.meta.inputs.map((i) => [i.file, i.sha256]))
  const names = [...new Set([...current.keys(), ...recorded.keys()])].sort()
  return names.filter((name) => current.get(name) !== recorded.get(name))
}

/** tokens.json was dropped into import/ but the model was never built. */
export function hasPendingTokenImport(): boolean {
  return getTokenImportFiles().some((file) => file.toLowerCase() === 'tokens.json') && modelFiles[MODEL_PATH] === undefined
}
