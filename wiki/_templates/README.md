# _templates/ — Page Templates

Single source of truth for every page the agent writes into the wiki. The `designos-wiki-*` skills read these files; Obsidian uses the same folder for **Insert template** (core plugin *Templates*, configured in `.obsidian/templates.json`).

| Template | Used for | Written by |
|----------|----------|-----------|
| `page.md` | Standard knowledge page in any domain | `/design-os:wiki-ingest`, `/design-os:wiki-capture --full`, archived query answers |
| `flow.md` | User flow entry in `flows/` (Mermaid diagram + description + tables) | `/design-os:wiki-ingest` for `product/flows/*.md`, `/design-os:userflow` |
| `persona.md` | Persona entry in `personas/` (job story, goals, thinking style, pain points, evidence) | `/design-os:wiki-ingest` for `product/personas/*.md`, `/design-os:persona` |
| `domain-home.md` | `<domain>/Home.md` index (incl. the `flows/Home.md` and `personas/Home.md` table variants) | `/design-os:wiki-ingest` |
| `raw-source.md` | Header for fetched sources in `raw/` | `/design-os:wiki-ingest <url>` |
| `capture.md` | Session capture in `raw/` | `/design-os:wiki-capture` |

**Placeholders**
- `{{title}}`, `{{date:YYYY-MM-DD}}`, `{{time:HH:mm}}` — Obsidian template variables; the agent substitutes the page title, today's date and the current time.
- `<...>` — content the agent (or you) fills in.
- Sections marked OPTIONAL are deleted when empty.

**Diagrams** — every diagram in the wiki is Mermaid (```` ```mermaid ````), never ASCII art or images. Syntax reference: `.claude/skills/mermaid-diagrams/`. Check with `npm run validate:mermaid`.

This folder is excluded from lint, status, cross-linking and queries.
