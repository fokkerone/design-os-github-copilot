---
title: Design changes — Account
summary: Changes made to the Account screens and the shared Button and CardFooter with Live Edit, newest first, with the reason for each.
tags: [design-changes, capture]
sources: [wiki/raw/capture-2026-10-24-11-29.md, wiki/raw/capture-2026-10-24-15-42.md, wiki/raw/capture-2026-10-26-20-00.md, wiki/raw/capture-2026-10-26-20-01.md]
created: 2026-10-24
updated: 2026-10-26
provenance:
  extracted: ~85%
  inferred: ~10%
  ambiguous: ~5%
---

# Design changes — Account

## Summary
Every change made to this area through Live Edit (`/design-os:live-edit`): picked in the preview, discussed in the chat, applied to the source. Newest first. Read it before changing the same element again. Changes to the shared `Button` and `CardFooter` in `src/ui/` are recorded here because they were picked on the Profile screen, and they affect every screen.

## Changelog

### 2026-10-26 — Login › LoginForm › Button (Email me a sign-in link)
**Request:** "buttn as ouline" (Comment #2, plain request)
**Changed:** `src/sections/account/components/LoginForm.tsx:43` — `variant="ghost"` → `variant="outline"`
**Scope:** only this button; Sign in and the shared `Button` are unchanged
**Because:** The user chose the link button; the primary action stays filled.
**Source:** [[raw/capture-2026-10-26-20-01]]

### 2026-10-26 — Login › LoginForm › CardTitle
**Request:** "more pop" (Comment #1 on the CardTitle, /design-os:comment → /impeccable bolder)
**Changed:** `src/sections/account/components/LoginForm.tsx:16` — CardTitle `className` `text-lg` → `text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-300` (token: primary)
**Scope:** only this title; the shared `CardTitle` in `src/ui/card.tsx` is unchanged
**Because:** Larger, heavier and in the primary color makes the title the anchor of the card; at 24px bold the teal meets the 3:1 large-text contrast.
**Source:** [[raw/capture-2026-10-26-20-00]]

### 2026-10-24 — Login › LoginForm › Label (Email)
**Request:** "otline pregnanz" (Comment #2 on the Label, /design-os:comment → /impeccable colorize); the text is garbled, colorize was the command given
**Changed:** `src/sections/account/components/LoginForm.tsx:33` — Label `className` added `text-teal-600 dark:text-teal-300` (token: primary) (before: default `text-stone-900 dark:text-stone-50`; after: teal primary)
**Scope:** only the Email label; the Password label and the shared `Label` in `src/ui/label.tsx` are unchanged
**Because:** The user asked to colorize the label through the comment flow; the primary mirrors the Button's mapping, and the narrowest scope is the call site.
**Conflicts:** `text-teal-600` on white is about 3.8:1, below AA for 14px text; the user accepted it.
**Source:** [[raw/capture-2026-10-24-23-13]]

### 2026-10-24 — Login › LoginForm › CardDescription
**Request:** "make it pop" (Comment #1 on the CardDescription, /design-os:comment → /impeccable polish)
**Changed:** `src/sections/account/components/LoginForm.tsx:17` — CardDescription `className` added `font-medium` (before: default classes `text-sm text-stone-500 dark:text-stone-400`; after: same classes + `font-medium`)
**Scope:** only this usage; the shared `CardDescription` in `src/ui/card.tsx` is unchanged
**Because:** The user asked to make the helper text pop through the comment flow; the narrowest scope that fulfils the request is the call site.
**Conflicts:** none
**Source:** [[raw/capture-2026-10-24-21-02]]

### 2026-10-24 — Login › LoginForm › Button (Sign in)
**Request:** Inspector edit: `size` `sm` → `lg` on the Sign in submit button.
**Changed:** `src/sections/account/components/LoginForm.tsx:40` — Button `size="sm"` → `size="lg"` (h-8 px-3 → h-12 px-6 text-base); `className="w-full"` stays
**Scope:** only this button; the shared `Button` in `src/ui/button.tsx` is unchanged
**Because:** The user asked for the bigger Sign in button and applied the inspector edit through the live-edit flow; the edit was applied as listed with the narrowest scope.
**Conflicts:** none
**Source:** [[raw/capture-2026-10-24-15-42]]

### 2026-10-24 — Profile › ProfileForm › Button (Save): saved state
**Request:** "The status Saved is now 2 elements, the Save button and the check mark Saved. We want this state only in the button."
**Changed:** `src/sections/account/components/ProfileForm.tsx:52-63` — the Save button shows `Check` + "Saved" when `saved` is true and "Save" otherwise, with `aria-live="polite"`; the separate `<span role="status" className="… text-emerald-700 dark:text-emerald-300">` is removed
**Scope:** only the Profile screen
**Because:** One element for one state. `aria-live` keeps the announcement that `role="status"` gave. The saved state has no green success color any more (see open questions).
**Conflicts:** none
**Source:** [[raw/capture-2026-10-24-11-29]]

### 2026-10-24 — Profile › ProfileForm › Button (Save): inspector edits
**Request:** Inspector edits `leading-4`, `border-0`, `text-stone-50` → `text-white`, `dark:text-stone-900` → `dark:text-[oklch(28%_0.01016_260.7)]`, `border-neutral-100`, `dark:border-[oklch(27.07%_0.00918_285.77)]`, `rounded-md` → `rounded-full`.
**Changed:** `src/sections/account/components/ProfileForm.tsx:52-57` — className `rounded-full border-0 border-neutral-100 leading-4 text-white dark:border-[oklch(27.07%_0.00918_285.77)] dark:text-[oklch(28%_0.01016_260.7)]` on the Save button
**Scope:** only this Save button; the shared `Button` in `src/ui/button.tsx` is unchanged. Tokens: `popover` (text), `accent` (border).
**Because:** Inspector edits are applied as listed, with the narrowest scope. `border-0` hides the border colors, they are kept as listed.
**Conflicts:** `rounded-full` on Save against `rounded-md` on all other buttons (see the shared Button entry). DESIGN.md says no arbitrary values where a token exists; the `oklch` values stand for the tokens above. The user did not decide either point.
**Source:** [[raw/capture-2026-10-24-11-29]]

### 2026-10-24 — Shared CardFooter (all screens)
**Request:** "Move the buttons to the right."
**Changed:** `src/ui/card.tsx:33` — `flex items-center gap-2 px-5` → `flex items-center justify-end gap-2 px-5`
**Scope:** all card footers; `ReadingConfirmationCard` keeps `justify-center`, `ReadingReviewCard` now has its buttons on the right
**Because:** The user chose "all card footers" in the questionnaire. The saved state moved into the button, so nothing else sits in the Profile footer.
**Conflicts:** none
**Source:** [[raw/capture-2026-10-24-11-29]]

### 2026-10-24 — Profile › ProfileForm › CardFooter: button order
**Request:** "Swap the position of Save and Cancel." There is no Cancel on this screen; the user confirmed that Sign out and Save are meant.
**Changed:** `src/sections/account/components/ProfileForm.tsx:49-52` — Sign out (ghost) before Save (submit)
**Scope:** only the Profile screen; the DOM order changed, so the tab order follows
**Because:** Chosen over a visual-only swap with `flex-row-reverse`, which would leave Save first in the tab order.
**Conflicts:** none
**Source:** [[raw/capture-2026-10-24-11-29]]

### 2026-10-24 — Shared Button size and radius (all screens)
**Request:** "The buttons need more vertical padding and make them smaller", then "too round", "even more square", "more padding left and right, but not the ghost buttons". Before that, "make the buttons 100% round".
**Changed:** `src/ui/button.tsx:5-7` — `rounded-md` → `rounded-full` → `rounded-xl` → back to `rounded-md`; `:20` size `default` `h-10 px-4` → `h-auto px-5 py-3.5 text-xs`; `:22` compound variant `ghost` + `default` → `px-3`
**Scope:** all buttons (chosen in the questionnaire), so every screen, the shell and the export
**Because:** Smaller text and a taller button (about 44px) with more horizontal padding. The ghost button (Sign out) keeps the narrower `px-3`. The radius ends at `rounded-md` (token `md`, 4px) after `rounded-full` and `rounded-xl` were both too round.
**Conflicts:** none for the shared Button. The Save button on Profile is `rounded-full` through the inspector (see above).
**Source:** [[raw/capture-2026-10-24-11-29]]

## Open Questions
- [ ] Should the Save button follow the shared `rounded-md`, or should all buttons become round? ^[ambiguous]
- [ ] Does the saved state need a success color again (emerald), now that the green status element is gone?
- [ ] Should the arbitrary `oklch` values move to token utilities in the export?

## Related
- [[design-changes/meter-readings]] — changes to the Meter readings screens
- [[comments/account]] — the comment this change resolved
- `product/sections/account/spec.md` — the binding spec ("Saving shows a short confirmation")
