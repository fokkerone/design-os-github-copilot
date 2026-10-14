// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('is a no-chat layout when no chat is given', () => {
    render(<SplitLayout title="x"><p>only step</p></SplitLayout>)
    expect(screen.getByText('only step')).toBeInTheDocument()
  })
})
