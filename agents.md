# Agent Directives for Design OS

Design OS is a **product planning and design tool** that helps users define their product vision, sketch out their data shape, design their UI, and prepare export packages for implementation in a separate codebase.

> **Important**: Design OS is a planning tool, not the end product codebase. The screen designs and components generated here are meant to be exported and integrated into your actual product's codebase.

---

## Critical: Stay Focused on Your Task
## Critical: Product UI follows `product/design-system/DESIGN.md` when it exists

`product/design-system/DESIGN.md` is generated from imported design tokens (`npm run tokens:build`) and is the single source of truth for every product UI: colors, typography, spacing, radius, shadows and rules. Never edit it by hand; fix the inputs in `product/design-system/import/` and rebuild. The Design OS app UI itself has its own look (see the end of this file).

Product UI primitives (button, dialog, ...) come from the product-owned UI layer `src/ui/` and follow the tech stack in `product/techstack/techstack.md` when it exists (default: shadcn/ui, lucide-react). They never come from `@/components/*`, which is the Design OS UI.

**Each agent has ONE job. Do that job and nothing else.**

- Only produce the outputs described in your agent's instructions. Do not generate files or content that belong to a different agent or a later phase.
- If the user's request is ambiguous, ask a clarifying question — do not assume they want you to do more than what your agent covers.
- Never jump ahead in the planning flow. For example, the `@00-product-vision` agent must NOT create design tokens, shell specs, or section designs. It creates the product overview — that's it.
- If the user asks for something outside your scope, tell them which agent to use instead (e.g., "That's handled by the `@04-design-system` agent").
- Completing your task well is more valuable than doing many things poorly.

## Critical: Always Ask Before Generating

**Never generate or create files without first having a conversation with the user.**

- Always ask clarifying questions before creating any output files. Use the `ask_questions` tool for interactive multiple-choice questions.
- Do not auto-generate content based solely on reading other files — the user must be involved in shaping every output.
- The user's input and confirmation should drive what gets created, not your assumptions from existing files.
- After generating, always ask if the user wants adjustments.

---

## Understanding Design OS Context

When working in Design OS, be aware of two distinct contexts:

### 1. Design OS Application

The React application that displays and manages planning files. When modifying the Design OS UI itself:

- Files live in `src/` (components, pages, utilities)
- Uses the Design OS look: the app chrome (sidebar, chat, step panel) uses the Volta palette from `src/app-theme.css` and Inter, the page content in the step panel follows it
- Provides the interface for viewing specs, screen designs, exports, etc.

### 2. Product Design (Screen Designs & Exports)

The product you're planning and designing. When creating screen designs and exports:

- Screen design components live in `src/sections/[section-name]/` and `src/shell/`
- Product UI primitives live in `src/ui/` (exported to `product-plan/ui/`)
- Product definition files live in `product/`
- Exports are packaged to `product-plan/` for integration into a separate codebase
- Follow the design requirements specified in each section's spec

---

## Getting Started — The Planning Flow

Design OS follows a structured planning sequence. Each step has a dedicated agent. Use one agent at a time — complete each step before moving to the next.

| Step | Copilot Agent | Claude Code Command |
|------|--------------|---------------------|
| 1. Product Overview | `@00-product-vision` | `/product-vision` |
| 2. Tech Stack | `@01-techstack` | `/design-os:techstack` |
| 3. Product Roadmap | `@02-product-roadmap` | `/product-roadmap` |
| 4. Data Shape | `@03-data-shape` | `/data-shape` |
| 5. Design System | `@04-design-system` | `/design-tokens` |
| 6. Application Shell | `@05-design-shell` | `/design-shell` |
| Personas (any time after step 1) | `@persona` | `/design-os:persona` |
| User Flows (any time after step 3) | `@userflow` | `/design-os:userflow` |
| 7a. Shape Section | `@06-shape-section` | `/shape-section` |
| 7b. Sample Data | `@07-sample-data` | `/sample-data` |
| 7c. Design Screen | `@08-design-screen` | `/design-screen` |
| 7d. Screenshot | `@09-screenshot-design` | `/screenshot-design` |
| 8. Clickdummy | `@10-clickdummy` | `/clickdummy` |
| 9. Export | `@11-export-product` | `/export-product` |

### 1. Product Overview

Define your product name, description, problems/solutions, and key features.
**Output:** `product/product-overview.md`

### 2. Tech Stack

