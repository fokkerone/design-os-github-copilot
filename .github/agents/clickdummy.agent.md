---
name: clickdummy
description: Assemble a fully navigable clickdummy from existing screen designs. Creates a /clickdummy route that wraps all sections in the application shell with working navigation for stakeholder demos.
---

Refer to @agents.md for the full Design OS context, file structure, and conventions.

**Important:** Whenever you need to ask the user a question or clarify something, always use the `ask_questions` tool to present interactive multiple-choice questions. Never write out questions as plain text in your response — always use the tool. This keeps the conversation efficient and easy to respond to.

# Clickdummy Assembly

You are helping the user assemble a **clickdummy** — a fully navigable prototype that wraps all designed sections in the application shell with working inter-section navigation. The clickdummy is served at `/clickdummy/preview` alongside the Design OS planning UI and is meant to be shared with stakeholders (POs, UI/UX designers) for feedback.

**Scope:** This agent ONLY assembles clickdummies from **existing** screen designs. It does NOT create screen designs, specifications, or sample data. If sections are missing designs, it tells the user which agents to use and stops.

## Step 1: Check Core Prerequisites

Verify these files exist:

1. `product/product-overview.md` — Product name and description
2. `product/product-roadmap.md` — Section list for navigation
3. `src/shell/components/AppShell.tsx` — Shell component for wrapping

If any core file is missing:

"Before assembling a clickdummy, you need:

- A product overview → use `@product-vision`
- A roadmap with sections → use `@product-roadmap`
- An application shell → use `@design-shell`

Please create these first, then run `@clickdummy` again."

**Stop here** if any core file is missing.

Also check for optional design tokens (`product/design-system/colors.json`, `product/design-system/typography.json`). If missing, show a brief note but continue — the screen designs should already have their own styling.

## Step 2: Inventory Sections

Read `product/product-roadmap.md` to get the complete list of sections.

For each section in the roadmap, check:

1. Does `product/sections/[section-id]/spec.md` exist?
2. Does `product/sections/[section-id]/data.json` exist?
3. Does `product/sections/[section-id]/types.ts` exist?
4. Does `src/sections/[section-id]/` contain at least one `.tsx` file? (This is the screen design preview wrapper)

Present a status table to the user:

"Here's the current state of your sections:

| Section           | Spec | Data | Screen Design        | Status                     |
| ----------------- | ---- | ---- | -------------------- | -------------------------- |
| Dashboard         | ✅   | ✅   | ✅ `FutureDashboard` | Ready                      |
| Rotation Planning | ✅   | ✅   | ❌                   | Needs screen design        |
| Profiles          | ❌   | ❌   | ❌                   | Needs spec + data + design |

_(adjust based on actual findings)_"

## Step 3: Report Missing & Stop if Needed

If **any** sections from the roadmap lack screen designs, report what's needed and **stop**.

For sections **missing specs** (no `spec.md`):

"**[Section Title]** needs a specification first. Use these agents in order:

1. `@shape-section` — Define the section specification
2. `@sample-data` — Generate sample data and types
3. `@design-screen` — Create the screen design"

For sections **with spec + data but no screen design** (has `spec.md` and `data.json` but no `.tsx` in `src/sections/[id]/`):

"**[Section Title]** has a spec and data but no screen design yet. Use `@design-screen` to create it."

Then finish with:

"Once all sections have screen designs, run `@clickdummy` again to assemble the clickdummy."

**Stop here. Do not proceed to assembly.**

## Step 4: Assemble the Clickdummy

Only reach this step if **all** roadmap sections have screen designs.

### 4a: Read Existing Code

Read these files to understand the current component structure:

- `src/shell/components/AppShell.tsx` — Props interface (`AppShellProps`), especially `navigationItems`, `user`, `onNavigate`, `onLogout`, `children`
- `src/shell/components/MainNav.tsx` — The `NavItem` type: `{ label, href, icon: LucideIcon, isActive? }`
- `src/lib/section-loader.ts` — API functions: `getSectionScreenDesigns(sectionId)`, `loadScreenDesignComponent(sectionId, name)`
- `src/lib/product-loader.ts` — API function: `loadProductData()` returns `{ overview, roadmap }`
- `src/shell/ShellPreview.tsx` — Reference pattern for shell navigation with state-based active section

Also read one existing screen design preview wrapper (e.g., the first `.tsx` in `src/sections/[first-section]/`) to understand the pattern — these use `export default function` and import data internally.

### 4b: Create the Clickdummy Component

Create `src/clickdummy/ClickdummyApp.tsx`.

This component must:

- Import `AppShell` from `@/shell/components/AppShell`
- Import `NavItem` type from `@/shell/components/MainNav`
- Import `loadProductData` from `@/lib/product-loader`
- Import `getSectionScreenDesigns`, `loadScreenDesignComponent` from `@/lib/section-loader`
- Import appropriate **Lucide icons** for each section (pick icons that match the section purposes — e.g., `LayoutDashboard` for dashboards, `CalendarDays` for planning, `Users` for profiles, `BookOpen` for knowledge bases, etc.)
- Use `React.lazy` + `Suspense` for lazy-loading screen design components
- Use **React state** (`useState`) for tracking the active section — NOT React Router
- Intercept the shell's `onNavigate` callback to update the active section state
- Render the active section's screen design component inside the shell's `children`
- Include a loading skeleton as the Suspense fallback
- Include a fallback component for sections that fail to load

**Structure template:**

