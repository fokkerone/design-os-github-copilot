import { useMemo, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { MermaidDiagram } from '@/components/MermaidDiagram'
import { createSlugger, createWikiMarked, transformInline } from '@/lib/wiki-markdown'

interface WikiMarkdownProps {
  markdown: string
  /** Give headings anchor ids so a table of contents can link to them. Use once per page. */
  anchors?: boolean
}

type Block = { type: 'markdown'; content: string } | { type: 'mermaid'; content: string }

// External links open in a new tab
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && /^https?:/.test(node.getAttribute('href') || '')) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

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

function renderMarkdown(markdown: string, marked: ReturnType<typeof createWikiMarked>): string {
  const html = marked.parse(transformInline(markdown), { async: false })
  return DOMPurify.sanitize(html)
    .replace(/<table>/g, '<div class="wiki-table"><table>')
    .replace(/<\/table>/g, '</table></div>')
}

const proseClasses = [
  'text-[15px] leading-relaxed text-foreground',
  '[&>*+*]:mt-4',
  '[&_h1]:scroll-mt-20 [&_h2]:scroll-mt-20 [&_h3]:scroll-mt-20 [&_h4]:scroll-mt-20',
  '[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-foreground',
  '[&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground',
  '[&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li+li]:mt-1',
  '[&_li:has(>input)]:list-none [&_li>input]:mr-2 [&_li>input]:accent-primary',
  '[&_strong]:font-semibold [&_strong]:text-foreground',
  '[&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5',
  '[&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50 dark:[&_blockquote]:bg-amber-950/30 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:text-foreground',
  '[&_hr]:border-border',
  '[&_.wiki-table]:overflow-x-auto [&_.wiki-table]:rounded-md [&_.wiki-table]:border [&_.wiki-table]:border-border',
  '[&_table]:w-full [&_table]:text-[13px] [&_table]:leading-snug [&_table]:tabular-nums',
  '[&_th]:text-left [&_th]:font-medium [&_th]:text-muted-foreground [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:whitespace-nowrap',
  '[&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:border-t [&_td]:border-border',
  '[&_a]:text-foreground [&_a]:underline [&_a]:decoration-border [&_a]:underline-offset-2 hover:[&_a]:decoration-muted-foreground',
  '[&_.wiki-link]:decoration-primary [&_.wiki-link]:decoration-2 hover:[&_.wiki-link]:decoration-primary',
  '[&_.wiki-link-broken]:text-destructive [&_.wiki-link-broken]:underline [&_.wiki-link-broken]:decoration-dashed [&_.wiki-link-broken]:underline-offset-2 [&_.wiki-link-broken]:cursor-help',
  '[&_.wiki-provenance]:ml-1 [&_.wiki-provenance]:rounded [&_.wiki-provenance]:px-1.5 [&_.wiki-provenance]:py-px [&_.wiki-provenance]:text-[11px] [&_.wiki-provenance]:font-medium [&_.wiki-provenance]:bg-amber-100 [&_.wiki-provenance]:text-amber-800 dark:[&_.wiki-provenance]:bg-amber-900/40 dark:[&_.wiki-provenance]:text-amber-300',
].join(' ')

/** Renders a wiki page body: markdown, [[wikilinks]] and Mermaid diagrams */
export function WikiMarkdown({ markdown, anchors = false }: WikiMarkdownProps) {
  const navigate = useNavigate()
  const blocks = useMemo(() => {
    // One marked instance for all blocks keeps heading ids unique over the whole page
    const marked = createWikiMarked(anchors ? createSlugger() : undefined)
    return splitBlocks(markdown).map((block) =>
      block.type === 'markdown' ? { ...block, html: renderMarkdown(block.content, marked) } : { ...block, html: '' }
    )
  }, [markdown, anchors])

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
          <div key={index} className="rounded-md border border-border p-4">
            <MermaidDiagram chart={block.content} />
          </div>
        ) : (
          <div key={index} className="[&>*+*]:mt-4" dangerouslySetInnerHTML={{ __html: block.html }} />
        )
      )}
    </div>
  )
}
