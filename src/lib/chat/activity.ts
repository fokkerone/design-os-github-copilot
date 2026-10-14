import { useAuiState } from '@assistant-ui/react'

/** idle: nothing happens, working: the agent is busy, waiting: the agent needs an answer or a permission */
export type AgentActivity = 'idle' | 'working' | 'waiting'

export const ACTIVITY_LABEL: Record<AgentActivity, string> = {
  idle: '',
  working: 'Agent is working',
  waiting: 'Waiting for your answer',
}

export function useAgentActivity(): AgentActivity {
  return useAuiState((s) => {
    const last = s.thread.messages.at(-1)
    if (last?.role === 'assistant' && last.status?.type === 'requires-action') return 'waiting'
    return s.thread.isRunning ? 'working' : 'idle'
  })
}
