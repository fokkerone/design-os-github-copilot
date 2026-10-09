---
name: designos-wiki-ingest
description: Compile sources into the DesignOS project brain (wiki/). Ingests raw material from wiki/raw/, staged session captures, and DesignOS planning artifacts in product/ (vision, roadmap, data shape, design system, shell, section specs). Triggers on /design-os:wiki-ingest, "ingest into the wiki", "add to wiki", "update the project brain", "sync product to wiki".
slash_command: wiki-ingest
phase: "Project Brain › Ingest"
---

# Skill: designos-wiki-ingest

You are compiling knowledge into the DesignOS **project brain**, a Karpathy-style LLM wiki at `wiki/`.

> "The LLM writes and maintains the wiki; the human reads and asks questions."
> "The wiki is a persistent, compounding artifact."

The wiki doubles as an **Obsidian vault**. Write every page so it is navigable in Obsidian: `[[wikilinks]]` for internal links, YAML frontmatter with `tags:`, one knowledge unit per page.

---

## The 3-Layer Context

```
wiki/raw/                          ← immutable source material (read, never modify)
product/                           ← DesignOS planning artifacts (read, never modify from here)
wiki/<domain>/*.md                 ← compiled wiki (you own this layer)
.claude/skills/designos-wiki-*/    ← schema: these instructions
```

Vault special files:

| File | Purpose |
|------|---------|
| `wiki/Home.md` | Vault index: domain table + recent updates |
| `wiki/log.md` | Append-only activity log |
| `wiki/_manifest.json` | Ingestion history (what was compiled, when, into which pages) |
| `wiki/_meta/taxonomy.md` | Canonical domains and tags |
| `wiki/<domain>/Home.md` | Domain index |

---

## Source Types

| Type | Location | Notes |
|------|----------|-------|
| `raw` | `wiki/raw/<file>` | Articles, research, interview notes, competitor analysis, brand docs. Immutable. |
| `capture` | `wiki/raw/capture-*.md` | Staged by `/design-os:wiki-capture`. Immutable once written. |
| `product` | `product/**/*.md` | Living DesignOS artifacts. Track by content hash, since they change over time. |

DesignOS product artifacts:

| Artifact | Path | Usual domain |
|----------|------|--------------|
| Product overview | `product/product-overview.md` | `product` |
| Roadmap | `product/product-roadmap.md` | `roadmap` |
| Data shape | `product/data-shape/data-shape.md` | `data` |
| Design system | `product/design-system/design-system.md` | `design-system` |
| Shell spec | `product/shell/spec.md` | `shell` |
| Section spec | `product/sections/<id>/spec.md` | `ui` or a section project domain |
| User flow | `product/flows/<flow-id>.md` | `flows`, always as a **flow page** (see below) |
| Persona | `product/personas/<persona-id>.md` | `personas`, always as a **persona page** (see below) |

---

## Invocation

```
/design-os:wiki-ingest <path>        # one raw file, capture, or product artifact
/design-os:wiki-ingest <url>         # fetch a URL into wiki/raw/ first, then compile
/design-os:wiki-ingest --product     # every product/ artifact that is new or changed since last ingest
/design-os:wiki-ingest --pending     # every raw/ file and capture not yet in _manifest.json
```

With no argument, run `npm run -s wiki -- pending` and ask which sources to compile.

**Bookkeeping goes through `scripts/wiki.mjs`.** Use one script call per step and never chain shell commands:

| Command | Purpose |
|---------|---------|
| `npm run -s wiki -- pending` | Sources that are `new` or `changed` (need an ingest), and flows or personas whose metadata is out of sync (`meta`) |
| `npm run -s wiki -- hash <path>` | Content hash of one source |
| `npm run -s wiki -- record <path> --type … --disposition … --title "…" [--created …] [--updated …] [--note "…"]` | Writes the manifest entry **and** the log entry (Steps 10–11) |
| `npm run -s wiki -- sync-meta product/flows/<id>.md` | Copies flow metadata (status, artifacts, personas) into the wiki without an ingest |
| `npm run -s wiki -- sync-meta product/personas/<id>.md` | Copies persona metadata (status, confidence, flows, sections, artifacts) into the wiki without an ingest |

