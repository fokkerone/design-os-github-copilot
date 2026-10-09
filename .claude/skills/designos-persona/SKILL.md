---
name: designos-persona
description: Create a persona or proto-persona for a DesignOS product in an interactive session. Combines Lean UX proto-personas, Cooper's goal-directed goals, Jobs-to-be-Done job stories, Indi Young's thinking styles and an evidence ladder, then red-teams the draft for stereotypes and untested assumptions. Produces product/personas/<persona-id>.md, ingests it into the wiki (wiki/personas/), links it to flows and section specs, and can publish a persona card artifact. Triggers on /design-os:persona, "create a persona", "proto-persona", "define our target user", "update the persona", "validate the persona".
slash_command: persona
phase: "Planning › Personas"
---

# Skill: designos-persona

You create **personas**: a shared, testable picture of who the product is for and how they think. A persona is a design tool, not a marketing profile. It earns its place only if it changes design decisions, so every field must either drive a decision or be dropped.

A persona is designed through a fixed pipeline that combines the established approaches:

| Stage | Source | What it prevents |
|-------|--------|------------------|
| Kind and priority | NN/g persona types, Cooper persona priority | Treating guesses as research; designing for everyone at once |
| Job story | Jobs to be Done (job stories) | Personas without a purpose |
| Goals | Cooper, goal-directed design (end, experience, life goals) | Feature lists disguised as goals |
| Thinking style | Indi Young, thinking styles | Demographic stereotypes standing in for behavior |
| Needs and pain points | Lean UX proto-persona quadrants | Solutions without problems |
| Context and inclusion | Contextual design, Microsoft Inclusive Design | Designing only for the ideal desk setup |
| Red team | Evidence ladder, bias check | Laundering assumptions into facts, elastic personas |
| Design implications and mapping | DesignOS | Personas that sit in a drawer |

**Core principles** (enforce them in every stage):

1. **Behavior over demographics.** Age, gender, location, photos and hobbies are left out unless they demonstrably change behavior. No stock photos, no invented precision ("34 years old, two cats").
2. **Assume out loud, then go check.** Every claim that isn't backed by research gets an assumption id (`A1…`) with an evidence level and a way to validate it.
3. **One persona, one job.** If the persona needs "and" to describe what they want, it is two personas or an elastic one.
4. **Design implications or it didn't happen.** Every pain point leads to at least one "Do" or "Don't".

---

## Interaction Rules (mandatory)

- **Every question goes through the structured question tool.** In Claude Code that is `AskUserQuestion`; in GitHub Copilot it is `ask_questions`. Never ask questions as plain prose.
  - Offer 2–4 concrete options per question, derived from the product context, not generic placeholders.
  - Put your recommendation first and suffix it with `(Recommended)`.
  - Use `multiSelect: true` whenever choices are not mutually exclusive (goals, pain points, behaviors, contexts, sections, flows).
  - Bundle up to 4 independent questions per call; ask dependent questions in a later call.
  - Free-text answers come through the automatic "Other" option. Don't add your own "Other".
  - Keep labels short (1–5 words) and put detail in the description, so the prompts work with hardware controllers like Stream Deck.
- **Never write a file before the user confirmed the review step.**
- **Stay in scope.** You create personas. You do not create flows (`/design-os:userflow`), section specs (`/shape-section`) or screen designs. Point to those commands instead.

---

## Modes

| Mode | When | Difference |
|------|------|-----------|
| `proto` | No user research yet, or a fast team alignment | Kind `proto`; every claim starts as `assumption`; the card is labeled "assumptions, not research" |
| `research` | Interviews, surveys, support tickets or analytics exist in `wiki/raw/`, `wiki/research/` or as pasted notes | Kind `qualitative` (or `statistical` with a clustered survey); claims cite their source and start at `signal` or higher |
| `update <persona-id>` | Revise an existing persona | Loads `product/personas/<persona-id>.md`, asks what to change, re-runs affected stages only |
| `validate <persona-id>` | New evidence arrived | Walks through the Assumptions table, raises or lowers evidence levels, marks disproven assumptions, recomputes `confidence` and `status` |
| `inline` | Called from `/design-os:userflow`, `/shape-section` or `/product-vision` | Pre-fill from the calling conversation and confirm instead of asking again; the caller does the linking |

No mode given: if `wiki/raw/` or `wiki/research/` contain interviews or research about users, ask `research` vs `proto` (recommend `research`); otherwise use `proto`.

---

## Step 0 — Load context (silent, no questions yet)

Read what exists. Skip missing files without comment:

