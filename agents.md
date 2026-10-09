# Agent Directives for Design OS

Design OS is a **product planning and design tool** that helps users define their product vision, sketch out their data shape, design their UI, and prepare export packages for implementation in a separate codebase.

> **Important**: Design OS is a planning tool, not the end product codebase. The screen designs and components generated here are meant to be exported and integrated into your actual product's codebase.

---

## Critical: Stay Focused on Your Task
## Critical: Always use style and Design template from ./Design.md every ui should follow these guidelines

**Each agent has ONE job. Do that job and nothing else.**

- Only produce the outputs described in your agent's instructions. Do not generate files or content that belong to a different agent or a later phase.
- If the user's request is ambiguous, ask a clarifying question — do not assume they want you to do more than what your agent covers.
- Never jump ahead in the planning flow. For example, the `@00-product-vision` agent must NOT create design tokens, shell specs, or section designs. It creates the product overview — that's it.
- If the user asks for something outside your scope, tell them which agent to use instead (e.g., "That's handled by the `@03-design-system` agent").
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
- Uses the Design OS design system (stone palette, DM Sans, etc.)
- Provides the interface for viewing specs, screen designs, exports, etc.

### 2. Product Design (Screen Designs & Exports)

The product you're planning and designing. When creating screen designs and exports:

- Screen design components live in `src/sections/[section-name]/` and `src/shell/`
- Product definition files live in `product/`
- Exports are packaged to `product-plan/` for integration into a separate codebase
- Follow the design requirements specified in each section's spec

---

## Getting Started — The Planning Flow

Design OS follows a structured planning sequence. Each step has a dedicated agent. Use one agent at a time — complete each step before moving to the next.

| Step | Copilot Agent | Claude Code Command |
|------|--------------|---------------------|
| 1. Product Overview | `@00-product-vision` | `/product-vision` |
| 2. Product Roadmap | `@01-product-roadmap` | `/product-roadmap` |
| 3. Data Shape | `@02-data-shape` | `/data-shape` |
| 4. Design System | `@03-design-system` | `/design-tokens` |
| 5. Application Shell | `@04-design-shell` | `/design-shell` |
| Personas (any time after step 1) | `@persona` | `/design-os:persona` |
| User Flows (any time after step 2) | `@userflow` | `/design-os:userflow` |
| 6a. Shape Section | `@05-shape-section` | `/shape-section` |
| 6b. Sample Data | `@06-sample-data` | `/sample-data` |
| 6c. Design Screen | `@07-design-screen` | `/design-screen` |
| 6d. Screenshot | `@08-screenshot-design` | `/screenshot-design` |
| 7. Clickdummy | `@09-clickdummy` | `/clickdummy` |
| 8. Export | `@10-export-product` | `/export-product` |

### 1. Product Overview

Define your product name, description, problems/solutions, and key features.
**Output:** `product/product-overview.md`

### 2. Product Roadmap

Define the main sections (features/areas) of the product.
**Output:** `product/product-roadmap.md`

### 3. Data Shape

Sketch out the core entities and their relationships.
**Output:** `product/data-shape/data-shape.md`

### 4. Design System

Define your visual identity: colors (from Tailwind), typography (from Google Fonts), and optionally brand personality, voice, and UI style preferences. You can import brand resources (logos, style guides) for analysis.
**Input (optional):** Place brand assets in `product/design-system/resources/`
**Output:** `product/design-system/design-system.json`, `product/design-system/design-system.md`

### 5. Application Shell

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

### 6. For Each Section

- **Shape Section** — Define the specification (only spec.md)
- **Sample Data** — Generate sample data and types
- **Design Screen** — Create screen designs (applies design system voice and UI style)
- **Screenshot** — Capture screenshots

### 7. Clickdummy

Assemble a fully navigable clickdummy from all designed sections. Wraps screen designs in the application shell with working inter-section navigation at `/clickdummy/preview`. Use this to demo to stakeholders and gather feedback before exporting.
**Output:** `src/clickdummy/ClickdummyApp.tsx`, route at `/clickdummy/preview`

### 8. Export

Generate the complete export package with all components, types, and handoff documentation.
**Output:** `product-plan/`

---

## Project Brain (`wiki/`)

`wiki/` is a Karpathy-style LLM wiki and Obsidian vault: the persistent memory behind the planning flow. Read it in the Design OS app at `/wiki` (header button "Wiki"), or open the folder in Obsidian. Sources (`wiki/raw/` plus the `product/` artifacts) are compiled into domain pages (`wiki/<domain>/`). The agent maintains the wiki; the user reads it and asks questions.

- **How To**: `wiki/how-to/` ships step-by-step guides for Design OS, the wiki, user flows and personas. It is a system domain maintained in the repository: never compiled, never cleared by a rebuild. Keep it up to date when commands change.
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

Skills (the schema) live in `.claude/skills/designos-wiki-*`, `designos-cross-linker` and `designos-tag-taxonomy`. Every wiki page is created from a template in `wiki/_templates/`. Every diagram is Mermaid (syntax reference: the `mermaid-diagrams` skill) and must pass `npm run validate:mermaid`.

---

## File Structure

```
product/                           # Product definition (portable)
├── product-overview.md            # Product description, problems/solutions, features
├── product-roadmap.md             # List of sections with titles and descriptions
│
├── data-shape/                    # Product data shape
│   └── data-shape.md              # Entity names, descriptions, and relationships
│
├── design-system/                 # Design system (colors, typography, brand identity)
│   ├── resources/                 # User-imported brand assets (logos, style guides, etc.)
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
└── [domain]/                      # Compiled pages (product, data, design-system, ...)

product-plan/                      # Export package (generated)
├── README.md                      # Quick start guide
├── product-overview.md            # Product summary
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

4. **Application Shell** — The persistent chrome
   - Global navigation structure
   - User menu
   - Layout pattern

Plus **Sections** — The individual features, each with spec, data, screen designs.

---

## Design System Scope

Design OS separates concerns between its own UI and the product being designed:

- **Design OS UI**: Always uses the stone/lime palette and DM Sans typography
- **Product Screen Designs**: Use the design tokens defined for the product (when available)
- **Shell**: Uses product design tokens to preview the full app experience

---

## Export & Handoff

The `@10-export-product` agent generates a UI design handoff package:

- **Ready-to-use prompts**: Pre-written prompts to copy/paste into coding agents
  - `one-shot-prompt.md`: For full implementation in one session
  - `section-prompt.md`: Template for section-by-section implementation
- **Implementation instructions**: UI-focused guides for each milestone
  - `product-overview.md`: Always provide for context
  - `one-shot-instructions.md`: All milestones combined
  - Incremental instructions in `instructions/incremental/`
- **Test specs**: Each section includes `tests.md` with UI behavior specs
- **Portable components**: Props-based, ready for any React setup
- **Data shapes**: TypeScript interfaces defining what data the components expect

The handoff focuses on UI designs, product requirements, and user flows. Backend architecture, data modeling, and business logic decisions are left to the implementation agent. The prompts guide the agent to ask clarifying questions about tech stack and requirements before building.

---

## Design System (Design OS Application)

The Design OS application itself uses a "Refined Utility" aesthetic:

- **Typography**: DM Sans for headings and body, IBM Plex Mono for code
- **Colors**: Stone palette for neutrals (warm grays), lime for accents
- **Layout**: Maximum 800px content width, generous whitespace
- **Cards**: Minimal borders (1px), subtle shadows, generous padding
- **Motion**: Subtle fade-ins (200ms), no bouncy animations