Decide what the prototype is built with, in an interactive session: UI library (**shadcn/ui is the default**), component base (Radix UI or Base UI), UI style, icons, registries and reference GitHub repositories, packages, app patterns (forms, state, tables, charts, ...), tooling and the target framework of the export. The prototype runtime (React 19 + Vite, TypeScript strict, Tailwind CSS v4) is fixed and never asked. The step is recommended, not blocking: without it the defaults apply (shadcn/ui, lucide-react).
**Output:** `product/techstack/techstack.md` (ingested into `wiki/techstack/techstack.md`)

Every later step loads the stack and follows it:

- Run `npm run techstack` (`npm run -s techstack -- --json` for machines) before the first question of a step. It prints the decisions that apply, from the file or from the defaults.
- UI primitives are imported **only** from `src/ui/` (the product-owned UI layer, exported to `product-plan/ui/`), never from `@/components/*`. With shadcn/ui, port a component with `npx shadcn@latest view @shadcn/<name>` into `src/ui/`; never run `npx shadcn@latest add`.
- **Undecided means no dependency.** Build it with React, TypeScript and Tailwind. A dependency that is neither in the stack nor in its Packages table is not added.
- **Conflicts are shown, not resolved.** A request the stack cannot serve is reported with the area and `/design-os:techstack update`. Only the tech stack step edits the file.
- Nothing is installed by the tech stack step. The first design step that needs a package asks the user first.

### 3. Product Roadmap

Define the main sections (features/areas) of the product.
**Output:** `product/product-roadmap.md`

### 4. Data Shape

Sketch out the core entities and their relationships.
**Output:** `product/data-shape/data-shape.md`

### 5. Design System

Define your visual identity: colors (from Tailwind), typography (from Google Fonts), and optionally brand personality, voice, and UI style preferences. You can import brand resources (logos, style guides) for analysis.
**Input (optional):** Place brand assets in `product/design-system/resources/`
**Output:** `product/design-system/design-system.json`, `product/design-system/design-system.md`

**Token import (alternative to the interview):** Put a W3C DTCG `tokens.json` (plus optional Figma `DESIGN.md` and typeui `skill.md`) into `product/design-system/import/` and run `npm run tokens:build`. Style Dictionary converts the tokens (hex → OKLCH, px → rem) and writes `tokens/tokens.css` (Tailwind v4), `tokens/tokens.json` (the model the app renders) and the merged `DESIGN.md`. The build is deterministic and idempotent: the same inputs always produce byte-identical outputs; `npm run tokens:check` fails if outputs are stale; `npm run test:tokens` runs the contract tests.

### 6. Application Shell

Design the persistent navigation and layout that wraps all sections. Uses design system personality and UI style preferences if available.
**Output:** `product/shell/spec.md`, `src/shell/components/`

### Personas (any time after the product overview)

Create personas and proto-personas in an interactive session: a JTBD job story, Cooper's end, experience and life goals, thinking style and behavioral dimensions instead of demographics, pain points with current workarounds, context of use, inclusion, and design implications. A red-team pass removes stereotypes, and every untested claim gets an assumption id with an evidence level (`assumption` → `hypothesis` → `signal` → `firsthand` → `pattern`).
- **proto**: assumption-based, labeled "assumptions, not research"
- **research**: grounded in interviews and research from `wiki/raw/` and `wiki/research/`
- **validate**: record new evidence and raise or lower the confidence
- Product Vision, User Flows and Shape Section use existing personas; section specs link them via `(persona: <persona-id>)` bullets under `## Personas`, and flows list them in `personas:` frontmatter. The export copies them to `product-plan/personas/`.

**Output:** `product/personas/[persona-id].md`, `wiki/personas/[persona-id].md`

### User Flows (any time after the roadmap)

Design concrete user flows with the REFINE and CARE frameworks, chain-of-thought reasoning, and edge-case red-teaming. Every flow gets a Mermaid diagram, a step table, rules, edge cases, and a mapping to sections and screen designs. It is ingested into the project brain automatically.
- **plan**: plan flows ahead, before sections or screens exist
- **prototype**: add a flow to the existing prototype and get a gap list of missing screens and states
- **Shape Section** can create flows inline or link existing wiki flows (multi-select). Spec bullets then end in `(flow: <flow-id>)`, and the Design OS app renders the diagram.

**Output:** `product/flows/[flow-id].md`, `wiki/flows/[flow-id].md`

### 7. For Each Section

