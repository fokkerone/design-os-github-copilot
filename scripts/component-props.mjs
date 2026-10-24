/**
 * Vite plugin for Live Edit: the props of the product's components as data,
 * `import componentProps from 'virtual:component-props'`. The inspector shows them as fields for
 * a component picked in the component tree, also the props the call site does not set.
 *
 * Read with the TypeScript compiler from each component's props type, without React's DOM
 * attributes (`@types/react`):
 * - a union of strings becomes a choice (`variant: "bar" | "tabs"`, cva() variants),
 * - boolean, string and number become fields, anything else (objects, functions) is shown only,
 * - the default comes from the parameter list (`size = "default"`) or cva() `defaultVariants`.
 * Props a library declares (Radix: `asChild`, `orientation`) are kept when they are a choice or
 * a boolean, marked with the package; their other props would bury the component's own.
 *
 *   { "src/ui/button.tsx": { "Button": [{ "name": "size", "kind": "choice", "options": ["default", "sm"], "default": "default", "optional": true }] } }
 */
import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'
import ts from 'typescript'
import { analyzeUiLayer, DESIGN_DIRS } from './ui-layer.mjs'

const traverse = traverseModule.default ?? traverseModule
const ID = 'virtual:component-props'
const RESOLVED = `\0${ID}`
export const DEFAULT_INCLUDE = ['src/ui', 'src/sections', 'src/shell']
// Declared there: DOM attributes and styles every element has, not the component's own props
const DOM_TYPES = /node_modules\/(@types\/react|csstype)\//

const keyName = (node) => (node.type === 'Identifier' ? node.name : node.type === 'StringLiteral' || node.type === 'NumericLiteral' || node.type === 'BooleanLiteral' ? String(node.value) : null)
const objectProp = (obj, name) => obj?.properties.find((p) => p.type === 'ObjectProperty' && keyName(p.key) === name)?.value

/** The cva() variants of every component in one file (options and defaults), read with Babel */
export function readVariants(code) {
  if (!code.includes('cva(')) return {}
  let ast
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] })
  } catch {
    return {}
  }
  // cva configs by the name they are stored under
  const configs = new Map()
  traverse(ast, {
    VariableDeclarator(p) {
      const { id, init } = p.node
      if (id.type !== 'Identifier' || init?.type !== 'CallExpression' || init.callee.type !== 'Identifier' || init.callee.name !== 'cva') return
      const options = init.arguments[1]?.type === 'ObjectExpression' ? init.arguments[1] : null
      const variants = objectProp(options, 'variants')
      const defaults = objectProp(options, 'defaultVariants')
      const props = {}
      for (const v of variants?.type === 'ObjectExpression' ? variants.properties : []) {
        const name = v.type === 'ObjectProperty' ? keyName(v.key) : null
        if (!name || v.value.type !== 'ObjectExpression') continue
        const values = v.value.properties.map((o) => (o.type === 'ObjectProperty' ? keyName(o.key) : null)).filter(Boolean)
        const fallback = defaults?.type === 'ObjectExpression' ? objectProp(defaults, name) : null
        props[name] = { options: values, ...(fallback && keyName(fallback) !== null && { default: keyName(fallback) }) }
      }
      configs.set(id.name, props)
    },
  })
  if (configs.size === 0) return {}

  // Components that call one of them: function Button() { … buttonVariants(…) … }, const Badge = (…) => …
  const out = {}
  const componentName = (p) => {
    if (p.node.id?.name) return p.node.id.name
    const parent = p.parentPath?.node
    if (parent?.type === 'VariableDeclarator' && parent.id.type === 'Identifier') return parent.id.name
    const declarator = p.parentPath?.parentPath?.node
    return declarator?.type === 'VariableDeclarator' && declarator.id.type === 'Identifier' ? declarator.id.name : null
  }
  traverse(ast, {
    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(p) {
      const name = componentName(p)
      if (!name || !/^[A-Z]/.test(name)) return
      p.traverse({
        CallExpression(c) {
          const callee = c.node.callee
          if (callee.type === 'Identifier' && configs.has(callee.name)) out[name] = { ...out[name], ...configs.get(callee.name) }
        },
      })
    },
  })
  return out
}

function filesIn(root, include) {
  const files = []
  const walk = (dir) => {
    for (const entry of fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.tsx$/.test(entry.name)) files.push(full)
    }
  }
  for (const dir of include) walk(path.join(root, dir))
  return files
}

function compilerOptions(root) {
  const file = ['tsconfig.app.json', 'tsconfig.json'].map((f) => path.join(root, f)).find((f) => fs.existsSync(f))
  if (!file) {
    return { jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ES2022 }
  }
  const { config } = ts.readConfigFile(file, ts.sys.readFile)
  return { ...ts.parseJsonConfigFileContent(config, ts.sys, root).options, noEmit: true }
}

/** The function a component is: function Button(), const Card = () => …, forwardRef((p, r) => …), memo(…) */
function componentFunction(decl) {
  if (!decl) return null
  if (ts.isFunctionDeclaration(decl) || ts.isFunctionExpression(decl) || ts.isArrowFunction(decl)) return decl
  if (ts.isVariableDeclaration(decl) && decl.initializer) {
    let init = decl.initializer
    while (ts.isCallExpression(init) && init.arguments[0]) init = init.arguments[0]
    return ts.isFunctionExpression(init) || ts.isArrowFunction(init) ? init : null
  }
  return null
}