**Compile one source at a time.** `Home.md`, `log.md`, `_manifest.json` and cascade updates are shared state, so do not parallelize compilation.

---

## Steps

### 0. Initialize (first run only)

If `wiki/` structure is missing, create only what is missing, and never overwrite:
`wiki/Home.md`, `wiki/log.md`, `wiki/_manifest.json` (`{"sources": []}`), `wiki/_meta/taxonomy.md`, `wiki/raw/README.md`, `wiki/_archives/`, `wiki/_templates/`.

### 1. Fetch (URL or pasted text only)

1. Get the content with web/file tools. If nothing reaches the source, ask the user to paste it.
2. Save as `wiki/raw/YYYY-MM-DD-<descriptive-slug>.md` (slug kebab-case, max 60 chars; unknown publish date → omit date prefix; on name clash append `-2`).
3. Header: use the template `wiki/_templates/raw-source.md` (Source, Collected, Published).
4. Preserve the original text. Clean formatting noise only. Do not rewrite opinions.

### 2. Detect changes (product sources)

Run `npm run -s wiki -- pending`. It compares the **content hash** of each `product/` artifact with the latest manifest entry for that path:
- `new` (no entry) or `changed` (content differs) → compile.
- not listed → unchanged, skip.
- `meta` → only the frontmatter of a flow or persona changed (e.g. `status`, `confidence`, `artifacts`, links). **This is not an ingest.** Run `npm run -s wiki -- sync-meta <path>` instead. It updates the metadata on the wiki page and the Status/Confidence columns in the domain `Home.md`, and logs a single `meta` line.

The content hash covers the body only. YAML frontmatter is metadata and never triggers a re-ingest. So put volatile metadata (status, links to artifacts, review dates) into frontmatter, not into the body.

### 3. Scan the existing wiki first

Before writing, read `wiki/Home.md`, `wiki/log.md` (recent), and the frontmatter (`title`, `summary`, `tags`) of all pages. Then **full-text search** `wiki/` (excluding `raw/`, `_archives/`, `_templates/`) for the source's key entities, names and synonyms. Do not rely on the index alone.

### 4. Triage — state the disposition

Tell the user one of:

- **New** — creates one or more new pages.
- **Update** — merges into existing page(s).
- **Disputed** — contradicts existing content (combine with New/Update).
- **No material** — nothing beyond what the wiki already holds. Keep the source, log it, update the manifest, **stop**. Do not force a page out of a thin source.

New, Update and Disputed may combine. No material is exclusive.

### 5. Route to a domain

Read `wiki/_meta/taxonomy.md` and use its routing rules. Summary:

1. Why X was chosen over Y (product, UX, or design decision)? → `decisions/`
2. Vision, target users, problems, solutions, value proposition, features? → `product/`
3. Sections, scope, sequencing, what's in/out? → `roadmap/`
4. Entities, relationships, shared vocabulary? → `data/`
5. Colors, typography, tokens, brand personality, voice, UI style? → `design-system/`
6. Global navigation, layout, user menu? → `shell/`
7. A concrete user flow (`product/flows/*.md`)? → `flows/`, one page per flow, file name = flow id
8. A persona (`product/personas/*.md`)? → `personas/`, one page per persona, file name = persona id
9. Reusable screen/interaction patterns, component conventions, responsive/dark-mode rules? → `ui/`
10. User research findings, competitors, market, external articles? → `research/` (persona descriptions found in raw sources are proposed to `/design-os:persona research` instead of being compiled as research pages)
11. Stakeholder or user feedback on screens/clickdummy? → `feedback/`
12. Export, handoff, implementation notes for the target codebase? → `handoff/`
13. Section-specific knowledge that fits none of the above? → domain named after the section id; register it under "Project Domains" in the taxonomy **before** creating the folder.

