# RWE-inspired Design System for Web Applications

> Purpose: single source of truth for humans and coding agents building **web apps** (dashboards, portals, internal tools) in the RWE visual language.
> This is **not** the marketing-site system. Marketing pages (rwe.com) use large type, generous whitespace, full-bleed photography and video. Web apps need **density, speed of scanning and predictability**. Everything below is the marketing language, scaled down and tightened for work surfaces.

---

## 0. Provenance and confidence

Read this first. It tells you which values are official and which are derived.

| Item                                                                                                | Status                                           | Source / note                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand blue `#1D4276`                                                                                | Published brand value                            | RWE brand color listings (BrandColorCode, logotyp.us). Brandfetch lists `#1D4477`, a near-identical variant.                                                                                          |
| Brand green `#00B38D`                                                                               | Published by a brand aggregator                  | Brandfetch ("Persian Green"). Not confirmed against official RWE guidelines.                                                                                                                          |
| Light blue-grey `#C6D0DD`                                                                           | Published by a brand aggregator                  | Brandfetch ("Heather").                                                                                                                                                                               |
| Typeface **RWE Sans**                                                                               | Confirmed as RWE's corporate typeface since 2019 | Geometric proportions, clean cuts, humanist touches, 8 styles. Proprietary. Credited to Wondermake in its own case study, to Studio Buchanan on typografie.info. Treat the attribution as unresolved. |
| "Energy fields", topographic and weather-map graphics, 200+ custom icons                            | Confirmed design language                        | RWE 2019 rebrand press release, Wondermake and Studio SV87 case studies.                                                                                                                              |
| Everything else (neutrals, semantic colors, dark mode, type scale, spacing, radii, component sizes) | **Derived for web apps**                         | Proposed by this document. Contrast ratios were computed (WCAG 2.x). Not RWE-official.                                                                                                                |

**Action before shipping:** get the official RWE brand guidelines / web style guide from the RWE brand team and replace the aggregator-sourced values (green, light grey) and the derived tokens where they differ. Keep token _names_ stable so the swap is a one-file change.

---

## 1. Design principles (for apps)

1. **Clear over decorative.** Geometric, clean, confident. No ornament that does not carry information.
2. **Dense but calm.** Small type, tight rhythm, lots of structure through alignment rather than through boxes and lines.
3. **Blue is the ground, green is the signal.** Blue carries structure, navigation and primary text emphasis. Green marks the primary action, positive state and "energy/renewable" meaning. Never use green as a general decoration color.
4. **Friendly, not playful.** RWE describes itself as transparent, friendly and approachable. Softly rounded corners, plain language, no jargon in UI copy.
5. **Numbers are first-class.** Energy apps are about values, units and trends. Tabular figures, right-aligned numbers, units always shown.
6. **Marketing flourishes stay out.** No full-bleed hero imagery, video backgrounds or oversized headings inside the app shell. The "energy field" motif is allowed only in empty states, login and onboarding (see §9).

---

## 2. Color

### 2.1 Brand core

| Token         | Hex       | Role                                                                    |
| ------------- | --------- | ----------------------------------------------------------------------- |
| `--rwe-blue`  | `#1D4276` | Brand blue. Headings, nav, selected states, links on light.             |
| `--rwe-green` | `#00B38D` | Brand green. Primary action surface, positive signal, chart accent.     |
| `--rwe-mist`  | `#C6D0DD` | Light blue-grey. Borders, dividers, disabled surfaces, chart gridlines. |
| `--rwe-navy`  | `#0B2545` | Derived deep navy. Text on green, dark-mode background base.            |

### 2.2 Contrast rules that follow from the brand colors (computed)

- White on `#00B38D` = **2.68:1. Fails.** Never put white text or white icons on brand green.
- Navy `#0B2545` on `#00B38D` = **5.74:1. Passes.** Green buttons use navy text.
- White on `#1D4276` = **10.03:1.** Passes AAA.
- `#00B38D` as text on white fails. For green text or icons on light surfaces use `--green-700` (`#00806A`, 4.89:1) or darker.
- `#C6D0DD` on white = 1.56:1. It is a border/divider color only, never text or an essential icon.

