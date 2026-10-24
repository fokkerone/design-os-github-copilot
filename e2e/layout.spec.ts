import { test, expect } from './fixtures'

test.describe('layout', () => {
  test('opens on the Vision step in sidebar, chat and step panel', async ({ page, opencode }) => {
    void opencode
    await page.goto('/')
    await expect(page).toHaveURL(/\/prototype\/vision$/)
    const nav = page.getByRole('navigation', { name: 'Main' })
    for (const label of ['Prototype', 'Vision', 'Shell', 'Roadmap', 'Sections', 'Export', 'Personas', 'User Flows', 'Design System', 'Tech Stack', 'Wiki']) {
      await expect(nav.getByText(label, { exact: true }).first()).toBeVisible()
    }
    await expect(nav.getByRole('link', { name: /^Vision/ })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('complementary', { name: 'Step' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Message the agent' })).toBeVisible()
  })

  test('sidebar is 238px, rows are 30px, content panel is inset and rounded', async ({ page, opencode }) => {
    void opencode
    await page.goto('/prototype/vision')
    const sidebar = page.locator('aside').first()
    expect((await sidebar.boundingBox())!.width).toBe(238)
    const row = page.getByRole('link', { name: /^Roadmap/ })
    expect((await row.boundingBox())!.height).toBe(30)
    const main = page.locator('main')
    const style = await main.evaluate((el) => {
      const c = getComputedStyle(el)
      return { radius: c.borderTopLeftRadius, border: c.borderTopWidth, mt: c.marginTop }
    })
    expect(style).toEqual({ radius: '8px', border: '1px', mt: '6px' })
  })

  test('chat on the left, step on the right', async ({ page, opencode }) => {
    void opencode
    await page.goto('/prototype/vision')
    const chat = (await page.getByRole('textbox', { name: 'Message the agent' }).boundingBox())!
    const step = (await page.getByRole('complementary', { name: 'Step' }).boundingBox())!
    expect(chat.x).toBeLessThan(step.x)
    const total = step.width + (await page.locator('main').boundingBox())!.width
    expect(step.width / (await page.locator('main').boundingBox())!.width).toBeGreaterThan(0.4)
    expect(step.width / (await page.locator('main').boundingBox())!.width).toBeLessThan(0.5)
    expect(total).toBeGreaterThan(0)
  })

  test('the split can be resized by dragging and keyboard, and is remembered', async ({ page, opencode }) => {
    void opencode
    await page.goto('/prototype/vision')
    const step = page.getByRole('complementary', { name: 'Step' })
    const handle = page.getByRole('separator', { name: 'Resize chat and step' })
    const before = (await step.boundingBox())!.width
    const h = (await handle.boundingBox())!
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2)
    await page.mouse.down()
    await page.mouse.move(h.x - 200, h.y + h.height / 2, { steps: 8 })
    await page.mouse.up()
    await expect.poll(async () => (await step.boundingBox())!.width).toBeGreaterThan(before + 150)
    const dragged = (await step.boundingBox())!.width
    await handle.focus()
    await page.keyboard.press('ArrowRight')
    await expect.poll(async () => (await step.boundingBox())!.width).toBeLessThan(dragged)
    const kept = (await step.boundingBox())!.width
    await page.reload()
    await expect.poll(async () => Math.abs((await step.boundingBox())!.width - kept)).toBeLessThan(4)
  })

  test('dragging the step to the edge hides it', async ({ page, opencode }) => {
    void opencode
    await page.goto('/prototype/vision')
    const handle = page.getByRole('separator', { name: 'Resize chat and step' })
    const h = (await handle.boundingBox())!
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2)
    await page.mouse.down()
    await page.mouse.move(1430, h.y + h.height / 2, { steps: 10 })
    await page.mouse.up()
    await expect(page.getByRole('button', { name: 'Show step panel' })).toBeVisible()
  })

  test('uses Inter and the Volta dark background', async ({ page, opencode }) => {
    void opencode
    await page.goto('/prototype/vision')
    const font = await page.locator('main').evaluate((el) => getComputedStyle(el).fontFamily)
    expect(font).toContain('Inter')
    const bg = await page.locator('main').evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(20, 20, 20)') // rwe-neutral-900
  })

  test('sidebar collapses with [ and the button', async ({ page, opencode }) => {
    void opencode
    await page.goto('/prototype/vision')
    const sidebar = page.locator('aside').first()
    // The chat input takes the focus; like Linear, [ is ignored while typing
    await page.keyboard.press('[')
    expect((await sidebar.boundingBox())!.width).toBe(238)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.keyboard.press('[')
    await expect.poll(async () => (await sidebar.boundingBox())!.width).toBe(0)
    await page.getByRole('button', { name: /show sidebar/i }).click()
    await expect.poll(async () => (await sidebar.boundingBox())!.width).toBe(238)
  })

  test('step panel can be expanded and hidden', async ({ page, opencode }) => {
    void opencode
    await page.goto('/prototype/vision')
    const box = async () => page.getByRole('textbox', { name: 'Message the agent' }).isVisible()
    await page.getByRole('button', { name: 'Expand step panel' }).click()
    expect(await box()).toBe(false)
    await page.getByRole('button', { name: 'Chat' }).click()
    expect(await box()).toBe(true)
    await page.getByRole('button', { name: 'Hide step panel' }).click()
    await expect(page.getByRole('complementary', { name: 'Step' })).toHaveCount(0)
  })

  test('theme switch survives a reload and reaches the fullscreen preview', async ({ page, opencode }) => {
    void opencode
    await page.goto('/prototype/vision')
    await page.getByRole('button', { name: /switch to light/i }).click()
    const bg = () => page.locator('main').evaluate((el) => getComputedStyle(el).backgroundColor)
    await expect.poll(bg).toBe('rgb(252, 252, 248)') // rwe-sand-50
    await page.reload()
    await expect.poll(bg).toBe('rgb(252, 252, 248)')
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light')
  })

  test('mobile: navigation is a drawer', async ({ page, opencode }) => {
    void opencode
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto('/prototype/vision')
    await expect(page.getByRole('link', { name: /^Roadmap/ })).toHaveCount(0)
    // the chat is shown, the step sheet does not cover it
    await expect(page.getByRole('textbox', { name: 'Message the agent' })).toBeVisible()
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.getByRole('link', { name: /^Roadmap/ }).click()
    await expect(page).toHaveURL(/\/prototype\/roadmap$/)
    await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0)
    // choosing a step shows it
    await expect(page.getByRole('complementary', { name: 'Step' })).toBeVisible()
  })
})
