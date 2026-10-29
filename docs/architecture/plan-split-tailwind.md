# Zwei Tailwind-Setups: Design OS UI (shadcn-Preset) und Prototyp (Volta)

## Context

Heute laufen Design OS und der Prototyp in **einem** CSS-Kosmos. Der Vorschau-iframe lädt eine Route derselben SPA (`/prototype/.../fullscreen` → `src/main.tsx` → `src/index.css`). Damit bekommt der Prototyp Preflight, Base-Layer, `dark`-Variante und das Volta-Theme von Design OS. Die echten Produkt-Tokens (`product/design-system/tokens/tokens.css`) dürfen nie geladen werden, weil sie das App-Theme überschreiben würden. Deshalb arbeiten Screens mit Palettenstufen und Token-Kommentaren.

Ziel: **zwei vollständig getrennte Tailwind-Setups mit eigenem Look**, damit später komplett anders aussehende Apps und austauschbare Templates möglich sind.

- **Design OS UI** bekommt das shadcn-Preset `beqC8BzE` (decodiert: style `rhea`, baseColor/theme/chart `zinc`, font `inter`, icons `lucide`, radius `default`, menuAccent `subtle`).
- **Prototyp** (alles, was Design OS erstellt) bekommt das **aktuelle Volta-Theme**. Wenn ein Produkt eigene Tokens importiert hat, gelten stattdessen dessen `tokens.css`.
- Der erste Schritt ist die Trennung. Templates werden nur so vorbereitet, dass sie später als Theme-Slot andocken.

Basis ist der Worktree `feat/impeccable`. Gearbeitet wird auf einem neuen Branch `feat/split-tailwind`, abgezweigt von `feat/impeccable`.

Phase A (Trennung, Volta wandert zum Prototyp) und Phase B (Design OS auf das Preset) sind einzeln lauffähig und einzeln committbar. Phase C ist nur skizziert.

---

## Zielbild

```
index.html   → src/main.tsx      → src/styles/design-os.css   (Design OS, shadcn rhea/zinc)
preview.html → src/preview/main.tsx → src/preview/preview.css (Prototyp, Volta oder Produkt-Tokens)
```

| | Design OS UI | Prototyp-Vorschau |
|---|---|---|
| HTML-Entry | `index.html` | `preview.html` (neu, Vite Multi-Page) |
| JS-Entry | `src/main.tsx` | `src/preview/main.tsx` (neu) |
| Stylesheet | `src/styles/design-os.css`: `@import "tailwindcss" source(none)`, `@source ../components ../lib` | `src/preview/preview.css`: `@import "tailwindcss" source(none)`, `@source` auf `src/sections`, `src/shell`, `src/ui`, `src/clickdummy`, `src/preview` |
| Theme | shadcn-Preset `beqC8BzE` (zinc), Variablen in `design-os.css` | Theme-Slot `designos:prototype-theme` → `product/design-system/tokens/tokens.css`, sonst `templates/volta/theme.css` |
| Dark Mode | `@custom-variant dark` mit `.light`-Opt-out (App-Chrome) | die Variante aus dem Theme (`&:where(.dark, .dark *)`) |
| Komponenten | `src/components/ui` (shadcn, rhea) | `src/ui` (Produkt-Primitives) |
| Darf importieren | alles aus `src/components`, `src/lib` | nur Prototyp-Code + die Bridge-Allowlist (siehe A4) |

Ein Vite-Server, zwei Dokumente: ein Port, HMR pro Dokument, das Babel-Plugin von Live Edit gilt unverändert. Separate Server oder `package.json` pro Prototyp kommen erst mit Phase C.

---

## Phase 0: Spike (vor allem anderen, ca. 1 h)

Drei Annahmen prüfen, bevor gebaut wird:

1. **Theme-Slot:** `@tailwindcss/vite` löst ein `@import "designos:prototype-theme"` über einen Vite-`resolveId`-Hook bzw. Alias auf.
   - Fallback, falls nicht: ein Plugin schreibt `src/preview/theme.css` mit genau einer Zeile `@import "<pfad>";`. Die Datei wird generiert und ist gitignored.
