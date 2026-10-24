import { Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { PanelLeft, Maximize2, GripVertical, Smartphone, Tablet, Monitor } from 'lucide-react'
import { RenderComponent } from '@/components/RenderComponent'
import { loadShellPreview } from '@/lib/shell-loader'
import { PageTabs } from '@/components/PageTabs'
import { designSystemTabs } from '@/components/tabs'
import { paths } from '@/lib/paths'
import { Inspector, PickButton } from '@/components/live-edit/Inspector'
import { useLivePicker } from '@/components/live-edit/useLivePicker'
import { useProductFonts } from '@/lib/product-fonts'
import { useLivePreview } from '@/components/live-edit/useLivePreview'
import type { LiveTarget } from '@/lib/live-edit/selection'
import React from 'react'

const MIN_WIDTH = 320
const DEFAULT_WIDTH_PERCENT = 100
const SHELL_TARGET: LiveTarget = { kind: 'shell' }

export function ShellDesignPage() {
  const [widthPercent, setWidthPercent] = useState(DEFAULT_WIDTH_PERCENT)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const target = SHELL_TARGET
  const live = useLivePreview(iframeRef, target)

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
    <div className="h-full min-h-[480px] bg-stone-100 dark:bg-rwe-neutral-900 animate-fade-in flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-3 bg-rwe-sand-25 dark:bg-rwe-neutral-950"><PageTabs label="Design system views" tabs={designSystemTabs} /></div>
      {/* Header */}
      <header className="border-b border-stone-200 dark:border-rwe-neutral-800 bg-rwe-sand-25 dark:bg-rwe-neutral-950 shrink-0 z-50">
        <div className="px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <PanelLeft className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
            <span className="text-sm font-medium text-stone-700 dark:text-rwe-neutral-300">
              Shell Design
            </span>
          </div>

          {/* Width indicator and device presets */}
          <div className="ml-auto flex items-center gap-4">
            {/* Device size presets */}
            <div className="flex items-center gap-1 border-r border-stone-200 dark:border-rwe-neutral-700 pr-4">
              <button
                onClick={() => setWidthPercent(30)}
                className={`p-1.5 rounded transition-colors ${
                  widthPercent <= 40
                    ? 'bg-stone-200 dark:bg-rwe-neutral-700 text-stone-900 dark:text-rwe-neutral-100'
                    : 'text-stone-400 dark:text-rwe-neutral-500 hover:text-stone-600 dark:hover:text-rwe-neutral-300 hover:bg-stone-100 dark:hover:bg-rwe-neutral-800'
                }`}
                title="Mobile (30%)"
              >
                <Smartphone className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setWidthPercent(60)}
                className={`p-1.5 rounded transition-colors ${
                  widthPercent > 40 && widthPercent <= 60
                    ? 'bg-stone-200 dark:bg-rwe-neutral-700 text-stone-900 dark:text-rwe-neutral-100'
                    : 'text-stone-400 dark:text-rwe-neutral-500 hover:text-stone-600 dark:hover:text-rwe-neutral-300 hover:bg-stone-100 dark:hover:bg-rwe-neutral-800'
                }`}
                title="Tablet (60%)"
              >
                <Tablet className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setWidthPercent(100)}
                className={`p-1.5 rounded transition-colors ${
                  widthPercent > 60
                    ? 'bg-stone-200 dark:bg-rwe-neutral-700 text-stone-900 dark:text-rwe-neutral-100'
                    : 'text-stone-400 dark:text-rwe-neutral-500 hover:text-stone-600 dark:hover:text-rwe-neutral-300 hover:bg-stone-100 dark:hover:bg-rwe-neutral-800'
                }`}
                title="Desktop (100%)"
              >
                <Monitor className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            {live && <PickButton active={live.picking} onToggle={() => live.setPicking(!live.picking)} />}
            <span className="text-xs text-stone-500 dark:text-rwe-neutral-400 font-mono w-10 text-right">
              {Math.round(widthPercent)}%
            </span>
            <a
              href={paths.shellFullscreen}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-rwe-neutral-400 hover:text-stone-700 dark:hover:text-rwe-neutral-200 transition-colors"
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
            <div className="w-1 h-16 rounded-full bg-stone-300 dark:bg-rwe-neutral-600 group-hover:bg-stone-400 dark:group-hover:bg-rwe-neutral-500 transition-colors flex items-center justify-center">
              <GripVertical className="w-3 h-3 text-stone-500 dark:text-rwe-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
            </div>
          </div>

          {/* Preview container using iframe for true isolation */}
          <div
            className="bg-rwe-sand-25 dark:bg-rwe-neutral-950 rounded-lg shadow-xl border border-stone-200 dark:border-rwe-neutral-700 overflow-hidden"
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
            <div className="w-1 h-16 rounded-full bg-stone-300 dark:bg-rwe-neutral-600 group-hover:bg-stone-400 dark:group-hover:bg-rwe-neutral-500 transition-colors flex items-center justify-center">
              <GripVertical className="w-3 h-3 text-stone-500 dark:text-rwe-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Live Edit: the inspector sits next to the preview, so the resize handles stay free */}
        {live?.selection && (
          <div className="flex shrink-0 py-6 pr-4">
            <Inspector
              key={live.selection.element.src}
              selection={live.selection}
              onChange={live.setEdits}
              onClose={live.dismiss}
              onAddToChat={live.focusComposer}
              onApply={live.apply}
              guides={live.guides}
              onGuidesChange={live.setGuides}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// The lazy preview is created once at module level, so its identity is stable across renders
let shellPreviewComponent: React.LazyExoticComponent<React.ComponentType> | null | undefined

function getLazyShellPreview() {
  if (shellPreviewComponent === undefined) {
    const loader = loadShellPreview()
    shellPreviewComponent = loader ? React.lazy(loader) : null
  }
  return shellPreviewComponent
}

/**
 * Fullscreen version of the shell preview (for screenshots)
 * Syncs theme with parent window via localStorage
 */
export function ShellDesignFullscreen() {
  const ShellPreviewComponent = getLazyShellPreview()

  // Live Edit: the picker, when the preview is embedded in a step page
  useLivePicker()
  // The product's fonts, which the prototype does not load otherwise
  useProductFonts()

  // Sync theme with parent window
  useEffect(() => {
    const applyTheme = () => {
      const theme = localStorage.getItem('theme') || 'system'
      const root = document.documentElement

      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', systemDark)
      } else {
        root.classList.toggle('dark', theme === 'dark')
      }
    }

    // Apply on mount
    applyTheme()

    // Listen for storage changes (from parent window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        applyTheme()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // Also poll for changes since storage event doesn't fire in same window
    const interval = setInterval(applyTheme, 100)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  if (!ShellPreviewComponent) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-stone-600 dark:text-rwe-neutral-400">Shell preview not found.</p>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="text-stone-500 dark:text-rwe-neutral-400">Loading...</div>
        </div>
      }
    >
      <RenderComponent component={ShellPreviewComponent} />
    </Suspense>
  )
}
