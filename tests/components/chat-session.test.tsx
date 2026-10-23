// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useOpenCodeStatus } from '@/lib/chat/opencode'
import { OpenCodeClient } from '@/lib/chat/v2/api'
import { useOpenCodeSession } from '@/lib/chat/v2/use-session'
import { FakeOpenCode } from '../helpers/fake-opencode'

let fake: FakeOpenCode
beforeEach(async () => {
  fake = await new FakeOpenCode().start()
})
afterEach(async () => {
  await fake.stop()
})

const noop = () => {}

it('loads what it missed while the server counted as offline, a question among it', async () => {
  fake.reply({ question: [{ question: 'Which scope?', options: [{ label: 'A' }] }], chunks: ['done'], formDelayMs: 300 })
  const client = new OpenCodeClient({ baseUrl: fake.url })
  const { result, rerender } = renderHook(({ online }) => useOpenCodeSession(client, { model: undefined, initialSessionId: undefined, onSessionChange: noop, online }), {
    initialProps: { online: true },
  })
  await waitFor(() => expect(fake.requests).toContain('GET /api/event'))
  await act(() => result.current.send('go'))
  await waitFor(() => expect(result.current.state.messages.some((m) => m.role === 'assistant')).toBe(true))

  // A health check times out while the agent works: the stream closes, the form is created meanwhile
  rerender({ online: false })
  await new Promise((r) => setTimeout(r, 400))
  expect(result.current.state.forms).toEqual([])
  rerender({ online: true })
  await waitFor(() => expect(result.current.state.forms.map((f) => f.fields[0].description)).toEqual(['Which scope?']))
}, 15000)

it('stays online through one missed health check, goes offline after two in a row', async () => {
  const run = async (checks: boolean[]) => {
    const queue = [...checks]
    vi.stubGlobal('fetch', async () => {
      const ok = queue.length ? queue.shift() : checks.at(-1)
      if (!ok) throw new Error('timeout')
      return new Response(JSON.stringify({ version: '2.1.2' }), { headers: { 'content-type': 'application/json' } })
    })
    const seen: string[] = []
    const { result, unmount } = renderHook(() => {
      const status = useOpenCodeStatus('http://x', 10, 2)
      seen.push(status)
      return status
    })
    await waitFor(() => expect(queue).toHaveLength(0))
    await new Promise((r) => setTimeout(r, 30))
    unmount()
    vi.unstubAllGlobals()
    return { seen: [...new Set(seen)], last: result.current }
  }
  expect(await run([true, false, true, true])).toEqual({ seen: ['checking', 'online'], last: 'online' })
  expect((await run([true, false, false])).last).toBe('offline')
})
