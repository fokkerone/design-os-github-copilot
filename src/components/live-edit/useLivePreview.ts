import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useLiveEdit } from '@/lib/live-edit/live-edit-context'
import { readMessage, type FromPreview, type ToPreview } from '@/lib/live-edit/protocol'
import type { LiveSelection, LiveTarget } from '@/lib/live-edit/selection'

export const sameTarget = (a: LiveTarget, b: LiveTarget) =>
  a.kind === 'shell' ? b.kind === 'shell' : b.kind === 'screen' && a.sectionId === b.sectionId && a.screenDesignName === b.screenDesignName

/** CSS and text the preview shows for the inspector edits of a selection */
export function previewOf(selection: LiveSelection): { style: Record<string, string>; text?: string } {
  const style: Record<string, string> = {}
  let text: string | undefined
  for (const edit of selection.edits) {
    if (edit.property === 'content') text = edit.to
    else Object.assign(style, edit.css)
  }
  return { style, text }
}

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
          post({ type: 'dos:select', src: selection.element.src, index: selection.element.index })
          const { style, text } = previewOf(selection)
          if (Object.keys(style).length > 0 || text !== undefined) post({ type: 'dos:preview', style, text })
          post({ type: 'dos:guides', active: guides })
        }
      } else if (message.type === 'dos:picked') {
        live?.select({ target, element: message.element, edits: [] })
        setPicking(false)
        live?.focusComposer()
      } else if (message.type === 'dos:cancel') {
        setPicking(false)
      } else if (message.type === 'dos:updated' && selection && live?.sent) {
        // The agent's change arrived through HMR: the real result replaces the preview
        post({ type: 'dos:deselect' })
        live.select(null)
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
    const { style, text } = previewOf(selection)
    if (Object.keys(style).length === 0 && text === undefined) post({ type: 'dos:reset' })
    else post({ type: 'dos:preview', style, text })
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
  return {
    picking,
    setPicking,
    /** The selection made in this preview, while it is still a draft for the chat */
    selection: selection && !live.sent ? selection : null,
    setEdits: live.setEdits,
    dismiss: () => live.select(null),
    focusComposer: live.focusComposer,
    apply: live.apply,
    guides,
    setGuides,
  }
}
