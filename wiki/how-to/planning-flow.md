---
title: The Planning Flow
summary: The Design OS planning flow from product vision to export, step by step, with the command, what it asks, and what it produces.
tags: [how-to]
sources: [agents.md, .claude/skills/designos-techstack/SKILL.md, src/lib/harness.ts]
created: 2026-10-09
updated: 2026-10-14
---

# The Planning Flow

## Summary
Design OS walks you through a fixed sequence. Each step builds on the previous ones, so finish a step before starting the next. The tech stack step is recommended, not blocking: without it the defaults apply (shadcn/ui, lucide-react). Personas and user flows can be added at any time after the overview or roadmap exist.

## Diagram

```mermaid
flowchart TD
  V["1 · Product Vision"] --> TS["2 · Tech Stack"]
  TS --> R["3 · Roadmap"]
  R --> D["4 · Data Shape"]
  D --> T["5 · Design System"]
  T --> S["6 · Application Shell"]
  S --> SS["7a · Shape Section"]
  SS --> SD["7b · Sample Data"]
  SD --> DS["7c · Design Screen"]
  DS --> SC["7d · Screenshot"]
  SC -- "next section" --> SS
  SC --> C["8 · Clickdummy"]
  C --> X["9 · Export"]
  V -. "any time" .-> P[["Personas"]]
  R -. "any time" .-> F[["User Flows"]]
  P -.-> SS
  F -.-> SS
```

## Steps

| # | Step | Claude Code | Copilot | Output |
|---|------|-------------|---------|--------|
| 1 | Product vision | `/design-os:product-vision` | `@00-product-vision` | `product/product-overview.md` |
| 2 | Tech stack | `/design-os:techstack` | `@01-techstack` | `product/techstack/techstack.md` |
| 3 | Roadmap | `/design-os:product-roadmap` | `@02-product-roadmap` | `product/product-roadmap.md` |
| 4 | Data shape | `/design-os:data-shape` | `@03-data-shape` | `product/data-shape/data-shape.md` |
| 5 | Design system | `/design-os:design-tokens` | `@04-design-system` | `product/design-system/design-system.json`, `.md` |
| 6 | Application shell | `/design-os:design-shell` | `@05-design-shell` | `product/shell/spec.md`, `src/shell/components/` |
| – | Personas | `/design-os:persona` | `@persona` | `product/personas/<id>.md` |
| – | User flows | `/design-os:userflow` | `@userflow` | `product/flows/<id>.md` |
| 7a | Shape section | `/design-os:shape-section` | `@06-shape-section` | `product/sections/<id>/spec.md` |
| 7b | Sample data | `/design-os:sample-data` | `@07-sample-data` | `data.json`, `types.ts` |
| 7c | Design screen | `/design-os:design-screen` | `@08-design-screen` | `src/sections/<id>/` |
| 7d | Screenshot | `/design-os:screenshot-design` | `@09-screenshot-design` | `product/sections/<id>/*.png` |
| 8 | Clickdummy | `/design-os:clickdummy` | `@10-clickdummy` | `/clickdummy/preview` |
| 9 | Export | `/design-os:export-product` | `@11-export-product` | `product-plan/` |

## What each step does

1. **Product vision**: name, description, problems and solutions, key features. If personas exist, they answer "who is it for".
2. **Tech stack**: what the prototype is built with: UI library (shadcn/ui by default), component base, style, icons, registries and reference repositories, packages, app patterns, tooling, and the framework the export goes into. Recommended, not blocking: without it the defaults apply. Every later step loads it with `npm run techstack` and follows it. Details: [[how-to/tech-stack]].
3. **Roadmap**: the sections (feature areas) of the product. Section ids are used everywhere afterwards.
4. **Data shape**: the core entities and how they relate. Their names become the shared vocabulary.
5. **Design system**: Tailwind colors, Google Fonts, and optionally brand personality, voice and UI style. Put logos or style guides into `product/design-system/resources/` to have them analyzed.
6. **Application shell**: navigation, user menu and layout that wrap every section, built from the product UI layer `src/ui/`.
7. **Per section**, repeat:
   - **Shape section**: overview, user flows (simple bullets, linked flows, or new flows created inline), personas, UI requirements, shell on/off.
   - **Sample data**: realistic `data.json` and TypeScript types.
   - **Design screen**: props-based React components composed from `src/ui/`, responsive, light and dark mode.
   - **Screenshot**: images for the export.
8. **Clickdummy**: all sections inside the shell with working navigation, for stakeholder demos.
9. **Export**: components, UI primitives (`ui/`), tech stack, types, design system, personas, flows, test specs and ready-to-paste prompts for a coding agent.

## After every step
- Run `/design-os:wiki-ingest --product` so the project brain picks up the new artifact.
- Run `/design-os:wiki-capture` if the session produced decisions that are not in the artifact.

## Related
- [[how-to/step-by-step]] — every step in detail
- [[how-to/tech-stack]] — the tech stack step in detail
- [[how-to/personas]] — personas in detail
- [[how-to/user-flows]] — user flows in detail
- [[how-to/project-brain]] — the wiki
