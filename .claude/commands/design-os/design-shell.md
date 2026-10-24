# Design Shell

You are helping the user design the application shell — the persistent navigation and layout that wraps all sections. This is a screen design, not implementation code.

**Important:** Ask every question with the `AskUserQuestion` tool (structured multiple choice), never as plain prose: 2–4 options, your recommendation first with the suffix `(Recommended)`, `multiSelect: true` for non-exclusive choices, up to 4 independent questions per call, no own "Other" option (it is added automatically), short labels.

## Step 1: Check Prerequisites

First, verify prerequisites exist:

1. Read `product/product-overview.md` — Product name and description
2. Read `product/product-roadmap.md` — Sections for navigation
3. Check if `product/design-system/design-system.json` exists

If overview or roadmap are missing:

"Before designing the shell, you need to define your product and sections. Please run:
1. `/design-os:product-vision` — Define your product
2. `/design-os:product-roadmap` — Define your sections"

Stop here if overview or roadmap are missing.

If design system is missing, show a warning but continue:

"Note: Design system hasn't been defined yet. I'll proceed with default styling, but you may want to run `/design-os:design-tokens` first for consistent colors and typography."

## Step 1b: Check for Brand Identity in Design System

If `product/design-system/DESIGN.md` exists (generated from imported design tokens), it is the source of truth for colors, typography, radius and shadows — follow it and use only the token values listed there. Use token classes ("Token classes" in agents.md: `teal-600` when the token has Tailwind's value, else the exact value such as `bg-[oklch(65.03%_0.11008_192.46)]`, with `// token: primary`), never Design OS semantic utilities like `bg-primary` or imports from `@/components/` (see "Token separation" in agents.md).

Check if `product/design-system/design-system.json` exists and contains personality, voice, or uiStyle fields.

If these optional brand identity fields exist, use them to inform design decisions:

**Brand Personality** — Use adjectives and mood to suggest appropriate layout patterns:
- Professional/trustworthy → Clean sidebar with clear hierarchy
- Playful/energetic → Bold colors, rounded elements, animated transitions
- Minimal/refined → Subtle navigation, lots of whitespace
- Technical/precise → Dense information, structured layout

**Brand Voice** — Apply tone to navigation labels and UI copy suggestions:
- Friendly tone → "Your Dashboard", "Let's create something"
- Professional tone → "Dashboard", "New Project"
- Technical tone → "System Overview", "Initialize"

**UI Style Preferences** — Apply to component styling:
- Border radius preference for buttons and cards
- Shadow intensity for elevated elements
- Spacing/density for layout

When presenting shell options, reference the brand guide:

"Based on your brand guide, your product has a [personality adjectives] feel with [UI style preferences]. This suggests:
- [Layout pattern recommendation]
- [Navigation style recommendation]
- [Visual treatment recommendation]"

## Step 1c: Check for Personas and User Flows

Run `npm run -s context` (see the `designos-context` skill, `.claude/skills/designos-context/SKILL.md`). Skip this step if there are no personas and no flows.

- **Personas:** let the context of use of the primary persona (devices, environment, frequency) and its accessibility constraints inform the layout you recommend, and say so: "Ana uses her phone, one-handed, once a year, so I recommend bottom navigation with few entries."
- **Flows:** flows that cross sections show which sections users move between most. Keep those one step apart in the navigation.

These are inputs for your recommendation. The user decides.

## Step 1d: Load the Tech Stack

Run `npm run -s techstack` and follow the `designos-techstack` skill, section "Applying the stack" (`.claude/skills/designos-techstack/SKILL.md`).

- Tell the user in one line which stack applies: `product/techstack/techstack.md`, or "defaults: shadcn/ui, lucide-react".
- The decisions are binding. Undecided means no new dependency.
- A request the stack cannot serve is a conflict: show it to the user and offer `/design-os:techstack update`. Never edit `product/techstack/techstack.md` from this step.
- **This step:** build the shell from `src/ui/` primitives (the product-owned UI layer, ported per rule 3 of the skill, see Step 6) and the stack's `icons`. List the primitives you create in `product/shell/spec.md` under "UI Components".

## Step 2: Analyze Product Structure

Review the roadmap sections and present navigation options:

"I'm designing the shell for **[Product Name]**. Based on your roadmap, you have [N] sections:

1. **[Section 1]** — [Description]
2. **[Section 2]** — [Description]
3. **[Section 3]** — [Description]

Let's decide on the shell layout. Common patterns:

**A. Sidebar Navigation** — Vertical nav on the left, content on the right
Best for: Apps with many sections, dashboard-style tools, admin panels

**B. Top Navigation** — Horizontal nav at top, content below
Best for: Simpler apps, marketing-style products, fewer sections

**C. Minimal Header** — Just logo + user menu, sections accessed differently
Best for: Single-purpose tools, wizard-style flows

Which pattern fits **[Product Name]** best?"

Wait for their response.

## Step 3: Gather Design Details

Ask clarifying questions:
- "Where should the user menu (avatar, logout) appear?"
- "Do you want the sidebar collapsible on mobile, or should it become a hamburger menu?"
- "Any additional items in the navigation? (Settings, Help, etc.)"
- "What should the 'home' or default view be when the app loads?"

## Step 4: Present Shell Specification

Once you understand their preferences:

"Here's the shell design for **[Product Name]**:

**Layout Pattern:** [Sidebar/Top Nav/Minimal]

**Navigation Structure:**
- [Nav Item 1] → [Section]
- [Nav Item 2] → [Section]
- [Nav Item 3] → [Section]
- [Additional items like Settings, Help]

**User Menu:**
- Location: [Top right / Bottom of sidebar]
- Contents: Avatar, user name, logout

**Responsive Behavior:**
- Desktop: [How it looks]
- Mobile: [How it adapts]

Does this match what you had in mind?"

Iterate until approved.

## Step 5: Create the Shell Specification

Create `product/shell/spec.md`:

```markdown
# Application Shell Specification

## Overview
[Description of the shell design and its purpose]

## Navigation Structure
- [Nav Item 1] → [Section 1]
- [Nav Item 2] → [Section 2]
- [Nav Item 3] → [Section 3]
- [Any additional nav items]

## User Menu
[Description of user menu location and contents]

## Layout Pattern
[Description of the layout — sidebar, top nav, etc.]

## Responsive Behavior
- **Desktop:** [Behavior]
- **Tablet:** [Behavior]
- **Mobile:** [Behavior]

## UI Components
Primitives from `src/ui/` used by the shell:
- `src/ui/[primitive].tsx` — [Primitive name], used for [where in the shell]

## Design Notes
[Any additional design decisions or notes]
```

## Step 6: Create Shell Components

Create the shell components at `src/shell/components/`:

### AppShell.tsx
The main wrapper component that accepts children and provides the layout structure.

```tsx
interface AppShellProps {
  children: React.ReactNode;
  navigationItems: Array<{ label: string; href: string; isActive?: boolean }>;
  user?: { name: string; avatarUrl?: string };
  onNavigate?: (href: string) => void;
  onLogout?: () => void;
}
```

### MainNav.tsx
The navigation component (sidebar or top nav based on the chosen pattern).

### UserMenu.tsx
The user menu with avatar and dropdown.

### index.ts
Export all components.

### UI primitives (`src/ui/`)
The shell imports UI primitives (button, avatar, dropdown menu, sheet, ...) only from `src/ui/`, with relative imports (for example `../../ui/button`). Never import `@/components/*`. Port a primitive only when the shell needs it, and compose from what `src/ui/` already has first. For shadcn/ui (the `designos-techstack` skill, "Applying the stack", rule 3):
- Read the source with `npx shadcn@latest view @shadcn/<name>` and create `src/ui/<name>.tsx` from it. Never run `npx shadcn@latest add`.
- Imports become relative; `cn` comes from `src/ui/utils.ts`.
- Semantic utilities become token classes from `product/design-system/DESIGN.md` (with the `dark:` pair, see "Token classes" in agents.md), with the role in a comment: `// token: primary`.
- Respect the stack's `ui-base` and `ui-style`, and keep the primitives accessible.
- Ask before installing an npm package a ported file needs, and report it.
- Every primitive the shell uses (also a hand-written one) is a file in `src/ui/` with named PascalCase exports and `cva()` variants, so Design System › Components lists it. `cva()` and primitive libraries appear only in `src/ui/`. After creating or changing a component run `npm run -s ui:check` and fix every finding.

**Component Requirements:**
- Use props for all data and callbacks (portable)
- Apply design tokens if they exist (colors, fonts)
- Support light and dark mode with `dark:` variants
- Be mobile responsive
- Style with Tailwind CSS (fixed runtime), using the product's token classes
- Take icons from the stack's `icons` area (default: `lucide-react`), imported in one place per file

## Step 7: Create Shell Preview

Create `src/shell/ShellPreview.tsx` — a preview wrapper for viewing the shell in Design OS:

```tsx
import data from '@/../product/sections/[first-section]/data.json' // if exists
import { AppShell } from './components/AppShell'

export default function ShellPreview() {
  const navigationItems = [
    { label: '[Section 1]', href: '/section-1', isActive: true },
    { label: '[Section 2]', href: '/section-2' },
    { label: '[Section 3]', href: '/section-3' },
  ]

  const user = {
    name: 'Alex Morgan',
    avatarUrl: undefined,
  }

  return (
    <AppShell
      navigationItems={navigationItems}
      user={user}
      onNavigate={(href) => console.log('Navigate to:', href)}
      onLogout={() => console.log('Logout')}
    >
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Content Area</h1>
        <p className="text-stone-600 dark:text-stone-400">
          Section content will render here.
        </p>
      </div>
    </AppShell>
  )
}
```

## Step 8: Apply Design Tokens

If design tokens exist, apply them to the shell components:

**Colors:**
- Read `product/design-system/design-system.json`
- Use primary color for active nav items, key accents
- Use secondary color for hover states, subtle highlights
- Use neutral color for backgrounds, borders, text

**Typography:**
- Apply heading font to nav items and titles
- Apply body font to other text
- Include Google Fonts import in the preview

## Step 9: Confirm Completion

Let the user know:

"I've designed the application shell for **[Product Name]**:

**Created files:**
- `product/shell/spec.md` — Shell specification
- `src/shell/components/AppShell.tsx` — Main shell wrapper
- `src/shell/components/MainNav.tsx` — Navigation component
- `src/shell/components/UserMenu.tsx` — User menu component
- `src/shell/components/index.ts` — Component exports
- `src/shell/ShellPreview.tsx` — Preview wrapper
- `src/ui/[primitive].tsx` — UI primitives the shell uses (listed in the shell spec under "UI Components")

**Shell features:**
- [Layout pattern] layout
- Navigation for all [N] sections
- User menu with avatar and logout
- Mobile responsive design
- Light/dark mode support

**Important:** Restart your dev server to see the changes.

When you design section screens with `/design-os:design-screen`, they will render inside this shell, showing the full app experience.

Next: Run `/design-os:shape-section` to start designing your first section."

## Important Notes

- The shell is a screen design — it demonstrates the navigation and layout design
- Components are props-based and portable to the user's codebase
- The preview wrapper is for Design OS only — not exported
- Apply design tokens when available for consistent styling
- UI primitives live in `src/ui/` and follow the tech stack; icons come from the stack's `icons` area
- Keep the shell focused on navigation chrome — no authentication UI
- Section screen designs will render inside the shell's content area