2. **Zwei Entries:** Zwei CSS-Entries mit je `@import "tailwindcss" source(none)` erzeugen getrennte Ausgaben. Prüfen im Dev-Server und mit `vite build`.
3. **Klassen-Abdeckung:** Die strikte `tokens.css` (`--color-*: initial`, `--text-*: initial`, `--radius-*: initial` …) deckt die Klassen ab, die die bestehenden Screens benutzen.
   - Prüfen mit einem Skript über `@tailwindcss/node` (`compile()` + `build(candidates)`) und den Kandidaten aus `@tailwindcss/oxide` (`Scanner`).
   - Ergebnis: Liste der Klassen, die unter dem Produkt-Theme kein CSS erzeugen. Daraus wird in A7 ein dauerhafter Check.

---

## Phase A: Tailwind-Setups trennen, Volta wird Prototyp-Theme

### A1 Volta-Theme als erstes Template

- Neu: `templates/volta/theme.css`. Inhalt ist das heutige Volta-Theme als vollständiges Tailwind-v4-Theme:
  - die Paletten aus `src/app-theme.css` (`brand-blue-*`, `energy-blue-*`, `energy-green-*`, `rwe-*`),
  - die shadcn-Variablen `:root` und `.dark` aus `src/styles/design-os.css` (Zeilen ca. 63–140: sand/neutral, brand-blue und energy-green),
  - `@theme inline` mit den `--color-*`-Mappings,
  - `@custom-variant dark (&:where(.dark, .dark *));`,
  - Fonts (`--font-sans: "Inter"`, `--font-mono: "IBM Plex Mono"`),
  - Base-Layer (`body { bg-background text-foreground font-sans }`, Rahmenfarbe).
- Neu: `templates/volta/template.json` mit `{ id, name, description, fonts: [{ family, weights }], ui: { style, iconLibrary } }`. Das ist das Manifest für Phase C.
- Neu: `templates/README.md`. Es erklärt, was ein Template ist: ein Theme-Slot, später auch `ui/`-Primitives und ein Token-Import.
- Die Tailwind-Default-Paletten (`stone`, `teal` …) bleiben im Volta-Template erhalten. Es setzt **kein** `--color-*: initial`, damit bestehende Screens ohne Token-Import weiter rendern.
- `src/app-theme.css` bleibt in Phase A unverändert für Design OS. Erst Phase B entfernt den Import.

### A2 Theme-Slot-Plugin `scripts/prototype-theme.mjs` (neu)

- Löst `designos:prototype-theme` auf, mit dieser Priorität:
  1. `product/design-system/tokens/tokens.css`, wenn vorhanden (das Produkt hat Tokens importiert),
  2. sonst `templates/<id>/theme.css`. Die `<id>` steht in `product/design-system/template.json` (`{ "template": "volta" }`), Default ist `volta`.
- Watcher: Wird eine der Dateien angelegt, gelöscht oder umgeschaltet, gibt es einen gezielten Full-Reload **nur für `preview.html`**. Ändert sich die Datei nur, reicht normales CSS-HMR.
- Exportiert `resolvePrototypeTheme(root)` für Tests und Skripte.
- Getestet in `tests/prototype-theme.test.ts`: Priorität, Fallback, unbekanntes Template ergibt eine klare Fehlermeldung.

### A3 Vorschau-Entry

- `preview.html` (neu, Repo-Root): eigenes `<head>` ohne die Design-OS-Fonts. Fonts kommen aus dem Theme bzw. Template (A5). Inhalt: `<div id="root">` und `<script type="module" src="/src/preview/main.tsx">`.
- `src/preview/preview.css` (neu):
  ```css
  @import "tailwindcss" source(none);
  @import "designos:prototype-theme";
  @source "../sections";
  @source "../shell";
  @source "../ui";
  @source "../clickdummy";
  @source "./";
  ```
  Markierung für Bundle-Tests: `:root { --designos-scope: prototype; }`.
- `src/preview/main.tsx` (neu): importiert nur `./preview.css` und rendert `<PreviewApp />`. Kein `react-router-dom`.
- `src/preview/route.ts` (neu): Hash-Routen ohne Abhängigkeit.
  - `#/screen/<sectionId>/<screenName>`, `#/shell`, `#/clickdummy`
  - `parseRoute(hash)` und `routeHref(route)`, getestet in `tests/preview-route.test.ts`.