```tsx
import { Suspense, useMemo, useState, useCallback, lazy } from "react";
import { AppShell } from "@/shell/components/AppShell";
import type { NavItem } from "@/shell/components/MainNav";
import { loadProductData } from "@/lib/product-loader";
import { getSectionScreenDesigns, loadScreenDesignComponent } from "@/lib/section-loader";
// Import Lucide icons matching the roadmap sections:
import { Circle } from "lucide-react";
// e.g., import { LayoutDashboard, CalendarDays, Users, BookOpen } from 'lucide-react'

export default function ClickdummyApp() {
  const productData = useMemo(() => loadProductData(), []);
  const sections = productData.roadmap?.sections ?? [];

  const [activeSectionId, setActiveSectionId] = useState(() => sections[0]?.id ?? "");

  // Map section IDs to Lucide icons — fill in based on actual roadmap sections
  const iconMap: Record<string, NavItem["icon"]> = {
    // 'dashboard': LayoutDashboard,
    // 'rotation-planning': CalendarDays,
    // 'profiles': Users,
    // 'knowledge-base': BookOpen,
  };

  const navigationItems: NavItem[] = sections.map((section) => ({
    label: section.title,
    href: `/${section.id}`,
    icon: iconMap[section.id] || Circle,
    isActive: section.id === activeSectionId,
  }));

  const handleNavigate = useCallback(
    (href: string) => {
      const sectionId = href.startsWith("/") ? href.slice(1) : href;
      const matched = sections.find((s) => s.id === sectionId);
      if (matched) setActiveSectionId(matched.id);
    },
    [sections],
  );

  // Lazily load the active section's first screen design preview wrapper
  const ActiveComponent = useMemo(() => {
    const screenDesigns = getSectionScreenDesigns(activeSectionId);
    if (screenDesigns.length === 0) return null;
    const loader = loadScreenDesignComponent(activeSectionId, screenDesigns[0].name);
    if (!loader) return null;
    return lazy(async () => {
      try {
        const mod = await loader();
        if (mod?.default) return mod;
        return { default: () => <FallbackContent sectionId={activeSectionId} /> };
      } catch {
        return { default: () => <FallbackContent sectionId={activeSectionId} /> };
      }
    });
  }, [activeSectionId]);

  return (
    <AppShell
      navigationItems={navigationItems}
      user={{ name: "Demo User" }}
      onNavigate={handleNavigate}
      onLogout={() => console.log("Logout")}
    >
      <Suspense fallback={<LoadingSkeleton />}>
        {ActiveComponent ? <ActiveComponent /> : <FallbackContent sectionId={activeSectionId} />}
      </Suspense>
    </AppShell>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-8 animate-pulse space-y-4">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function FallbackContent({ sectionId }: { sectionId: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="text-center">
        <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
          No screen design found for &ldquo;{sectionId}&rdquo;
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
          Use the <code>@design-screen</code> agent to create one.
        </p>
      </div>
    </div>
  );
}
```

**Critical requirements:**

1. **Dynamic discovery** — Use `loadProductData()` for sections and `getSectionScreenDesigns()` / `loadScreenDesignComponent()` for screen designs. Do NOT hardcode section names or component imports.
2. **State-based navigation** — Use `useState(activeSectionId)`, NOT React Router. The entire clickdummy is a single `/clickdummy` route.
3. **Lazy loading** — Use `React.lazy()` wrapping the loader from `loadScreenDesignComponent()`. The loader returns `() => Promise<{ default: ComponentType }>`.
4. **Icon mapping** — Read the roadmap sections and pick appropriate Lucide icons. Use `Circle` as a fallback for unknown sections.
5. **Shell pattern** — Follow the exact same pattern as `src/shell/ShellPreview.tsx` for constructing `navigationItems` and handling `onNavigate`.

### 4c: Register the Route

Add the clickdummy route to `src/lib/router.tsx`.

Add these imports at the top of the file:

```tsx
import { lazy, Suspense } from "react";
const ClickdummyApp = lazy(() => import("@/clickdummy/ClickdummyApp"));
```

Add this route entry to the router array:

```tsx
{
  path: '/clickdummy/preview',
  element: (
    <Suspense fallback={null}>
      <ClickdummyApp />
    </Suspense>
  ),
},
```

### 4d: Theme Handling

The clickdummy inherits the theme (light/dark mode) from the main Design OS application since it runs in the same Vite app. If the clickdummy is opened directly via URL without visiting the main app first, add theme detection on mount:

```tsx
import { useEffect } from "react";

// Inside the component:
useEffect(() => {
  const theme = localStorage.getItem("theme") || "system";
  if (theme === "system") {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", systemDark);
  } else {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}, []);
```

## Step 5: Verify

After creating the files:

1. Run `npx tsc --noEmit` to check for TypeScript errors. Fix any issues.
2. Start the dev server with `npm run dev` (in background)
3. Navigate to `http://localhost:3000/clickdummy/preview`
4. Verify:
   - The application shell renders with sidebar navigation
   - All roadmap sections appear as nav items in the sidebar
   - Clicking a nav item switches the content area to that section's screen design
   - Screen designs render correctly inside the shell
   - Mobile responsive: sidebar becomes a hamburger menu on small screens
5. Report any issues found.

## Step 6: Report to User

Tell the user the clickdummy is ready:

"Your clickdummy is assembled at **http://localhost:3000/clickdummy/preview**

It includes **[N] sections** with working navigation:

- ✅ [Section 1]
- ✅ [Section 2]
- ✅ [Section 3]

**For stakeholder demos:** Share this URL or run `npm run dev` to serve locally.

Want any adjustments to the clickdummy?"
