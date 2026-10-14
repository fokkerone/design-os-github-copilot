/**
 * The AI tool ("harness") the user runs the planning steps with.
 *
 * Every planning step exists as a GitHub Copilot agent and as a Claude Code command.
 * OpenCode falls back to the Claude commands in .claude/commands.
 * The choice is stored in localStorage until the user changes it.
 */

import { useSyncExternalStore } from 'react'

export type Harness = 'copilot' | 'claude' | 'opencode'

export const HARNESSES: { id: Harness; label: string }[] = [
  { id: 'copilot', label: 'GitHub Copilot' },
  { id: 'claude', label: 'Claude Code' },
  { id: 'opencode', label: 'OpenCode' },
]

export const DEFAULT_HARNESS: Harness = 'copilot'

export const HARNESS_STORAGE_KEY = 'designos:harness'

/** Fired in the same tab, because the `storage` event only reaches other tabs */
const CHANGE_EVENT = 'designos:harness-change'

/** Planning steps that have an agent / command */
export type StepId =
  | 'product-vision'
  | 'techstack'
  | 'product-roadmap'
  | 'data-shape'
  | 'design-system'
  | 'design-shell'
  | 'shape-section'
  | 'sample-data'
  | 'design-screen'
  | 'screenshot-design'
  | 'clickdummy'
  | 'export-product'
  | 'persona'
  | 'userflow'

const STEPS: Record<StepId, { copilot: string; claude: string }> = {
  'product-vision': { copilot: '@00-product-vision', claude: '/design-os:product-vision' },
  techstack: { copilot: '@01-techstack', claude: '/design-os:techstack' },
  'product-roadmap': { copilot: '@02-product-roadmap', claude: '/design-os:product-roadmap' },
  'data-shape': { copilot: '@03-data-shape', claude: '/design-os:data-shape' },
  'design-system': { copilot: '@04-design-system', claude: '/design-os:design-tokens' },
  'design-shell': { copilot: '@05-design-shell', claude: '/design-os:design-shell' },
  'shape-section': { copilot: '@06-shape-section', claude: '/design-os:shape-section' },
  'sample-data': { copilot: '@07-sample-data', claude: '/design-os:sample-data' },
  'design-screen': { copilot: '@08-design-screen', claude: '/design-os:design-screen' },
  'screenshot-design': { copilot: '@09-screenshot-design', claude: '/design-os:screenshot-design' },
  clickdummy: { copilot: '@10-clickdummy', claude: '/design-os:clickdummy' },
  'export-product': { copilot: '@11-export-product', claude: '/design-os:export-product' },
  persona: { copilot: '@persona', claude: '/design-os:persona' },
  userflow: { copilot: '@userflow', claude: '/design-os:userflow' },
}

export function isHarness(value: unknown): value is Harness {
  return HARNESSES.some((harness) => harness.id === value)
}

/** Fallback when localStorage is blocked */
let memoryHarness: Harness | null = null

export function readHarness(): Harness {
  try {
    const stored = window.localStorage.getItem(HARNESS_STORAGE_KEY)
    return isHarness(stored) ? stored : DEFAULT_HARNESS
  } catch {
    // Storage can be blocked (private mode, policies)
    return DEFAULT_HARNESS
  }
}

export function writeHarness(harness: Harness): void {
  try {
    window.localStorage.setItem(HARNESS_STORAGE_KEY, harness)
  } catch {
    // Not persisted; the choice still applies until the page is closed
    memoryHarness = harness
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function getSnapshot(): Harness {
  return memoryHarness ?? readHarness()
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** The selected harness and a setter; every component using it updates together */
export function useHarness(): [Harness, (harness: Harness) => void] {
  const harness = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_HARNESS)
  return [harness, writeHarness]
}

export function harnessLabel(harness: Harness): string {
  return HARNESSES.find((entry) => entry.id === harness)?.label ?? harness
}

/** The agent (Copilot) or command (Claude Code, OpenCode) that runs a step, e.g. "/design-os:product-vision" */
export function stepInvocation(step: StepId, harness: Harness): string {
  return harness === 'copilot' ? STEPS[step].copilot : STEPS[step].claude
}

/** What the copy button puts on the clipboard: the invocation followed by the prompt */
export function buildPrompt(step: StepId, harness: Harness, prompt?: string): string {
  const invocation = stepInvocation(step, harness)
  return prompt ? `${invocation} ${prompt}` : invocation
}

/** Every planning step */
export const STEP_IDS = Object.keys(STEPS) as StepId[]

/** The command file the chat agent reads to run a step */
export function stepCommandFile(step: StepId): string {
  const name = STEPS[step].claude.replace('/design-os:', '')
  return `.claude/commands/design-os/${name}.md`
}

/** The chat message that starts a step: OpenCode does not parse slash commands from text, so the agent reads the command file */
export function buildStepMessage(step: StepId, prompt?: string): string {
  const head = `Follow the instructions in ${stepCommandFile(step)}.`
  return prompt ? `${head}\n\n${prompt}` : head
}
