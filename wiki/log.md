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

## [2026-10-23] ingest | Design changes — Meter readings

- **Source:** `wiki/raw/capture-2026-10-23-17-01.md` (capture)
- **Disposition:** New
- **Created:** [[design-changes/meter-readings]]
- **Note:** ReadingForm title text-lg -> text-2xl

## [2026-10-24] ingest | Design changes — Account

- **Source:** `wiki/raw/capture-2026-10-24-11-29.md` (capture)
- **Disposition:** New; Update
- **Created:** [[design-changes/account]]
- **Updated:** [[design-changes/meter-readings]] (Buttons size/radius, CardFooter justify-end, Profile save state in button, check icon size-16, ReadingForm text-orange-700)

## [2026-10-24] ingest | Design changes — Account

- **Source:** `wiki/raw/capture-2026-10-24-15-42.md` (capture)
- **Disposition:** Update
- **Created:** [[design-changes/account]]
- **Updated:** [[design-changes/account]] (Login Sign in submit button size sm -> lg)

## [2026-10-24] comments | Account

- **Created:** [[comments/account]] — first comment on the Account screens

## [2026-10-24] ingest | Design changes — Account

- **Source:** `wiki/raw/capture-2026-10-24-21-02.md` (capture)
- **Disposition:** Update
- **Created:** [[design-changes/account]]
- **Updated:** [[design-changes/account]]

## [2026-10-24] ingest | Design changes — Account

- **Source:** `wiki/raw/capture-2026-10-24-23-13.md` (capture)
- **Disposition:** Update
- **Created:** [[design-changes/account]]
- **Updated:** [[design-changes/account]]

## [2026-10-26] comments | Account

- **Created:** [[comments/account]] — first comment on the Account screens

## [2026-10-26] comment | Account Login #1

- **Source:** `wiki/raw/capture-2026-10-26-20-00.md` (capture)
- **Disposition:** Update
- **Updated:** [[design-changes/account]], [[comments/account]]

## [2026-10-26] comment | Account Login #2

- **Source:** wiki/raw/capture-2026-10-26-20-01.md (capture)
- **Updated:** [[design-changes/account]], [[comments/account]]

## [2026-10-27] comments | Meter Readings

- **Created:** [[comments/meter-readings]] — first comment on the Meter Readings screens

## [2026-10-27] comment | Meter Readings ReadingHistory #1

- **Source:** `wiki/raw/capture-2026-10-27-08-05.md` (capture)
- **Disposition:** Update
- **Updated:** [[design-changes/meter-readings]], [[comments/meter-readings]]

## [2026-11-03] ingest | Design changes — Meter readings

- **Source:** `wiki/raw/capture-2026-11-03-08-06.md` (capture)
- **Disposition:** Update
- **Updated:** [[design-changes/meter-readings]], [[comments/meter-readings]] (Comment #1 on ReadingConfirmation (harden))

## [2026-11-03] ingest | Design changes — Meter readings

- **Source:** `wiki/raw/capture-2026-11-03-14-50.md` (capture)
- **Disposition:** Update
- **Updated:** [[design-changes/meter-readings]], [[comments/meter-readings]] (Comment #2 on ReadingConfirmation (animate))
