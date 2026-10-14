// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { InShellContext } from '@/components/app-shell/InShell'

function inShell(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <InShellContext.Provider value>{ui}</InShellContext.Provider>
    </MemoryRouter>,
  )
}

describe('AppLayout inside the app shell', () => {
  it('renders only the page: no phase nav, no own header, no footer', () => {
    const { container } = inShell(<AppLayout>page body</AppLayout>)
    expect(screen.getByText('page body')).toBeInTheDocument()
    expect(container.querySelector('header')).toBeNull()
    expect(screen.queryByText(/powered by design os/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /wiki/i })).not.toBeInTheDocument()
  })

  it('keeps a back link and title for sub-pages', () => {
    inShell(<AppLayout backTo="/prototype/sections" backLabel="Sections" title="Citizen Chat">x</AppLayout>)
    expect(screen.getByRole('link', { name: /Sections/ })).toHaveAttribute('href', '/prototype/sections')
    expect(screen.getByText('Citizen Chat')).toBeInTheDocument()
  })

  it('does not cap the width to the old page width', () => {
    const { container } = inShell(<AppLayout>x</AppLayout>)
    expect(container.innerHTML).not.toContain('max-w-7xl')
    expect(container.innerHTML).not.toContain('max-w-3xl')
  })
})
