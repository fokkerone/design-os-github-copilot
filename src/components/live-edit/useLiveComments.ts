import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { changeComment, loadComments, type CommentChange } from '@/lib/comments/client'
import type { DesignComment } from '@/lib/comments/format'
import { buildCommentMessage } from '@/lib/comments/message'
import { useLiveEdit } from '@/lib/live-edit/live-edit-context'
import { useWikiRevision } from '@/lib/use-wiki-revision'
import { readMessage, type FromPreview, type ToPreview } from '@/lib/live-edit/protocol'
import type { LiveTarget } from '@/lib/live-edit/selection'

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

/**
 * Comments, page side: comment mode in the preview iframe, the comments of this screen from the
 * wiki (through the dev server), and one comment at a time to the chat. Returns null outside a
 * ChatProvider, like useLivePreview.
 */
export function useLiveComments(iframeRef: RefObject<HTMLIFrameElement | null>, target: LiveTarget) {
  const live = useLiveEdit()
  const [commenting, setCommentingState] = useState(false)
  const [showResolved, setShowResolved] = useState(false)
  const [comments, setComments] = useState<DesignComment[]>([])
  const [error, setError] = useState('')
  const targetKey = target.kind === 'shell' ? 'shell' : `${target.sectionId}/${target.screenDesignName}`

  const post = useCallback(
    (message: ToPreview) => iframeRef.current?.contentWindow?.postMessage(message, window.location.origin),
    [iframeRef],
  )
  const state = useRef({ target, commenting, showResolved, comments, live })
  useEffect(() => {
    state.current = { target, commenting, showResolved, comments, live }
  })

  const refresh = useCallback(async () => {
    const result = await loadComments(state.current.target)
    if (result.ok) setComments(result.comments)
    else setError(result.error)
  }, [])

  const change = useCallback(
    async (next: CommentChange) => {
      const result = await changeComment(state.current.target, next)
      if (result.ok) {
        setComments(result.comments)
        setError('')
      } else {
        setError(result.error)
        post({ type: 'dos:comment-error', error: result.error })
      }
      return result
    },
    [post],
  )

  // The comments of this screen, and again whenever a wiki page changes (the agent marks them
  // resolved): a hot update of wiki/comments/*.md, never a page reload
  const wikiRevision = useWikiRevision()
  useEffect(() => {
    void refresh()
  }, [targetKey, wikiRevision, refresh])

  useEffect(() => {
    post({ type: 'dos:comments', items: comments, showResolved })
  }, [comments, showResolved, post])
  useEffect(() => {
    post({ type: 'dos:comment-mode', active: commenting })
  }, [commenting, post])

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      const message = readMessage<FromPreview>(event)
      if (!message) return
      const { target, commenting, showResolved, comments, live } = state.current
      if (message.type === 'dos:ready') {
        post({ type: 'dos:comments', items: comments, showResolved })
        post({ type: 'dos:comment-mode', active: commenting })
      } else if (message.type === 'dos:comment-create') {
        await change({ action: 'create', comment: message.comment })
      } else if (message.type === 'dos:comment-update') {
        await change({ action: 'update', number: message.number, patch: { text: message.text, command: message.command } })
      } else if (message.type === 'dos:comment-delete') {
        await change({ action: 'delete', number: message.number })
      } else if (message.type === 'dos:comment-send') {
        const comment = comments.find((c) => c.number === message.number)
        if (!comment || !live) return
        live.sendMessage(buildCommentMessage(comment, target, message.element, message.call))
        if (comment.status === 'open') await change({ action: 'update', number: comment.number, patch: { status: 'sent' } })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [iframeRef, post, change])

  // C toggles comment mode
  useEffect(() => {
    if (!live) return
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'c' || e.key === 'C') setCommentingState((c) => !c)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [live])

  if (!live) return null
  const open = comments.filter((c) => c.status !== 'resolved').length
  return {
    commenting,
    setCommenting: setCommentingState,
    comments,
    open,
    showResolved,
    setShowResolved,
    error,
  }
}

/** Picking and commenting both take the click in the preview: turning one on turns the other off */
export function useOneMode(picking: boolean, setPicking: (on: boolean) => void, commenting: boolean, setCommenting: (on: boolean) => void) {
  useEffect(() => {
    if (picking) setCommenting(false)
  }, [picking, setCommenting])
  useEffect(() => {
    if (commenting) setPicking(false)
  }, [commenting, setPicking])
}
