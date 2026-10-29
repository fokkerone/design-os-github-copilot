import { useState, useRef, useCallback } from 'react'
import { PanelLeft, Maximize2, GripVertical, Smartphone, Tablet, Monitor } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { EmptyState } from '@/components/EmptyState'
import { ShellCard } from '@/components/ShellCard'
import { loadProductData } from '@/lib/product-loader'
import { hasShellPreview } from '@/lib/shell-loader'
import { paths } from '@/lib/paths'
import { PickButton } from '@/components/live-edit/Inspector'
import { LiveEditPanel } from '@/components/live-edit/LiveEditPanel'
import { useLivePreview } from '@/components/live-edit/useLivePreview'
import { useLiveComments, useOneMode } from '@/components/live-edit/useLiveComments'
import { CommentButton } from '@/components/live-edit/CommentButton'
import type { LiveTarget } from '@/lib/live-edit/selection'

/** For useOneMode outside a chat, where neither mode exists */
const noMode = () => {}
const MIN_WIDTH = 320
const DEFAULT_WIDTH_PERCENT = 100
const SHELL_TARGET: LiveTarget = { kind: 'shell' }

/** Prototype › Shell: the shell preview, or how to design it while there is none */
export function ShellDesignPage() {
  if (hasShellPreview()) return <ShellPreviewPage />
  const shell = loadProductData().shell
  return (
    <AppLayout>
      <h1 className="mb-2 text-2xl font-semibold text-foreground">Application Shell</h1>
      <p className="mb-6 text-muted-foreground">The persistent navigation and layout that wraps all sections.</p>
      <div className="space-y-6">
        {shell?.spec && <ShellCard shell={shell} />}
        <EmptyState type="shell" />
      </div>
    </AppLayout>
  )
}

function ShellPreviewPage() {
  const [widthPercent, setWidthPercent] = useState(DEFAULT_WIDTH_PERCENT)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const target = SHELL_TARGET
  const live = useLivePreview(iframeRef, target)
  const comments = useLiveComments(iframeRef, target)
  useOneMode(live?.picking ?? false, live?.setPicking ?? noMode, comments?.commenting ?? false, comments?.setCommenting ?? noMode)

  // Handle resize drag
  const handleMouseDown = useCallback(() => {
    isDragging.current = true

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const containerWidth = containerRect.width
      const containerCenter = containerRect.left + containerWidth / 2

      // Calculate distance from center
      const distanceFromCenter = Math.abs(e.clientX - containerCenter)
      const maxDistance = containerWidth / 2

      // Convert to percentage (distance from center * 2 = total width)
      let newWidthPercent = (distanceFromCenter / maxDistance) * 100

      // Clamp between min width and 100%
      const minPercent = (MIN_WIDTH / containerWidth) * 100
      newWidthPercent = Math.max(minPercent, Math.min(100, newWidthPercent))

      setWidthPercent(newWidthPercent)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const previewWidth = `${widthPercent}%`

  return (
    <div className="h-full min-h-[480px] bg-muted animate-fade-in flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0 z-50">
        <div className="px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <PanelLeft className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm font-medium text-foreground">
              Shell Design
            </span>
          </div>

          {/* Width indicator and device presets */}
          <div className="ml-auto flex items-center gap-4">
            {/* Device size presets */}
            <div className="flex items-center gap-1 border-r border-border pr-4">
              <button
                onClick={() => setWidthPercent(30)}
                className={`p-1.5 rounded transition-colors ${
                  widthPercent <= 40
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-muted-foreground hover:bg-accent'
                }`}
                title="Mobile (30%)"
              >
                <Smartphone className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setWidthPercent(60)}
                className={`p-1.5 rounded transition-colors ${
                  widthPercent > 40 && widthPercent <= 60
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-muted-foreground hover:bg-accent'
                }`}
                title="Tablet (60%)"
              >
                <Tablet className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setWidthPercent(100)}
                className={`p-1.5 rounded transition-colors ${
                  widthPercent > 60
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-muted-foreground hover:bg-accent'
                }`}
                title="Desktop (100%)"
              >
                <Monitor className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            {live && <PickButton active={live.picking} onToggle={() => live.setPicking(!live.picking)} />}
            {comments && (
              <CommentButton
                active={comments.commenting}
                onToggle={() => comments.setCommenting(!comments.commenting)}
                open={comments.open}
                showResolved={comments.showResolved}
                onShowResolved={comments.setShowResolved}
              />
            )}
            <span className="text-xs text-muted-foreground font-mono w-10 text-right">
              {Math.round(widthPercent)}%
            </span>
            <a
              href={paths.shellFullscreen}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              Fullscreen
            </a>
          </div>
        </div>
      </header>

      {/* Preview and, while an element is picked, the Live Edit inspector */}
      <div className="flex min-h-0 flex-1">
        {/* Preview area with resizable container */}
        <div
          ref={containerRef}
          className="relative flex min-w-0 flex-1 items-stretch justify-center overflow-hidden p-6"
        >
          {/* Left resize handle */}
          <div
            className="w-4 flex items-center justify-center cursor-ew-resize group shrink-0"
            onMouseDown={handleMouseDown}
          >
            <div className="w-1 h-16 rounded-full bg-muted group-hover:bg-muted-foreground transition-colors flex items-center justify-center">
              <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
            </div>
          </div>

          {/* Preview container using iframe for true isolation */}
          <div
            className="bg-card rounded-lg shadow-xl border border-border overflow-hidden"
            style={{ width: previewWidth, minWidth: MIN_WIDTH, maxWidth: '100%' }}
          >
            <iframe
              ref={iframeRef}
              src={paths.shellFullscreen}
              className="w-full h-full border-0"
              title="Shell Preview"
            />
          </div>

          {/* Right resize handle */}
          <div
            className="w-4 flex items-center justify-center cursor-ew-resize group shrink-0"
            onMouseDown={handleMouseDown}
          >
            <div className="w-1 h-16 rounded-full bg-muted group-hover:bg-muted-foreground transition-colors flex items-center justify-center">
              <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Live Edit: the inspector sits next to the preview, so the resize handles stay free */}
        {live && (live.picking || live.selection) && (
          <div className="flex shrink-0 py-6 pr-4">
            <LiveEditPanel
              live={live}
              onClose={() => {
                live.setPicking(false)
                live.dismiss()
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
