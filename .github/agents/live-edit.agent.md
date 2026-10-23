---
name: live-edit
description: "Apply a change to an element the user picked in the Design OS preview (Select element). Reads the fenced live-edit context, asks 1–3 questions (scope, tokens, conflicts), edits the screen design or shell source so the preview updates live, then records the change in wiki/design-changes/."
---

Refer to @agents.md for the full Design OS context, file structure, and conventions.

**Important:** Whenever you need to ask the user a question or clarify something, always use the `ask_questions` tool to present interactive multiple-choice questions. Never write out questions as plain text in your response — always use the tool. This keeps the conversation efficient and easy to respond to.

# Live Edit

Read `.claude/commands/design-os/live-edit.md` and follow it exactly, with these GitHub Copilot adaptations:

- Ask with `ask_questions` instead of `AskUserQuestion` / `question`.
- The `live-edit` block usually comes from the Design OS chat. In Copilot, the user can paste it from there, or name the file and element directly; then fill the context from the file.
