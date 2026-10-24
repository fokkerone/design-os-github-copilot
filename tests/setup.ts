import { afterEach, expect } from 'vitest'
// @ts-expect-error plain ESM script
import { HOOK_SCRIPT } from '../scripts/react-devtools-hook.mjs'

// DOM helpers only exist in jsdom tests; node tests (model, context, techstack) skip them
if (typeof document !== 'undefined') {
  // The DevTools hook of the dev server (Live Edit prop overrides), before anything loads react-dom.
  // React reads it from the global object, the picker from the document's window
  new Function('window', HOOK_SCRIPT)(globalThis)
  ;(window as { __DOS_REACT_RENDERERS__?: unknown }).__DOS_REACT_RENDERERS__ = (globalThis as { __DOS_REACT_RENDERERS__?: unknown }).__DOS_REACT_RENDERERS__
  const matchers = await import('@testing-library/jest-dom/matchers')
  const { cleanup } = await import('@testing-library/react')
  expect.extend(matchers)
  afterEach(() => cleanup())

  // jsdom lacks layout APIs that scrolling containers (chat viewport) rely on
  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  }
  globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver
  globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver
  Element.prototype.scrollTo ??= function () {}
  Element.prototype.scrollIntoView ??= function () {}
  window.matchMedia ??= ((q: string) => ({
    matches: /min-width/.test(q), media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
