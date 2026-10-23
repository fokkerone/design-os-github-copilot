import { useEffect } from 'react'
import { createPicker } from '@/lib/live-edit/picker'
import { readMessage, type FromPreview, type ToPreview } from '@/lib/live-edit/protocol'

/**
 * Live Edit, preview side: the fullscreen preview runs the picker when it is embedded in a
 * step page, and reports HMR updates so the page drops its inspector preview once the agent's
 * edit has arrived. Opened on its own (new tab, screenshots) it does nothing.
 */
export function useLivePicker() {
  useEffect(() => {
    const parent = window.parent
    if (parent === window) return
    const post = (message: FromPreview) => parent.postMessage(message, window.location.origin)
    const picker = createPicker(document, post)

    const onMessage = (event: MessageEvent) => {
      if (event.source !== parent) return
      const message = readMessage<ToPreview>(event)
      if (!message) return
      if (message.type === 'dos:pick') picker.setActive(message.active)
      else if (message.type === 'dos:preview') picker.preview(message.style, message.text)
      else if (message.type === 'dos:reset') picker.reset()
      else if (message.type === 'dos:select') picker.select(message.src, message.index)
      else if (message.type === 'dos:deselect') picker.deselect()
      else if (message.type === 'dos:guides') picker.setGuides(message.active)
    }
    window.addEventListener('message', onMessage)
    post({ type: 'dos:ready' })

    const onUpdate = () => post({ type: 'dos:updated' })
    import.meta.hot?.on('vite:afterUpdate', onUpdate)

    return () => {
      window.removeEventListener('message', onMessage)
      import.meta.hot?.off('vite:afterUpdate', onUpdate)
      picker.destroy()
    }
  }, [])
}
