import { describe, expect, it } from 'vitest'
import { loadModelChoice, modelKey, parseModelKey, parseModels, saveModelChoice } from '@/lib/chat/models'

// GET /api/model of OpenCode 2.x (shortened)
const response = [
  { id: 'claude-sonnet-5-5-factory', providerID: 'rwe-factory-claude', name: 'Sonnet 5.5', family: 'claude' },
  { id: 'claude-opus-5-5-factory', providerID: 'rwe-factory-claude' },
  { id: 'gpt-6-sol-factory', providerID: 'rwe-factory-gpt', name: 'gpt-6-sol-factory' },
]

describe('parseModels', () => {
  it('turns the models of the server into selectable options grouped by provider', () => {
    const options = parseModels(response)
    expect(options).toHaveLength(3)
    expect(options[0]).toEqual({ providerID: 'rwe-factory-claude', modelID: 'claude-opus-5-5-factory', label: 'claude-opus-5-5-factory', provider: 'rwe-factory-claude' })
  })
  it('sorts by provider, then label, and uses the model name as label', () => {
    expect(parseModels(response).map((o) => o.label)).toEqual(['claude-opus-5-5-factory', 'Sonnet 5.5', 'gpt-6-sol-factory'])
  })
  it('survives a malformed answer', () => {
    expect(parseModels(undefined)).toEqual([])
    expect(parseModels([{ id: 'x' }, null])).toEqual([])
  })
})

describe('model keys', () => {
  it('round-trips provider and model', () => {
    expect(parseModelKey(modelKey({ providerID: 'a', modelID: 'b/c' }))).toEqual({ providerID: 'a', modelID: 'b/c' })
  })
  it('rejects garbage', () => {
    expect(parseModelKey('')).toBeUndefined()
    expect(parseModelKey('nomodel')).toBeUndefined()
  })
})

describe('stored choice', () => {
  const memory = () => {
    const data = new Map<string, string>()
    return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) }
  }
  it('is undefined (server default) until chosen', () => {
    expect(loadModelChoice(memory())).toBeUndefined()
  })
  it('remembers a choice and clears it again', () => {
    const store = memory()
    saveModelChoice({ providerID: 'p', modelID: 'm' }, store)
    expect(loadModelChoice(store)).toEqual({ providerID: 'p', modelID: 'm' })
    saveModelChoice(undefined, store)
    expect(loadModelChoice(store)).toBeUndefined()
  })
})