- `src/preview/registry.ts` (neu): der einzige Ort, der Prototyp-Komponenten importiert.
  - `import.meta.glob('/src/sections/*/*.tsx')`, `/src/shell/components/*.tsx`, `/src/shell/*.tsx`, `/src/clickdummy/ClickdummyApp.tsx`
  - `/product/sections/*/spec.md?raw` für `useShell`
  - Die Logik wird übernommen aus `loadScreenDesignComponent`, `sectionUsesShell` (`src/lib/section-loader.ts:126,166`), `loadAppShell` und `loadShellPreview` (`src/lib/shell-loader.ts:115,129`) sowie aus `ClickdummyFullscreen.tsx`.
- `src/preview/PreviewApp.tsx` (neu): ersetzt `ScreenDesignFullscreen` (`src/components/ScreenDesignPage.tsx:368`), `ShellDesignFullscreen` (`src/components/ShellDesignPage.tsx:43`) und `ClickdummyFullscreen`.
  - Inhalt: AppShell um den Screen, wenn die Section die Shell nutzt; `Suspense` und Fehlerzustände; `RenderComponent` als `src/preview/RenderComponent.tsx`.
  - Die Fehlertexte ohne Design-OS-Klassen: neutrale Klassen aus dem Prototyp-Theme (`text-muted-foreground`).
- `vite.config.ts`: `build.rollupOptions.input = { main: 'index.html', preview: 'preview.html' }` und das Plugin `prototypeTheme()`.

### A4 Preview-Bridge (Live Edit, Kommentare, Theme)

- `src/preview/bridge/` (neu): `useBridge()` ersetzt `useLivePicker()` (`src/components/live-edit/useLivePicker.ts`). Die Logik bleibt gleich: Picker, Kommentar-Overlay, `dos:ready` und `vite:afterUpdate`.
- Verschieben, ohne die Logik zu ändern: `src/lib/live-edit/{picker,comments-overlay,component-tree,prop-override}.ts` → `src/preview/bridge/`. Das sind reiner DOM-Code ohne CSS.
  - Imports anpassen in `tests/{prop-override,comments-overlay,component-tree}.test.ts`, `tests/components/live-edit.test.tsx` und `src/components/live-edit/CommentsOverlay.stories.tsx`.
  - Die Story importiert danach aus `@/preview/bridge/comments-overlay`. Den Storybook-Guard erweitern: `src/preview/bridge` ist erlaubt, Prototyp-Code nicht.
- Gemeinsamer Vertrag bleibt in `src/lib/live-edit/protocol.ts` (Typen + `readMessage`) und `src/lib/comments/{format,commands}.ts`.
- **Allowlist der Vorschau** (Guard in A8): `src/preview/**`, `src/sections/**`, `src/shell/**`, `src/ui/**`, `src/clickdummy/**`, `product/**` (Daten), `@/lib/live-edit/protocol`, `@/lib/comments/format`, `@/lib/comments/commands`, `@/lib/design-tokens-loader` (nur für Fonts), `@/lib/spec-parser` bzw. die Funktion, die `useShell` liest. **Nie** `@/components/*`, `src/styles/*`, `src/index.css`, `src/app-theme.css`, `react-router-dom`.
- **Theme-Sync neu:** Die Seite schickt `dos:theme { dark: boolean }` per postMessage, beim Laden und bei jedem Wechsel (neuer Message-Typ in `protocol.ts`). Die Bridge setzt `.dark` auf `<html>`.
  - Standalone (neuer Tab, Screenshot) gilt `localStorage['theme']` plus das `storage`-Event.
  - Das 100-ms-Polling in beiden Fullscreen-Komponenten entfällt.
- **Fonts:** `useProductFonts()` (`src/lib/product-fonts.ts`) wandert nach `src/preview/bridge/fonts.ts`.
  - Mit Produkt-Tokens wie bisher aus `loadDesignTokens()`, sonst aus `templates/<id>/template.json` über ein virtuelles Modul `virtual:designos-prototype-fonts` desselben Plugins.

### A5 Design-OS-Seiten auf die Vorschau umstellen

- `src/lib/paths.ts`:
  - `screenFullscreen(section, name)` → `/preview.html#/screen/<s>/<n>`
  - `shellFullscreen` → `/preview.html#/shell`
  - `previewFullscreen` → `/preview.html#/clickdummy`
  - Die Funktionsnamen bleiben, damit sich Aufrufer nicht ändern müssen.
