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
  'product-vision': { copilot: '@00-product-vision', claude: '/product-vision' },
  'product-roadmap': { copilot: '@01-product-roadmap', claude: '/product-roadmap' },
  'data-shape': { copilot: '@02-data-shape', claude: '/data-shape' },
  'design-system': { copilot: '@03-design-system', claude: '/design-tokens' },
  'design-shell': { copilot: '@04-design-shell', claude: '/design-shell' },
  'shape-section': { copilot: '@05-shape-section', claude: '/shape-section' },
  'sample-data': { copilot: '@06-sample-data', claude: '/sample-data' },
  'design-screen': { copilot: '@07-design-screen', claude: '/design-screen' },
  'screenshot-design': { copilot: '@08-screenshot-design', claude: '/screenshot-design' },
  clickdummy: { copilot: '@09-clickdummy', claude: '/clickdummy' },
  'export-product': { copilot: '@10-export-product', claude: '/export-product' },
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

/** The agent (Copilot) or command (Claude Code, OpenCode) that runs a step, e.g. "/product-vision" */
export function stepInvocation(step: StepId, harness: Harness): string {
  return harness === 'copilot' ? STEPS[step].copilot : STEPS[step].claude
}

/** What the copy button puts on the clipboard: the invocation followed by the prompt */
export function buildPrompt(step: StepId, harness: Harness, prompt?: string): string {
  const invocation = stepInvocation(step, harness)
  return prompt ? `${invocation} ${prompt}` : invocation
}
