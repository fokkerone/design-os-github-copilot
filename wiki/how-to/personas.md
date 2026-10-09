---
title: Personas
summary: Create personas and proto-personas in a guided session, link them to sections and flows, and raise their confidence as evidence comes in.
tags: [how-to, personas]
sources: [.claude/skills/designos-persona/SKILL.md, wiki/_templates/persona.md]
created: 2026-10-09
updated: 2026-10-09
---

# Personas

## Summary
A persona is a shared, testable picture of who the product is for and how they think. `/design-os:persona` (Copilot: `@persona`) builds one in a guided session and stores it in `product/personas/` and in the wiki. The template combines Lean UX proto-personas, NN/g persona types, Cooper's goal-directed design, Jobs to be Done, Indi Young's thinking styles and inclusive design.

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
