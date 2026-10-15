# Vorschlag: User Flows und Personas in Design OS UI und Prompts integrieren

> Status: **Iterationen 1–5 umgesetzt, 6 vorbereitet** · Stand: 2026-10-12 · Branch: `userflows` · nicht committet
>
> Abschnitte 1–7 sind der ursprüngliche Vorschlag. Was daraus geworden ist, steht in Abschnitt 9, was offen bleibt in Abschnitt 10.

## 1. Ausgangslage

User Flows und Personas lassen sich heute erstellen (`/design-os:userflow`, `/design-os:persona`), landen in `product/flows/`, `product/personas/` und im Wiki, und werden in Section-Specs verlinkt. Danach reißt die Kette ab:

| Stelle | Heute | Lücke |
|--------|-------|-------|
| **Erstellen** | Nur über die Kommandozeile | In der App gibt es keinen Hinweis, dass es Flows und Personas gibt, solange keine existieren |
| **Übersicht** | Nur im Wiki (`/wiki`), gemischt mit allen anderen Seiten | Keine Liste „alle Personas", „alle Flows", kein Status auf einen Blick |
| **Section-Seite** | Im `SpecCard`, zugeklappt, Flow mit Diagramm, Persona mit Job Story | Leicht zu übersehen. Schritte, Edge Cases, Lückenliste und Design-Implikationen fehlen |
| **Screen-Design-Seite** | Nichts | Man sieht nicht, welchen Flow-Schritt ein Screen abdeckt und für wen er gebaut ist |
| **Clickdummy** | Nichts | Ein Flow lässt sich nicht Schritt für Schritt durchklicken |
| `/product-vision` | Liest Personas | – |
| `/product-roadmap`, `/data-shape`, `/design-shell` | Lesen weder Flows noch Personas | Sections entstehen ohne Bezug zu Job Stories |
| `/shape-section` | Verlinkt Flows und Personas, kann beide inline erstellen | UI Requirements werden nicht nachvollziehbar aus Flow und Persona abgeleitet |
| `/sample-data` | Liest nur `spec.md` (Flow = eine Zeile) | Daten decken die Edge Cases des Flows nicht ab |
| `/design-screen` | Liest nur `spec.md` | Edge-Case-Zustände und die Do/Don't-Regeln der Persona kommen nur an, wenn man sie von Hand erwähnt |
| `/screenshot-design`, `/clickdummy` | Kennen Flows nicht | – |
| `/export-product` | Kopiert beides, erzeugt Tests pro Flow | – |
| **Flow-Status** | `Prototype Mapping` und `in-prototype` werden nur im Flow-Lauf gesetzt | Veraltet, sobald danach ein Screen entsteht |

Kurz: Die Artefakte entstehen, aber die Schritte, die am meisten davon hätten (Sample Data, Design Screen, Clickdummy), nutzen sie nicht, und die App zeigt sie nur versteckt.

## 2. Leitlinien

1. **Dateien bleiben die Schnittstelle.** Die App liest `product/` per `import.meta.glob`, die Agents schreiben dorthin. Kein Backend, kein zweiter Speicher (entspricht D6 in `docs/agents/PLAN.md`).
2. **Die App zeigt an und reicht Befehle weiter.** Bis die Agents aus der Webapp bedienbar sind, erstellt die App nichts selbst. Sie zeigt einen fertigen, kopierbaren Befehl (`CopyButton` existiert bereits).
3. **Flows und Personas sind keine Phase.** Sie sind jederzeit möglich und begleiten mehrere Phasen. Die `PhaseNav` bleibt bei sechs Einträgen.
4. **Abgeleitet statt gepflegt.** Was sich aus Dateien berechnen lässt (deckt ein Screen einen Schritt ab?), wird berechnet und nicht von Hand in Markdown nachgeführt.
5. **Optional bleibt optional.** Ein Projekt ohne Personas und Flows funktioniert wie bisher. Hinweise ja, Sperren nein.

## 3. Vorschlag UI

### 3.1 Übersichten

| Ort | Neu | Inhalt |
|-----|-----|--------|
| **Product-Seite** (`/`) | Karte **Personas** unter dem Product Overview | Pro Persona: Name, Archetyp, Priorität, Job Story, Confidence, Proto-Hinweis. Leerzustand mit Befehl `/design-os:persona` und Link auf `how-to/personas` |
| **Sections-Seite** (`/sections`) | Karte **User Flows** über der Section-Liste | Pro Flow: Titel, Status, beteiligte Sections, Personas, Abdeckung „4 von 6 Schritten haben einen Screen". Leerzustand mit Befehl `/design-os:userflow` |
| **Sections-Seite** | Abdeckung pro Section (in `SectionsCard`) | Kleine Zähler: Personas, Flows, offene Lücken |

