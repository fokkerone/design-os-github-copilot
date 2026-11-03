---
title: Comments — Meter Readings
summary: Numbered comments on the Meter Readings screens, each with an impeccable command, its status and what was done about it.
tags: [comments]
section: meter-readings
created: 2026-10-27
updated: 2026-11-03
---

# Comments — Meter Readings

## Summary
Comments made on the preview (Comment mode, `C`): a numbered pin on an element, the request and the impeccable command to run on it. Written by Design OS and by `/design-os:comment`; status `open` → `sent` → `resolved`. Do not renumber: a number stays with its comment.

## ReadingHistory
<!-- last-number: 1 -->

### #1 · colorize · resolved
**Element:** <Card> in ReadingHistoryList
**Anchor:** `src/ui/card.tsx:7:5` #0 @ 54.5%,18%
**Created:** 2026-10-27

> zebra

**Resolved:** 2026-10-27 — zebra rows `even:bg-stone-50 dark:even:bg-stone-800/40`, hover one step darker, `src/sections/meter-readings/components/ReadingHistoryList.tsx:37`. See [[design-changes/meter-readings]].

## ReadingConfirmation
<!-- last-number: 2 -->

### #1 · harden · resolved
**Element:** <CardContent> in ReadingConfirmationCard
**Anchor:** `src/ui/card.tsx:29:10` #0 @ 47.6%,24%
**Created:** 2026-11-03

> other icon harden design

**Resolved:** 2026-11-03 — `ShieldCheck` icon, card as `role="status"`, fallbacks for missing value, date and reference, wrapping button, and `min-w-0` / `break-words` / `flex-wrap` on the shared card, `src/sections/meter-readings/components/ReadingConfirmationCard.tsx:15`. See [[design-changes/meter-readings]].

### #2 · animate · resolved
**Element:** <CardContent> in ReadingConfirmationCard
**Anchor:** `src/ui/card.tsx:29:10` #0 @ 45.9%,25%
**Created:** 2026-11-03

> other icon animation

**Resolved:** 2026-11-03 — shield pops in, then the check draws itself, once, reduced motion keeps the fade only; Tailwind `starting:` utilities, no dependency, `src/sections/meter-readings/components/ReadingConfirmationCard.tsx:8`. See [[design-changes/meter-readings]].
