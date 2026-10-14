/**
 * The planning steps and how they are started.
 *
 * Every step exists as a GitHub Copilot agent and as a command in .claude/commands. The Design OS
 * chat runs on OpenCode, which reads the command file (see `buildStepMessage`).
 */

export type Harness = 'copilot' | 'claude' | 'opencode'

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

const EXTRA_COMMANDS = ['wiki-ingest', 'wiki-capture', 'wiki-query', 'wiki-status', 'wiki-lint', 'wiki-rebuild', 'wiki-cross-link', 'wiki-taxonomy']

/**
 * OpenCode does not parse slash commands out of a prompt, the agent would only guess.
 * A typed `/design-os:<step> request` (or Copilot's `@00-product-vision`) becomes the message
 * that points the agent to the command file. Anything else is returned unchanged.
 */
export function expandSlashCommand(text: string): string {
  const match = text.trim().match(/^(?:\/design-os:([\w-]+)|@([\w-]+))(?:\s+([\s\S]*))?$/)
  if (!match) return text
  const rest = match[3]?.trim()
  let step: StepId | undefined
  if (match[1]) {
    step = STEP_IDS.find((id) => STEPS[id].claude === `/design-os:${match[1]}`)
    if (!step && EXTRA_COMMANDS.includes(match[1])) {
      const head = `Follow the instructions in .claude/commands/design-os/${match[1]}.md.`
      return rest ? `${head}\n\n${rest}` : head
    }
  } else {
    step = STEP_IDS.find((id) => STEPS[id].copilot === `@${match[2]}`)
  }
  return step ? buildStepMessage(step, rest) : text
}