### 2.3 Light theme tokens

**Neutrals (blue-tinted, to sit with the brand blue)**

| Token              | Hex       | Use                                                             |
| ------------------ | --------- | --------------------------------------------------------------- |
| `--bg-app`         | `#F4F7FA` | App background behind cards                                     |
| `--bg-surface`     | `#FFFFFF` | Cards, tables, panels, inputs                                   |
| `--bg-subtle`      | `#E8EEF7` | Hover rows, selected row tint, table header, chips              |
| `--border-default` | `#D6DDE7` | Card and input borders (decorative, low contrast)               |
| `--border-strong`  | `#8595AA` | Input borders that must be perceivable (3.05:1 on white)        |
| `--text-primary`   | `#0B2545` | Body text (15.39:1 on white)                                    |
| `--text-secondary` | `#5B6B80` | Secondary text, captions (5.44:1 on white, 5.06:1 on `#F4F7FA`) |
| `--text-disabled`  | `#8595AA` | Disabled only. Not for meaningful content.                      |
| `--text-on-brand`  | `#FFFFFF` | Text on `--rwe-blue`                                            |
| `--text-on-green`  | `#0B2545` | Text on `--rwe-green`                                           |

**Brand roles**

| Token                 | Hex       | Use                                                                            |
| --------------------- | --------- | ------------------------------------------------------------------------------ |
| `--primary`           | `#00B38D` | Primary button fill                                                            |
| `--primary-hover`     | `#00A37F` | Hover. Navy text `#0B2545` on it = 4.8:1, so keep the text navy (never white). |
| `--primary-active`    | `#009373` | Pressed                                                                        |
| `--accent-blue`       | `#1D4276` | Secondary emphasis, active nav, links                                          |
| `--accent-blue-hover` | `#144D9C` | Link hover (8.17:1 on white)                                                   |
| `--link`              | `#1D4276` | Inline links, always underlined on hover                                       |
| `--focus-ring`        | `#4C86D6` | 2px focus outline with 2px offset                                              |
| `--green-700`         | `#00806A` | Green text/icons on light (4.89:1)                                             |
| `--green-800`         | `#006B58` | Green text on tinted backgrounds (6.47:1 on white)                             |

**Semantic**

| State   | Text/Icon | Background | Border    | Contrast (text on bg) |
| ------- | --------- | ---------- | --------- | --------------------- |
| Success | `#005F4E` | `#E6F7F3`  | `#00B38D` | 6.90:1                |
| Warning | `#93370D` | `#FEF3E2`  | `#F0A92E` | 6.85:1                |
| Danger  | `#8B1A10` | `#FDECEA`  | `#B42318` | 8.15:1                |
| Info    | `#1D4276` | `#E8EEF7`  | `#4C86D6` | 8.60:1                |

Solid semantic fills (for badges/toasts on white): success `#00806A`, warning `#B54708`, danger `#B42318`, info `#1D4276`, all with white text (all at or above 4.89:1).

Rule: never rely on color alone. Every status needs an icon or text label as well.

### 2.4 Dark theme tokens

Dark theme is derived from the navy. Do not invert the light theme.

| Token              | Hex       | Use                                                       |
| ------------------ | --------- | --------------------------------------------------------- |
| `--bg-app`         | `#0B1B33` | App background                                            |
| `--bg-surface`     | `#152A4A` | Cards, panels                                             |
| `--bg-subtle`      | `#1D3560` | Hover, selected                                           |
| `--border-default` | `#2A4470` | Borders                                                   |
| `--text-primary`   | `#E6EBF2` | Body (14.38:1 on `#0B1B33`, 11.99:1 on `#152A4A`)         |
| `--text-secondary` | `#9FB0C6` | Secondary (7.79:1 / 6.50:1)                               |
| `--primary`        | `#3FD3B0` | Lightened green so it reads on dark (9.15:1 on `#0B1B33`) |
| `--text-on-green`  | `#0B1B33` | Text on the dark-theme green                              |
| `--link`           | `#8FB4EB` | Links (8.12:1 on `#0B1B33`)                               |
| `--focus-ring`     | `#8FB4EB` | Focus                                                     |

