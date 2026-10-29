# Storybook fixtures

Fictitious sample data for the Design OS UI stories. It is **not** a product and never the
prototype in `product/` or `src/sections`, `src/shell`, `src/ui`, `src/clickdummy`.

`.storybook/fixture-globs.ts` points every `import.meta.glob` of the loaders in `src/lib/` that
reads `/product`, `/product-plan`, `/wiki` or the prototype sources at the same path under this
folder. The loaders run unchanged and only ever see these files.

- `product/` mirrors the planning files of a sample project (meter readings).
- `wiki/` holds a few pages for the wiki views.
- `src/` holds stubs in place of screen designs, the shell and the clickdummy. Each one renders
  `prototype-placeholder.tsx`, so no prototype code reaches Storybook.