- `src/lib/routes.tsx`: Die drei Fullscreen-Routen werden zu Redirects auf die neuen URLs (über `LegacyOrNotFound` bzw. `src/lib/navigation.ts:132,140`), damit alte Links und Screenshot-Befehle weiter funktionieren. `isFullscreenPath` bleibt für die Redirects.
- `ScreenDesignPage.tsx`, `ShellDesignPage.tsx`, `ClickdummyPage.tsx`: Fullscreen-Komponenten, `getLazy*`, `RenderComponent`-Import und die Loader-Imports von Komponenten entfernen. Der iframe zeigt auf `paths.*Fullscreen`.
  - `useLivePreview` und `useLiveComments` bleiben unverändert und schicken zusätzlich `dos:theme`.
- `src/components/RenderComponent.tsx` und `src/components/ClickdummyFullscreen.tsx` samt Stories löschen. Der Storybook-Test „Story pro Komponente“ bleibt grün, weil die Komponenten weg sind.
- **App-Loader importieren keine Prototyp-Module mehr:**
  - `section-loader.ts` (`screenDesignModules`), `shell-loader.ts` (`shellComponentModules`, `shellPreviewModules`) und `product-loader.ts` (`clickdummyFiles`) nutzen nur noch die Dateiliste.
  - Dafür `import.meta.glob(..., { query: '?url', import: 'default' })` oder `eager: false`, nur `Object.keys`.
  - `loadScreenDesignComponent`, `loadAppShell`, `loadShellPreview` und `loadShellComponent` werden aus den App-Loadern entfernt (sie leben in `src/preview/registry.ts`).
  - Die Funktionen für Namenslisten (`getSectionScreenDesigns`, `getShellComponentNames`, `hasShellComponents`, `hasClickdummy`) bleiben.
- `src/index.css` entfällt. `src/main.tsx` importiert `./styles/design-os.css`. `components.json` → `tailwind.css: "src/styles/design-os.css"`.

### A6 Live-Edit-Inspector liest das Prototyp-Theme

- `scripts/tailwind-theme.mjs` (`virtual:tailwind-theme`) liefert statt `tailwindcss/theme.css` die aufgelöste Theme-Datei aus `resolvePrototypeTheme()`, mit Tailwinds Default-Theme als Basis, wenn das Theme nicht strikt ist.
- Damit schlägt `src/lib/live-edit/token-class.ts` nur Klassen vor, die im Prototyp wirklich existieren.
- Test: `tests/token-class.test.ts` um den strikten Fall erweitern (`--color-*: initial`, dann gibt es keine Default-Palette).

### A7 Klassen-Abdeckung als Check

- `scripts/preview-classes.mjs` (neu) auf Basis des Spikes aus Phase 0. `npm run preview:check` meldet:
  - Klassen in Prototyp-Quellen, die unter dem aktiven Theme kein CSS erzeugen (Exit 1),
  - Design-OS-Klassen im Prototyp (`rwe-*` nur erlaubt, wenn das Theme sie definiert).
- Die Befehle `design-screen`, `design-shell` und `live-edit` rufen ihn nach dem Schreiben auf, mit einer Zeile in den Command-Dateien.

### A8 Guards (Tests) neu schneiden

`scripts/design-tokens/tests/separation.test.mjs`:
- **Neu:** `preview.css` importiert nur `tailwindcss` und `designos:prototype-theme` und scannt nur Prototyp-Quellen.
- **Neu:** `design-os.css` hat keine Prototyp-`@source`s (gibt es schon) und es gibt kein `src/index.css` mehr.
- **Neu:** Import-Graph der Vorschau. Ab `src/preview/main.tsx` statisch alle Imports auflösen (Babel-Parser wie in `scripts/ui-layer.mjs`). Jeder Import liegt in der Allowlist aus A4.
- **Neu:** Kein Modul unter `src/components` oder `src/lib` importiert `src/sections`, `src/shell`, `src/clickdummy` oder `src/ui` (außer Dateilisten-Globs mit `?url`).
- **Geändert:** „product code does not use Design OS semantic color utilities“ fällt weg. Im Prototyp lösen `bg-primary` & Co. jetzt auf das Prototyp-Theme auf und sind erlaubt (Grundlage für Phase C).
- **Geändert:** „Design OS app never loads the product tokens.css“ bleibt. Zusätzlich gilt: Nur `scripts/prototype-theme.mjs` referenziert `tokens.css`.

