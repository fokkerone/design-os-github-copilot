---
title: Design changes — Meter readings
summary: Changes made to the Meter readings screens with Live Edit, newest first, with the reason for each.
tags: [design-changes, capture]
sources: [wiki/raw/capture-2026-10-23-17-01.md, wiki/raw/capture-2026-10-24-11-29.md, wiki/raw/capture-2026-10-27-08-05.md, wiki/raw/capture-2026-11-03-08-06.md, wiki/raw/capture-2026-11-03-14-50.md]
created: 2026-10-23
updated: 2026-11-03
provenance:
  extracted: ~90%
  inferred: ~10%
  ambiguous: ~0%
---

# Design changes — Meter readings

## Summary
Every change made to this area through Live Edit (`/design-os:live-edit`): picked in the preview, discussed in the chat, applied to the source. Newest first. Read it before changing the same element again.

## Changelog

### 2026-11-03 — ReadingConfirmation › ReadingConfirmationCard › CardContent › ShieldCheck
**Request:** "other icon animation" (Comment #2 on the ReadingConfirmation card, /design-os:comment → /impeccable animate)
**Changed:** `src/sections/meter-readings/components/ReadingConfirmationCard.tsx:8-16,25` — new `ICON_CLASSES`: the shield scales from 50% and fades in (`transition duration-500 ease-out starting:scale-50 starting:opacity-0`), then the check draws itself (second path, `stroke-dasharray` 6, `stroke-dashoffset` 6 → 0, 400 ms, 300 ms delay); with `motion-reduce:` only the fade stays
**Scope:** only this icon; plays once on arrival, no loop; shared primitives unchanged
**Because:** The user picked "shield pops in, check draws" over a plain pop-in and a pulse ring. They asked for `tw-animate-css`, but the tech stack leaves animation undecided, so the motion uses Tailwind `starting:` and `transition` utilities and adds no dependency; an animation library is recorded with `/design-os:techstack update`.
**Conflicts:** tw-animate-css requested, stack has no animation decision (not applied)
**Source:** [[raw/capture-2026-11-03-14-50]] · [[comments/meter-readings]]

### 2026-11-03 — ReadingConfirmation › ReadingConfirmationCard › CardContent
**Request:** "other icon harden design" (Comment #1 on the ReadingConfirmation card, /design-os:comment → /impeccable harden)
**Changed:** `src/sections/meter-readings/components/ReadingConfirmationCard.tsx:15` — `CircleCheck` → `ShieldCheck`; `:13` `Card role="status"` so the confirmation is announced; `:8-10,17-21` value, date and reference are shown only when valid (copy falls back to "We saved your reading.", the reference line is dropped when empty, reference `break-all`); `:24` button `max-w-full text-center whitespace-normal`. Shared `src/ui/card.tsx`: `:9` `Card` `min-w-0`, `:29` `CardContent` `min-w-0 break-words`, `:33` `CardFooter` `flex-wrap`
**Scope:** the icon, role, fallbacks and button only on this card; the three `Card` safeguards reach every card in the prototype (Login, Profile, ReadingForm, ReadingReview, ReadingHistory, ReadingConfirmation)
**Because:** The user picked `ShieldCheck`, the hardening areas Screen reader, Missing data and Button, and the scope "all cards". Long-text wrapping was not picked for the card itself, so it lives only in the primitive.
**Conflicts:** none
**Source:** [[raw/capture-2026-11-03-08-06]] · [[comments/meter-readings]]

### 2026-10-27 — ReadingHistory › ReadingHistoryList › rows
**Request:** "zebra" (Comment #1 on the ReadingHistory card, /design-os:comment → /impeccable colorize)
**Changed:** `src/sections/meter-readings/components/ReadingHistoryList.tsx:37` — list rows `even:bg-stone-50 dark:even:bg-stone-800/40` (token: muted); `:41` hover/focus `hover:bg-stone-50` → `hover:bg-stone-100`, `dark:hover:bg-stone-800/60` → `dark:hover:bg-stone-800`
**Scope:** only the reading list in this card; the shared `Card` in `src/ui/card.tsx` is unchanged
**Because:** The user chose neutral stripes over a teal tint, so the status badges stay the only color in the list; hover went one step darker to stay visible on striped rows.
**Source:** [[raw/capture-2026-10-27-08-05]] · [[comments/meter-readings]]

### 2026-10-24 — ReadingForm › Card
**Request:** Inspector edit: `color` `text-stone-900` → `text-orange-700`.
**Changed:** `src/sections/meter-readings/components/MeterReadingForm.tsx:15` — `w-full` → `w-full text-orange-700`
**Scope:** only the ReadingForm card; the shared `Card` in `src/ui/card.tsx` is unchanged. Light mode only, `dark:text-stone-50` stays. Parts with their own color class (description, teal header, info line) keep it.
**Because:** Inspector edits are applied as listed, with the narrowest scope.
**Conflicts:** none
**Source:** [[raw/capture-2026-10-24-11-29]]

### 2026-10-24 — ReadingConfirmation › ReadingConfirmationCard › CircleCheck
**Request:** "Make the icon bigger", then "a bit smaller".
**Changed:** `src/sections/meter-readings/components/ReadingConfirmationCard.tsx:11` — `size-12` → `size-16` (tried `size-20` first)
**Scope:** only this icon
**Because:** The user first picked `size-20` (80px) in the questionnaire, then found it too big. `size-16` (64px) is the result.
**Conflicts:** none
**Source:** [[raw/capture-2026-10-24-11-29]]

### 2026-10-24 — Shared Button and CardFooter (all screens)
Changes to the shared primitives also reach the meter-readings screens (ReadingForm, ReadingReview, ReadingConfirmation). They are recorded once in [[design-changes/account]]: button size `h-auto px-5 py-3.5 text-xs`, radius `rounded-md`, and `CardFooter` with `justify-end` (the confirmation card keeps `justify-center`).

### 2026-10-23 — ReadingForm › CardTitle › h3
**Request:** "Make this title bigger, use the inspector size." Inspector edit: `font-size` `text-lg` → `text-2xl` (1.5rem).
**Changed:** `src/sections/meter-readings/components/MeterReadingForm.tsx:21` — `text-lg` → `text-2xl`
**Scope:** only this element ("Submit your reading"); the shared `CardTitle` in `src/ui/card.tsx` and the other card titles are unchanged
**Because:** Narrowest scope that fulfils the request. Same size at every breakpoint and in both color modes (font size has no `dark:` variant); `text-2xl` is on the DESIGN.md type scale.
**Conflicts:** none
**Source:** [[raw/capture-2026-10-23-17-01]]

## Related
- [[design-changes/account]] — shared Button and CardFooter changes
- `product/sections/meter-readings/spec.md` — the binding spec
