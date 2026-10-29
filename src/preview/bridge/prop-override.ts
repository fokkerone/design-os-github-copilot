/**
 * Live Edit: changes a component's props in the running preview, like the React DevTools do.
 * React's dev renderer hands `overrideProps` to the DevTools hook; scripts/react-devtools-hook.mjs
 * keeps it on `window.__DOS_REACT_RENDERERS__`. Nothing is written: the inspector shows the
 * result, the agent writes the props to the source.
 *
 * An override lasts until the component that renders the element renders again (its JSX hands
 * in the source props). The picker applies the overrides again after every render, and puts the
 * source values back when the inspector drops them: a plain re-render of the parent would keep
 * them, React reuses the props of an element that did not change.
 */
import type { Fiber } from './component-tree'

interface Renderer {
  overrideProps?: (fiber: Fiber, path: string[], value: unknown) => void
}

/** The renderer that can override props, null without the hook (production build, tests without it) */
export function propRenderer(win: Window | null): Renderer | null {
  const renderers = (win as (Window & { __DOS_REACT_RENDERERS__?: Renderer[] }) | null)?.__DOS_REACT_RENDERERS__ ?? []
  return renderers.find((r) => typeof r.overrideProps === 'function') ?? null
}

/** Sets every override the fiber does not show yet (undefined removes the prop); true when it changed one */
export function applyOverrides(renderer: Renderer, fiber: Fiber, overrides: Record<string, unknown>): boolean {
  const props = fiber.memoizedProps ?? {}
  const next: Record<string, unknown> = { ...props }
  let changed = false
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined ? props[key] === undefined : props[key] === value) continue
    if (value === undefined) delete next[key]
    else next[key] = value
    changed = true
  }
  // One override with the whole props (empty path): each call starts from the rendered props,
  // so a second call per prop would undo the first
  if (changed) renderer.overrideProps?.(fiber, [], next)
  return changed
}

/** The values an override replaces, to put back later (undefined: the prop was not set) */
export function originalsOf(fiber: Fiber, keys: string[], known: Record<string, unknown> = {}): Record<string, unknown> {
  const props = fiber.memoizedProps ?? {}
  const out = { ...known }
  for (const key of keys) if (!(key in out)) out[key] = props[key]
  return out
}
