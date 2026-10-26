/**
 * The raw wiki/ files, kept apart from the loader so a new or changed page is a hot update
 * instead of a page reload. Comments in the preview create wiki/comments/*.md while the user
 * is working; a glob that gains a file would otherwise send Vite up to main.tsx and reload
 * the whole app.
 *
 * This module accepts its own updates. Every version writes its files into one store shared
 * through `import.meta.hot.data`, so importers that still hold the first version read the new
 * files, and subscribers (useWikiRevision) re-render.
 */

const files = import.meta.glob(
  ['/wiki/**/*.md', '!/wiki/_templates/**', '!/wiki/raw/**', '!/wiki/_archives/**', '!/wiki/.obsidian/**'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

interface WikiStore {
  files: Record<string, string>
  revision: number
  listeners: Set<() => void>
}

// Vitest's hot context has no data
const hot = import.meta.hot?.data ? import.meta.hot : undefined
const store: WikiStore = hot?.data.store ?? { files, revision: 0, listeners: new Set() }
store.files = files

if (hot) {
  hot.data.store = store
  hot.accept(() => {
    store.revision += 1
    for (const listener of store.listeners) listener()
  })
}

/** Path ("/wiki/flows/x.md") → raw markdown */
export function getWikiFiles(): Record<string, string> {
  return store.files
}

/** Counts hot updates of the wiki; changes whenever a file is added, changed or removed */
export function getWikiRevision(): number {
  return store.revision
}

export function subscribeWikiFiles(listener: () => void): () => void {
  store.listeners.add(listener)
  return () => store.listeners.delete(listener)
}