Semantic colors in dark: use the same hues, swap fill/text (light tinted text on a 15% alpha fill of the hue).

### 2.5 Data visualization palette (proposal)

Categorical order (max 6 series; beyond that, group or facet):

1. `#1D4276` blue (brand)
2. `#00B38D` green (brand)
3. `#4C86D6` mid blue
4. `#F0A92E` amber
5. `#8E6BBF` violet
6. `#8595AA` neutral grey

Rules: gridlines `--rwe-mist`, axis text `--text-secondary`, no chart borders, no 3D, no gradients on data marks. Use green for series that mean "renewable / positive" and grey for "conventional / baseline" when that semantic mapping exists, and keep the mapping identical across the whole app. This palette has **not** been checked for color-vision deficiency. Validate it (or add direct labels/pattern fills) before release. For sequential/diverging scales derive from `--rwe-blue` (light to dark) and use a blue to amber diverging pair.

---

## 3. Typography

### 3.1 Font family

- **Primary: `RWE Sans`.** Proprietary corporate typeface, geometric with humanist touches. Only use it if RWE provides a web-font license and files (WOFF2). Do not scrape it from rwe.com.
- **Fallback (open-licensed, similar geometric-humanist feel):** `Inter`, then system UI.

```css
--font-sans:
  "RWE Sans", "Inter", system-ui, -apple-system, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;
--font-mono:
  ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
```

Global settings:

```css
body {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  font-feature-settings:
    "tnum" 1,
    "lnum" 1; /* tabular, lining figures for data */
}
```

If a fallback font does not support `tnum`, use `font-variant-numeric: tabular-nums` and verify alignment in tables.

### 3.2 Type scale (web app, compact)

Marketing sites use 48 to 96px display type. Apps stay small. **Base is 14px**, not 16px.

| Token          | Size / line-height | Weight   | Use                                       |
| -------------- | ------------------ | -------- | ----------------------------------------- |
| `--text-xs`    | 12 / 16            | 400, 500 | Captions, table meta, badges, helper text |
| `--text-sm`    | 13 / 20            | 400, 500 | Dense tables, secondary UI                |
| `--text-base`  | 14 / 20            | 400      | Default body, form fields, buttons        |
| `--text-md`    | 16 / 24            | 400, 500 | Long-form text, empty-state body          |
| `--heading-xs` | 14 / 20            | 600      | Card titles, table group titles           |
| `--heading-sm` | 16 / 24            | 600      | Section headings, panel titles            |
| `--heading-md` | 20 / 28            | 600      | Page sub-headings, modal titles           |
| `--heading-lg` | 24 / 32            | 600      | Page titles                               |
| `--display`    | 32 / 40            | 600      | KPI hero number, login/onboarding only    |

Weights available in RWE Sans: 8 styles. In apps use **400 (regular), 500 (medium), 600 (semibold)**. Avoid 700+ and light weights below 14px.

Rules:

- Sentence case for all UI text ("Create report", not "Create Report"). No all-caps except 11 to 12px overline labels with +0.04em tracking.
- Headings use `--text-primary`; brand blue (`--rwe-blue`) is allowed for page titles and active navigation, not for body copy.
- Max line length for prose: 72 characters. Tables and forms are exempt.
- KPI numbers: `--display` or `--heading-lg`, tabular figures, unit in `--text-sm` and `--text-secondary` directly after the number.
- Minimum text size is 12px. Never go below.

### 3.3 Numbers, units, dates (energy domain)

