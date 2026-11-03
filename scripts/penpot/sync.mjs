/**
 * The Penpot sync: capture → tokens → components → sections → verify. Section sync always runs
 * tokens and components first. One way only, code to Penpot: tokens and components are updated in
 * place, section boards are rebuilt on every run.
 */
import fs from 'node:fs'
import path from 'node:path'
import { captureScreen, knownComponents, listSections, openBrowser, VARIANTS } from './capture.mjs'
import { chunkOps, createBuilder, variantProperties } from './design-tree.mjs'
import { connectMcp } from './mcp-client.mjs'
import { rpc } from './rpc.mjs'
import { buildTokens, createResolver } from './token-map.mjs'
import { comparePixels } from './verify.mjs'

export const LINK_FILE = 'product/penpot/penpot.json'
const COMPONENT_PAGE = 'Components'
const TOKEN_CHUNK = 250

/** Each run's share per phase, by how long the phases take. Phases follow each other, so the percentage only rises */
const PHASES = {
  tokens: { tokens: 1 },
  components: { tokens: 0.1, capture: 0.3, components: 0.6 },
  sections: { tokens: 0.05, capture: 0.15, components: 0.4, sections: 0.4 },
}

function createProgress(action, log) {
  const shares = PHASES[action] ?? PHASES.sections
  let passed = 0
  return (phase, total) => {
    const start = passed
    const share = shares[phase]
    passed += share
    let done = 0
    return (message, step = phase) => {
      const percent = Math.floor((start + (share * done) / Math.max(total, 1)) * 100)
      done = Math.min(done + 1, total)
      log({ step, message, percent })
    }
  }
}

const TAB_LOST = /suspended|No Penpot instance/

const cleanError = (e) => String(e?.message ?? e).replace(/^Error handling task: /, '').replace(/^\[PENPOT PLUGIN\] /, '')

/** What the panel shows when a run stops: where, why, and that nothing is lost */
function stoppedError(e, step) {
  const reason = /suspended/.test(String(e?.message ?? e))
    ? 'The browser suspended the Penpot tab. Click into it and keep it visible.'
    : /No Penpot instance/.test(String(e?.message ?? e))
      ? 'The Penpot tab is no longer connected. Choose File › MCP Server › Connect in it.'
      : cleanError(e)
  return new Error(`Stopped at "${step}": ${reason} What is finished stays in the file; Sync continues from there.`)
}

export function readEnv(root) {
  const env = { ...process.env }
  const file = path.join(root, '.env.local')
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^(PENPOT_[A-Z_]+)=(.*)$/)
      if (m) env[m[1]] = m[2].trim()
    }
  }
  return { url: env.PENPOT_URL || 'http://localhost:9001', key: env.PENPOT_MCP_KEY || '', token: env.PENPOT_ACCESS_TOKEN || '' }
}

export function readLink(root) {
  const file = path.join(root, LINK_FILE)
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null
}

export function writeLink(root, link) {
  const file = path.join(root, LINK_FILE)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(link, null, 2)}\n`)
}

const fileUrl = (url, teamId, fileId, pageId) => `${url.replace(/\/$/, '')}/#/workspace?team-id=${teamId}&file-id=${fileId}${pageId ? `&page-id=${pageId}` : ''}`

/**
 * Whether Penpot says the linked file is gone (deleted, or out of this token's reach: Penpot answers
 * both the same way). Anything else, like Penpot being down, keeps the link: only that answer counts.
 */
async function linkIsGone(link, env, rpcCall) {
  if (!link?.fileId || !env.token) return false
  try {
    await rpcCall({ url: env.url, token: env.token, timeoutMs: 8000 }, 'get-file-summary', { id: link.fileId })
    return false
  } catch (e) {
    return e?.code === 'object-not-found'
  }
}

