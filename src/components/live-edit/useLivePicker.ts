import { useEffect } from 'react'
import { createPicker } from '@/lib/live-edit/picker'
import { createCommentsOverlay } from '@/lib/live-edit/comments-overlay'
import { readMessage, type FromPreview, type ToPreview } from '@/lib/live-edit/protocol'

/**
 * Live Edit, preview side: the fullscreen preview runs the picker and the comments overlay when it is embedded in a
 * step page, and reports HMR updates so the page drops its inspector preview once the agent's
 * edit has arrived. Opened on its own (new tab, screenshots) it does nothing.
 */
export function useLivePicker() {
  useEffect(() => {
    const parent = window.parent
    if (parent === window) return
    const post = (message: FromPreview) => parent.postMessage(message, window.location.origin)
    const picker = createPicker(document, post)
    const comments = createCommentsOverlay(document, post)

    const onMessage = (event: MessageEvent) => {
      if (event.source !== parent) return
      const message = readMessage<ToPreview>(event)
      if (!message) return
      if (message.type === 'dos:pick') picker.setActive(message.active)
      else if (message.type === 'dos:preview') picker.preview(message.style, message.text, message.props)
      else if (message.type === 'dos:reset') picker.reset()
      else if (message.type === 'dos:select') picker.select(message.src, message.index, message.kind)
      else if (message.type === 'dos:hover') picker.hover(message.id)
      else if (message.type === 'dos:select-node') picker.selectNode(message.id)
      else if (message.type === 'dos:commit') picker.commit()
      else if (message.type === 'dos:describe') picker.describeAgain()
      else if (message.type === 'dos:deselect') picker.deselect(message.keep)
      else if (message.type === 'dos:guides') picker.setGuides(message.active)
      else if (message.type === 'dos:comment-mode') comments.setActive(message.active)
      else if (message.type === 'dos:comments') comments.setComments(message.items, message.showResolved)
      else if (message.type === 'dos:comment-error') comments.showError(message.error)
    }
    window.addEventListener('message', onMessage)
    post({ type: 'dos:ready' })
    picker.sendTree()

    const onUpdate = () => post({ type: 'dos:updated' })
    import.meta.hot?.on('vite:afterUpdate', onUpdate)

    return () => {
      window.removeEventListener('message', onMessage)
      import.meta.hot?.off('vite:afterUpdate', onUpdate)
      picker.destroy()
      comments.destroy()
    }
  }, [])
}
