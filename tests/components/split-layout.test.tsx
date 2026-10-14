// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { SplitLayout } from '@/components/app-shell/SplitLayout'

function setup(props: Partial<React.ComponentProps<typeof SplitLayout>> = {}) {
  return render(
    <SplitLayout title="Vision" chat={<p>chat content</p>} {...props}>
      <p>step content</p>
    </SplitLayout>,
  )
}

const chatArea = () => screen.getByText('chat content').closest('[data-pane="chat"]')!

describe('SplitLayout', () => {
  it('shows the title in a 48px header, then chat and step side by side', () => {
    const { container } = setup()
    const header = container.querySelector('header')!
    expect(header).toHaveTextContent('Vision')
    expect(header.className).toContain('h-12')
    expect(container.firstElementChild!.firstElementChild).toBe(header)
    expect(screen.getByText('chat content')).toBeInTheDocument()
    expect(screen.getByText('step content')).toBeInTheDocument()
  })

  it('docks the step panel on the right with a border and 44-46 percent width', () => {
    setup()
    const panel = screen.getByRole('complementary', { name: 'Step' })
    expect(panel.className).toContain('lg:w-[46%]')
    expect(panel.className).toContain('xl:w-[44%]')
    expect(panel.className).toContain('lg:border-l')
  })

  it('hides the step panel and keeps the chat', async () => {
    const onChange = vi.fn()
    setup({ onPanelModeChange: onChange })
    await userEvent.click(screen.getByRole('button', { name: /hide step/i }))
    expect(screen.queryByText('step content')).not.toBeInTheDocument()
    expect(screen.getByText('chat content')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith('hidden')
    await userEvent.click(screen.getByRole('button', { name: /show step/i }))
    expect(screen.getByText('step content')).toBeInTheDocument()
  })

  it('expands the step over the whole area but keeps the chat mounted', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /expand step/i }))
    expect(chatArea().className).toContain('hidden')
    expect(screen.getByText('chat content')).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Step' }).className).toContain('lg:flex-1')
    await userEvent.click(screen.getByRole('button', { name: /collapse step/i }))
    expect(chatArea().className).not.toMatch(/(^|\s)hidden(\s|$)/)
  })

  it('can be controlled', () => {
    setup({ panelMode: 'expanded' })
    expect(chatArea().className).toContain('hidden')
  })

  it('closes the overlay on narrow screens via the backdrop', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Close step' }))
    expect(screen.queryByText('step content')).not.toBeInTheDocument()
  })

  it('shows a chat indicator in the header that pulses while the agent works', () => {
    const { rerender } = setup({ chatActivity: 'idle' })
    const idle = screen.getByRole('button', { name: 'Chat' })
    expect(idle).not.toHaveAttribute('data-busy')
    rerender(
      <SplitLayout title="Vision" chat={<p>chat content</p>} chatActivity="working">
        <p>step content</p>
      </SplitLayout>,
    )
    const busy = screen.getByRole('button', { name: 'Chat, agent is working' })
    expect(busy).toHaveAttribute('data-busy', 'true')
    expect(busy.querySelector('svg')!.getAttribute('class')).toContain('animate-pulse')
    rerender(
      <SplitLayout title="Vision" chat={<p>chat content</p>} chatActivity="waiting">
        <p>step content</p>
      </SplitLayout>,
    )
    expect(screen.getByRole('button', { name: 'Chat, waiting for your answer' })).toHaveAttribute('data-busy', 'true')
  })

  it('brings the chat back from the expanded step with the chat indicator', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /expand step/i }))
    expect(chatArea().className).toContain('hidden')
    await userEvent.click(screen.getByRole('button', { name: 'Chat' }))
    expect(chatArea().className).not.toMatch(/(^|\s)hidden(\s|$)/)
  })

  it('is a no-chat layout when no chat is given', () => {
    render(<SplitLayout title="x"><p>only step</p></SplitLayout>)
    expect(screen.getByText('only step')).toBeInTheDocument()
  })
})

describe('narrow screens', () => {
  const original = window.matchMedia
  const narrow = () => {
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
  }
  afterEach(() => {
    window.matchMedia = original
  })

  it('starts with the chat only, so the step sheet does not cover the page', () => {
    narrow()
    setup()
    expect(screen.queryByText('step content')).not.toBeInTheDocument()
    expect(screen.getByText('chat content')).toBeInTheDocument()
  })

  it('opens the step again with the header button', async () => {
    narrow()
    setup()
    await userEvent.click(screen.getByRole('button', { name: /show step/i }))
    expect(screen.getByText('step content')).toBeInTheDocument()
  })

  it('shows the step when the user navigates to another one', () => {
    narrow()
    const { rerender } = setup({ stepKey: '/a' })
    expect(screen.queryByText('step content')).not.toBeInTheDocument()
    rerender(
      <SplitLayout title="Vision" chat={<p>chat content</p>} stepKey="/b">
        <p>step content</p>
      </SplitLayout>,
    )
    expect(screen.getByText('step content')).toBeInTheDocument()
  })

  it('leaves the mode alone on wide screens when the step changes', async () => {
    const { rerender } = setup({ stepKey: '/a' })
    await userEvent.click(screen.getByRole('button', { name: /hide step/i }))
    rerender(
      <SplitLayout title="Vision" chat={<p>chat content</p>} stepKey="/b">
        <p>step content</p>
      </SplitLayout>,
    )
    expect(screen.queryByText('step content')).not.toBeInTheDocument()
  })
})
