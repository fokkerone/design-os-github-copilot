import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useLiveEdit } from '@/lib/live-edit/live-edit-context'
import { readMessage, type FromPreview, type ToPreview, type TreeNode } from '@/lib/live-edit/protocol'
import type { LiveSelection, LiveTarget } from '@/lib/live-edit/selection'
import { writePropsToSource } from '@/lib/live-edit/write-props'

export const sameTarget = (a: LiveTarget, b: LiveTarget) =>
  a.kind === 'shell' ? b.kind === 'shell' : b.kind === 'screen' && a.sectionId === b.sectionId && a.screenDesignName === b.screenDesignName

/** CSS and text the preview shows for the inspector edits of a selection */
export function previewOf(selection: LiveSelection): { style: Record<string, string>; text?: string; props?: Record<string, unknown> } {
  const style: Record<string, string> = {}
  let text: string | undefined
  let props: Record<string, unknown> | undefined
  for (const edit of selection.edits) {
    if (edit.prop) props = { ...props, [edit.prop.name]: edit.prop.value }
    else if (edit.property === 'content') text = edit.to
    else Object.assign(style, edit.css)
  }
  return { style, text, ...(props && { props }) }
}

const hasPreview = ({ style, text, props }: ReturnType<typeof previewOf>) => Object.keys(style).length > 0 || text !== undefined || !!props

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

/**
 * Live Edit, page side: drives the picker in the preview iframe and keeps it in step with the
 * selection the chat holds. Returns null outside a ChatProvider (no chat, nothing to send to).
 */
export function useLivePreview(iframeRef: RefObject<HTMLIFrameElement | null>, target: LiveTarget) {
  const live = useLiveEdit()
  const [picking, setPicking] = useState(false)
  // "Show paddings and margins" in the inspector
  const [guides, setGuides] = useState(false)
  // The component tree the preview sends, for the Layers tab
  const [nodes, setNodes] = useState<TreeNode[]>([])
  // A selection made in the tree keeps the focus in the tree, a click in the preview moves it to the chat
  const fromTree = useRef(false)
  // "Write to source" ran: the next HMR update brings the new source props
  const wrote = useRef(false)
  const selection = live?.selection && sameTarget(live.selection.target, target) ? live.selection : null

  const post = useCallback(
    (message: ToPreview) => iframeRef.current?.contentWindow?.postMessage(message, window.location.origin),
    [iframeRef],
  )

  // The listener reads the latest state through a ref, so it is registered once
  const state = useRef({ live, picking, selection, target, guides })
  useEffect(() => {
    state.current = { live, picking, selection, target, guides }
  })

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      const message = readMessage<FromPreview>(event)
      if (!message) return
      const { live, picking, selection, target, guides } = state.current
      if (message.type === 'dos:ready') {
        // The iframe (re)loaded: it forgot the picker state and the preview
        post({ type: 'dos:pick', active: picking })
        if (selection && live?.sent) {
          // A full reload after the request went out is the agent's change arriving
          live.select(null)
        } else if (selection) {
          // A draft keeps its inspector edits: select the element again and show them
          post({ type: 'dos:select', src: selection.element.src, index: selection.element.index, kind: selection.element.kind })
          const preview = previewOf(selection)
          if (hasPreview(preview)) post({ type: 'dos:preview', ...preview })
          post({ type: 'dos:guides', active: guides })
        }
      } else if (message.type === 'dos:picked') {
        live?.select({ target, element: message.element, edits: [] })
        setPicking(false)
        if (!fromTree.current) live?.focusComposer()
        fromTree.current = false
      } else if (message.type === 'dos:tree') {
        setNodes(message.nodes)
      } else if (message.type === 'dos:cancel') {
        setPicking(false)
      } else if (message.type === 'dos:updated' && selection && live?.sent) {
        // The agent's change arrived through HMR: the real result replaces the preview
        post({ type: 'dos:deselect', keep: true })
        live.select(null)
      } else if (message.type === 'dos:updated' && selection && wrote.current) {
        // What "Write to source" wrote arrived: the inspector shows the new source props
        wrote.current = false
        fromTree.current = true
        post({ type: 'dos:describe' })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [iframeRef, post])

  useEffect(() => {
    post({ type: 'dos:pick', active: picking })
  }, [picking, post])

  useEffect(() => {
    post({ type: 'dos:guides', active: guides && !!selection })
  }, [guides, selection, post])

  // Inspector edits show in the preview right away, dropping the selection clears them
  useEffect(() => {
    if (!selection) {
      post({ type: 'dos:deselect' })
      return
    }
    const preview = previewOf(selection)
    if (!hasPreview(preview)) post({ type: 'dos:reset' })
    else post({ type: 'dos:preview', ...preview })
  }, [selection, post])

  // V toggles the picker, Escape ends it
  useEffect(() => {
    if (!live) return
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'v' || e.key === 'V') setPicking((p) => !p)
      else if (e.key === 'Escape') setPicking(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [live])

  if (!live) return null
  const draft = selection && !live.sent ? selection : null
  const picked = draft?.element
  return {
    nodes,
    /** The tree node of the selection, found again in every new tree */
    selectedNodeId: picked
      ? nodes.find((n) => n.kind === (picked.kind ?? 'element') && (n.kind === 'component' ? n.call : n.src) === picked.src && n.index === (picked.index ?? 0))?.id ?? null
      : null,
    hoverNode: (id: string | null) => post({ type: 'dos:hover', id }),
    /** Writes the prop edits into the JSX at the call site, without the agent */
    writeToSource: async () => {
      if (!draft) return { ok: false as const, error: 'Nothing selected' }
      const result = await writePropsToSource(draft)
      if (result.ok) {
        wrote.current = true
        // The source has the edits now: the preview keeps them until HMR renders the source
        post({ type: 'dos:commit' })
        live.setEdits([])
      }
      return result
    },
    record: live.record,
    selectNode: (id: string) => {
      fromTree.current = true
      post({ type: 'dos:select-node', id })
    },
    picking,
    setPicking,
    /** The selection made in this preview, while it is still a draft for the chat */
    selection: draft,
    setEdits: live.setEdits,
    dismiss: () => live.select(null),
    focusComposer: live.focusComposer,
    apply: live.apply,
    guides,
    setGuides,
  }
}
