---
title: Wiki Log
tags: [log]
---

# Wiki Log

Append-only activity log. Every ingest, capture, query archive, lint, cross-link, taxonomy, and rebuild run appends an entry here.

> grep-friendly: `grep "^## \[" wiki/log.md` lists all events

---

## [2026-10-06] init | Wiki initialized

- Structure: `raw/` (sources) + `<domain>/` (compiled) + `.claude/skills/designos-wiki-*/SKILL.md` (schema)
- Vault ready to open in Obsidian

## [2026-10-09] init | How To guides shipped

- **Created:** [[how-to/Home]], [[how-to/getting-started]], [[how-to/step-by-step]], [[how-to/planning-flow]], [[how-to/project-brain]], [[how-to/user-flows]], [[how-to/personas]]
- System domain `how-to`: maintained in the repository, never compiled by ingest, kept by rebuild

## [2026-10-12] update | How To: user flows and personas

- **Updated:** [[how-to/user-flows]], [[how-to/personas]] — added why, quick start, what you get, how to use the result in sections, screens and the export, common questions

## [2026-10-12] update | How To: personas and flows in the app and the commands

- **Updated:** [[how-to/user-flows]], [[how-to/personas]] — flow and persona pages in Design OS, computed flow coverage, conflicts, commands that load personas and flows themselves, walking a flow in the clickdummy
