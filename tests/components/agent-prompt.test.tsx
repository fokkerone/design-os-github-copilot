// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentPrompt } from '@/components/AgentPrompt'
import { ChatContext, type ChatContextValue } from '@/lib/chat/chat-context'
import { ChatProvider } from '@/components/chat/ChatProvider'
import { ChatPanel } from '@/components/chat/ChatDock'
import { FakeOpenCode } from '../helpers/fake-opencode'

const ctx = (over: Partial<ChatContextValue> = {}): ChatContextValue => ({
  status: 'online', options: [], model: undefined, setModel: () => {}, send: vi.fn(), ...over,
})

describe('AgentPrompt', () => {
  it('without a chat shows the command to copy, no start button', () => {
    render(<AgentPrompt step="product-vision" prompt="Define my product" />)
    expect(screen.queryByRole('button', { name: /start with agent/i })).not.toBeInTheDocument()
    expect(screen.getByText('"Define my product"')).toBeInTheDocument()
    expect(screen.getByText('/design-os:product-vision')).toBeInTheDocument()
  })

  it('has no tool selector any more (the chat is the tool)', () => {
    render(<AgentPrompt step="product-vision" prompt="x" />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('with a chat starts the step by sending the message', async () => {
    const value = ctx()
    render(
      <ChatContext.Provider value={value}>
        <AgentPrompt step="product-vision" prompt="Define my product" />
      </ChatContext.Provider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /start with agent/i }))
    expect(value.send).toHaveBeenCalledWith(
      'Follow the instructions in .claude/commands/design-os/product-vision.md.\n\nDefine my product',
    )
  })

  it('disables the start button while OpenCode is offline and says why', () => {
    render(
      <ChatContext.Provider value={ctx({ status: 'offline' })}>
        <AgentPrompt step="product-vision" prompt="x" />
      </ChatContext.Provider>,
    )
    expect(screen.getByRole('button', { name: /start with agent/i })).toBeDisabled()
    expect(screen.getByText(/opencode is not running/i)).toBeInTheDocument()
  })
})

describe('AgentPrompt with the OpenCode chat', () => {
  let fake: FakeOpenCode
  beforeEach(async () => {
    localStorage.clear()
    fake = await new FakeOpenCode().start()
  })
  afterEach(async () => {
    await fake.stop()
  })

  it('shows the started step in the chat and sends it to OpenCode', async () => {
    fake.reply({ chunks: ['On it'] })
    render(
      <ChatProvider baseUrl={fake.url}>
        <AgentPrompt step="techstack" prompt="Decide the stack" />
        <ChatPanel />
      </ChatProvider>,
    )
    const start = await screen.findByRole('button', { name: /start with agent/i })
    await waitFor(() => expect(start).toBeEnabled())
    await userEvent.click(start)
    await waitFor(() => expect(fake.prompts).toHaveLength(1), { timeout: 5000 })
    expect(fake.prompts[0].text).toBe('Follow the instructions in .claude/commands/design-os/techstack.md.\n\nDecide the stack')
    expect(await screen.findByText('On it', {}, { timeout: 5000 })).toBeInTheDocument()
  }, 15000)
})
