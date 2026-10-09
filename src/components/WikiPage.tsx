import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Search } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Input } from '@/components/ui/input'
import { getWikiDomains, getWikiLog, getWikiPage, hasWikiContent, type WikiPage as WikiPageData } from '@/lib/wiki-loader'

const LOG_KIND_STYLES: Record<string, string> = {
  ingest: 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
  meta: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  lint: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
}

function matches(page: WikiPageData, query: string): boolean {
  if (!query) return true
  const haystack = [page.title, page.summary, page.path, ...page.tags].join(' ').toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((term) => haystack.includes(term))
}

function PageRow({ page }: { page: WikiPageData }) {
  const fm = page.frontmatter
  const rawStatus = fm.flow_status ?? fm.persona_status
  const status = typeof rawStatus === 'string' ? rawStatus : null
  return (
    <li>
      <Link
        to={`/wiki/${page.path}`}
        className="group block rounded-md -mx-3 px-3 py-3 hover:bg-stone-100 dark:hover:bg-stone-800/60 focus-visible:outline-2 focus-visible:outline-lime-500"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium text-stone-900 dark:text-stone-100 underline decoration-transparent decoration-2 underline-offset-2 group-hover:decoration-lime-500">
            {page.title}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-stone-400 dark:text-stone-500">{page.updated}</span>
        </div>
        {page.summary && (
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{page.summary}</p>
        )}
        {(status || page.tags.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {status && (
              <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300">
                {status}
              </span>
            )}
            {page.tags.map((tag) => (
              <span key={tag} className="text-xs text-stone-500 dark:text-stone-400">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </li>
  )
}

export function WikiPage() {
  const [query, setQuery] = useState('')
  const domains = useMemo(() => getWikiDomains(), [])
  const log = useMemo(() => getWikiLog().slice(0, 8), [])
  const vaultPages = ['Home', 'log', '_meta/taxonomy', '_lint-report', '_insights']
    .map((path) => getWikiPage(path))
    .filter((page): page is WikiPageData => page !== null)

  const filtered = domains
    .map(({ domain, pages }) => ({ domain, pages: pages.filter((page) => matches(page, query)) }))
    .filter(({ pages }) => pages.length > 0)

  return (
    <AppLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-2">Project brain</h1>
          <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
            Decisions, user flows and research, compiled from your planning files. To edit pages or browse the
            graph, open the <code className="font-mono text-sm">wiki/</code> folder in Obsidian.
          </p>
        </div>

        {!hasWikiContent() ? (
          <div className="rounded-lg border border-dashed border-stone-300 dark:border-stone-700 px-6 py-10 text-center">
            <BookOpen className="w-6 h-6 mx-auto text-stone-400" strokeWidth={1.5} />
            <p className="mt-3 font-medium text-stone-900 dark:text-stone-100">The wiki has no pages yet</p>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Compile your planning files with <code className="font-mono">/design-os:wiki-ingest --product</code>, or
              design a flow with <code className="font-mono">/design-os:userflow</code>.
            </p>
            <Link
              to="/wiki/how-to/Home"
              className="mt-4 inline-block text-sm text-stone-900 dark:text-stone-100 underline decoration-lime-500 decoration-2 underline-offset-2"
            >
              Read the How To guides
            </Link>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" strokeWidth={1.5} />
              <Input
                id="wiki-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search titles, summaries and tags"
                aria-label="Search the wiki"
                className="pl-9"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-stone-600 dark:text-stone-400">
                No pages match “{query}”. Try a tag such as <span className="font-medium">flows</span> or a section name.
              </p>
            ) : (
              filtered.map(({ domain, pages }) => {
                const domainHome = getWikiPage(`${domain}/Home`)
                return (
                  <section key={domain} aria-labelledby={`domain-${domain}`}>
                    <div className="flex items-baseline justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-2">
                      <h2 id={`domain-${domain}`} className="text-lg font-semibold text-stone-900 dark:text-stone-100 capitalize">
                        {domain.replace(/-/g, ' ')}
                        <span className="ml-2 text-sm font-normal text-stone-400 dark:text-stone-500">{pages.length}</span>
                      </h2>
                      {domainHome && (
                        <Link to={`/wiki/${domainHome.path}`} className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
                          Domain index
                        </Link>
                      )}
                    </div>
                    <ul className="mt-1">
                      {pages.map((page) => (
                        <PageRow key={page.path} page={page} />
                      ))}
                    </ul>
                  </section>
                )
              })
            )}
          </>
        )}

        {log.length > 0 && (
          <section aria-labelledby="wiki-activity">
            <h2 id="wiki-activity" className="text-lg font-semibold text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
              Recent activity
            </h2>
            <ol className="mt-3 space-y-2">
              {log.map((entry, index) => (
                <li key={index} className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-baseline gap-3 text-sm">
                  <span className="tabular-nums text-stone-400 dark:text-stone-500">{entry.date}</span>
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${LOG_KIND_STYLES[entry.kind] || LOG_KIND_STYLES.meta}`}>
                    {entry.kind}
                  </span>
                  <span className="text-stone-700 dark:text-stone-300 break-words">{entry.text}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {vaultPages.length > 0 && (
          <nav aria-label="Vault pages" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {vaultPages.map((page) => (
              <Link key={page.path} to={`/wiki/${page.path}`} className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
                {page.title}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </AppLayout>
  )
}
