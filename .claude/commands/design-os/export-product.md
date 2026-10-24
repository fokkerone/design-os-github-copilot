# Export Product

You are helping the user export their complete product design as a handoff package for implementation. This generates all files needed to integrate the UI designs into a real codebase.

**Important:** Ask every question with the `AskUserQuestion` tool (structured multiple choice), never as plain prose: 2–4 options, your recommendation first with the suffix `(Recommended)`, `multiSelect: true` for non-exclusive choices, up to 4 independent questions per call, no own "Other" option (it is added automatically), short labels.

## Step 1: Check Prerequisites

Verify the minimum requirements exist:

**Required:**
- `product/product-overview.md` — Product overview
- `product/product-roadmap.md` — Sections defined
- At least one section with screen designs in `src/sections/[section-id]/`

**Recommended (show warning if missing):**
- `product/data-shape/data-shape.md` — Product entities
- `product/design-system/design-system.json` — Design system
- `src/shell/components/AppShell.tsx` — Application shell
- `product/techstack/techstack.md` — Tech stack (without it the defaults apply: shadcn/ui, lucide-react)

If required files are missing:

"To export your product, you need at minimum:
- A product overview (`/design-os:product-vision`)
- A roadmap with sections (`/design-os:product-roadmap`)
- At least one section with screen designs

Please complete these first."

Stop here if required files are missing.

If recommended files are missing, show warnings but continue.

## Step 1b: Load the Tech Stack

Run `npm run -s techstack` and follow the `designos-techstack` skill, section "Applying the stack" (`.claude/skills/designos-techstack/SKILL.md`). Tell the user in one line which stack applies: the file `product/techstack/techstack.md`, or "defaults: shadcn/ui, lucide-react".

- The decisions are binding. An undecided area means no new dependency, and the export lists it as undecided instead of choosing.
- A request the stack cannot serve is a conflict. Show it to the user, name the area, and offer `/design-os:techstack update`. Never pick a side silently.
- Never edit `product/techstack/techstack.md` from this step. The export copies it unchanged.

## Step 2: Gather Export Information

Read all relevant files:
1. `product/product-overview.md` — Product name, description, features
2. `product/product-roadmap.md` — List of sections in order
3. `product/data-shape/data-shape.md` (if exists)
4. `product/design-system/design-system.md` (if exists) — Design system documentation
5. `product/design-system/design-system.json` (if exists)
6. `product/shell/spec.md` (if exists)
7. For each section: `spec.md`, `data.json`, `types.ts`
8. List screen design components in `src/sections/` and `src/shell/`
9. `product/techstack/techstack.md` (if exists) — UI library, base, style, icons, registries, packages, target framework, undecided areas. Otherwise use the output of `npm run -s techstack` (the defaults)
10. The primitives in `src/ui/` (if exists) — the product UI layer that shell and screens import

## Step 3: Create Export Directory Structure

Create the `product-plan/` directory with this structure:

```
product-plan/
├── README.md
├── product-overview.md
├── techstack.md (if product/techstack/techstack.md exists)
├── design-system.md (if exists)
├── prompts/
│   ├── one-shot-prompt.md
│   └── section-prompt.md
├── instructions/
│   ├── one-shot-instructions.md
│   └── incremental/
│       ├── 01-shell.md
│       └── [NN]-[section-id].md
├── design-system/
│   ├── tokens.css
│   ├── tailwind-colors.md
│   └── fonts.md
├── data-shapes/
│   ├── README.md
│   └── overview.ts
├── ui/ (copy of src/ui/, if exists)
│   ├── utils.ts
│   └── [primitive].tsx
├── flows/ (if product/flows/ exists)
│   ├── README.md
│   └── [flow-id].md
├── personas/ (if product/personas/ exists)
│   ├── README.md
│   └── [persona-id].md
├── shell/
│   ├── README.md
│   ├── components/
│   └── screenshot.png (if exists)
└── sections/
    └── [section-id]/
        ├── README.md
        ├── tests.md
        ├── components/
        ├── types.ts
        ├── sample-data.json
        └── screenshot.png (if exists)
```

## Step 4: Generate product-overview.md

Create `product-plan/product-overview.md` with: product name, summary, personas (if `product/personas/` exists: one line per persona with name, archetype and job story, primary first), planned sections list, product entities, design system info, and implementation sequence (milestones starting with Shell, then each section).

