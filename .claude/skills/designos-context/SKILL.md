---
name: designos-context
description: Load the personas and user flows that belong to a DesignOS section, screen design or flow, together with the section spec, existing screen designs, flow coverage and conflicts between the planning files. Shared context step for /sample-data, /design-screen, /shape-section, /screenshot-design, /clickdummy and /export-product. Read-only. Triggers on "load the persona and flow context", "which flows use this screen", "flow coverage", "which steps have no screen".
phase: "Planning › Shared context"
---

# Skill: designos-context

Personas say **who** a section is for. User flows say **how** the user moves through it, step by step, across sections. This skill loads both for the task at hand, so every command works from the same picture instead of from one line in a spec.

It is **read-only**. It never writes a file.

---

## Step 1 — Run the context command

Pick the narrowest scope that fits the task:

| Task | Command |
|------|---------|
| Work on one section (sample data, section spec, export of a section) | `npm run -s context -- <section-id>` |
| Design or change one screen | `npm run -s context -- <section-id> --screen <ScreenName>` |
| Work along one flow (clickdummy, screenshot series, gap list) | `npm run -s context -- --flow <flow-id>` |
| Whole product (roadmap, clickdummy, export) | `npm run -s context` |

Add `--json` when you need the data instead of the report.

The report contains:

- **Spec**: the section's `spec.md`, marked as binding
- **Personas**: linked from the spec or listing the section, with job story, pain points (`P1…`), design implications (Do / Don't), context of use and accessibility
- **User flows**: linked from the spec, listing the section, or with a step in it. Rules (`R1…`), every step (`S1…`) with its screen design and status, edge cases (`E1…`), and the coverage
- **Screen designs** of the section and the flow steps each one covers
- **Screen** (with `--screen`): the steps the screen covers, the step it comes from and the step it leads to, and the edge cases that return to it
- **Transitions** (with `--flow`): step to step with the screens on both ends, including branches and section changes
- **Conflicts** and **Gaps**

If the command is not available, read the files yourself: `product/sections/<section-id>/spec.md`, the flows and personas its bullets name with `(flow: <flow-id>)` and `(persona: <persona-id>)` in `product/flows/` and `product/personas/`, and the file names in `src/sections/<section-id>/`.

Read a flow or persona file in full only when the report is not enough, for example for a persona's assumptions or a flow's UX notes.

## Step 2 — Tell the user what you found

Two or three lines before you ask your first question:

```
Designed for: Ana — The cautious first-timer (primary, proto, low confidence)
Flows: Submit meter reading: 4 of 6 steps have a screen design (S4 missing, S6 has no screen)
Conflicts: 1 (see below)
```

If a section has no persona and no flow, say so in one line and continue. Personas and flows are optional. Mention `/design-os:persona` and `/design-os:userflow` once; do not insist.

## Step 3 — Apply the rules

1. **The section spec is binding.** `product/sections/<section-id>/spec.md` is the plan for the section. Do not add screens, steps, features or dependencies that contradict it. If a flow asks for something the spec does not cover, that is a conflict (rule 3), not a licence to extend the scope.
2. **Never invent a relation.** A screen belongs to a flow step only when the step names it in its `Section / Screen` column. A persona belongs to a section only when the spec or the persona file says so. If a relation is missing, report it as missing.
3. **Show conflicts, do not resolve them.** List every entry under **Conflicts** to the user with the two files that disagree, and ask how to proceed. Never pick a side silently, and never edit a flow, persona or spec to make a conflict disappear. Point to the command that owns the file: `/design-os:userflow update <flow-id>`, `/design-os:persona update <persona-id>`, `/shape-section`.
4. **Gaps are information.** A step without a screen design is work that is still open, not an error. Name the gaps; do not treat a missing screen as if it existed.
5. **Stay in scope.** Load the context for the section, screen or flow you are working on. Do not pull every persona and flow into a task that concerns one screen.
6. **Coverage is computed, never written.** It follows from the flow's step table and the files in `src/sections/`. Do not write coverage numbers into a flow, spec or wiki page.

## How a flow step is matched to a screen design

A step is covered when its `Section / Screen` cell names a section of the roadmap and a screen design whose file exists:

```
| S4 | Review reading | … | `meter-readings` / `ReadingReview` | … |
        →  src/sections/meter-readings/ReadingReview.tsx
```

| Status | Meaning |
|--------|---------|
| `exists` | The named screen design exists |
| `MISSING` | The step names a screen design that does not exist yet |
| `NO SCREEN` | The step names no screen design |
| `UNKNOWN SECTION` | The step names a section that is not in the roadmap |
| `AMBIGUOUS` | The step names a screen without a section, and several sections have one |
| `partial` | The screen exists, but the flow's Prototype Mapping says a state or action is missing |

So when you create a screen design for a step, **give the file the name the step uses**. The coverage then updates by itself, in the app and in this report. If another name is better, tell the user to change the step with `/design-os:userflow update <flow-id>`; do not edit the flow file from another command.
