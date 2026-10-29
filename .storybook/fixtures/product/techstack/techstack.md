---
status: confirmed
updated: 2026-10-14
---

# Tech Stack

## Summary

Customer portal prototype on the default shadcn/ui stack. The export targets an existing Next.js codebase.

## Decisions

| Area | Choice | Source | Rationale |
|------|--------|--------|-----------|
| framework | React 19 + Vite | default | Runtime of the Design OS prototype |
| ui-library | shadcn/ui | default | Default; the target codebase already uses it |
| ui-base | Base UI | chosen | The target codebase moved off Radix |
| icons | lucide-react | default | |
| forms | react-hook-form + zod | existing | Used in the target codebase |
| charts | Recharts | chosen | shadcn charts are built on it |
| state | none | chosen | useState and context are enough |
| target-framework | Next.js 15 (App Router) | existing | Export is integrated there |

## Registries and Repos

| Name | Kind | Location | Used for |
|------|------|----------|----------|
| @acme | shadcn-registry | https://registry.acme.test/{name}.json | Internal form components |
| acme/portal | github-repo | https://github.com/acme/portal | Reference for existing patterns |

## Packages

| Package | Purpose | Area |
|---------|---------|------|
| react-hook-form | Form state | forms |
| zod | Schema validation | forms |
| recharts | Charts | charts |

## Constraints

- Server components in the target app: exported components that use state carry `'use client'`
- No new UI libraries beyond shadcn/ui

## Open Questions

- Does the target codebase use the `new-york` style?
