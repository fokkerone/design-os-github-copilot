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

For feedback that should wait or follow an impeccable command (polish, audit, harden ...), leave a numbered **Comment** instead: [[how-to/comments]].

## How to use it

1. Open a screen design (Prototype › Sections › a screen) or the shell (Prototype › Shell).
2. Click **Select element** in the toolbar, or press `V`. Hover shows what you would pick; click picks it. `Esc` ends picking.
   - The column next to the preview has two tabs. **Layers** is the component tree, like the React DevTools: the components called in the screen (`Login › LoginForm › Button`), with the file they are called from. Hover highlights a component in the preview, a click selects exactly that component (not only one of its DOM elements). **Elements** also lists the DOM elements, the filter finds components by name, arrow keys walk the tree.
   - **Inspect** shows the selection. For a component: where it is called and defined, and every prop its type declares, also those the call site does not set. A union of strings (`variant: "bar" | "tabs"`, `cva()` variants) is a choice with its default marked, text, number and yes/no props are fields, objects and functions are shown. Props a library declares (Radix: `orientation`, `asChild`) follow, marked with the package. A prop the component does not have (shadcn's Card in the `new-york` style has no `size`) needs a change to the component, not to its props. Every change shows live in the preview, the source stays untouched until you save it. **Write to source** writes the props straight into the JSX at this usage (`<Button size="sm">`), without the agent and without touching the rest of the file; HMR then shows the real source. **Record in wiki** afterwards asks the agent only to record the change in `wiki/design-changes/`. **Apply with agent** (the sparkle icon) leaves the writing to the agent instead. Reset puts the source props back. Style edits on a component go through the chat for now.
3. The element appears as a chip in the chat input (`Hero › h1  src/sections/…/Hero.tsx:42`), and the **inspector** opens next to the preview (the resize handles stay free).
4. Optional: edit the element in the inspector: Typography (text style, font, size, weight, style, line height, letter spacing, alignment, case, decoration), Color, Background (color, gradient), Layout (display, width, height, min/max width, margin, padding; "Show paddings and margins" outlines them in the preview), Border, Appearance (opacity, radius per corner, blur) and Shadow. Every value is a design token from DESIGN.md (roles like `primary`, palettes, alpha, the scales), or stone/lime and Tailwind's scale without one. Drag the grip of a number field or use the arrow keys to step through the scale; a typed value off the scale is marked "not a token". The preview shows the edit right away, in the dark value when the preview is dark; nothing is written yet. Undo, redo and reset are in the inspector footer.
5. **Apply with agent** sends your inspector edits as they are, or describe the change in the chat and send. The message carries the element (source location, component path, classes, HTML) and your inspector edits.
6. The agent asks 1–3 short questions: scope (this element, the component, every screen), tokens instead of raw values, conflicts with the spec, a flow or the design system.
7. The agent edits the file, and the preview shows the real result. Ask for adjustments in the chat.
8. When you're done, the agent records the change: a capture in `wiki/raw/`, compiled into `wiki/design-changes/<section-id>.md` (or `shell.md`).

Remove the chip with its × to send a normal message instead.

## How it works

- **Source locations**: in `npm run dev`, a Babel plugin (`scripts/babel-source-attr.mjs`) adds `data-dos-src="file:line:col"` and `data-dos-comp="Component"` to every DOM element written in `src/sections/`, `src/shell/` and `src/ui/`. Production builds and the export don't have them.
- **Preview**: the iframe shows `preview.html` (`#/screen/<section>/<screen>`, `#/shell`, `#/clickdummy`), a document of its own with its own Tailwind build and the prototype theme (`src/preview/`). The Design OS UI never bundles prototype code.
- **Picker**: runs inside the preview (`src/preview/bridge/picker.ts`) and talks to the page through `postMessage` (`src/lib/live-edit/protocol.ts`). The page also sends `dos:theme`, so the preview follows the light/dark switch.
- **Write to source**: `scripts/live-edit-writer.mjs` (dev server only, `POST /__designos/live-edit/props`) finds the JSX element at the call site's line and column and changes only its attributes. It writes product files only (`src/ui`, `src/sections`, `src/shell`) and refuses when the element is not where the tree saw it.
- **Live props**: React's dev renderer hands its DevTools internals to `__REACT_DEVTOOLS_GLOBAL_HOOK__`; `scripts/react-devtools-hook.mjs` keeps them, and `src/preview/bridge/prop-override.ts` overrides props through them, as the React DevTools do. A re-render of the parent hands in the source props, so the picker applies the overrides again after every render. The props come from `scripts/component-props.mjs` (`virtual:component-props`): the TypeScript compiler reads each component's props type without React's DOM attributes, defaults from the parameter list or `cva()` `defaultVariants`.
- **Component tree**: `src/preview/bridge/component-tree.ts` reads React's fibers in the preview. The Babel plugin marks every component call in the product folders with `data-dos-call` (React 19 has no `_debugSource`), so the tree shows only the product UI and knows each call site.
- **Message**: the chat sends `Follow the instructions in .claude/commands/design-os/live-edit.md.` plus a fenced `live-edit` block and your request. The thread shows it as a folded chip.
- **Wiki**: the `design-changes` domain keeps one changelog page per section, newest first.

## Limits

- Only screen designs and the shell. The clickdummy opens in its own tab without a picker.
- The inspector preview uses inline styles; the agent writes token classes ("Token classes" in agents.md): the Tailwind class when the token has Tailwind's value, else the exact value, colors in OKLCH, with a `token:` comment. Semantic colors bring their `dark:` class; other responsive and `dark:` variants are discussed in the questions.
- Elements rendered by a component from a library (not in `src/`) are picked at the nearest element of your own code.

## Related
- [[how-to/step-by-step]] — where Live Edit fits after Design Screen
- [[how-to/project-brain]] — how captures become wiki pages
