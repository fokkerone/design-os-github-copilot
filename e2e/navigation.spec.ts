import { test, expect, hasSampleProject } from './fixtures'

const routes: [string, RegExp, string][] = [
  ['Vision', /prototype\/vision$/, 'Vision'],
  ['Roadmap', /prototype\/roadmap$/, 'Roadmap'],
  ['Sections', /prototype\/sections$/, 'Sections'],
  ['Export', /prototype\/export$/, 'Export'],
  ['Personas', /\/personas$/, 'Personas'],
  ['User Flows', /\/flows$/, 'User Flows'],
  ['Design System', /\/design-system$/, 'Design System'],
  ['Tech Stack', /\/techstack$/, 'Tech Stack'],
  ['Wiki', /\/wiki$/, 'Wiki'],
]

test.describe('navigation', () => {
  test('every entry opens its page and is marked active', async ({ page, opencode }) => {
    void opencode
    await page.goto('/prototype/vision')
    const nav = page.getByRole('navigation', { name: 'Main' })
    for (const [label, url, title] of routes) {
      await nav.getByRole('link', { name: new RegExp(`^${label}`) }).click()
      await expect(page).toHaveURL(url)
      await expect(nav.getByRole('link', { name: new RegExp(`^${label}`) })).toHaveAttribute('aria-current', 'page')
      await expect(page.locator('header h1')).toHaveText(title)
    }
  })

  test('the chat stays when the page changes', async ({ page, opencode }) => {
    opencode.reply({ chunks: ['still here'] })
    await page.goto('/prototype/vision')
    const input = page.getByRole('textbox', { name: 'Message the agent' })
    await input.fill('hello')
    await input.press('Enter')
    await expect(page.getByText('still here')).toBeVisible()
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Tech Stack' }).click()
    await expect(page.getByText('still here')).toBeVisible()
    await expect(page.getByText('hello', { exact: true })).toBeVisible()
  })

  test('Roadmap and Data Shape, Tokens and Shell are tabs', async ({ page, opencode }) => {
    void opencode
    await page.goto('/prototype/roadmap')
    await page.getByRole('link', { name: 'Data Shape' }).click()
    await expect(page).toHaveURL(/roadmap\/data-shape$/)
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Roadmap/ })).toHaveAttribute('aria-current', 'page')
    await page.goto('/design-system')
    await page.getByRole('link', { name: 'Shell', exact: true }).click()
    await expect(page).toHaveURL(/design-system\/shell$/)
  })

  test('old routes redirect, unknown routes say so', async ({ page, opencode }) => {
    void opencode
    for (const [from, to] of [
      ['/sections', /prototype\/sections$/],
      ['/data-shape', /prototype\/roadmap\/data-shape$/],
      ['/design', /design-system$/],
      ['/shell/design', /design-system\/shell$/],
      ['/export', /prototype\/export$/],
      ['/clickdummy', /prototype\/preview$/],
    ] as const) {
      await page.goto(from)
      await expect(page, from).toHaveURL(to)
    }
    await page.goto('/nope')
    await expect(page.getByText('Page not found')).toBeVisible()
    await page.getByRole('link', { name: 'Back to Vision' }).click()
    await expect(page).toHaveURL(/prototype\/vision$/)
  })

  test('fullscreen previews render without the shell', async ({ page, opencode }) => {
    void opencode
    await page.goto('/design-system/shell/fullscreen')
    await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0)
    await page.goto('/prototype/preview/fullscreen')
    await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0)
    if (!hasSampleProject) await expect(page.getByText(/not been assembled/i)).toBeVisible()
  })

  test('empty project shows the start card and starts the step in the chat', async ({ page, opencode }) => {
    test.skip(hasSampleProject, 'needs an empty project')
    opencode.reply({ chunks: ['Tell me about your product'] })
    await page.goto('/prototype/vision')
    await expect(page.getByText('No product defined yet')).toBeVisible()
    await page.getByRole('button', { name: 'Start with agent' }).click()
    await expect.poll(() => opencode.prompts.at(0)?.text).toContain('.claude/commands/design-os/product-vision.md')
    await expect(page.getByText('Tell me about your product')).toBeVisible()
  })
})
