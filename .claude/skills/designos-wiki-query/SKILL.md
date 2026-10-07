---
name: designos-wiki-query
description: Ask the DesignOS project brain (wiki/) a question. Tiered retrieval — frontmatter summaries first, full pages only when needed. Answers only from compiled wiki pages and cites them; can file the answer back as a new page. Triggers on /design-os:wiki-query, "ask the wiki", "what does the wiki say about", "what do we know about", "what did we decide about".
slash_command: wiki-query
phase: "Project Brain › Query"
---

# Skill: designos-wiki-query

You are answering a question from the compiled DesignOS project brain at `wiki/`.

The wiki has already digested raw sources and `product/` artifacts. **Read the wiki, not the raw sources.** Compile once, query fast.

---

## The 3-Layer Context

```
wiki/raw/, product/        ← sources (ingest reads these; query does NOT)
wiki/<domain>/*.md         ← compiled wiki (query reads this exclusively)
.claude/skills/designos-wiki-query/  ← schema: these instructions
```

If the answer is not in the compiled wiki, that is a **gap**: the knowledge has not been ingested yet. Say so; do not fill it from `raw/`, `product/`, or training knowledge without labeling it.

---

## Tiered Retrieval

### Phase 1 — Index scan (cheap)

Read:
- `wiki/Home.md` (domains, recent updates)
- recent entries in `wiki/log.md`
- frontmatter only (`title`, `summary`, `tags`) of every page in `wiki/` (excluding `raw/`, `_archives/`, `_templates/`, `.obsidian/`)

Score relevance: title match → high; tag overlap or summary match → medium.

Then **full-text search** `wiki/` (same exclusions) for the query's key terms *and their synonyms* (e.g. "navigation" / "nav" / "sidebar" / "shell"). Add hits to the candidates.

Select the top 3–5 candidates. If the user says "quick answer" or "just scan", answer from Phase 1 only.

### Phase 2 — Deep read (targeted)

Open the full bodies of the candidates. Follow `[[wikilinks]]` one level deep. Note provenance markers and status blocks:
- no marker: extracted from a source
- `^[inferred]`: synthesis, so flag it
- `^[ambiguous]` / **Status: Disputed**: sources disagree, so present both sides
- **Status: Outdated**: give the current understanding, mention the old one only if relevant

---

## Steps

### 1. Answer

```
## Answer: <topic>

<2–4 paragraph synthesis from the wiki>

### Sources
- [[<domain>/<page>]] — <what it contributed>

### Caveats
<inferred / ambiguous / disputed / outdated content called out explicitly>

### Gaps
<what the wiki does not cover yet, and how to fill it>
```

Cite **only wiki pages**. In conversation, also give the project-root path (`wiki/<domain>/<page>.md`) so it's clickable.

### 2. Signal gaps clearly

Never claim the wiki has nothing relevant until **both** the index scan and the full-text search came back empty, and say that you searched both.

```
The wiki has no pages about "<X>" yet. Possible reasons:
  a) It lives only in product/ — run /design-os:wiki-ingest --product
  b) It's in wiki/raw/ but not compiled — run /design-os:wiki-ingest --pending
  c) It was discussed but never captured — run /design-os:wiki-capture
Partial coverage: [[<related-page>]] (if any)
```

### 3. Optionally file the answer back

Plain queries write **no files**. Offer:

```
File this answer to the wiki?
  [Y] Yes — new page wiki/<domain>/<topic>.md
  [U] Update an existing page instead
  [N] No — one-off answer
```

On confirmation:
- Write the page from the template `wiki/_templates/page.md`, and use a Mermaid diagram if the answer describes a process or structure, with tags `[<domain>, query-derived, ...]`, `sources:` listing the cited wiki pages, and synthesized content marked `^[inferred]`. It is a point-in-time snapshot; add `archived: <YYYY-MM-DD>` to the frontmatter.
- Update the domain `Home.md` (prefix the summary with `[Archived]`) and `wiki/Home.md` Recent Updates.
- Append to `wiki/log.md`: `## [YYYY-MM-DD] query | Archived: <page title>`
- Suggest `/design-os:wiki-cross-link`.

---

## Output

- Synthesized answer in the response (always)
- Optionally: new or updated page, domain `Home.md`, `log.md` entry
