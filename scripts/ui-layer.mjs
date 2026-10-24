#!/usr/bin/env node
/**
 * The product UI layer (src/ui/) and who uses it. Design System › Components lists every
 * component of src/ui/, so a primitive a design uses must live there:
 *
 * - screens, shell and clickdummy import primitives only from src/ui/ (relative or `@/ui/…`),
 * - never a primitive library directly (Radix, Base UI, cmdk …) and never `@/components/*`
 *   (the Design OS UI),
 * - variants (`cva()`) are written only in src/ui/: a component with variants is a primitive.
 *
 *   npm run ui:check            the components, where they are used, and every violation (exit 1)
 *   npm run -s ui:check -- --json
 *
 * The component-props plugin serves the usage to the Components page as `usage`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'

export const UI_DIR = 'src/ui'
export const DESIGN_DIRS = ['src/sections', 'src/shell', 'src/clickdummy']

/** Packages that are primitives themselves: a design wraps them in src/ui/ instead of importing them */
const PRIMITIVE_LIBRARY =
  /^(radix-ui|@radix-ui\/.+|@base-ui-components\/.+|@base-ui\/.+|@headlessui\/.+|@ark-ui\/.+|react-aria-components|react-aria|@mui\/.+|@chakra-ui\/.+|@mantine\/.+|antd|vaul|cmdk|sonner|input-otp|embla-carousel-react|react-day-picker|react-resizable-panels)$/

const rel = (root, file) => path.relative(root, file).split(path.sep).join('/')

function filesIn(root, dirs, pattern) {
  const files = []
  const walk = (dir) => {
    for (const entry of fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (pattern.test(entry.name)) files.push(full)
    }
  }
  for (const dir of dirs) walk(path.join(root, dir))
  return files.sort()
}

const parseFile = (file) =>
  parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'], errorRecovery: true })

/** The PascalCase exports of a src/ui/ file: its components */
function exportsOf(ast) {
  const names = []
  for (const node of ast.program.body) {
    if (node.type !== 'ExportNamedDeclaration') continue
    const d = node.declaration
    if (d?.type === 'FunctionDeclaration' && d.id) names.push(d.id.name)
    else if (d?.type === 'VariableDeclaration') for (const v of d.declarations) if (v.id.type === 'Identifier') names.push(v.id.name)
    for (const s of node.specifiers ?? []) if (s.exported.type === 'Identifier') names.push(s.exported.name)
  }
  return names.filter((n) => /^[A-Z]/.test(n))
}

/** The src/ui/ file an import points to, or null */
function uiFileOf(root, from, source) {
  let target
  if (source.startsWith('@/')) target = path.join(root, 'src', source.slice(2))
  else if (source.startsWith('.')) target = path.resolve(path.dirname(from), source)
  else return null
  const r = rel(root, target).replace(/\.(tsx?|jsx?)$/, '')
  if (!r.startsWith(`${UI_DIR}/`)) return null
  return ['.tsx', '.ts'].map((ext) => r + ext).find((f) => fs.existsSync(path.join(root, f))) ?? `${r}.tsx`
}

/**
 * Every component of src/ui/ with the design files that use it, and the imports that bypass
 * the layer: { components: { file: { Name: [user files] } }, problems: [{ file, line, message }] }
 */
export function analyzeUiLayer(root) {
  const components = {}
  const problems = []
  for (const file of filesIn(root, [UI_DIR], /\.tsx$/)) {
    const names = exportsOf(parseFile(file))
    if (names.length) components[rel(root, file)] = Object.fromEntries(names.map((n) => [n, []]))
  }
  for (const file of filesIn(root, DESIGN_DIRS, /\.(tsx|ts)$/)) {
    const ast = parseFile(file)
    const where = rel(root, file)
    for (const node of ast.program.body) {
      if (node.type !== 'ImportDeclaration' || node.importKind === 'type') continue
      const source = node.source.value
      const line = node.loc?.start.line ?? 0
      if (source === '@/components' || source.startsWith('@/components/')) {
        problems.push({ file: where, line, message: `imports ${source}, the Design OS UI: use a primitive from src/ui/` })
        continue
      }
      if (PRIMITIVE_LIBRARY.test(source)) {
        problems.push({ file: where, line, message: `imports ${source} directly: wrap it in src/ui/ and import the wrapper` })
        continue
      }
      if (source === 'class-variance-authority') {
        problems.push({ file: where, line, message: 'defines variants with cva(): a component with variants is a primitive, move it to src/ui/' })
        continue
      }
      const uiFile = uiFileOf(root, file, source)
      if (!uiFile) continue
      for (const s of node.specifiers) {
        if (s.type !== 'ImportSpecifier' || s.importKind === 'type') continue
        const name = s.imported.type === 'Identifier' ? s.imported.name : s.imported.value
        const users = components[uiFile]?.[name]
        if (users && !users.includes(where)) users.push(where)
      }
    }
  }
  return { components, problems }
}

function main() {
  const root = process.cwd()
  const { components, problems } = analyzeUiLayer(root)
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ components, problems }, null, 2))
  } else {
    const entries = Object.entries(components)
    console.log(entries.length ? `UI layer (${UI_DIR}/), listed in Design System › Components:` : `No components in ${UI_DIR}/ yet.`)
    for (const [file, names] of entries) {
      for (const [name, users] of Object.entries(names)) {
        const used = users.length ? `used in ${users.map((u) => path.basename(u)).join(', ')}` : 'not used in a design yet'
        console.log(`  ${name.padEnd(18)} ${file.padEnd(24)} ${used}`)
      }
    }
    if (problems.length) {
      console.log(`\n${problems.length} import(s) bypass the UI layer:`)
      for (const p of problems) console.log(`  ${p.file}:${p.line}  ${p.message}`)
    }
  }
  process.exitCode = problems.length ? 1 : 0
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
