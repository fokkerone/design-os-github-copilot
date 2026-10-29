import { useState } from 'react'
import { X } from 'lucide-react'
import { ComponentTree } from './ComponentTree'
import { Inspector } from './Inspector'
import { panelClass } from './panel'
import type { useLivePreview } from './useLivePreview'

type Tab = 'layers' | 'inspect'
const TAB_KEY = 'designos:live-edit:tab'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus'
const muted = 'text-muted-foreground'

function storedTab(): Tab {
  try {
    return localStorage.getItem(TAB_KEY) === 'layers' ? 'layers' : 'inspect'
  } catch {
    return 'inspect'
  }
}

/**
 * The Live Edit side column next to the preview: the component tree (Layers) and the inspector
 * of the selection (Inspect). Shown while picking or while something is selected.
 */
export function LiveEditPanel({ live, onClose }: { live: NonNullable<ReturnType<typeof useLivePreview>>; onClose: () => void }) {
  const [tab, setTabState] = useState<Tab>(storedTab)
  const setTab = (next: Tab) => {
    setTabState(next)
    try {
      localStorage.setItem(TAB_KEY, next)
    } catch {
      // The tab is a convenience, a blocked storage keeps the default
    }
  }
  const { selection } = live
  const selectionKey = selection ? `${selection.element.kind ?? 'element'}:${selection.element.src}:${selection.element.index ?? 0}` : null
  // A new selection (in the tree or in the preview) opens its inspector
  const [opened, setOpened] = useState(selectionKey)
  if (selectionKey !== opened) {
    setOpened(selectionKey)
    if (selectionKey) setTabState('inspect')
  }
  const shown: Tab = selection ? tab : 'layers'

  const tabs = (
    <div className="flex items-center gap-1 border-b border-border px-2.5 py-1.5">
      <div role="tablist" aria-label="Live Edit" className="flex flex-1 gap-0.5 rounded-md bg-muted p-0.5">
        {(['layers', 'inspect'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={shown === t}
            disabled={t === 'inspect' && !selection}
            onClick={() => setTab(t)}
            className={`h-6 flex-1 rounded text-[11px] font-medium disabled:opacity-40 ${focusRing} ${
              shown === t
                ? 'bg-card text-foreground shadow-sm'
                : `${muted} hover:text-foreground`
            }`}
          >
            {t === 'layers' ? 'Layers' : 'Inspect'}
          </button>
        ))}
      </div>
      {shown === 'layers' && (
        <button
          type="button"
          aria-label="Close Live Edit"
          onClick={onClose}
          className={`flex size-6 items-center justify-center rounded-md ${muted} hover:bg-accent ${focusRing}`}
        >
          <X className="size-3.5" strokeWidth={1.5} />
        </button>
      )}
    </div>
  )

  if (shown === 'inspect' && selection) {
    return (
      <Inspector
        key={selectionKey}
        tabs={tabs}
        selection={selection}
        onChange={live.setEdits}
        onClose={live.dismiss}
        onAddToChat={live.focusComposer}
        onApply={live.apply}
        onWrite={live.writeToSource}
        onRecord={live.record}
        guides={live.guides}
        onGuidesChange={live.setGuides}
      />
    )
  }
  return (
    <aside aria-label="Layers" className={panelClass}>
      {tabs}
      <ComponentTree nodes={live.nodes} selectedId={live.selectedNodeId} onHover={live.hoverNode} onSelect={live.selectNode} />
    </aside>
  )
}
