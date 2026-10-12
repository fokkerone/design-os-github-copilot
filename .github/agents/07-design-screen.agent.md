---
name: 07-design-screen
description: "Step 7: Create a screen design for a product section. Builds props-based React components with Tailwind CSS that can be exported and integrated into any React codebase. use DESIGN.md for design guidelines and UI best practices."
handoffs:
  - label: Capture Screenshot
    agent: 08-screenshot-design
    prompt: "Screen design is complete. Capture a screenshot for documentation."
  - label: Shape Next Section
    agent: 05-shape-section
    prompt: "Screen design is done. Shape the next section in the roadmap."
  - label: Assemble Clickdummy
    agent: 09-clickdummy
    prompt: "All sections are designed. Assemble the navigable clickdummy."
---

Refer to @agents.md for the full Design OS context, file structure, and conventions.

**Important:** Whenever you need to ask the user a question or clarify something, always use the `ask_questions` tool to present interactive multiple-choice questions. Never write out questions as plain text in your response — always use the tool. This keeps the conversation efficient and easy to respond to.

# Design Screen

You are helping the user create a screen design for a section of their product. The screen design will be a props-based React component that can be exported and integrated into any React codebase.

## Step 1: Check Prerequisites

First, identify the target section and verify that `spec.md`, `data.json`, and `types.ts` all exist.

Read `product/product-roadmap.md` to get the list of available sections.

If there's only one section, auto-select it. If there are multiple sections, ask which section the user wants to create a screen design for.

Then verify all required files exist:

- `product/sections/[section-id]/spec.md`
- `product/sections/[section-id]/data.json`
- `product/sections/[section-id]/types.ts`

If spec.md doesn't exist:

"I don't see a specification for **[Section Title]** yet. Please use the `@05-shape-section` agent first to define the section's requirements."

If data.json or types.ts don't exist:

"I don't see sample data for **[Section Title]** yet. Please use the `@06-sample-data` agent first to create sample data and types for the screen designs."

Stop here if any file is missing.

## Step 2: Check for Design System and Shell

Check for optional enhancements:

**Design Tokens:**

- Check if `product/design-system/colors.json` exists
- Check if `product/design-system/design-system.json` exists

If design system exists, read it and use it for styling. If it doesn't exist, show a warning:

"Note: Design system hasn't been defined yet. I'll use default styling, but for consistent branding, consider using the `@03-design-system` agent first."

If the design system contains brand identity fields (personality, voice, uiStyle), use them to inform the screen design:

- **Brand Voice** — Apply tone to labels, button text, empty states, and microcopy
- **UI Style** — Apply border radius, shadow, and density preferences
- **Brand Personality** — Inform overall visual direction and component styling

When designing with brand identity, reference the context:

"I'll apply your design system preferences:

- Voice: [tone] — [how it affects labels/copy]
- UI Style: [preferences] — [how it affects components]
- Personality: [adjectives] — [how it affects visual direction]"

**Shell:**

- Check if `src/shell/components/AppShell.tsx` exists

If shell exists, the screen design will render inside the shell in Design OS. If not, show a warning:

"Note: An application shell hasn't been designed yet. The screen design will render standalone. Consider using the `@04-design-shell` agent first to see section screen designs in the full app context."

## Step 3: Analyze Requirements

Read and analyze all three files:

1. **spec.md** - Understand the user flows and UI requirements
2. **data.json** - Understand the data structure and sample content
3. **types.ts** - Understand the TypeScript interfaces and available callbacks

Identify what views are needed based on the spec. Common patterns:

- List/dashboard view (showing multiple items)
- Detail view (showing a single item)
- Form/create view (for adding/editing)

## Step 4: Clarify the Screen Design Scope

If the spec implies multiple views, ask which view to build first:

"The specification suggests a few different views for **[Section Title]**:

1. **[View 1]** - [Brief description]
2. **[View 2]** - [Brief description]

Which view should I create first?"

If there's only one obvious view, proceed directly.

## Step 5: Read the Frontend Design Skill

Before creating the screen design, read the `frontend-design` skill at `.github/skills/frontend-design/SKILL.md` and follow its guidance for creating distinctive, production-grade interfaces.

## Step 6: Create the Props-Based Component

Create the main component file at `src/sections/[section-id]/components/[ViewName].tsx`.

### Component Structure

The component MUST:

- Import types from the types.ts file
- Accept all data via props (never import data.json directly)
- Accept callback props for all actions
- Be fully self-contained and portable

Example:

