---
name: designos-wiki-lint
description: Health check the DesignOS project brain (wiki/). Finds orphaned pages, broken wikilinks, missing cross-links, contradictions, stale file references, pages outdated by changed product/ artifacts, ungrounded facts, missing frontmatter, and domain drift. Read-only by default. Triggers on /design-os:wiki-lint, "lint the wiki", "check wiki health".
slash_command: wiki-lint
phase: "Project Brain › Lint"
---

# Skill: designos-wiki-lint

You are the wiki custodian for `wiki/`. Like code, a wiki accrues entropy. Find it and report it.

**Read-only by default.** Only fix after the user confirms. Never touch `wiki/raw/` or `product/`.

---

## Steps

### 1. Index the vault

For every `.md` in `wiki/` (excluding `raw/`, `_archives/`, `_templates/`, `.obsidian/`):
- path, `title`, `tags`, `sources`, `created`, `updated`
- outbound `[[wikilinks]]`, backtick file references
- inbound `[[wikilinks]]` from other pages

Also read `wiki/_manifest.json`, `wiki/_meta/taxonomy.md`, `wiki/log.md`.

### 2. Run checks

| # | Check | Severity | Detection |
|---|-------|----------|-----------|
| a | **Orphaned pages** | warning | No inbound `[[wikilink]]`. `Home.md` files, `log.md`, `_lint-report.md`, `_insights.md` are exempt. |
| b | **Broken wikilinks** | critical | `[[target]]` resolves to no `.md` in the vault (match by path or by file name, as Obsidian does). |
| c | **Missing cross-links** | warning | Prose mentions another page's title/alias without linking it. |
| d | **Contradictions** | critical | Pages with overlapping tags/domains asserting opposite things about the same decision, entity, token, or flow, without a `Status: Disputed` block. Flag for human review; never auto-resolve. |
| e | **Stale file refs** | warning | Backtick paths (`product/...`, `src/...`) that no longer exist. |
| f | **Outdated by product/** | critical | For each `product/` path in a page's `sources:`, the current `shasum -a 256` differs from the hash in the latest manifest entry for that path → the page may no longer reflect the artifact. Also: claims superseded by newer sources but shown without a `Status: Outdated` block. |
| g | **Ungrounded facts** | warning | Spot-check numbers, dates, names and quotes on pages with non-`product/` sources: each must appear verbatim in a listed source. Report misses; do not guess corrections. |
| h | **Missing frontmatter** | warning | Missing `title`, `summary`, `tags`, `created`, `updated` (content pages) or `sources` (non-archived content pages). |
| i | **Malformed status blocks** | warning | `Status: Outdated` without a date, or a status block without an explanation. |
| j | **Undocumented domains** | warning | Domain folder without `Home.md`. |
| k | **Domain drift** | warning | Folder not listed in `_meta/taxonomy.md` (Domains table or Project Domains). Classify: typo, duplicate of an existing domain, or unregistered new domain. |
| l | **Index drift** | warning | Page missing from its domain `Home.md`, or a `Home.md` entry pointing to a missing page. |
| m | **Pending sources** | info | `wiki/raw/` files (not `README.md`/`.gitkeep`) and `product/**/*.md` artifacts with no manifest entry. |
| n | **Missing concept pages** | info | Terms mentioned across ≥3 pages with no dedicated page (e.g. a data entity from the data shape). |
| o | **Flow integrity** | critical | For every `wiki/flows/*.md` (except `Home.md`): has a `## Diagram` with a ```` ```mermaid ```` block that is identical to the one in its `product/flows/` source; step ids in the diagram match the Steps table; `sections:` ids exist in `product/sections/` or the roadmap. For every `(flow: <id>)` bullet in `product/sections/*/spec.md`: `product/flows/<id>.md` exists. Flows whose mapping still lists `gap`/`partial` steps are reported as info. |
| p | **Invalid Mermaid** | critical | Run `npm run validate:mermaid -- wiki product/flows` and report every failing block with file and line. Diagrams drawn as ASCII art or images instead of Mermaid count as warnings. |
| q | **Template drift** | warning | Content pages missing required sections of their template (`wiki/_templates/page.md` for Summary/Related, `wiki/_templates/flow.md` for all flow sections). |

### 3. Write the report

Overwrite `wiki/_lint-report.md`:

```markdown
---
title: Wiki Lint Report
generated: <YYYY-MM-DD HH:MM>
tags: [lint]
---

# Wiki Lint Report

Pages scanned: <N>

## Summary

| Check | Issues |
|-------|--------|
| Orphaned pages | N |
| ... | N |

**Total: N** (<critical> critical, <warning> warnings, <info> info)

## <Check name>

- [ ] `<domain>/<page>.md` — <issue> _(fix: <suggested fix>)_

## Passed Checks

- ✓ <N> wikilinks resolved
- ✓ ...
```

### 4. Append to log.md

```markdown
## [YYYY-MM-DD] lint | <N> issues found

- Pages scanned: <N> · Critical: <N> · Warnings: <N>
- Report: [[_lint-report]]
```

### 5. Offer fixes

```
Wiki lint complete: N issues (X critical, Y warnings).
Report: wiki/_lint-report.md

Fix?
  [A] All safe fixes (frontmatter, index drift, broken links with an obvious target, Home.md for domains)
  [B] Specific issues (list numbers)
  [N] No — review manually in Obsidian
```

- **Safe fixes:** missing frontmatter fields derivable from content, index drift, broken links with exactly one plausible target, missing domain `Home.md`.
- **Never auto-fix:** contradictions, outdated-by-product pages (suggest `/design-os:wiki-ingest --product`), ungrounded facts, domain drift (needs a taxonomy decision).

After applying fixes, append `## [YYYY-MM-DD] lint-fix | <M> issues fixed` to `log.md`.

---

## Output

- `wiki/_lint-report.md` (overwritten)
- Appended `wiki/log.md`
- Optionally fixed pages (after confirmation)