- `product/product-overview.md`: product, problems, features (the problems are your first pain-point hypotheses)
- `product/product-roadmap.md`: section ids and titles
- `product/data-shape/data-shape.md`: entity vocabulary (use these names)
- `product/sections/*/spec.md`: sections and their `## Personas`
- `product/flows/*.md`: flows and their `personas:` frontmatter (the `**User:**` line in Context names the intended user)
- `product/personas/*.md`: existing personas (avoid duplicates, find gaps in coverage, pick the next priority)
- Project brain: `wiki/Home.md`, `wiki/personas/Home.md`, `wiki/research/`, `wiki/feedback/`, `wiki/decisions/`, and a full-text search of `wiki/` (including `wiki/raw/`) for user groups, roles, interview notes and quotes.

If a persona with the same archetype or job already exists, ask: update it (Recommended) / create a variant / create anyway.

## Step 1 — Role

Adopt the role for all design stages:

> Act as a **Senior UX Researcher** for <product name>. You describe how people think and decide, you separate evidence from assumption, and you refuse stereotypes.

Switch to the **Research Critic** persona only in Step 8.

## Step 2 — Kind, segment and priority

Ask (one call):

1. **User segment**: which group this persona represents. Options come from the overview's problems and features, existing flows' `**User:**` lines, and wiki research. Mark segments that have no persona yet.
2. **Priority** (Cooper): `primary` (the interface is designed for them; satisfying them must not fail the others) / `secondary` (mostly served by the primary design, with a few extra needs) / `supplemental` (served by the primary and secondary designs) / `negative` (who we deliberately do **not** design for). Recommend `primary` if no primary persona exists yet.
3. **Evidence base** (NN/g): `proto` (team knowledge) / `qualitative` (5–30 interviews) / `statistical` (qualitative + survey clustering). Recommend from the mode.
4. **Sources** (multiSelect, `research` mode only): which files in `wiki/raw/` and pages in `wiki/research/` to draw from. Read them fully before Step 3.

Derive a kebab-case `persona-id` from the archetype, not from a fake first name (e.g. `cautious-first-timer`, `busy-property-manager`). Ids are stable; names may change.

## Step 3 — Job story (JTBD)

Propose 2–3 job stories in the form **When** <situation>, **I want to** <motivation>, **so I can** <expected outcome>. Derive them from the segment and the overview's problems. Ask the user to pick one (single select) and refine it via Other if needed. One persona has exactly one primary job.

## Step 4 — Goals (Cooper)

Propose goals in three tiers and let the user pick (multiSelect, one question per tier, up to 4 options each):

- **End goals**: what they want to get done (drives features and flows)
- **Experience goals**: how they want to feel while doing it, e.g. "feel in control", "not feel stupid" (drives tone and interaction design)
- **Life goals**: why it matters beyond the product (drives long-term value; optional, keep to one)

Reject goals that are features ("use the dashboard"). Rephrase them as outcomes.

## Step 5 — Thinking style, behaviors and dimensions

1. Propose 4–6 behaviors and guiding principles phrased as how they reason, e.g. "Double-checks numbers before submitting anything official", "Prefers asking a colleague over reading help text" (multiSelect). Each selected behavior gets an assumption id.
2. Propose 3–5 **behavioral dimensions** as 1–5 scales relevant to this product (e.g. tech confidence, domain expertise, time pressure, need for reassurance, frequency of use) and ask where the persona sits: one question per dimension, options 1–5 with short descriptions (merge positions like "1–2" when needed). Dimensions are what make personas comparable on the Home page.
3. Snapshot: archetype label, role, context, domain expertise, tech confidence. Ask whether any demographic attribute actually changes behavior; include it only if the answer is yes and say why.

**Keep the session short.** Ask the behaviors (up to 2 questions) together with the first 2 dimensions in one call, and the remaining dimensions together with the demographics question in the next. Never spend a call on fewer than 3 questions when more independent questions are pending. Target: 7–8 question rounds for the whole session.

## Step 6 — Needs, pain points and context of use

Propose 4–8 pain points (multiSelect, across up to 2 questions). For each selected one, record the **current workaround** (what they do today without the product) and the **underlying need**. Workarounds are the strongest validation hooks; ask for them explicitly if they are unclear. Number them `P1…Pn`.

Ask the pain points together with the first two context questions of Step 7 in one call (4 questions), and the remaining two context questions in the next call together with anything left over.

## Step 7 — Context of use and inclusion

Context questions (bundled with Step 6 as described there):

1. **Devices and channels** (multiSelect): desktop, mobile, tablet, email, print, phone, ...
2. **Environment and pressure** (multiSelect): on the go, interrupted often, shared screen, deadline-driven, low bandwidth, ...
3. **Collaborators** (multiSelect): who else is involved, approves or influences.
4. **Inclusion** (multiSelect, Microsoft Inclusive Design): permanent (e.g. low vision), temporary (e.g. injured hand), situational (e.g. bright sunlight, one hand free). Recommend at least one situational constraint for every persona.

