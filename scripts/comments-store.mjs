/**
 * Comments on the preview, stored in the wiki (dev server only). One page per section,
 * `wiki/comments/<section-id>.md` and `wiki/comments/shell.md`, in the format of
 * src/lib/comments/format.ts (loaded through Vite, so the page and this endpoint share it).
 *
 *   GET  /__designos/comments?section=<id>&screen=<Name>   (shell: ?shell=1)  -> { comments }
 *   POST /__designos/comments  { action: 'create' | 'update' | 'delete', target, ... } -> { comments, comment? }
 *
 * Requests need the header `x-designos-live-edit: 1`, so a page elsewhere cannot write through
 * the dev server. A new page is listed in `wiki/comments/Home.md` and logged in `wiki/log.md`.
 */
import fs from 'node:fs'
import path from 'node:path'

export const COMMENTS_ENDPOINT = '/__designos/comments'
const FORMAT_MODULE = '/src/lib/comments/format.ts'
const DIR = 'wiki/comments'
const MAX_BODY = 64 * 1024
const MAX_TEXT = 4000
const SECTION = /^[a-z0-9][a-z0-9-]*$/
const COMMAND = /^[a-z][a-z-]*$/

const today = () => new Date().toISOString().slice(0, 10)
const titleOf = (id) => id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

class Refusal extends Error {}
const refuse = (message) => {
  throw new Refusal(message)
}

/** The page and the screen heading a target writes to */
export function locate(target) {
  if (target?.kind === 'shell') return { id: 'shell', title: 'Shell', screen: 'Shell' }
  if (target?.kind !== 'screen') refuse('target must be a screen or the shell')
  const { sectionId, screenDesignName } = target
  if (typeof sectionId !== 'string' || !SECTION.test(sectionId)) refuse('invalid section id')
  if (typeof screenDesignName !== 'string' || !/^[A-Za-z0-9][\w-]*$/.test(screenDesignName)) refuse('invalid screen name')
  return { id: sectionId, title: titleOf(sectionId), screen: screenDesignName }
}

function newHead(root, place, date) {
  const template = path.join(root, 'wiki/_templates/comments.md')
  const text = fs.existsSync(template)
    ? fs.readFileSync(template, 'utf8')
    : `---\ntitle: Comments — {{section-title}}\ntags: [comments]\nsection: {{section-id}}\n---\n\n# Comments — {{section-title}}\n`
  return text
    .replace(/\{\{section-title\}\}/g, place.title)
    .replace(/\{\{section-id\}\}/g, place.id)
    .replace(/\{\{date:YYYY-MM-DD\}\}/g, date)
    .trimEnd()
}

function listInHome(root, place, date) {
  const home = path.join(root, DIR, 'Home.md')
  const row = `| [[comments/${place.id}]] | Comments on the ${place.title} screens | ${date} |`
  if (!fs.existsSync(home)) {
    const text = [
      '---',
      'title: Comments',
      'tags: [index, comments]',
      `updated: ${date}`,
      '---',
      '',
      '# Comments',
      '',
      'Numbered comments on screen designs and the shell, made in the preview (Comment mode), each with an impeccable command and its status. One page per section.',
      '',
      '| Page | Summary | Updated |',
      '|------|---------|---------|',
      row,
      '',
    ].join('\n')
    fs.writeFileSync(home, text)
    return
  }
  const text = fs.readFileSync(home, 'utf8')
  if (!text.includes(`[[comments/${place.id}]]`)) fs.writeFileSync(home, `${text.trimEnd()}\n${row}\n`)
}

function logNewPage(root, place, date) {
  const log = path.join(root, 'wiki/log.md')
  if (!fs.existsSync(log)) return
  fs.appendFileSync(log, `\n## [${date}] comments | ${place.title}\n\n- **Created:** [[comments/${place.id}]] — first comment on the ${place.title} screens\n`)
}

const setUpdated = (head, date) => head.replace(/^updated: .*$/m, `updated: ${date}`)

