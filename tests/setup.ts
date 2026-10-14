import { afterEach, expect } from 'vitest'

// DOM helpers only exist in jsdom tests; node tests (model, context, techstack) skip them
if (typeof document !== 'undefined') {
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
    matches: false, media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
