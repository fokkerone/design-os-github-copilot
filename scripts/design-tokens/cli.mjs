#!/usr/bin/env node
/**
 * npm run tokens:build            Import product/design-system/import/ and write outputs
 * npm run tokens:check            Exit 1 if outputs are missing or out of date (writes nothing)
 *
 * Options:
 *   --dir <path>                  Design system directory (default: product/design-system)
 *   --strict                      Exit 1 if the import report contains warnings
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { buildFromDir, TokenImportError } from './pipeline.mjs'

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const option = (name, fallback) => {
  const i = args.indexOf(name)
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback
}

const root = process.cwd()
const designDir = resolve(root, option('--dir', 'product/design-system'))
const importDir = join(designDir, 'import')
const check = flag('--check')
const strict = flag('--strict')

try {
  const { files, model } = await buildFromDir(importDir)

  const changed = []
  for (const [file, content] of Object.entries(files)) {
    const target = join(designDir, file)
    const current = existsSync(target) ? readFileSync(target, 'utf8') : null
    if (current === content) continue
    changed.push(relative(root, target))
    if (!check) {
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, content)
    }
  }

  const { counts } = model.meta
  console.log(`design tokens: ${counts.tokens} tokens -> ${counts.cssVariables} CSS variables, ${counts.documentedOnly} documented only, ${counts.warnings} warnings`)
  for (const issue of model.report.issues.filter((i) => i.severity === 'warning')) {
    console.log(`  warning ${issue.code} (${issue.count}): ${issue.summary}`)
  }

  if (check) {
    if (changed.length) {
      console.error(`Out of date (run npm run tokens:build):\n${changed.map((f) => `  ${f}`).join('\n')}`)
      process.exit(1)
    }
    console.log('Up to date.')
  } else {
    console.log(changed.length ? `Wrote:\n${changed.map((f) => `  ${f}`).join('\n')}` : 'No changes (outputs already up to date).')
  }

  if (strict && counts.warnings > 0) {
    console.error('Strict mode: import report contains warnings.')
    process.exit(1)
  }
} catch (error) {
  if (error instanceof TokenImportError) {
    console.error(`design tokens: ${error.message}`)
    process.exit(2)
  }
  throw error
}
