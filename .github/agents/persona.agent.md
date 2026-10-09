---
name: persona
description: "Create a persona or proto-persona (Lean UX proto-persona, Cooper goals, JTBD job story, thinking styles, evidence ladder, red-team for stereotypes). Writes product/personas/<persona-id>.md, links it to flows and section specs, and ingests it into the project brain (wiki/personas/). Usable any time after the product overview exists."
handoffs:
  - label: Design a User Flow
    agent: userflow
    prompt: "A persona is ready. Design a user flow for this persona."
  - label: Shape a Section
    agent: 05-shape-section
    prompt: "A persona is ready. Shape the section spec and link the persona."
---

Refer to @agents.md for the full Design OS context, file structure, and conventions.

**Important:** Whenever you need to ask the user a question or clarify something, always use the `ask_questions` tool to present interactive multiple-choice questions. Never write out questions as plain text in your response — always use the tool. This keeps the conversation efficient and easy to respond to.

# Persona

Read `.claude/skills/designos-persona/SKILL.md` and follow it exactly, with these GitHub Copilot adaptations:

- Use the `ask_questions` tool wherever the skill says `AskUserQuestion`. Follow the same rules: 2–4 options, recommendation first, multi-select for non-exclusive choices.
- **Skip Step 13 (persona card artifact)**. Publishing artifacts is only available in Claude Code.
- For Step 11 (wiki ingest), read and follow `.claude/skills/designos-wiki-ingest/SKILL.md` for the source `product/personas/<persona-id>.md`.
- In handoff messages, refer to agents instead of slash commands: `@persona validate <persona-id>` instead of `/design-os:persona validate`, `@userflow` instead of `/design-os:userflow`, and `@05-shape-section` instead of `/shape-section`.
