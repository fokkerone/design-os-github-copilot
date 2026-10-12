---
title: Personas
summary: Create personas and proto-personas in a guided session, link them to sections and flows, and raise their confidence as evidence comes in.
tags: [how-to, personas]
sources: [.claude/skills/designos-persona/SKILL.md, .claude/skills/designos-context/SKILL.md, wiki/_templates/persona.md]
created: 2026-10-09
updated: 2026-10-12
---

# Personas

## Summary
A persona is a shared, testable picture of who the product is for and how they think. `/design-os:persona` (Copilot: `@persona`) builds one in a guided session and stores it in `product/personas/` and in the wiki. The template combines Lean UX proto-personas, NN/g persona types, Cooper's goal-directed design, Jobs to be Done, Indi Young's thinking styles and inclusive design.

## Why
- **One shared answer to "who is this for?"** Without it, every section is designed for a different imagined user, usually the designer.
- **Decisions get a reason.** "Don't hide the total behind a tap" is an opinion. "Ana double-checks every amount before she submits (P2)" is a requirement.
- **Assumptions become visible.** A proto-persona says openly what the team believes but has not checked, and how to check it. That is cheaper than discovering it after launch.
- **Less repetition.** Product vision, user flows and shape section read existing personas and stop asking who the user is.
- **It reaches the developers.** The export ships personas with the handoff, so the implementation agent knows who the UI is for.

## Quick start

```text
/design-os:persona                                   # asks for everything, picks the mode itself
/design-os:persona proto tenants who submit readings # no research yet: assumptions, labeled as such
/design-os:persona research property managers        # based on interviews in wiki/raw/ or wiki/research/
/design-os:persona validate cautious-first-timer     # new evidence arrived
/design-os:persona update cautious-first-timer       # change a persona
```

In GitHub Copilot, select the `@persona` agent and type the same text without the command. Every question is multiple choice with a recommended answer; nothing is written before you confirm the review step.

Start with one **primary** persona. Add a secondary or a negative persona ("not for them") only when it changes a design decision.

## Principles
- **Behavior over demographics.** No photos, no invented age or hobbies, unless they change behavior.
- **Assume out loud, then go check.** Every unproven claim gets an assumption id (`A1…`), an evidence level and a way to validate it.
- **One persona, one job.**
- **Design implications or it didn't happen.** Every pain point leads to a "Do" or "Don't".

## When to use it
Any time after the product overview exists:

| Mode | Use it when |
|------|-------------|
| `proto` | No user research yet; the persona is labeled "assumptions, not research" |
| `research` | Interviews, surveys or tickets exist in `wiki/raw/` or `wiki/research/` |
| `update <persona-id>` | You want to change a persona |
| `validate <persona-id>` | New evidence arrived; evidence levels and confidence are updated |
| inline | From `/design-os:userflow`, `/shape-section` or `/product-vision` |

## Step by step

1. **Segment, priority, evidence base.** Which user group; `primary`, `secondary`, `supplemental` or `negative`; `proto`, `qualitative` or `statistical`.
2. **Job story.** "When … I want to … so I can …" — exactly one.
3. **Goals.** End goals (what they want done), experience goals (how they want to feel), one life goal (why it matters).
4. **Thinking style.** Behaviors and guiding principles, plus 1–5 scales such as tech confidence or need for reassurance.
5. **Pain points and context.** Each pain point with today's workaround and the underlying need (`P1…`); devices, environment, collaborators and accessibility constraints.
6. **Red team.** A research critic flags stereotypes, elastic personas, untestable claims and the riskiest assumption; you choose what to fix.
7. **Design implications and mapping.** "Do / Don't" rules citing pain points; the sections and flows the persona belongs to; a quote and a name.
8. **Review and write.** A coverage check makes sure every pain point has an implication, then `product/personas/<persona-id>.md` is written.
9. **Wiki.** The persona is compiled into `wiki/personas/<persona-id>.md` automatically.
10. **Link.** Section specs get a bullet under `## Personas` ending in `(persona: <persona-id>)`; flows list the persona in their `personas:` frontmatter. The app shows linked personas in the section's spec card.
11. **Optional artifact.** Publish a persona card where stakeholders can mark which assumptions they have seen evidence for (Claude Code only).

