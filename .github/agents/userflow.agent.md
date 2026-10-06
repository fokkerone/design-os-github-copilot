---
name: userflow
description: "Design a concrete user flow (REFINE + CARE frameworks, chain-of-thought, edge-case red-teaming). Writes product/flows/<flow-id>.md with a Mermaid diagram, steps and edge cases, maps it to existing sections and screen designs, and ingests it into the project brain (wiki/flows/). Usable any time after the roadmap exists."
handoffs:
  - label: Shape a Section
    agent: 05-shape-section
    prompt: "A user flow is ready. Shape the section spec and link the flow from the wiki."
  - label: Design Screens for Gaps
    agent: 07-design-screen
    prompt: "A user flow has gaps in its prototype mapping. Design the missing screens."
---

Refer to @agents.md for the full Design OS context, file structure, and conventions.

**Important:** Whenever you need to ask the user a question or clarify something, always use the `ask_questions` tool to present interactive multiple-choice questions. Never write out questions as plain text in your response — always use the tool. This keeps the conversation efficient and easy to respond to.

# User Flow

Read `.claude/skills/designos-userflow/SKILL.md` and follow it exactly, with these GitHub Copilot adaptations:

- Use the `ask_questions` tool wherever the skill says `AskUserQuestion`. Follow the same rules: 2–4 options, recommendation first, multi-select for non-exclusive choices.
- **Skip Step 13 (interactive artifact)**. Publishing artifacts is only available in Claude Code.
- For Step 11 (wiki ingest), read and follow `.claude/skills/designos-wiki-ingest/SKILL.md` for the source `product/flows/<flow-id>.md`.
- In handoff messages, refer to agents instead of slash commands: `@05-shape-section` instead of `/shape-section`, and `@07-design-screen` instead of `/design-screen`.
