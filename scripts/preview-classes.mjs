#!/usr/bin/env node
/**
 * Which classes of the prototype render nothing in its own theme. The preview (preview.html)
 * builds Tailwind with the prototype theme (scripts/prototype-theme.mjs: the product's tokens.css
 * or a template). A strict token import resets namespaces (`--color-*: initial`), so a class that
 * works with Tailwind's defaults (`bg-teal-600`, `text-xs`, `rounded-md`) can produce no CSS in the
 * prototype. This lists every such class with the files that use it.
 *
 *   npm run preview:check            the missing classes (exit 1 when there are any)
 *   npm run -s preview:check -- --json
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { __unstable__loadDesignSystem as loadDesignSystem } from 'tailwindcss'
import { resolvePrototypeTheme, THEME_ID } from './prototype-theme.mjs'

export const PROTOTYPE_DIRS = ['src/sections', 'src/shell', 'src/ui', 'src/clickdummy']
const require = createRequire(import.meta.url)

/** Class-like words in the string literals of a source file */
export function candidatesOf(code) {
  const words = new Set()
  for (const m of code.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)) {
    for (const word of (m[1] ?? m[2] ?? m[3]).split(/\s+/)) {
      if (/^!?[a-z@[][\w@:/.[\]%#()=,!-]*$/.test(word) && /[-:[]/.test(word)) words.add(word)
    }
  }
  return words
}

function filesIn(root, dirs) {
  const files = []
  const walk = (dir) => {
    for (const entry of fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full)
    }
  }
  for (const dir of dirs) walk(path.join(root, dir))
  return files.sort()
}

async function designSystem(css, base, themeFile) {
  return loadDesignSystem(css, {
    base,
    async loadStylesheet(id, from) {
      const file = id === 'tailwindcss' ? require.resolve('tailwindcss/index.css') : id === THEME_ID ? themeFile : path.resolve(from, id)
      return { path: file, base: path.dirname(file), content: fs.readFileSync(file, 'utf8') }
    },
  })
}

/** The classes that render with Tailwind's defaults but not with the prototype theme */
export async function missingClasses(root) {
  const slot = resolvePrototypeTheme(root)
  const usage = new Map()
  for (const file of filesIn(root, PROTOTYPE_DIRS)) {
    for (const word of candidatesOf(fs.readFileSync(file, 'utf8'))) {
      if (!usage.has(word)) usage.set(word, [])
      usage.get(word).push(path.relative(root, file).split(path.sep).join('/'))
    }
  }
  const words = [...usage.keys()]
  const defaults = await designSystem('@import "tailwindcss";', root, slot.file)
  const prototype = await designSystem(`@import "tailwindcss";\n@import "${THEME_ID}";`, root, slot.file)
  const inDefault = defaults.candidatesToCss(words)
  const inPrototype = prototype.candidatesToCss(words)
  const missing = words
    .filter((_, i) => inDefault[i] && !inPrototype[i])
    .sort()
    .map((className) => ({ className, files: usage.get(className) }))
  return { theme: path.relative(root, slot.file).split(path.sep).join('/'), source: slot.source, missing }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const root = process.cwd()
  const report = await missingClasses(root)
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(`Prototype theme: ${report.theme} (${report.source})`)
    if (!report.missing.length) console.log('Every class of the prototype renders in its theme.')
    for (const { className, files } of report.missing) console.log(`  ${className}  ${files.join(', ')}`)
    if (report.missing.length) console.log(`\n${report.missing.length} classes render nothing in the prototype theme: use a token of the theme instead.`)
  }
  process.exitCode = report.missing.length ? 1 : 0
}
