import { useEffect, useId, useState } from 'react'
import { GITHUB_DARK } from '@/lib/mermaid-theme'

interface MermaidDiagramProps {
  chart: string
}

/**
 * Renders a Mermaid diagram in the GitHub Dark theme (light and dark mode alike, on its own
 * dark surface). Mermaid is loaded lazily so it only ships with pages that actually show a flow.
 */
export function MermaidDiagram({ chart }: MermaidDiagramProps) {
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
          theme: 'base',
          themeVariables: { ...GITHUB_DARK.themeVariables, fontFamily: 'Inter, sans-serif' },
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
  }, [chart, id])

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">Diagram could not be rendered: {error}</p>
        <pre className="text-xs font-mono text-muted-foreground bg-muted rounded-md p-3 overflow-x-auto">
          {chart}
        </pre>
      </div>
    )
  }

  if (!svg) {
    return <div className="h-32 rounded-md bg-muted animate-pulse" />
  }

  return (
    <div
      className="overflow-x-auto rounded-md p-4 [&_svg]:mx-auto [&_svg]:max-w-full [&_svg]:h-auto"
      style={{ backgroundColor: GITHUB_DARK.background }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