- Always show units: `1,240 MW`, `3.2 GWh`, `€48.20/MWh`. Unit in secondary color, separated by a thin (non-breaking) space.
- Right-align numeric columns; align decimals; use the same decimal count within a column.
- Locale-aware formatting via `Intl.NumberFormat` (German: `1.240,5`; English: `1,240.5`). Never hard-code separators.
- Dates: ISO in tables and exports (`2026-09-25`), localized long form in prose. Always show the timezone for time series that cross zones.
- Negative values: minus sign `−`, not parentheses. Color only if the sign is semantically good/bad in context, and always with the sign.

---

## 4. Spacing, sizing and layout

### 4.1 Grid and spacing

Base unit **4px**. Marketing pages use 64 to 160px section gaps; apps use these:

| Token        | px  | Typical use                                  |
| ------------ | --- | -------------------------------------------- |
| `--space-1`  | 4   | Icon-to-text gap, tight inline gaps          |
| `--space-2`  | 8   | Inline element gap, compact padding          |
| `--space-3`  | 12  | Form field vertical gap, card header padding |
| `--space-4`  | 16  | Default card padding, page gutters on mobile |
| `--space-5`  | 20  |                                              |
| `--space-6`  | 24  | Card-to-card gap, page gutters on desktop    |
| `--space-8`  | 32  | Between major page sections                  |
| `--space-12` | 48  | Maximum inside the app (empty states)        |

Rules of thumb:

- Card padding: **16px** (dense: 12px). Card gap: **16px** (24px in wide layouts).
- Form: label to field 4px, field to field 12px, group to group 24px.
- Table row heights: **32px** (dense), **40px** (default), **48px** (comfortable/touch).
- Nothing in the app uses spacing above 48px, except centered empty/login screens.

### 4.2 App shell

| Element                    | Size                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Top bar                    | 48px high, `--bg-surface` with 1px bottom border, or `--rwe-blue` with white text (choose one per product, do not mix) |
| Side navigation            | 240px expanded, 56px collapsed (icons only, with tooltips)                                                             |
| Page content max width     | Fluid for data views; 1280px cap for text/forms                                                                        |
| Page gutter                | 16px (below 768px), 24px (768px and above)                                                                             |
| Sub-navigation / tabs bar  | 40px                                                                                                                   |
| Sticky table header offset | Top bar height (48px)                                                                                                  |

Side navigation item: 36px high, 8px horizontal padding, 8px radius. Active item: `--bg-subtle` fill, `--rwe-blue` text and icon, 3px green (`--rwe-green`) indicator on the left edge (this is the one permitted decorative green accent in navigation).

### 4.3 Breakpoints

| Name  | Min width | Behavior                                           |
| ----- | --------- | -------------------------------------------------- |
| `sm`  | 640px     | Single column, side nav becomes a drawer           |
| `md`  | 768px     | Two columns allowed, side nav collapsed by default |
| `lg`  | 1024px    | Side nav expanded, up to 3 columns                 |
| `xl`  | 1280px    | Full dashboard layouts                             |
| `2xl` | 1536px    | Only add columns, never scale type                 |

12-column grid with 16px gutters (24px at `xl` and above).

### 4.4 Radius, borders, elevation

RWE's identity uses softened corners (logo and UI are "softer and more compact"). Keep that, but smaller than marketing.

| Token           | px   | Use                                       |
| --------------- | ---- | ----------------------------------------- |
| `--radius-sm`   | 4    | Badges, checkboxes, table cells with fill |
| `--radius-md`   | 8    | Buttons, inputs, nav items, cards         |
| `--radius-lg`   | 12   | Modals, large panels                      |
| `--radius-full` | 9999 | Pills, avatars, toggles                   |

Borders: 1px `--border-default`. Prefer border over shadow for separating content.

Elevation (light theme; in dark theme use lighter surfaces, not stronger shadows):

| Level | Shadow                            | Use                           |
| ----- | --------------------------------- | ----------------------------- |
| 0     | none                              | Cards, tables (border only)   |
| 1     | `0 1px 2px rgba(11,37,69,0.08)`   | Sticky headers, hovered cards |
| 2     | `0 4px 12px rgba(11,37,69,0.12)`  | Dropdowns, popovers, toasts   |
| 3     | `0 12px 32px rgba(11,37,69,0.18)` | Modals, drawers               |

