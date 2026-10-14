import { describe, expect, it, vi } from 'vitest'
// @ts-expect-error plain ESM script shared with vite.config.ts
import { ensureOpenCode, serveArgs } from '../scripts/opencode-dev.mjs'

const child = () => {
  const handlers: Record<string, () => void> = {}
  return { killed: false, kill() { this.killed = true }, on: (e: string, h: () => void) => void (handlers[e] = h), unref() {}, stdout: null, stderr: null, handlers }
}

describe('serveArgs', () => {
  it('binds to localhost only', () => {
    expect(serveArgs(4096)).toEqual(['serve', '--port', '4096', '--hostname', '127.0.0.1'])
  })
})

describe('ensureOpenCode', () => {
  it('does not start a second server when one is healthy', async () => {
    const spawn = vi.fn()
    const result = await ensureOpenCode({ port: 4096, cwd: '/p', check: async () => true, spawn })
    expect(spawn).not.toHaveBeenCalled()
    expect(result.started).toBe(false)
  })

  it('starts opencode in the project folder and waits until healthy', async () => {
    const c = child()
    const spawn = vi.fn(() => c)
    let healthy = false
    const check = vi.fn(async () => { const h = healthy; healthy = true; return h })
    const result = await ensureOpenCode({ port: 4096, cwd: '/p', check, spawn, waitMs: 500, pollMs: 1 })
    expect(spawn).toHaveBeenCalledWith('opencode', ['serve', '--port', '4096', '--hostname', '127.0.0.1'], expect.objectContaining({ cwd: '/p' }))
    expect(result.started).toBe(true)
    result.stop()
    expect(c.killed).toBe(true)
  })

  it('reports a missing opencode binary instead of throwing', async () => {
    const c = child()
    const spawn = vi.fn(() => c)
    const p = ensureOpenCode({ port: 4096, cwd: '/p', check: async () => false, spawn, waitMs: 500, pollMs: 1 })
    queueMicrotask(() => (c.handlers.error as unknown as (e: Error) => void)(Object.assign(new Error('spawn opencode ENOENT'), { code: 'ENOENT' })))
    const result = await p
    expect(result.started).toBe(false)
    expect(result.error).toMatch(/not found|ENOENT/i)
  })

  it('gives up when the server never gets healthy', async () => {
    const c = child()
    const result = await ensureOpenCode({ port: 4096, cwd: '/p', check: async () => false, spawn: () => c, waitMs: 20, pollMs: 5 })
    expect(result.started).toBe(false)
    expect(result.error).toMatch(/did not become healthy/i)
    expect(c.killed).toBe(true)
  })
})