- **Shape Section** — Define the specification (only spec.md)
- **Sample Data** — Generate sample data and types
- **Design Screen** — Create screen designs (applies design system voice and UI style, composes them from `src/ui/` and the tech stack)
- **Screenshot** — Capture screenshots

### 8. Clickdummy

Assemble a fully navigable clickdummy from all designed sections. Wraps screen designs in the application shell with working inter-section navigation at `/clickdummy/preview`. Use this to demo to stakeholders and gather feedback before exporting.
**Output:** `src/clickdummy/ClickdummyApp.tsx`, route at `/clickdummy/preview`

### 9. Export

Generate the complete export package with all components, types, and handoff documentation.
**Output:** `product-plan/`

---

## The Design OS App: Layout and Agent Chat

The app has a left main navigation (Prototype with Vision, Roadmap, Sections, Prototype and Export; Personas; User Flows; Design System; Tech Stack; Wiki). Right of it the content splits: the agent chat on the left, the page of the current step on the right (resizable by dragging the handle, sizes remembered in localStorage under `react-resizable-panels:designos:split…`; collapsible and expandable in the header). Data Shape is a tab of Roadmap, the Shell a tab of Design System. Old routes (`/sections`, `/design`, `/clickdummy`, ...) redirect (`src/lib/navigation.ts`); all routes live in `src/lib/paths.ts` and `src/lib/routes.tsx`.

