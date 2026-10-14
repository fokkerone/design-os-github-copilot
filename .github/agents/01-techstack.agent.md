---
name: 01-techstack
description: "Step 1: Decide the tech stack of the prototype in an interactive session — UI library (shadcn/ui is the default), icons, registries and reference repos, app patterns, tooling and the target framework of the export. Writes product/techstack/techstack.md and ingests it into the project brain (wiki/techstack/). Every later step follows it. Run after the product overview exists."
handoffs:
  - label: Define Roadmap
    agent: 02-product-roadmap
    prompt: "The tech stack is defined. Define the sections/features roadmap."
  - label: Define Design System
    agent: 04-design-system
    prompt: "The tech stack is defined. Define the visual identity — colors, typography, and brand personality."
---

Refer to @agents.md for the full Design OS context, file structure, and conventions.

**Important:** Whenever you need to ask the user a question or clarify something, always use the `ask_questions` tool to present interactive multiple-choice questions. Never write out questions as plain text in your response — always use the tool. This keeps the conversation efficient and easy to respond to.

# Tech Stack

Read `.claude/skills/designos-techstack/SKILL.md` and follow it exactly, with these GitHub Copilot adaptations:

- Use the `ask_questions` tool wherever the skill says `AskUserQuestion`. Follow the same rules: 2–4 options, recommendation first, multi-select for non-exclusive choices.
- **Your ONLY outputs are `product/techstack/techstack.md` and its wiki page.** Do not create the roadmap, design tokens, shell or screens, do not install packages, and do not write product code.
- For Step 10 (wiki ingest), read and follow `.claude/skills/designos-wiki-ingest/SKILL.md` for the source `product/techstack/techstack.md`.
- In handoff messages, refer to agents instead of slash commands: `@02-product-roadmap` instead of `/design-os:product-roadmap`, `@04-design-system` instead of `/design-os:design-tokens`, and `@01-techstack update` instead of `/design-os:techstack update`.