/** Literal defaults from the parameter list: ({ size = "default", inset = false }) */
function parameterDefaults(fn) {
  const out = {}
  const param = fn?.parameters[0]
  if (!param || !ts.isObjectBindingPattern(param.name)) return out
  for (const el of param.name.elements) {
    const name = el.propertyName?.getText() ?? (ts.isIdentifier(el.name) ? el.name.text : null)
    const init = el.initializer
    if (!name || !init) continue
    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) out[name] = init.text
    else if (ts.isNumericLiteral(init)) out[name] = Number(init.text)
    else if (init.kind === ts.SyntaxKind.TrueKeyword) out[name] = true
    else if (init.kind === ts.SyntaxKind.FalseKeyword) out[name] = false
  }
  return out
}

/** What field a prop type becomes */
function describeType(checker, type) {
  const t = checker.getNonNullableType(type)
  const parts = t.isUnion() ? t.types : [t]
  if (parts.every((p) => p.flags & ts.TypeFlags.BooleanLiteral) || t.flags & ts.TypeFlags.Boolean) return { kind: 'boolean' }
  if (parts.length > 1 && parts.every((p) => p.isStringLiteral())) return { kind: 'choice', options: parts.map((p) => p.value) }
  if (t.isStringLiteral()) return { kind: 'choice', options: [t.value] }
  if (t.flags & ts.TypeFlags.String) return { kind: 'string' }
  if (t.flags & ts.TypeFlags.Number) return { kind: 'number' }
  return { kind: 'readonly', type: checker.typeToString(t).slice(0, 80) }
}

/** The options in the order they are written: the union in the declaration, else the cva() variants */
function writtenOrder(prop, cvaOptions) {
  const node = prop.declarations?.[0]?.type
  if (node && ts.isUnionTypeNode(node)) {
    const literals = node.types.filter(ts.isLiteralTypeNode).map((t) => t.literal).filter(ts.isStringLiteral).map((l) => l.text)
    if (literals.length) return literals
  }
  return cvaOptions
}

const packageOf = (file) => {
  const rest = file.split('node_modules/').pop().split('/')
  return rest[0].startsWith('@') ? `${rest[0]}/${rest[1]}` : rest[0]
}

/** Every component's props, keyed by file (relative to the root) and component name */
export function collectProps(root, include = DEFAULT_INCLUDE, oldProgram) {
  const files = filesIn(root, include)
  const program = ts.createProgram(files, compilerOptions(root), undefined, oldProgram)
  const checker = program.getTypeChecker()
  const all = {}
  for (const file of files) {
    const sf = program.getSourceFile(file)
    const mod = sf && checker.getSymbolAtLocation(sf)
    if (!mod) continue
    const rel = path.relative(root, file).split(path.sep).join('/')
    const cva = readVariants(sf.text)
    for (const exported of checker.getExportsOfModule(mod)) {
      const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
      const decl = symbol.valueDeclaration
      if (!decl || !/^[A-Z]/.test(exported.name)) continue
      const signature = checker.getTypeOfSymbolAtLocation(symbol, decl).getCallSignatures()[0]
      const param = signature?.getParameters()[0]
      if (!param) continue
      const propsType = checker.getTypeOfSymbolAtLocation(param, decl)
      const defaults = { ...parameterDefaults(componentFunction(decl)) }
      const variants = cva[symbol.name] ?? cva[exported.name] ?? {}
      for (const [name, v] of Object.entries(variants)) if (v.default !== undefined && !(name in defaults)) defaults[name] = v.default
      const props = []
      for (const prop of propsType.getProperties()) {
        if (prop.name === 'children' || prop.name === 'className' || prop.name === 'key' || prop.name === 'ref') continue
        const from = prop.declarations?.[0]?.getSourceFile().fileName ?? ''
        if (DOM_TYPES.test(from)) continue
        const field = describeType(checker, checker.getTypeOfSymbolAtLocation(prop, decl))
        const order = field.options && writtenOrder(prop, variants[prop.name]?.options)
        if (order) field.options = [...order.filter((o) => field.options.includes(o)), ...field.options.filter((o) => !order.includes(o))]
        const library = from.includes('node_modules/') ? packageOf(from) : null
        if (library && field.kind !== 'choice' && field.kind !== 'boolean') continue
        props.push({
          name: prop.name,
          ...field,
          optional: !!(prop.flags & ts.SymbolFlags.Optional),
          ...(prop.name in defaults && { default: defaults[prop.name] }),
          ...(library && { from: library }),
        })
      }
      // The component's own props first, then the library's
      props.sort((a, b) => Number(!!a.from) - Number(!!b.from))
      // Also without props of their own, so the UI layer lists every component
      ;(all[rel] ??= {})[exported.name] = props
    }
  }
  return { props: all, program }
}

export default function componentProps(options = {}) {
  let root = process.cwd()
  const include = options.include ?? DEFAULT_INCLUDE
  let program
  return {
    name: 'designos-component-props',
    configResolved(config) {
      root = config.root
    },
    resolveId(id) {
      return id === ID ? RESOLVED : null
    },
    load(id) {
      if (id !== RESOLVED) return null
      for (const file of filesIn(root, include)) this.addWatchFile(file)
      const result = collectProps(root, include, program)
      program = result.program
      for (const file of filesIn(root, DESIGN_DIRS)) this.addWatchFile(file)
      // Where each component of src/ui/ is used, for Design System › Components
      const usage = analyzeUiLayer(root).components
      return `export default ${JSON.stringify(result.props)}\nexport const usage = ${JSON.stringify(usage)}`
    },
    // A changed component file can change its props: update the inspector with it
    handleHotUpdate({ file, server, modules }) {
      const rel = path.relative(root, file).split(path.sep).join('/')
      if (![...include, ...DESIGN_DIRS].some((dir) => rel.startsWith(`${dir}/`))) return
      const mod = server.moduleGraph.getModuleById(RESOLVED)
      if (!mod) return
      server.moduleGraph.invalidateModule(mod)
      return [...modules, mod]
    },
  }
}