---

## 5. Components

Sizes are defined in three densities: **S (32px)**, **M (36px, default)**, **L (40px, touch)**. Interactive targets are at least 24×24 CSS px; on touch devices use L (40px) and add spacing.

### 5.1 Buttons

| Variant          | Fill                  | Text                        | Border           | Use                                     |
| ---------------- | --------------------- | --------------------------- | ---------------- | --------------------------------------- |
| Primary          | `--primary` `#00B38D` | `--text-on-green` `#0B2545` | none             | One per view or dialog: the main action |
| Secondary        | `--bg-surface`        | `--rwe-blue`                | 1px `--rwe-blue` | Alternative actions                     |
| Tertiary / ghost | transparent           | `--rwe-blue`                | none             | Low-emphasis, toolbar actions           |
| Danger           | `#B42318`             | white                       | none             | Destructive, confirmed via dialog       |
| Danger (subtle)  | transparent           | `#B42318`                   | none             | Inline destructive links                |

- Height 32 / 36 / 40, horizontal padding 12 / 14 / 16, radius 8, text 14px weight 500 (13px in S).
- Icon-only buttons: square (32/36/40), always with `aria-label` and tooltip.
- States: hover = `--primary-hover` (secondary: `--bg-subtle`), active = `--primary-active`, focus = 2px `--focus-ring` outline with 2px offset, disabled = `--bg-subtle` fill with `--text-disabled` text (not a faded version of the color), loading = spinner replaces the leading icon, width stays fixed.
- No uppercase, no gradients, no shadow on buttons.

### 5.2 Inputs, selects, textareas

- Height 36px (S 32, L 40), padding 0 12px, radius 8, 1px `--border-strong`, fill `--bg-surface`, text 14px.
- Label: above the field, `--text-sm`, weight 500, `--text-primary`. Helper text below: `--text-xs`, `--text-secondary`. Error text: `--text-xs`, danger text color with icon.
- Focus: border `--rwe-blue`, plus the 2px focus ring. Error: border `#B42318`. Read-only: `--bg-subtle` fill, no border emphasis.
- Placeholder color `#6B7A8F` (4.37:1; do not use it to carry required information).
- Checkbox/radio: 16px, checked fill `--rwe-blue` with white mark; toggle: 32×18, on-state track `--green-700` `#00806A` with a white thumb (keeps 3:1+ non-text contrast; the bright brand green alone would not).

### 5.3 Tables and lists (the core surface)

- Header row: `--bg-subtle`, text `--text-xs` weight 600, `--text-secondary`, 40px high, sticky.
- Body rows: 40px default (32 dense), 1px bottom border `--border-default`, hover `--bg-subtle`, selected `#E8EEF7` with 2px `--rwe-blue` left edge.
- Cell padding 0 12px. Numeric columns right-aligned with tabular figures. Truncate text with ellipsis and full value on hover/tooltip.
- Sorting: chevron icon in the header, active column in `--rwe-blue`. Row actions are right-aligned and visible on hover/focus, plus a "more" menu for touch.
- Pagination or virtual scroll above 100 rows. Show total count and units of the dataset.

### 5.4 Cards and panels

- Fill `--bg-surface`, 1px `--border-default`, radius 8, padding 16, no shadow by default.
- Header: title `--heading-xs` or `--heading-sm`, optional secondary text and right-aligned actions, bottom border only if the body scrolls.
- KPI card: label (`--text-sm`, secondary), value (`--heading-lg` or `--display`), unit, delta chip, optional sparkline. Height 96 to 120px.

### 5.5 Badges, chips, tags

- Height 20px (badge) or 24px (chip), radius 4 (pill for status), padding 0 8px, `--text-xs` weight 500.
- Status badge = semantic tint background + semantic text + icon or dot. Never green-on-green with low contrast: use the pairs in §2.3.

### 5.6 Navigation

