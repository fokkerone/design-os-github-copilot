---
title: {{title}}
summary: <archetype + job story in 1–2 sentences: who they are in relation to the product and what they hire it for>
tags: [personas, <topic-tags e.g. onboarding, accessibility>]
sources: [product/personas/<persona-id>.md]
persona_id: <persona-id>
persona_kind: <proto | qualitative | statistical>
persona_priority: <primary | secondary | supplemental | negative>
persona_status: <draft | active | validated | retired>   # maintained by `npm run -s wiki -- sync-meta`
confidence: <low | medium | high>                        # maintained by `npm run -s wiki -- sync-meta`
flows: []                                                # maintained by `npm run -s wiki -- sync-meta`
sections: []                                             # maintained by `npm run -s wiki -- sync-meta`
artifacts: []                                            # maintained by `npm run -s wiki -- sync-meta`
created: {{date:YYYY-MM-DD}}
updated: {{date:YYYY-MM-DD}}
provenance:
  extracted: ~95%
  inferred: ~5%
  ambiguous: ~0%
---

# {{title}}

> <PROTO ONLY — delete for qualitative/statistical:> **Proto-persona: assumptions, not research.** Created <YYYY-MM-DD>. Check the evidence levels below before treating anything here as fact.

> "<One sentence in the persona's own voice that captures their core motivation or frustration.>"

## Summary
<Who this is, in relation to the product, and why they matter. Copied from the persona file's Overview.>

## Job Story
**When** <situation / trigger>, **I want to** <motivation>, **so I can** <expected outcome>.

## Snapshot
- **Archetype:** <behavioral label, e.g. "The cautious first-timer">
- **Role:** <job or relationship to the product>
- **Context:** <where, when and how often they meet the problem>
- **Domain expertise:** <novice | intermediate | expert> — <one line>
- **Tech confidence:** <low | medium | high> — <one line>
- **Only relevant attributes:** <age, location, household, ... only when they change behavior; otherwise delete this line>

## Goals
- **End goals** (what they want to get done): <...>
- **Experience goals** (how they want to feel while doing it): <...>
- **Life goals** (why it matters to them beyond the product): <...>

## Thinking Style & Behaviors
<How they reason about the task: decision criteria, inner voice, guiding principles, habits. Thinking style, not demographics.>

- <behavior or guiding principle> (A1)

## Behavioral Dimensions

| Dimension | 1 | 5 | Position |
|-----------|---|---|----------|
| <e.g. Tech confidence> | <anxious> | <power user> | 2 |

## Needs & Pain Points

| # | Pain point | Current workaround | Need | Evidence |
|---|-----------|--------------------|------|----------|
| P1 | <frustration> | <what they do today> | <underlying need> | A2 |

## Context of Use
- **Devices & channels:** <...>
- **Environment:** <on the go, office, noisy, shared screen, ...>
- **Frequency & duration:** <...>
- **Time pressure & interruptions:** <...>
- **Collaborators & influencers:** <who else is involved or decides>

## Accessibility & Inclusion
- **Permanent:** <...>
- **Temporary:** <...>
- **Situational:** <...>

## Design Implications
- **Do:** <concrete design consequence> (P1, A3)
- **Don't:** <what would lose this persona>

## Boundaries
- **Not this persona:** <who is easily confused with them and why they differ>
- **Doesn't care about:** <features or qualities that don't matter to them>

## Assumptions & Evidence

| # | Assumption | Evidence level | Source | How to validate |
|---|-----------|----------------|--------|-----------------|
| A1 | <belief> | assumption | team workshop | <interview question / metric> |

Evidence ladder: `assumption` → `hypothesis` → `signal` → `firsthand` → `pattern`.

## Open Questions
- [ ] <what to research next>

## Related
- [[personas/<other-persona-id>]] — <how they relate, e.g. secondary persona, negative persona>
- [[flows/<flow-id>]] — <flow this persona drives>
- [[research/<page>]] — <research that grounds this persona>
- `product/personas/<persona-id>.md` — source
