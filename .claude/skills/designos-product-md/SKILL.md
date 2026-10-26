---
name: designos-product-md
description: Create or update product/PRODUCT.md, the durable product truth the design skill impeccable reads (users, purpose, positioning, operating context, constraints, principles), from the Design OS planning files and the wiki. Creates the file when it is missing, otherwise updates only the sections a planning step changed. Replaces /impeccable init in Design OS. Used by /design-os:product-vision, the planning steps that feed it, and the design steps and comments that need it. Triggers on "create PRODUCT.md", "update PRODUCT.md", "impeccable init".
phase: "Planning › Shared context"
---

# Skill: designos-product-md

impeccable (`.claude/skills/impeccable`) reads durable product truth from a `PRODUCT.md`. In Design OS that file is **`product/PRODUCT.md`**, a product artifact next to `product-overview.md`. `npm run impeccable:context` links it to `.agents/context/PRODUCT.md`, where impeccable finds it. This skill is the only writer of the file; it replaces `/impeccable init`.

## When

- **Missing file:** every step that calls this skill creates `product/PRODUCT.md` when it does not exist yet (mode `create`). `/design-os:product-vision` creates it together with the overview; a later step (design system, shell, screen design, live edit, comment) creates it before its design work.
- **Existing file:** a planning step that changed a source updates only the sections that source feeds (mode `update`, table below). Never rewrite confirmed sections from inference.
- Without `product/product-overview.md` there is no product truth yet: do not create the file. Say so in one line and point to `/design-os:product-vision`.

| Source | Feeds |
|--------|-------|
| `product/product-overview.md` | Product Purpose, Positioning, Product Principles, Capabilities and Constraints |
| `product/personas/*.md` | Users, Operating Context, Accessibility & Inclusion, Product Principles |
| `product/techstack/techstack.md` | Platform, Stack |
| `product/product-roadmap.md`, `product/flows/*.md` | Capabilities and Constraints, Operating Context |
| `product/design-system/design-system.md` (brand, voice) | Brand Commitments |
| `wiki/research/`, `wiki/feedback/`, `wiki/decisions/` | Evidence on Hand, Positioning, Product Principles |

## Steps

1. **Read the sources** in the table that exist, and `wiki/Home.md` for decisions. Check the wiki before asking anything already settled.
2. **Draft** from [template.md](template.md). Keep the `# Product` heading, the `<!-- impeccable:product-schema 1 -->` marker and the section names exactly; impeccable parses them. `## Platform` is the bare value `web` unless the tech stack names a native target (`ios`, `android`, `adaptive`).
3. **Content rules:**
   - A synthesis, not a copy. Every claim comes from a source; name it in the section (`product/personas/ana.md`, `wiki/decisions/…`). Untested persona claims keep their assumption label.
   - Omit a section the sources do not answer. **Evidence on Hand** says what does not exist yet, so nothing is invented.
   - No visual values: colors, fonts and spacing live in `product/design-system/DESIGN.md`.
4. **Confirm before writing.** Show the draft in a few lines per section and ask with the structured question tool (`AskUserQuestion` in Claude Code, `question` in the Design OS chat): **Write it (Recommended)** / **Adjust** / **Later**. In `update` mode show only the changed sections. Inferred statements are marked as such in the question.
5. **Write** `product/PRODUCT.md`, then run `npm run -s impeccable:context` so the link exists. Never write a `PRODUCT.md` at the project root or through `.agents/context/`.
6. Report in one line: `PRODUCT.md: created | updated (<sections>)`. The file is a product source: `/design-os:wiki-ingest --product` compiles it into the wiki like the overview.

When the calling step is interrupted by this skill, resume the calling step afterwards.
