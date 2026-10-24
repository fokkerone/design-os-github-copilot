/**
 * The impeccable commands a comment can ask for (`/impeccable <command>`, the skill in
 * .claude/skills/impeccable), grouped the way Design OS offers them. Left out on purpose: init,
 * document, shape, craft, live and generate, which Design OS steps own (wiki-ingest,
 * tokens:build, shape-section, live-edit).
 */
export interface CommentCommand {
  id: string
  label: string
  hint: string
}

export interface CommandGroup {
  id: 'improve' | 'check' | 'maintain'
  label: string
  /** Check commands report findings and change no file */
  edits: boolean
  commands: CommentCommand[]
}

export const COMMAND_GROUPS: CommandGroup[] = [
  {
    id: 'improve',
    label: 'Improve',
    edits: true,
    commands: [
      { id: 'polish', label: 'Polish', hint: 'Final quality pass, aligned with the design system' },
      { id: 'layout', label: 'Layout', hint: 'Spacing, rhythm and visual hierarchy' },
      { id: 'typeset', label: 'Typeset', hint: 'Type hierarchy, sizes and readability' },
      { id: 'colorize', label: 'Colorize', hint: 'Color for actions, states and character' },
      { id: 'bolder', label: 'Bolder', hint: 'More presence for a safe or bland design' },
      { id: 'quieter', label: 'Quieter', hint: 'Less visual noise, same personality' },
      { id: 'distill', label: 'Distill', hint: 'Strip to the essentials' },
      { id: 'clarify', label: 'Clarify', hint: 'Labels, UX copy and error messages' },
      { id: 'adapt', label: 'Adapt', hint: 'Other screen sizes and devices' },
      { id: 'animate', label: 'Animate', hint: 'Purposeful motion and feedback' },
      { id: 'delight', label: 'Delight', hint: 'Memorable, satisfying moments' },
      { id: 'onboard', label: 'Onboard', hint: 'First run, empty states, activation' },
    ],
  },
  {
    id: 'check',
    label: 'Check',
    edits: false,
    commands: [
      { id: 'critique', label: 'Critique', hint: 'UX review: hierarchy, clarity, what to improve first' },
      { id: 'audit', label: 'Audit', hint: 'Accessibility, performance and responsive checks' },
    ],
  },
  {
    id: 'maintain',
    label: 'Maintain',
    edits: true,
    commands: [
      { id: 'harden', label: 'Harden', hint: 'Errors, edge cases, long text, i18n' },
      { id: 'optimize', label: 'Optimize', hint: 'Find and fix what makes the UI slow' },
      { id: 'extract', label: 'Extract', hint: 'Move repeated UI into src/ui/ components' },
    ],
  },
]

export function commandOf(id: string | null): (CommentCommand & { group: CommandGroup }) | null {
  for (const group of COMMAND_GROUPS) {
    const command = group.commands.find((c) => c.id === id)
    if (command) return { ...command, group }
  }
  return null
}
