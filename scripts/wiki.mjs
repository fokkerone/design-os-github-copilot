#!/usr/bin/env node
/**
 * Bookkeeping for the project brain (wiki/). Each command is one call, so
 * agents never need to chain shell commands.
 *
 *   node scripts/wiki.mjs hash <path>
 *       Content hash of a source: SHA-256 of the body without YAML frontmatter.
 *       Frontmatter is metadata (status, updated, artifacts) and never triggers
 *       a re-ingest.
 *
 *   node scripts/wiki.mjs pending
 *       Lists sources that need an ingest: product/ artifacts that are new or
 *       whose content hash changed, and wiki/raw/ files without a manifest entry.
 *       Also lists flows and personas whose metadata differs from their wiki page
 *       (run sync-meta).
 *
 *   node scripts/wiki.mjs record <path> --type <product|raw|capture>
 *       --disposition <New,Update,Disputed | "No material"> --title "<page title>"
 *       [--created a,b] [--updated c,d] [--note "<text>"]
 *       Appends the manifest entry (content hash, timestamp) and the log entry.
 *
 *   node scripts/wiki.mjs sync-meta <product/flows/<id>.md | product/personas/<id>.md>
 *       Copies flow metadata (status, artifacts, personas) into wiki/flows/<id>.md,
 *       or persona metadata (status, confidence, flows, sections, artifacts) into
 *       wiki/personas/<id>.md, updates the matching columns of the domain Home.md,
 *       and logs one "meta" line. No ingest.
 */

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, appendFileSync } from 'node:fs'
import { join, relative, basename } from 'node:path'

const ROOT = process.cwd()
const WIKI = join(ROOT, 'wiki')
const MANIFEST = join(WIKI, '_manifest.json')
const LOG = join(WIKI, 'log.md')
const today = () => new Date().toISOString().slice(0, 10)
const rel = (p) => relative(ROOT, join(ROOT, p)).split('\\').join('/')

function fail(message) {
  console.error(`wiki: ${message}`)
  process.exit(1)
}

function splitFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  return match ? { frontmatter: match[1], body: text.slice(match[0].length) } : { frontmatter: '', body: text }
}

function contentHash(path) {
  if (!existsSync(path)) fail(`file not found: ${path}`)
  const { body } = splitFrontmatter(readFileSync(path, 'utf8').replace(/\r\n/g, '\n'))
  return createHash('sha256').update(body.trim()).digest('hex')
}

function fmValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:[ \\t]*(.*)$`, 'm'))
  return match ? match[1].trim() : null
}

function setFmValue(text, key, value) {
  const { frontmatter } = splitFrontmatter(text)
  if (!frontmatter) fail('target page has no frontmatter')
  const line = `${key}: ${value}`
  const next = new RegExp(`^${key}:.*$`, 'm').test(frontmatter)
    ? frontmatter.replace(new RegExp(`^${key}:.*$`, 'm'), line)
    : `${frontmatter}\n${line}`
  return text.replace(frontmatter, next)
}

function readManifest() {
  if (!existsSync(MANIFEST)) fail('wiki/_manifest.json not found — run an ingest first to initialize the wiki')
  return JSON.parse(readFileSync(MANIFEST, 'utf8'))
}

function latestEntry(manifest, path) {
  return [...manifest.sources].reverse().find((s) => s.path === path) || null
}

function walk(dir, files = []) {
  if (!existsSync(dir)) return files
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (entry.endsWith('.md')) files.push(full)
  }
  return files
}

function parseFlags(args) {
  const flags = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) flags[args[i].slice(2)] = args[i + 1] ?? ''
    if (args[i].startsWith('--')) i++
  }
  return flags
}

const list = (value) => (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [])
const wikilinks = (pages) => pages.map((p) => `[[${p}]]`).join(', ')

// ── commands ────────────────────────────────────────────────────────────────

function cmdHash(path) {
  if (!path) fail('usage: hash <path>')
  console.log(contentHash(path))
}

// Frontmatter metadata synced from a product/ source to its wiki page, per domain:
// [source key, wiki page key, default, Home.md column]
const META = {
  flows: [
    ['status', 'flow_status', null, 'Status'],
    ['artifacts', 'artifacts', '[]'],
    ['personas', 'personas', '[]'],
  ],
  personas: [
    ['status', 'persona_status', null, 'Status'],
    ['confidence', 'confidence', null, 'Confidence'],
    ['flows', 'flows', '[]'],
    ['sections', 'sections', '[]'],
    ['artifacts', 'artifacts', '[]'],
  ],
}

function metaDomain(sourcePath) {
  const match = rel(sourcePath).match(/^product\/(flows|personas)\/[^/]+\.md$/)
  return match ? match[1] : null
}

function metaDiff(sourcePath) {
  const domain = metaDomain(sourcePath)
  const id = basename(sourcePath, '.md')
  const page = join(WIKI, domain, `${id}.md`)
  if (!existsSync(page)) return null
  const src = splitFrontmatter(readFileSync(sourcePath, 'utf8')).frontmatter
  const dst = splitFrontmatter(readFileSync(page, 'utf8')).frontmatter
  const changes = []
  for (const [srcKey, dstKey, fallback, column] of META[domain]) {
    const value = fmValue(src, srcKey) ?? fallback
    if (value !== null && value !== (fmValue(dst, dstKey) ?? fallback)) changes.push([dstKey, value, column])
  }
  return { domain, id, page, changes }
}

// Sets one cell in the row `| [[<domain>/<id>]] | ...` of a Home.md table, located by header name
function setHomeCell(text, domain, id, column, value) {
  const lines = text.split('\n')
  const rowIndex = lines.findIndex((line) => line.startsWith(`| [[${domain}/${id}]]`))
  if (rowIndex === -1) return text
  let headerIndex = rowIndex
  while (headerIndex > 0 && !/^\|\s*-/.test(lines[headerIndex])) headerIndex--
  const header = lines[headerIndex - 1]?.split('|').map((cell) => cell.trim())
  const col = header?.indexOf(column) ?? -1
  if (col < 1) return text
  const cells = lines[rowIndex].split('|')
  cells[col] = ` ${value} `
  lines[rowIndex] = cells.join('|')
  return lines.join('\n')
}

function cmdPending() {
  const manifest = readManifest()
  const rows = []
  for (const file of walk(join(ROOT, 'product'))) {
    const path = rel(relative(ROOT, file))
    const entry = latestEntry(manifest, path)
    if (!entry) rows.push(['new', path])
    else if (entry.sha256 !== contentHash(file)) rows.push(['changed', path])
  }
  for (const file of walk(join(WIKI, 'raw'))) {
    const path = rel(relative(ROOT, file))
    if (basename(file) === 'README.md') continue
    if (!latestEntry(manifest, path)) rows.push(['new', path])
  }
  for (const domain of Object.keys(META)) {
    for (const file of walk(join(ROOT, 'product', domain))) {
      const diff = metaDiff(relative(ROOT, file))
      if (diff?.changes.length) rows.push(['meta', `${rel(relative(ROOT, file))} (${diff.changes.map((c) => c[0]).join(', ')})`])
    }
  }
  if (!rows.length) return console.log('Nothing pending: every source is compiled and in sync.')
  for (const [kind, path] of rows) console.log(`${kind.padEnd(8)} ${path}`)
  console.log(`\n${rows.length} pending. new/changed → /design-os:wiki-ingest · meta → npm run -s wiki -- sync-meta <path>`)
}

function cmdRecord(path, flags) {
  if (!path) fail('usage: record <path> --type <type> --disposition <...> --title "<title>"')
  const type = flags.type
  const disposition = list(flags.disposition)
  const title = flags.title
  if (!['product', 'raw', 'capture'].includes(type)) fail('--type must be product, raw or capture')
  if (!disposition.length) fail('--disposition is required')
  if (!title && !disposition.includes('No material')) fail('--title is required')
  const created = list(flags.created)
  const updated = list(flags.updated)
  const manifest = readManifest()
  const date = today()
  const slug = basename(path, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '')
  const baseId = `${date}-${slug}`
  const taken = new Set(manifest.sources.map((s) => s.id))
  let id = baseId
  for (let n = 2; taken.has(id); n++) id = `${baseId}-${n}`

  manifest.sources.push({
    id,
    type,
    path: rel(path),
    sha256: contentHash(path),
    ingested_at: new Date().toISOString(),
    disposition,
    pages_created: created,
    pages_updated: updated,
  })
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')

  const lines = disposition.includes('No material')
    ? [`## [${date}] ingest | no material: ${rel(path)}`, '', '- **Disposition:** No material']
    : [
        `## [${date}] ingest | ${title}`,
        '',
        `- **Source:** \`${rel(path)}\` (${type})`,
        `- **Disposition:** ${disposition.join('; ')}`,
        ...(created.length ? [`- **Created:** ${wikilinks(created)}`] : []),
        ...(updated.length ? [`- **Updated:** ${wikilinks(updated)}${flags.note ? ` (${flags.note})` : ''}`] : []),
        ...(!updated.length && flags.note ? [`- **Note:** ${flags.note}`] : []),
      ]
  appendFileSync(LOG, `\n${lines.join('\n')}\n`)
  console.log(`Recorded ${id}: manifest + log updated`)
}

function cmdSyncMeta(sourcePath) {
  if (!sourcePath || !metaDomain(sourcePath)) fail('usage: sync-meta product/flows/<flow-id>.md | product/personas/<persona-id>.md')
  if (!existsSync(sourcePath)) fail(`file not found: ${sourcePath}`)
  const diff = metaDiff(sourcePath)
  if (!diff) fail(`no wiki page for this ${metaDomain(sourcePath).slice(0, -1)} yet — ingest it first`)
  if (!diff.changes.length) return console.log('Metadata already in sync.')

  let page = readFileSync(diff.page, 'utf8')
  for (const [key, value] of diff.changes) page = setFmValue(page, key, value)
  writeFileSync(diff.page, page)

  const home = join(WIKI, diff.domain, 'Home.md')
  const columns = diff.changes.filter(([, , column]) => column)
  if (columns.length && existsSync(home)) {
    let text = readFileSync(home, 'utf8')
    for (const [, value, column] of columns) text = setHomeCell(text, diff.domain, diff.id, column, value)
    writeFileSync(home, text)
  }

  const summary = diff.changes.map(([key, value]) => `${key} → ${value}`).join(', ')
  appendFileSync(LOG, `\n## [${today()}] meta | ${diff.id}: ${summary}\n`)
  console.log(`Synced ${diff.id}: ${summary}`)
}

const [command, target, ...rest] = process.argv.slice(2)
switch (command) {
  case 'hash': cmdHash(target); break
  case 'pending': cmdPending(); break
  case 'record': cmdRecord(target, parseFlags(rest)); break
  case 'sync-meta': cmdSyncMeta(target); break
  default:
    fail('usage: wiki.mjs <hash|pending|record|sync-meta> — see the header of scripts/wiki.mjs')
}
