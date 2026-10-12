import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  text: string
  title?: string
}

export function CopyButton({ text, title = 'Copy to clipboard' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors"
      title={title}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" strokeWidth={2} />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" strokeWidth={2} />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}
