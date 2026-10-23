// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToolCall, type ToolCallView } from '@/components/chat/ToolCall'
import { summarizeTool } from '@/lib/chat/tool-summary'
import { ChatProvider } from '@/components/chat/ChatProvider'
import { ChatPanel } from '@/components/chat/ChatDock'
import { FakeOpenCode } from '../helpers/fake-opencode'

const base = (over: Partial<ToolCallView> = {}): ToolCallView => ({
  toolName: 'read',
  args: { filePath: '/p/product/product-overview.md' },
  status: { type: 'complete' },
  respondToApproval: vi.fn(async () => {}),
  ...over,
})

describe('summarizeTool', () => {
  it('shows the file for file tools and the command for bash', () => {
    expect(summarizeTool('read', { filePath: '/a/b.md' })).toBe('/a/b.md')
    expect(summarizeTool('write', { filePath: '/a/c.md', content: 'x' })).toBe('/a/c.md')
    expect(summarizeTool('bash', { command: 'npm test', description: 'x' })).toBe('npm test')
    expect(summarizeTool('glob', { pattern: 'product/**/*.md' })).toBe('product/**/*.md')
    expect(summarizeTool('grep', { pattern: 'foo' })).toBe('foo')
  })
  it('is empty for unknown tools', () => {
    expect(summarizeTool('mystery', { a: 1 })).toBe('')
    expect(summarizeTool('read', undefined)).toBe('')
  })
})

