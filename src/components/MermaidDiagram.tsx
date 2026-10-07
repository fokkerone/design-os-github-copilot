import { useEffect, useId, useState } from 'react'

interface MermaidDiagramProps {
  chart: string
}

function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')))
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return isDark
}

/**
 * Renders a Mermaid diagram. Mermaid is loaded lazily so it only ships
 * with pages that actually show a flow.
 */
export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const isDark = useIsDark()
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const { default: mermaid } = await import('mermaid')
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: isDark ? 'dark' : 'neutral',
          fontFamily: 'DM Sans, sans-serif',
        })
        const { svg } = await mermaid.render(id, chart)
        if (!cancelled) {
          setSvg(svg)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not render diagram')
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [chart, id, isDark])

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600 dark:text-red-400">Diagram could not be rendered: {error}</p>
        <pre className="text-xs font-mono text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-900 rounded-md p-3 overflow-x-auto">
          {chart}
        </pre>
      </div>
    )
  }

  if (!svg) {
    return <div className="h-32 rounded-md bg-stone-50 dark:bg-stone-900 animate-pulse" />
  }

  return (
    <div
      className="overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