Bundle-Test `tests/build-separation.test.ts` (neu, läuft nach `vite build` in `npm run test:build`):
- Das CSS-Asset von `preview.html` enthält `--designos-scope: prototype`, aber nicht `--designos-scope: app`. Für `index.html` gilt das Umgekehrte. `design-os.css` bekommt dazu die Markierung `--designos-scope: app`.
- Die JS-Chunks von `index.html` enthalten keinen Code aus `src/sections`, `src/shell` oder `src/clickdummy`. Prüfung über das Rollup-Manifest (`build.manifest: true`): Kein Modul dieser Ordner hängt am `main`-Entry.

`tests/volta-content.test.ts` und die Volta-Tests in `separation.test.mjs` (`app chrome theme ...`, `dark variant ...`): In Phase A unverändert, weil Design OS noch Volta hat. Zusätzlich gilt: `templates/volta/theme.css` enthält dieselben Volta-Paletten wie `src/app-theme.css` (Drift-Schutz bis Phase B).

### A9 E2E, Befehle, Doku

- `e2e/navigation.spec.ts:72`: Die Fullscreen-Previews werden über `/preview.html#/…` geöffnet. Zusätzlich: Die alten `/…/fullscreen`-URLs leiten um.
- `e2e/layout.spec.ts:112`: Der Theme-Wechsel kommt per `dos:theme` in der Vorschau an.
- **Neu** `e2e/preview-isolation.spec.ts`: Im iframe-Dokument gibt es kein Stylesheet mit `--designos-scope: app`, `getComputedStyle(body).fontFamily` kommt aus dem Prototyp-Theme, und `bg-primary` im Prototyp ergibt die Volta- bzw. Token-Farbe, nicht die Design-OS-Farbe.
- `.claude/commands/design-os/screenshot-design.md:57` und die Agent-Dateien in `.github/agents/`: neue Vorschau-URL.
- `agents.md`: Abschnitte „Design System Scope“, „Token separation“ und „Live Edit“ an das Zwei-Setup-Modell anpassen, neuer Abschnitt „Prototype preview (`preview.html`)“.
- `docs/architecture/ui-prototype-separation.md`: Schritte 3–5 als erledigt markieren, Leck-Tabelle aktualisieren (L1, L2, L5, L6, L7, L10 geschlossen).
- `wiki/how-to/`: die Seite zu Live Edit (Vorschau-URL).

**Ergebnis von Phase A:** Design OS sieht aus wie heute (Volta). Die Vorschau läuft in ihrem eigenen Tailwind-Build mit Volta-Template bzw. den echten Produkt-Tokens (heute „Volta 3.0 Components“), ohne CSS aus Design OS.

---

## Phase B: Design OS UI auf das shadcn-Preset `beqC8BzE`

Der Befehl `pnpm dlx shadcn@latest init --preset beqC8BzE --template vite` legt ein **neues** Projekt an. Für das bestehende Repo nimmt man laut shadcn-CLI `apply` bzw. `init --preset … --force`. `--template vite` ergibt sich aus dem erkannten Framework (Vite).

### B1 Preset anwenden (nur Design-OS-Scope)

1. `components.json` prüfen: `tailwind.css` = `src/styles/design-os.css` (aus A5), `aliases.ui` = `@/components/ui`. Keine shadcn-Konfiguration für `src/ui`, der Produkt-Layer bleibt manuell portiert.
2. `pnpm dlx shadcn@latest init --preset beqC8BzE --force --no-reinstall` schreibt Config, Theme-Variablen (zinc) und Font in `design-os.css`.
3. Für die 16 installierten App-Komponenten (`avatar`, `badge`, `button`, `card`, `collapsible`, `dialog`, `dropdown-menu`, `input`, `label`, `resizable`, `select`, `separator`, `sheet`, `skeleton`, `table`, `tabs`) gilt je: `pnpm dlx shadcn@latest add <name> --dry-run`, dann `--diff`. Lokale Anpassungen werden gemergt, kein blindes `--overwrite`.
4. `design-os.css` aufräumen:
   - `@import "../app-theme.css"` entfernen; die Datei wird gelöscht, Volta lebt nur noch in `templates/volta/theme.css`.
   - Die Volta-Variablen `:root`/`.dark` werden durch die Preset-Variablen ersetzt.
   - `.light` wird zum `:root`-Selektor ergänzt (`:root, .light { … }`), damit der Hell-Bereich des App-Chromes in einer dunklen Seite weiter funktioniert.
   - `@custom-variant dark (&:is(.dark *):not(:is(.light *)))` bleibt.
   - Fonts: Inter (Preset) und IBM Plex Mono für Code. `index.html` lädt nur noch diese beiden.