describe('ToolCall', () => {
  it('shows tool name and target', () => {
    render(<ToolCall {...base()} />)
    expect(screen.getByText('read')).toBeInTheDocument()
    expect(screen.getByText('/p/product/product-overview.md')).toBeInTheDocument()
  })

  it('marks a running call as busy', () => {
    render(<ToolCall {...base({ status: { type: 'running' } })} />)
    expect(screen.getByRole('group', { name: /read/ })).toHaveAttribute('aria-busy', 'true')
  })

  it('shows a failed call', () => {
    render(<ToolCall {...base({ isError: true, status: { type: 'complete' } })} />)
    expect(screen.getByRole('group', { name: /read/ })).toHaveAttribute('data-state', 'error')
  })

  it('asks permission with allow once, always and deny and answers through the runtime', async () => {
    const respond = vi.fn(async () => {})
    render(
      <ToolCall
        {...base({
          toolName: 'bash',
          args: { command: 'rm -rf dist' },
          respondToApproval: respond,
          approval: {
            id: 'per_1',
            options: [
              { id: 'once', kind: 'allow-once' },
              { id: 'always', kind: 'allow-always', grants: ['rm *'] },
              { id: 'reject', kind: 'reject-once' },
            ],
          },
        })}
      />,
    )
    expect(screen.getByText(/needs your permission/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Allow once' }))
    expect(respond).toHaveBeenLastCalledWith({ approved: true, optionId: 'once' })
    await userEvent.click(screen.getByRole('button', { name: 'Always allow' }))
    expect(respond).toHaveBeenLastCalledWith({ approved: true, optionId: 'always' })
    await userEvent.click(screen.getByRole('button', { name: 'Deny' }))
    expect(respond).toHaveBeenLastCalledWith({ approved: false, optionId: 'reject' })
  })

  it('shows what was decided once resolved, without buttons', () => {
    render(<ToolCall {...base({ approval: { id: 'p', approved: true, optionId: 'once', options: [{ id: 'once', kind: 'allow-once' }] } })} />)
    expect(screen.queryByRole('button', { name: 'Allow once' })).not.toBeInTheDocument()
    expect(screen.getByText(/allowed/i)).toBeInTheDocument()
  })

  describe('questions', () => {
    const question = (over: Partial<NonNullable<ToolCallView['approval']>> = {}): ToolCallView['approval'] => ({
      id: 'que_1',
      display: 'questions',
      dismissible: true,
      questions: [
        { id: '0', header: 'Your idea', prompt: 'How do you want to start?', allowFreeform: true, options: [{ id: 'Describe it', label: 'Describe it', description: 'Type notes' }, { id: 'File', label: 'File' }] },
      ],
      ...over,
    })

    it('shows the question with its options', () => {
      render(<ToolCall {...base({ toolName: 'question', args: {}, approval: question() })} />)
      expect(screen.getByText('How do you want to start?')).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /Describe it/ })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /File/ })).toBeInTheDocument()
      expect(screen.getByText('Type notes')).toBeInTheDocument()
    })

    it('can only be sent with an answer', async () => {
      render(<ToolCall {...base({ toolName: 'question', args: {}, approval: question() })} />)
      expect(screen.getByRole('button', { name: 'Send answer' })).toBeDisabled()
      await userEvent.click(screen.getByRole('radio', { name: /File/ }))
      expect(screen.getByRole('button', { name: 'Send answer' })).toBeEnabled()
    })

    it('answers with the chosen option', async () => {
      const respond = vi.fn(async () => {})
      render(<ToolCall {...base({ toolName: 'question', args: {}, approval: question(), respondToApproval: respond })} />)
      await userEvent.click(screen.getByRole('radio', { name: /Describe it/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))
      expect(respond).toHaveBeenCalledWith({ answers: { '0': { optionIds: ['Describe it'] } } })
    })

    it('answers with free text', async () => {
      const respond = vi.fn(async () => {})
      render(<ToolCall {...base({ toolName: 'question', args: {}, approval: question(), respondToApproval: respond })} />)
      await userEvent.type(screen.getByRole('textbox', { name: /your own answer/i }), 'A wind farm app')
      await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))
      expect(respond).toHaveBeenCalledWith({ answers: { '0': { text: 'A wind farm app' } } })
    })

    it('allows several options when multiple', async () => {
      const respond = vi.fn(async () => {})
      const approval = question({ questions: [{ id: '0', prompt: 'Pick', multiple: true, options: [{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }] }] })
      render(<ToolCall {...base({ toolName: 'question', args: {}, approval, respondToApproval: respond })} />)
      await userEvent.click(screen.getByRole('checkbox', { name: 'a' }))
      await userEvent.click(screen.getByRole('checkbox', { name: 'b' }))
      await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))
      expect(respond).toHaveBeenCalledWith({ answers: { '0': { optionIds: ['a', 'b'] } } })
    })

    it('can be skipped', async () => {
      const respond = vi.fn(async () => {})
      render(<ToolCall {...base({ toolName: 'question', args: {}, approval: question(), respondToApproval: respond })} />)
      await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
      expect(respond).toHaveBeenCalledWith({ approved: false })
    })

    it('shows the given answer once answered', () => {
      render(<ToolCall {...base({ toolName: 'question', args: {}, approval: question({ approved: true, answers: { '0': { optionIds: ['File'] } } }) })} />)
      expect(screen.queryByRole('button', { name: 'Send answer' })).not.toBeInTheDocument()
      expect(screen.getByText('How do you want to start?')).toBeInTheDocument()
      expect(screen.getByText('File')).toBeInTheDocument()
    })
  })
})

