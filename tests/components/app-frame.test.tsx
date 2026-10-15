// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Link, RouterProvider, type RouteObject } from 'react-router-dom'
import { AppFrame, LegacyOrNotFound } from '@/components/app-shell/AppFrame'
import { appRoutes } from '@/lib/routes'
import type { NavFacts } from '@/lib/navigation'

const facts: NavFacts = {
  hasOverview: true, hasRoadmap: true, hasDataShape: false, hasDesignSystem: false, hasShell: false,
  sectionsWithScreenDesigns: 0, hasClickdummy: false, hasExport: false, hasTechstack: false,
  personaCount: 0, flowCount: 0,
}

let chatMounts = 0
let chatUnmounts = 0
function ChatProbe() {
  useEffect(() => {
    chatMounts++
    return () => { chatUnmounts++ }
  }, [])
  return <p>chat probe</p>
}

function Page({ name }: { name: string }) {
  return (
    <div>
      <h1>{name} page</h1>
      <Link to="/techstack">go techstack</Link>
    </div>
  )
}

const routes: RouteObject[] = [
  {
    element: <AppFrame facts={facts} chat={<ChatProbe />} />,
    children: [
      { path: '/prototype/vision', element: <Page name="Vision" /> },
      { path: '/prototype/sections/:id', element: <Page name="Section" /> },
      { path: '/techstack', element: <Page name="Techstack" /> },
      { path: '*', element: <LegacyOrNotFound /> },
    ],
  },
]

const mount = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  chatMounts = 0
  chatUnmounts = 0
  localStorage.clear()
})
afterEach(() => document.documentElement.classList.remove('dark'))

describe('AppFrame', () => {
  it('renders the page in the step panel next to the chat, inside the sidebar shell', () => {
    mount('/prototype/vision')
    const panel = screen.getByRole('complementary', { name: 'Step' })
    expect(panel).toHaveTextContent('Vision page')
    expect(screen.getByText('chat probe')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Vision/ })).toHaveAttribute('aria-current', 'page')
  })

  it('shows the active step as the header title', () => {
    const { container } = render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/techstack'] })} />)
    expect(container.querySelector('header')).toHaveTextContent('Tech Stack')
  })

  it('keeps sidebar and chat mounted when the route changes', async () => {
    mount('/prototype/vision')
    await userEvent.click(screen.getByRole('link', { name: 'go techstack' }))
    expect(screen.getByRole('complementary', { name: 'Step' })).toHaveTextContent('Techstack page')
    expect(screen.getByRole('link', { name: /Tech Stack/ })).toHaveAttribute('aria-current', 'page')
    expect(chatMounts).toBe(1)
    expect(chatUnmounts).toBe(0)
  })

  it('redirects old routes to the new ones, keeping search and hash', async () => {
    const router = mount('/sections/citizen-chat?x=1#top')
    await screen.findByText('Section page')
    expect(router.state.location.pathname).toBe('/prototype/sections/citizen-chat')
    expect(router.state.location.search).toBe('?x=1')
    expect(router.state.location.hash).toBe('#top')
  })

  it('shows a not-found message with a way back for unknown routes', () => {
    mount('/nope')
    expect(screen.getByText(/page not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Vision' })).toHaveAttribute('href', '/prototype/vision')
  })

  it('starts dark, switches the theme and remembers it', async () => {
    const { container } = render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/techstack'] })} />)
    expect(container.firstElementChild).toHaveClass('dark')
    expect(document.documentElement).toHaveClass('dark')
    await userEvent.click(screen.getByRole('button', { name: /switch to light/i }))
    expect(container.firstElementChild).toHaveClass('light')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem('designos:theme')).toBe('light')
  })

  it('restores the stored theme', () => {
    localStorage.setItem('designos:theme', 'light')
    const { container } = render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/techstack'] })} />)
    expect(container.firstElementChild).toHaveClass('light')
  })
})

describe('route table', () => {
  const paths = (rs: RouteObject[]): string[] => rs.flatMap((r) => [r.path ?? '', ...paths(r.children ?? [])])
  const frame = appRoutes.find((r) => !r.path && r.children)!

  it('keeps fullscreen previews outside the shell', () => {
    const outside = appRoutes.filter((r) => r.path).map((r) => r.path!)
    expect(outside).toEqual(
      expect.arrayContaining([
        '/prototype/sections/:sectionId/screen-designs/:screenDesignName/fullscreen',
        '/design-system/shell/fullscreen',
      ]),
    )
    expect(paths(frame.children!).filter((p) => p.endsWith('/fullscreen'))).toEqual([])
  })

  it('serves every area of the main navigation inside the shell', () => {
    const inside = paths(frame.children!)
    for (const p of [
      '/prototype/sections', '/prototype/sections/:sectionId', '/prototype/export',
      '/personas/:personaId', '/flows/:flowId', '/techstack', '/wiki', '/wiki/*', '*',
    ]) {
      expect(inside, p).toContain(p)
    }
  })
})
