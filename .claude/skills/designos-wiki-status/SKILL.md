---
name: designos-wiki-status
description: Dashboard for the DesignOS project brain (wiki/) — vault size, domains, recent activity, hub pages, tag distribution, provenance, and pending sources (uncompiled raw files and new or changed product/ artifacts). Read-only. Triggers on /design-os:wiki-status, "wiki dashboard", "wiki stats", "what's in the wiki", "what's in the project brain".
slash_command: wiki-status
phase: "Project Brain › Status"
---

# Skill: designos-wiki-status

You produce a health and activity dashboard for `wiki/`. **Read-only**, except an optional `wiki/_insights.md` when the user asks for one.

---

## Steps

### 1. Inventory

Scan every `.md` in `wiki/` (excluding `raw/`, `_archives/`, `_templates/`, `.obsidian/`). For each page collect: path, domain, `title`, `summary`, `tags`, `created`, `updated`, `provenance`, outbound `[[wikilinks]]`, inbound backlink count.

Read `wiki/_manifest.json` and `wiki/log.md`.

### 2. Compute

- **Vault size:** content pages (excluding `Home.md`, `log.md`, `_*.md`), pages per domain, pages created this month.
- **Activity:** last ingest / capture / query / lint / cross-link / taxonomy entry from `log.md` (grep `^## \[`).
- **Hub pages:** top 5 by backlinks.
- **Orphans:** count only (details via lint).
- **Tags:** top 10; tags not in `_meta/taxonomy.md`.
- **Provenance:** average extracted / inferred / ambiguous; pages with >50 % inferred.
- **Pending sources:** run `npm run -s wiki -- pending` and report its `new`, `changed` and `meta` rows (content hash of the body vs. the manifest; frontmatter-only changes show as `meta`).
- **DesignOS coverage:** for each planning step (overview, roadmap, data shape, design system, shell, each section spec in `product/sections/*/`, each flow in `product/flows/`, each persona in `product/personas/`), whether the artifact exists and whether the wiki covers it.
- **Flows:** count by `status` (planned / in-prototype / in-spec), flows with open gaps, and flows not linked from any section spec.
- **Personas:** count by `priority` and `kind`, `confidence` distribution, open assumptions (rows below `signal`), personas not linked from any flow or section, and whether a `primary` persona exists.

### 3. Print the dashboard

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project Brain — wiki/
  Generated: <YYYY-MM-DD HH:MM>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VAULT
  Pages: N · Domains: N (product, data, ...) · New this month: N

ACTIVITY
  Last ingest:     <date> — <source>
  Last capture:    <date> — <topic>
  Last query:      <date> — <topic>
  Last lint:       <date> — N issues
  Last cross-link: <date> — K links

DESIGNOS COVERAGE
  ✓ Product overview     compiled <date>
  ⟳ Data shape           changed since <date>
  ✗ Shell spec           not ingested
  – Design system        artifact not created yet
  ...

FLOWS
  Total: N · planned N · in-prototype N · in-spec N
  With gaps: N · Not linked from a spec: N

HUB PAGES
  N  [[<domain>/<page>]]

TAGS (top 10)
  product (N)  data (N)  ...

PROVENANCE
  Extracted ~X% · Inferred ~X% · Ambiguous ~X%
  ⚠ High-inferred pages: N

PENDING
  raw/ not compiled:     N
  product/ new/changed:  N
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Suggested:
  /design-os:wiki-ingest --product   Compile new/changed planning artifacts
  /design-os:wiki-ingest --pending   Compile raw sources and captures
  /design-os:wiki-lint               Full health check
  /design-os:wiki-query <question>   Ask the brain
```

Only list suggestions that apply.

### 4. Optional _insights.md

If the user asks for a persistent record, write `wiki/_insights.md` (frontmatter `title: Wiki Insights`, `generated:`, `tags: [insights]`) with the dashboard, hub pages, a domain coverage table, and next steps.

---

## Output

- Dashboard in the response (always)
- Optionally `wiki/_insights.md`
