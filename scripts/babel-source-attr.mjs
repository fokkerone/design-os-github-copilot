/**
 * Dev-only Babel plugin for Live Edit: marks every host JSX element (<div>, <span>, ...) of the
 * product UI with where it was written, so a click in the preview leads back to the source.
 *
 *   data-dos-src="src/sections/invoices/components/InvoiceList.tsx:42:7"
 *   data-dos-comp="InvoiceList"
 *
 * Only files below the product folders are touched (screen designs, shell, product UI layer).
 * The Design OS app, tests and the export are left alone: the export copies source files,
 * so the attributes never reach the target codebase.
 */
import path from 'node:path'

export const SOURCE_ATTR = 'data-dos-src'
export const COMPONENT_ATTR = 'data-dos-comp'
export const DEFAULT_INCLUDE = ['src/sections/', 'src/shell/', 'src/ui/']

const isComponentName = (name) => typeof name === 'string' && /^[A-Z]/.test(name)

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
        // Host elements only: components forward props as they like, a DOM node always renders them
        if (node.name.type !== 'JSXIdentifier' || !/^[a-z]/.test(node.name.name)) return
        if (node.attributes.some((a) => a.type === 'JSXAttribute' && a.name.name === SOURCE_ATTR)) return
        const loc = node.loc?.start
        if (!loc) return

        const attrs = [t.jsxAttribute(t.jsxIdentifier(SOURCE_ATTR), t.stringLiteral(`${rel}:${loc.line}:${loc.column + 1}`))]
        const component = enclosingComponent(jsxPath)
        if (component) attrs.push(t.jsxAttribute(t.jsxIdentifier(COMPONENT_ATTR), t.stringLiteral(component)))
        node.attributes.push(...attrs)
      },
    },
  }
}
