---
title: User Flows
summary: Design user flows with the REFINE and CARE frameworks, a Mermaid diagram, rules and red-teamed edge cases, then map them to sections and link them from specs.
tags: [how-to, flows]
sources: [.claude/skills/designos-userflow/SKILL.md]
created: 2026-10-09
updated: 2026-10-09
---

# User Flows

## Summary
A user flow is the step-by-step logic of how a user reaches a goal: states, decisions and failure paths, before any screen is drawn. `/design-os:userflow` (Copilot: `@userflow`) designs one in a guided session and stores it in `product/flows/` and in the wiki.

## When to use it
Any time after the roadmap exists:

| Mode | Use it when |
|------|-------------|
| `plan` | Sections or screens don't exist yet |
| `prototype` | Screens exist; you also get a gap list of missing screens and states |
| `update <flow-id>` | You want to change an existing flow |
| inline | From `/shape-section`, while defining a section |

## Step by step

1. **Context.** Pick the goal, the primary user (existing personas are offered first), the trigger and the user's state (in a hurry, on mobile, first time, ...).
2. **Confirm the ask.** One sentence: who, goal, start, end.
3. **Rules.** Choose hard constraints such as "readings below the previous value are rejected" (`R1…`). Every rule must show up in the flow.
4. **Reference patterns.** Pick proven patterns (wizard, deep link, inline validation, ...) or an existing flow.
5. **Reasoning.** Review requirements (legal, privacy, accessibility), friction points, minimum data, the state model and where the flow lives.
6. **Happy path.** A step table (`S1…`) and a Mermaid flowchart.
7. **Kill the happy path.** A QA persona red-teams the flow; you choose which failures to handle (`E1…`). The rest go to open questions.
8. **Nuance pass.** Cognitive load, progressive disclosure, loading/empty/error states.
9. **Mapping.** Every step is mapped to a section and screen design: `exists`, `partial`, `gap`, `planned` or `new-section`.
10. **Review and write.** `product/flows/<flow-id>.md` is written and its diagram validated.
11. **Wiki.** The flow is compiled into `wiki/flows/<flow-id>.md` automatically.
12. **Link.** Choose which section specs list the flow. Spec bullets end with `(flow: <flow-id>)` and the app shows the diagram in the section's spec card.
13. **Optional artifact.** Publish an interactive flow page for stakeholders (Claude Code only).

## Status
`planned` (just designed) → `in-spec` (linked from a section spec) → `in-prototype` (every step has a screen design). Status, linked personas and artifact URLs live in the frontmatter and are synced with `npm run -s wiki -- sync-meta product/flows/<flow-id>.md`.

## Related
- [[how-to/personas]] — the people flows are designed for
- [[how-to/planning-flow]] — where flows fit in
- `wiki/flows/Home.md` — all flows of this project (created with the first flow)
