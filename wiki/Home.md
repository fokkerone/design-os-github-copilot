---
title: Wiki Home
tags: [index, home]
updated: 2026-10-06
---

# Project Brain

The DesignOS project brain: a [Karpathy-style LLM wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). It holds product vision, design decisions, data vocabulary, research and stakeholder feedback, compiled from sources so every planning session starts informed.

> **The LLM writes and maintains the wiki; the human reads and asks questions.**
> Open `wiki/` in [Obsidian](https://obsidian.md) for graph view, backlinks, tag search and hover previews.

## How it works

| Layer | Location | Who writes it |
|-------|----------|---------------|
| Sources | `wiki/raw/` (articles, research, notes, captures) + `product/` (DesignOS artifacts) | You (raw), DesignOS commands (product) |
| Compiled wiki | `wiki/<domain>/*.md` | The agent, via the commands below |
| Templates | `wiki/_templates/` (page, flow, persona, domain index, raw source, capture), also used by Obsidian *Insert template* | Maintainers |
| Schema | `.claude/skills/designos-wiki-*/SKILL.md` | Maintainers |

All diagrams are **Mermaid**. Check them with `npm run validate:mermaid`.

## How To

New here? Start with the guides that ship with Design OS: [[how-to/Home|How To]].

1. [[how-to/getting-started]] — run the app, pick Claude Code or Copilot
2. [[how-to/planning-flow]] — every planning step in order
3. [[how-to/project-brain]] — how this wiki works
4. [[how-to/user-flows]] — design user flows
5. [[how-to/personas]] — create and validate personas

## Domains

_(created automatically by `/design-os:wiki-ingest`; vocabulary in [[_meta/taxonomy]])_

| Domain | Pages | Last updated |
|--------|-------|--------------|

## Recent Updates

_(last 10, full history in [[log]])_

## Wiki Operations

| Command | Purpose |
|---------|---------|
| `/design-os:wiki-ingest <path\|url>` | Compile one source into wiki pages |
| `/design-os:wiki-ingest --product` | Compile new or changed `product/` planning artifacts |
| `/design-os:wiki-ingest --pending` | Compile uncompiled `raw/` files and captures |
| `/design-os:wiki-capture` | Save decisions/feedback from the current session |
| `/design-os:wiki-query <question>` | Ask the brain (cites wiki pages) |
| `/design-os:wiki-status` | Dashboard: size, activity, pending sources |
| `/design-os:wiki-lint` | Health check: orphans, broken links, contradictions, drift |
| `/design-os:wiki-cross-link` | Insert missing `[[wikilinks]]` |
| `/design-os:wiki-taxonomy` | Audit and normalize tags and domains |
| `/design-os:wiki-rebuild` | Archive, rebuild, restore |