### B2 Volta-Klassen in `src/components` ersetzen (59 Dateien, ca. 2000 Vorkommen)

Ein Codemod `scripts/codemods/volta-to-shadcn.mjs` arbeitet mit einer festen Mapping-Tabelle. Hell/Dunkel-Paare fallen zu einem semantischen Token zusammen, das passende `dark:`-Gegenstück wird entfernt. Was nicht eindeutig zuzuordnen ist, wird gemeldet und von Hand entschieden.

| heute (hell / `dark:`) | neu |
|---|---|
| `text-stone-900` / `dark:text-rwe-neutral-100`, `-50` | `text-foreground` |
| `text-stone-700`, `-800` / `dark:text-rwe-neutral-200`, `-300` | `text-foreground` |
| `text-stone-500`, `-600`, `-400` / `dark:text-rwe-neutral-400`, `-500` | `text-muted-foreground` |
| `border-stone-200`, `-300` / `dark:border-rwe-neutral-700`, `-800`; `divide-*` analog | `border-border` / `divide-border` |
| `bg-stone-50`, `-100` / `dark:bg-rwe-neutral-800`, `-800/50` | `bg-muted` |
| `hover:bg-stone-100` / `dark:hover:bg-rwe-neutral-800` | `hover:bg-accent hover:text-accent-foreground` |
| `bg-rwe-sand-25` / `dark:bg-rwe-neutral-950` | `bg-card` |
| `bg-rwe-sand-50` / `dark:bg-rwe-neutral-900` | `bg-background` |
| `text-brand-blue-500`, `-600` / `dark:text-energy-green-400`, `-500` | `text-primary` |
| `bg-brand-blue-500` / `dark:bg-energy-green-500` (+ `text-…-900`) | `bg-primary text-primary-foreground` |
| `bg-brand-blue-100` / `dark:bg-energy-green-900/30` | `bg-primary/10` |
| App-Chrome: `bg-rwe-sand-200`, `-500` / `dark:bg-rwe-neutral-950` (Sidebar) | `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`, `border-sidebar-border` |
| Status `red-*` | `text-destructive` / `bg-destructive/10` |
| Status `amber-*`, `emerald-*` | bleiben Tailwind-Paletten (erlaubt) |

- Reihenfolge: zuerst `src/components/app-shell/*` und `chat/*` (Chrome), dann Karten und Seiten, zuletzt `design-tokens/*`. Die Token-Seiten rendern Produktwerte inline und dürfen das weiter.
- Bekannte Muster aus der Volta-Content-Regel (`tests/volta-content.test.ts`) werden in Tests überführt: Akzent, Panel-Hintergrund und Rahmen kommen aus semantischen Tokens.

### B3 Guards für Design OS

- `tests/volta-content.test.ts` wird ersetzt durch `tests/design-os-theme.test.ts`:
  - `src/components` und `src/lib` enthalten keine `rwe-*`-, `brand-blue-*`-, `energy-*`- und `stone-*`-Klassen,
  - `design-os.css` importiert kein `app-theme.css`,
  - `components.json` hat `style: "rhea"`,
  - `src/app-theme.css` existiert nicht mehr.
- `separation.test.mjs`: Die Volta-Tests (`app chrome theme ...`, `Inter is loaded ...`) ziehen um. Volta wird jetzt für `templates/volta/theme.css` geprüft (Paletten vorhanden, dark-Variante vorhanden).
- Storybook: Alle Stories nach dem Umbau rendern. Render-Schleife wie zuvor, Sichtprüfung in hell und dunkel. Die Stories brauchen keine Änderung (`preview.css` → `design-os.css`).

