import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Component, Search } from 'lucide-react'
import type { TreeNode } from '@/lib/live-edit/protocol'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus'
const muted = 'text-stone-500 dark:text-rwe-neutral-400'

/** What stays the same for a node across trees (ids do not): kind, call site or source, index */
const stableKey = (n: TreeNode) => `${n.kind}:${n.call ?? n.src}:${n.index}`

/** "LoginForm.tsx:40" */
const callFile = (n: TreeNode) => (n.call ?? n.src ?? '').split('/').pop()?.replace(/:\d+$/, '') ?? ''

interface Row {
  node: TreeNode
  depth: number
  hasChildren: boolean
}

/**
 * The component tree of the preview, like the React DevTools: components called in the product
 * UI, optionally with their DOM elements. Hover highlights in the preview, a click selects.
 */
export function ComponentTree({
  nodes,
  selectedId,
  onHover,
  onSelect,
}: {
  nodes: TreeNode[]
  selectedId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}) {
  const [showElements, setShowElements] = useState(false)
  const [filter, setFilter] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [cursor, setCursor] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  // Leaving the tab (or selecting) unmounts the tree without a mouseleave: drop the highlight then
  const hover = useRef(onHover)
  useEffect(() => {
    hover.current = onHover
  })
  useEffect(() => () => hover.current(null), [])

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const shown = (n: TreeNode) => showElements || n.kind === 'component'
  /** The nearest ancestor the tree shows */
  const visibleParent = (n: TreeNode): TreeNode | undefined => {
    let p = n.parentId ? byId.get(n.parentId) : undefined
    while (p && !shown(p)) p = p.parentId ? byId.get(p.parentId) : undefined
    return p
  }
  // The selection may be an element while elements are hidden: mark its component
  const selected = selectedId ? byId.get(selectedId) : undefined
  const selectedRow = selected && !shown(selected) ? visibleParent(selected) : selected

  const rows = useMemo(() => {
    const visible = nodes.filter(shown)
    const parentOf = new Map(visible.map((n) => [n.id, visibleParent(n)?.id ?? null]))
    const children = new Map<string | null, TreeNode[]>()
    for (const n of visible) children.set(parentOf.get(n.id)!, [...(children.get(parentOf.get(n.id)!) ?? []), n])
    const query = filter.trim().toLowerCase()
    // With a filter: the matches and the components around them
    const keep = new Set<string>()
    if (query) {
      for (const n of visible) {
        if (!n.name.toLowerCase().includes(query)) continue
        for (let id: string | null = n.id; id; id = parentOf.get(id) ?? null) keep.add(id)
      }
    }
    const out: Row[] = []
    const walk = (parent: string | null, depth: number) => {
      for (const n of children.get(parent) ?? []) {
        if (query && !keep.has(n.id)) continue
        const hasChildren = (children.get(n.id)?.length ?? 0) > 0
        out.push({ node: n, depth, hasChildren })
        if (hasChildren && (query || !collapsed.has(stableKey(n)))) walk(n.id, depth + 1)
      }
    }
    walk(null, 0)
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shown and visibleParent read showElements and byId
  }, [nodes, byId, showElements, filter, collapsed])

  // A selection made in the preview opens the tree down to it
  const revealKey = selectedRow ? `${stableKey(selectedRow)}|${showElements}` : null
  const [revealed, setRevealed] = useState<string | null>(null)
  if (revealKey !== revealed) {
    setRevealed(revealKey)
    if (selectedRow) {
      const ancestors: string[] = []
      for (let p = visibleParent(selectedRow); p; p = visibleParent(p)) ancestors.push(stableKey(p))
      if (ancestors.some((k) => collapsed.has(k))) setCollapsed(new Set([...collapsed].filter((k) => !ancestors.includes(k))))
      setCursor(selectedRow.id)
    }
  }
  useEffect(() => {
    if (selectedRow) listRef.current?.querySelector(`[data-node="${selectedRow.id}"]`)?.scrollIntoView?.({ block: 'nearest' })
  }, [selectedRow, rows])

  const toggle = (n: TreeNode, open?: boolean) =>
    setCollapsed((c) => {
      const key = stableKey(n)
      const next = new Set(c)
      if (open ?? next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const onKeyDown = (e: React.KeyboardEvent) => {
    const at = rows.findIndex((r) => r.node.id === cursor)
    const row = rows[at]
    const move = (to: number) => {
      const next = rows[Math.max(0, Math.min(rows.length - 1, to))]
      if (!next) return
      setCursor(next.node.id)
      onHover(next.node.id)
      listRef.current?.querySelector(`[data-node="${next.node.id}"]`)?.scrollIntoView?.({ block: 'nearest' })
    }
    if (e.key === 'ArrowDown') move(at + 1)
    else if (e.key === 'ArrowUp') move(at < 0 ? 0 : at - 1)
    else if (e.key === 'ArrowRight' && row?.hasChildren) toggle(row.node, true)
    else if (e.key === 'ArrowLeft' && row) {
      if (row.hasChildren && !collapsed.has(stableKey(row.node))) toggle(row.node, false)
      else {
        const parent = visibleParent(row.node)
        if (parent) move(rows.findIndex((r) => r.node.id === parent.id))
      }
    } else if (e.key === 'Enter' && row) onSelect(row.node.id)
    else return
    e.preventDefault()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1.5 border-b border-stone-200 px-2.5 py-1.5 dark:border-rwe-neutral-800">
        <Search className={`size-3.5 shrink-0 ${muted}`} strokeWidth={1.5} />
        <input
          aria-label="Filter components"
          placeholder="Filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={`min-w-0 flex-1 bg-transparent text-[12px] text-rwe-neutral-900 placeholder:text-stone-400 dark:text-rwe-neutral-100 dark:placeholder:text-rwe-neutral-500 ${focusRing}`}
        />
        <label className={`flex shrink-0 items-center gap-1 text-[10px] ${muted}`}>
          <input type="checkbox" checked={showElements} onChange={(e) => setShowElements(e.target.checked)} className="size-3 accent-brand-blue-500 dark:accent-energy-green-500" />
          Elements
        </label>
      </div>

      <div
        ref={listRef}
        role="tree"
        aria-label="Components"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseLeave={() => onHover(null)}
        className={`flex-1 overflow-y-auto py-1 ${focusRing}`}
      >
        {rows.length === 0 && <p className={`px-2.5 py-2 text-[11px] ${muted}`}>{nodes.length === 0 ? 'No components rendered yet' : 'No match'}</p>}
        {rows.map(({ node, depth, hasChildren }) => {
          const isSelected = node.id === selectedRow?.id
          const open = hasChildren && (!!filter.trim() || !collapsed.has(stableKey(node)))
          return (
            <div
              key={node.id}
              data-node={node.id}
              role="treeitem"
              aria-level={depth + 1}
              aria-selected={isSelected}
              aria-expanded={hasChildren ? open : undefined}
              onMouseEnter={() => onHover(node.id)}
              onClick={() => {
                setCursor(node.id)
                onSelect(node.id)
              }}
              title={node.call ?? node.src}
              style={{ paddingLeft: 4 + depth * 12 }}
              className={`flex h-[22px] cursor-default items-center gap-1 pr-2.5 text-[12px] ${
                isSelected
                  ? 'bg-brand-blue-500/15 text-rwe-neutral-900 dark:bg-energy-green-500/15 dark:text-rwe-neutral-50'
                  : `text-rwe-neutral-900 hover:bg-stone-100 dark:text-rwe-neutral-100 dark:hover:bg-rwe-neutral-800 ${node.id === cursor ? 'bg-stone-100 dark:bg-rwe-neutral-800/60' : ''}`
              }`}
            >
              {hasChildren ? (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(node)
                  }}
                  className={`flex size-3.5 shrink-0 items-center justify-center ${muted}`}
                >
                  {open ? <ChevronDown className="size-3" strokeWidth={1.75} /> : <ChevronRight className="size-3" strokeWidth={1.75} />}
                </button>
              ) : (
                <span className="size-3.5 shrink-0" />
              )}
              {node.kind === 'component' ? (
                <>
                  <Component className="size-3 shrink-0 text-brand-blue-500 dark:text-energy-green-500" strokeWidth={1.75} />
                  <span className="max-w-full shrink-0 truncate font-medium">{node.name}</span>
                </>
              ) : (
                <span className={`max-w-full shrink-0 truncate font-mono text-[11px] ${muted}`}>{node.name}</span>
              )}
              {/* The file gives way first, the name stays readable */}
              {node.call && <span className={`ml-auto min-w-0 truncate pl-2 text-right font-mono text-[10px] ${muted}`}>{callFile(node)}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
