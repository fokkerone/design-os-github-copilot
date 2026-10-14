import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/lib/paths'

// The assembled clickdummy is written by the clickdummy step; it may not exist yet
const files = import.meta.glob('/src/clickdummy/ClickdummyApp.tsx') as Record<
  string,
  () => Promise<{ default?: React.ComponentType; ClickdummyApp?: React.ComponentType }>
>

// Created once at module level, so its identity is stable across renders
const load = files['/src/clickdummy/ClickdummyApp.tsx']
const App = load
  ? lazy(async () => {
      const mod = await load()
      return { default: (mod.default ?? mod.ClickdummyApp) as React.ComponentType }
    })
  : null

/** The assembled clickdummy, outside the app shell */
export function ClickdummyFullscreen() {
  if (!App) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-sm text-stone-600 dark:text-rwe-neutral-400">
        <p>The clickdummy has not been assembled yet.</p>
        <Link to={paths.preview} className="underline underline-offset-2">
          Back to the prototype
        </Link>
      </div>
    )
  }
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-stone-500">Loading...</div>}>
      <App />
    </Suspense>
  )
}
