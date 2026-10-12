import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { getWikiDomains, getWikiPage, type WikiPage } from '@/lib/wiki-loader'
import type { WikiHeading } from '@/lib/wiki-markdown'

interface WikiLayoutProps {
  children: ReactNode
  /** Path of the page being shown ("" for the wiki overview), used to highlight the navigation */
  currentPath: string
  /** Headings for the table of contents on the right */
  toc?: WikiHeading[]
  /** Passed through to the app header */
  backTo?: string
  backLabel?: string
  title?: string
}

const VAULT_PATHS = ['Home', 'log', '_meta/taxonomy', '_lint-report', '_insights']

const linkBase =
  'block rounded-md px-2 py-1 text-sm leading-snug focus-visible:outline-2 focus-visible:outline-lime-500'
const linkIdle =
  'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/60 dark:hover:text-stone-100'
const linkActive = 'bg-stone-100 font-medium text-stone-900 dark:bg-stone-800 dark:text-stone-100'

function NavLink({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <Link to={to} aria-current={active ? 'page' : undefined} className={`${linkBase} ${active ? linkActive : linkIdle}`}>
      {children}
    </Link>
  )
}

function WikiNav({ currentPath }: { currentPath: string }) {
  const domains = useMemo(() => getWikiDomains(), [])
  const vaultPages = VAULT_PATHS.map((path) => getWikiPage(path)).filter((page): page is WikiPage => page !== null)

  return (
    <nav aria-label="Wiki" className="space-y-5">
      <ul className="space-y-0.5">
        <li>
          <NavLink to="/wiki" active={currentPath === ''}>
            Overview
          </NavLink>
        </li>
        {vaultPages.map((page) => (
          <li key={page.path}>
            <NavLink to={`/wiki/${page.path}`} active={currentPath === page.path}>
              {page.title}
            </NavLink>
          </li>
        ))}
      </ul>

      {domains.map(({ domain, pages }) => {
        const domainHome = getWikiPage(`${domain}/Home`)
        const isCurrent = currentPath.startsWith(`${domain}/`)
        return (
          // Keyed by the current state so the group of the page you are on is open after navigating
          <details key={`${domain}-${isCurrent}`} open={isCurrent} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md px-1 py-1 text-xs font-medium uppercase tracking-wide text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 [&::-webkit-details-marker]:hidden">
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" strokeWidth={2} aria-hidden="true" />
              {domain.replace(/-/g, ' ')}
              <span className="ml-auto font-normal tabular-nums text-stone-400 dark:text-stone-500">{pages.length}</span>
            </summary>
            <ul className="mt-1 space-y-0.5">
              {domainHome && (
                <li>
                  <NavLink to={`/wiki/${domainHome.path}`} active={currentPath === domainHome.path}>
                    Domain index
                  </NavLink>
                </li>
              )}
              {pages.map((page) => (
                <li key={page.path}>
                  <NavLink to={`/wiki/${page.path}`} active={currentPath === page.path}>
                    {page.title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </details>
        )
      })}
    </nav>
  )
}

/** Id of the heading the reader is currently at: the first visible one, else the last one passed */
function useActiveHeading(items: WikiHeading[]): [string | null, (id: string) => void] {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null)
  // Callers may pass a fresh array on every render; only the ids matter
  const idsKey = items.map((item) => item.id).join('|')

  useEffect(() => {
    if (items.length === 0 || typeof IntersectionObserver === 'undefined') return
    const visible = new Set<string>()
    // The band sits below the sticky header and ends at 65% of the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const first = items.find((item) => visible.has(item.id))
        if (first) setActive(first.id)
      },
      { rootMargin: '-80px 0px -65% 0px' }
    )
    for (const item of items) {
      const element = document.getElementById(item.id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- idsKey stands in for items
  }, [idsKey])

  return [active, setActive]
}

function WikiToc({ items, onNavigate }: { items: WikiHeading[]; onNavigate?: () => void }) {
  const [active, setActive] = useActiveHeading(items)

  return (
    <nav aria-label="On this page">
      <ul className="space-y-0.5 border-l border-stone-200 dark:border-stone-800">
        {items.map((item) => {
          const isActive = item.id === active
          return (
            <li key={item.id}>
              <Link
                to={{ hash: `#${item.id}` }}
                replace
                onClick={() => {
                  setActive(item.id)
                  onNavigate?.()
                }}
                aria-current={isActive ? 'location' : undefined}
                className={`-ml-px block border-l-2 py-1 pr-2 text-[13px] leading-snug focus-visible:outline-2 focus-visible:outline-lime-500 ${
                  item.depth > 2 ? 'pl-6' : 'pl-3'
                } ${
                  isActive
                    ? 'border-lime-500 font-medium text-stone-900 dark:text-stone-100'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                }`}
              >
                {item.text}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const detailsSummary =
  'cursor-pointer list-none rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 dark:border-stone-800 dark:text-stone-300 [&::-webkit-details-marker]:hidden'

/**
 * Wiki pages: navigation on the left, content in the middle, table of contents on the right.
 * Below `lg` the navigation folds into a disclosure above the content, below `xl` the table of contents does.
 */
export function WikiLayout({ children, currentPath, toc = [], backTo, backLabel, title }: WikiLayoutProps) {
  const { pathname, hash } = useLocation()
  const [mobileTocOpen, setMobileTocOpen] = useState(false)
  // A new page starts with a fresh table of contents (active heading, scroll observer)
  const tocKey = `${currentPath}|${toc.map((item) => item.id).join('|')}`

  // Following a link opens the next page at the top; a #hash scrolls to its heading
  useEffect(() => {
    const id = hash ? decodeURIComponent(hash.slice(1)) : ''
    const target = id ? document.getElementById(id) : null
    if (target) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return (
    <AppLayout backTo={backTo} backLabel={backLabel} title={title}>
      <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[13rem_minmax(0,1fr)_13rem]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
            <WikiNav currentPath={currentPath} />
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <details className="lg:hidden">
            <summary className={detailsSummary}>Wiki navigation</summary>
            <div className="px-1 py-4">
              <WikiNav currentPath={currentPath} />
            </div>
          </details>

          {toc.length > 0 && (
            <details
              className="xl:hidden"
              open={mobileTocOpen}
              onToggle={(event) => setMobileTocOpen(event.currentTarget.open)}
            >
              <summary className={detailsSummary}>On this page</summary>
              <div className="px-1 py-4">
                <WikiToc key={tocKey} items={toc} onNavigate={() => setMobileTocOpen(false)} />
              </div>
            </details>
          )}

          {children}
        </div>

        {toc.length > 0 && (
          <aside className="hidden xl:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                On this page
              </p>
              <WikiToc key={tocKey} items={toc} />
            </div>
          </aside>
        )}
      </div>
    </AppLayout>
  )
}
