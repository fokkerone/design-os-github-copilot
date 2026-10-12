---
title: Design Tokens
summary: Import W3C DTCG design tokens (for example a Figma variables export) with Style Dictionary into a Tailwind v4 theme in OKLCH, a normalized token model and one merged DESIGN.md. Same input, same output.
tags: [how-to, design-system]
sources: [scripts/design-tokens/pipeline.mjs]
created: 2026-10-12
updated: 2026-10-12
---

# Design Tokens

## Summary
The token import is the alternative to the design system interview. You drop exported files into one folder, run one command, and Design OS shows the result on the Design page. Nothing is edited by hand, and the build is **deterministic and idempotent**: the same inputs always produce byte-identical outputs, and running it again changes nothing.

## When to use it
Your design system already lives in Figma (variables, styles) or another tool that exports W3C DTCG tokens. Use the `@03-design-system` agent (`/design-tokens`) instead when you want to define colors and fonts in a conversation.

## Step by step

1. **Export.** From Figma, export the variables as DTCG `tokens.json`. Optional: the style export `DESIGN.md` (gradients, text styles, effects, component families) and the typeui `skill.md` (mission, rules, accessibility, tone).
2. **Import.** Put the files into `product/design-system/import/`. File names are matched case-insensitively; `tokens.json` is required.
3. **Build.** Run `npm run tokens:build`. Style Dictionary reads the tokens, classifies each one, converts hex to OKLCH and px to rem, and writes:

   | Output | Purpose |
   |--------|---------|
   | `product/design-system/tokens/tokens.css` | Tailwind CSS v4 theme: `:root` / `.dark` runtime variables, `@theme inline`, `@theme` |
   | `product/design-system/tokens/tokens.json` | Normalized model (`designos-tokens/v1`); the only file the app reads |
   | `product/design-system/DESIGN.md` | Merged guide: tokens + DESIGN.md + skill.md + import report |

4. **Review.** Open `/design`. Tabs: Color, Typography, Spacing & layout, Effects, Guidelines, Import report. Toggle OKLCH / HEX, click any value to copy it. Semantic colors show light and dark side by side with the WCAG contrast of each foreground pair.
5. **Fix at the source.** The Import report lists warnings (for example a dark value without a light value). Fix them in Figma or `tokens.json`, export again and rebuild. If the inputs change without a rebuild, the Design page shows "Out of date".
6. **Verify.** `npm run tokens:check` fails if any output is stale (use it in CI). `npm run test:tokens` runs the contract tests (golden files, key-order independence, line endings, idempotence, Tailwind compile).

## How tokens are mapped

| DTCG source | Becomes | Tailwind utility |
|-------------|---------|------------------|
| `theme.<name>` / `theme.<name>-dark` | semantic color with light/dark | `bg-primary`, `text-primary-foreground` |
| `colors.<palette>.<step>` | palette color (OKLCH) | `bg-zinc-500` |
| `opacity.<role>.<step>` (color) | alpha color | `bg-primary-alpha-10` |
| `custom.<name>` | custom color | `bg-backdrop-overlay` |
| `font family.font-<k>` | font stack | `font-sans` |
| `typography.font-size` + `line-height` | type scale | `text-sm` |
| `typography.font-weight` | weight (Tailwind names) | `font-semibold` |
| `spacing.*` | `--spacing` base + off-grid steps | `p-4`, `gap-2` |
| `border radius.*` | radius | `rounded-md` |
| `Light/Dark.box-shadow.<role>.<size>` | shadow with light/dark | `shadow-sm`, `shadow-primary-md` |
| `breakpoints.*` | breakpoint | `md:` |

Strict import: every Tailwind namespace the import provides is reset first (`--color-*: initial`), so only imported tokens exist as utilities. Tokens without a Tailwind namespace (sizing, opacity scale, layout widths, decomposed Figma shadow parts) are documented in DESIGN.md and the model, with a reason, and are not emitted to CSS. No token is dropped silently.

## Separation from Design OS
Design OS has its own theme (stone/lime, `src/index.css`); the product has the imported tokens. They never mix:

- The Design OS app reads product tokens only as data (`src/lib/design-tokens-loader.ts`) and shows them with inline values. It never loads `tokens.css`.
- Screen designs, the shell and the clickdummy never use Design OS semantic utilities (`bg-primary`, `text-muted-foreground`, ...) or Design OS components — inside Design OS these would show the Design OS theme. They use the palette steps from DESIGN.md plus a `token:` comment.
- `tokens.css` is applied only in the exported codebase. `npm run test:tokens` enforces all of this.

## Rules
- Never edit `tokens/` or `DESIGN.md` by hand. Edit the inputs, then rebuild.
- `tokens.json` is the single source of token values. Token lists inside the Figma `DESIGN.md` and `skill.md` are superseded; only guidance without a DTCG equivalent is merged.
- Determinism: no timestamps, sorted output, fixed number precision (OKLCH lightness 2, chroma 5, hue 2 decimals: every 8-bit hex converts back exactly).

## Related
- [[how-to/planning-flow]]
- [[how-to/getting-started]]
