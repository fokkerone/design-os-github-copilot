# Templates

A template is the look of a prototype, kept apart from the Design OS UI. Today it is a theme:

```
templates/<id>/
├── theme.css       # Tailwind v4 theme: palettes, semantic variables (--primary, ...), dark variant, base layer
└── template.json   # id, name, description, fonts (loaded by the preview), ui style and icon library
```

The prototype preview (`preview.html` → `src/preview/preview.css`) imports one theme through the
slot `designos:prototype-theme` (`scripts/prototype-theme.mjs`):

1. `product/design-system/tokens/tokens.css`, when the product has imported tokens (`npm run tokens:build`),
2. else `templates/<id>/theme.css`, where `<id>` comes from `product/design-system/template.json`
   (`{ "template": "volta" }`), default `volta`.

The Design OS UI never loads a template; it has its own stylesheet (`src/styles/design-os.css`).

Rules for `theme.css`:

- no `@import "tailwindcss"` (the preview imports it), no `@source` (the preview scans the prototype),
- define the shadcn variables (`--background`, `--foreground`, `--primary`, ...) in `:root` and `.dark`
  and map them in `@theme inline`, so screens can use `bg-primary`, `text-muted-foreground`, ...,
- define the dark variant: `@custom-variant dark (&:where(.dark, .dark *));`.

Planned (see `docs/architecture/plan-split-tailwind.md`, phase C): `ui/` primitives in the template's
style, an optional `import/tokens.json`, and a command to switch the template of a product.
