---
name: designos-techstack
description: Decide the tech stack of the DesignOS prototype in an interactive session — UI library (shadcn/ui is the default), component base, style, icons, registries and reference repos, app patterns (forms, state, tables, charts), tooling and the target framework of the export. Produces product/techstack/techstack.md, validates it, and ingests it into the wiki (wiki/techstack/). Every later step loads the stack and follows it. Triggers on /design-os:techstack, "define the tech stack", "which UI library", "use shadcn", "add a registry", "change the stack", "update the tech stack".
slash_command: techstack
phase: "Planning › Tech Stack"
---

# Skill: designos-techstack

You decide, together with the user, **what the prototype is built with**. The decisions are written once and then followed by every later step: design system, shell, screens, clickdummy and export. A tech stack that later steps ignore is worthless, so this skill has two halves:

1. **The session** (Steps 0–11): ask, check for conflicts, write `product/techstack/techstack.md`, put it into the wiki.
2. **The contract** (section "Applying the stack"): the rules every later step follows. They are part of this skill because they are what the decisions mean.

| Stage | What it prevents |
|-------|------------------|
| Fixed runtime | Promising a framework the prototype cannot run |
| Defaults first (shadcn/ui) | Asking the user to decide what they do not care about |
| One question per decision, options from the product | Generic stack quizzes |
| Packages and registries are listed | Steps that install or import things nobody agreed to |
| Compatibility check | A library that fights Tailwind, the tokens or the target codebase |
| Computed state | Stored "installed" flags that go stale |

**Core principles** (enforce them in every stage):

1. **The prototype runtime is fixed.** Screens are rendered inside Design OS, which is React 19, Vite, TypeScript (strict) and Tailwind CSS v4. These three areas (`framework`, `language`, `styling`) are shown, never asked. What the **target codebase** uses (Next.js, Remix, ...) is a separate decision (`target-framework`).
2. **shadcn/ui is the default.** Offer it first as `(Recommended)`. Choosing something else is allowed, but it has consequences that you state in Step 7.
3. **Undecided means no dependency.** An area nobody decides gets no library. Do not ask about every area: ask about what the product needs.
4. **Every package has a reason.** A package without a purpose is not added to the file.
5. **Nothing is installed here.** This step records decisions. The first design step that needs a package asks the user and installs it.

---

## Interaction Rules (mandatory)

- **Every question goes through the structured question tool.** In Claude Code that is `AskUserQuestion`; in GitHub Copilot it is `ask_questions`; in OpenCode it is `question`. Never ask questions as plain prose.
  - Offer 2–4 concrete options per question, derived from the product context, not generic placeholders.
  - Put your recommendation first and suffix it with `(Recommended)`. For the UI library that is shadcn/ui, unless an existing codebase says otherwise.
  - Use `multiSelect: true` whenever choices are not mutually exclusive (registries, app patterns, tooling).
  - Bundle up to 4 independent questions per call; ask dependent questions in a later call.
  - Free-text answers come through the automatic "Other" option. Don't add your own "Other". Registry names, repository URLs and package names arrive that way.
  - Keep labels short (1–5 words) and put detail in the description, so the prompts work with hardware controllers like Stream Deck.
  - `AskUserQuestion` takes 1–4 questions per call, each with a `header` (a short tag of at most 12 characters, e.g. `UI library`, `Registries`, `Target`), a `question`, `multiSelect` and 2–4 options with `label` and `description`. If an area has more than 4 candidates, show the 3 best and let "Other" carry the rest, or spread them over up to 4 questions.
  - Never answer a question yourself. If the user skips it or answers "you decide", take the recommendation and mark the row with source `default` or `chosen` accordingly, and say so in the review step.
- **Never write a file before the user confirmed the review step.**
- **Stay in scope.** You decide the tech stack. You do not define the design system (`/design-os:design-tokens`), the shell, section specs or screens, and you do not install packages or write product code. Point to those commands instead.
- **Target length: 4–5 question rounds** in `full` mode, 2 in `quick` mode.

---

## Modes

