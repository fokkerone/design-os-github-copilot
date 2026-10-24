---
description: Change a screen design or the shell from an element the user picked in the preview. Reads the picked element's context, asks 1–3 short questions, edits the source so the preview updates live, then records the change in the wiki (design-changes). Triggers on /design-os:live-edit and on chat messages that start with a ```live-edit block.
argument-hint: "[change request]"
---

# Live Edit

The user picked an element in the preview (Screen Design or Shell) with "Select element", optionally edited it in the inspector, and described a change in the chat. Your job: **this one change**, in the source of that element, discussed with the user first and recorded in the wiki afterwards. Nothing else: no new screens, no spec changes, no refactors next to it.

**Important:** Ask every question with the structured question tool (`AskUserQuestion` in Claude Code, `question` in the Design OS chat), never as plain prose: 2–4 options, your recommendation first with the suffix `(Recommended)`, `multiSelect: true` for non-exclusive choices, up to 4 independent questions per call, no own "Other" option (it is added automatically), short labels.

## Step 1: Read the context

The message starts with a fenced `live-edit` block:

```live-edit
target: screen-design            # or: shell
section: <section-id>            # screen designs only
screen: <ScreenDesignName>       # screen designs only
source: src/sections/<id>/components/Hero.tsx:42:7
component: AppShell › LandingPage › Hero
element: h1
classes: "text-6xl font-semibold text-stone-900"
text: "The platform"
edits:                           # inspector edits, Tailwind class swaps (optional)
  - font-size: "text-6xl" -> "text-7xl"  # preview font-size: 4.5rem
  - background-color: "(none)" -> "bg-[oklch(65.03%_0.11008_192.46)]"; dark "(none)" -> "dark:bg-[oklch(80.08%_0.13033_181.21)]"  # token: primary; exact value
  - border-radius: "rounded-lg" -> "rounded-[0.25rem]"  # token: radius-md; exact value
  - text-style: "(none)" -> "text-xs font-light leading-4"  # token: xs-light
  - padding-top: "(none)" -> "pt-[13px]"  # not a token; preview padding-top: 13px
html: |
  <h1 class="...">The platform</h1>
```

A component picked in the **Layers** tree (the component tree next to the preview) has `kind: component` instead of `source` and `element`:

```live-edit
target: screen-design
section: account
screen: Login
kind: component
call: src/sections/account/components/LoginForm.tsx:58:9      # where <Button> is used
definition: src/ui/button.tsx:41:5                           # where Button's own markup is written
component: Login › LoginForm › Button
props:
  type: "submit"
  disabled: false
  onClick: ƒ
root element: button
classes: "inline-flex h-9 … bg-teal-600"                     # of the element the component renders
edits:                                                       # prop edits from the inspector (optional)
  - prop size: "lg" -> "sm"  # options of Button: default, sm, lg, icon
  - prop variant: "outline" -> (none)  # options of Button: default, outline, ghost, destructive; remove the prop
  - prop disabled: (none) -> true
```

