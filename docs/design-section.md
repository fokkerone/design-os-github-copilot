# Designing Sections

After completing [Product Planning](product-planning.md), you're ready to design individual sections. Work through each section in your roadmap, completing these steps for each one.

## 1. Shape the Section (`@06-shape-section`)

Define what the section does and how it should work. If you have multiple sections, you'll be asked which one to work on.

This is a conversational process to establish:

- **Overview** — What this section is for (2-3 sentences)
- **User flows** — The main actions and step-by-step interactions
- **UI requirements** — Specific layouts, patterns, or components needed
- **Scope boundaries** — What's intentionally excluded

Share any notes or ideas you have. The agent will ask clarifying questions about user actions, information to display, and UI patterns. Focus on experience and interface requirements—no backend or database details.

You'll also be asked whether this section should display inside the application shell (most sections do) or as a standalone page (for things like landing pages or embedded widgets).

**Creates:** `product/sections/[section-id]/spec.md`

## 2. Generate Sample Data (`@07-sample-data`)

Generate sample data and TypeScript types for the section. The agent reviews the section spec and asks clarifying questions about:

- **Entity structure** — What fields and properties each entity needs
- **Sample records** — 5-10 realistic records with varied content and edge cases
- **TypeScript types** — Data interfaces for each entity, plus a Props interface with callbacks

**Creates:**
- `product/sections/[section-id]/data.json` — Sample data with `_meta` descriptions
- `product/sections/[section-id]/types.ts` — TypeScript interfaces

Run `@07-sample-data` again any time you need to update the data structure or sample records.

## 3. Design the Screen (`@08-design-screen`)

Build the actual React components for the section. This is where the spec and sample data become a working UI.

### What Gets Created

**Exportable components** (props-based, portable):

The main component and any sub-components, all accepting data and callbacks via props. These are what get exported to your codebase.

```tsx
// Example: Components accept props, never import data directly
export function InvoiceList({
  invoices,
  onView,
  onEdit,
  onDelete,
  onCreate
}: InvoiceListProps) {
  // ...
}
```

**Preview wrapper** (for Design OS only):

A wrapper that imports the sample data and feeds it to the component, so you can see it running in Design OS.

### Design Requirements

All screen designs include:

- **Mobile responsive** — Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
- **Light & dark mode** — Using `dark:` variants
- **Design tokens applied** — Your color palette and typography choices
- **Tech stack followed** — UI primitives come from the product UI layer `src/ui/` (never `@/components/*`) and icons from your stack; missing primitives are ported into `src/ui/` and only listed packages are used
- **All spec requirements** — Every user flow and UI requirement implemented

### Multiple Views

If the spec implies multiple views (list view, detail view, form, etc.), you'll be asked which to build first. Run `@08-design-screen` again for additional views.

**Creates:**
- `src/sections/[section-id]/components/[ViewName].tsx` — Main component
- `src/sections/[section-id]/components/[SubComponent].tsx` — Sub-components as needed
- `src/sections/[section-id]/components/index.ts` — Component exports
- `src/sections/[section-id]/[ViewName].tsx` — Preview wrapper
- `src/ui/[primitive].tsx` — Any product UI primitive the screen needs that is not in `src/ui/` yet (exported to `product-plan/ui/`)

**Important:** Restart your dev server after creating screen designs to see the changes.

## 4. Capture Screenshots (Optional) (`@09-screenshot-design`)

Take screenshots of your screen designs for documentation. Screenshots are saved alongside the spec and data files.

The agent will:
1. Start the dev server automatically
2. Navigate to your screen design
3. Hide the Design OS navigation bar
4. Capture a full-page screenshot

Screenshots are useful for:
- Visual reference during implementation
- Documentation and handoff materials
- Comparing designs across sections

**Requires:** Playwright MCP server. If not installed, you'll be prompted with setup instructions.

**Creates:** `product/sections/[section-id]/[screen-name].png`

## Repeat for Each Section

Work through your roadmap sections in order. Each section builds on the foundation you established and benefits from the consistency of your global data shape, design tokens and tech stack.

## What's Next

When all sections are designed, you're ready to export. See [Export](export.md) for generating the complete handoff package.