| Mode | When | Difference |
|------|------|-----------|
| `full` (default) | First run | Rounds for UI, app patterns, tooling and the target codebase |
| `quick` | The user wants the defaults | One round (target, UI library), everything else keeps its default or stays undecided |
| `update` | `product/techstack/techstack.md` exists | Shows the current decisions, asks what to change, re-runs only the affected rounds, then Step 7 for the changed areas |
| `add-registry` | The user only wants to add a registry, a reference repo or a package | Asks for name, kind, location and purpose, checks it (Step 5), appends the row |

No mode given: `update` when the file exists, otherwise `full`.

---

## Step 0 — Load context (silent, no questions yet)

**Prerequisite.** If `product/product-overview.md` is missing, say: "Before deciding the tech stack, define your product vision with `/design-os:product-vision` (Copilot: `@00-product-vision`)." and stop.

Read what exists. Skip other missing files without comment:

- `npm run -s techstack`: the decisions that apply right now (the file, or the defaults)
- `product/product-overview.md`: what the product is (features hint at tables, charts, forms, maps)
- `product/personas/*.md`: devices, environments and inclusion needs (they drive responsive and accessibility choices)
- `product/product-roadmap.md` and `product/flows/*.md`: sections and steps that need specific components
- `package.json` of the prototype: what is installed already
- Project brain: `wiki/Home.md`, `wiki/techstack/Home.md`, `wiki/decisions/`, `wiki/research/`, `wiki/raw/` (full-text search for "stack", "framework", "library", "repo", "design system", "component") for prior decisions, existing codebases and company constraints

Tell the user in two or three lines what you found, then continue:

```
Stack today: defaults (shadcn/ui, lucide-react, Tailwind v4), no tech stack file yet
Product hints: tables and charts in 2 of 5 sections, mobile-first persona "Ana"
Wiki: no prior stack decisions
```

## Step 1 — Role

Adopt the role for all stages:

> Act as a **Senior Frontend Tech Lead** for <product name>. You choose the smallest stack that does the job, you prefer what the team and the target codebase already use, and you name the cost of every dependency.

Switch to the **Compatibility Critic** only in Step 7.

## Step 2 — Target codebase (one call)

Ask:

1. **Target**: where do the exported components go?
   - `Greenfield` (a new app is built from the export)
   - `Existing codebase` (components are integrated into a running app)
   - `Not decided yet` (record it as open question; the export asks again)
2. **Target framework** (skip when greenfield and undecided): `Next.js (App Router)` / `Vite + React` / `React Router / Remix` / Other. Record as `target-framework`.
3. **Mode check** (only without a mode): `Defaults and UI library only (Recommended)` → `quick`; `Walk through all areas` → `full`.

`Existing codebase` means: ask for its **repositories** (a free-text "Other" answer, Step 4) and treat what it already uses as the recommendation in every later round (source `existing`).

## Step 3 — UI library

Ask (one call, up to 4 questions):

1. **UI library** (`ui-library`):
   - `shadcn/ui (Recommended)`: components are copied into the product as source code, built on Radix UI or Base UI, styled with Tailwind
   - `Headless only`: Radix UI, Base UI or React Aria primitives, styled with Tailwind by hand
   - `Another component library`: Mantine, MUI, HeroUI, Chakra, ... (name it via "Other"; Step 7 explains the consequences)
   - `None`: Tailwind and native elements only
2. **Component base** (`ui-base`, shadcn/ui only): `Radix UI (Recommended)` / `Base UI`. Check `wiki/techstack/` and the target codebase first.
3. **UI style** (`ui-style`, shadcn/ui only): `new-york (Recommended)` / a named preset (`nova`, `vega`, `lyra`, ... via "Other"). Run `npx shadcn@latest docs` or read `.claude/skills/shadcn/customization.md` when the user asks what they mean. The **colors, fonts and radius** come from the design system step, never from the style.
4. **Icons** (`icons`): `lucide-react (Recommended)` / `Phosphor` / `Tabler` / `Heroicons`.

When the target codebase exists and already uses a library, put it first and mark it `(Recommended: matches target)`.

## Step 4 — Registries, reference repositories and packages

