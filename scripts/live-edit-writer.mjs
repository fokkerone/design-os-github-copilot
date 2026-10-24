/**
 * Vite plugin (dev only) for Live Edit: writes prop edits from the inspector straight into the
 * JSX at a component's call site, without the agent. HMR then renders the real source.
 *
 *   POST /__designos/live-edit/props  { "call": "src/sections/a/components/Form.tsx:40:11", "name": "Button", "props": { "size": "sm", "variant": null } }
 *
 * `null` removes a prop. Only the attributes change: the rest of the file keeps its formatting.
 * Only files in the product folders are written, and only for requests from the app itself.
 */
import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'

const traverse = traverseModule.default ?? traverseModule
export const ENDPOINT = '/__designos/live-edit/props'
export const HEADER = 'x-designos-live-edit'
export const DEFAULT_INCLUDE = ['src/ui', 'src/sections', 'src/shell']
const MAX_BODY = 64 * 1024

const jsxName = (n) => (n.type === 'JSXIdentifier' ? n.name : n.type === 'JSXMemberExpression' ? `${jsxName(n.object)}.${n.property.name}` : null)

/** `size="sm"`, `disabled`, `disabled={false}`, `limit={3}`, `title={"say \"hi\""}` */
export function attributeText(name, value) {
  if (value === true) return name
  if (typeof value === 'string') return /["\n{}]/.test(value) ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`
  return `${name}={${JSON.stringify(value)}}`
}

/**
 * The code with the props of the JSX element at line:column (1-based, as data-dos-call has it)
 * set or, for null, removed. Throws when the element is not there (the file changed).
 */
export function setJsxProps(code, line, column, props, name) {
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] })
  let element = null
  traverse(ast, {
    JSXOpeningElement(p) {
      const { start } = p.node.loc
      if (start.line === line && start.column + 1 === column) {
        element = p.node
        p.stop()
      }
    },
  })
  if (!element) throw new Error(`No JSX element at ${line}:${column}`)
  if (name && jsxName(element.name) !== name) throw new Error(`Expected <${name}> at ${line}:${column}, found <${jsxName(element.name)}>`)

  const edits = [] // [start, end, text], applied from the end
  const attrs = element.attributes
  let insertAt = (attrs.at(-1) ?? element.name).end
  let inserts = ''
  for (const [key, value] of Object.entries(props)) {
    if (!/^[A-Za-z_][\w-]*$/.test(key)) throw new Error(`Not a prop name: ${key}`)
    const i = attrs.findIndex((a) => a.type === 'JSXAttribute' && a.name.name === key)
    if (i >= 0) {
      const attr = attrs[i]
      // Removing takes the whitespace before it along
      if (value === null) edits.push([(attrs[i - 1] ?? element.name).end, attr.end, ''])
      else edits.push([attr.start, attr.end, attributeText(key, value)])
    } else if (value !== null) {
      inserts += ` ${attributeText(key, value)}`
    }
  }
  if (inserts) edits.push([insertAt, insertAt, inserts])
  edits.sort((a, b) => b[0] - a[0])
  let out = code
  for (const [start, end, text] of edits) out = out.slice(0, start) + text + out.slice(end)
  return out
}

/** Writes a request into its file; returns the file relative to the root */
export function writeProps(root, include, { call, name, props }) {
  const m = typeof call === 'string' && call.match(/^(.+):(\d+):(\d+)$/)
  if (!m) throw new Error('call must be file:line:column')
  const rel = path.posix.normalize(m[1])
  if (rel.startsWith('..') || path.isAbsolute(rel) || !include.some((dir) => rel.startsWith(`${dir}/`))) throw new Error(`Not a product file: ${rel}`)
  if (!props || typeof props !== 'object') throw new Error('props missing')
  for (const value of Object.values(props)) {
    if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) throw new Error('Only string, number, boolean or null values')
  }
  const file = path.join(root, rel)
  const code = fs.readFileSync(file, 'utf8')
  const next = setJsxProps(code, Number(m[2]), Number(m[3]), props, name)
  if (next !== code) fs.writeFileSync(file, next)
  return rel
}

export default function liveEditWriter(options = {}) {
  const include = options.include ?? DEFAULT_INCLUDE
  return {
    name: 'designos-live-edit-writer',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root
      server.middlewares.use(ENDPOINT, (req, res) => {
        const reply = (status, body) => {
          res.statusCode = status
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(body))
        }
        // The custom header keeps other sites' plain form posts out (they cannot set it without CORS)
        if (req.method !== 'POST' || req.headers[HEADER] !== '1') return reply(405, { error: 'POST from Design OS only' })
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
          if (body.length > MAX_BODY) req.destroy()
        })
        req.on('end', () => {
          try {
            const file = writeProps(root, include, JSON.parse(body))
            reply(200, { ok: true, file })
          } catch (err) {
            reply(400, { error: err instanceof Error ? err.message : String(err) })
          }
        })
      })
    },
  }
}
