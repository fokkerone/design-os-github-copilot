/**
 * Tech stack loading (product/techstack/techstack.md).
 * The file format is defined in .claude/skills/designos-techstack/SKILL.md.
 */

import { defaultTechstack, parseTechstack, type Techstack } from './model/techstack.ts'

const techstackFiles = import.meta.glob('/product/techstack/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const TECHSTACK_FILE = '/product/techstack/techstack.md'

/** Check if the tech stack step has been run */
export function hasTechstack(): boolean {
  return TECHSTACK_FILE in techstackFiles
}

/** The tech stack from the file, or the defaults (shadcn/ui, lucide-react, ...) when the step has not been run */
export function loadTechstack(): Techstack {
  const content = techstackFiles[TECHSTACK_FILE]
  return content ? parseTechstack(content) : defaultTechstack()
}
