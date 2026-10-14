import { describe, expect, it } from 'vitest'
import { HARNESSES, buildPrompt, isHarness, stepInvocation, type StepId } from '../src/lib/harness.ts'

describe('harness commands', () => {
  it('offers Copilot, Claude Code and OpenCode', () => {
    expect(HARNESSES.map((harness) => harness.id)).toEqual(['copilot', 'claude', 'opencode'])
    expect(isHarness('claude')).toBe(true)
    expect(isHarness('cursor')).toBe(false)
  })

  it('uses agents for Copilot and slash commands for Claude Code and OpenCode', () => {
    expect(stepInvocation('product-vision', 'copilot')).toBe('@00-product-vision')
    expect(stepInvocation('product-vision', 'claude')).toBe('/design-os:product-vision')
    expect(stepInvocation('design-system', 'claude')).toBe('/design-os:design-tokens')
    expect(stepInvocation('techstack', 'copilot')).toBe('@01-techstack')
    expect(stepInvocation('techstack', 'claude')).toBe('/design-os:techstack')
  })

  it('lets OpenCode fall back to the Claude commands', () => {
    const steps: StepId[] = ['product-vision', 'techstack', 'design-system', 'persona', 'userflow', 'export-product']
    for (const step of steps) expect(stepInvocation(step, 'opencode')).toBe(stepInvocation(step, 'claude'))
  })

  it('copies the command together with the prompt', () => {
    expect(buildPrompt('product-vision', 'claude', "Let's define my product vision")).toBe(
      "/design-os:product-vision Let's define my product vision"
    )
    expect(buildPrompt('userflow', 'copilot')).toBe('@userflow')
    expect(buildPrompt('persona', 'opencode', 'validate p1')).toBe('/design-os:persona validate p1')
  })
})
