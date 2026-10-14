#!/usr/bin/env node
/**
 * Tech stack of the prototype, for the planning commands.
 *
 * Reads product/techstack/techstack.md (written by /design-os:techstack) and prints
 * the decisions every later step has to follow: UI library, icons, packages,
 * registries and repos, constraints. When the file does not exist, the defaults
 * apply (shadcn/ui on React, Tailwind v4 and lucide-react), and the report says so.
 *
 * The parsing is the same module the app uses (src/lib/model/techstack.ts),
 * so the app and the commands always agree.
 *
 *   node scripts/techstack.mjs                 the decisions, one line per area
 *   node scripts/techstack.mjs --json          the same as JSON
 *   node scripts/techstack.mjs --check         validate the file; exit 1 on errors
 *   node scripts/techstack.mjs ... --root <dir>  read another project root (default: current directory)
 *
 * The skill .claude/skills/designos-techstack/SKILL.md says how the commands apply it.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { TECHSTACK_GROUPS, checkTechstack, defaultTechstack, parseTechstack, usesShadcn } from '../src/lib/model/techstack.ts'

export const TECHSTACK_PATH = 'product/techstack/techstack.md'

/** Names in dependencies and devDependencies of the prototype's package.json */
function installedPackages(root) {
  const path = join(root, 'package.json')
  if (!existsSync(path)) return new Set()
  const { dependencies = {}, devDependencies = {} } = JSON.parse(readFileSync(path, 'utf8'))
  return new Set([...Object.keys(dependencies), ...Object.keys(devDependencies)])
}

/** `recharts@2`, `recharts` and `npm i recharts` all name the package `recharts` */
function packageName(entry) {
  return entry.replace(/^(npm|pnpm|yarn|bun)\s+(i|install|add)\s+/, '').replace(/^(@?[^@\s]+).*$/, '$1')
}

export function loadTechstack(root) {
  const path = join(root, TECHSTACK_PATH)
  if (!existsSync(path)) return defaultTechstack()
  const stack = parseTechstack(readFileSync(path, 'utf8'))
  const installed = installedPackages(root)
  // Installation state follows from package.json, so it is computed here and never written to the file
  stack.packages = stack.packages.map((entry) => ({ ...entry, installed: installed.has(packageName(entry.name)) }))
  return stack
}

export function techstackReport(stack) {
  return {
    source: stack.origin === 'file' ? TECHSTACK_PATH : 'default',
    origin: stack.origin,
    status: stack.status,
    updated: stack.updated,
    summary: stack.summary,
    usesShadcn: usesShadcn(stack),
    decisions: stack.resolved.map(({ area, label, group, choice, source, rationale, fixed, decided }) => ({
      area,
      label,
      group,
      choice,
      source,
      rationale,
      fixed,
      decided,
    })),
    undecided: stack.resolved.filter((decision) => !decision.decided).map((decision) => decision.area),
    registries: stack.registries,
    packages: stack.packages,
    constraints: stack.constraints,
    openQuestions: stack.openQuestions,
    problems: checkTechstack(stack),
  }
}

export function formatTechstack(report) {
  const lines = []
  lines.push('# Tech stack', '')
  if (report.origin === 'default') {
    lines.push('Source: none. The tech stack step has not been run, so the defaults apply.')
    lines.push('Tell the user in one line, and mention /design-os:techstack once. Do not insist.', '')
  } else {
    lines.push(`Source: ${report.source}  ·  ${report.status}${report.updated ? `  ·  updated ${report.updated}` : ''}`)
    if (report.summary) lines.push(report.summary)
    lines.push('')
  }

  for (const [group, title] of Object.entries(TECHSTACK_GROUPS)) {
    const rows = report.decisions.filter((decision) => decision.group === group && decision.decided)
    if (!rows.length) continue
    lines.push(`## ${title}`)
    for (const row of rows) {
      lines.push(`- ${row.area}: ${row.choice}  [${row.source}]${row.rationale ? `  ${row.rationale}` : ''}`)
    }
    lines.push('')
  }

  if (report.undecided.length) {
    lines.push(`## Undecided (${report.undecided.length})`)
    lines.push('Add no dependency for these. Use plain React, TypeScript and Tailwind.')
    lines.push(report.undecided.join(', '), '')
  }

  lines.push(`## Packages (${report.packages.length})`)
  if (!report.packages.length) lines.push('None listed.')
  for (const entry of report.packages) {
    lines.push(`- ${entry.name}${entry.area ? ` (${entry.area})` : ''}: ${entry.purpose}  [${entry.installed ? 'installed' : 'not installed yet'}]`)
  }
  lines.push('', `## Registries and repos (${report.registries.length})`)
  if (!report.registries.length) lines.push(report.usesShadcn ? 'Only the official shadcn registry.' : 'None listed.')
  for (const entry of report.registries) {
    lines.push(`- ${entry.name} (${entry.kind || 'other'}): ${entry.location}${entry.usedFor ? `  ·  ${entry.usedFor}` : ''}`)
  }
  if (report.constraints.length) {
    lines.push('', `## Constraints (${report.constraints.length})`)
    for (const constraint of report.constraints) lines.push(`- ${constraint}`)
  }
  if (report.openQuestions.length) {
    lines.push('', `## Open questions (${report.openQuestions.length})`)
    for (const question of report.openQuestions) lines.push(`- ${question}`)
  }
  if (report.problems.length) {
    lines.push('', `## Problems (${report.problems.length})`)
    for (const problem of report.problems) lines.push(`- [${problem.severity}] ${problem.message}`)
  }
  return lines.join('\n')
}

function main(argv) {
  const args = [...argv]
  const take = (flag) => {
    const index = args.indexOf(flag)
    if (index === -1) return null
    const [, value] = args.splice(index, 2)
    if (!value) fail(`${flag} needs a value`)
    return value
  }
  const flag = (name) => {
    const index = args.indexOf(name)
    if (index === -1) return false
    args.splice(index, 1)
    return true
  }

  const json = flag('--json')
  const check = flag('--check')
  const root = resolve(take('--root') ?? process.cwd())
  if (args.length) fail('usage: techstack.mjs [--json] [--check] [--root <dir>]')

  const report = techstackReport(loadTechstack(root))

  if (check) {
    const errors = report.problems.filter((problem) => problem.severity === 'error')
    for (const problem of report.problems) console.log(`[${problem.severity}] ${problem.message}`)
    if (errors.length) process.exit(1)
    console.log(report.origin === 'default' ? `No ${TECHSTACK_PATH}: defaults apply.` : `${TECHSTACK_PATH} is valid.`)
    return
  }

  console.log(json ? JSON.stringify(report, null, 2) : formatTechstack(report))
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2))
