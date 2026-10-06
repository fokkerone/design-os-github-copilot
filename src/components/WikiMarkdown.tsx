import { useMemo, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { MermaidDiagram } from '@/components/MermaidDiagram'
import { resolveWikiLink } from '@/lib/wiki-loader'

interface WikiMarkdownProps {
  markdown: string
}

type Block = { type: 'markdown'; content: string } | { type: 'mermaid'; content: string }

// External links open in a new tab
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && /^https?:/.test(node.getAttribute('href') || '')) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Split markdown into Mermaid diagrams and everything else */
function splitBlocks(markdown: string): Block[] {
  const blocks: Block[] = []
  let last = 0
  for (const match of markdown.matchAll(/^```mermaid[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm)) {
    if (match.index > last) blocks.push({ type: 'markdown', content: markdown.slice(last, match.index) })
    blocks.push({ type: 'mermaid', content: match[1].trim() })
    last = match.index + match[0].length
  }
  if (last < markdown.length) blocks.push({ type: 'markdown', content: markdown.slice(last) })
  return blocks
}

/** Replace [[wikilinks]] and ^[provenance] markers, leaving code untouched */
function transformInline(text: string): string {
  return text
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, index) => {
      if (index % 2 === 1) return part
      return part
        .replace(/\[\[([^\]|\\]+?)(?:\\?\|([^\]]+))?\]\]/g, (_, target: string, alias?: string) => {
          const label = escapeHtml((alias || target.split('/').pop() || target).trim())
          const resolved = resolveWikiLink(target)
          return resolved
            ? `<a href="/wiki/${resolved}" data-wiki="${resolved}" class="wiki-link">${label}</a>`
            : `<span class="wiki-link-broken" title="No wiki page for ${escapeHtml(target)}">${label}</span>`
        })
        .replace(/\^\[(inferred|ambiguous)\]/g, '<span class="wiki-provenance">$1</span>')
    })
    .join('')
}

function renderMarkdown(markdown: string): string {
  const html = marked.parse(transformInline(markdown), { gfm: true, async: false }) as string
  return DOMPurify.sanitize(html)
    .replace(/<table>/g, '<div class="wiki-table"><table>')
    .replace(/<\/table>/g, '</table></div>')
}

const proseClasses = [
  'text-[15px] leading-relaxed text-stone-700 dark:text-stone-300',
  '[&>*+*]:mt-4',
  '[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-stone-900 dark:[&_h1]:text-stone-100',
  '[&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-stone-900 dark:[&_h2]:text-stone-100',
  '[&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-stone-900 dark:[&_h3]:text-stone-100',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li+li]:mt-1',
  '[&_li:has(>input)]:list-none [&_li>input]:mr-2 [&_li>input]:accent-lime-600',
  '[&_strong]:font-semibold [&_strong]:text-stone-900 dark:[&_strong]:text-stone-100',
  '[&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-stone-100 dark:[&_code]:bg-stone-800 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5',
  '[&_pre]:bg-stone-100 dark:[&_pre]:bg-stone-900 [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50 dark:[&_blockquote]:bg-amber-950/30 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:text-stone-700 dark:[&_blockquote]:text-stone-300',
  '[&_hr]:border-stone-200 dark:[&_hr]:border-stone-800',
  '[&_.wiki-table]:overflow-x-auto [&_.wiki-table]:rounded-md [&_.wiki-table]:border [&_.wiki-table]:border-stone-200 dark:[&_.wiki-table]:border-stone-800',
  '[&_table]:w-full [&_table]:text-[13px] [&_table]:leading-snug [&_table]:tabular-nums',
  '[&_th]:text-left [&_th]:font-medium [&_th]:text-stone-500 dark:[&_th]:text-stone-400 [&_th]:bg-stone-50 dark:[&_th]:bg-stone-900 [&_th]:px-3 [&_th]:py-2 [&_th]:whitespace-nowrap',
  '[&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:border-t [&_td]:border-stone-200 dark:[&_td]:border-stone-800',
  '[&_a]:text-stone-900 dark:[&_a]:text-stone-100 [&_a]:underline [&_a]:decoration-stone-300 dark:[&_a]:decoration-stone-600 [&_a]:underline-offset-2 hover:[&_a]:decoration-stone-500',
  '[&_.wiki-link]:decoration-lime-500 [&_.wiki-link]:decoration-2 hover:[&_.wiki-link]:decoration-lime-600',
  '[&_.wiki-link-broken]:text-red-600 dark:[&_.wiki-link-broken]:text-red-400 [&_.wiki-link-broken]:underline [&_.wiki-link-broken]:decoration-dashed [&_.wiki-link-broken]:underline-offset-2 [&_.wiki-link-broken]:cursor-help',
  '[&_.wiki-provenance]:ml-1 [&_.wiki-provenance]:rounded [&_.wiki-provenance]:px-1.5 [&_.wiki-provenance]:py-px [&_.wiki-provenance]:text-[11px] [&_.wiki-provenance]:font-medium [&_.wiki-provenance]:bg-amber-100 [&_.wiki-provenance]:text-amber-800 dark:[&_.wiki-provenance]:bg-amber-900/40 dark:[&_.wiki-provenance]:text-amber-300',
].join(' ')

/** Renders a wiki page body: markdown, [[wikilinks]] and Mermaid diagrams */
export function WikiMarkdown({ markdown }: WikiMarkdownProps) {
  const navigate = useNavigate()
  const blocks = useMemo(
    () =>
      splitBlocks(markdown).map((block) =>
        block.type === 'markdown' ? { ...block, html: renderMarkdown(block.content) } : { ...block, html: '' }
      ),
    [markdown]
  )

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const link = (event.target as HTMLElement).closest('a[data-wiki]')
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return
    event.preventDefault()
    navigate(`/wiki/${link.getAttribute('data-wiki')}`)
  }

  return (
    <div className={proseClasses} onClick={handleClick}>
      {blocks.map((block, index) =>
        block.type === 'mermaid' ? (
          <div key={index} className="rounded-md border border-stone-200 dark:border-stone-800 p-4">
            <MermaidDiagram chart={block.content} />
          </div>
        ) : (
          <div key={index} className="[&>*+*]:mt-4" dangerouslySetInnerHTML={{ __html: block.html }} />
        )
      )}
    </div>
  )
}
