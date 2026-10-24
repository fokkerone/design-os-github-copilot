/**
 * Vite plugin: Tailwind's default theme (`tailwindcss/theme.css`) as a string module,
 * `import twTheme from 'virtual:tailwind-theme'`. Live Edit reads it as data to tell which token
 * classes render the token in the prototype (src/lib/live-edit/token-class.ts).
 *
 * Read in Node rather than through `?raw`: the dev server does not serve node_modules outside the
 * root (a worktree links them), and Vitest hands out CSS files empty.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const ID = 'virtual:tailwind-theme'
const RESOLVED = `\0${ID}`

export default function tailwindTheme() {
  const require = createRequire(import.meta.url)
  return {
    name: 'designos-tailwind-theme',
    resolveId(id) {
      return id === ID ? RESOLVED : null
    },
    load(id) {
      if (id !== RESOLVED) return null
      const file = require.resolve('tailwindcss/theme.css')
      this.addWatchFile(file)
      return `export default ${JSON.stringify(readFileSync(file, 'utf8'))}`
    },
  }
}
