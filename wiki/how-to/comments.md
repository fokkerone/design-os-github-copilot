---
title: Comments and impeccable
summary: Drop numbered comments on a screen design or the shell, pick an impeccable command (Improve, Check, Maintain) for each, and send one at a time to the agent. Comments live in wiki/comments/ and are resolved there.
tags: [how-to, comments]
sources: [.claude/commands/design-os/comment.md, scripts/comments-store.mjs, scripts/impeccable-context.mjs, src/lib/comments/, src/lib/live-edit/comments-overlay.ts]
created: 2026-10-24
updated: 2026-10-24
---

# Comments and impeccable

## Summary
Comments are annotations on the preview, like v0: a numbered pin on an element with what should change and which [impeccable](https://impeccable.style) command the agent runs for it. They stay in the wiki until they are resolved, so feedback does not get lost between sessions.

## How to use it

1. Open a screen design (Prototype › Sections › a screen) or the shell (Prototype › Shell).
2. Click **Comment** in the toolbar, or press `C`. The pins of this screen appear; the badge counts the open ones.
3. Click the element you mean. A numbered pin and a field **Add annotation** appear next to it.
4. Write the comment, pick a command and save (↑ or Enter):
   - **Improve** edits the design: polish, layout, typeset, colorize, bolder, quieter, distill, clarify, adapt, animate, delight, onboard.
   - **Check** reports findings and changes no file: critique (UX review), audit (accessibility, performance, responsive).
   - **Maintain** keeps it robust: harden (errors, edge cases, long text), optimize, extract (move repeated UI into `src/ui/`).
   - **No command**: a plain request, handled like a Live Edit change.
5. Click a pin to read it again, edit it, **Send to chat** or delete it. One comment goes to the agent per message.
6. The agent runs the command on that element, asks when the scope is unclear, edits the source (HMR shows it), and marks the comment `resolved` with what changed. Check commands add their findings under the comment instead.
7. The ✓✓ button next to **Comment** shows resolved comments too.

## Where it is stored

- `wiki/comments/<section-id>.md` (the shell: `wiki/comments/shell.md`), one `## <Screen>` per screen and one `### #<n> · <command> · <status>` per comment. Status: `open` → `sent` → `resolved`. A number stays with its comment, also after a delete.
- The pin sits on the element (`data-dos-src` and its index) at the point you clicked, and follows it when the layout changes. When the element is gone, the pin waits at the edge with "element moved".
- Changes to the source are also recorded in `wiki/design-changes/`, like Live Edit.

## impeccable in Design OS

- impeccable is installed in the project for Claude Code, GitHub Copilot and OpenCode (the Design OS chat), engine included.
- It reads the same context as every Design OS step: `npm run impeccable:context` (also run by `npm run dev`) links `.agents/context/DESIGN.md` to `product/design-system/DESIGN.md` and `.agents/context/PRODUCT.md` to `product/PRODUCT.md`.
- `product/PRODUCT.md` holds the product truth impeccable designs against: users, purpose, positioning, context, principles. `/design-os:product-vision` creates it with the overview, and a comment creates it first when it is still missing (one confirmation). Roadmap, personas, tech stack and user flows keep their sections current.
- Do not run `/impeccable init`, `document`, `shape`, `live` or `generate` here: Design OS steps own product truth, the design system, specs and the picker.

## Related
- [[how-to/live-edit]] — change an element directly from the preview
- [[how-to/project-brain]] — how the wiki is maintained
