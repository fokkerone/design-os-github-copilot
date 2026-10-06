---
name: designos-wiki-capture
description: Save findings from the current DesignOS session to the project brain before they disappear — product and design decisions, rejected alternatives, stakeholder feedback, open questions. Quick mode stages a draft in wiki/raw/; full mode compiles straight into wiki pages. Triggers on /design-os:wiki-capture, "save to wiki", "capture this session", "note this for the wiki", "remember this decision".
slash_command: wiki-capture
phase: "Project Brain › Capture"
---

# Skill: designos-wiki-capture

You are capturing knowledge from the current DesignOS session before it disappears.

The context window is ephemeral. Planning conversations produce decisions that never make it into `product/` files: why an option was rejected, what a stakeholder said, which questions stayed open. This skill saves them.

---

## Modes

### `--quick` (default)
Stage a structured draft to `wiki/raw/capture-<YYYY-MM-DD-HH-MM>.md`.
No page writes, no manifest update. The next `/design-os:wiki-ingest --pending` compiles it.

### `--full`
Stage the capture file (same as quick), then immediately compile it by following the full process in the `designos-wiki-ingest` skill.

---

## Steps

### 1. Scan the current session

**Worth capturing:**
- Product decisions (scope, features, target users) with the alternatives that were rejected
- Design decisions (layout, navigation, tokens, interaction patterns) and why
- Data-shape decisions (entity naming, relationships)
- Stakeholder / user feedback, attributed by role (e.g. "product owner"), never by private names unless the user asks
- Gotchas in the DesignOS flow (e.g. a screen design that didn't fit the shell)
- Open questions that came up but weren't resolved

**Drop:**
- Content already written to `product/` files verbatim (ingest those with `--product` instead)
- Routine generation steps, tool chatter
- Anything obvious from reading the files

Show the user the list of items you plan to capture and let them add or remove items before writing.

### 2. Write the capture file

`wiki/raw/capture-<YYYY-MM-DD-HH-MM>.md`: **use the template `wiki/_templates/capture.md`**. Fill in `{{date:...}}` and `{{time:...}}` with the current date and time, set `designos_step` (for example `userflow:<flow-id>`), and fill the `<...>` placeholders. If the session produced a flow or process that has no `product/flows/` file, sketch it as a Mermaid flowchart under Decisions (never ASCII art).

Omit empty sections. Once written, a capture file is a raw source: never edit it afterwards.

Print:

```
Captured to wiki/raw/capture-<timestamp>.md
Run /design-os:wiki-ingest --pending to compile it into the wiki.
```

### 3. Full mode

Compile the capture with `designos-wiki-ingest` (triage → route → compile → indexes → log → manifest). Tag resulting pages with `capture` in addition to their domain tag.

### 4. Always suggest

```
Also consider:
  /design-os:wiki-cross-link   Weave [[wikilinks]] across the vault
  /design-os:wiki-status       See what's in the brain now
```

---

## Output

- `wiki/raw/capture-<timestamp>.md` (both modes)
- Full mode: new/updated wiki pages, `Home.md` files, `log.md`, `_manifest.json`