describe('questions in the chat (OpenCode)', () => {
  let fake: FakeOpenCode
  beforeEach(async () => {
    localStorage.clear()
    fake = await new FakeOpenCode().start()
  })
  afterEach(async () => {
    await fake.stop()
  })
  const input = () => screen.getByRole('textbox', { name: /message the agent/i })

  it('shows the agent question, sends the answer back and the agent continues', async () => {
    fake.reply({ question: [{ question: 'Which start?', header: 'Start', options: [{ label: 'A' }, { label: 'B' }] }], chunks: ['Great, A it is'] })
    render(
      <ChatProvider baseUrl={fake.url}>
        <ChatPanel />
      </ChatProvider>,
    )
    await userEvent.type(input(), '/design-os:product-vision{Enter}')
    expect(await screen.findByText('Which start?', {}, { timeout: 5000 })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'A' }))
    await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))
    await waitFor(() => expect(fake.answers).toEqual([{ q0: 'A' }]), { timeout: 5000 })
    expect(await screen.findByText('Great, A it is', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(fake.unhandled).toEqual([])
  }, 20000)

  it('lets the agent carry on when the question is skipped', async () => {
    fake.reply({ question: [{ question: 'Which start?', options: [{ label: 'A' }] }], chunks: ['x'] })
    render(
      <ChatProvider baseUrl={fake.url}>
        <ChatPanel />
      </ChatProvider>,
    )
    await userEvent.type(input(), 'go{Enter}')
    await userEvent.click(await screen.findByRole('button', { name: 'Skip' }, { timeout: 5000 }))
    await waitFor(() => expect(fake.answers).toEqual([null]), { timeout: 5000 })
  }, 20000)
})

describe('slash commands in the chat', () => {
  let fake: FakeOpenCode
  beforeEach(async () => {
    localStorage.clear()
    fake = await new FakeOpenCode().start()
  })
  afterEach(async () => {
    await fake.stop()
  })

  it('sends a typed step command as the instruction to read the command file', async () => {
    render(
      <ChatProvider baseUrl={fake.url}>
        <ChatPanel />
      </ChatProvider>,
    )
    await userEvent.type(screen.getByRole('textbox', { name: /message the agent/i }), '/design-os:product-vision Wind parks{Enter}')
    await waitFor(() => expect(fake.prompts).toHaveLength(1), { timeout: 5000 })
    expect(fake.prompts[0].text).toBe('Follow the instructions in .claude/commands/design-os/product-vision.md.\n\nWind parks')
  }, 15000)

  it('sends normal text unchanged', async () => {
    render(
      <ChatProvider baseUrl={fake.url}>
        <ChatPanel />
      </ChatProvider>,
    )
    await userEvent.type(screen.getByRole('textbox', { name: /message the agent/i }), 'hello{Enter}')
    await waitFor(() => expect(fake.prompts).toHaveLength(1), { timeout: 5000 })
    expect(fake.prompts[0].text).toBe('hello')
  }, 15000)
})

describe('agent activity', () => {
  let fake: FakeOpenCode
  beforeEach(async () => {
    localStorage.clear()
    fake = await new FakeOpenCode().start()
  })
  afterEach(async () => {
    await fake.stop()
  })

  it('marks the agent avatar as working while the answer is in progress and stops afterwards', async () => {
    fake.reply({ chunks: ['one', ' two', ' three'], delayMs: 300 })
    render(
      <ChatProvider baseUrl={fake.url}>
        <ChatPanel />
      </ChatProvider>,
    )
    await userEvent.type(screen.getByRole('textbox', { name: /message the agent/i }), 'go{Enter}')
    expect(await screen.findByRole('status', { name: /agent is working/i }, { timeout: 5000 })).toBeInTheDocument()
    expect(document.querySelector('[data-working="true"]')).not.toBeNull()
    await screen.findByText(/one two three/, {}, { timeout: 5000 })
    await waitFor(() => expect(screen.queryByRole('status', { name: /agent is working/i })).not.toBeInTheDocument(), { timeout: 5000 })
    expect(document.querySelector('[data-working="true"]')).toBeNull()
  }, 20000)

  it('says it waits for the user while a question is open', async () => {
    fake.reply({ question: [{ question: 'Which?', options: [{ label: 'A' }] }], chunks: ['done'] })
    render(
      <ChatProvider baseUrl={fake.url}>
        <ChatPanel />
      </ChatProvider>,
    )
    await userEvent.type(screen.getByRole('textbox', { name: /message the agent/i }), 'go{Enter}')
    expect(await screen.findByRole('status', { name: /waiting for your answer/i }, { timeout: 5000 })).toBeInTheDocument()
  }, 20000)
})
