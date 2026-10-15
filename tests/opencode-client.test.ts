import { afterEach, describe, expect, it } from 'vitest'
import { checkOpenCodeHealth, OPENCODE_PROXY_PATH, OPENCODE_START_COMMAND, resolveBaseUrl } from '@/lib/chat/opencode'
import { FakeOpenCode } from './helpers/fake-opencode'

describe('resolveBaseUrl', () => {
  it('makes the proxy path absolute against the page origin (the SDK needs a full URL)', () => {
    expect(resolveBaseUrl('/opencode', 'http://localhost:3000')).toBe('http://localhost:3000/opencode')
  })
  it('keeps absolute URLs and strips a trailing slash', () => {
    expect(resolveBaseUrl('http://127.0.0.1:4096/', 'http://localhost:3000')).toBe('http://127.0.0.1:4096')
  })
  it('defaults to the Vite proxy', () => {
    expect(OPENCODE_PROXY_PATH).toBe('/opencode')
  })
})

describe('checkOpenCodeHealth', () => {
  let fake: FakeOpenCode | undefined
  afterEach(async () => {
    await fake?.stop()
    fake = undefined
  })

  it('is true for a healthy server', async () => {
    fake = await new FakeOpenCode().start()
    expect(await checkOpenCodeHealth(fake.url)).toBe(true)
  })

  it('is false when nothing listens', async () => {
    fake = await new FakeOpenCode().start()
    const url = fake.url
    await fake.stop()
    fake = undefined
    expect(await checkOpenCodeHealth(url)).toBe(false)
  })

  it('is false when the server answers but is not healthy', async () => {
    const res = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status })
    expect(await checkOpenCodeHealth('http://x', res(200, { healthy: false }))).toBe(false)
    expect(await checkOpenCodeHealth('http://x', res(502, {}))).toBe(false)
  })

  it('gives up after the timeout instead of hanging', async () => {
    const hang = (_url: unknown, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))))
    expect(await checkOpenCodeHealth('http://x', hang as typeof fetch, 30)).toBe(false)
  })

  it('names the command that starts the server', () => {
    expect(OPENCODE_START_COMMAND).toBe('opencode serve --port 4096')
  })
})
