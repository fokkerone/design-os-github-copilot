// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatDock } from '@/components/chat/ChatDock'
import { FakeOpenCode } from '../helpers/fake-opencode'

let fake: FakeOpenCode
beforeEach(async () => {
  localStorage.clear()
  fake = await new FakeOpenCode().start()
})
afterEach(async () => {
  await fake.stop()
})

const input = () => screen.getByRole('textbox', { name: /message the agent/i })

describe('ChatDock with an OpenCode server', () => {
  it('sends the prompt to a new session and streams the answer', async () => {
    fake.reply({ chunks: ['A **po', 'ng** back'] })
    render(<ChatDock baseUrl={fake.url} />)
    await userEvent.type(input(), 'ping{Enter}')

    expect(await screen.findByText('pong', { selector: 'strong' }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText('ping')).toBeInTheDocument()
    expect(fake.prompts).toHaveLength(1)
    expect(fake.prompts[0].text).toBe('ping')
    expect(fake.requests).toContain('POST /session')
    expect(fake.unhandled).toEqual([])
  }, 15000)

  it('stops a running answer', async () => {
    fake.reply({ chunks: ['working', ' on it', ' still', ' going'], delayMs: 400 })
    render(<ChatDock baseUrl={fake.url} />)
    await userEvent.type(input(), 'slow{Enter}')
    await userEvent.click(await screen.findByRole('button', { name: 'Stop' }, { timeout: 5000 }))
    await waitFor(() => expect(fake.aborts).toHaveLength(1))
  }, 15000)

  it('shows how to start OpenCode when the server is down', async () => {
    const url = fake.url
    await fake.stop()
    render(<ChatDock baseUrl={url} />)
    expect(await screen.findByRole('status', {}, { timeout: 5000 })).toHaveTextContent('opencode serve --port 4096')
    // restart so afterEach can stop cleanly
    fake = await new FakeOpenCode().start()
  }, 15000)

  it('shows no banner while the server is up', async () => {
    render(<ChatDock baseUrl={fake.url} />)
    await waitFor(() => expect(fake.requests).toContain('GET /global/health'))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('model choice', () => {
  const picker = () => screen.getByRole('combobox', { name: /model/i })

  it('lists the models of the server and starts on the server default', async () => {
    render(<ChatDock baseUrl={fake.url} />)
    const select = await screen.findByRole('combobox', { name: /model/i })
    await waitFor(() => expect(within(select).getAllByRole('option').length).toBe(4))
    expect(select).toHaveValue('')
    expect(within(select).getByRole('option', { name: 'Default' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'gpt-6-sol-factory' })).toBeInTheDocument()
    expect(fake.unhandled).toEqual([])
  })

  it('sends no model while on the default', async () => {
    render(<ChatDock baseUrl={fake.url} />)
    await userEvent.type(input(), 'hi{Enter}')
    await waitFor(() => expect(fake.prompts).toHaveLength(1), { timeout: 5000 })
    expect(fake.prompts[0].model).toBeUndefined()
  }, 15000)

  it('sends the chosen model with the next prompt and remembers it', async () => {
    const { unmount } = render(<ChatDock baseUrl={fake.url} />)
    await waitFor(() => expect(within(picker()).getAllByRole('option').length).toBe(4))
    await userEvent.selectOptions(picker(), 'rwe-factory-gpt/gpt-6-sol-factory')
    await userEvent.type(input(), 'hi{Enter}')
    await waitFor(() => expect(fake.prompts).toHaveLength(1), { timeout: 5000 })
    expect(fake.prompts[0].model).toEqual({ providerID: 'rwe-factory-gpt', modelID: 'gpt-6-sol-factory' })
    unmount()

    render(<ChatDock baseUrl={fake.url} />)
    await waitFor(() => expect(within(picker()).getAllByRole('option').length).toBe(4))
    expect(picker()).toHaveValue('rwe-factory-gpt/gpt-6-sol-factory')
  }, 15000)

  it('ignores a remembered model the server no longer has', async () => {
    localStorage.setItem('designos:model', 'gone/model')
    render(<ChatDock baseUrl={fake.url} />)
    await waitFor(() => expect(within(picker()).getAllByRole('option').length).toBe(4))
    expect(picker()).toHaveValue('')
  })
})
