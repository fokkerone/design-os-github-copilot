# Clickdummy Assembly

You are helping the user assemble a **clickdummy** — a fully navigable prototype that wraps all designed sections in the application shell with working inter-section navigation, and lets every user flow be walked step by step through its screens. The clickdummy is served at `/clickdummy/preview` alongside the Design OS planning UI and is meant to be shared with stakeholders (POs, UI/UX designers) for feedback.

**Important:** Ask every question with the `AskUserQuestion` tool (structured multiple choice), never as plain prose: 2–4 options, your recommendation first with the suffix `(Recommended)`, `multiSelect: true` for non-exclusive choices, up to 4 independent questions per call, no own "Other" option (it is added automatically), short labels.

**Scope:** This command ONLY assembles clickdummies from **existing** screen designs. It does NOT create screen designs, specifications, or sample data. If sections are missing designs, it tells the user which commands to use and stops.

## Step 1: Check Core Prerequisites

Verify these files exist:

1. `product/product-overview.md` — Product name and description
2. `product/product-roadmap.md` — Section list for navigation
3. `src/shell/components/AppShell.tsx` — Shell component for wrapping

If any core file is missing:

"Before assembling a clickdummy, you need:
- A product overview → run `/design-os:product-vision`
- A roadmap with sections → run `/design-os:product-roadmap`
- An application shell → run `/design-os:design-shell`

Please create these first, then run `/design-os:clickdummy` again."

**Stop here** if any core file is missing.

Also check for optional design tokens (`product/design-system/design-system.json`). If missing, show a brief note but continue — the screen designs should already have their own styling.

> **Token separation:** The clickdummy is product code. It must not import Design OS UI (`@/components/*`) or use Design OS semantic utilities (`bg-primary`, `text-muted-foreground`, ...); data loaders from `@/lib/product-loader` and `@/lib/section-loader` are fine. See "Token separation" in agents.md.

## Step 1b: Load the Tech Stack

Run `npm run -s techstack` and follow the `designos-techstack` skill, section "Applying the stack" (`.claude/skills/designos-techstack/SKILL.md`). Tell the user in one line which stack applies: the file `product/techstack/techstack.md`, or "defaults: shadcn/ui, lucide-react".

- The decisions are binding. An undecided area means no new dependency: build it with React, TypeScript and Tailwind.
- A request the stack cannot serve is a conflict. Show it to the user, name the area, and offer `/design-os:techstack update`. Never pick a side silently.
- Never edit `product/techstack/techstack.md` from this step.
- The clickdummy imports UI primitives only from `src/ui/` (never `@/components/*`) and icons from the stack's `icons` area. Note the stack's `routing` decision for the summary in Step 6.

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

### User flows

Run `npm run -s context` (see the `designos-context` skill, `.claude/skills/designos-context/SKILL.md`). If flows exist in `product/flows/`, show a second table:

| Flow | Sections | Steps with a screen | Open steps |
| ---- | -------- | ------------------- | ---------- |
| Submit meter reading | Account → Meter Readings | 4 of 6 | S4 → `ReadingReview` (missing), S6 (no screen assigned) |

- The flows define how users move between screens. The clickdummy follows them; it does not invent an order from the list of screens.
- An incomplete flow does **not** stop the assembly. Its open steps stay visible as gaps in the clickdummy. Never let another screen stand in for a missing one.
- Show every entry under **Conflicts** to the user and ask how to proceed. Do not resolve them, and do not edit flows, personas or specs from here.
- The section specs are binding: the clickdummy contains what the specs and the existing screen designs cover, nothing more.

## Step 3: Report Missing & Stop if Needed

If **any** sections from the roadmap lack screen designs, report what's needed and **stop**.

For sections **missing specs** (no `spec.md`):

"**[Section Title]** needs a specification first. Use these commands in order:
1. `/design-os:shape-section` — Define the section specification
2. `/design-os:sample-data` — Generate sample data and types
3. `/design-os:design-screen` — Create the screen design"

For sections **with spec + data but no screen design** (has `spec.md` and `data.json` but no `.tsx` in `src/sections/[id]/`):

"**[Section Title]** has a spec and data but no screen design yet. Run `/design-os:design-screen` to create it."

Then finish with:

"Once all sections have screen designs, run `/design-os:clickdummy` again to assemble the clickdummy."

**Stop here. Do not proceed to assembly.**

## Step 3b: Update Instead of Rebuilding

If `src/clickdummy/ClickdummyApp.tsx` already exists, **do not regenerate it**.

The clickdummy reads sections, screen designs and user flows at runtime. A new screen design, a new flow or a changed flow step appears in it without any change to the file. So first check what actually needs to change:

- **New section in the roadmap:** add its icon to `iconMap`. Nothing else.
- **New or changed flow, new screen design:** nothing to do. Open `/clickdummy/preview`, walk the flow and report the result.
- **The file predates flow support** (it does not import `useFlowWalk`): add the flow walk as shown in Step 4b, keeping everything else, including the user's own changes.
- **The user asks for a specific change:** make that change only.

Tell the user what you changed and what you left alone. Rebuild from scratch only when the user asks for it explicitly.

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
- Import an appropriate icon for each section from the stack's `icons` area (default `lucide-react`). Pick icons that match the section purposes — e.g., for lucide-react: `LayoutDashboard` for dashboards, `CalendarDays` for planning, `Users` for profiles, `BookOpen` for knowledge bases, etc. With another icon set, use its equivalents and make sure they fit the `NavItem["icon"]` type (wrap them if needed).
- Import any UI primitive the clickdummy itself needs (for example in the loading skeleton or fallback) from `src/ui/`, never from `@/components/*`
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
import { useFlowWalk } from "@/lib/clickdummy-flows";
import { FlowWalkBar, FlowStepGap } from "@/components/FlowWalkBar";
// Import icons from the stack's `icons` area (default lucide-react) matching the roadmap sections:
import { Circle } from "lucide-react";
// e.g., import { LayoutDashboard, CalendarDays, Users, BookOpen } from 'lucide-react'

