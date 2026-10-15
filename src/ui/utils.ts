/**
 * Product UI layer (src/ui): the primitives screen designs, the shell and the clickdummy are built from.
 *
 * It belongs to the product and is exported to product-plan/ui/. It is NOT the Design OS UI:
 * never import from '@/components/*' here, and style with palette steps from
 * product/design-system/DESIGN.md (e.g. teal-600), not with semantic utilities (bg-primary).
 * See .claude/skills/designos-techstack/SKILL.md, "Applying the stack".
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
