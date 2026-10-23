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
    expect(fake.requests).toContain('POST /api/session')
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
    expect(await screen.findByRole('status', {}, { timeout: 5000 })).toHaveTextContent('npm run dev')
    // restart so afterEach can stop cleanly
    fake = await new FakeOpenCode().start()
  }, 15000)

  it('shows no banner while the server is up', async () => {
    render(<ChatDock baseUrl={fake.url} />)
    await waitFor(() => expect(fake.requests).toContain('GET /api/info'))
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

  it('starts the session with the chosen model and remembers it', async () => {
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

describe('reload', () => {
  it('reopens the conversation after a page reload (the agent writes files, Vite may reload the page)', async () => {
    fake.reply({ chunks: ['first answer'] })
    const first = render(<ChatDock baseUrl={fake.url} />)
    await userEvent.type(input(), 'remember me{Enter}')
    expect(await screen.findByText('first answer', {}, { timeout: 5000 })).toBeInTheDocument()
    await waitFor(() => expect(localStorage.getItem('designos:session')).toMatch(/^ses_/))
    first.unmount()

    render(<ChatDock baseUrl={fake.url} />)
    expect(await screen.findByText('first answer', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText('remember me')).toBeInTheDocument()
    expect(fake.requests.filter((r) => r === 'POST /api/session')).toHaveLength(1)
  }, 20000)

  it('starts fresh when the remembered session is gone from the server', async () => {
    localStorage.setItem('designos:session', 'ses_gone')
    render(<ChatDock baseUrl={fake.url} />)
    await waitFor(() => expect(fake.requests).toContain('GET /api/session/ses_gone/message'), { timeout: 5000 })
    expect(input()).toBeInTheDocument()
    expect(screen.queryByText(/ask the agent/i)).toBeInTheDocument()
  }, 15000)
})

describe('new chat', () => {
  it('starts a fresh conversation in a new session', async () => {
    fake.reply({ chunks: ['old answer'] })
    render(<ChatDock baseUrl={fake.url} />)
    await userEvent.type(input(), 'first{Enter}')
    expect(await screen.findByText('old answer', {}, { timeout: 5000 })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'New chat' }))
    await waitFor(() => expect(screen.queryByText('old answer')).not.toBeInTheDocument())
    expect(screen.getByText(/ask the agent/i)).toBeInTheDocument()

    fake.reply({ chunks: ['new answer'] })
    await userEvent.type(input(), 'second{Enter}')
    expect(await screen.findByText('new answer', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(fake.prompts.map((p) => p.sessionID)[0]).not.toBe(fake.prompts[1].sessionID)
  }, 25000)
})

describe('questions', () => {
  it('shows the question of the agent, sends the answer as a form reply and continues', async () => {
    fake.reply({ question: [{ question: 'Which scope?', header: 'Scope', options: [{ label: 'Only this element' }, { label: 'All screens' }] }], chunks: ['Changing only this element'], formDelayMs: 300 })
    render(<ChatDock baseUrl={fake.url} />)
    await userEvent.type(input(), 'make it bigger{Enter}')
    // The form comes after the tool call (as with the real server): the card turns into the questions
    await userEvent.click(await screen.findByRole('radio', { name: 'Only this element' }, { timeout: 5000 }))
    expect(screen.getByText('Which scope?')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: /waiting for your answer/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))
    expect(await screen.findByText('Changing only this element', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(fake.answers).toEqual([{ q0: 'Only this element' }])
    expect(fake.unhandled).toEqual([])
  }, 15000)

  it('catches up on a question whose event it missed while the stream was down', async () => {
    fake.reply({ question: [{ question: 'Which scope?', options: [{ label: 'Only this element' }] }], chunks: ['done'], formDelayMs: 100, dropStreamBeforeForm: true })
    render(<ChatDock baseUrl={fake.url} />)
    await userEvent.type(input(), 'make it bigger{Enter}')
    expect(await screen.findByRole('radio', { name: 'Only this element' }, { timeout: 5000 })).toBeInTheDocument()
  }, 15000)

  it('skips a question by cancelling the form', async () => {
    fake.reply({ question: [{ question: 'Which scope?', options: [{ label: 'A' }] }], chunks: ['unused'] })
    render(<ChatDock baseUrl={fake.url} />)
    await userEvent.type(input(), 'go{Enter}')
    await userEvent.click(await screen.findByRole('button', { name: 'Skip' }, { timeout: 5000 }))
    await waitFor(() => expect(fake.answers).toEqual([null]))
  }, 15000)
})