function checkComment(input, { partial = false } = {}) {
  const out = {}
  if (!partial || 'text' in input) {
    if (typeof input.text !== 'string' || !input.text.trim() || input.text.length > MAX_TEXT) refuse('text must be 1–4000 characters')
    // A heading or a fence in the text would break the page
    out.text = input.text.trim().replace(/^#+ /gm, '').replace(/```/g, "'''")
  }
  if (!partial || 'command' in input) {
    if (input.command !== null && (typeof input.command !== 'string' || !COMMAND.test(input.command))) refuse('invalid command')
    out.command = input.command
  }
  if (partial && 'status' in input) {
    if (!['open', 'sent', 'resolved'].includes(input.status)) refuse('invalid status')
    out.status = input.status
  }
  return out
}

function checkAnchor(anchor) {
  const ok =
    anchor &&
    typeof anchor.src === 'string' &&
    /^src\/[\w./-]+:\d+:\d+$/.test(anchor.src) &&
    Number.isInteger(anchor.index) &&
    anchor.index >= 0 &&
    [anchor.x, anchor.y].every((v) => typeof v === 'number' && v >= 0 && v <= 100)
  if (!ok) refuse('invalid anchor')
  return { src: anchor.src, index: anchor.index, x: anchor.x, y: anchor.y }
}

/** Reads the comments of one screen */
export function listComments(root, format, target) {
  const place = locate(target)
  const file = path.join(root, DIR, `${place.id}.md`)
  if (!fs.existsSync(file)) return []
  return format.parseCommentPage(fs.readFileSync(file, 'utf8')).screens.find((s) => s.name === place.screen)?.comments ?? []
}

/** Creates, updates or deletes one comment; returns the screen's comments afterwards */
export function applyComment(root, format, body, date = today()) {
  const place = locate(body?.target)
  const file = path.join(root, DIR, `${place.id}.md`)
  const exists = fs.existsSync(file)
  const page = exists ? format.parseCommentPage(fs.readFileSync(file, 'utf8')) : { head: newHead(root, place, date), screens: [] }
  let screen = page.screens.find((s) => s.name === place.screen)
  let comment

  if (body.action === 'create') {
    const fields = checkComment(body.comment ?? {})
    if (!screen) {
      screen = { name: place.screen, comments: [], last: 0 }
      page.screens.push(screen)
    }
    comment = {
      number: format.nextNumber(screen),
      command: fields.command,
      status: 'open',
      text: fields.text,
      element: String(body.comment.element ?? '').replace(/\n/g, ' ').slice(0, 200),
      anchor: checkAnchor(body.comment.anchor),
      created: date,
      notes: '',
    }
    screen.comments.push(comment)
  } else if (body.action === 'update' || body.action === 'delete') {
    const at = screen?.comments.findIndex((c) => c.number === body.number) ?? -1
    if (!screen || at < 0) refuse(`no comment #${body.number} on ${place.screen}`)
    if (body.action === 'delete') screen.comments.splice(at, 1)
    else {
      comment = { ...screen.comments[at], ...checkComment(body.patch ?? {}, { partial: true }) }
      screen.comments[at] = comment
    }
  } else refuse('action must be create, update or delete')

  page.head = setUpdated(page.head, date)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, format.serializeCommentPage(page))
  if (!exists) {
    listInHome(root, place, date)
    logNewPage(root, place, date)
  }
  return { comments: screen?.comments ?? [], ...(comment && { comment }) }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) reject(new Refusal('request too large'))
      else chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const send = (res, status, data) => {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(data))
}

export default function commentsStore() {
  let root = process.cwd()
  return {
    name: 'designos-comments-store',
    apply: 'serve',
    configResolved(config) {
      root = config.root
    },
    configureServer(server) {
      server.middlewares.use(COMMENTS_ENDPOINT, async (req, res) => {
        if (req.headers['x-designos-live-edit'] !== '1') return send(res, 405, { error: 'not allowed' })
        try {
          const format = await server.ssrLoadModule(FORMAT_MODULE)
          if (req.method === 'GET') {
            const q = new URL(req.url ?? '', 'http://localhost').searchParams
            const target = q.get('shell') ? { kind: 'shell' } : { kind: 'screen', sectionId: q.get('section'), screenDesignName: q.get('screen') }
            return send(res, 200, { comments: listComments(root, format, target) })
          }
          if (req.method !== 'POST') return send(res, 405, { error: 'not allowed' })
          const body = JSON.parse(await readBody(req))
          return send(res, 200, applyComment(root, format, body))
        } catch (error) {
          if (error instanceof Refusal || error instanceof SyntaxError) return send(res, 400, { error: error.message })
          return send(res, 500, { error: String(error?.message ?? error) })
        }
      })
    },
  }
}
