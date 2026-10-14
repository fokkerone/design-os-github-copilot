// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '@/components/app-shell/AppShell'
import { buildNavigation, type NavFacts } from '@/lib/navigation'

const facts: NavFacts = {
  hasOverview: false, hasRoadmap: false, hasDataShape: false, hasDesignSystem: false, hasShell: false,
  sectionsWithScreenDesigns: 0, hasClickdummy: false, hasExport: false, hasTechstack: false,
  personaCount: 0, flowCount: 0,
}

function setup(props: Partial<React.ComponentProps<typeof AppShell>> = {}) {
  return render(
    <MemoryRouter initialEntries={['/prototype/vision']}>
      <AppShell navigation={buildNavigation('/prototype/vision', facts)} {...props}>
        <input aria-label="field" />
        <p>page content</p>
      </AppShell>
    </MemoryRouter>,
  )
}

const sidebar = () => screen.getAllByRole('complementary', { hidden: true })[0]

describe('AppShell', () => {
  it('renders navigation, the Design OS name and the content', () => {
    setup()
    expect(screen.getAllByText('Design OS').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Vision' })).toBeInTheDocument()
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('has no workspace menu, mode toggle or whats-new card', () => {
    setup()
    expect(screen.queryByText(/what's new/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/citizen|pro coder/i)).not.toBeInTheDocument()
  })

  it('uses a 238px sidebar and an inset, rounded content panel', () => {
    const { container } = setup()
    expect(sidebar().className).toContain('w-[238px]')
    const main = container.querySelector('main')!
    for (const c of ['md:rounded-lg', 'md:border', 'md:mr-1.5', 'md:mt-1.5']) expect(main.className).toContain(c)
  })

  it('collapses the sidebar with the toggle button and reports it', async () => {
    const onChange = vi.fn()
    setup({ onSidebarCollapsedChange: onChange })
    await userEvent.click(screen.getByRole('button', { name: /hide sidebar/i }))
    expect(sidebar().className).toContain('w-0')
    expect(sidebar()).toHaveAttribute('aria-hidden', 'true')
    expect(onChange).toHaveBeenCalledWith(true)
    await userEvent.click(screen.getByRole('button', { name: /show sidebar/i }))
    expect(sidebar().className).toContain('w-[238px]')
  })

  it('toggles with the [ key', async () => {
    setup()
    await userEvent.keyboard('[[')
    expect(sidebar().className).toContain('w-0')
    await userEvent.keyboard('[[')
    expect(sidebar().className).toContain('w-[238px]')
  })

  it('ignores [ while typing in a field', async () => {
    setup()
    await userEvent.click(screen.getByLabelText('field'))
    await userEvent.keyboard('[[')
    expect(sidebar().className).toContain('w-[238px]')
  })

  it('opens the mobile drawer and closes it after navigating', async () => {
    setup()
    expect(screen.getAllByRole('link', { name: 'Vision' })).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: /open navigation/i }))
    const links = screen.getAllByRole('link', { name: 'Roadmap' })
    expect(links).toHaveLength(2)
    await userEvent.click(links[1])
    expect(screen.getAllByRole('link', { name: 'Roadmap' })).toHaveLength(1)
  })

  it('sets its own dark or light scope and defaults to dark', () => {
    const { container, rerender } = setup()
    expect(container.firstElementChild).toHaveClass('dark')
    rerender(
      <MemoryRouter>
        <AppShell navigation={[]} theme="light">x</AppShell>
      </MemoryRouter>,
    )
    expect(container.firstElementChild).toHaveClass('light')
    expect(container.firstElementChild).not.toHaveClass('dark')
  })

  it('switches the theme from the sidebar footer', async () => {
    const onThemeChange = vi.fn()
    setup({ onThemeChange })
    await userEvent.click(screen.getByRole('button', { name: /switch to light/i }))
    expect(onThemeChange).toHaveBeenCalledWith('light')
  })
})
