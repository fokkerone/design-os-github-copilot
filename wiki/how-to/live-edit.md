---
title: Live Edit
summary: Pick an element in the screen design or shell preview, tweak it with design tokens in the inspector, describe the change in the chat, answer a few questions, and watch the agent apply it live. Every change is recorded in wiki/design-changes/.
tags: [how-to, design-changes]
sources: [.claude/commands/design-os/live-edit.md, scripts/babel-source-attr.mjs, src/lib/live-edit/, src/components/live-edit/]
created: 2026-10-23
updated: 2026-10-23
---

# Live Edit

## Summary
Live Edit changes a screen design or the shell from the preview, the way v0 does: point at an element, say what should change, and the agent edits the source next to the chat. The preview updates through HMR as soon as the file is saved.

## How to use it

1. Open a screen design (Prototype › Sections › a screen) or the shell (Design System › Shell).
2. Click **Select element** in the toolbar, or press `V`. Hover shows what you would pick; click picks it. `Esc` ends picking.
3. The element appears as a chip in the chat input (`Hero › h1  src/sections/…/Hero.tsx:42`), and the **inspector** opens over the preview.
4. Optional: change content, size, weight, alignment, colors, padding or radius in the inspector. It offers only design tokens (DESIGN.md, or stone/lime and the Tailwind scale without one). The preview shows the edit right away; nothing is written yet. Undo, redo and reset are in the inspector footer.
5. Describe the change in the chat and send. The message carries the element (source location, component path, classes, HTML) and your inspector edits.
6. The agent asks 1–3 short questions: scope (this element, the component, every screen), tokens instead of raw values, conflicts with the spec, a flow or the design system.
7. The agent edits the file, and the preview shows the real result. Ask for adjustments in the chat.
8. When you're done, the agent records the change: a capture in `wiki/raw/`, compiled into `wiki/design-changes/<section-id>.md` (or `shell.md`).

Remove the chip with its × to send a normal message instead.

## How it works

- **Source locations**: in `npm run dev`, a Babel plugin (`scripts/babel-source-attr.mjs`) adds `data-dos-src="file:line:col"` and `data-dos-comp="Component"` to every DOM element written in `src/sections/`, `src/shell/` and `src/ui/`. Production builds and the export don't have them.
- **Picker**: runs inside the preview iframe (`src/lib/live-edit/picker.ts`) and talks to the page through `postMessage` (`src/lib/live-edit/protocol.ts`).
- **Message**: the chat sends `Follow the instructions in .claude/commands/design-os/live-edit.md.` plus a fenced `live-edit` block and your request. The thread shows it as a folded chip.
- **Wiki**: the `design-changes` domain keeps one changelog page per section, newest first.

## Limits

- Only screen designs and the shell. The clickdummy opens in its own tab without a picker.
- The inspector preview uses inline styles; the agent writes Tailwind classes. Responsive and `dark:` variants are discussed in the questions, not edited in the inspector.
- Elements rendered by a component from a library (not in `src/`) are picked at the nearest element of your own code.

## Related
- [[how-to/step-by-step]] — where Live Edit fits after Design Screen
- [[how-to/project-brain]] — how captures become wiki pages
