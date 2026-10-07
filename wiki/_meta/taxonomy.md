---
title: Wiki Taxonomy
updated: 2026-10-06
---

# Wiki Taxonomy

Canonical vocabulary for this vault: domain folders and tags.
- Run `/design-os:wiki-taxonomy` to audit and normalize tags.
- Run `/design-os:wiki-lint` to detect domain drift.

---

## Domains

Domains are concern-centric, not source-centric. A page's domain describes *what the knowledge is about*, not which file or session introduced it. Source traceability lives in the `sources:` frontmatter.

### Core Domains

| Domain | Folder | What goes here | Typical source |
|--------|--------|----------------|----------------|
| `product` | `product/` | Vision, target users, problems & solutions, value proposition, key features | `product/product-overview.md` |
| `roadmap` | `roadmap/` | Sections, scope, sequencing, in/out decisions | `product/product-roadmap.md` |
| `data` | `data/` | Entities, relationships, shared vocabulary | `product/data-shape/data-shape.md` |
| `design-system` | `design-system/` | Colors, typography, tokens, brand personality, voice, UI style | `product/design-system/design-system.md` |
| `shell` | `shell/` | Global navigation, layout pattern, user menu | `product/shell/spec.md` |
| `ui` | `ui/` | Reusable screen & interaction patterns, component conventions, responsive / dark-mode rules | `product/sections/*/spec.md` |
| `flows` | `flows/` | User flows: one page per flow with Mermaid diagram, steps, rules, edge cases, section mapping | `product/flows/*.md` |
| `decisions` | `decisions/` | Decision records: why X was chosen over Y | captures, any |
| `research` | `research/` | Users, personas, competitors, market, external articles | `wiki/raw/` |
| `feedback` | `feedback/` | Stakeholder and user feedback on screens and the clickdummy | captures |
| `handoff` | `handoff/` | Export & implementation notes for the target codebase | `product-plan/`, captures |

### Routing Rules

Assign each knowledge unit to a domain with this decision tree:

1. **Why X was chosen over Y** (product, UX, or design)? → `decisions/`
2. **Vision, users, problems, solutions, features**? → `product/`
3. **Sections, scope, sequencing**? → `roadmap/`
4. **Entities, relationships, vocabulary**? → `data/`
5. **Colors, typography, tokens, brand, voice, UI style**? → `design-system/`
6. **Global navigation, layout, user menu**? → `shell/`
7. **A concrete user flow** (steps from trigger to goal)? → `flows/` (one page per flow, id = flow id)
8. **Reusable screen/interaction pattern or component convention**? → `ui/`
9. **Users, personas, competitors, market, external knowledge**? → `research/`
10. **Feedback from stakeholders or users**? → `feedback/`
11. **Export, handoff, implementation notes**? → `handoff/`
12. **Section-specific knowledge that fits none of the above**?
    → Create a domain named after the section id (e.g. `invoices/`)
    → Add it under "Project Domains" below before creating the folder

**One domain per page.** If a page spans multiple concerns, split it.
**Prefer existing domains.** Only create a new domain if nothing above fits.

### Project Domains

| Domain | Folder | Section id | What goes here |
|--------|--------|------------|----------------|

_(section-specific domains added here as the roadmap grows)_

---

## Domain Tags

Tags mirror domain names. Every content page gets the tag of its domain.

- `product` — vision, users, problems, features
- `roadmap` — sections and scope
- `data` — entities and relationships
- `design-system` — visual identity and tokens
- `shell` — navigation and layout chrome
- `ui` — screen and interaction patterns
- `flows` — user flows
- `decisions` — decision records
- `research` — external and user research
- `feedback` — stakeholder and user feedback
- `handoff` — export and implementation notes

## Topic Tags

- `entity` — a single data entity
- `persona` — a user persona or target group
- `competitor` — a competing product
- `color` — color palette and usage
- `typography` — fonts and type scale
- `brand-voice` — tone, personality, copy style
- `nav` — navigation structure and patterns
- `responsive` — mobile / breakpoint behavior
- `dark-mode` — dark mode behavior
- `accessibility` — accessibility concerns
- `empty-state` — empty, loading and error states
- `happy-path` — the primary success path of a flow
- `edge-case` — failure and recovery handling
- `onboarding` — first-run and signup flows
- `auth` — login, signup, password, session flows

_(add project-specific topic tags here)_

## Meta Tags

- `index` — index and home pages (reserved)
- `home` — vault home (reserved)
- `log` — activity log (reserved)
- `insights` — generated insights pages (reserved)
- `lint` — lint report pages (reserved)
- `query-derived` — pages created from `/design-os:wiki-query` results
- `capture` — pages compiled from `/design-os:wiki-capture` sessions

## Aliases

- `navigation` → `nav`
- `colors` → `color`
- `colours` → `color`
- `fonts` → `typography`
- `entities` → `entity`
- `a11y` → `accessibility`
- `userflow` → `flows`
- `user-flow` → `flows`
- `flow` → `flows`
- `personas` → `persona`

_(non-canonical → canonical mappings, managed by `/design-os:wiki-taxonomy`)_
