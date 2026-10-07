import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { WikiMarkdown } from '@/components/WikiMarkdown'
import { getWikiPage, type FrontmatterValue } from '@/lib/wiki-loader'

function list(value: FrontmatterValue | undefined): string[] {
  if (Array.isArray(value)) return value
  return typeof value === 'string' && value ? [value] : []
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2 text-sm">
      <dt className="text-stone-500 dark:text-stone-400">{label}</dt>
      <dd className="text-stone-800 dark:text-stone-200 min-w-0 break-words">{children}</dd>
    </div>
  )
}

export function WikiArticlePage() {
  const path = useParams()['*'] || 'Home'
  const page = getWikiPage(path)

  // Following a wikilink opens the next page at the top, not at the previous scroll position
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  if (!page) {
    return (
      <AppLayout backTo="/wiki" backLabel="Wiki" title="Page not found">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">Page not found</h1>
          <p className="text-stone-600 dark:text-stone-400">
            There is no page at <code className="font-mono text-sm">wiki/{path}.md</code>. It may have been renamed
            or not compiled yet.
          </p>
          <Link to="/wiki" className="inline-block text-sm text-stone-900 dark:text-stone-100 underline decoration-lime-500 decoration-2 underline-offset-2">
            Back to the wiki
          </Link>
        </div>
      </AppLayout>
    )
  }

  const fm = page.frontmatter
  const status = typeof fm.flow_status === 'string' ? fm.flow_status : null
  const sections = list(fm.sections)
  const sources = list(fm.sources)
  const artifacts = list(fm.artifacts)
  const domainHome = page.domain && !page.isIndex ? getWikiPage(`${page.domain}/Home`) : null
  // The page title is shown above; drop the duplicate H1 from the body
  const body = page.body.replace(/^\s*#\s+.+\n/, '')

  return (
    <AppLayout backTo="/wiki" backLabel="Wiki" title={page.title}>
      <article className="space-y-8">
        <header className="space-y-2">
          {domainHome ? (
            <Link to={`/wiki/${domainHome.path}`} className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 capitalize">
              {page.domain.replace(/-/g, ' ')}
            </Link>
          ) : (
            page.domain && <span className="text-sm text-stone-500 dark:text-stone-400 capitalize">{page.domain.replace(/-/g, ' ')}</span>
          )}
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 text-balance">{page.title}</h1>
          {page.summary && <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{page.summary}</p>}
        </header>

        {(page.updated || page.tags.length > 0 || status || sections.length > 0 || sources.length > 0 || artifacts.length > 0) && (
          <dl className="divide-y divide-stone-200 dark:divide-stone-800 border-y border-stone-200 dark:border-stone-800">
            {status && (
              <Property label="Status">
                <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300">{status}</span>
              </Property>
            )}
            {sections.length > 0 && (
              <Property label="Sections">
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                  {sections.map((id) => (
                    <Link key={id} to={`/sections/${id}`} className="underline decoration-stone-300 dark:decoration-stone-600 underline-offset-2 hover:decoration-stone-500">
                      {id}
                    </Link>
                  ))}
                </span>
              </Property>
            )}
            {page.tags.length > 0 && (
              <Property label="Tags">
                <span className="flex flex-wrap gap-x-2 gap-y-1">
                  {page.tags.map((tag) => (
                    <span key={tag} className="text-stone-600 dark:text-stone-400">#{tag}</span>
                  ))}
                </span>
              </Property>
            )}
            {page.updated && <Property label="Updated"><span className="tabular-nums">{page.updated}</span></Property>}
            {sources.length > 0 && (
              <Property label="Sources">
                <span className="flex flex-col gap-1">
                  {sources.map((source) => (
                    <code key={source} className="font-mono text-xs text-stone-600 dark:text-stone-400 break-all">{source}</code>
                  ))}
                </span>
              </Property>
            )}
            {artifacts.length > 0 && (
              <Property label="Artifacts">
                <span className="flex flex-col gap-1">
                  {artifacts.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="break-all underline decoration-lime-500 decoration-2 underline-offset-2">
                      {url.replace(/^https?:\/\//, '')}
                    </a>
                  ))}
                </span>
              </Property>
            )}
          </dl>
        )}

        <WikiMarkdown markdown={body} />

        <p className="text-xs text-stone-400 dark:text-stone-500">
          <code className="font-mono">wiki/{page.path}.md</code> · Maintained by the wiki commands
        </p>
      </article>
    </AppLayout>
  )
}