Flows gehören auf die Sections-Seite, weil sie mehrere Sections verbinden. Personas gehören zum Produkt, weil sie die Frage „für wen" beantworten.

### 3.2 Detailseiten

Neue Routen `/personas/:personaId` und `/flows/:flowId`. Sie lesen die Quelle in `product/`, nicht die Wiki-Seite, und zeigen sie strukturiert statt als Fließtext:

- **Flow:** Kontext (User, Trigger, Erfolg), Regeln, Diagramm, Schritt-Tabelle mit **Link auf den jeweiligen Screen**, Edge Cases, Lückenliste mit Befehl pro Lücke, offene Fragen.
- **Persona:** Zitat, Job Story, Ziele, Verhaltensskalen, Pain Points mit Workaround, Design-Implikationen, Annahmen-Tabelle mit Evidenzstufe, verlinkte Sections und Flows, Befehl `/design-os:persona validate <id>`.

Beide Seiten verlinken auf die Wiki-Seite („Open in wiki") für Backlinks und Recherche.

### 3.3 Section-Seite

- **„Designed for"** direkt unter dem Titel: Persona-Chips, immer sichtbar, Klick führt zur Persona.
- **Eigene Karte „User Flows"** statt des zugeklappten Abschnitts im `SpecCard`: pro Flow die Schritte, die in dieser Section liegen, mit Status `exists` / `gap` und Sprung zum Screen.
- **Lückenliste als nächster Schritt:** „S4 hat keinen Screen" mit Befehl `/design-screen` und vorbelegtem Text.
- **Hinweis** (kein Fehler), wenn eine Spec weder Persona noch Flow verlinkt.

### 3.4 Screen-Design-Seite

- **Kontextleiste** (einklappbar): „Deckt ab: S2, S3 von *Submit meter reading* · Für: Ana".
- **Flow-Navigation:** Zurück / Weiter entlang der Flow-Schritte, auch über Section-Grenzen. So lässt sich ein Flow anhand der Einzel-Screens durchgehen, bevor ein Clickdummy existiert.

### 3.5 Clickdummy

- **Flow-Modus:** Flow auswählen, eine schmale Leiste zeigt den aktuellen Schritt (S1 … Sn) und springt zum passenden Screen. Für Stakeholder-Demos: „Wir gehen jetzt den Flow *Zählerstand melden* durch."

### 3.6 Abdeckung live berechnen

Die Schritt-Tabelle im Flow nennt pro Schritt `section-id / Screen`. Die App prüft, ob `src/sections/<section-id>/<Screen>.tsx` existiert:

- Datei vorhanden → `exists`, sonst `gap`
- `partial` bleibt eine Einschätzung aus dem Flow-Lauf und wird aus der Datei übernommen
- Flow-Status `in-prototype` ergibt sich daraus und muss nicht mehr von Hand gesetzt werden

Dazu ein Skript `npm run flows:check`, das dieselbe Rechnung für die Prompts liefert (Lücken als Text oder JSON).

### 3.7 Benötigte Änderungen im Code

| Datei | Änderung |
|-------|----------|
| `src/lib/flow-loader.ts` | Zusätzlich parsen: `personas`, Kontext, Regeln, Schritte, Edge Cases, Mapping. Frontmatter über `parseFrontmatter` aus `wiki-loader` (wie `persona-loader`) |
| `src/lib/persona-loader.ts` | `loadAllPersonas()`, dazu `sections`, `flows`, Pain Points, Implikationen, Annahmen |
| `src/lib/coverage.ts` (neu) | Schritt → Screen-Existenz, Abdeckung pro Flow und pro Section |
| `src/lib/router.tsx` | `/personas/:personaId`, `/flows/:flowId` |
| `src/components/` (neu) | `PersonasCard`, `FlowsCard`, `PersonaPage`, `FlowPage`, `FlowStepsTable`, `SectionFlowsCard`, `ScreenContextBar` |
| `SpecCard`, `SectionPage`, `ScreenDesignPage`, `ProductPage`, `SectionsPage`, `ClickdummyPage`, `EmptyState` | Einbindung wie oben |
| `scripts/` | `flows:check` |

Alle neuen Oberflächen folgen `.claude/DESIGN.md` (stone/lime, DM Sans, max. 800 px).

## 4. Vorschlag Prompts

### 4.1 Gemeinsamer Baustein „Personas und Flows laden"

Ein identischer Abschnitt für alle Prompts ab Schritt 6: verlinkte ids aus `spec.md` lesen, die Dateien in `product/flows/` und `product/personas/` laden, dem Nutzer in zwei Zeilen sagen, was gefunden wurde. Der Baustein wird einmal formuliert und in jeden Prompt übernommen.

### 4.2 Änderungen pro Schritt

| Prompt | Änderung | Nutzen |
|--------|----------|--------|
| `/product-vision` | Am Ende aktiv fragen, ob jetzt eine Proto-Persona entstehen soll (heute nur ein Hinweis) | Persona entsteht früh |
| `/product-roadmap` | Prüfen, ob die Job Story jeder primären Persona durch eine Section abgedeckt ist. Am Ende 3–5 Flow-Kandidaten vorschlagen | Roadmap orientiert sich an Jobs, nicht an Featurelisten |
| `/data-shape` | Entitäten aus vorhandenen Flow-Schritten als Kandidaten anbieten | Einheitliches Vokabular |
| `/design-shell` | Nutzungskontext der primären Persona (Geräte, Häufigkeit) bei der Wahl des Layouts nennen | Mobile vs. Desktop begründet |
| `/shape-section` | UI Requirements aus Flow-Schritten, Edge Cases und Persona-Implikationen vorschlagen, mit Herkunft: `(from: submit-meter-reading E2)`, `(from: cautious-first-timer P1)` | Jede Anforderung ist begründet und prüfbar |
| `/sample-data` | Verlinkte Flows lesen. Die Daten müssen jeden Schritt und jeden Edge Case darstellbar machen (z. B. ein Datensatz, der E1 auslöst). Inhalte passend zur Persona | Screens lassen sich in allen Zuständen zeigen |
| `/design-screen` | **Wichtigste Änderung.** Verlinkte Flows und Personas lesen. Frage: „Welche Flow-Schritte deckt dieser Screen ab?" (Mehrfachauswahl). Zustände für die Edge Cases umsetzen. Do/Don't, Accessibility und Nutzungskontext der Persona anwenden. Am Ende melden, welche Schritte jetzt abgedeckt sind | Screens setzen Flow und Persona tatsächlich um |
| `/screenshot-design` | Optional: Screenshot-Serie entlang eines Flows (`flow-<id>-S1.png` …) | Flow als Bildfolge für Stakeholder |
| `/clickdummy` | Navigation zwischen Screens entlang der Flows verdrahten, Flow-Modus erzeugen | Klickbarer Flow |
| `/export-product` | Design-Implikationen der Personas in die Section-READMEs übernehmen | Implementierung kennt das „Warum" |
| `/design-os:userflow`, `/design-os:persona` | Argument `--section <id>` für vorbelegte Aufrufe aus der App. `prototype`-Modus nutzt `flows:check` | Ein Klick in der App, ein Befehl im Terminal |

### 4.3 Drei Kopien der Prompts

Jeder Prompt existiert in `.claude/commands/design-os/`, in `.github/agents/` und künftig in `agents/definitions/`. Jede Änderung oben muss in allen Kopien landen. Laut `docs/agents/PLAN.md` (D2) soll `agents/definitions/` die einzige Quelle werden. Solange das nicht umgesetzt ist: Claude-Command zuerst ändern, Copilot-Agent im selben Commit nachziehen.

## 5. Reihenfolge

| Iteration | Inhalt | Aufwand | Abnahme |
|-----------|--------|---------|---------|
| **1. Prompts nutzen den Kontext** | Baustein 4.1, `/design-screen`, `/sample-data`, Herkunftsangaben in `/shape-section`, Copilot-Kopien | klein | Ein Screen wird ohne Zutun mit den Edge-Case-Zuständen des verlinkten Flows erzeugt |
| **2. Sichtbar machen** | Loader erweitern, Personas-Karte, Flows-Karte, Detailseiten, Leerzustände mit Befehl | mittel | Personas und Flows sind ohne Wiki auffindbar |
| **3. Abdeckung** | `coverage.ts`, `flows:check`, Section-Karte „User Flows", „Designed for", Lückenliste | mittel | Nach `/design-screen` wechselt ein Schritt ohne weiteren Befehl von `gap` auf `exists` |
| **4. Durchgehen** | Kontextleiste und Flow-Navigation auf der Screen-Seite, Flow-Modus im Clickdummy, Screenshot-Serie | mittel | Ein Flow lässt sich von S1 bis Erfolg durchklicken |
| **5. Vorgelagerte Prompts** | `/product-vision`, `/product-roadmap`, `/data-shape`, `/design-shell`, `/export-product` | klein | Roadmap nennt Flow-Kandidaten |
| **6. Erstellen aus der App** | Erst mit den Web-Agents aus `docs/agents/PLAN.md`: `userflow` und `persona` als Agents, Start per Button | groß, abhängig | Persona entsteht ohne Terminal |

Iteration 1 kommt zuerst, weil sie ohne UI-Arbeit den größten Effekt hat: Die vorhandenen Flows und Personas wirken sofort auf die Screens.

## 6. Offene Entscheidungen

1. **Eigene Nav-Einträge?** Vorschlag: nein, Karten auf Product- und Sections-Seite. Alternative: ein siebter Eintrag „Users & Flows" zwischen Product und Data Shape.
2. **Detailseite oder Wiki?** Vorschlag: eigene Detailseiten aus `product/`. Alternative: nur auf die Wiki-Seite verlinken (weniger Code, aber Fließtext ohne Screen-Links).
3. **Herkunftsangaben in der Spec** (`(from: …)`): gewünscht, oder macht das die Spec zu technisch?
4. **Pflicht oder Hinweis?** Vorschlag: Hinweis. Alternative: `/design-screen` fragt nach, wenn eine Section keine Persona hat.
5. **Iteration 6 jetzt einplanen** oder bis zum Abschluss der Agent-Migration zurückstellen?

## 7. Nicht Teil dieses Vorschlags

- Bearbeiten von Flows oder Personas in der App (Formulare, Diagramm-Editor)
- Änderungen am Dateiformat von Flows und Personas oder an den Markern `(flow: …)` und `(persona: …)`
- Änderungen an Wiki-Ingest und Wiki-Struktur

## 8. Nebenbefund

`agents.md` verweist auf `./Design.md`. Die Datei liegt unter `.claude/DESIGN.md`; im Projektstamm gibt es sie nicht. Der Verweis sollte korrigiert werden.

## 9. Umsetzungsstand (2026-10-12)

### Entscheidungen

| Frage | Entscheidung |
|-------|--------------|
| Eigene Nav-Einträge | Nein. Personas-Karte auf der Product-Seite, Flows-Karte auf der Sections-Seite |
| Detailseite oder Wiki | Eigene Detailseiten `/personas/:id` und `/flows/:id`, gelesen aus `product/` |
| Herkunftsangaben in der Spec | Umgesetzt in `/shape-section` als `(from: <id> S3)`. Noch nicht von dir bestätigt, lässt sich mit einem Absatz wieder entfernen |
| Pflicht oder Hinweis | Hinweis. Ohne Personas und Flows arbeitet alles wie bisher |
| „PLAN.md der Sections" | Gemeint ist `product/sections/<id>/spec.md`. Die Spec ist in allen Prompts als verbindlich festgeschrieben |
| Tests | Vitest, `npm test`, 40 Tests gegen ein Beispielprojekt in `tests/fixtures/project/` |
| `.claude/DESIGN.md` | Nicht angefasst, auch der Verweis in `agents.md` nicht (Abschnitt 8) |

### Was es jetzt gibt

| Iteration | Ergebnis |
|-----------|----------|
| 1 Kontext | `src/lib/model/` (Parser für Flows, Personas, Specs, Roadmap; Beziehungen, Abdeckung, Konflikte, Flow-Routen). `scripts/context.mjs` (`npm run context`). Skill `.claude/skills/designos-context/` |
| 2 Prompts | `/design-screen`, `/sample-data`, `/shape-section`, `/product-roadmap`, `/data-shape`, `/design-shell`, `/screenshot-design`, `/export-product`, `/product-vision`, jeweils mit Copilot-Kopie (außer `/product-vision`) |
| 3 UI | `PersonasCard`, `FlowsCard`, `PersonaPage`, `FlowPage`, `SectionContextCard`, `ScreenContextBar`, Links aus dem `SpecCard`, Leerzustände |
| 4 Abdeckung | Live berechnet aus Schritt-Tabelle und vorhandenen Screen-Dateien. Konflikte und Lücken auf Flow-, Persona- und Section-Seite |
| 5 Clickdummy | `/clickdummy` inventarisiert Flows, aktualisiert statt neu zu bauen, Vorlage mit Flow-Durchlauf (`useFlowWalk`, `FlowWalkBar`). `?flow=<id>` zeigt einen Flow allein |
| 6 Vorbereitung | Kopierbare Befehle in der App, How-to-Seiten, `agents.md`, dieser Abschnitt |

### Wann ein Flow-Schritt als abgedeckt gilt

Die Spalte `Section / Screen` der Schritt-Tabelle nennt eine Section und einen Screen, und `src/sections/<section>/<Screen>.tsx` existiert. Sonst: Screen fehlt, kein Screen zugeordnet, Section unbekannt oder Screen mehrdeutig. `partial` kommt aus der Tabelle „Prototype Mapping" des Flows. Nichts davon wird gespeichert.

### Abweichungen vom Auftrag

- Die Berechnung der Abdeckung entstand in Iteration 1 statt 4, weil das Kontext-Skript sie braucht.
- Keine Browser- oder Komponententests. Die UI wurde einmal von Hand mit Beispieldaten geprüft (alle neuen Seiten, Flow-Durchlauf mit Verzweigung, Section-Wechsel und fehlendem Screen).
- Übergänge zu Edge-Case-Knoten (`S3 -.-> E1`) sind im Flow geparst, aber nicht Teil der Route: Edge Cases sind Zustände eines Screens, keine eigenen Screens.

### Bekannte Altlasten, nicht behoben

- Die Clickdummy-Vorlage im Prompt erzeugt Code mit zwei ESLint-Fehlern (`react-hooks/static-components`, „Existing memoization could not be preserved"). Beide bestanden schon vor dieser Arbeit.
- `agents.md` verweist auf `./Design.md` statt `.claude/DESIGN.md` (Abschnitt 8).
- `agents/definitions/product-vision/agent.md` kennt die neue Persona-Rückfrage nicht. Das gehört zur Agent-Migration.

## 10. Spätere Arbeiten

### A. Clickdummy und Export für einen einzelnen Flow

**Vorhanden:** `model.route(flowId)` liefert Schritte, Screens in Reihenfolge und Übergänge mit Section-Wechseln. `/clickdummy/preview?flow=<id>` sperrt den Clickdummy auf diesen Flow, ohne Projektdaten zu ändern.

**Fehlt:**

1. Ein Clickdummy-Export überhaupt. Heute gibt es nur die Vorschau im Dev-Server; `/export-product` packt Komponenten und Doku, keinen lauffähigen Clickdummy.
2. Ein Export-Schritt, der aus `route(flowId).screens` die Komponenten, Sample-Daten und Typen der beteiligten Sections sammelt und mit einer kleinen Laufzeit (Shell, Flow-Leiste, Routen) als eigenständiges Paket ablegt, etwa `product-plan/flows/<flow-id>/clickdummy/`.
3. Ein Einstieg: `/clickdummy --flow <id>` im Prompt und ein Knopf auf der Flow-Seite.
4. Eine Entscheidung, ob ein Flow-Clickdummy die Shell zeigt und welche Navigationspunkte sie dann hat.

### B. Iterative Clickdummy-Weiterentwicklung

**Vorhanden:** Der Clickdummy liest Sections, Screens und Flows zur Laufzeit. Neue Flows und Screens erscheinen ohne Neubau. Der Prompt ändert eine bestehende `ClickdummyApp.tsx` nur gezielt.

**Fehlt:**

1. Echte Verdrahtung der Screens: Heute führt die Flow-Leiste von Schritt zu Schritt. Klicks im Screen selbst (`onSubmit`, `onBack`) lösen nur `console.log` aus. Nötig ist eine Zuordnung Callback → Übergang, am besten als Konvention in `/design-screen` (Callback-Namen je Übergang) plus eine Tabelle im Preview-Wrapper.
2. Zustände für Edge Cases im Clickdummy umschalten (heute nur über Sample-Daten).
3. Ein Prüfschritt „eignen sich die vorhandenen Screens für diesen Flow" als eigener Modus von `/design-os:userflow prototype`, der `npm run context -- --flow` nutzt.
4. Nachvollziehbarkeit von Änderungen: ein Änderungsprotokoll je Clickdummy-Lauf.

### C. Personas und Flows aus der App erstellen

Abhängig von `docs/agents/PLAN.md`. `userflow` und `persona` brauchen eine Definition in `agents/definitions/` (mit `writes:` auf `product/flows/**`, `product/personas/**` und die Wiki-Seiten) und den Web-Chat aus Iteration 3 des Agent-Plans. Die App hat die Stellen dafür schon: Leerzustände und `CommandHint` zeigen heute den Befehl zum Kopieren und werden dann zu Knöpfen.

### D. Kleinere Punkte

- Der gemeinsame Kontext-Baustein steht als Verweis in jedem Prompt, zweimal (Claude und Copilot). Mit `agents/definitions/` als einziger Quelle (D2 im Agent-Plan) entfällt die Doppelpflege.
- Screenshot-Serien entlang eines Flows sind im Prompt beschrieben, die App zeigt sie aber nicht gesondert an.
- Abdeckungsmatrix Personas × Sections auf der Sections-Seite.
