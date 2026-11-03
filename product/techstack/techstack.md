---
status: confirmed
updated: 2026-10-14
---

# Tech Stack

## Summary

Test prototype on the default shadcn/ui stack with Radix UI. The export targets an existing Next.js codebase.

## Decisions

| Area | Choice | Source | Rationale |
|------|--------|--------|-----------|
| framework | React 19 + Vite | default | Runtime of the Design OS prototype |
| ui-library | shadcn/ui | default | Default |
| ui-base | Radix UI | default | Default |
| icons | lucide-react | default | |
| forms | none | chosen | Plain React state is enough for two forms |
| charts | none | chosen | No charts in this prototype |
| state | none | chosen | useState is enough |
| target-framework | Next.js 15 (App Router) | chosen | Export is integrated there |

## Registries and Repos

| Name | Kind | Location | Used for |
|------|------|----------|----------|

## Packages

| Package | Purpose | Area |
|---------|---------|------|

## Constraints

- Exported components that use state carry `'use client'`

## Open Questions

- Does the target codebase use the `new-york` style?
