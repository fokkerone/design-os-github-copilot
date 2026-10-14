import { createContext, useContext } from 'react'
import type { ModelOption, ModelRef } from '@/lib/chat/models'
import type { AgentActivity } from '@/lib/chat/activity'
import type { OpenCodeStatus } from '@/lib/chat/opencode'

export interface ChatContextValue {
  status: OpenCodeStatus
  activity: AgentActivity
  options: ModelOption[]
  model: ModelRef | undefined
  setModel: (model: ModelRef | undefined) => void
  /** Sends a user message to the agent */
  send: (text: string) => void
}

/** null outside a ChatProvider: pages then fall back to copy-and-paste commands */
export const ChatContext = createContext<ChatContextValue | null>(null)
export const useChat = () => useContext(ChatContext)