## Step 8 — Red team (Research Critic)

Switch persona: *"Act as a Research Critic reviewing this persona. Find every way it could mislead the team."* Check and present findings as a multiSelect question (which should be fixed?):

- **Stereotypes and filler**: demographic details or clichés without behavioral consequence → remove.
- **Elastic persona**: goals or behaviors that contradict each other or cover several segments → split or narrow.
- **Laundered assumptions** (`research` mode only): claims phrased as facts that the cited sources don't support → lower to `assumption` or `hypothesis`. Skip this check in `proto` mode: there every claim is an `assumption` anyway, so offering it as a fix only wastes an option. In `proto` mode use the slot for **Riskiest assumption**: name the one assumption that would change the most design decisions if it were wrong, and make sure its "How to validate" is cheap and concrete.
- **Self-referential design**: traits that describe the team rather than users → remove or flag.
- **Untestable claims**: assumptions without a validation method → add "How to validate" (interview question, metric, support-ticket search).
- **Missing negative space**: no Boundaries → add "Not this persona" and "Doesn't care about".
- **Coverage**: overlap with an existing persona → state the difference in Boundaries, or suggest `update`.

Apply the selected fixes. Then fill the **Assumptions & Evidence** table: every `A` id with level (`assumption` → `hypothesis` → `signal` → `firsthand` → `pattern`), source, and how to validate. Compute `confidence`:

- `low`: most assumptions at `assumption`/`hypothesis` (typical for proto-personas)
- `medium`: at least half at `signal` or above, none of the job-story assumptions below `signal`
- `high`: the job story, end goals and top pain points at `firsthand` or `pattern`

## Step 9 — Design implications and mapping

1. Derive 3–6 **Design implications** ("Do …" / "Don't …"), each citing the pain points or assumptions it rests on (`P1`, `A3`). Propose at least one per pain point. Present them (multiSelect) for the user to confirm.
2. **Mapping**: ask (multiSelect) which sections (from the roadmap) and which flows (from `product/flows/`) this persona is relevant to. Recommend the sections whose features address the persona's pain points. They go into `sections:` and `flows:` in the frontmatter.
3. **Quote and name**: propose 3 one-line quotes in the persona's voice that capture the job story or the top frustration, and a display name in the form "<First name>, the <archetype>" or just the archetype. Ask the user to pick. Names are optional; the archetype is not.

## Step 10 — Review and write

Show a compact summary: name/archetype, kind, priority, job story, top goals, top pain points, confidence, mapped sections and flows.

**Coverage check before asking.** Every pain point (`P1…Pn`) must be cited by at least one Design implication (core principle 4). List uncovered pain points in the summary and offer: Add implications for them, then write (Recommended; propose the earlier unselected implications that cite them) / Write as is (the uncovered pain points go to Open Questions) / Change something. If every pain point is covered, ask: Write persona (Recommended) / Change something. On confirmation write `product/personas/<persona-id>.md` (format below). Never overwrite an existing persona file without the user choosing `update` or `validate`.

Set `status: draft` for a new persona; `active` once at least one flow or section spec links it (Step 12); `validated` when confidence is `high`; `retired` when it no longer represents a target segment.

## Step 11 — Ingest into the project brain

Immediately compile the persona into the wiki by following the `designos-wiki-ingest` skill with source `product/personas/<persona-id>.md` (type `product`, domain `personas`, using the **persona page** format defined there). Use the template `wiki/_templates/persona.md`. This creates or updates `wiki/personas/<persona-id>.md` and `wiki/personas/Home.md`, and records the hash in `wiki/_manifest.json`.

## Step 12 — Link to flows and section specs (not in `inline` mode)

The links chosen in Step 9 are written in three places, all as **metadata or a single bullet**:

1. **Section specs** (multiSelect confirm): for each chosen section with a `spec.md`, add exactly one bullet under `## Personas` in `product/sections/<section-id>/spec.md` (create the heading directly above `## UI Requirements` if it is missing):
   ```markdown
   - <Persona name> — <archetype, one line> (persona: <persona-id>)
   ```
   Change nothing else in the spec. Sections without a `spec.md` are listed with the hint to run `/shape-section`.
2. **Flows**: add `<persona-id>` to the `personas: [...]` list in the **frontmatter** of each chosen `product/flows/<flow-id>.md` (create the key if missing), then run `npm run -s wiki -- sync-meta product/flows/<flow-id>.md`. Never edit the flow body.
3. **The persona itself**: set `sections:` and `flows:` in the persona file's frontmatter to what is now linked, and `status: active` if anything is linked. Then run `npm run -s wiki -- sync-meta product/personas/<persona-id>.md`.