`- prop <name>: <from> -> <to>` edits a prop of the JSX element at `call`, never the definition. The values are JSON: `"sm"` becomes `size="sm"`, `true` becomes `disabled` (or `disabled={true}`), a number `{3}`, `false` `={false}`. `(none)` as `from` adds the prop, `(none)` as `to` removes it (the component's default applies). An `options of` note lists what the prop's type allows (a union of strings, cva() variants): the value is one of them, apply it as written. The user saw the result live in the preview.

The text after the block is the user's change request. If there is no block, ask the user to pick an element with "Select element" in the preview, then stop.

Then load what governs the element:

1. Open `source` at the given line (for `kind: component`: `call`, the JSX element `<Button …>` starting there; read `definition` too). The element is the JSX element starting there; `component` names the component it is written in. If the file or line does not match the `html` (the file changed since the pick), find the element by its classes and text and say so.
2. `npm run -s techstack` — the UI library and icons. Primitives come from `src/ui/` only, never from `@/components/*`.
3. `product/design-system/DESIGN.md` when it exists (colors, type scale, spacing, radius, shadows, rules) and "Token classes" in agents.md. Without it the fallback applies: `stone` neutrals, `lime` accents, the Tailwind scale.
4. Screen designs: `product/sections/<section-id>/spec.md` and `npm run -s context -- <section-id> --screen <ScreenDesignName>` (personas, flows, the steps this screen covers). Shell: `product/shell/spec.md`.
5. `wiki/design-changes/<section-id>.md` (or `shell.md`) when it exists: earlier changes to the same area. Don't undo a recorded change without asking.

## Step 2: Ask (always, 1–3 questions)

Ask in **one** call, only what the request leaves open. Typical questions:

- **Scope**: only this element / every use of this component / the same element in all screens of the section. For `kind: component` the default is **this usage**: change the props and `className` at `call`. Only a change the props and `className` cannot express (or the user's wish for every usage) edits `definition`; ask before you do. Recommend the narrowest scope that fulfils the request. When the element is in `src/ui/` (a shared primitive), say that the change affects every screen.
- **Token or exception**: when the request names a value that is not in DESIGN.md (e.g. "#ff6600", "13px"), offer the nearest tokens first and the raw value last.
- **Conflicts**: if the change contradicts the section spec, a flow step, a persona's design implication or a DESIGN.md rule, show the conflict and let the user decide. Never resolve it silently. The spec is binding; a change to it belongs to `/design-os:shape-section`.
- **Responsive / dark mode**: when the change touches color or layout, ask whether it applies to `dark:` and the breakpoints as well (recommend: yes).

Inspector edits in the `edits:` list are the user's explicit choice: apply them as written (`from` class replaced by `to` class) unless they conflict. `(none)` means no class set the property: add the `to` class, and when a shorthand (`p-4`, `px-6`, `rounded-lg`) already covers it, ask whether to split the shorthand or keep it next to the side class. `# token: <name>` asks for the token comment (`{/* token: primary */}`); with `exact value` the class is the token's exact value ("Token classes" in agents.md): write it unchanged, never round it to a palette step or a Tailwind class, never convert OKLCH to hex. `; dark "<from>" -> "<to>"` is the `dark:` class swap that goes with it: replace the element's `dark:` class for the property, or add it. `text-style` sets several classes: replace the element's font size, weight, line height and tracking classes with them. `# not a token` marks a raw value the user typed: offer the nearest tokens first (Token or exception question).

When the request is exactly `The inspector already wrote these edits to the source. Do not edit files: record the change in the wiki (Step 4).` (the inspector's "Write to source", then "Record in wiki"), the `edits:` list is already in the file at `call`. Ask nothing and change no file: check that the call site shows the edits (say so if it does not), then go straight to Step 4 and record them as the user's choice.

When the request is exactly `Apply the inspector edits to the source as listed.` (the inspector's "Apply with agent" button), the `edits:` list is the whole change. Ask only what is still open (usually the scope, when the element is in `src/ui/` or rendered in a list) and conflicts; if nothing is open, skip the questions and go straight to Step 3. A `content` edit replaces the element's text in the JSX.

## Step 3: Make the change

- Edit only the files the chosen scope requires. Keep the component props-based; never import data.
- Use token classes ("Token classes" in agents.md): the Tailwind class when the token has Tailwind's value, else its exact value, colors in OKLCH. Name the token in a comment (`{/* token: primary */}`), keep `dark:` variants and responsive prefixes consistent.
- No new dependency. A request the tech stack cannot serve is reported with `/design-os:techstack update`.
- A change that needs a new reusable piece of UI, or new variants, goes to `src/ui/` (named PascalCase export, `cva()` variants), not into the screen, so Design System › Components lists it. Run `npm run -s ui:check` after it and fix every finding.
- Vite HMR updates the preview next to the chat as soon as the file is saved; the inspector preview disappears then and the real result shows.

Tell the user in one or two sentences what changed (file:line) and ask with the question tool whether it fits or needs adjustments. Repeat Step 3 for adjustments.

## Step 4: Record it in the wiki

Once the user is happy:

1. **Capture**: write `wiki/raw/capture-<YYYY-MM-DD-HH-MM>.md` from `wiki/_templates/capture.md` (follow `.claude/skills/designos-wiki-capture/SKILL.md`, quick mode), with
   - `designos_step: live-edit:<section-id>/<ScreenDesignName>` (shell: `live-edit:shell`)
   - **Decisions**: the change as Chose / Over / Because, with the answers from Step 2 as the reason
   - **Artifacts touched**: every file:line you changed, with the class swap (before → after)
2. **Ingest**: compile the capture with the `designos-wiki-ingest` skill into the `design-changes` domain: one page per section, `wiki/design-changes/<section-id>.md` (shell: `wiki/design-changes/shell.md`), created from `wiki/_templates/design-change.md` when it does not exist. Add the change as the newest entry of its changelog, link the section (`[[roadmap/...]]` or the section's page) and, when a decision was made, a `decisions/` page. Update `Home.md`, `log.md` and `_manifest.json` as the skill describes.

Print at the end:

```
Changed: <file:line>, <summary>
Recorded: wiki/design-changes/<page>.md (from wiki/raw/capture-<timestamp>.md)
```
