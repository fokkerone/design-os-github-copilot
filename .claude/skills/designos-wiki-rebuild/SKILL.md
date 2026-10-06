---
name: designos-wiki-rebuild
description: Archive the DesignOS project brain (wiki/) and optionally rebuild it from scratch from wiki/raw/ and product/ artifacts, restore an earlier archive, or list archives. Use when the wiki has drifted too far from its sources. Triggers on /design-os:wiki-rebuild, "rebuild the wiki", "archive the wiki", "reset the wiki", "restore wiki archive".
slash_command: wiki-rebuild
phase: "Project Brain › Rebuild"
---

# Skill: designos-wiki-rebuild

You manage the vault lifecycle: archive, rebuild, restore.

**When to rebuild:** heavy drift (contradictions, stale pages), a major product pivot that makes many pages misleading, or a taxonomy restructure.

Rebuild is **destructive for the compiled layer only**. `wiki/raw/` and `product/` are never touched; the rebuild reconstructs from them.

---

## Modes

| Mode | Effect |
|------|--------|
| `archive [reason]` | Snapshot the compiled wiki. No rebuild. |
| `rebuild [reason]` | Archive, then recompile all sources from scratch. |
| `restore <timestamp>` | Auto-archive current state, then restore a snapshot. |
| `list` | Show available archives. |

No mode given → ask which one.

---

## Safety Rules

- **Never delete** `wiki/raw/`, `wiki/.obsidian/`, `wiki/_archives/`, `wiki/_templates/`, or `wiki/log.md` (append-only).
- **Always archive** before rebuild or restore.
- **Always confirm** destructive steps: print exactly what will be deleted/overwritten and wait for an explicit yes.

---

## Archive

1. Create `wiki/_archives/<YYYY-MM-DD-HH-MM>/`.
2. Copy everything in `wiki/` except `raw/`, `_archives/`, `_templates/`, `.obsidian/` into it.
3. Write `wiki/_archives/<timestamp>/archive-manifest.json`:
   ```json
   {
     "archived_at": "<ISO timestamp>",
     "pages": 0,
     "domains": [],
     "reason": "<user-provided or 'manual'>",
     "last_ingest": "<last manifest source id>"
   }
   ```
4. Append `## [YYYY-MM-DD] archive | <timestamp> — <reason>` to `log.md`.

## Rebuild

After archiving and confirmation:

1. **Clear** compiled content: all domain folders and `.md` files in `wiki/` except `log.md`, plus `_manifest.json`, `_lint-report.md`, `_insights.md`. Keep `_meta/taxonomy.md` (vocabulary is still valid), `_templates/`, `raw/`, `.obsidian/`, `_archives/`.
2. **Re-initialize:** fresh `wiki/Home.md` (same template as the initial vault), `_manifest.json` → `{"sources": []}`.
3. **Recompile, one source at a time,** with the `designos-wiki-ingest` process, in planning-flow order so later artifacts build on earlier ones:
   1. `product/product-overview.md`
   2. `product/product-roadmap.md`
   3. `product/data-shape/data-shape.md`
   4. `product/design-system/design-system.md`
   5. `product/shell/spec.md`
   6. `product/sections/*/spec.md` (roadmap order)
   7. `product/flows/*.md` (alphabetical)
   8. `wiki/raw/*` sorted by collected/capture date, oldest first
4. **Post-rebuild:** run the `designos-cross-linker` and `designos-tag-taxonomy` (audit) processes.
5. Append:
   ```markdown
   ## [YYYY-MM-DD] rebuild | Vault rebuilt from scratch

   - Archive: _archives/<timestamp>/
   - Sources recompiled: N product artifacts + M raw files
   - Pages created: K
   - Reason: <reason>
   ```
6. Report the numbers and suggest `/design-os:wiki-status` and `/design-os:wiki-lint`.

## Restore

1. Confirm: `Restore from <timestamp>? The current wiki will be archived first, then overwritten. [Y/N]`
2. Archive current state (reason: `auto, pre-restore`).
3. Clear compiled content as in Rebuild step 1, then copy `_archives/<timestamp>/*` (minus `archive-manifest.json`) into `wiki/`.
4. Append `## [YYYY-MM-DD] restore | from <timestamp> (previous state: _archives/<auto-timestamp>/)`.

## List

```
Available archives:
  2026-10-06-14-30  (N pages, reason: "pre-pivot snapshot")
  ...
Restore: /design-os:wiki-rebuild restore <timestamp>
```

---

## Output

- `wiki/_archives/<timestamp>/` snapshot
- Rebuilt or restored wiki pages
- Appended `wiki/log.md`
