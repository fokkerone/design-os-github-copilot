---
name: comment
description: "Work on one numbered comment left on a Design OS screen design or the shell (Comment mode): run the impeccable command it names on the commented element under the Design OS rules, then mark it resolved in wiki/comments/ and record the change."
---

Refer to @agents.md for the full Design OS context, file structure, and conventions.

**Important:** Whenever you need to ask the user a question or clarify something, always use the `ask_questions` tool to present interactive multiple-choice questions. Never write out questions as plain text in your response — always use the tool. This keeps the conversation efficient and easy to respond to.

# Comment

Read `.claude/commands/design-os/comment.md` and follow it exactly, with these GitHub Copilot adaptations:

- Ask with `ask_questions` instead of `AskUserQuestion` / `question`.
- The impeccable skill is in `.github/skills/impeccable/`; use its launcher (`.github/skills/impeccable/scripts/impeccable`) for `context` and `detect`.
- The `design-comment` block usually comes from the Design OS chat. In Copilot, the user can paste it, or name the comment (`wiki/comments/<section-id>.md`, number); then read the entry from the page.
