import { describe, expect, it } from 'vitest'
import { loadSessionId, saveSessionId, SESSION_STORAGE_KEY } from '@/lib/chat/session'

const memory = () => {
  const data = new Map<string, string>()
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) }
}

describe('chat session', () => {
  it('has no session until one is saved', () => {
    expect(loadSessionId(memory())).toBeUndefined()
  })
  it('remembers and forgets the session id', () => {
    const store = memory()
    saveSessionId('ses_1', store)
    expect(loadSessionId(store)).toBe('ses_1')
    saveSessionId(undefined, store)
    expect(loadSessionId(store)).toBeUndefined()
  })
  it('uses its own storage key', () => {
    expect(SESSION_STORAGE_KEY).toBe('designos:session')
  })
})