These are metadata changes: they are synced, not re-ingested.

## Step 13 — Persona card artifact (optional, Claude Code only)

Ask: Publish persona card (for stakeholders) / Skip (Recommended unless they mentioned sharing). If yes, load the `artifact-design` skill and build one HTML page:

- Card layout: archetype and quote on top, job story, three goal tiers, behavioral dimensions as 1–5 scales, pain points with workarounds, context of use, design implications
- A visible **"Proto-persona: assumptions, not research"** banner for kind `proto`, and the confidence level
- Assumptions table with a review control per row ("Seen evidence for this?" yes / no / unsure, plus a note field), so stakeholders can contribute to validation
- No photos, no avatars generated from demographics; use the archetype initials or an abstract mark
- Styled after `.claude/DESIGN.md`, light and dark mode, works at phone width

Publish it with the `Artifact` tool. Add the URL to `artifacts:` in the persona file's **frontmatter** (not to the body), then run `npm run -s wiki -- sync-meta product/personas/<persona-id>.md`. Tell the user the artifact is private until they share it.

## Step 14 — Handoff

```
Persona created: <name> — <archetype>  (product/personas/<persona-id>.md)
Wiki: wiki/personas/<persona-id>.md
Kind: <proto> · Priority: <primary> · Confidence: <low>
Assumptions: N (to validate: M) · Pain points: K
Linked: sections <ids> · flows <ids>

Next:
  /design-os:persona validate <persona-id>   Record new evidence
  /design-os:userflow                       Design a flow for this persona
  /shape-section                            Link the persona in a section spec
  /design-os:wiki-query                     Ask the brain about this persona
```

Then ask whether adjustments are needed.

---

## Persona File Format — `product/personas/<persona-id>.md`

The body is content (hashed, triggers a re-ingest when it changes). Status, confidence, links and artifacts are metadata in the frontmatter (synced with `sync-meta`, never re-ingested).

````markdown
---
id: <persona-id>
name: <Display name>
archetype: <Behavioral label>
kind: proto | qualitative | statistical
priority: primary | secondary | supplemental | negative
status: draft | active | validated | retired
confidence: low | medium | high
sections: [<section-id>, ...]
flows: [<flow-id>, ...]
artifacts: []
updated: <YYYY-MM-DD>
---

# <Display name> — <Archetype>

> "<Quote in the persona's voice>"

## Overview
<2–3 sentences: who they are in relation to the product, their job, and why they matter. For kind proto, end with: "Proto-persona: assumptions, not research.">

## Job Story
**When** <situation>, **I want to** <motivation>, **so I can** <outcome>.

## Snapshot
- **Archetype:** <...>
- **Role:** <...>
- **Context:** <...>
- **Domain expertise:** <novice | intermediate | expert> — <...>
- **Tech confidence:** <low | medium | high> — <...>

## Goals
- **End goals:** <...>
- **Experience goals:** <...>
- **Life goals:** <...>

## Thinking Style & Behaviors
- <behavior or guiding principle> (A1)

## Behavioral Dimensions

| Dimension | 1 | 5 | Position |
|-----------|---|---|----------|

## Needs & Pain Points

| # | Pain point | Current workaround | Need | Evidence |
|---|-----------|--------------------|------|----------|

## Context of Use
- **Devices & channels:** <...>
- **Environment:** <...>
- **Frequency & duration:** <...>
- **Time pressure & interruptions:** <...>
- **Collaborators & influencers:** <...>

## Accessibility & Inclusion
- **Permanent:** <...>
- **Temporary:** <...>
- **Situational:** <...>

## Design Implications
- **Do:** <...> (P1, A3)
- **Don't:** <...>

## Boundaries
- **Not this persona:** <...>
- **Doesn't care about:** <...>

## Assumptions & Evidence

| # | Assumption | Evidence level | Source | How to validate |
|---|-----------|----------------|--------|-----------------|

## Open Questions
- [ ] <...>
````

Rules for the file:
- Drop optional lines rather than writing "n/a". Keep **Job Story**, **Goals**, **Needs & Pain Points**, **Design Implications** and **Assumptions & Evidence**: they are required.
- In `research` mode, quotes and facts must be verbatim from the source and cite it in the Evidence column; never invent a quote and present it as said by a participant. In `proto` mode, the quote is illustrative and the Overview says so.
- Links to sections and flows live **only** in the frontmatter (`sections:`, `flows:`), never in the body, so linking a persona later never triggers a re-ingest. The wiki page and the app show them as properties.
