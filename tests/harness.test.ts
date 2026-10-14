import { describe, expect, it } from 'vitest'
import { HARNESSES, buildPrompt, buildStepMessage, isHarness, stepCommandFile, stepInvocation, type StepId } from '../src/lib/harness.ts'

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

describe('messages for the chat agent', () => {
  it('points at the command file of a step', () => {
    expect(stepCommandFile('product-vision')).toBe('.claude/commands/design-os/product-vision.md')
    expect(stepCommandFile('design-system')).toBe('.claude/commands/design-os/design-tokens.md')
    expect(stepCommandFile('userflow')).toBe('.claude/commands/design-os/userflow.md')
  })

  it('asks the agent to follow the command, then states the request', () => {
    expect(buildStepMessage('techstack', "Let's decide the tech stack")).toBe(
      "Follow the instructions in .claude/commands/design-os/techstack.md.\n\nLet's decide the tech stack"
    )
    expect(buildStepMessage('persona')).toBe('Follow the instructions in .claude/commands/design-os/persona.md.')
  })

  it('has a command file for every step', async () => {
    const { existsSync } = await import('node:fs')
    const { STEP_IDS } = await import('../src/lib/harness.ts')
    for (const step of STEP_IDS) expect(existsSync(stepCommandFile(step)), step).toBe(true)
  })
})

describe('slash commands typed into the chat', () => {
  it('turns a known step command into the step message', async () => {
    const { expandSlashCommand } = await import('../src/lib/harness.ts')
    expect(expandSlashCommand("/design-os:product-vision Let's start")).toBe(
      "Follow the instructions in .claude/commands/design-os/product-vision.md.\n\nLet's start"
    )
    expect(expandSlashCommand('/design-os:techstack')).toBe('Follow the instructions in .claude/commands/design-os/techstack.md.')
    expect(expandSlashCommand('  /design-os:persona validate p1  ')).toBe(
      'Follow the instructions in .claude/commands/design-os/persona.md.\n\nvalidate p1'
    )
  })

  it('knows the wiki commands too', async () => {
    const { expandSlashCommand } = await import('../src/lib/harness.ts')
    expect(expandSlashCommand('/design-os:wiki-ingest --product')).toBe(
      'Follow the instructions in .claude/commands/design-os/wiki-ingest.md.\n\n--product'
    )
  })

  it('accepts the Copilot agent names as well', async () => {
    const { expandSlashCommand } = await import('../src/lib/harness.ts')
    expect(expandSlashCommand('@00-product-vision go')).toBe(
      'Follow the instructions in .claude/commands/design-os/product-vision.md.\n\ngo'
    )
  })

  it('leaves everything else alone', async () => {
    const { expandSlashCommand } = await import('../src/lib/harness.ts')
    for (const text of ['hello', '/unknown-command x', '/design-os:does-not-exist', 'say /design-os:techstack', '']) {
      expect(expandSlashCommand(text)).toBe(text)
    }
  })
})