- Top bar items 36px; tabs 40px with a 2px `--rwe-blue` bottom indicator (active) and `--text-secondary` inactive text; breadcrumbs `--text-sm` with `/` separators.
- Side navigation: see §4.2. Group labels as 11 to 12px overline.

### 5.7 Overlays

- **Modal:** width 480 (default) / 640 / 800, radius 12, padding 24, scrim `rgba(11,37,69,0.5)`, title `--heading-md`, footer actions right-aligned (primary right-most).
- **Drawer:** 400 to 560px from the right, radius 0 on the attached edge.
- **Popover/dropdown:** radius 8, elevation 2, item height 32, item padding 0 12px.
- **Tooltip:** `#0B2545` fill, white text `--text-xs`, radius 4, 8px padding, 300ms delay. Not for essential information.
- **Toast:** bottom-left, 360px wide, elevation 2, semantic icon and text, auto-dismiss 5s (errors persist until dismissed), with an `aria-live` region.

### 5.8 Feedback

- Loading: skeleton blocks in `--bg-subtle` for known layouts, 16px spinner (stroke `--rwe-blue`) for actions. Never block the whole screen for partial loads.
- Empty states: icon or energy-field illustration (§9), one-line title (`--heading-sm`), one line of help text, one primary action. Centered, max width 360px.
- Errors: say what happened and what to do; include a retry action; keep the technical detail in an expandable section.

---

## 6. Iconography

- RWE uses a custom set of 200+ geometric icons matching the RWE Sans construction. If RWE supplies it, **use it**. Otherwise use a geometric outline set with similar character (Lucide or Phosphor "regular"), and do not mix sets.
- Sizes: 16px (inline, dense), 20px (default UI), 24px (nav, empty states). Stroke 1.5px, rounded caps and joins.
- Color: `currentColor`. Default `--text-secondary`; active/primary contexts `--rwe-blue`; positive `--green-700`. Icons carrying meaning need an accessible name or adjacent text.

---

## 7. Motion

- Durations: 100ms (hover, press), 150 to 200ms (menus, tabs, toggles), 250 to 300ms (drawers, modals). Never above 400ms in the app shell.
- Easing: `cubic-bezier(0.2, 0, 0, 1)` for entering, `cubic-bezier(0.4, 0, 1, 1)` for exiting.
- Animate opacity and transform only. Respect `prefers-reduced-motion: reduce` by removing transforms and keeping only opacity fades ≤ 100ms.
- Charts may animate on first load (≤ 400ms) but must not re-animate on every refresh.

---

## 8. Data visualization specifics

- Chart title `--heading-xs`, subtitle `--text-sm` secondary, units in axis titles.
- Axis text 12px `--text-secondary`; gridlines 1px `--rwe-mist`; zero-baseline line `--border-strong`.
- Line width 2px, points hidden until hover, area fills at 12 to 16% opacity of the series color.
- Bars: radius 2px on the free end only, minimum 8px bar width, gap ≥ 4px.
- Tooltips follow §5.7, list all series at the hovered x with color chip, name, value + unit, tabular figures.
- Legend: top-left, inline, clickable to toggle a series, with visible focus.
- Every chart has a text alternative or a data-table toggle.
- Time series: mark forecasts with dashed lines and lighter fill; mark missing data with gaps, never zeros.

---

## 9. The "energy field" motif (use sparingly)

RWE's brand graphic is two overlapping, constantly changing "energy fields", built like topographic or weather-map contour lines.

In web apps:

- Allowed on: login screen, onboarding, empty states, and as a subtle 8 to 12% opacity background on a top-of-page banner or profile header.
- **Not allowed** behind tables, forms, charts or any text under 18px.
- Render as inline SVG or CSS background, colors from `--rwe-blue` and `--rwe-green` at low opacity, max 2 fields per view.
- Photography: do not use hero photography inside the app. In login/onboarding, people, nature and technology imagery may be used with the same treatment as the marketing site.

---

## 10. Logo usage in apps

