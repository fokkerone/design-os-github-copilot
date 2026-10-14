import { test as base } from '@playwright/test'
import { FakeOpenCode } from '../tests/helpers/fake-opencode'

/** A fake `opencode serve` on port 4196, which the Vite proxy targets in e2e, fresh for every test */
export const test = base.extend<{ opencode: FakeOpenCode }>({
  opencode: // eslint-disable-next-line no-empty-pattern
  async ({}, provide) => {
    const fake = await new FakeOpenCode().start(4196)
    await provide(fake)
    await fake.stop()
  },
})
export { expect } from '@playwright/test'
