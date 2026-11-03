// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PenpotSyncPanel } from '@/components/penpot/PenpotSyncPanel'
import type { ConnectionState, PenpotClient, PenpotStatus } from '@/lib/penpot/client'

const link = { fileId: 'f', teamId: 't', name: 'Design OS', url: 'http://p/' }
const statusOf = (state: ConnectionState, withLink = true): PenpotStatus => ({
  configured: { key: true, token: true },
  link: withLink ? link : null,
  sections: [],
  penpotUrl: 'http://p',
  connection: { state },
})
const clientWith = (next: () => PenpotStatus) => {
  const status = vi.fn(async () => next())
  const client: PenpotClient = { status, createFile: async () => link, run: async () => {} }
  return { client, status }
}
const tick = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))
const syncTokens = () => screen.getByRole('button', { name: 'Sync tokens' }) as HTMLButtonElement

describe('Penpot panel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('enables the sync buttons by itself once the tab is connected', async () => {
    let state: ConnectionState = 'not-connected'
    const { client } = clientWith(() => statusOf(state))
    render(<PenpotSyncPanel client={client} />)
    await tick(0)
    expect(syncTokens().disabled).toBe(true)
    state = 'connected'
    await tick(5000)
    expect(syncTokens().disabled).toBe(false)
  })

  it('stops asking once connected and rechecks when the window gets focus', async () => {
    const { client, status } = clientWith(() => statusOf('connected'))
    render(<PenpotSyncPanel client={client} />)
    await tick(30_000)
    expect(status).toHaveBeenCalledTimes(1)
    fireEvent.focus(window)
    await tick(0)
    expect(status).toHaveBeenCalledTimes(2)
  })

  it('runs all three syncs from one button and shows real progress', async () => {
    const { client } = clientWith(() => statusOf('connected'))
    const steps: ((event: { step: string; message: string; percent?: number }) => void)[] = []
    let finish = () => {}
    const run = vi.fn((_action: unknown, onEvent: (typeof steps)[number]) => {
      steps.push(onEvent)
      return new Promise<void>((resolve) => {
        finish = resolve
      })
    })
    render(<PenpotSyncPanel client={{ ...client, run }} />)
    await tick(0)
    fireEvent.click(screen.getByRole('button', { name: 'Sync' }))
    await tick(0)
    expect(run.mock.calls[0][0]).toEqual({ action: 'all' })
    act(() => steps[0]({ step: 'components', message: 'Components: 12/36 ui/Button', percent: 42 }))
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('42')
    expect(screen.getByText('42%')).toBeTruthy()
    expect(screen.getByText('Components: 12/36 ui/Button')).toBeTruthy()
    finish()
    await tick(0)
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('does not ask while there is no file to connect to', async () => {
    const { client, status } = clientWith(() => statusOf('not-connected', false))
    render(<PenpotSyncPanel client={client} />)
    await tick(30_000)
    expect(status).toHaveBeenCalledTimes(1)
  })
})
