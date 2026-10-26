import { useSyncExternalStore } from 'react'
import { getWikiRevision, subscribeWikiFiles } from './wiki-files.ts'

/** Re-renders the caller when a wiki page is added, changed or removed (hot update, no reload) */
export function useWikiRevision(): number {
  return useSyncExternalStore(subscribeWikiFiles, getWikiRevision, getWikiRevision)
}
