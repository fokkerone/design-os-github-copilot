---
title: User Flows
summary: Design user flows with the REFINE and CARE frameworks, a Mermaid diagram, rules and red-teamed edge cases, then map them to sections and link them from specs.
tags: [how-to, flows]
sources: [.claude/skills/designos-userflow/SKILL.md, .claude/skills/designos-context/SKILL.md, wiki/_templates/flow.md, .claude/commands/design-os/shape-section.md]
created: 2026-10-09
updated: 2026-10-12
---

# User Flows

## Summary
A user flow is the step-by-step logic of how a user reaches a goal: states, decisions and failure paths, before any screen is drawn. `/design-os:userflow` (Copilot: `@userflow`) designs one in a guided session and stores it in `product/flows/` and in the wiki.

## Why
- **Logic before pixels.** A screen design shows one state. A flow shows how the user gets from trigger to success, including decisions and failures. Finding a missing step in a diagram costs minutes; finding it after five screens are designed costs a redesign.
- **Edge cases are decided, not forgotten.** Each failure path is either handled (`E1…`) or parked as an open question. Nothing is left implicit.
- **Flows cross sections.** A section spec describes one area of the product. A flow such as "sign up, verify, first use" touches several. The flow is the only place where that path is described end to end.
- **It tells you what to design next.** The prototype mapping lists every step that has no screen or state yet.
- **It survives the handoff.** The export copies flows to `product-plan/flows/` and turns the happy path and each edge case into test cases.

## Quick start

```text
/design-os:userflow                                  # asks for everything, picks the mode itself
/design-os:userflow plan submit a meter reading      # plan ahead, before screens exist
/design-os:userflow prototype reset password         # check a flow against existing screens
/design-os:userflow update submit-meter-reading      # change an existing flow
```

In GitHub Copilot, select the `@userflow` agent and type the same text without the command. Every question is multiple choice with a recommended answer; nothing is written before you confirm the review step.

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

## What you get

| Where | What |
|-------|------|
| `product/flows/<flow-id>.md` | The source. Edit it only through `/design-os:userflow update <flow-id>`. |
| `wiki/flows/<flow-id>.md` | The compiled wiki page, with links to personas, decisions and sections |
| `product/sections/<section-id>/spec.md` | One bullet per linked flow under `## User Flows` |

The flow file holds: overview, context (user, intent, trigger, success, user state), rules (`R1…`), reasoning, the Mermaid diagram, the step table (`S1…`), edge cases (`E1…`), UX notes, the prototype mapping and open questions.

## Using a flow afterwards

1. **Read it.** In Design OS, the **Sections** page lists every flow with the share of steps that have a screen design. A flow's own page (`/flows/<flow-id>`) shows the steps with links to their screens, the diagram, the edge cases, and what is still open. A section page shows the steps that run through that section; a screen design page shows which steps the screen covers and links to the step before and after.
2. **Link it to a section.** The flow command asks which specs should list the flow. `/shape-section` offers existing flows for linking and can create a new one inline. The link is one line in the spec:
   ```markdown
   ## User Flows
   - Submit meter reading — photo or manual entry to confirmation (flow: submit-meter-reading)
   - Browse past readings
   ```
   The first bullet is a linked flow; the second is a simple bullet with no flow file. Both can be mixed.
3. **Work off the gaps.** A step is covered when its `Section / Screen` column names a screen design that exists in `src/sections/<section-id>/`. Design OS works this out from the files every time, so the coverage is never out of date. Run `/shape-section` for a missing section and `/design-screen` for a missing screen. Name the screen as the step does and the step counts as covered at once. `npm run context -- --flow <flow-id>` prints the same list in the terminal.
4. **Design the screens.** `/sample-data` and `/design-screen` load the linked flows themselves. Sample data gets a record for every edge case. A screen is designed for its place in the flow: the steps it covers, the step the user comes from, the step they go to next, and a state for every edge case that returns to it. The section spec stays binding: a flow never adds scope the spec does not cover.
5. **Walk it.** `/clickdummy` builds a prototype in which you pick a flow and click through it step by step, across sections. A step without a screen shows as a gap. `/clickdummy/preview?flow=<flow-id>` shows one flow on its own.
6. **Hand it over.** `/export-product` copies every flow to `product-plan/flows/`, links it from the section README and writes one test group per linked flow (happy path plus every edge case).
7. **Ask about it.** `/design-os:wiki-query which flows touch the billing section?`

## Common questions
- **Simple bullet or full flow?** Use a simple bullet for an obvious interaction inside one screen ("sort the list"). Use a full flow when there are decisions, failure paths, several screens or several sections.
- **Do I need a persona first?** No. The flow asks who the user is and offers existing personas; you can also create one inline. See [[how-to/personas]].
- **A flow changed. What now?** Run `update <flow-id>`. The wiki page is recompiled automatically and the spec bullets keep pointing to the same id.
- **Design OS shows a conflict. What now?** A conflict means two files disagree, for example a flow lists a section whose spec does not link the flow. Nothing is fixed automatically. Decide which file is right and change it with the command that owns it: `/design-os:userflow update`, `/design-os:persona update` or `/shape-section`.
- **Is the diagram valid?** Every flow is checked with `npm run validate:mermaid` before it is handed over.

## Status
`planned` (just designed) → `in-spec` (linked from a section spec) → `in-prototype` (every step has a screen design). Status, linked personas and artifact URLs live in the frontmatter and are synced with `npm run -s wiki -- sync-meta product/flows/<flow-id>.md`.

## Related
- [[how-to/personas]] — the people flows are designed for
- [[how-to/planning-flow]] — where flows fit in
- `wiki/flows/Home.md` — all flows of this project (created with the first flow)