## Step 4b: Copy Design System Documentation (if exists)

If `product/design-system/tokens/tokens.css` exists (imported design tokens), first run `npm run tokens:check` (stop and ask the user to run `npm run tokens:build` if it fails), then copy:

- `product/design-system/DESIGN.md` → `product-plan/design-system/DESIGN.md`
- `product/design-system/tokens/tokens.css` → `product-plan/design-system/tokens.css`
- `product/design-system/tokens/tokens.json` → `product-plan/design-system/tokens.json`

and tell the implementation agent to `@import "./tokens.css"` after `@import "tailwindcss"` and to use the semantic utilities (`bg-primary`, `text-muted-foreground`, …) from DESIGN.md.

If `product/design-system/design-system.md` exists, copy it to `product-plan/design-system.md`.

The design system documentation provides implementers with:
- Color palette and typography choices
- Brand voice and tone guidelines (if defined)
- UI style preferences (border radius, shadows, density)
- Brand personality context (if defined)

This helps maintain design consistency during implementation.

## Step 4c: Copy the Tech Stack

If `product/techstack/techstack.md` exists, copy it unchanged to `product-plan/techstack.md`. If it does not exist, create `product-plan/techstack.md` from the defaults printed by `npm run -s techstack` and mark every row as `default`, so the prompts can be pre-filled either way.

From this file the README, the milestone instructions and the prompts take: the UI library, base and style, the icon set, the registries and reference repositories, the packages (with purpose and area), the constraints and open questions, the `target-framework` and `routing` decisions, and the list of undecided areas.

## Step 5: Generate Milestone Instructions

Each milestone instruction file should begin with this preamble:

```markdown
---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- The product UI primitives the components are built from (`ui/`) and the tech stack decisions (`techstack.md`)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

**Tech stack:** The components are built with [UI library] ([base], style [style]) and [icon set], and target [target framework, or "a target framework that is not decided yet"]. See `techstack.md` for the full decisions, registries and packages. If your codebase already has its own components (buttons, dialogs, inputs, ...), use those and treat `ui/` as a reference for how the designs use them; otherwise copy `ui/` into your project.

---
```

Fill the bracketed values from `product-plan/techstack.md` when you write the preamble.

### 01-shell.md