```tsx
import type { InvoiceListProps } from "@/../product/sections/[section-id]/types";

export function InvoiceList({
  invoices,
  onView,
  onEdit,
  onDelete,
  onCreate,
}: InvoiceListProps) {
  return (
    <div className='max-w-4xl mx-auto'>
      {/* Component content here */}
      <button onClick={onCreate}>Create Invoice</button>
      {invoices.map((invoice) => (
        <div key={invoice.id}>
          <span>{invoice.clientName}</span>
          <button onClick={() => onView?.(invoice.id)}>View</button>
          <button onClick={() => onEdit?.(invoice.id)}>Edit</button>
          <button onClick={() => onDelete?.(invoice.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Design Requirements

- **Mobile responsive:** Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) and ensure the design layout works gracefully on mobile, tablet and desktop screen sizes.
- **Light & dark mode:** Use `dark:` variants for all colors
- **Use design tokens:** If defined, apply the product's color palette and typography
- **Follow the frontend-design skill:** Create distinctive, memorable interfaces

### Applying Design Tokens

**If `product/design-system/DESIGN.md` exists (imported design tokens — takes precedence):**

- It is the source of truth. Read sections 2 (rules), 3 (color), 4 (typography), 6 (radius) and 7 (shadows).
- Use only token values listed there: palette steps (e.g. `zinc-500`), the radius and shadow scale, the type scale. No arbitrary values (`bg-[#…]`, `p-[13px]`).
- Map semantic roles from section 3.1 to the palette step with the same value where one exists, and note the semantic token in a comment (e.g. `{/* token: primary */}`) so the export can switch to `bg-primary` with `tokens.css`.
- Light and dark values come from the Light/Dark columns; use `dark:` variants accordingly.
- Never use Design OS semantic utilities (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-card`, ...) and never import from `@/components/` — in the preview they resolve to the Design OS theme, not the product. `npm run test:tokens` fails on both (see "Token separation" in agents.md).

**If `product/design-system/colors.json` exists:**

- Use the primary color for buttons, links, and key accents
- Use the secondary color for tags, highlights, secondary elements
- Use the neutral color for backgrounds, text, and borders
- Example: If primary is `lime`, use `lime-500`, `lime-600`, etc. for primary actions

**If `product/design-system/typography.json` exists:**

- Note the font choices for reference in comments
- The fonts will be applied at the app level, but use appropriate font weights

**If design tokens don't exist:**

- Fall back to `stone` for neutrals and `lime` for accents (Design OS defaults)

### Applying Design System Brand Identity

**If `product/design-system/design-system.json` exists with brand identity fields:**

**UI Style preferences:**

- `borderRadius`: Use the specified radius for cards, buttons, inputs (e.g., `rounded-lg`)
- `shadows`: Apply shadow intensity to elevated elements (e.g., `shadow-sm`, `shadow-md`)
- `density`: Adjust information density (compact vs. spacious)

**Voice preferences:**

- Apply tone to button labels (e.g., "Create Project" vs "Let's build something")
- Use voice characteristics in empty states and helper text
- Match writing style in form labels and descriptions

**Personality preferences:**

- Use adjectives to inform visual direction
- Match mood in color intensity and contrast choices
- Apply visual direction to overall component aesthetics

### What to Include

- Implement ALL user flows and UI requirements from the spec
- Use the prop data (not hardcoded values)
- Include realistic UI states (hover, active, etc.)
- Use the callback props for all interactive elements
- Handle optional callbacks with optional chaining: `onClick={() => onDelete?.(id)}`

### What NOT to Include

- No `import data from` statements - data comes via props
- No features not specified in the spec
- No routing logic - callbacks handle navigation intent
- No navigation elements (shell handles navigation)

## Step 7: Create Sub-Components (If Needed)

For complex views, break down into sub-components. Each sub-component should also be props-based.

Create sub-components at `src/sections/[section-id]/components/[SubComponent].tsx`.

## Step 8: Create the Preview Wrapper

Create a preview wrapper at `src/sections/[section-id]/[ViewName].tsx` (note: this is in the section root, not in components/).

This wrapper is what Design OS renders. It imports the sample data and feeds it to the props-based component.

Example:

```tsx
import data from "@/../product/sections/[section-id]/data.json";
import { InvoiceList } from "./components/InvoiceList";

export default function InvoiceListPreview() {
  return (
    <InvoiceList
      invoices={data.invoices}
      onView={(id) => console.log("View invoice:", id)}
      onEdit={(id) => console.log("Edit invoice:", id)}
      onDelete={(id) => console.log("Delete invoice:", id)}
      onCreate={() => console.log("Create new invoice")}
    />
  );
}
```

The preview wrapper:

- Has a `default` export (required for Design OS routing)
- Imports sample data from data.json
- Passes data to the component via props
- Provides console.log handlers for callbacks (for testing interactions)
- Is NOT exported to the user's codebase - it's only for Design OS
- **Will render inside the shell** if one has been designed

## Step 9: Create Component Index

Create an index file at `src/sections/[section-id]/components/index.ts` to cleanly export all components.

## Step 10: Confirm and Next Steps

Let the user know:

"I've created the screen design for **[Section Title]**:

**Exportable components** (props-based, portable):

- `src/sections/[section-id]/components/[ViewName].tsx`
- `src/sections/[section-id]/components/[SubComponent].tsx` (if created)
- `src/sections/[section-id]/components/index.ts`

**Preview wrapper** (for Design OS only):

- `src/sections/[section-id]/[ViewName].tsx`

**Important:** Restart your dev server to see the changes.

[If shell exists]: The screen design will render inside your application shell, showing the full app experience.

[If design tokens exist]: I've applied your color palette ([primary], [secondary], [neutral]) and typography choices.

**Next steps:**

- Use the `@08-screenshot-design` agent to capture a screenshot of this screen design for documentation
- If the spec calls for additional views, use `@07-design-screen` again to create them
- When all sections are complete, use the `@10-export-product` agent to generate the complete export package"

## Important Notes

- ALWAYS read the `frontend-design` skill before creating screen designs
- Components MUST be props-based - never import data.json in exportable components
- The preview wrapper is the ONLY file that imports data.json
- Use TypeScript interfaces from types.ts for all props
- Callbacks should be optional (use `?`) and called with optional chaining (`?.`)
- Always remind the user to restart the dev server after creating files
- Sub-components should also be props-based for maximum portability
- Apply design tokens when available for consistent branding
- Screen designs render inside the shell when viewed in Design OS (if shell exists)
