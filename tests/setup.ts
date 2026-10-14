import { afterEach, expect } from 'vitest'

// DOM helpers only exist in jsdom tests; node tests (model, context, techstack) skip them
if (typeof document !== 'undefined') {
  const matchers = await import('@testing-library/jest-dom/matchers')
  const { cleanup } = await import('@testing-library/react')
  expect.extend(matchers)
  afterEach(() => cleanup())
}
