---
name: designos-tag-taxonomy
description: Maintain the controlled vocabulary (domains and tags) of the DesignOS project brain in wiki/_meta/taxonomy.md. Audits all pages for non-canonical tags and unregistered domains and normalizes them after confirmation. Triggers on /design-os:wiki-taxonomy, "fix tags", "normalize wiki tags", "audit tags", "add a wiki domain".
slash_command: wiki-taxonomy
phase: "Project Brain › Taxonomy"
---

# Skill: designos-tag-taxonomy

Tags and domains are how the Obsidian graph clusters knowledge. Without a controlled vocabulary they drift ("nav", "navigation", "sidebar" fragment one concept). You enforce one canonical tag per concept.

`wiki/_meta/taxonomy.md` is the source of truth. It contains: **Domains** table + routing rules, **Project Domains** (per-section), **Domain Tags**, **Topic Tags**, **Meta Tags**, **Aliases** (non-canonical → canonical).

Rules: tags are lowercase, hyphenated, singular where natural (`entity`, not `entities`). Every content page carries its domain tag.

---

## Modes

### A — Init (no taxonomy file)

1. Collect every tag and domain folder in use.
2. Cluster by intent; pick the shortest clear canonical form per cluster.
3. Propose the taxonomy (using the DesignOS default domains from the vault template as the base) and **wait for confirmation** before writing or normalizing.

### B — Audit (default)

1. Build canonical set + alias map from `_meta/taxonomy.md`.
2. Check every page's `tags:` (excluding `raw/`, `_archives/`, `_templates/`, `.obsidian/`):
   - canonical → OK
   - alias → normalizable
   - unknown → propose adding (with a one-line definition) or mapping to an existing tag
3. Check domain folders against Domains + Project Domains.
4. Report:

```
Tag Audit
Canonical tags in use: N · Pages with non-canonical tags: M

Auto-normalizable aliases:
  "navigation" (3 pages) → "nav"
  "colours" (1 page) → "color"

Unknown tags:
  "onboarding" (2 pages) — add as `onboarding` — first-run user experience?

Unregistered domains:
  invoices/ — register as Project Domain for section "invoices"?

Normalize aliases? [Y/N] · Add unknown tags? [Y each / A all / N]
```

### C — Normalize (after confirmation)

1. Rewrite `tags:` in affected pages (tag-only edits do not change `updated:`).
2. Add new tags / aliases / project domains to `_meta/taxonomy.md` and set its `updated:`.
3. Append to `wiki/log.md`:
   ```markdown
   ## [YYYY-MM-DD] taxonomy | normalized N tags across M pages
   ```

### Add a domain

When asked to add a domain (e.g. for a new roadmap section): add a row under **Project Domains** with folder, description and source section id, add its domain tag, then create `wiki/<domain>/Home.md`.

---

## Output

- `wiki/_meta/taxonomy.md` (created or updated)
- Pages with normalized tags
- Appended `wiki/log.md`
- Audit report in the response
