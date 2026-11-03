---
title: Penpot sync
summary: Build the prototype in Penpot through its MCP server from the Design System page. Tokens, components and one board per screen, viewport and mode, compared with the browser.
tags: [how-to, penpot]
sources: [scripts/penpot/, src/components/penpot/PenpotSyncPanel.tsx, src/lib/penpot/client.ts]
created: 2026-11-03
updated: 2026-11-03
---

# Penpot sync

## Summary
The Penpot panel on the Design System page turns the running prototype into a Penpot file: design tokens, library components, and a board for each screen in desktop and mobile, light and dark. Measurements come from the real browser. It only goes from code to Penpot.

## Set up
1. In Penpot, open **Your account › Integrations › MCP Server**, turn it on and create a key.
2. In Penpot, open **Your account › Access tokens** and create a token.
3. Put both into `.env.local` (see `.env.example`): `PENPOT_URL`, `PENPOT_MCP_KEY`, `PENPOT_ACCESS_TOKEN`. Restart `npm run dev`. The keys stay on the server.

## Sync
1. Run `npm run dev` and open **Design System**.
2. Click **Create Penpot file**, then **Open in Penpot**.
3. In Penpot choose **File › MCP Server › Connect**. Keep the tab visible, ideally in its own window: a browser suspends hidden tabs, and the sync stops. Do not click around in the file while it runs.
4. Wait a few seconds: the panel notices the connection by itself and enables the sync buttons. **Refresh** checks right away.
5. Click **Sync**: it runs tokens, components and all sections, with a progress bar and the current step. **Sync tokens**, **Sync components** and **Sync** next to a section do only part of it; a section sync still updates tokens and components first.

The bar moves by steps done, not by time, so it can pause on a long step.

Every run arranges the `Components` page in rows sorted by name, so moving components there by hand does not last.

**A run stopped?** The message says at which step and why. Finished work stays in the file, so click **Sync** again and it continues from there. A variant group that fails does not stop the run: the report lists it under "not grouped", and the next run repairs it.

**Deleted the file in Penpot?** Click **Refresh**. The panel says the file is gone and offers **Create Penpot file** again; the new file replaces the link and the old report. Then sync everything once more.

The first component sync takes the longest, around ten minutes for a hundred variants. Later runs only build what changed.

## What you get
- **Tokens:** sets `designos/*`, all active. Penpot themes are not used, because light and dark boards sit side by side in one file.
- **Page Components:** `src/ui/` and the components of sections and the shell, grouped as variants with `viewport`, `mode` and `state`.
- **Page Section: `<id>`:** one row per screen with one board per viewport and mode.

## Read the report
- **Layout offsets:** top-level shapes of a board more than half a pixel away from the browser. This should be 0. Shapes inside an instance are covered by the picture comparison only.
- **Differing pixels outside text:** the picture comparison, the check that counts. It should be close to 0. Soft shadows and icon edges can leave a small rest.
- **Text:** Penpot and Chrome smooth glyphs differently, so text never matches pixel by pixel.
- **Values without a token:** a value in the code that has no token. Fix it in the code or add the token. The shape keeps the exact value until then.

## Limits
- Changes made by hand on section boards are overwritten by the next sync.
- Only the state a screen shows on load is captured, without hover or focus.
- Boards use absolute positions, so they do not reflow when you resize them.
- Penpot has no token for gradients, blur effects and shadows with a negative spread.
- Background images, images and pseudo-elements are not rebuilt; the report lists them.
