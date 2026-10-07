#!/usr/bin/env node
/**
 * Validate every ```mermaid block in markdown files with the real Mermaid parser.
 *
 * Usage: node scripts/validate-mermaid.mjs [file-or-dir ...]
 * Defaults: product/flows wiki
 * Exit code 1 if any block fails to parse.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

// Mermaid sanitizes labels with DOMPurify, which needs a browser DOM. Parsing
// does not, so stub the hooks before Mermaid loads.
const { default: DOMPurify } = await import('dompurify')
Object.assign(DOMPurify, { addHook() {}, removeHook() {}, removeHooks() {}, sanitize: (s) => s })
const { default: mermaid } = await import('mermaid')

const SKIP_DIRS = new Set(['node_modules', '.git', '.obsidian', '_archives', '_templates'])

function collect(path, files) {
  if (!existsSync(path)) return
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) {
      if (!SKIP_DIRS.has(entry)) collect(join(path, entry), files)
    }
  } else if (path.endsWith('.md')) {
    files.push(path)
  }
}

function mermaidBlocks(text) {
  const blocks = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```mermaid\s*$/.test(lines[i])) {
      const start = i + 1
      let end = start
      while (end < lines.length && !/^\s*```\s*$/.test(lines[end])) end++
      blocks.push({ line: start + 1, source: lines.slice(start, end).join('\n') })
      i = end
    }
  }
  return blocks
}

const targets = process.argv.slice(2)
const files = []
for (const target of targets.length ? targets : ['product/flows', 'wiki']) collect(target, files)

let checked = 0
let failed = 0
for (const file of files) {
  for (const block of mermaidBlocks(readFileSync(file, 'utf8'))) {
    checked++
    try {
      await mermaid.parse(block.source)
    } catch (err) {
      failed++
      const message = (err?.message || String(err)).split('\n').slice(0, 4).join('\n    ')
      console.log(`✗ ${relative(process.cwd(), file)}:${block.line}\n    ${message}`)
    }
  }
}

console.log(`${checked - failed}/${checked} Mermaid diagram(s) valid in ${files.length} file(s)`)
process.exit(failed ? 1 : 0)
