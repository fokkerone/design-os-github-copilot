// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { MainNav } from '@/components/app-shell/MainNav'
import { buildNavigation, type NavFacts } from '@/lib/navigation'

const facts: NavFacts = {
  hasOverview: true, hasRoadmap: false, hasDataShape: false, hasDesignSystem: false, hasShell: false,
  sectionsWithScreenDesigns: 0, hasClickdummy: false, hasExport: false, hasTechstack: false,
  personaCount: 2, flowCount: 0,
}

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>
}

function setup(path = '/prototype/roadmap', onNavigate?: (href: string) => void) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MainNav items={buildNavigation(path, facts)} onNavigate={onNavigate} />
      <Where />
    </MemoryRouter>,
  )
}

describe('MainNav', () => {
  it('renders the main entries and the five prototype steps', () => {
    setup()
    for (const label of ['Prototype', 'Vision', 'Roadmap', 'Sections', 'Export', 'Personas', 'User Flows', 'Design System', 'Tech Stack', 'Wiki']) {
      expect(screen.getByRole('link', { name: new RegExp(`^${label}`) }), label).toBeInTheDocument()
    }
  })

  it('marks only the active route with aria-current', () => {
    setup('/prototype/roadmap')
    const current = screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page')
    expect(current.map((l) => l.textContent)).toEqual(['Roadmap'])
  })

  it('collapses and expands the Prototype group', async () => {
    setup('/personas')
    const toggle = screen.getByRole('button', { name: /Prototype/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'Vision' })).not.toBeInTheDocument()
    await userEvent.click(toggle)
    expect(screen.getByRole('link', { name: 'Vision' })).toBeInTheDocument()
  })

  it('navigates on click and reports it', async () => {
    const seen: string[] = []
    setup('/prototype/vision', (h) => seen.push(h))
    await userEvent.click(screen.getByRole('link', { name: 'Tech Stack' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/techstack')
    expect(seen).toEqual(['/techstack'])
  })

  it('shows counts as badges', () => {
    setup()
    expect(within(screen.getByRole('link', { name: /Personas/ })).getByText('2')).toBeInTheDocument()
  })

  it('exposes the step status for completed steps', () => {
    setup('/personas')
    expect(screen.getByRole('link', { name: /Vision/ })).toHaveAttribute('data-status', 'completed')
    expect(screen.getByRole('link', { name: /Roadmap/ })).toHaveAttribute('data-status', 'upcoming')
  })
})
