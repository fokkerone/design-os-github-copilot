import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as format from '@/lib/comments/format'
// @ts-expect-error plain ESM script without types
import { applyComment, listComments } from '../scripts/comments-store.mjs'

let root: string
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'comments-'))
  fs.mkdirSync(path.join(root, 'wiki/_templates'), { recursive: true })
  fs.copyFileSync(path.join(__dirname, '../wiki/_templates/comments.md'), path.join(root, 'wiki/_templates/comments.md'))
  fs.writeFileSync(path.join(root, 'wiki/log.md'), '# Wiki Log\n')
})
afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

const login = { kind: 'screen', sectionId: 'account', screenDesignName: 'Login' }
const anchor = { src: 'src/sections/account/components/LoginForm.tsx:40:9', index: 0, x: 42, y: 61 }
const create = (text: string, target = login) =>
  applyComment(root, format, { action: 'create', target, comment: { text, command: 'polish', element: 'LoginForm › button', anchor } }, '2026-10-24')
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')

describe('comments store', () => {
  it('creates the section page from the template, lists it in Home and logs it once', () => {
    const first = create('Make it primary')
    expect(first.comment).toMatchObject({ number: 1, status: 'open', command: 'polish', created: '2026-10-24' })
    create('And bigger')
    const page = read('wiki/comments/account.md')
    expect(page).toContain('title: Comments — Account')
    expect(page).toContain('### #2 · polish · open')
    expect(read('wiki/comments/Home.md')).toContain('[[comments/account]]')
    expect(read('wiki/log.md').match(/comments \| Account/g)).toHaveLength(1)
    expect(listComments(root, format, login).map((c: { number: number }) => c.number)).toEqual([1, 2])
  })

  it('updates text, command and status, and never reuses a deleted number', () => {
    create('One')
    create('Two')
    applyComment(root, format, { action: 'update', target: login, number: 1, patch: { status: 'sent', command: null } })
    applyComment(root, format, { action: 'delete', target: login, number: 2 })
    const { comment } = create('Three')
    expect(comment.number).toBe(3)
    expect(read('wiki/comments/account.md')).toContain('### #1 · comment · sent')
  })

  it('keeps screens apart and writes the shell to its own page', () => {
    create('Login comment')
    create('Profile comment', { ...login, screenDesignName: 'Profile' })
    create('Shell comment', { kind: 'shell' } as never)
    expect(listComments(root, format, { ...login, screenDesignName: 'Profile' })).toHaveLength(1)
    expect(read('wiki/comments/shell.md')).toContain('## Shell')
  })

  it('refuses bad targets, anchors, statuses and unknown comments', () => {
    expect(() => create('x', { ...login, sectionId: '../etc' })).toThrow(/section id/)
    expect(() => applyComment(root, format, { action: 'create', target: login, comment: { text: 'x', command: null, element: '', anchor: { ...anchor, src: '/etc/passwd:1:1' } } })).toThrow(/anchor/)
    create('One')
    expect(() => applyComment(root, format, { action: 'update', target: login, number: 1, patch: { status: 'done' } })).toThrow(/status/)
    expect(() => applyComment(root, format, { action: 'delete', target: login, number: 9 })).toThrow(/#9/)
    expect(() => applyComment(root, format, { action: 'create', target: login, comment: { text: '  ', command: null, element: '', anchor } })).toThrow(/text/)
  })

  it('keeps a heading or a fence in the text from breaking the page', () => {
    create('## Not a screen\n```js\nx\n```')
    const comments = listComments(root, format, login)
    expect(comments).toHaveLength(1)
    expect(comments[0].text).toBe("Not a screen\n'''js\nx\n'''")
  })
})
