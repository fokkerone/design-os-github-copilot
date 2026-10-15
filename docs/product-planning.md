# Product Planning

The first phase of Design OS establishes the foundation for your product. Complete these steps before designing any screens.

## 1. Product Vision (`@00-product-vision`)

Define your product's core identity. The agent will ask you about:

- **Product name** — A clear, memorable name
- **Description** — 1-3 sentences capturing the essence
- **Problems & solutions** — What pain points you're addressing and how
- **Key features** — The main capabilities that make this possible

Share any notes, ideas, or rough thoughts you have about what you're building. The agent will ask clarifying questions through interactive multiple-choice prompts, then generate the overview once you've confirmed direction.

**Creates:** `product/product-overview.md`

## 2. Tech Stack (`@01-techstack`)

Decide what the prototype is built with. The agent runs an interactive session and asks only about what your product needs:

- **Target codebase** — Greenfield or existing, and the framework the export is integrated into (e.g., Next.js, Vite + React)
- **UI library** — shadcn/ui is the default; alternatives are headless primitives, another component library, or none. With shadcn/ui you also pick the component base (Radix UI or Base UI) and the UI style
- **Icons** — `lucide-react` by default
- **Registries, reference repositories and packages** — Where components come from (official or community shadcn registries, GitHub repositories to copy patterns from) and any extra packages
- **App patterns** — Forms, validation, data fetching, state, tables, charts, animation, routing, i18n
- **Tooling** — Package manager, testing, linting, accessibility level, browser support

The prototype runtime (React 19 + Vite, TypeScript strict, Tailwind CSS v4) is fixed and never asked. Before saving, the agent runs a compatibility check (library against Tailwind and the tokens, target against prototype, base mismatch, dependency weight) and shows what could go wrong.

This step is recommended, not blocking. If you skip it, the defaults apply: shadcn/ui and `lucide-react`. Nothing is installed in this step; the first design step that needs a package asks you first.

**How later steps follow it:**

- Each step runs `npm run techstack` before its first question and tells you which stack applies.
- UI primitives (button, dialog, ...) live in the product UI layer `src/ui/` and are imported only from there, never from `@/components/*` (that is the Design OS UI). With shadcn/ui, components are ported into `src/ui/` with `npx shadcn@latest view`, never with `add`.
- **Undecided means no dependency** — an area you did not decide is built with React, TypeScript and Tailwind. A package that is neither in the stack nor in its Packages table is not added.
- **Conflicts are shown, not resolved** — if a request needs something the stack does not have, the agent names the area and points you to `/design-os:techstack update`.
- The export copies the stack to `product-plan/techstack.md` and `src/ui/` to `product-plan/ui/`.

**Creates:** `product/techstack/techstack.md` (also compiled into `wiki/techstack/techstack.md`)

## 3. Product Roadmap (`@02-product-roadmap`)

Define the main sections (features/areas) of your product. The agent will ask you about:

- **Section names** — Clear, descriptive titles for each area
- **Section descriptions** — What each section covers
- **Priority order** — Which sections to build first

The agent reviews your product overview for context and asks clarifying questions before generating the roadmap.

**Creates:** `product/product-roadmap.md`

## 4. Data Shape (`@03-data-shape`)

Sketch out the core entities ("nouns") and their relationships. The agent will ask you about:

- **Entity names** — The core things users interact with
- **Descriptions** — What each entity represents
- **Relationships** — How entities connect to each other

The agent reviews your product overview and roadmap for context and asks clarifying questions before generating the data shape.

**Creates:** `product/data-shape/data-shape.md`

## 5. Design System (`@04-design-system`)

Define your visual identity and brand personality:

### Brand Resources (Optional)

Place existing brand assets in `product/design-system/resources/`:

- Logos (SVG, PNG)
- Style guides (PDF, images)
- Screenshot examples

The agent will analyze these to extract colors, fonts, and brand characteristics.

### Colors

Select from Tailwind's built-in color palette:

- **Primary** — Main accent for buttons, links, key actions (e.g., `blue`, `indigo`, `emerald`, `lime`)
- **Secondary** — Complementary accent for tags, highlights (e.g., `violet`, `amber`, `teal`)
- **Neutral** — Backgrounds, text, borders (e.g., `slate`, `gray`, `zinc`, `stone`)

### Typography

Select from Google Fonts:

- **Heading** — For titles and section headers (e.g., `DM Sans`, `Inter`, `Space Grotesk`)
- **Body** — For paragraphs and UI text (e.g., `Inter`, `Source Sans 3`, `Nunito Sans`)
- **Mono** — For code and technical content (e.g., `JetBrains Mono`, `Fira Code`)

### Brand Identity (Optional)

- **Personality** — Brand adjectives (e.g., "professional", "playful", "minimalist")
- **Voice** — Tone for UI copy (e.g., "friendly", "formal", "technical")
- **UI Style** — Component preferences (border radius, shadows, density)

**Creates:** `product/design-system/design-system.json`, `product/design-system/design-system.md`

The agent will suggest options based on your product type and help you find a combination that fits.

**Creates:** `product/design-system/colors.json`, `product/design-system/typography.json`

## 6. Application Shell (`@05-design-shell`)

Design the persistent navigation and layout that wraps all your sections. Choose from common patterns:

- **Sidebar Navigation** — Vertical nav on the left, content on the right. Best for dashboard-style tools, admin panels, apps with many sections.
- **Top Navigation** — Horizontal nav at top, content below. Best for simpler apps, marketing-style products, fewer sections.
- **Minimal Header** — Just logo + user menu. Best for single-purpose tools, wizard-style flows.

You'll also define:

- User menu placement and contents
- Responsive behavior (how it adapts on mobile)
- Any additional nav items (Settings, Help, etc.)

The shell is implemented as React components that will wrap your section screen designs. It is built from the `src/ui/` primitives and the icon set of your tech stack.

**Creates:**

- `product/shell/spec.md` — Shell specification
- `src/shell/components/AppShell.tsx` — Main shell wrapper
- `src/shell/components/MainNav.tsx` — Navigation component
- `src/shell/components/UserMenu.tsx` — User menu component
- `src/shell/ShellPreview.tsx` — Preview wrapper for Design OS

## What's Next

With the foundation established, you're ready to design individual sections. See [Designing Sections](design-section.md) for the next steps.