Place in `product-plan/instructions/incremental/01-shell.md`. Cover:
- Setting up the tech stack: install the packages listed in `techstack.md`, add the registries, copy `ui/` (or map it to the target codebase's own components)
- Setting up design tokens (CSS custom properties, Tailwind colors, Google Fonts)
- Implementing the application shell (copy components, wire up navigation, user menu)
- Responsive behavior
- Done-when checklist

### [NN]-[section-id].md (for each section, starting at 02)

Place in `product-plan/instructions/incremental/[NN]-[section-id].md`. Each should cover:
- Goal and overview (what users can do)
- Key functionality bullet points (3-6 capabilities)
- Components provided (list with descriptions)
- Props reference (data props and callback props table)
- UI primitives and packages the section needs (from `ui/` and `techstack.md`), and the routing decision for its navigation callbacks
- Expected user flows (2-4 flows with numbered steps and expected outcomes)
- Empty state handling
- Testing reference to `tests.md`
- Files to reference list
- Done-when checklist

## Step 6: Generate one-shot-instructions.md

Create `product-plan/instructions/one-shot-instructions.md` by combining all milestone content into a single document with the preamble at top, then each milestone as a section separated by `---`.

## Step 7: Copy and Transform Components

### Shell Components

Copy from `src/shell/components/` to `product-plan/shell/components/`:
- Transform import paths from `@/...` to relative paths
- Remove any Design OS-specific imports
- Ensure components are self-contained

### UI Primitives

If `src/ui/` exists, copy it to `product-plan/ui/` (`utils.ts` and every primitive):
- Keep the relative imports: `../../ui/...` from shell components and `../../../ui/...` from section components resolve the same way in `product-plan/`
- Map token classes back to semantic utilities using `tokens.css` and the `// token: <name>` comments: palette steps (`bg-teal-600` with `// token: primary` → `bg-primary`, `text-zinc-500` with `// token: muted-foreground` → `text-muted-foreground`) and exact values (`bg-[oklch(65.03%_0.11008_192.46)] dark:bg-[oklch(80.08%_0.13033_181.21)]` with `token: primary` → `bg-primary`, drop the `dark:` pair since `.dark` switches it; `rounded-[0.25rem]` with `token: radius-md` → `rounded-md`), and so on, as for the shell and section components. Run `npm run tokens:check` first, as in Step 4b. Without `tokens.css`, keep the palette steps
- Remove Design OS-specific imports. Nothing may import `@/components/*`
- Do not copy `src/components/ui/`: that is Design OS UI, not the product's

Mention in `product-plan/README.md` that `ui/` is the product UI layer and a reference when the target codebase has its own components.

### Section Components

For each section, copy from `src/sections/[section-id]/components/` to `product-plan/sections/[section-id]/components/`:
- Transform import paths: `@/../product/sections/[section-id]/types` → `../types`
- Remove Design OS-specific imports
- Keep only the exportable components (not preview wrappers)

### Types Files

Copy `product/sections/[section-id]/types.ts` to `product-plan/sections/[section-id]/types.ts`

### Sample Data

Copy `product/sections/[section-id]/data.json` to `product-plan/sections/[section-id]/design-os:sample-data.json`

## Step 8: Generate Section READMEs

For each section, create `product-plan/sections/[section-id]/README.md` with: overview, user flows (for bullets ending in `(flow: [flow-id])`, link `../../flows/[flow-id].md` and include its Mermaid diagram), personas (for bullets ending in `(persona: [persona-id])`, link `../../personas/[persona-id].md` with the job story and design implications), design decisions, data shapes, visual reference note, components list, and callback props table.

## Step 9: Generate Section Test Instructions

For each section, create `product-plan/sections/[section-id]/tests.md` with framework-agnostic UI behavior test specs:

- **User Flow Tests** — For each flow: success path (setup, steps, expected results) and failure paths (validation errors, server errors)
- **Empty State Tests** — Primary empty state, related records empty state
- **Component Interaction Tests** — Renders correctly checks, user interaction checks
- **Edge Cases** — Long names, many items, transitions between empty/populated
- **Accessibility Checks** — Keyboard access, labels, screen readers, focus management
- **Sample Test Data** — TypeScript mock objects for populated and empty states

Be specific about UI text, labels, and expected messages in all assertions.

## Step 10: Generate Design System Files

### tokens.css

CSS custom properties for colors and typography.

### tailwind-colors.md

Color choices documentation with usage examples for primary, secondary, and neutral.

### fonts.md

Google Fonts import snippet and font usage guide.

## Step 11: Generate Data Shapes Files

### data-shapes/README.md

List all entities across sections with descriptions and which sections use them.

### data-shapes/overview.ts

Aggregate all section entity types (data interfaces only, not Props) into one reference file with section-based grouping.

## Step 12: Generate Prompt Files

### prompts/one-shot-prompt.md

```markdown
# One-Shot Implementation Prompt

I need you to implement a complete web application based on detailed UI designs and product specifications I'm providing.

## Instructions

Please carefully read and analyze the following files:

1. **@product-plan/product-overview.md** — Product summary with sections and entity overview
2. **@product-plan/instructions/one-shot-instructions.md** — Complete implementation instructions for all milestones

After reading these, also review:
- **@product-plan/techstack.md** — Tech stack decisions (UI library, icons, registries, packages, target framework)
- **@product-plan/design-system/** — Color and typography tokens
- **@product-plan/ui/** — Product UI primitives the components are built from
- **@product-plan/data-shapes/** — UI data contracts
- **@product-plan/shell/** — Application shell components
- **@product-plan/sections/** — All section components, types, sample data, and test specs

## Before You Begin

Review all the provided files, then ask me clarifying questions about:

1. **My tech stack** — [PRE-FILLED from product-plan/techstack.md: "The designs are built with <UI library> (<base>, style <style>) and <icon set>. Registries: <...>. Packages: <...>. Target framework: <...>. I have already decided these." Then ask only about what is undecided or open: <list the undecided areas, for example target framework, package manager, state, data fetching>. If my codebase already has its own components, use those and treat `ui/` as a reference.]
2. **Authentication & users** — How users should sign up, log in, and what permissions exist
3. **Product requirements** — Anything in the specs or user flows that needs clarification
4. **Anything else** — Whatever you need to know before implementing

Lastly, ask me if I have any additional notes for this implementation.

Once I answer your questions, create a comprehensive implementation plan before coding.
```

Write item 1 of "Before You Begin" with the real values from `product-plan/techstack.md`, not the bracketed placeholder: state what is decided, and ask only about areas that are undecided (for example `target-framework`, `package-manager`, `state`, `data-fetching`) or listed under Open Questions. If nothing is undecided, say so and ask only for corrections.

### prompts/section-prompt.md

Template prompt with `SECTION_NAME`, `SECTION_ID`, and `NN` variables for incremental section-by-section implementation. Its "Before You Begin" item "1. **My tech stack**" is pre-filled from `product-plan/techstack.md` in the same way as in the one-shot prompt (decided areas stated, only undecided areas asked), and the prompt lists `@product-plan/techstack.md` and `@product-plan/ui/` among the files to read.

## Step 13: Generate README.md

Create `product-plan/README.md` with:
- What's included (prompts, instructions, design assets, `techstack.md`, `ui/`)
- Tech stack: UI library, base, style and icon set, the registries and reference repositories, the packages to install (name, purpose), the target framework, and the areas that are still undecided. State that `ui/` is the product UI layer and that an existing codebase's own components take precedence, with `ui/` as reference
- Option A: Incremental (recommended) — step-by-step guide
- Option B: One-shot — single session guide
- Testing guidance
- Tips for using prompts and components

Footer: _Generated by Design OS_

## Step 14: Copy Screenshots

Copy any `.png` files from:
- `product/shell/` → `product-plan/shell/`
- `product/sections/[section-id]/` → `product-plan/sections/[section-id]/`

## Step 14b: Copy User Flows (if exist)

If `product/flows/` contains `.md` files, copy each one unchanged to `product-plan/flows/[flow-id].md`. Then create `product-plan/flows/README.md` with a table listing each flow (title, status, sections, step count, edge-case count) and a note that every flow contains a Mermaid diagram, a step table, rules, and edge cases. These serve as acceptance criteria for implementation.

Run `npm run -s context` (see the `designos-context` skill, `.claude/skills/designos-context/SKILL.md`) and add to `product-plan/flows/README.md`, per flow: the coverage ("4 of 6 steps have a screen design"), a table of steps with the screen design that covers each one, and the steps that have none. State plainly that steps without a screen design are **not designed**: the implementation team must not assume a design exists for them. List the report's conflicts under "Open points" instead of resolving them.

In `tests.md` for a section with linked flows, add one test group per linked flow covering its happy path and each edge case (E1…En).

## Step 14c: Copy Personas (if exist)

If `product/personas/` contains `.md` files, copy each one unchanged to `product-plan/personas/[persona-id].md`. Then create `product-plan/personas/README.md` with a table listing each persona (name, archetype, priority, kind, confidence, linked sections and flows), primary personas first, and this note: personas of kind `proto` are assumptions, not research; the implementation team should treat their Assumptions & Evidence table as open questions, not requirements. Each persona's Design Implications and Accessibility & Inclusion sections are design constraints for implementation.

In the one-shot and section prompts, point to `personas/README.md` as context for who the UI is for.

## Step 15: Create Zip File

After generating all the export files, create a zip archive:

```bash
rm -f product-plan.zip
cd . && zip -r product-plan.zip product-plan/
```

## Step 16: Confirm Completion

Let the user know what was generated, listing all prompt files, instruction files, design assets, `techstack.md`, `ui/` (number of primitives), and section packages. Include one line with the stack that was exported ([stack line from Step 1b]), the packages and registries it lists, the `routing` decision and the areas that stay undecided (the prompts ask about those). Mention restarting the dev server to access the Export page for downloading `product-plan.zip`.

Explain how to use it:
1. Copy `product-plan/` to their implementation codebase
2. Open the appropriate prompt file
3. Add notes, copy/paste into their coding agent
4. Answer the agent's clarifying questions
5. Let the agent implement based on the instructions

## Important Notes

- Always transform import paths when copying components
- Include `product-overview.md` context with every implementation session
- Include `design-system.md` for brand consistency during implementation (if it exists)
- Use the pre-written prompts — they prompt for important clarifying questions
- Screenshots provide visual reference for fidelity checking
- Sample data files are for testing before real APIs are built
- The export is self-contained — no dependencies on Design OS
- Components are portable — they work with any React setup that provides the packages listed in `techstack.md`; they import their primitives from `ui/`
- Pre-fill "My tech stack" in the prompts from `techstack.md`; ask only about undecided areas
- Never edit `product/techstack/techstack.md` from this command