- The RWE wordmark is three capital letters, soft and compact. Use official assets only. Never redraw, recolor or add effects.
- Top bar: wordmark left, 20 to 24px high. On a white top bar use the blue wordmark (`#1D4276`); on a blue top bar use the white version.
- Clear space: at least the height of the "R" on all sides. Minimum size: 16px height.
- Favicon/app icon: use the official RWE mark on brand blue or white background, as provided by the brand team.

---

## 11. Accessibility

- Target WCAG 2.2 AA. Text ≥ 4.5:1, large text and non-text UI ≥ 3:1. The token pairs in this document were computed to meet that, with the exceptions called out (decorative borders, disabled state).
- Focus visible on every interactive element, never removed. Focus order follows visual order. Skip-link to main content.
- Full keyboard operability for menus, tables (arrow-key navigation for grids), dialogs (focus trap, Esc closes, return focus).
- Hit targets ≥ 24×24 (WCAG 2.2), preferably 32px+; 40px on touch.
- Color is never the only carrier of meaning. Status = color + icon + text.
- Support browser zoom to 200% and text-only zoom; do not fix heights on text containers.
- Support `prefers-color-scheme`, `prefers-reduced-motion`, and `forced-colors` (use system colors for borders and focus).
- All strings localizable; allow 30% text expansion (German).

---

## 12. Content and tone

- Voice: clear, confident, open. Short sentences. Active voice. No marketing superlatives inside the app.
- Buttons are verbs ("Export data", "Save changes"). Error messages state cause and fix. Empty states explain what the area is for.
- Use "you" for the user, not "the user". Avoid exclamation marks.

---

## 13. Implementation tokens

### 13.1 CSS custom properties

```css
:root {
  /* Brand */
  --rwe-blue: #1d4276;
  --rwe-green: #00b38d;
  --rwe-mist: #c6d0dd;
  --rwe-navy: #0b2545;

  /* Surfaces */
  --bg-app: #f4f7fa;
  --bg-surface: #ffffff;
  --bg-subtle: #e8eef7;
  --border-default: #d6dde7;
  --border-strong: #8595aa;

  /* Text */
  --text-primary: #0b2545;
  --text-secondary: #5b6b80;
  --text-disabled: #8595aa;
  --text-on-brand: #ffffff;
  --text-on-green: #0b2545;

  /* Actions */
  --primary: #00b38d;
  --primary-hover: #00a37f;
  --primary-active: #009373;
  --link: #1d4276;
  --link-hover: #144d9c;
  --focus-ring: #4c86d6;
  --green-700: #00806a;
  --green-800: #006b58;

  /* Semantic */
  --success-fg: #005f4e;
  --success-bg: #e6f7f3;
  --success-border: #00b38d;
  --warning-fg: #93370d;
  --warning-bg: #fef3e2;
  --warning-border: #f0a92e;
  --danger-fg: #8b1a10;
  --danger-bg: #fdecea;
  --danger-border: #b42318;
  --info-fg: #1d4276;
  --info-bg: #e8eef7;
  --info-border: #4c86d6;

  /* Type */
  --font-sans:
    "RWE Sans", "Inter", system-ui, -apple-system, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  --font-mono:
    ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
  --text-xs: 12px/16px var(--font-sans);
  --text-sm: 13px/20px var(--font-sans);
  --text-base: 14px/20px var(--font-sans);
  --text-md: 16px/24px var(--font-sans);

  /* Space (4px grid) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  /* Shape */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Elevation */
  --shadow-1: 0 1px 2px rgba(11, 37, 69, 0.08);
  --shadow-2: 0 4px 12px rgba(11, 37, 69, 0.12);
  --shadow-3: 0 12px 32px rgba(11, 37, 69, 0.18);

  /* Controls */
  --control-s: 32px;
  --control-m: 36px;
  --control-l: 40px;
  --topbar-h: 48px;
  --sidenav-w: 240px;
  --sidenav-w-collapsed: 56px;

  /* Motion */
  --dur-fast: 100ms;
  --dur-base: 200ms;
  --dur-slow: 300ms;
  --ease-in: cubic-bezier(0.2, 0, 0, 1);
  --ease-out: cubic-bezier(0.4, 0, 1, 1);
}

/* Dark theme: explicit toggle */
:root[data-theme="dark"] {
  --bg-app: #0b1b33;
  --bg-surface: #152a4a;
  --bg-subtle: #1d3560;
  --border-default: #2a4470;
  --text-primary: #e6ebf2;
  --text-secondary: #9fb0c6;
  --primary: #3fd3b0;
  --text-on-green: #0b1b33;
  --link: #8fb4eb;
  --focus-ring: #8fb4eb;
}

/* Dark theme: follow the OS unless the user chose light */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-app: #0b1b33;
    --bg-surface: #152a4a;
    --bg-subtle: #1d3560;
    --border-default: #2a4470;
    --text-primary: #e6ebf2;
    --text-secondary: #9fb0c6;
    --primary: #3fd3b0;
    --text-on-green: #0b1b33;
    --link: #8fb4eb;
    --focus-ring: #8fb4eb;
  }
}
```