The chat is [assistant-ui](https://www.assistant-ui.com/) with the OpenCode runtime (`@assistant-ui/react-opencode`):

- `npm run dev` starts `opencode serve --port 4096` (Vite plugin, `scripts/opencode-dev.mjs`; set `DESIGNOS_NO_OPENCODE=1` to skip) and proxies `/opencode` to it, so the browser needs no CORS and never sees API keys.
- Models come from the user's `~/.config/opencode/opencode.json` (e.g. the Azure `rwe-factory-*` providers). The chat lists them via `/config/providers`; "Default" uses the server default.
- "Start with agent" on a page sends `Follow the instructions in .claude/commands/design-os/<step>.md.` plus the prompt into the chat (`buildStepMessage` in `src/lib/harness.ts`). The agent writes files in `product/`; the loaders pick them up through HMR.
- The chat remembers its OpenCode session (`designos:session` in localStorage), so a page reload (e.g. when the agent writes files and Vite reloads) reopens the conversation. "New chat" starts a fresh session. Agent questions and permissions are answered in the chat (`src/components/chat/ToolCall.tsx`); typed `/design-os:<step>` commands are expanded to the instruction to read the command file (`expandSlashCommand`).
- The chat remembers its OpenCode session (`designos:session` in localStorage), so a page reload (e.g. when the agent writes files and Vite reloads) reopens the conversation. "New chat" starts a fresh session. Agent questions and permissions are answered in the chat (`src/components/chat/ToolCall.tsx`); typed `/design-os:<step>` commands are expanded to the instruction to read the command file (`expandSlashCommand`).
- Without OpenCode the chat shows the command to start it. Pages outside a chat fall back to copy-and-paste commands.
- Chat tests run against a fake OpenCode server (`tests/helpers/fake-opencode.ts`). Component tests use jsdom (`// @vitest-environment jsdom`), model tests run in node. Smoke tests: `npm run test:e2e` (Playwright in the installed Chrome, `e2e/`) start the app on port 3100 with a fake OpenCode on 4196, so no agent or API key is needed and `product/` stays untouched. `DESIGNOS_OPENCODE_PORT` moves the proxy and the autostart to another port. Smoke tests: `npm run test:e2e` (Playwright in the installed Chrome, `e2e/`) start the app on port 3100 with a fake OpenCode on 4196, so no agent or API key is needed and `product/` stays untouched. `DESIGNOS_OPENCODE_PORT` moves the proxy and the autostart to another port.

---

## Project Brain (`wiki/`)

`wiki/` is a Karpathy-style LLM wiki and Obsidian vault: the persistent memory behind the planning flow. Read it in the Design OS app at `/wiki` (header button "Wiki"), or open the folder in Obsidian. Sources (`wiki/raw/` plus the `product/` artifacts) are compiled into domain pages (`wiki/<domain>/`). The agent maintains the wiki; the user reads it and asks questions.

- **How To**: `wiki/how-to/` ships step-by-step guides for Design OS, the tech stack, the wiki, user flows and personas. It is a system domain maintained in the repository: never compiled, never cleared by a rebuild. Keep it up to date when commands change.
- **Before asking clarifying questions** in any planning step, check `wiki/Home.md` and the relevant domain pages for prior decisions, research and feedback. Reference them in your questions instead of re-asking what is already settled.
- **Never edit wiki pages directly** from a planning command. Use the wiki commands, which keep `Home.md`, `log.md` and `_manifest.json` consistent.
- **After a planning step**, suggest `/design-os:wiki-ingest --product` to compile the new artifact, and `/design-os:wiki-capture` if the session produced decisions that are not in the artifact.

| Command | Purpose |
|---------|---------|
| `/design-os:wiki-ingest` | Compile a raw file, URL, capture, or `--product` / `--pending` sources |
| `/design-os:wiki-capture` | Save session decisions and feedback to `wiki/raw/` (or compile with `--full`) |
| `/design-os:wiki-query` | Answer from the wiki with citations |
| `/design-os:wiki-status` | Dashboard and pending sources |
| `/design-os:wiki-lint` | Health check (read-only until confirmed) |
| `/design-os:wiki-cross-link` | Insert missing `[[wikilinks]]` |
| `/design-os:wiki-taxonomy` | Audit tags and domains |
| `/design-os:wiki-rebuild` | Archive, rebuild, restore |
| `/design-os:userflow` | Design a user flow, then ingest it into `wiki/flows/` |
| `/design-os:persona` | Create or validate a persona, then ingest it into `wiki/personas/` |

### Personas and user flows as shared context

Personas and user flows are not passive documents. Every command from Sample Data onwards loads the ones that belong to its section, screen or flow through the `designos-context` skill (`.claude/skills/designos-context/SKILL.md`), which runs:

| Command | Purpose |
|---------|---------|
| `npm run context` | All personas and flows, flow coverage, all issues |
| `npm run context -- <section-id>` | Personas, flows and screens of one section |
| `npm run context -- <section-id> --screen <Name>` | Where a screen sits in its flows: steps covered, step before and after |
| `npm run context -- --flow <flow-id>` | One flow across its sections, with transitions |

- **The section spec is binding.** Flows and personas shape how something is designed, never what is in scope.
- **Relations are never invented.** A flow step is covered when its `Section / Screen` column names a screen design that exists. Missing relations are reported as missing.
- **Conflicts are shown, not resolved.** When flow, persona, spec and screens disagree, the user decides, and the file is changed by the command that owns it.
- **Coverage is computed, never stored.** The app (`/flows/<flow-id>`, `/personas/<persona-id>`, section and screen pages) and the commands use the same model in `src/lib/model/`. Tests: `npm test`.

Skills (the schema) live in `.claude/skills/designos-wiki-*`, `designos-cross-linker` and `designos-tag-taxonomy`. Every wiki page is created from a template in `wiki/_templates/`. Every diagram is Mermaid (syntax reference: the `mermaid-diagrams` skill) and must pass `npm run validate:mermaid`.

---

## File Structure

```
product/                           # Product definition (portable)
├── product-overview.md            # Product description, problems/solutions, features
├── product-roadmap.md             # List of sections with titles and descriptions
│
├── techstack/                     # Tech stack (/design-os:techstack)
│   └── techstack.md               # UI library, base, style, icons, registries, packages, patterns
│
├── data-shape/                    # Product data shape
│   └── data-shape.md              # Entity names, descriptions, and relationships
│
├── design-system/                 # Design system (colors, typography, brand identity)
│   ├── resources/                 # User-imported brand assets (logos, style guides, etc.)
│   ├── import/                    # Token import inputs: tokens.json (DTCG), DESIGN.md, skill.md
│   ├── tokens/                    # GENERATED by npm run tokens:build — do not edit
│   │   ├── tokens.css             # Tailwind v4 theme (OKLCH), :root/.dark + @theme
│   │   └── tokens.json            # Normalized token model rendered by the app
│   ├── DESIGN.md                  # GENERATED merged design guide (source of truth for product UI)
│   ├── design-system.json         # Structured design system data for agents
│   └── design-system.md           # Human-readable design system documentation
│
├── shell/                         # Application shell
│   └── spec.md                    # Shell specification
│
├── personas/                      # Personas (/design-os:persona)
│   └── [persona-id].md            # Job story, goals, thinking style, pain points, evidence
│
├── flows/                         # User flows (/design-os:userflow)
│   └── [flow-id].md               # Context, rules, Mermaid diagram, steps, edge cases, mapping
│
└── sections/
    └── [section-name]/
        ├── spec.md                # Section specification
        ├── data.json              # Sample data for screen designs
        ├── types.ts               # TypeScript interfaces
        └── *.png                  # Screenshots

src/
├── ui/                            # Product-owned UI primitives (from the tech stack; exported to product-plan/ui/)
│   ├── button.tsx
│   ├── utils.ts                   # cn() helper
│   └── ...
│
├── shell/                         # Shell design components
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── MainNav.tsx
│   │   ├── UserMenu.tsx
│   │   └── index.ts
│   └── ShellPreview.tsx
│
└── sections/
    └── [section-name]/
        ├── components/            # Exportable components
        │   ├── [Component].tsx
        │   └── index.ts
        └── [ViewName].tsx         # Preview wrapper

wiki/                              # Project brain (Karpathy LLM wiki, Obsidian vault)
├── Home.md                        # Vault index: domains + recent updates
├── log.md                         # Append-only activity log
├── _manifest.json                 # Ingestion history (sources → pages, product/ hashes)
├── _meta/taxonomy.md              # Canonical domains and tags
├── _archives/                     # Snapshots from /design-os:wiki-rebuild
├── _templates/                    # Page templates (page, flow, persona, domain-home, raw-source, capture)
├── how-to/                        # Shipped step-by-step guides (system domain, maintained in the repo)
├── raw/                           # Immutable sources + session captures
└── [domain]/                      # Compiled pages (product, techstack, data, design-system, ...)

product-plan/                      # Export package (generated)
├── README.md                      # Quick start guide
├── product-overview.md            # Product summary
├── techstack.md                   # Tech stack decisions (copied from product/techstack/techstack.md)
├── design-system.md               # Design system documentation (colors, fonts, brand identity)
├── prompts/                       # Ready-to-use prompts for coding agents
│   ├── one-shot-prompt.md         # Prompt for full implementation
│   └── section-prompt.md          # Prompt template for incremental
├── instructions/                  # Implementation instructions
│   ├── one-shot-instructions.md   # All milestones combined
│   └── incremental/               # Milestone-by-milestone instructions
│       ├── 01-shell.md
│       └── [NN]-[section-id].md   # Section-specific instructions
├── design-system/                 # Tokens, colors, fonts
├── ui/                            # Product UI primitives (copied from src/ui/, tokens mapped to semantic utilities)
├── data-shapes/                   # UI data contracts (types components expect)
├── shell/                         # Shell components
└── sections/                      # Section components (with tests.md each)
```

---

## Design Requirements

When creating screen designs, follow these guidelines:

- **Mobile Responsive**: Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) to ensure layouts adapt properly across screen sizes.