**One domain per page. Prefer existing domains. One knowledge unit = one page. Merge, don't proliferate.** Never write into `how-to/`: it is a system domain maintained in the repository.

### 6. Compile pages

**Same core thesis as an existing page** → merge into it, add the source to `sources:`, refresh `updated:`.
**New concept** → new page `wiki/<domain>/<concept-slug>.md`, named after the concept, not the source file.
**Spans domains** → put it in the most relevant domain and add `## Related` links to the others.

**Use the template `wiki/_templates/page.md`** for every new page. Replace `{{title}}` with the page title and `{{date:YYYY-MM-DD}}` with today's date, fill the `<...>` placeholders, and delete sections that have no content (OPTIONAL sections included).

### 6a. Flow pages (`product/flows/*.md` → `wiki/flows/<flow-id>.md`)

A flow is the knowledge unit itself, so its wiki page is a **standard user-flow entry** rather than a distillation. **Use the template `wiki/_templates/flow.md`**: Summary, Diagram (Mermaid), Description, Context, Rules, Steps, Edge Cases, UX Notes, Prototype Mapping, Open Questions, Related.

Rules for flow pages:
- Mermaid, rules, and tables are copied **verbatim**, never reworded. The Description is the only synthesized part (mark it `^[inferred]` if it adds interpretation).
- On re-ingest of a changed flow, replace Diagram, Rules, Steps, Edge Cases, and Mapping with the new version, and add a `> **Status: Outdated** (YYYY-MM-DD)` note under Summary describing what changed (e.g. "E3 added, S4 merged into S3").
- `wiki/flows/Home.md` lists every flow as a table: flow, status, sections, steps, edge cases, gaps.
- When a section spec links a flow (`(flow: <flow-id>)`), the section's wiki page gets `[[flows/<flow-id>]]` under Related and vice versa.

### 6b. Persona pages (`product/personas/*.md` → `wiki/personas/<persona-id>.md`)

A persona is the knowledge unit itself, so its wiki page is a **standard persona entry**. **Use the template `wiki/_templates/persona.md`**: proto banner (kind `proto` only), quote, Summary, Job Story, Snapshot, Goals, Thinking Style & Behaviors, Behavioral Dimensions, Needs & Pain Points, Context of Use, Accessibility & Inclusion, Design Implications, Boundaries, Assumptions & Evidence, Open Questions, Related.

Rules for persona pages:
- Copy the persona's content **verbatim** (job story, goals, tables, assumption ids and evidence levels). Never upgrade an evidence level or drop the proto banner while compiling: that would launder assumptions into facts.
- Frontmatter: `persona_id`, `persona_kind` and `persona_priority` come from the source's `id`, `kind` and `priority`; `persona_status`, `confidence`, `flows`, `sections` and `artifacts` are filled from the source and afterwards maintained by `sync-meta`. Remove the template's trailing `# maintained by` comments.
- `Related` links every flow in `flows:` as `[[flows/<flow-id>]]`, other personas it is contrasted with in Boundaries, and the `research/` pages it cites as evidence.
- On re-ingest of a changed persona, replace the content sections with the new version and add a `> **Status: Outdated** (YYYY-MM-DD)` note under Summary describing what changed (e.g. "A3 raised to firsthand, P2 removed").
- `wiki/personas/Home.md` lists every persona with the personas table variant of `wiki/_templates/domain-home.md`, primary personas first.
- A flow page whose source lists `personas:` gets `[[personas/<persona-id>]]` under Related and in its Context **User** line; the persona page links back.

**Source fidelity (grounding invariant).** Every number, date, name, and direct quote must be located in the source (grep/read) *before* you write it, and written exactly as found (`42K` stays `42K`). Derived values must show their components. If you cannot locate a value, drop it or state it without precision.