### 13.2 Tailwind (excerpt)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        rwe: {
          blue: "#1D4276",
          green: "#00B38D",
          mist: "#C6D0DD",
          navy: "#0B2545",
        },
        app: { bg: "#F4F7FA", surface: "#FFFFFF", subtle: "#E8EEF7" },
      },
      fontFamily: { sans: ['"RWE Sans"', "Inter", "system-ui", "sans-serif"] },
      fontSize: {
        xs: ["12px", "16px"],
        sm: ["13px", "20px"],
        base: ["14px", "20px"],
        md: ["16px", "24px"],
        lg: ["20px", "28px"],
        xl: ["24px", "32px"],
        "2xl": ["32px", "40px"],
      },
      borderRadius: { sm: "4px", md: "8px", lg: "12px" },
      spacing: { 18: "72px" }, // keep the default 4px scale; add only what is needed
    },
  },
};
```

---

## 14. Do and don't

**Do**

- Use navy text on green fills, white text on blue fills.
- Keep one primary button per view.
- Use borders and tint to separate areas; use shadows only for floating layers.
- Format every number with locale, unit and consistent decimals.
- Keep density switchable (S/M/L) for power users.

**Don't**

- Don't put white text on `#00B38D`.
- Don't use marketing-scale headings (above 32px), large section gaps or hero imagery in the app.
- Don't use green for decoration, only for primary actions, positive state and renewable/positive data.
- Don't mix icon sets or stroke widths.
- Don't invent new blues or greens. Extend via the tokens above.
- Don't ship the derived tokens as "official RWE": mark them as app-system tokens until confirmed by the RWE brand team.

---

## 15. Open questions for the brand owner

1. Official green and light-grey hex values (aggregator values used here).
2. RWE Sans web-font license and the allowed weights for product UIs.
3. Official icon library and license for internal apps.
4. Official semantic colors (success/warning/danger) if RWE defines them.
5. Approved dark theme, if any.
6. Whether internal tools may use the top bar in brand blue, or must stay on white.

---

## Sources

- RWE press release "Transparent, friendly & approachable: new branding shows off the new RWE" (2019): https://www.rwe.com/en/press/rwe-ag/2019-09-30-new-branding-shows-off-the-new-RWE/
- BrandColorCode, RWE (blue `#1D4276`): https://www.brandcolorcode.com/rwe
- logotyp.us, RWE logo and colors: https://logotyp.us/logo/rwe/
- Brandfetch, RWE brand assets (green `#00B38D`, `#C6D0DD`, `#1D4477`): https://brandfetch.com/group.rwe
- Wondermake, RWE Sans case study: https://fonts.wondermake.xyz/case-studies/rwe
- typografie.info, RWE house typeface: https://www.typografie.info/3/hausschriften.html/rwe-r841/
- Studio SV87, RWE redesign (energy fields, icons): https://studio-sv87.com/RWE-Redesign
