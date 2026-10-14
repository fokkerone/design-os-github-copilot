---
name: design-system-volta-3-0-components
description: Creates implementation-ready design-system guidance derived from local Figma styles in "Volta 3.0 Components".
---

<!-- TYPEUI_SH_MANAGED_START -->

# Volta 3.0 Components

## Mission

Document and operationalize the Volta 3.0 Components style foundations extracted from Figma so teams can build consistent interfaces quickly.

## Brand

- Product/brand: Volta 3.0 Components
- Audience: Designers and engineers building this product
- Product surface: web app

## Style Foundations

- Visual style: token-driven, expressive, polished, radius 💨 Tailwind/borders/radius/rounded-none/💨 Tailwind/borders/radius/rounded-sm/💨 Tailwind/borders/radius/rounded/💨 Tailwind/borders/radius/rounded-md
- Typography scale: Tailwind/XS/Light, Tailwind/XS/Regular, Tailwind/XS/Medium, Tailwind/XS/Semi Bold, Tailwind/XS/Bold, Tailwind/SM/Light, Tailwind/SM/Regular, Tailwind/SM/Medium, Tailwind/SM/Semi Bold, Tailwind/SM/Bold, Tailwind/Base/Light, Tailwind/Base/Regular, Tailwind/Base/Medium, Tailwind/Base/Semi Bold
- Color palette: avatar-1, avatar-2, avatar-3, avatar-4, avatar-5, avatar-6, avatar-7, avatar-8, avatar-9, avatar-10, avatar-11, avatar-12, avatar-13, avatar-14
- Spacing scale: 💨 Tailwind/spacing/px, 💨 Tailwind/spacing/0, 💨 Tailwind/spacing/0, 5, 💨 Tailwind/spacing/1, 💨 Tailwind/spacing/1, 5, 💨 Tailwind/spacing/2, 💨 Tailwind/spacing/2, 5, 💨 Tailwind/spacing/3, 💨 Tailwind/spacing/3, 5, 💨 Tailwind/spacing/4, 💨 Tailwind/spacing/5, 💨 Tailwind/spacing/6, 💨 Tailwind/spacing/7, 💨 Tailwind/spacing/8
- Radius/shadow/motion tokens: 🚀 Themes/shadow/xl/2/spread-radius, 🚀 Themes/shadow/xl/1/spread-radius, 🚀 Themes/shadow/xl/1/blur-radius, 🚀 Themes/shadow/lg/2/spread-radius, 🚀 Themes/shadow/lg/2/blur-radius, 🚀 Themes/shadow/lg/2/offset-y, 🚀 Themes/shadow/lg/1/offset-y, 🚀 Themes/shadow/xl/2/blur-radius, 🚀 Themes/shadow/xs/offset-x, 🚀 Themes/shadow/lg/2/offset-x, 🚀 Themes/shadow/md/2/offset-y, 🚀 Themes/shadow/xl/2/offset-y, 🚀 Themes/shadow/md/2/offset-x, 🚀 Themes/shadow/sm/2/blur-radius

## Component Families

- Solid Badge
- Soft Badge
- Outline Badge
- Dot Badge
- Outline with icon
- Soft Dot Badge
- Gradient badge
- Badges for blocks
- Style=Primary
- Size=sm
- Shape=Round
- Stats=Default
- Style=Primary
- Size=sm
- Shape=Rounded
- Stats=Default
- Style=Primary
- Size=sm
- Shape=Round
- Stats=Hover
- Style=Primary
- Size=sm
- Shape=Rounded
- Stats=Hover
- Style=Secondary
- Size=sm
- Shape=Round
- Stats=Default
- Style=Secondary
- Size=sm
- Shape=Rounded
- Stats=Default

## Accessibility

- Target: WCAG 2.2 AA
- Keyboard-first interactions required
- Focus-visible rules required
- Contrast constraints required

## Writing Tone

concise, confident, implementation-focused

## Rules: Do

- Use extracted color tokens before introducing one-off values: avatar-1
- avatar-2
- avatar-3
- avatar-4
- avatar-5
- avatar-6.
- Use these typography styles consistently: Tailwind/XS/Light
- Tailwind/XS/Regular
- Tailwind/XS/Medium
- Tailwind/XS/Semi Bold
- Tailwind/XS/Bold
- Tailwind/SM/Light.
- Define all interaction states for interactive components: default
- hover
- focus-visible
- active
- disabled
- and loading.

## Rules: Don't

- Do not duplicate existing style tokens with one-off naming.
- Do not remove focus-visible indicators or keyboard support.
- Do not hard-code raw values where local styles or variables already exist.

## Guideline Authoring Workflow

1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy
4. variants
5. and interactions.
6. Add accessibility acceptance criteria.
7. Add anti-patterns and migration notes.
8. End with QA checklist.

## Required Output Structure

- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations

- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates

- Every non-negotiable rule uses "must".
- Every recommendation uses "should".
- Every accessibility rule is testable in implementation.
- Prefer system consistency over local visual exceptions.

## Acceptance Checklist

- Frontmatter exists with valid `name` and `description`.
- Guidance is under 500 lines for `skill.md` when possible.
- Accessibility and interaction states are explicitly documented.
- Rules are concrete, testable, and non-ambiguous.
- Output can be reused in other repositories with only variable replacement.

## TypeUI + Agentic Integration

This `SKILL.md` is intended for `typeui.sh` CLI workflows.
It can later be integrated with agentic tools including Claude Code, OpenCode, Gemini CLI, Cursor, and similar assistants.

<!-- TYPEUI_SH_MANAGED_END -->
