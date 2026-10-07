---
name: designos-cross-linker
description: Weave the DesignOS project brain's knowledge graph — scan wiki/ for unlinked mentions of page titles and aliases and insert Obsidian [[wikilinks]]. Run after ingest or standalone. Triggers on /design-os:wiki-cross-link, "cross-link the wiki", "add wikilinks", "link wiki pages".
slash_command: wiki-cross-link
phase: "Project Brain › Cross-link"
---

# Skill: designos-cross-linker

After ingest, prose across the vault mentions topics that now have pages ("the invoice entity", "the sidebar navigation") without linking them. Find those gaps and insert `[[wikilinks]]`.

---

## Steps

### 1. Build the link target map

For every `.md` in `wiki/` (excluding `raw/`, `_archives/`, `_templates/`, `.obsidian/`, `_meta/`, `_*.md` reports):
- page path without extension (e.g. `data/invoice`)
- `title:` from frontmatter
- explicit `aliases:` from frontmatter
- natural variants of the title (case, singular/plural, e.g. "Invoice" / "invoices")

Lookup: `alias → [[domain/page]]`. If one alias maps to several pages, it is ambiguous: skip it and report.

### 2. Find unlinked mentions

In each page body, a candidate occurrence must:
1. not already be inside `[[...]]` or a markdown link
2. not be inside a code block or inline code
3. not be in a heading or frontmatter
4. not be a self-reference
5. be a standalone phrase (word boundaries)

### 3. Guard against over-linking

- Skip aliases shorter than 4 characters.
- Skip generic words that merely match a title ("data", "product", "shell", "design" alone must not auto-link to domain `Home.md` pages).
- Skip `Home.md` files and `log.md` as link *sources*: they are indexes and logs.
- Uncertain → skip and list in the report.

### 4. Apply — first occurrence per page only

- Alias identical to title → `[[domain/page]]`; otherwise `[[domain/page|original text]]`.
- Preserve surrounding punctuation and capitalization.
- One write per modified page. Do **not** change `updated:` (link-only edits are not knowledge changes).

### 5. Report and log

```
Cross-link complete
Pages scanned: N · Pages modified: M · Links inserted: K

- data/invoice-lifecycle.md: 2 links
    "Customer" → [[data/customer]]
    "status badge" → [[ui/status-badges|status badge]]

Skipped (ambiguous/generic):
- "shell" in ui/empty-states.md — generic, matches [[shell/Home]]
```

Append to `wiki/log.md`:

```markdown
## [YYYY-MM-DD] cross-link | <K> links inserted across <M> pages
```

---

## Output

- Modified pages with `[[wikilinks]]`
- Appended `wiki/log.md`
- Report in the response
