# Design OS → Docker-Agents: Migrationsplan

> Branch: `agents` · Status: **Iteration 0 (Fundament)** · Stand: 2026-10-05

## Ziel

Die Design-OS-Skills (heute `.claude/commands/design-os/*.md` und `.github/agents/*.agent.md`)
werden zu eigenständigen Agents, die in Docker laufen. Endziel: Agents laufen in der Cloud und
werden **direkt aus der Design-OS-Webapp** bedient. Es gibt keinen Wechsel mehr zwischen
Konsole/Harness und Browser.

Wir gehen **iterativ** vor. Jede Iteration ist für sich lauffähig, wird abgenommen (Q/A) und
committet, bevor die nächste startet.

## Getroffene Entscheidungen

| # | Thema | Entscheidung | Begründung |
|---|-------|--------------|------------|
| D1 | Container-Schnitt | **1 Image pro Agent**, alle `FROM designos-agent-base` | Klare Trennung pro Agent; der gemeinsame Runtime-Code liegt nur einmal im Base-Image |
| D2 | Prompt-Quelle | **`agents/definitions/<id>/agent.md` = Single Source of Truth** | Claude-Commands und Copilot-Agents werden später daraus generiert (Iteration 4b) |
| D3 | Q/A-Reihenfolge | **Erst CLI im Container, dann Web-Chat** | Kleine, testbare Schritte |
| D4 | Runtime | Claude Agent SDK (TypeScript) | Gleiche Tools/Loop wie Claude Code, Sessions & Resume eingebaut |
| D5 | Auth | **offen, siehe Frage F1** | Pro/Max-Token nur lokal/privat, Cloud braucht API-Key |
| D6 | Schnittstelle Agent ↔ Webapp | **Dateien in `product/`** | Die Webapp liest `product/` via `import.meta.glob`. Ein Agent, der dorthin schreibt, wird sofort per HMR angezeigt |
| D7 | Rückfragen | Eigenes Tool `ask_user` (MCP, im Runner) | Strukturierte Multiple-Choice-Fragen, die in CLI **und** Web gleich darstellbar sind |
| D8 | Schreibrechte | Runner erzwingt `writes:`-Whitelist pro Agent | „Each agent has ONE job“ wird technisch abgesichert, nicht nur per Prompt |

## Scope der ersten Welle (PRD + Sections)

| Schritt | Agent-ID | Schreibt | Iteration |
|---------|----------|----------|-----------|
| 00 | `product-vision` | `product/product-overview.md` | 1–3 |
| 01 | `product-roadmap` | `product/product-roadmap.md` | 4 |
| 02 | `data-shape` | `product/data-shape/data-shape.md` | 4 |
| 05 | `shape-section` | `product/sections/<id>/spec.md` | 5 |
| 06 | `sample-data` | `product/sections/<id>/data.json`, `types.ts` | 5 |

**Später (eigene Welle):** `design-tokens`, `design-shell`, `design-screen`, `screenshot-design`,
`clickdummy`, `export-product`. Diese erzeugen React-Code, brauchen Build/Playwright und
damit eine echte Sandbox.

## Iterationen

### Iteration 0: Fundament ← *aktuell*
- [x] Plan (dieses Dokument)
- [x] Definitionsformat `agents/definitions/<id>/agent.md` (Frontmatter + Prompt), siehe `agents/README.md`
- [x] Erste Definition: `product-vision`
- [x] `.env.example`, `.gitignore`-Ergänzungen
- **Abnahme:** Format und Prompt reviewen, Auth-Frage F1 klären

### Iteration 1: Erster Agent im Docker (CLI)
- `agents/runtime/`: TypeScript-Runner (Agent SDK `query()`), lädt `agent.md`, registriert `ask_user`,
  erzwingt `writes:`-Whitelist, Tools nur `Read/Write/Edit/Glob` (kein Bash)
- `agents/base/Dockerfile` (node:22-slim, non-root), `agents/definitions/product-vision/Dockerfile`
- `docker-compose.agents.yml`: Service `agent-product-vision`, Volume `./product:/workspace/product`
- Start: `docker compose -f docker-compose.agents.yml run --rm agent-product-vision`
- **Abnahme:** Dialog im Terminal → `product/product-overview.md` entsteht → `npm run dev` zeigt es an

### Iteration 2: HTTP/SSE-API im Container
- Runner bekommt Server-Modus (`MODE=server`), z. B. mit Hono:
  `POST /sessions`, `POST /sessions/:id/messages`, `POST /sessions/:id/answers`, `GET /sessions/:id/events` (SSE)
- Events: `assistant_text`, `question` (ask_user), `file_written`, `done`, `error`
- **Abnahme:** kompletter Dialog per `curl`

### Iteration 3: Chat in der Webapp
- Chat-Drawer in Design OS (shadcn Sheet), Fragen als Buttons, freie Antwort möglich
- Vite-Proxy `/api/agents/<id>` → Container; Start-Button auf der jeweiligen Phase-Seite
- **Abnahme:** `product-vision` komplett im Browser, Ergebnis erscheint live

### Iteration 4: `product-roadmap` + `data-shape`
- Definitionen + Images; Vorbedingungen (`requires:`) prüft der Runner vor dem Start
- **4b:** Generator `agents/scripts/sync-definitions` → erzeugt `.claude/commands/design-os/*.md`
  und `.github/agents/*.agent.md` aus den Definitionen (Single Source)

### Iteration 5: `shape-section` + `sample-data`
- Parameter `section` (aus Roadmap), parametrisierte `writes:` (`product/sections/{section}/...`)
- Validierung nach dem Schreiben: `data.json` parsebar, `types.ts` per `tsc --noEmit`

### Iteration 6: Isolation & Orchestrator
- Kleiner Orchestrator-Service: startet pro Session einen Container über die Docker-API, räumt danach auf
- Storage-Abstraktion: lokales Volume ↔ später S3/Git-Repo pro Projekt
- Session-Persistenz (SDK `resume`) außerhalb des Containers

### Iteration 7+: Cloud
- Deployment (z. B. Cloud Run/ECS/Fly), Auth für die Webapp, Secrets-Management, Kostenlimits
- Zweite Welle: Design-/Code-Agents

## Offene Fragen

- **F1 Auth:** Pro/Max-Account per `claude setup-token` → `CLAUDE_CODE_OAUTH_TOKEN` *nur* für lokale,
  private Nutzung. Für die gehostete Webapp ist ein `ANTHROPIC_API_KEY` (oder Bedrock/Vertex) nötig.
  Vorschlag: Der Runner akzeptiert beides, Cloud-Deployment nur mit API-Key.
- **F2:** Sprache der Agent-Dialoge (heute Englisch in den Prompts), Deutsch oder Sprache des Users?
- **F3:** Soll `product/` später pro Projekt/Mandant getrennt sein (Multi-Projekt in der Webapp)?