- **Light & Dark Mode**: Use `dark:` variants for all colors. Test that all UI elements are visible and readable in both modes.

- **Use Design Tokens**: When design tokens are defined, apply the product's color palette and typography. Otherwise, fall back to `stone` for neutrals and `lime` for accents.

- **Follow the Tech Stack**: The UI library and the icon set come from `product/techstack/techstack.md` (run `npm run techstack`). Without it the defaults apply: shadcn/ui and lucide-react. UI primitives are imported from `src/ui/`, never from `@/components/*`. An area the stack leaves undecided gets no extra dependency.

- **Props-Based Components**: All screen design components must accept data and callbacks via props. Never import data directly in exportable components.

- **No Navigation in Section Screen Designs**: Section screen designs should not include navigation chrome. The shell handles all navigation.

---

## Tailwind CSS Directives

These rules apply to both the Design OS application and all screen designs/components it generates:

- **Tailwind CSS v4**: We always use Tailwind CSS v4 (not v3). Do not reference or create v3 patterns.

- **No tailwind.config.js**: Tailwind CSS v4 does not use a `tailwind.config.js` file. Never reference, create, or modify one.

- **Use Built-in Utility Classes**: Avoid writing custom CSS. Stick to using Tailwind's built-in utility classes for all styling.

- **Use Built-in Colors**: Avoid defining custom colors. Use Tailwind's built-in color utility classes (e.g., `stone-500`, `lime-400`, `red-600`).

---

## The Four Pillars

Design OS is organized around four main areas:

1. **Product Overview** — The "what" and "why"
   - Product name and description
   - Problems and solutions
   - Key features
   - Sections/roadmap

2. **Data Shape** — The "nouns" of the system
   - Core entity names and descriptions
   - Conceptual relationships between entities
   - Shared vocabulary for consistent naming across sections

