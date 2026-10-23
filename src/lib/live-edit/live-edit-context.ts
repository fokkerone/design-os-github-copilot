import { createContext, useContext } from 'react'
import type { LiveEdit, LiveSelection } from './selection'

/**
 * The element picked for Live Edit, shared by the preview page (picker, inspector) and the chat
 * composer (context chip). Provided next to the chat runtime by ChatProvider.
 */
export interface LiveEditContextValue {
  selection: LiveSelection | null
  /** True once the change request went to the agent: the chip is gone, the preview waits for the agent's edit */
  sent: boolean
  /** A new pick (or null to drop it) */
  select: (selection: LiveSelection | null) => void
  setEdits: (edits: LiveEdit[]) => void
  markSent: () => void
  /** Moves the focus to the chat input, where the user describes the change */
  focusComposer: () => void
  /** Sends the selection with its inspector edits to the agent, which writes them to the source */
  apply: () => void
}

/** null outside a ChatProvider: the previews then offer no picker */
export const LiveEditContext = createContext<LiveEditContextValue | null>(null)
export const useLiveEdit = () => useContext(LiveEditContext)
