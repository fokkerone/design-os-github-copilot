import { useMemo, type ReactNode } from 'react'
import { AssistantRuntimeProvider, useExternalStoreRuntime, type ThreadMessageLike } from '@assistant-ui/react'
import { fn } from 'storybook/test'
import { ChatContext, type ChatContextValue } from '@/lib/chat/chat-context'
import type { ModelOption } from '@/lib/chat/models'

/** Models offered by the fake chat */
export const sampleModels: ModelOption[] = [
  { providerID: 'anthropic', modelID: 'claude-sonnet', label: 'Claude Sonnet', provider: 'Anthropic' },
  { providerID: 'anthropic', modelID: 'claude-opus', label: 'Claude Opus', provider: 'Anthropic' },
]

export type FakeChat = 'online' | 'offline' | 'working' | 'waiting'

/** A chat context without OpenCode: pages offer "Start with agent", sends are logged as actions */
export function fakeChat(kind: FakeChat): ChatContextValue {
  return {
    status: kind === 'offline' ? 'offline' : 'online',
    activity: kind === 'working' ? 'working' : kind === 'waiting' ? 'waiting' : 'idle',
    options: kind === 'offline' ? [] : sampleModels,
    model: undefined,
    setModel: fn().mockName('setModel'),
    send: fn().mockName('send'),
    newChat: fn().mockName('newChat'),
  }
}

/** A thread with fixed messages in an assistant-ui runtime, for the chat components */
export function StaticThread({
  messages = [],
  running = false,
  chat = 'online',
  children,
}: {
  messages?: ThreadMessageLike[]
  running?: boolean
  chat?: FakeChat
  children: ReactNode
}) {
  const runtime = useExternalStoreRuntime({
    messages,
    convertMessage: (m: ThreadMessageLike) => m,
    isRunning: running,
    onNew: async () => {},
    onCancel: async () => {},
    onRespondToToolApproval: async () => {},
  })
  const value = useMemo(() => fakeChat(chat), [chat])
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    </AssistantRuntimeProvider>
  )
}
