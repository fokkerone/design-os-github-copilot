---
title: The Project Brain (Wiki)
summary: How the wiki collects planning knowledge from sources, compiles it into linked pages, keeps it in sync, and answers questions with citations.
tags: [how-to]
sources: [agents.md, .claude/skills/designos-wiki-ingest/SKILL.md, scripts/wiki.mjs]
created: 2026-10-09
updated: 2026-10-09
---

# The Project Brain (Wiki)

## Summary
`wiki/` is the persistent memory of your planning work: a Karpathy-style LLM wiki that is also an Obsidian vault. **The agent writes and maintains it; you read it and ask questions.** Every planning command reads it before asking you anything.

## How it is built

| Layer | Location | Written by |
|-------|----------|-----------|
| Sources | `wiki/raw/` (articles, interview notes, research, session captures) and `product/` (planning files) | You and the planning commands |
| Compiled pages | `wiki/<domain>/*.md`, e.g. `flows/`, `personas/`, `decisions/`, `research/` | The wiki commands |
| Templates | `wiki/_templates/` | Maintainers |
| Bookkeeping | `wiki/Home.md`, `wiki/log.md`, `wiki/_manifest.json` | The wiki commands and `scripts/wiki.mjs` |
| How-to guides | `wiki/how-to/` (these pages) | Maintainers, shipped with the repo |

Domains and tags are defined in [[_meta/taxonomy]].

## Step by step

1. **Add sources.** Planning commands write to `product/` automatically. Drop interview notes, research or articles into `wiki/raw/`, or pass a URL to the ingest command.
2. **See what is pending.** `npm run -s wiki -- pending` lists new or changed sources. Or run `/design-os:wiki-status` for the full dashboard.
3. **Compile.** `/design-os:wiki-ingest --product` compiles changed planning files; `/design-os:wiki-ingest --pending` compiles raw files; `/design-os:wiki-ingest <path|url>` compiles one source.
4. **Capture decisions.** At the end of a session, `/design-os:wiki-capture` saves decisions, rejected alternatives and feedback (`--full` compiles them right away).
5. **Ask.** `/design-os:wiki-query <question>` answers from the wiki with citations.
6. **Keep it healthy.** `/design-os:wiki-lint` finds broken links, contradictions and stale pages; `/design-os:wiki-cross-link` adds missing links; `/design-os:wiki-taxonomy` normalizes tags.
7. **Start over if needed.** `/design-os:wiki-rebuild` archives the wiki and recompiles it from its sources. The how-to pages are kept.

## Reading the wiki
- **In Design OS:** the **Wiki** button in the header, or `/wiki`. Section specs link to the flows and personas they use.
- **In Obsidian:** open the `wiki/` folder as a vault for graph view, backlinks and tag search.

## Good to know
- **Content vs. metadata.** Only the body of a planning file is hashed. Changing frontmatter (status, confidence, links, artifact URLs) never triggers a re-ingest; `npm run -s wiki -- sync-meta <path>` copies it into the wiki instead.
- **Nothing is silently rewritten.** Superseded claims get a `Status: Outdated` note, conflicting ones `Status: Disputed`.
- **Provenance.** Synthesized statements are marked `^[inferred]`, uncertain ones `^[ambiguous]`.
- **Diagrams are Mermaid** and must pass `npm run validate:mermaid`.
- **Don't edit compiled pages by hand.** Change the source and re-ingest, so `Home.md`, the log and the manifest stay consistent.

## Related
- [[how-to/user-flows]] — flows are compiled into `flows/`
- [[how-to/personas]] — personas are compiled into `personas/`
- [[Home]] — vault home
