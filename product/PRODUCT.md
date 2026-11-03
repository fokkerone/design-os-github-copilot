# Product

<!-- impeccable:product-schema 1 -->
<!-- Written by the designos-product-md skill from the Design OS planning files. Read by impeccable through .agents/context/PRODUCT.md (npm run impeccable:context). Never run /impeccable init: change the sources and update this file with the skill. -->

## Platform

web

## Stack
shadcn/ui on Radix UI, lucide-react icons, export target Next.js 15 (App Router) (product/techstack/techstack.md). Prototype: React 19, Vite, Tailwind CSS v4.

## Users
- **Ana, the cautious first-timer** (primary). When the reminder arrives, she wants to submit the reading in one go, so she can stop worrying about the bill. Proto-persona: assumptions, not research (product/personas/cautious-first-timer.md).
- **Marta, the busy property manager** (secondary). When the billing deadline comes close, she wants to see which readings are still missing, so she can remind only those tenants. Proto-persona: assumptions, not research (product/personas/property-manager.md).

## Product Purpose
MeterMate is a small tenant portal for submitting yearly utility meter readings. A tenant opens the link from the reminder email, enters the value from the meter, checks it once more and gets a confirmation. Property managers see the history without chasing tenants by phone (product/product-overview.md).

## Operating Context
- Ana: phone, standing in front of the meter, dark basement, one hand free (product/personas/cautious-first-timer.md).
- Marta: desktop at the office, many interruptions (product/personas/property-manager.md).

## Capabilities and Constraints
- Sections: Meter Readings (submit, review, confirmation, history) and Account (sign in with the reminder link or a password, profile) (product/product-roadmap.md).
- Key flows: submit-meter-reading, browse-history (product/flows/).
- Constraint: exported components that use state carry `'use client'` (product/techstack/techstack.md).
- Open: does the target codebase use the `new-york` style?

## Evidence on Hand
No research or feedback exists yet. Everything about users is a proto-persona assumption (confidence low).

## Product Principles
- Validate the value before it is sent, and show it again for review (inferred from the overview and Ana's P2).
- Keep the previous reading visible next to the input (Ana's design implications).
- Confirm every submission, on screen and by email (overview, problem 3).
- Show status in lists so nobody has to open each item (Marta's P1).

## Accessibility & Inclusion
WCAG 2.2 AA (product/techstack/techstack.md). Situational: poor light and one-handed use (Ana), frequent context switches (Marta).