**Provenance markers in body text:**
- no marker: extracted directly from a source
- `^[inferred]`: your synthesis, not stated in a source
- `^[ambiguous]`: sources disagree or the claim is uncertain

**Diagrams are always Mermaid.** Never use ASCII art, images, or prose descriptions of a flowchart. For syntax, consult the `mermaid-diagrams` skill (`.claude/skills/mermaid-diagrams/`, especially `references/flowcharts.md`, `erd-diagrams.md`, and the state and sequence references). For user flows, the Mermaid Conventions in `designos-userflow` take precedence (quoted labels, `S`/`E` node ids, two `classDef`s).

**Validate before finishing.** Run `npm run validate:mermaid -- <every page you wrote>`. If a diagram fails, fix the syntax (for a flow page, fix it in `product/flows/<flow-id>.md` first, then re-copy it) and re-run until it passes. Never leave an invalid diagram in the wiki.

**Obsidian rules:** internal links are always `[[domain/page]]` or `[[domain/page|alias]]`, never `[text](path.md)`. File paths go in backticks. Tags are lowercase-hyphenated and must exist in `_meta/taxonomy.md` (add new ones there first).

### 7. Cascade updates and conflicts

Search the whole wiki for entities and claims the source touches; update every materially affected page (refresh `updated:`).

**Never silently rewrite history.** When a claim is superseded or contested, keep it and mark it directly beneath:

```markdown
> **Status: Outdated** (YYYY-MM-DD)
> <What changed and the current understanding, with source.>

> **Status: Disputed**
> <The competing claims, each with its source.>
```

Product artifacts change often: when `product/` now says something different from a page, mark the old claim **Outdated** and state the new one. When the conflicting content lives in two pages, mark both and cross-link them.

### 8. Update indexes

- Domain `wiki/<domain>/Home.md`: create if missing from `wiki/_templates/domain-home.md` (the flows variant for `wiki/flows/Home.md`), and list every page with its summary.
- `wiki/Home.md`: keep the How To section unchanged; refresh the Domains table (domain, page count, last updated) and prepend to Recent Updates (keep the last 10).

### 9. Cross-link

Ensure new pages link to related existing pages and vice versa. For a larger ingest, suggest `/design-os:wiki-cross-link`.

### 10–11. Record the ingest (manifest + log)

One call writes both the `_manifest.json` entry (with content hash and timestamp) and the `log.md` entry. Do not edit these two files by hand:

```
npm run -s wiki -- record <source-path> --type <product|raw|capture> \
  --disposition <New|Update|Disputed, comma-separated> --title "<primary page title>" \
  --created <domain/page,domain/page> --updated <domain/page> [--note "<what changed>"]
```

For No material: `npm run -s wiki -- record <source-path> --type <type> --disposition "No material"` (writes the machine-readable `ingest | no material: <path>` log heading).

Run it **after** the page is written and validated, because the hash is taken at that moment. For a flow or persona, run `npm run -s wiki -- sync-meta <path>` right after, so the page's metadata matches the source.

### 12. Handoff

```
Ingest complete: <source>
Disposition: <...>

Pages created: X  ·  Pages updated: Y
wiki/
├── <domain>/<page>.md   (new)
├── <domain>/<page>.md   (updated)
├── Home.md              (updated)
└── log.md               (appended)

Next: /design-os:wiki-cross-link · /design-os:wiki-status · open wiki/ in Obsidian
```

---

## Research (multi-source ingest)

Only when the user explicitly asks to research a topic into the wiki:
1. Split the topic into angles; search wide (official names, abbreviations, synonyms).
2. For every core claim, deliberately search the opposing side (criticism, failures).
3. Save each selected source to `wiki/raw/`, then compile **one at a time**.

---

## Output

- New/updated pages in `wiki/<domain>/`
- Domain `Home.md` indexes, updated `wiki/Home.md`
- Appended `wiki/log.md`, updated `wiki/_manifest.json`
- Optionally a new file in `wiki/raw/` (URL/pasted sources)
