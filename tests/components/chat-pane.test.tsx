// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssistantRuntimeProvider, useLocalRuntime, type ChatModelAdapter } from '@assistant-ui/react'
import { ChatPane } from '@/components/chat/ChatPane'

function Harness({ adapter }: { adapter: ChatModelAdapter }) {
  const runtime = useLocalRuntime(adapter)
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatPane />
    </AssistantRuntimeProvider>
  )
}

const reply = (text: string): ChatModelAdapter => ({
  async run() {
    return { content: [{ type: 'text', text }] }
  },
})

const input = () => screen.getByRole('textbox', { name: /message the agent/i })

describe('ChatPane', () => {
  it('starts empty with a prompt to ask the agent', () => {
    render(<Harness adapter={reply('x')} />)
    expect(screen.getByText(/ask the agent/i)).toBeInTheDocument()
    expect(input()).toBeInTheDocument()
  })

  it('only lets you send when there is text', async () => {
    render(<Harness adapter={reply('x')} />)
    const send = screen.getByRole('button', { name: 'Send' })
    expect(send).toBeDisabled()
    await userEvent.type(input(), 'hello')
    expect(send).toBeEnabled()
  })

  it('sends with Enter, shows both messages and clears the field', async () => {
    render(<Harness adapter={reply('pong')} />)
    await userEvent.type(input(), 'ping{Enter}')
    expect(await screen.findByText('pong')).toBeInTheDocument()
    expect(screen.getByText('ping')).toBeInTheDocument()
    expect(input()).toHaveValue('')
    expect(screen.queryByText(/ask the agent/i)).not.toBeInTheDocument()
  })

  it('keeps a newline for Shift+Enter instead of sending', async () => {
    render(<Harness adapter={reply('pong')} />)
    await userEvent.type(input(), 'a{Shift>}{Enter}{/Shift}b')
    expect(input()).toHaveValue('a\nb')
    expect(screen.queryByText('pong')).not.toBeInTheDocument()
  })

  it('renders markdown of the answer', async () => {
    render(<Harness adapter={reply('A **bold** move with `code` and\n\n- one\n- two')} />)
    await userEvent.type(input(), 'go{Enter}')
    expect(await screen.findByText('bold', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('code', { selector: 'code' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('sanitizes html in the answer', async () => {
    render(<Harness adapter={reply('hi <img src=x onerror="window.__pwned=1"> <script>window.__pwned=1</script>')} />)
    await userEvent.type(input(), 'go{Enter}')
    await screen.findByText(/^hi/)
    expect(document.querySelector('script')).toBeNull()
    expect(document.querySelector('img[onerror]')).toBeNull()
  })

  it('streams, offers Stop while running and aborts the run', async () => {
    let aborted = false
    const adapter: ChatModelAdapter = {
      async *run({ abortSignal }) {
        yield { content: [{ type: 'text', text: 'partial' }] }
        await new Promise<void>((resolve) => {
          abortSignal.addEventListener('abort', () => {
            aborted = true
            resolve()
          })
        })
      },
    }
    render(<Harness adapter={adapter} />)
    await userEvent.type(input(), 'long{Enter}')
    expect(await screen.findByText('partial')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }))
    await waitFor(() => expect(aborted).toBe(true))
    expect(await screen.findByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  it('shows an error of the run', async () => {
    render(<Harness adapter={{ async run() { throw new Error('opencode is down') } }} />)
    await userEvent.type(input(), 'go{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('opencode is down')
  })
})
