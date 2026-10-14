import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const style =
  '[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 ' +
  '[&_strong]:font-semibold [&_a]:underline [&_a]:underline-offset-2 [&_h1]:mt-3 [&_h1]:text-[16px] [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:font-semibold ' +
  "[&_code]:rounded-sm [&_code]:bg-rwe-sand-500 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-['JetBrains_Mono',ui-monospace,monospace] [&_code]:text-[12.5px] dark:[&_code]:bg-rwe-neutral-800 " +
  '[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-rwe-sand-500 [&_pre]:p-3 dark:[&_pre]:bg-rwe-neutral-950 [&_pre_code]:bg-transparent [&_pre_code]:p-0 ' +
  '[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-stone-300 [&_blockquote]:pl-3 [&_blockquote]:text-stone-600 dark:[&_blockquote]:border-rwe-neutral-700 dark:[&_blockquote]:text-rwe-neutral-300 ' +
  '[&_table]:my-2 [&_table]:text-[13px] [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border-stone-200 [&_td]:border-stone-200 dark:[&_th]:border-rwe-neutral-700 dark:[&_td]:border-rwe-neutral-700'

// Links in answers open in a new tab
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && /^https?:/.test(node.getAttribute('href') || '')) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

/** Markdown of an agent answer, sanitized. Safe while streaming: partial markdown renders as far as it parses. */
export function ChatMarkdown({ text }: { text: string }) {
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(text, { async: false, gfm: true, breaks: true })), [text])
  return <div className={`text-[14px] leading-relaxed ${style}`} dangerouslySetInnerHTML={{ __html: html }} />
}
