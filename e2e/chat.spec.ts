import { test, expect } from './fixtures'

const input = (page: import('@playwright/test').Page) => page.getByRole('textbox', { name: 'Message the agent' })

test.describe('chat', () => {
  test('sends a message and streams markdown back', async ({ page, opencode }) => {
    opencode.reply({ chunks: ['A **bold', '** answer'] })
    await page.goto('/prototype/vision')
    await input(page).fill('ping')
    await input(page).press('Enter')
    await expect(page.locator('strong', { hasText: 'bold' })).toBeVisible()
    expect(opencode.prompts[0].text).toBe('ping')
  })

  test('the chat icon and the avatar pulse while the agent works', async ({ page, opencode }) => {
    opencode.reply({ chunks: ['one', ' two', ' three', ' four'], delayMs: 500 })
    await page.goto('/prototype/vision')
    await input(page).fill('go')
    await input(page).press('Enter')
    const icon = page.getByRole('button', { name: 'Chat, agent is working' })
    await expect(icon).toBeVisible()
    await expect(icon.locator('svg')).toHaveClass(/animate-pulse/)
    await expect(page.getByRole('status', { name: 'Agent is working' })).toBeVisible()
    await expect(page.getByText('one two three four')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Chat', exact: true })).toBeVisible()
  })

  test('a typed slash command becomes the step instruction', async ({ page, opencode }) => {
    await page.goto('/prototype/vision')
    await input(page).fill('/design-os:product-vision Wind parks')
    await input(page).press('Enter')
    await expect.poll(() => opencode.prompts.at(0)?.text).toBe(
      'Follow the instructions in .claude/commands/design-os/product-vision.md.\n\nWind parks',
    )
  })

  test('agent questions are answered in the chat and the agent continues', async ({ page, opencode }) => {
    opencode.reply({ question: [{ question: 'How do you want to start?', header: 'Start', options: [{ label: 'Describe it' }, { label: 'Use a file' }] }], chunks: ['Great, continuing'] })
    await page.goto('/prototype/vision')
    await input(page).fill('go')
    await input(page).press('Enter')
    await expect(page.getByText('How do you want to start?')).toBeVisible()
    await expect(page.getByRole('status', { name: /waiting for your answer/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send answer' })).toBeDisabled()
    await page.getByRole('radio', { name: 'Use a file' }).check()
    await page.getByRole('button', { name: 'Send answer' }).click()
    await expect(page.getByText('Great, continuing')).toBeVisible()
    expect(opencode.answers).toEqual([[['Use a file']]])
  })

  test('Stop aborts a running answer', async ({ page, opencode }) => {
    opencode.reply({ chunks: ['a', 'b', 'c', 'd', 'e', 'f'], delayMs: 600 })
    await page.goto('/prototype/vision')
    await input(page).fill('slow')
    await input(page).press('Enter')
    await page.getByRole('button', { name: 'Stop' }).click()
    await expect.poll(() => opencode.aborts.length).toBe(1)
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
  })

  test('reopens the conversation after a reload', async ({ page, opencode }) => {
    opencode.reply({ chunks: ['remembered answer'] })
    await page.goto('/prototype/vision')
    await input(page).fill('keep this')
    await input(page).press('Enter')
    await expect(page.getByText('remembered answer')).toBeVisible()
    await page.reload()
    await expect(page.getByText('remembered answer')).toBeVisible()
    await expect(page.getByText('keep this', { exact: true })).toBeVisible()
  })

  test('New chat clears the conversation', async ({ page, opencode }) => {
    opencode.reply({ chunks: ['old one'] })
    await page.goto('/prototype/vision')
    await input(page).fill('first')
    await input(page).press('Enter')
    await expect(page.getByText('old one')).toBeVisible()
    await page.getByRole('button', { name: 'New chat' }).click()
    await expect(page.getByText('old one')).toHaveCount(0)
    await expect(page.getByText('Ask the agent')).toBeVisible()
  })

  test('lists the models of the server and sends the chosen one', async ({ page, opencode }) => {
    await page.goto('/prototype/vision')
    const picker = page.getByRole('combobox', { name: 'Model' })
    await expect(picker.locator('option')).toHaveCount(4)
    await picker.selectOption('rwe-factory-gpt/gpt-6-sol-factory')
    await input(page).fill('hi')
    await input(page).press('Enter')
    await expect.poll(() => opencode.prompts.at(0)?.model).toEqual({ providerID: 'rwe-factory-gpt', modelID: 'gpt-6-sol-factory' })
  })

  test('shows how to start OpenCode when it is not running', async ({ page }) => {
    await page.goto('/prototype/vision')
    await expect(page.getByRole('status').filter({ hasText: 'opencode serve --port 4096' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start with agent' })).toBeDisabled()
  })
})
