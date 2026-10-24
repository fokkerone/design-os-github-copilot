/**
 * Dev-only Babel plugin for Live Edit: marks every host JSX element (<div>, <span>, ...) of the
 * product UI with where it was written, so a click in the preview leads back to the source.
 *
 *   data-dos-src="src/sections/invoices/components/InvoiceList.tsx:42:7"
 *   data-dos-comp="InvoiceList"
 *
 * Component elements (<Button>, <Card.Header>) get their call site, which the component tree
 * reads from the fiber's props (React 19 has no `_debugSource` any more):
 *
 *   data-dos-call="src/sections/invoices/components/InvoiceList.tsx:48:9"
 *   data-dos-name="Card.Header"
 *
 * The name is the one written in the JSX: function names can be renamed by the TypeScript
 * transform (`Button2`) and say nothing about memo() or forwardRef().
 *
 * Only files below the product folders are touched (screen designs, shell, product UI layer).
 * The Design OS app, tests and the export are left alone: the export copies source files,
 * so the attributes never reach the target codebase.
 */
import path from 'node:path'

export const SOURCE_ATTR = 'data-dos-src'
export const COMPONENT_ATTR = 'data-dos-comp'
export const CALL_ATTR = 'data-dos-call'
export const NAME_ATTR = 'data-dos-name'
export const DEFAULT_INCLUDE = ['src/sections/', 'src/shell/', 'src/ui/']

const isComponentName = (name) => typeof name === 'string' && /^[A-Z]/.test(name)

/** "Button", "Card.Header" for component elements; null for host elements and fragments */
function componentElementName(name) {
  if (name.type === 'JSXIdentifier') return isComponentName(name.name) && name.name !== 'Fragment' ? name.name : null
  if (name.type !== 'JSXMemberExpression') return null
  const parts = []
  for (let n = name; n; n = n.type === 'JSXMemberExpression' ? n.object : null) parts.unshift(n.type === 'JSXMemberExpression' ? n.property.name : n.name)
  const full = parts.join('.')
  // React rejects props on fragments other than key
  return full === 'React.Fragment' || !/^[A-Z]/.test(parts.at(-1)) ? null : full
}

const hasAttr = (node, name) => node.attributes.some((a) => a.type === 'JSXAttribute' && a.name.name === name)

/** The name of the React component a JSX element is written in, or null */
function enclosingComponent(jsxPath) {
  let fn = jsxPath.getFunctionParent()
  while (fn) {
    const node = fn.node
    if (node.id?.name && isComponentName(node.id.name)) return node.id.name
    const parent = fn.parentPath?.node
    // const Hero = () => ..., const Hero = forwardRef(() => ...), export default function () {}
    if (parent?.type === 'VariableDeclarator' && isComponentName(parent.id?.name)) return parent.id.name
    if (parent?.type === 'CallExpression') {
      const declarator = fn.parentPath.parentPath?.node
      if (declarator?.type === 'VariableDeclarator' && isComponentName(declarator.id?.name)) return declarator.id.name
    }
    fn = fn.parentPath?.getFunctionParent()
  }
  return null
}

export default function babelSourceAttr({ types: t }, options = {}) {
  const include = options.include ?? DEFAULT_INCLUDE
  return {
    name: 'designos-source-attr',
    visitor: {
      JSXOpeningElement(jsxPath, state) {
        const filename = state.filename ?? state.file?.opts?.filename
        if (!filename) return
        const root = options.root ?? state.file?.opts?.root ?? process.cwd()
        const rel = path.relative(root, filename).split(path.sep).join('/')
        if (!include.some((dir) => rel.startsWith(dir))) return

        const { node } = jsxPath
        const loc = node.loc?.start
        if (!loc) return
        const where = `${rel}:${loc.line}:${loc.column + 1}`

        // Component elements: the call site, read from the fiber's props (they may forward it, harmless)
        const name = componentElementName(node.name)
        if (name) {
          if (!hasAttr(node, CALL_ATTR)) {
            node.attributes.push(t.jsxAttribute(t.jsxIdentifier(CALL_ATTR), t.stringLiteral(where)), t.jsxAttribute(t.jsxIdentifier(NAME_ATTR), t.stringLiteral(name)))
          }
          return
        }
        // Host elements: a DOM node always renders them
        if (node.name.type !== 'JSXIdentifier' || !/^[a-z]/.test(node.name.name)) return
        if (hasAttr(node, SOURCE_ATTR)) return

        const attrs = [t.jsxAttribute(t.jsxIdentifier(SOURCE_ATTR), t.stringLiteral(where))]
        const component = enclosingComponent(jsxPath)
        if (component) attrs.push(t.jsxAttribute(t.jsxIdentifier(COMPONENT_ATTR), t.stringLiteral(component)))
        node.attributes.push(...attrs)
      },
    },
  }
}
