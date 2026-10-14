// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { VisionPage } from '@/components/VisionPage'
import { RoadmapPage } from '@/components/RoadmapPage'
import { DataShapePage } from '@/components/DataShapePage'
import { TechstackPage } from '@/components/TechstackPage'
import { PersonasPage } from '@/components/PersonasPage'
import { FlowsPage } from '@/components/FlowsPage'
import { DesignPage } from '@/components/DesignPage'
import { ShellDesignPage } from '@/components/ShellDesignPage'
import { ClickdummyPage } from '@/components/ClickdummyPage'
import { PageTabs } from '@/components/PageTabs'

// The repo has no product/ folder, so every page shows its empty state
const at = (path: string, ui: React.ReactNode) => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)

beforeAll(() => {
  window.matchMedia = window.matchMedia ?? ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList)
})

describe('PageTabs', () => {
  it('links the tabs and marks the current one', () => {
    at('/b', <PageTabs label="Pair" tabs={[{ to: '/a', label: 'A' }, { to: '/b', label: 'B' }]} />)
    expect(screen.getByRole('navigation', { name: 'Pair' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('href', '/a')
    expect(screen.getByRole('link', { name: 'B' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'A' })).not.toHaveAttribute('aria-current')
  })
})

describe('step pages (empty project)', () => {
  it('Vision asks to define the product', () => {
    at('/prototype/vision', <VisionPage />)
    expect(screen.getByText('No product defined yet')).toBeInTheDocument()
  })

  it('Roadmap has the Roadmap and Data Shape tabs and shows the empty roadmap', () => {
    at('/prototype/roadmap', <RoadmapPage />)
    expect(screen.getByRole('link', { name: 'Roadmap' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Data Shape' })).toHaveAttribute('href', '/prototype/roadmap/data-shape')
    expect(screen.getByText('No roadmap defined yet')).toBeInTheDocument()
  })

  it('Data Shape offers the way back to the Roadmap tab', () => {
    at('/prototype/roadmap/data-shape', <DataShapePage />)
    expect(screen.getByRole('link', { name: 'Data Shape' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Roadmap' })).toHaveAttribute('href', '/prototype/roadmap')
  })

  it('Tech Stack shows the empty state', () => {
    at('/techstack', <TechstackPage />)
    expect(screen.getByText('No tech stack decided yet')).toBeInTheDocument()
  })

  it('Personas and User Flows are index pages with an empty state', () => {
    const { unmount } = at('/personas', <PersonasPage />)
    expect(screen.getByText(/no personas/i)).toBeInTheDocument()
    unmount()
    at('/flows', <FlowsPage />)
    expect(screen.getByText(/no user flows|no flows/i)).toBeInTheDocument()
  })

  it('Design System has the Tokens and Shell tabs on both pages', () => {
    const { unmount } = at('/design-system', <DesignPage />)
    expect(screen.getByRole('link', { name: 'Tokens' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Shell' })).toHaveAttribute('href', '/design-system/shell')
    unmount()
    at('/design-system/shell', <ShellDesignPage />)
    expect(screen.getByRole('link', { name: 'Shell' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Tokens' })).toHaveAttribute('href', '/design-system')
  })

  it('Prototype preview shows its status without a launch link while nothing is assembled', () => {
    at('/prototype/preview', <ClickdummyPage />)
    expect(screen.queryByRole('link', { name: /launch/i })).not.toBeInTheDocument()
  })
})
