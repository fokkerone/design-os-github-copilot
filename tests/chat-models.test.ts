import { describe, expect, it } from 'vitest'
import { loadModelChoice, modelKey, parseModelKey, parseProviders, saveModelChoice } from '@/lib/chat/models'

const response = {
  providers: [
    { id: 'rwe-factory-claude', name: 'RWE FACTORY CLAUDE', models: { 'claude-sonnet-5-5-factory': { id: 'claude-sonnet-5-5-factory', name: 'Sonnet 5.5' }, 'claude-opus-5-5-factory': { id: 'claude-opus-5-5-factory', name: 'claude-opus-5-5-factory' } } },
    { id: 'rwe-factory-gpt', name: 'RWE FACTORY GPT', models: { 'gpt-6-sol-factory': { id: 'gpt-6-sol-factory', name: 'gpt-6-sol-factory' } } },
  ],
}

describe('parseProviders', () => {
  it('flattens providers into selectable models with a provider group', () => {
    const options = parseProviders(response)
    expect(options).toHaveLength(3)
    expect(options[0]).toEqual({ providerID: 'rwe-factory-claude', modelID: 'claude-opus-5-5-factory', label: 'claude-opus-5-5-factory', provider: 'RWE FACTORY CLAUDE' })
  })
  it('sorts by provider, then model, and uses the model name as label', () => {
    const labels = parseProviders(response).map((o) => o.label)
    expect(labels).toEqual(['claude-opus-5-5-factory', 'Sonnet 5.5', 'gpt-6-sol-factory'])
  })
  it('survives a malformed answer', () => {
    expect(parseProviders(undefined)).toEqual([])
    expect(parseProviders({ providers: [{ id: 'x' }] })).toEqual([])
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