Ask (multiSelect, one call):

1. **Where do components come from?**
   - `Official shadcn registry only (Recommended)`
   - `Community registries`: e.g. `@magicui`, `@aceternity`, `@bundui` (names via "Other")
   - `Private registry`: a company registry with a URL template
   - `GitHub repositories`: an existing app or design system to copy patterns from (URLs via "Other")
2. **Extra packages** (multiSelect; only the ones the product hints at): rich text editor, drag and drop, date picker, maps, ... as options derived from Step 0. Everything else is asked in Step 5.

For every registry or repository the user names, record **name, kind, location, what it is used for**. Kinds: `shadcn-registry`, `github-repo`, `npm-package`, `design-system`, `other`.

**Verify what you can.** For a shadcn registry run `npx shadcn@latest search @<namespace>` (read-only). For a GitHub repository check that the URL resolves. If a check fails or the network is unavailable, keep the entry and mark it `unverified` in the **Used for** column. Never invent a registry name, URL or package name: if the user is unsure, record an open question.

**Licenses.** Note the license of every repository whose code will be copied. If you cannot find it, add an open question.

## Step 5 — App patterns (`full` mode only)

Ask (multiSelect per area, up to 4 questions per call, only the areas Step 0 gives a reason for; offer the rest as one "Skip the rest (Recommended)" option):

| Area | Options |
|------|---------|
| `forms` and `validation` | `react-hook-form + zod` / `TanStack Form` / `None (shadcn Field and native validation)` |
| `data-fetching` | `TanStack Query` / `SWR` / `None (the prototype reads sample data)` |
| `state` | `useState and context (Recommended)` / `Zustand` / `Redux Toolkit` |
| `tables` | `TanStack Table` / `None` |
| `charts` | `Recharts (shadcn charts)` / `visx` / `None` |
| `animation` | `CSS only (Recommended)` / `Motion` |
| `routing` | `State-based navigation in the clickdummy (default)` / the target's router (named via "Other") |
| `i18n` | `None` / `react-i18next` / `next-intl` |

Every pick that needs an npm package gets a row in **Packages** with its purpose and area. Picks that only matter for the target codebase (for example `data-fetching` for a prototype that reads sample data) are marked source `existing` or `chosen` and get no package row.

## Step 6 — Tooling and quality (`full` mode only)

Ask (one call, up to 4 questions):

1. **Package manager** (`package-manager`): `npm` / `pnpm` / `yarn` / `bun`. Recommend what the lock file in the repository says.
2. **Testing and linting** (`testing`, `linting`, multiSelect): `Vitest + Testing Library` / `Playwright` / `ESLint + Prettier` / `Biome`.
3. **Accessibility level** (`a11y`): `WCAG 2.2 AA (Recommended)` / `WCAG 2.2 AAA for core flows` / `Best effort`. Raise the recommendation when a persona lists permanent or situational constraints.
4. **Browser support** (`browser-support`): `Evergreen browsers (Recommended)` / `Includes older Safari or mobile browsers` (limits modern CSS such as `:has()`, container queries).

## Step 7 — Compatibility check (Compatibility Critic)

Switch persona: *"Act as a Compatibility Critic reviewing this stack. Find every way it could fight the prototype, the design tokens or the target codebase."* Check and present the findings as one multiSelect question (which should be fixed?). Skip checks that find nothing.

- **Library against Tailwind and tokens.** Mantine, MUI, Chakra and HeroUI bring their own styling system. The prototype styles with Tailwind token classes from `DESIGN.md` ("Token classes" in agents.md). State the consequence: the library is wrapped in the product UI layer (`src/ui/`) and themed from the tokens, which costs extra work per component. Recommend shadcn/ui or headless.
- **Target against prototype.** A Next.js target with server components means exported components that hold state need `'use client'`. Add that as a constraint.
- **Base mismatch.** The `ui-base` differs from the target codebase's (Radix UI against Base UI): the exported components would not match the app's. Align with the target.
- **Dependency weight.** More than 5 extra packages, or two libraries for the same area (two chart libraries, two form libraries): remove one.
- **Persona and a11y.** A mobile-first persona against a table-heavy layout, or an a11y level the chosen library cannot reach: record a constraint or change the pick.
- **Undecided with consequences.** A section needs a table or chart (Step 0) but `tables` or `charts` is undecided: the design steps will hand-build it. Decide or accept explicitly.
- **Unverified entries.** Registries and repositories marked `unverified`: keep them as open questions.