/** Step 0: the file itself. The Plugin API cannot create one, so this uses the RPC API */
export async function createFile({ root, name, env = readEnv(root), rpcCall = rpc }) {
  const current = readLink(root)
  if (current?.fileId && !(await linkIsGone(current, env, rpcCall))) throw new Error('This project is already linked to a Penpot file.')
  if (!env.token) throw new Error('PENPOT_ACCESS_TOKEN is missing in .env.local.')
  const auth = { url: env.url, token: env.token }
  const teams = await rpcCall(auth, 'get-teams')
  const team = teams.find((t) => t.isDefault) ?? teams[0]
  const projects = await rpcCall(auth, 'get-projects', { teamId: team.id })
  const project = projects.find((p) => p.isDefault) ?? projects[0]
  const file = await rpcCall(auth, 'create-file', { name, projectId: project.id })
  const link = { fileId: file.id, teamId: team.id, projectId: project.id, name: file.name, url: fileUrl(env.url, team.id, file.id, file.data?.pages?.[0]) }
  writeLink(root, link)
  return link
}

/** Refuses to write into any file but the linked one */
export function assertLinkedFile(connected, link) {
  if (!link?.fileId) throw new Error('No Penpot file yet. Create the file first.')
  if (connected?.id !== link.fileId) throw new Error(`The connected Penpot tab shows "${connected?.name ?? 'nothing'}", not the linked file "${link.name}". Open the linked file and connect it.`)
}

async function install(mcp, root) {
  const runtime = fs.readFileSync(path.join(root, 'scripts/penpot/runtime.js'), 'utf8')
  await mcp.execute(`storage.dos = ${runtime.trim().replace(/;$/, '')}; return true`)
}

const call = (mcp, method, ...args) => mcp.execute(`return await storage.dos.${method}(...${JSON.stringify(args)})`, 300_000)

export async function status({ root, env = readEnv(root), connect = connectMcp, rpcCall = rpc }) {
  const stored = readLink(root)
  const gone = await linkIsGone(stored, env, rpcCall)
  const link = gone ? null : stored
  const base = { configured: { key: !!env.key, token: !!env.token }, link, ...(gone ? { goneFile: stored.name } : {}), sections: listSections(root).map((s) => ({ id: s.id, screens: s.screens })), penpotUrl: env.url }
  if (!env.key) return { ...base, connection: { state: 'no-key' } }
  let mcp
  try {
    mcp = await connect({ url: env.url, key: env.key })
    const file = await mcp.execute('return { id: penpot.currentFile.id, name: penpot.currentFile.name }', 8000)
    return { ...base, connection: { state: link?.fileId && file.id !== link.fileId ? 'wrong-file' : 'connected', file } }
  } catch (e) {
    const message = String(e?.message ?? e)
    return { ...base, connection: { state: /No Penpot instance/.test(message) ? 'not-connected' : 'error', message: message.slice(0, 240) } }
  } finally {
    await mcp?.close().catch(() => {})
  }
}

async function syncTokens(mcp, tokens, phase) {
  const totals = { created: 0, updated: 0, same: 0, failed: [] }
  const tick = phase('tokens', tokens.sets.reduce((sum, set) => sum + Math.ceil(set.tokens.length / TOKEN_CHUNK), 0))
  for (const set of tokens.sets) {
    for (let i = 0; i < set.tokens.length; i += TOKEN_CHUNK) {
      const part = set.tokens.slice(i, i + TOKEN_CHUNK)
      const r = await call(mcp, 'upsertTokens', [{ name: set.name, tokens: part }])
      totals.created += r.created
      totals.updated += r.updated
      totals.same += r.same
      totals.failed.push(...r.failed)
      tick(`Tokens: ${set.name} ${Math.min(i + TOKEN_CHUNK, set.tokens.length)}/${set.tokens.length}`)
    }
  }
  return totals
}

async function captureAll(root, baseUrl, sections, log) {
  const browser = await openBrowser()
  const known = knownComponents(root)
  const out = []
  try {
    for (const section of sections) {
      for (const screen of section.screens) {
        for (const variant of VARIANTS) {
          log(`Capturing ${section.id}/${screen} ${variant.viewport} ${variant.mode}`)
          out.push({ section: section.id, screen, variant, data: await captureScreen(browser, baseUrl, section.id, screen, variant, known, root) })
        }
      }
    }
  } finally {
    await browser.close()
  }
  return out
}

