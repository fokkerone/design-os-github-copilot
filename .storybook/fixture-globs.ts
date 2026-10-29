import type { Plugin } from 'vite'

/**
 * Storybook shows the Design OS UI only. The loaders in src/lib read the product (`/product`,
 * `/product-plan`), the wiki and the prototype sources (`/src/sections`, `/src/shell`,
 * `/src/clickdummy`) through `import.meta.glob`. This plugin points every such pattern at the same
 * path under `.storybook/fixtures/` and wraps the result in `fixtureGlob`, which maps the keys back,
 * so the loaders run unchanged on sample data and nothing of the real product is bundled.
 */
export const FIXTURE_ROOT = '/.storybook/fixtures'

/** Glob roots that belong to the product or the prototype, never to the Design OS UI */
export const REDIRECTED_ROOTS = ['/product/', '/product-plan', '/wiki/', '/src/sections/', '/src/shell/', '/src/clickdummy/']

const HELPER = '__designosFixtureGlob'

/** Index of the parenthesis that closes the one at `open`, skipping strings and template literals */
function closingParen(code: string, open: number): number {
  let depth = 0
  for (let i = open; i < code.length; i++) {
    const c = code[i]
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < code.length && code[i] !== c; i++) if (code[i] === '\\') i++
    } else if (c === '(') depth++
    else if (c === ')' && --depth === 0) return i
  }
  return -1
}

/** Rewrites the redirected glob patterns of one module; returns null if it has none */
export function redirectGlobs(code: string): string | null {
  const call = 'import.meta.glob('
  let out = ''
  let last = 0
  let changed = false
  for (let start = code.indexOf(call); start !== -1; start = code.indexOf(call, start + call.length)) {
    const end = closingParen(code, start + call.length - 1)
    if (end === -1) break
    const args = code.slice(start + call.length, end)
    const redirected = args.replace(/(['"])(!?)(\/[^'"]*)\1/g, (literal, quote: string, bang: string, pattern: string) =>
      REDIRECTED_ROOTS.some((root) => pattern.startsWith(root)) ? `${quote}${bang}${FIXTURE_ROOT}${pattern}${quote}` : literal,
    )
    if (redirected === args) continue
    out += `${code.slice(last, start)}${HELPER}(${call}${redirected}))`
    last = end + 1
    changed = true
  }
  if (!changed) return null
  return `import { fixtureGlob as ${HELPER} } from '${FIXTURE_ROOT}/glob.ts'\n${out}${code.slice(last)}`
}

export function fixtureGlobs(): Plugin {
  return {
    name: 'designos:fixture-globs',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0]
      if (!/\/src\/.*\.(tsx?|jsx?)$/.test(file) || file.includes('/node_modules/') || !code.includes('import.meta.glob(')) return
      const result = redirectGlobs(code)
      return result ? { code: result, map: null } : undefined
    },
  }
}