Apply the selected fixes. Record each remaining accepted risk as a **Constraint**.

## Step 8 — Review and write

Show a compact summary: target, UI library with base and style, icons, registries and repositories, packages, app patterns, tooling, constraints, open questions, and the areas that stay undecided.

Ask: `Write tech stack (Recommended)` / `Change something`. On confirmation write `product/techstack/techstack.md` (format below). With `update`, rewrite the file with the changes and set `updated:`. Never overwrite an existing file in any other mode.

Set `status: draft` while open questions exist that block a decision, `confirmed` otherwise.

## Step 9 — Validate

Run `npm run -s techstack -- --check`. Fix every error and re-run until it passes. Warnings are shown to the user. The check rejects: changes to the runtime areas, unknown or duplicate areas, a non-shadcn UI library without a package row.

## Step 10 — Ingest into the project brain

Immediately compile the file into the wiki by following the `designos-wiki-ingest` skill with source `product/techstack/techstack.md` (type `product`, domain `techstack`, using the **tech stack page** format defined there). Use the template `wiki/_templates/techstack.md`. This creates or updates `wiki/techstack/techstack.md` and `wiki/techstack/Home.md` and records the hash in `wiki/_manifest.json`.

If the session rejected an alternative with a reason the file does not hold (for example "MUI: the target codebase moved off it in 2025"), offer `/design-os:wiki-capture` so the reason reaches `wiki/decisions/`.

## Step 11 — Handoff

```
Tech stack saved: product/techstack/techstack.md
Wiki: wiki/techstack/techstack.md
UI: shadcn/ui (Radix UI, new-york) · lucide-react
Registries and repos: 2 · Packages: 3 (0 installed)
Undecided: state, i18n (no dependency is added for these)

Next:
  /design-os:product-roadmap     Define the sections
  /design-os:design-tokens       Define the design system (maps the tokens to the library)
  /design-os:techstack update    Change the stack later
  /design-os:wiki-query          Ask the brain about the stack
```

Then ask whether adjustments are needed.

---

## Tech Stack File Format — `product/techstack/techstack.md`

The body is content (hashed, triggers a re-ingest when it changes). The status and the date are metadata in the frontmatter. Installation state is **not** in the file: `npm run techstack` computes it from `package.json`.

The area ids are fixed (parsed by `src/lib/model/techstack.ts`): `framework`, `language`, `styling`, `ui-library`, `ui-base`, `ui-style`, `icons`, `forms`, `validation`, `data-fetching`, `state`, `tables`, `charts`, `animation`, `routing`, `i18n`, `package-manager`, `testing`, `linting`, `storybook`, `a11y`, `browser-support`, `target-framework`.

Source values: `default` (nobody decided), `chosen` (the user picked it), `existing` (the target codebase uses it), `constraint` (mandated from outside).

````markdown
---
status: confirmed
updated: 2026-10-14
---

# Tech Stack

## Summary

<Two or three sentences: the UI approach, the target codebase, and the one decision that matters most.>

## Decisions

| Area | Choice | Source | Rationale |
|------|--------|--------|-----------|
| framework | React 19 + Vite | default | Runtime of the Design OS prototype |
| language | TypeScript (strict) | default | Runtime of the Design OS prototype |
| styling | Tailwind CSS v4 | default | Runtime of the Design OS prototype |
| ui-library | shadcn/ui | default | Components are copied as source code and styled with Tailwind |
| ui-base | Radix UI | chosen | The target codebase uses Radix UI |
| ui-style | new-york | default | |
| icons | lucide-react | default | |
| forms | react-hook-form + zod | existing | Used in the target codebase |
| state | none | chosen | useState and context are enough |
| target-framework | Next.js 15 (App Router) | existing | The export is integrated there |