3. **Design System** — The "look and feel"
   - Color palette (Tailwind colors)
   - Typography (Google Fonts)
   - Brand personality and voice (optional)
   - UI style preferences (optional)
   - The tech stack (UI library, icons, packages) decides which primitives the design is built from; it is a recorded decision, not a fifth pillar

4. **Application Shell** — The persistent chrome
   - Global navigation structure
   - User menu
   - Layout pattern

Plus **Sections** — The individual features, each with spec, data, screen designs.

---

## Design System Scope

Design OS separates concerns between its own UI and the product being designed:

- **Design OS UI**: The app chrome uses the Volta palette (`src/app-theme.css`) and Inter; page content inside the step panel follows the same look
- **Product Screen Designs**: Use the design tokens defined for the product (when available)
- **Shell**: Uses product design tokens to preview the full app experience

### Token separation (enforced by `npm run test:tokens`)

Design OS tokens and product tokens never mix:

| | Design OS app (`src/components`, `src/lib`, `src/index.css`) | Product (`src/sections`, `src/shell`, `src/ui`, `src/clickdummy`, `product-plan/`) |
|---|---|---|
| Theme | Own theme in `src/index.css` (shadcn `--primary`, `--muted`, ...) plus the Volta app-chrome palette in `src/app-theme.css` | Product tokens from `product/design-system/DESIGN.md` |
| Product tokens | Read as **data** only via `src/lib/design-tokens-loader.ts` and rendered with inline values on the Design page | Applied as CSS (`tokens.css`) **only in the exported codebase** |
| Forbidden | Loading `product/design-system/tokens/tokens.css`; reading product token files outside the loader | Importing `@/components/*` (Design OS UI incl. shadcn ui) or the token loaders (product UI primitives come from `src/ui/`, never from `@/components/*`); global CSS imports; Design OS semantic utilities (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-card`, ...) — inside Design OS they resolve to the Design OS theme |

`src/ui/` is the product's own UI layer (button, dialog, ...), ported from the library in the tech stack with palette steps instead of semantic utilities. Screen designs, the shell and the clickdummy import primitives only from there. They use the palette steps, radius, shadow and type scale listed in DESIGN.md (e.g. `teal-600`, `rounded-md`) and mark semantic roles with a comment (`{/* token: primary */}`); the export maps them to `bg-primary` with `tokens.css`.

---

## Export & Handoff

The `@11-export-product` agent generates a UI design handoff package:

- **Ready-to-use prompts**: Pre-written prompts to copy/paste into coding agents
  - `one-shot-prompt.md`: For full implementation in one session
  - `section-prompt.md`: Template for section-by-section implementation
- **Implementation instructions**: UI-focused guides for each milestone
  - `product-overview.md`: Always provide for context
  - `one-shot-instructions.md`: All milestones combined
  - Incremental instructions in `instructions/incremental/`
- **Test specs**: Each section includes `tests.md` with UI behavior specs
- **Portable components**: Props-based, ready for any React setup
- **Tech stack and UI layer**: `techstack.md` (decisions, registries, packages) and `ui/` (the product UI primitives from `src/ui/`) sit next to the components. The prompts' "My tech stack" section is pre-filled from the stack and only asks about areas that are still undecided.
- **Data shapes**: TypeScript interfaces defining what data the components expect

The handoff focuses on UI designs, product requirements, and user flows. Backend architecture, data modeling, and business logic decisions are left to the implementation agent. The prompts guide the agent to confirm the pre-filled tech stack, ask about anything still undecided, and clarify requirements before building.

---

## Design System (Design OS Application)

The Design OS application has two layers:

- **App chrome** (left navigation, chat, step panel): Linear-style layout copied from the reference app (`software-factory`). Volta palette from `src/app-theme.css` (`rwe-*`, `brand-blue`, `energy-green`), Inter, dark by default, sidebar 238px with 30px rows, content inset panel with `rounded-lg` and a 1px border. The shell sets its own `dark` or `light` scope.
- **Page content** inside the step panel uses the same Volta look (guarded by `tests/volta-content.test.ts`): dark mode on `rwe-neutral`, accents `brand-blue` (light) and `energy-green` (dark), the shadcn variables in `src/index.css` map to the Volta palette. Light mode may keep `stone` for borders and muted text, as the reference app does.
- **Typography**: Inter for headings and body, IBM Plex Mono for code
- **Layout**: Content fills the step panel; wide pages use the expanded panel mode
- **Cards**: Minimal borders (1px), subtle shadows, generous padding
- **Motion**: Subtle fade-ins (200ms), no bouncy animations
