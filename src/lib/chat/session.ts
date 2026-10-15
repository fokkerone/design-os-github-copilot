/** The OpenCode session of the chat, remembered so a page reload reopens the conversation */

export const SESSION_STORAGE_KEY = 'designos:session'

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const defaultStore = (): Store | undefined => (typeof localStorage === 'undefined' ? undefined : localStorage)

export function loadSessionId(store: Store | undefined = defaultStore()): string | undefined {
  try {
    return store?.getItem(SESSION_STORAGE_KEY) || undefined
  } catch {
    return undefined
  }
}

export function saveSessionId(id: string | undefined, store: Store | undefined = defaultStore()) {
  try {
    if (id) store?.setItem(SESSION_STORAGE_KEY, id)
    else store?.removeItem(SESSION_STORAGE_KEY)
  } catch {
    /* storage unavailable: the conversation is lost on reload */
  }
}
