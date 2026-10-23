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
  /** Starts a new conversation (a new OpenCode session on the next message) */
  newChat?: () => void
}

/** Window event that asks the layout to show the chat, e.g. while the step panel is expanded */
export const SHOW_CHAT_EVENT = 'designos:show-chat'

/** null outside a ChatProvider: pages then fall back to copy-and-paste commands */
export const ChatContext = createContext<ChatContextValue | null>(null)
export const useChat = () => useContext(ChatContext)