### B4 Doku

`agents.md`, Abschnitt „Design System (Design OS Application)“: shadcn `rhea`/zinc, Inter, semantische Tokens. Volta-Hinweise wandern in „Prototype preview“ / Templates. `docs/architecture/ui-prototype-separation.md` bekommt einen Nachtrag.

---

## Phase C (Ausblick, nicht Teil dieser Umsetzung)

1. **Semantische Klassen als Prototyp-Konvention:**
   - `src/ui`, die Commands `design-screen` und `design-shell` und `export-product` stellen von Palettenstufen + `{/* token: primary */}` auf `bg-primary` & Co. um.
   - Das Export-Mapping entfällt, `tokens.css` bzw. `theme.css` geht 1:1 in den Export.
   - Erst dann ändert ein Template-Wechsel das Aussehen, ohne den Code der Screens anzufassen.
2. **Templates:**
   - `templates/<id>/` = `theme.css` + `template.json` + optional `ui/` (Primitives im Stil des Templates) + optional `import/tokens.json`.
   - Befehl `/design-os:template use <id>` schreibt `product/design-system/template.json`; der Theme-Slot schaltet um (A2).
3. **Mehrere Prototypen:** `prototypes/<id>/`, `virtual:designos-prototype` für die Loader (Schritte 6–10 im Bericht).

---

## Kritische Dateien

- **Neu:** `preview.html`, `src/preview/{main.tsx,preview.css,route.ts,registry.ts,PreviewApp.tsx,RenderComponent.tsx}`, `src/preview/bridge/*`, `scripts/prototype-theme.mjs`, `scripts/preview-classes.mjs`, `scripts/codemods/volta-to-shadcn.mjs`, `templates/volta/{theme.css,template.json}`, `templates/README.md`
- **Geändert:** `vite.config.ts`, `src/main.tsx`, `components.json`, `src/styles/design-os.css`, `src/lib/{paths,routes,navigation,section-loader,shell-loader,product-loader,live-edit/protocol}.ts`, `src/components/{ScreenDesignPage,ShellDesignPage,ClickdummyPage}.tsx`, `src/components/live-edit/{useLivePreview,useLiveComments}.ts`, `scripts/tailwind-theme.mjs`, 59 Dateien in `src/components` (Phase B)
- **Entfernt:** `src/index.css`, `src/app-theme.css` (Phase B), `src/components/{RenderComponent,ClickdummyFullscreen}.tsx` (+ Stories), `src/components/live-edit/useLivePicker.ts`
- **Tests:** `scripts/design-tokens/tests/separation.test.mjs`, `tests/{prototype-theme,preview-route,build-separation,design-os-theme,token-class}.test.ts`, `tests/storybook.test.ts`, `e2e/{navigation,layout,preview-isolation}.spec.ts`

## Verifikation

- **Je Phase:** `pnpm test`, `pnpm test:tokens`, `pnpm lint`, `npx tsc -p tsconfig.app.json --noEmit`, `pnpm build` + `pnpm test:build`, `pnpm test:e2e`, `pnpm build-storybook` + Render-Schleife aller Stories, `npm run preview:check`, `npm run validate:mermaid`.
- **Im Browser (Dev-Server, `DESIGNOS_NO_OPENCODE=1`):**
  1. Screen-Design-Seite öffnen. Im iframe zeigen die DevTools nur `preview.css`. `bg-primary` im Prototyp ist Volta- bzw. Token-Teal, Design OS daneben zinc.
  2. Theme umschalten: Die Vorschau folgt.
  3. Live Edit: Element wählen, Inspector-Vorschlag passt zum Prototyp-Theme, „Apply with agent“ schreibt die Quelle, HMR aktualisiert nur den iframe.
  4. Kommentar anlegen, senden, löschen: kein Reload der Seite.
  5. `product/design-system/tokens/tokens.css` testweise umbenennen: Die Vorschau fällt auf `templates/volta/theme.css` zurück, Design OS ändert sich nicht. Danach zurück.
  6. Clickdummy und Shell-Vorschau, alte `/…/fullscreen`-Links leiten um.
- **Bundle:** `index.html`-Chunks ohne Prototyp-Module, CSS-Markierungen getrennt (`tests/build-separation.test.ts`).
