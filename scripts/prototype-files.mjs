/**
 * Vite plugin: prototype files as names only. The Design OS UI lists screen designs, shell
 * components and the clickdummy, but never runs them (the preview, preview.html, does). Its
 * loaders glob with `query: '?designos-file'`, and this plugin answers every such import with a
 * stub, so a glob keeps its keys (and its updates when a file is added or removed) without a
 * byte of prototype code in the app bundle.
 *
 * The stub accepts its own updates (a literal `import.meta.hot.accept(`), so editing a screen
 * design updates only the preview, not the Design OS pages that list it.
 */
export const FILE_QUERY = 'designos-file'
const MATCH = new RegExp(`[?&]${FILE_QUERY}(?:&|$)`)

export default function prototypeFiles() {
  return {
    name: 'designos-prototype-files',
    enforce: 'pre',
    load(id) {
      if (!MATCH.test(id)) return null
      return 'export default true\nif (import.meta.hot) import.meta.hot.accept()\n'
    },
  }
}
