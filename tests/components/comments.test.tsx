// @vitest-environment jsdom
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { CommentButton } from '@/components/live-edit/CommentButton'
import { useLiveComments } from '@/components/live-edit/useLiveComments'
import { LiveEditContext, type LiveEditContextValue } from '@/lib/live-edit/live-edit-context'
import type { DesignComment } from '@/lib/comments/format'

const comment: DesignComment = {
  number: 1,
  command: 'polish',
  status: 'open',
  text: 'Make it primary',
  element: '<Button> in LoginForm',
  anchor: { src: 'src/ui/button.tsx:30:10', index: 0, x: 50, y: 50 },
  created: '2026-10-24',
  notes: '',
}
const target = { kind: 'screen', sectionId: 'account', screenDesignName: 'Login' } as const

afterEach(() => vi.unstubAllGlobals())

describe('CommentButton', () => {
  it('toggles comment mode, counts open comments and offers resolved ones while on', async () => {
    const onToggle = vi.fn()
    const onShowResolved = vi.fn()
    const { rerender } = render(<CommentButton active={false} onToggle={onToggle} open={2} showResolved={false} onShowResolved={onShowResolved} />)
    expect(screen.getByLabelText('2 open')).toBeInTheDocument()
    expect(screen.queryByLabelText('Show resolved comments')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /comment/i }))
    expect(onToggle).toHaveBeenCalled()
    rerender(<CommentButton active onToggle={onToggle} open={2} showResolved={false} onShowResolved={onShowResolved} />)
    await userEvent.click(screen.getByLabelText('Show resolved comments'))
    expect(onShowResolved).toHaveBeenCalledWith(true)
  })
})

describe('useLiveComments', () => {
  it('loads the screen comments, sends one to the chat and marks it sent', async () => {
    const calls: { method: string; body?: unknown }[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = init.body ? JSON.parse(init.body as string) : undefined
        calls.push({ method: init.method ?? 'GET', body })
        const comments = body?.action === 'update' ? [{ ...comment, status: 'sent' }] : [comment]
        return new Response(JSON.stringify({ comments }), { status: 200 })
      }),
    )
    const frame = { postMessage: vi.fn() } as unknown as Window
    const iframeRef = { current: { contentWindow: frame } as HTMLIFrameElement }
    const sendMessage = vi.fn()
    const live = { sendMessage } as unknown as LiveEditContextValue
    const wrapper = ({ children }: { children: ReactNode }) => <LiveEditContext.Provider value={live}>{children}</LiveEditContext.Provider>
    const { result } = renderHook(() => useLiveComments(iframeRef, target), { wrapper })

    await waitFor(() => expect(result.current?.comments).toHaveLength(1))
    expect(frame.postMessage).toHaveBeenCalledWith({ type: 'dos:comments', items: [comment], showResolved: false }, window.location.origin)

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', { source: frame, origin: window.location.origin, data: { type: 'dos:comment-send', number: 1, element: null, call: 'src/sections/account/components/LoginForm.tsx:40:9' } }),
      )
    })
    await waitFor(() => expect(result.current?.comments[0].status).toBe('sent'))
    expect(sendMessage.mock.calls[0][0]).toContain('```design-comment')
    expect(sendMessage.mock.calls[0][0]).toContain('command: /impeccable polish')
    expect(calls.at(-1)?.body).toMatchObject({ action: 'update', number: 1, patch: { status: 'sent' }, target })
    expect(result.current?.open).toBe(1)
  })
})
