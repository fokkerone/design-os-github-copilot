/**
 * The prototype theme slot. `@import "designos:prototype-theme"` in src/preview/preview.css is the
 * one place the prototype gets its look from, so the Design OS UI and the prototype never share a
 * theme:
 *
 * 1. the product's token import, `product/design-system/tokens/tokens.css` (npm run tokens:build),
 * 2. else the template the product names in `product/design-system/template.json`
 *    (`{ "template": "volta" }`), `templates/<id>/theme.css`; without the file: volta.
 *
 * Tailwind resolves CSS imports through Vite's resolver, so the slot is an alias to the file. When
 * the slot points elsewhere (tokens imported, template switched) the dev server restarts; edits to
 * the theme file itself are ordinary CSS updates.
 *
 * `virtual:designos-prototype-fonts` lists the fonts of the slot's template (template.json), for
 * the preview to load. With a token import the preview reads the fonts from the token model.
 */
import fs from 'node:fs'
import path from 'node:path'

export const THEME_ID = 'designos:prototype-theme'
export const FONTS_ID = 'virtual:designos-prototype-fonts'
const RESOLVED_FONTS = `\0${FONTS_ID}`
export const TOKENS_CSS = 'product/design-system/tokens/tokens.css'
export const TEMPLATE_CHOICE = 'product/design-system/template.json'
export const DEFAULT_TEMPLATE = 'volta'
const TEMPLATE_ID = /^[a-z0-9][a-z0-9-]*$/

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

/** The template the product chose, or the default */
export function chosenTemplate(root) {
  const file = path.join(root, TEMPLATE_CHOICE)
  if (!fs.existsSync(file)) return DEFAULT_TEMPLATE
  const id = readJson(file).template
  if (typeof id !== 'string' || !TEMPLATE_ID.test(id)) throw new Error(`${TEMPLATE_CHOICE}: "template" must be a template id like "${DEFAULT_TEMPLATE}"`)
  return id
}

/** The template's manifest (templates/<id>/template.json) */
export function readTemplate(root, id) {
  const dir = path.join(root, 'templates', id)
  const theme = path.join(dir, 'theme.css')
  if (!fs.existsSync(theme)) throw new Error(`Unknown template "${id}": templates/${id}/theme.css not found`)
  const manifest = path.join(dir, 'template.json')
  return { id, theme, ...(fs.existsSync(manifest) ? readJson(manifest) : {}) }
}

/** Which file fills the slot: the token import, else the chosen template's theme */
export function resolvePrototypeTheme(root) {
  const template = readTemplate(root, chosenTemplate(root))
  const tokens = path.join(root, TOKENS_CSS)
  if (fs.existsSync(tokens)) return { source: 'tokens', file: tokens, template }
  return { source: 'template', file: template.theme, template }
}

export default function prototypeTheme() {
  let root = process.cwd()
  let slot = null
  return {
    name: 'designos-prototype-theme',
    config(config) {
      root = path.resolve(config.root ?? process.cwd())
      slot = resolvePrototypeTheme(root)
      return { resolve: { alias: [{ find: THEME_ID, replacement: slot.file }] } }
    },
    configureServer(server) {
      const watched = [TOKENS_CSS, TEMPLATE_CHOICE, 'templates'].map((p) => path.join(root, p))
      const check = (file) => {
        if (!watched.some((w) => file === w || file.startsWith(w + path.sep))) return
        let next
        try {
          next = resolvePrototypeTheme(root)
        } catch (error) {
          server.config.logger.error(`[prototype-theme] ${error.message}`)
          return
        }
        if (next.file === slot?.file && next.template.id === slot?.template.id) return
        server.config.logger.info(`[prototype-theme] ${path.relative(root, next.file)}, restarting`)
        slot = next
        server.restart()
      }
      server.watcher.add(watched)
      for (const event of ['add', 'unlink', 'change']) server.watcher.on(event, check)
    },
    resolveId(id) {
      return id === FONTS_ID ? RESOLVED_FONTS : null
    },
    load(id) {
      if (id !== RESOLVED_FONTS) return null
      return `export default ${JSON.stringify(slot?.template.fonts ?? [])}`
    },
  }
}