## What you get

| Where | What |
|-------|------|
| `product/personas/<persona-id>.md` | The source. Edit it only through `/design-os:persona update` or `validate`. |
| `wiki/personas/<persona-id>.md` | The compiled wiki page, with links to flows and research |
| `product/sections/<section-id>/spec.md` | One bullet per linked persona under `## Personas` |
| `product/flows/<flow-id>.md` | The persona id in the `personas:` frontmatter |

## Using a persona afterwards

1. **Read it.** In Design OS, the **Product** page lists all personas. A persona's own page (`/personas/<persona-id>`) shows the job story, pain points, design implications and evidence, and the sections, flows and screens that address it. Section pages show who they are designed for; screen design pages show who the screen is for.
2. **Link it to a section.** The persona command asks which sections and flows it belongs to. `/shape-section` offers existing personas and can create one inline. The link is one line in the spec:
   ```markdown
   ## Personas
   - Ana — The cautious first-timer (persona: cautious-first-timer)
   ```
3. **Design a flow for it.** `/design-os:userflow` offers the persona as the primary user and takes over its context of use, pain points and accessibility constraints.
4. **Use the design implications.** `/shape-section` proposes UI requirements from the persona's pain points and "Do / Don't" rules and marks where each one comes from, e.g. `(from: cautious-first-timer P1)`. `/sample-data` and `/design-screen` load the personas of the section themselves: screens follow every "Do", avoid every "Don't", and take the context of use and accessibility constraints into account.
5. **Validate it.** Put interview notes, survey results or support tickets into `wiki/raw/`, run `/design-os:wiki-ingest --pending`, then `/design-os:persona validate <persona-id>`. Evidence levels and confidence are updated.
6. **Hand it over.** `/export-product` copies personas to `product-plan/personas/`.
7. **Ask about it.** `/design-os:wiki-query what do we still assume about Ana?`

## Common questions
- **Proto or research?** `proto` when you have no user research: fast, honest about being assumptions. `research` when interviews or data exist. A proto-persona becomes a research persona through `validate`.
- **How many?** One primary persona per product is enough to start. More than three or four usually means they are segments, not personas.
- **Persona first or flow first?** Persona first is easier: the flow takes over its context. Both orders work.
- **A persona turned out wrong.** Run `validate` and mark the assumptions as disproven, or set it to `retired` with `update`. Linked specs and flows keep the id, so you see where it was used.

## Evidence and confidence

| Level | Meaning |
|-------|---------|
| `assumption` | A belief without evidence |
| `hypothesis` | Rephrased to be testable |
| `signal` | Cheap early evidence: tickets, analytics, sales notes |
| `firsthand` | Observed or heard in interviews |
| `pattern` | Confirmed across several sources |

`confidence` is `low` while most assumptions sit at the bottom, `medium` once the job story is at `signal` or above, and `high` when the job story, end goals and top pain points are `firsthand` or `pattern`. Run `/design-os:persona validate <persona-id>` whenever research comes in.

## Status
`draft` (just created) → `active` (linked from a flow or spec) → `validated` (confidence `high`), or `retired`. Status, confidence, links and artifact URLs live in the frontmatter and are synced with `npm run -s wiki -- sync-meta product/personas/<persona-id>.md`.

## Where personas show up
- Product vision, user flows and shape section offer existing personas instead of asking again.
- The export copies them to `product-plan/personas/` with a README; proto-personas are marked as open questions, not requirements.

## Related
- [[how-to/user-flows]] — design a flow for a persona
- [[how-to/planning-flow]] — where personas fit in
- `wiki/personas/Home.md` — all personas of this project (created with the first persona)