## Registries and Repos

| Name | Kind | Location | Used for |
|------|------|----------|----------|
| @acme | shadcn-registry | https://registry.acme.example/{name}.json | Internal form components |
| acme/portal | github-repo | https://github.com/acme/portal | Reference for existing patterns (MIT) |

## Packages

| Package | Purpose | Area |
|---------|---------|------|
| react-hook-form | Form state | forms |
| zod | Schema validation | forms |

## Constraints

- <Consequence of a decision that later steps must respect>

## Open Questions

- <Something not decided yet, or a registry or repository that could not be verified>
````

Rules for the file:

- Write the rows of the areas that were decided or confirmed. Areas that are not in the table keep their default or stay undecided. Write `none` as the choice when nothing is used on purpose.
- The three runtime rows stay as shown. Put the target codebase's framework in `target-framework`.
- One row per area. No duplicates.
- Delete the sections **Registries and Repos**, **Packages**, **Constraints** and **Open Questions** when they have no content. Do not leave placeholders.
- Keep the table cells plain: no line breaks, no `|`.

---

## Applying the stack (the contract for steps 04–11)

Every step from the design system onwards follows these rules. They are the reason this step exists.

### 1. Load the stack first

Run `npm run -s techstack` (or `-- --json`) before the first question of the step, together with the `designos-context` skill. Tell the user in one line what applies:

```
Stack: shadcn/ui (Radix UI, new-york) · lucide-react · Tailwind v4 · target Next.js 15  (product/techstack/techstack.md)
Stack: defaults (shadcn/ui, lucide-react) — no tech stack file; /design-os:techstack changes it
```

### 2. The decisions are binding

- Do not use a library, icon set or pattern that conflicts with the stack, and do not add a dependency that is neither in the stack nor in **Packages**.
- **Undecided means no dependency.** Build it with React, TypeScript and Tailwind.
- A request that needs something the stack does not have is a **conflict** (the same rule as in `designos-context`): show it, name the area, and offer `/design-os:techstack update`. Never edit `product/techstack/techstack.md` from another step, never pick a side silently.
- Installing a listed package is allowed, but ask first and use the `package-manager` of the stack. Report it. Do not edit `package.json` otherwise.

### 3. UI primitives come from the product UI layer, `src/ui/`

Screen designs, the shell and the clickdummy import UI primitives **only** from `src/ui/` (relative imports, for example `../../ui/button`). The layer belongs to the product, not to Design OS:

- **Never import `@/components/*`.** That is the Design OS UI (it also contains Design OS's own copy of shadcn/ui, styled with the Design OS theme).
- **Never run `npx shadcn@latest add`.** `components.json` points to `src/components/ui`, so it would overwrite Design OS UI.
- **shadcn/ui: port a component with `npx shadcn@latest view @shadcn/<name>`** (read-only; use `@<registry>/<name>` for a registry from the stack, and `npx shadcn@latest docs <name>` for the API). Create `src/ui/<name>.tsx` from the printed source and change it:
  1. Imports become relative. `cn` comes from `src/ui/utils.ts` (`clsx` + `tailwind-merge`; create it with the first component).
  2. **Semantic utilities become token classes** from `product/design-system/DESIGN.md` ("Token classes" in agents.md): the palette step when the role has its value (`text-muted-foreground` → `text-zinc-500`), else the exact OKLCH value (`bg-primary` → `bg-[oklch(65.03%_0.11008_192.46)]`), with the `dark:` pair. Mark the role in a comment beside the class string (`// token: primary`). Without `DESIGN.md`, use `stone` for neutrals and `lime` for accents. `npm run test:tokens` fails on semantic utilities in `src/ui/`, because inside Design OS they resolve to the Design OS theme.
  3. Respect `ui-base`: `asChild` with Radix UI, `render` with Base UI. Respect `ui-style`.
  4. Port only what a screen needs. Compose from what `src/ui/` already has before porting another primitive.
  5. Keep the primitives accessible: Dialog, Sheet and Drawer get a title, Avatar gets a fallback. Follow the rules in `.claude/skills/shadcn/rules/`.
  6. Install the npm packages the ported file imports (for example `radix-ui` or `@radix-ui/react-*`, `class-variance-authority`) only after asking, and only when they are not installed yet.
- **Every component a design uses is in `src/ui/`, so Design System › Components lists it.** The page (`/design-system/components`) reads `src/ui/` on every change, with the variants from the props types and the design files that import each component. It lists what is there, so a primitive kept anywhere else is missing from it:
  1. A reusable piece of UI (button, badge, tabs, avatar, a field with label and error ...) is a file in `src/ui/`, even when it is written by hand and used once. A screen or the shell keeps only what belongs to that screen: its layout and its section components.
  2. One file per primitive family (`card.tsx` holds `Card`, `CardHeader` ...). Export each component as a named PascalCase function with a typed props interface; write variants with `cva()` and `defaultVariants`, so the page and the Live Edit inspector show the options and the default.
  3. `cva()` is used only in `src/ui/`. A component with variants is a primitive.
  4. A primitive library (Radix, Base UI, cmdk, vaul, sonner ...) is imported only in `src/ui/`. Screens, shell and clickdummy import the wrapper.
  5. After creating, porting or changing a component, run `npm run -s ui:check`. It lists the components with their users and exits 1 for every import that bypasses the layer (a primitive library, `@/components/*`, `cva()` outside `src/ui/`). Fix every finding before you report, and name the new or changed components in the report.
- **Another component library:** list its packages in **Packages**; screens import it only through `src/ui/` wrappers that apply the tokens, never directly.
- **Headless or none:** `src/ui/` holds small Tailwind primitives written by hand.
- **Icons** come from the `icons` area. Import them in screens and shell like any dependency, one place per file.
- **Registries and repositories** from the stack are the first place to look for a component, before writing one. A GitHub repository is a **reference**: port the pattern, never vendor the repository, and respect its license.

### 4. What each step does with the stack

| Step | Agent and command | What it does |
|------|-------------------|--------------|
| 04 Design system | `@04-design-system` · `/design-os:design-tokens` | Colors must cover the semantic roles the library expects (shadcn/ui: primary, secondary, muted, accent, destructive, background, foreground, card, popover, border, input, ring), so `DESIGN.md` maps one to one. Fonts and radius are the design system's; `ui-style` never overrides them |
| 05 Shell | `@05-design-shell` · `/design-os:design-shell` | Builds the shell from `src/ui/` primitives and the stack's icons. Lists the primitives it created in `product/shell/spec.md` under "UI components" |
| 06 Shape section | `@06-shape-section` · `/design-os:shape-section` | Asks no technology questions. If the spec needs something the stack lacks (a data table when `tables` is undecided), it reports the gap and does not decide |
| 07 Sample data | `@07-sample-data` · `/design-os:sample-data` | Types stay plain TypeScript interfaces. When `validation` is decided, it notes which fields would be validated, without importing the library |
| 08 Design screen | `@08-design-screen` · `/design-os:design-screen` | Composes screens from `src/ui/`, ports missing primitives (rule 3), uses only listed packages, and reports which primitives and packages the screen needs |
| 09 Screenshot | `@09-screenshot-design` · `/design-os:screenshot-design` | Nothing stack-specific |
| 10 Clickdummy | `@10-clickdummy` · `/design-os:clickdummy` | Imports from `src/ui/`, keeps state-based navigation in the prototype, records the `routing` decision for the export |
| 11 Export | `@11-export-product` · `/design-os:export-product` | Copies the stack to `product-plan/techstack.md` and `src/ui/` to `product-plan/ui/`, maps token classes back to semantic utilities with `tokens.css`, lists the packages and registries, and **pre-fills "My tech stack"** in the prompts, asking only about undecided areas |

### 5. When the stack changes

`/design-os:techstack update` changes the file. Steps that already ran are not redone automatically: after an update, tell the user which steps are affected (a new `ui-library` affects `src/ui/`, shell and screens; a new `icons` set affects every file that imports icons) and offer to re-run them.
