---
title: {{title}}
summary: <who achieves what, from trigger to success, in 1–2 sentences>
tags: [flows, <topic-tags e.g. auth, onboarding>]
sources: [product/flows/<flow-id>.md]
flow_id: <flow-id>
flow_status: <planned | in-prototype | in-spec>   # maintained by `npm run -s wiki -- sync-meta`
artifacts: []                                      # maintained by `npm run -s wiki -- sync-meta`
personas: []                                       # maintained by `npm run -s wiki -- sync-meta`
sections: [<section-id>]
created: {{date:YYYY-MM-DD}}
updated: {{date:YYYY-MM-DD}}
provenance:
  extracted: ~95%
  inferred: ~5%
  ambiguous: ~0%
---

# {{title}}

## Summary
<Overview from the flow file.>

## Diagram

```mermaid
flowchart TD
  start(["Start: <trigger>"]) --> S1
  subgraph section_id["<Section title>"]
    S1["S1 · <step>"] --> S2{"S2 · <decision?>"}
    S2 -- "yes" --> S3["S3 · <step>"]
    S2 -- "no" --> S4[["Flow: <other-flow-id>"]]
    S4 --> S3
  end
  S3 --> done(["Success: <end state>"])
  S3 -. "<failure>" .-> E1["E1 · <recovery>"]
  E1 --> S3

  classDef error fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
  classDef terminal fill:#ecfccb,stroke:#65a30d,color:#365314
  class E1 error
  class start,done terminal
```

## Description
<Narrative walk-through of the happy path in 1–3 short paragraphs: trigger, key decisions, end state. Reference step ids (S1…). The only synthesized section — mark interpretation ^[inferred].>

## Context
- **User:** [[personas/<persona-id>]] or <role, when no persona exists>
- **Intent:** <goal>
- **Trigger:** <entry point>
- **Success:** <end state>
- **User state:** <stressed, first-time, mobile, ...>

## Rules
- **R1** — <hard constraint>

## Steps

| # | Step | User action | System response | State | Section / Screen | Rules |
|---|------|-------------|-----------------|-------|------------------|-------|
| S1 | <step> | <action> | <response> | `<state>` | `<section-id>` / `<Screen>` | R1 |

## Edge Cases

| # | Failure | Trigger | Handling | Returns to |
|---|---------|---------|----------|-----------|
| E1 | <failure> | <trigger> | <handling> | S3 |

## UX Notes
- **Cognitive load:** <...>
- **Progressive disclosure:** <...>
- **State management:** <...>

## Prototype Mapping

| Step | Section | Screen design | Status | Missing |
|------|---------|---------------|--------|---------|
| S1 | `<section-id>` | `<Screen>` | exists | — |

<One-line gap summary.>

## Open Questions
- [ ] <...>

## Related
- [[flows/<other-flow-id>]] — <sub-flow or related flow>
- [[personas/<persona-id>]] — <persona this flow is designed for>
- [[decisions/<page>]] — <decision that constrained this flow>
- `product/sections/<section-id>/spec.md` — <section this flow touches>
- `product/flows/<flow-id>.md` — source