export default function ClickdummyApp() {
  const productData = useMemo(() => loadProductData(), []);
  const sections = productData.roadmap?.sections ?? [];

  const [activeSectionId, setActiveSectionId] = useState(() => sections[0]?.id ?? "");

  // User flows: while a flow is walked, its current step decides which screen is shown.
  // With ?flow=<flow-id> in the URL the clickdummy is locked to that one flow.
  const walk = useFlowWalk();
  const stopWalk = walk.stop;
  const shownSectionId = walk.screen?.sectionId ?? walk.step?.sectionId ?? activeSectionId;
  const shownScreenName = walk.active
    ? (walk.screen?.name ?? null)
    : (getSectionScreenDesigns(activeSectionId)[0]?.name ?? null);
  const visibleSections = walk.locked ? sections.filter((s) => walk.sectionIds.includes(s.id)) : sections;

  // Map section IDs to icons from the stack's icon set — fill in based on actual roadmap sections
  const iconMap: Record<string, NavItem["icon"]> = {
    // 'dashboard': LayoutDashboard,
    // 'rotation-planning': CalendarDays,
    // 'profiles': Users,
    // 'knowledge-base': BookOpen,
  };

  const navigationItems: NavItem[] = visibleSections.map((section) => ({
    label: section.title,
    href: `/${section.id}`,
    icon: iconMap[section.id] || Circle,
    isActive: section.id === shownSectionId,
  }));

  const handleNavigate = useCallback(
    (href: string) => {
      const sectionId = href.startsWith("/") ? href.slice(1) : href;
      const matched = sections.find((s) => s.id === sectionId);
      if (!matched) return;
      // Navigating by hand leaves the flow walk (a locked clickdummy stays in its flow)
      stopWalk();
      setActiveSectionId(matched.id);
    },
    [sections, stopWalk],
  );

  // Lazily load the screen design to show: the flow step's screen, or the section's first one
  const ActiveComponent = useMemo(() => {
    if (!shownScreenName) return null;
    const loader = loadScreenDesignComponent(shownSectionId, shownScreenName);
    if (!loader) return null;
    return lazy(async () => {
      try {
        const mod = await loader();
        if (mod?.default) return mod;
        return { default: () => <FallbackContent sectionId={shownSectionId} /> };
      } catch {
        return { default: () => <FallbackContent sectionId={shownSectionId} /> };
      }
    });
  }, [shownSectionId, shownScreenName]);

  return (
    <>
    <FlowWalkBar walk={walk} />
    <AppShell
      navigationItems={navigationItems}
      user={{ name: "Demo User" }}
      onNavigate={handleNavigate}
      onLogout={() => console.log("Logout")}
    >
      <Suspense fallback={<LoadingSkeleton />}>
        {ActiveComponent ? (
          <ActiveComponent />
        ) : walk.active ? (
          <FlowStepGap walk={walk} />
        ) : (
          <FallbackContent sectionId={shownSectionId} />
        )}
      </Suspense>
    </AppShell>
    </>
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
          Run <code>/design-os:design-screen</code> to create one.
        </p>
      </div>
    </div>
  );
}
```

**Critical requirements:**

1. **Dynamic discovery** — Use `loadProductData()` for sections and `getSectionScreenDesigns()` / `loadScreenDesignComponent()` for screen designs. Do NOT hardcode section names or component imports.
2. **State-based navigation** — Use `useState(activeSectionId)`, NOT React Router. The entire clickdummy is a single `/clickdummy` route. This stays true even when the stack's `routing` decision names the target's router: that decision is for the export, not for the prototype.
3. **Lazy loading** — Use `React.lazy()` wrapping the loader from `loadScreenDesignComponent()`. The loader returns `() => Promise<{ default: ComponentType }>`.
4. **Icon mapping** — Read the roadmap sections and pick appropriate icons from the stack's `icons` area (default `lucide-react`). Use a neutral circle icon (`Circle` in lucide-react) as a fallback for unknown sections.
5. **Shell pattern** — Follow the exact same pattern as `src/shell/ShellPreview.tsx` for constructing `navigationItems` and handling `onNavigate`.

6. **Flows at runtime** — Use `useFlowWalk()` from `@/lib/clickdummy-flows` and render `FlowWalkBar` and `FlowStepGap` from `@/components/FlowWalkBar`. Do NOT copy flow steps, screen names or transitions into the file: they are derived from `product/flows/` on every load, so the clickdummy stays current when flows and screens change.
7. **Gaps stay visible** — A flow step without a screen design renders `FlowStepGap`. Never substitute another screen.
8. **One flow on its own** — `/clickdummy/preview?flow=<flow-id>` locks the clickdummy to that flow: only its steps and its sections are reachable. Keep this working; it is how a single flow is demoed.

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
   Run `npm run -s ui:check`: the clickdummy imports primitives only from `src/ui/`. Fix every finding.
2. Start the dev server with `npm run dev` (in background)
3. Navigate to `http://localhost:3000/clickdummy/preview`
4. Verify:
   - The application shell renders with sidebar navigation
   - All roadmap sections appear as nav items in the sidebar
   - Clicking a nav item switches the content area to that section's screen design
   - Screen designs render correctly inside the shell
   - Mobile responsive: sidebar becomes a hamburger menu on small screens
   - If flows exist: the flow control at the bottom lists them; walking a flow moves through its steps in order, also across sections; a decision offers one button per branch; a step without a screen design shows the gap notice
   - `/clickdummy/preview?flow=<flow-id>` shows only that flow
5. Report any issues found.

## Step 6: Report to User

Tell the user the clickdummy is ready:

"Your clickdummy is assembled at **http://localhost:3000/clickdummy/preview**

It includes **[N] sections** with working navigation:
- ✅ [Section 1]
- ✅ [Section 2]
- ✅ [Section 3]

[If flows exist]:
**User flows** (walk them with the control at the bottom of the clickdummy):
- [Flow title]: [N] of [M] steps have a screen design. Open: [S4 → ScreenName, S6 → no screen assigned]
- Share one flow on its own: `http://localhost:3000/clickdummy/preview?flow=[flow-id]`

[If conflicts were reported]: **Open conflicts** between flows, specs and screens: [list]. I left them as they are.

**Tech stack** ([stack line from Step 1b]): UI from `src/ui/`, icons from [icon package]. Routing decision for the export: [the stack's `routing` choice, or "state-based navigation in the prototype; the target's router is not decided"]. The clickdummy itself keeps state-based navigation.

**For stakeholder demos:** Share this URL or run `npm run dev` to serve locally.

Want any adjustments to the clickdummy? When you're ready to hand off, run `/design-os:export-product` to generate the complete export package."
