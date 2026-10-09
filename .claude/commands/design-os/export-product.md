# Export Product

You are helping the user export their complete product design as a handoff package for implementation. This generates all files needed to integrate the UI designs into a real codebase.

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

If required files are missing:

"To export your product, you need at minimum:
- A product overview (`/product-vision`)
- A roadmap with sections (`/product-roadmap`)
- At least one section with screen designs

Please complete these first."

Stop here if required files are missing.

If recommended files are missing, show warnings but continue.

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

## Step 3: Create Export Directory Structure

Create the `product-plan/` directory with this structure:

```
product-plan/
├── README.md
├── product-overview.md
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

If `product/design-system/design-system.md` exists, copy it to `product-plan/design-system.md`.

The design system documentation provides implementers with:
- Color palette and typography choices
- Brand voice and tone guidelines (if defined)
- UI style preferences (border radius, shadows, density)
- Brand personality context (if defined)

This helps maintain design consistency during implementation.

## Step 5: Generate Milestone Instructions

Each milestone instruction file should begin with this preamble:

```markdown
---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

---
```

### 01-shell.md

Place in `product-plan/instructions/incremental/01-shell.md`. Cover:
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

### Section Components

For each section, copy from `src/sections/[section-id]/components/` to `product-plan/sections/[section-id]/components/`:
- Transform import paths: `@/../product/sections/[section-id]/types` → `../types`
- Remove Design OS-specific imports
- Keep only the exportable components (not preview wrappers)

### Types Files

Copy `product/sections/[section-id]/types.ts` to `product-plan/sections/[section-id]/types.ts`

### Sample Data

Copy `product/sections/[section-id]/data.json` to `product-plan/sections/[section-id]/sample-data.json`

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
- **@product-plan/design-system/** — Color and typography tokens
- **@product-plan/data-shapes/** — UI data contracts
- **@product-plan/shell/** — Application shell components
- **@product-plan/sections/** — All section components, types, sample data, and test specs

## Before You Begin

Review all the provided files, then ask me clarifying questions about:

1. **My tech stack** — What framework, language, and tools I'm using
2. **Authentication & users** — How users should sign up, log in, and what permissions exist
3. **Product requirements** — Anything in the specs or user flows that needs clarification
4. **Anything else** — Whatever you need to know before implementing

Lastly, ask me if I have any additional notes for this implementation.

Once I answer your questions, create a comprehensive implementation plan before coding.
```

### prompts/section-prompt.md

Template prompt with `SECTION_NAME`, `SECTION_ID`, and `NN` variables for incremental section-by-section implementation.

## Step 13: Generate README.md

Create `product-plan/README.md` with:
- What's included (prompts, instructions, design assets)
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

Let the user know what was generated, listing all prompt files, instruction files, design assets, and section packages. Mention restarting the dev server to access the Export page for downloading `product-plan.zip`.

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
- Components are portable — they work with any React setup