async function syncComponents(mcp, mains, phase) {
  await call(mcp, 'page', COMPONENT_PAGE)
  await call(mcp, 'clearUnfinished')
  const existing = new Set(await call(mcp, 'existingKeys'))
  const fresh = mains.filter((m) => !existing.has(m.key))
  const groups = variantProperties(mains)
  const variantFailures = []
  const tick = phase('components', fresh.length + groups.filter((g) => g.members.length > 1).length)
  const start = await call(mcp, 'layoutStart')
  let x = start.x
  let y = start.y
  let rowHeight = 0
  for (const [i, spec] of fresh.entries()) {
    if (x + spec.w > 3000) {
      x = start.x
      y += rowHeight + 80
      rowHeight = 0
    }
    tick(`Components: ${i + 1}/${fresh.length} ${spec.tier}/${spec.name}`)
    const { kids, ...head } = spec
    await call(mcp, 'startMain', head, x, y)
    for (const chunk of chunkOps(kids)) await call(mcp, 'appendMain', chunk, head)
    await call(mcp, 'finishMain', head)
    x += spec.w + 80
    rowHeight = Math.max(rowHeight, spec.h)
  }
  // One call per component: the server ends a task after 120 seconds
  for (const group of groups) {
    if (group.members.length < 2) continue
    tick(`Components: variants of ${group.name}`)
    // A group is tidiness on top of working components, so one that fails does not end the run
    await call(mcp, 'variants', [group]).catch((e) => {
      if (TAB_LOST.test(String(e?.message ?? e))) throw e
      variantFailures.push({ name: group.name, message: cleanError(e) })
    })
  }
  const removed = await call(mcp, 'removeStale', mains.map((m) => m.key))
  return { total: mains.length, created: fresh.length, unchanged: mains.length - fresh.length, removed, variantFailures, groups: groups.map((g) => ({ name: g.name, variants: g.members.length })) }
}

async function syncSection(mcp, sectionId, boards, tick) {
  const page = await call(mcp, 'page', `Section: ${sectionId}`)
  await call(mcp, 'clearBoards')
  const start = await call(mcp, 'layoutStart')
  const columns = new Map()
  const screens = [...new Set(boards.map((b) => b.screen))]
  let y = start.y
  const results = []
  for (const screen of screens) {
    let x = start.x
    let rowHeight = 0
    for (const board of boards.filter((b) => b.screen === screen)) {
      const name = `${screen} / ${board.variant.viewport} / ${board.variant.mode}`
      tick(`Building ${sectionId}: ${name}`, 'section')
      const w = board.data.size.w
      const h = board.data.size.h
      const id = await call(mcp, 'startBoard', { name, id: `${sectionId}/${name}`, x, y, w, h, fills: board.fills, tokens: board.tokens })
      for (const chunk of chunkOps(board.ops)) await call(mcp, 'appendBoard', chunk)
      results.push({ ...board, id, name, w, h })
      x += w + 120
      rowHeight = Math.max(rowHeight, h)
    }
    y += rowHeight + 200
    columns.set(screen, y)
  }
  return { page, boards: results }
}

function dataUrlToBuffer(content) {
  const image = (content ?? []).find((c) => c.type === 'image')
  return image ? Buffer.from(image.data, 'base64') : null
}

async function verifyBoards(mcp, boards, tick, diffDir) {
  const out = []
  for (const b of boards) {
    tick(`Checking ${b.name}`, 'verify')
    const measured = await call(mcp, 'measure', b.id)
    const entry = { board: b.name, section: b.section, size: { expected: [b.w, b.h], actual: [measured.w, measured.h] } }
    const expected = b.ops
    entry.offsets = measured.shapes.flatMap((s, i) => {
      const op = expected[i]
      if (!op) return []
      const dx = Math.abs(s.x - op.x)
      const dy = Math.abs(s.y - op.y)
      const dw = op.t === 'text' ? 0 : Math.abs(s.w - op.w)
      const dh = op.t === 'text' ? 0 : Math.abs(s.h - op.h)
      return Math.max(dx, dy, dw, dh) > 0.5 ? [{ name: s.name, dx: +dx.toFixed(2), dy: +dy.toFixed(2), dw: +dw.toFixed(2), dh: +dh.toFixed(2) }] : []
    })
    entry.instances = measured.shapes.filter((s) => s.instance).length
    entry.shapes = measured.shapes.length
    const shot = await mcp.callTool('export_shape', { shapeId: b.id, format: 'png', mode: 'shape' }, 180_000)
    const png = dataUrlToBuffer(shot.content)
    if (png) {
      const { diffPng, ...pixels } = comparePixels(b.data.screenshot, png, b.data.tree)
      entry.pixels = pixels
      if (diffDir) {
        const safe = b.name.replace(/[^a-zA-Z0-9-]+/g, '_')
        fs.mkdirSync(diffDir, { recursive: true })
        fs.writeFileSync(path.join(diffDir, `${b.section}_${safe}.penpot.png`), png)
        fs.writeFileSync(path.join(diffDir, `${b.section}_${safe}.web.png`), b.data.screenshot)
        if (diffPng) fs.writeFileSync(path.join(diffDir, `${b.section}_${safe}.diff.png`), diffPng)
      }
    } else entry.pixels = { error: 'export returned no image' }
    out.push(entry)
  }
  return out
}

/**
 * action: 'tokens' | 'components' | 'section' (sectionId) | 'all'.
 * Always in order: tokens, components, then the sections asked for.
 */
export async function runSync({ root, baseUrl, action, sectionId, log: emit = () => {}, env = readEnv(root), connect = connectMcp, capture = captureAll, diffDir }) {
  const link = readLink(root)
  let lastStep = null
  const log = (event) => {
    lastStep = event.message
    emit(event)
  }
  if (!env.key) throw new Error('PENPOT_MCP_KEY is missing in .env.local.')
  const mcp = await connect({ url: env.url, key: env.key })
  try {
    const connected = await mcp.execute('return { id: penpot.currentFile.id, name: penpot.currentFile.name }', 8000)
    assertLinkedFile(connected, link)
    await install(mcp, root)

    const model = JSON.parse(fs.readFileSync(path.join(root, 'product/design-system/tokens/tokens.json'), 'utf8'))
    const tokens = buildTokens(model)
    const report = { action, at: new Date().toISOString(), tokens: null, skippedTokens: tokens.skipped }
    const phase = createProgress(action === 'section' || action === 'all' ? 'sections' : action, log)
    report.tokens = await syncTokens(mcp, tokens, phase)
    if (action === 'tokens') return finish(root, link, report, log)

    const all = listSections(root)
    const resolver = createResolver(tokens.sets)
    const builder = createBuilder(resolver)
    const captureTick = phase('capture', all.reduce((sum, s) => sum + s.screens.length, 0) * VARIANTS.length)
    const captures = await capture(root, baseUrl, all, (message) => captureTick(message))
    const boards = captures.map((c) => {
      const where = `${c.section}/${c.screen}`
      return { ...c, ...builder.screen(c.data, { viewport: c.variant.viewport, mode: c.variant.mode, where }) }
    })
    report.unsupported = [...new Map(captures.flatMap((c) => c.data.unsupported).map((u) => [`${u.kind}:${u.where}`, u])).values()]
    report.components = await syncComponents(mcp, builder.mains(), phase)
    report.tokenViolations = resolver.violations()
    if (action === 'components') return finish(root, link, report, log)

    const targets = action === 'all' ? all.map((s) => s.id) : [sectionId]
    if (action === 'section' && !all.some((s) => s.id === sectionId)) throw new Error(`Unknown section: ${sectionId}`)
    const built = []
    // Every board is built and then checked
    const tick = phase('sections', boards.filter((b) => targets.includes(b.section)).length * 2)
    for (const id of targets) {
      const { boards: list } = await syncSection(mcp, id, boards.filter((b) => b.section === id), tick)
      for (const b of await verifyBoards(mcp, list, tick, diffDir)) built.push(b)
    }
    report.boards = built
    report.missing = await call(mcp, 'missing')
    return finish(root, link, report, log)
  } catch (e) {
    throw lastStep ? stoppedError(e, lastStep) : e
  } finally {
    await mcp.close().catch(() => {})
  }
}

function finish(root, link, report, log) {
  writeLink(root, { ...link, lastSync: report })
  log({ step: 'done', message: 'Done', percent: 100, report })
  return report
}
