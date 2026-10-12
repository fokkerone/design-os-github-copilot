---
title: Step-by-Step Guide
summary: The complete walkthrough for using Design OS, from installing the app to handing off the export package, with what each command asks, what it creates and where to check the result.
tags: [how-to]
sources: [agents.md, .claude/commands/design-os/, .claude/skills/designos-persona/SKILL.md, .claude/skills/designos-userflow/SKILL.md]
created: 2026-10-09
updated: 2026-10-09
---

# Step-by-Step Guide

## Summary
This guide takes you through a complete Design OS project in order. Every step follows the same pattern: you start a command, the agent asks you questions, shows a summary, writes files only after you confirm, and tells you the next step. Work through the steps top to bottom; personas and user flows can be added whenever you need them.

**How to read each step**

| Field | Meaning |
|-------|---------|
| **Run** | The Claude Code command and the GitHub Copilot agent that do the same thing |
| **Needs** | What must exist before the step works |
| **Prepare** | What helps to have in mind or on hand |
| **What happens** | The conversation, in order |
| **Result** | The files it writes |
| **Check** | Where to see the result in the Design OS app |

---

## Step 0 — Set up

1. Install dependencies once: `npm install`.
2. Start the app: `npm run dev`, then open `http://localhost:3000`.
3. Open your agent in the project folder:
   - **Claude Code:** start `claude` in the repository. Commands start with `/`.
   - **GitHub Copilot:** open the chat in VS Code and pick the agent with `@` (e.g. `@00-product-vision`).
4. Leave the app open. It reads the planning files live; after a step that creates new React files (shell, screen designs, clickdummy), restart `npm run dev` if the new view does not show up.
5. Optional: open the `wiki/` folder in [Obsidian](https://obsidian.md) to browse the project brain as a graph.

**How a command conversation works**
- Questions come as a multiple-choice picker with 2–4 options; the recommended one is first. Choose *Other* to type your own answer.
- Nothing is written until you confirm a summary.
- After writing, the command asks whether you want changes. Say what to change and it updates the file.
- Each command does one job. If you ask for something outside its scope, it names the command that does it.

---

## Step 1 — Product Vision

- **Run:** `/product-vision` · `@00-product-vision`
- **Needs:** nothing.
- **Prepare:** your raw notes: what the product is, who it is for, which problems it solves. Rough is fine.

**What happens**
1. You are asked to share your notes in your own words.
2. The agent asks follow-ups, one or two at a time: product name, a 1–3 sentence description, 1–5 key problems, how the product solves each, the main features.
3. If personas already exist, they are used as the answer to "who is it for" instead of asking again.
4. You confirm, and the file is written.

- **Result:** `product/product-overview.md` (name, description, problems and solutions, key features).
- **Check:** the **Product** page of the app shows the overview card.
- **Tip:** If you have no personas yet, this is a good moment for a proto-persona (see Personas below).

---

## Step 2 — Product Roadmap

- **Run:** `/product-roadmap` · `@01-product-roadmap`
- **Needs:** the product overview.
- **Prepare:** the main areas of the product, and which one matters most.

**What happens**
1. The agent reads the overview and asks which areas or screens you see, which is most critical, and how many sections feel right (3–5 is typical).
2. You agree on the list and order (order = build priority).
3. The roadmap is written. Running the command again later shows the current sections and asks what to change.

- **Result:** `product/product-roadmap.md` with numbered sections (`### 1. Title` + one sentence). Section titles become navigation items; their slugs (e.g. `meter-reading`) are the section ids used everywhere afterwards.
- **Check:** **Product** page (roadmap card) and **Sections** page.

---

## Step 3 — Data Shape

- **Run:** `/data-shape` · `@02-data-shape`
- **Needs:** overview and roadmap.
- **Prepare:** the "things" users create, view or manage, and how they relate.

**What happens**
1. Questions about the main entities, how they relate, which are shared across sections, and whether one is central.
2. You confirm entity names (singular: `Invoice`, not `Invoices`) and relationships in plain language.

- **Result:** `product/data-shape/data-shape.md`: entities with descriptions, and relationships such as "Customer has many Meters". No field lists or database schema: that is left to the implementation.
- **Check:** **Data Shape** page.
- **Why it matters:** sample data, types and screen designs reuse these names, so every section speaks the same vocabulary.

---

## Step 4 — Design System

- **Run:** `/design-tokens` · `@03-design-system`
- **Needs:** the product overview.
- **Prepare (optional):** brand assets in `product/design-system/resources/`: logos (SVG, PNG), style-guide PDFs or images, color swatches, font names, mood boards.

**What happens**
1. If resources exist, the agent analyzes them and shows the colors, fonts, visual style and voice it found; you correct them.
2. Otherwise, or for gaps, a short interview:
   - **Colors** from the Tailwind palette: primary (buttons, links), secondary (tags, highlights), neutral (`slate`, `gray`, `zinc`, `neutral`, `stone`).
   - **Typography** from Google Fonts: heading, body, mono.
   - **Optional:** brand personality (3–5 adjectives, mood), brand voice (tone), UI style (border radius, shadows, density).
3. You approve the summary.

- **Result:** `product/design-system/design-system.json` (for the agents), `product/design-system/design-system.md` (for people), and the chosen fonts added to `index.html`.
- **Check:** **Design** page.
- **Tip:** Running it again offers to view, update or keep the system; if the resources folder changed, it offers a re-analysis.

---

## Step 5 — Application Shell

- **Run:** `/design-shell` · `@04-design-shell`
- **Needs:** overview and roadmap. The design system is recommended (otherwise default styling).

**What happens**
1. The agent lists your sections and proposes layouts: **A** sidebar, **B** top navigation, **C** minimal header. Brand personality and UI style inform the recommendation.
2. Questions: where the user menu sits, mobile behavior (collapsible sidebar or hamburger), extra nav items (Settings, Help), the default view.
3. You approve navigation, user menu and responsive behavior.

- **Result:** `product/shell/spec.md` and the components `src/shell/components/AppShell.tsx`, `MainNav.tsx`, `UserMenu.tsx`, `index.ts`, plus `src/shell/ShellPreview.tsx` (preview only, not exported).
- **Check:** **Design** page → shell preview (`/shell/design`). Restart the dev server if it does not appear.

---

## Personas (any time after Step 1)

- **Run:** `/design-os:persona` · `@persona` — optionally with a mode: `proto`, `research`, `update <persona-id>`, `validate <persona-id>`.
- **Needs:** the product overview.
- **Prepare:** for `research` mode, put interview notes, survey results or support-ticket summaries into `wiki/raw/` first.

**What happens** (about 7–8 question rounds)
1. **Segment, priority, evidence base:** which user group; `primary` / `secondary` / `supplemental` / `negative`; `proto` (team assumptions) or research-based.
2. **Job story:** pick one "When … I want to … so I can …".
3. **Goals:** end goals, experience goals, one life goal.
4. **Thinking style:** behaviors and guiding principles, plus where the persona sits on 1–5 scales (e.g. tech confidence, need for reassurance). Demographics only if they change behavior.
5. **Pain points and context:** each with today's workaround; devices, environment, collaborators, accessibility constraints.
6. **Red team:** a research critic flags stereotypes, elastic personas, untestable claims and the riskiest assumption. You choose what to fix.
7. **Design implications and mapping:** "Do / Don't" rules, the sections and flows the persona belongs to, a quote and a name.
8. **Review:** a coverage check makes sure every pain point has an implication; you confirm.
9. The persona is written, compiled into the wiki, and linked (spec bullet `(persona: <id>)`, flow frontmatter).
10. Optional (Claude Code): publish a persona card for stakeholders.

- **Result:** `product/personas/<persona-id>.md`, `wiki/personas/<persona-id>.md`, bullets under `## Personas` in linked section specs.
- **Check:** the section page's spec card (**Personas**), and **Wiki** → Personas.
- **Later:** when research arrives, run `/design-os:persona validate <persona-id>` to raise evidence levels and confidence. Details: [[how-to/personas]].

---

## User Flows (any time after Step 2)

- **Run:** `/design-os:userflow` · `@userflow` — optionally `plan`, `prototype` or `update <flow-id>`, plus the goal.
- **Needs:** the roadmap. For `prototype` mode, existing screen designs.

**What happens**
1. **Context:** goal, primary user (personas are offered first), trigger, the user's state (hurried, mobile, first time, ...). You confirm the one-sentence ask.
2. **Rules:** pick hard constraints (`R1…`).
3. **Reference patterns:** wizard, deep link, inline validation, an existing flow, ...
4. **Reasoning:** requirements (legal, privacy, accessibility), friction points, minimum data, states, where the flow lives.
5. **Happy path:** step table (`S1…`) and a Mermaid diagram.
6. **Kill the happy path:** a QA persona lists failures; you choose which the flow handles (`E1…`).
7. **Nuance pass** and **mapping** of each step to a section and screen design (`exists`, `partial`, `gap`, `planned`).
8. **Review and write**, then the flow is compiled into the wiki and you choose which section specs link it.
9. Optional (Claude Code): an interactive flow page for stakeholders.

- **Result:** `product/flows/<flow-id>.md`, `wiki/flows/<flow-id>.md`, spec bullets ending in `(flow: <flow-id>)`.
- **Check:** the section page's spec card (**User Flows** → expand a linked flow to see its diagram), and **Wiki** → Flows. Details: [[how-to/user-flows]].

---

## Step 6 — For each section

Repeat 6a–6d for every section in roadmap order.

### 6a — Shape Section

- **Run:** `/shape-section` · `@05-shape-section`
- **Needs:** the roadmap.

**What happens**
1. You pick the section (auto-selected if there is only one).
2. You share notes, then answer 4–6 questions: main actions, information to display, key flows, UI patterns, what is out of scope, which views are needed.
3. **User flows:** link existing flows from the wiki (multi-select), create a full flow inline, or write simple bullets. These can be mixed.
4. **Personas:** link the personas this section is designed for, or create one inline. Their pain points and design implications feed the UI requirements.
5. **Shell:** inside the app shell (default) or a standalone page (landing page, deep-link page, embed).
6. You confirm, and the spec is written.

- **Result:** `product/sections/<section-id>/spec.md` with Overview, User Flows, Personas, UI Requirements and Configuration.
- **Check:** the section page (`/sections/<section-id>`) shows the spec card.

### 6b — Sample Data

- **Run:** `/sample-data` · `@06-sample-data`
- **Needs:** the section spec.

**What happens**
1. The agent proposes the entities implied by the spec (named after the data shape) and asks about fields, statuses, the number of records (5–10 is typical) and the actions users take (these become callback props).
2. You confirm.

- **Result:** `product/sections/<section-id>/data.json` (realistic records, edge cases such as empty lists and long texts, and a `_meta` block describing the entities) and `types.ts` (TypeScript interfaces including the component's props and callbacks).
- **Check:** the section page shows the data card.

### 6c — Design Screen

- **Run:** `/design-screen` · `@07-design-screen`
- **Needs:** spec, `data.json` and `types.ts`. Design system and shell are recommended.

**What happens**
1. If the spec suggests several views (list, detail, form), you pick which one to design first.
2. The agent applies your design system (colors, fonts, voice for labels and empty states, UI style) and builds the screen.
3. Run the command again for every further view.

- **Result:** props-based components in `src/sections/<section-id>/components/` (no imported data, all actions as callbacks, responsive, light and dark mode) and a preview wrapper `src/sections/<section-id>/<ViewName>.tsx` that feeds the sample data.
- **Check:** the section page lists the screen design; open it to see it inside the shell, with a fullscreen option. Restart the dev server if it does not appear. Callback clicks are logged to the browser console.

### 6d — Screenshot

- **Run:** `/screenshot-design` · `@08-screenshot-design`
- **Needs:** a screen design, and the Playwright MCP server in Claude Code (`claude mcp add playwright npx @playwright/mcp@latest`, then restart the session).

**What happens**
1. You pick the screen design.
2. The agent starts the dev server, hides the Design OS header and takes a full-page screenshot at desktop width. It offers further variants (dark mode, mobile, empty state).

- **Result:** `product/sections/<section-id>/<name>.png`. Screenshots go into the export as visual reference.

---

## Step 7 — Clickdummy

- **Run:** `/clickdummy` · `@09-clickdummy`
- **Needs:** overview, roadmap, the shell, and a screen design for every section.

**What happens**
1. The agent lists every section with its state (spec, data, screen design). If something is missing, it tells you which command to run and stops.
2. Otherwise it assembles all screen designs inside the shell with working navigation between sections.

- **Result:** `src/clickdummy/ClickdummyApp.tsx` and the route `/clickdummy/preview`.
- **Check:** **Clickdummy** page, or open `http://localhost:3000/clickdummy/preview` directly. Share it with stakeholders and collect feedback; save the feedback with `/design-os:wiki-capture`.

---

## Step 8 — Export

- **Run:** `/export-product` · `@10-export-product`
- **Needs:** overview, roadmap and at least one section with screen designs. Data shape, design system and shell are recommended.

- **What happens:** the agent collects everything and generates the handoff package. No questions unless something required is missing.

- **Result:** `product-plan/` and `product-plan.zip` containing:
  - `README.md`, `product-overview.md` (including personas) and `design-system.md`
  - `prompts/`: `one-shot-prompt.md` and `section-prompt.md`, ready to paste into a coding agent
  - `instructions/`: one-shot and milestone-by-milestone instructions (shell first, then each section)
  - `design-system/`, `data-shapes/`, `shell/` and `sections/` with portable components, types, sample data, screenshots and a `tests.md` per section
  - `flows/` and `personas/` if they exist; flows become test groups in `tests.md`

- **Check:** **Export** page (download the zip). Restart the dev server if the page does not list the new package.
- **Hand off:** give `product-plan/` to the implementation team and start with `prompts/one-shot-prompt.md` or the section prompt. The coding agent asks about tech stack and backend before building.

---

## After every step: keep the project brain current

1. `/design-os:wiki-ingest --product` compiles the new or changed planning files into `wiki/`. Personas and flows are compiled automatically by their commands.
2. `/design-os:wiki-capture` saves decisions, rejected alternatives and feedback that are not in any file.
3. `/design-os:wiki-query <question>` answers from the wiki, e.g. "Why did we choose a top navigation?".
4. Now and then: `/design-os:wiki-status` (what's pending) and `/design-os:wiki-lint` (broken links, contradictions, outdated pages).

How the wiki works: [[how-to/project-brain]].

---

## Changing things later

| You want to | Do this |
|-------------|---------|
| Change the overview, roadmap, data shape or design system | Run the same command again; it shows the current state and asks what to change |
| Add a section | `/product-roadmap`, then 6a–6d for the new section, then `/clickdummy` again |
| Change a section's scope | `/shape-section` for that section, then update data and screens as needed |
| Add another view to a section | `/design-screen` again for that section |
| Revise a flow or persona | `/design-os:userflow update <flow-id>` · `/design-os:persona update <persona-id>` |
| Record new user research | Put it into `wiki/raw/`, run `/design-os:wiki-ingest --pending`, then `/design-os:persona validate <persona-id>` |
| Refresh the handoff | `/export-product` again |

After any change, run `/design-os:wiki-ingest --product` so the wiki reflects it.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| A new screen, the shell or the clickdummy doesn't show in the app | Restart `npm run dev` |
| A command stops with "please run … first" | Run the named command; prerequisites are checked on purpose |
| `/screenshot-design` asks for Playwright | `claude mcp add playwright npx @playwright/mcp@latest`, restart Claude Code |
| A diagram doesn't render | `npm run validate:mermaid` shows the file and line |
| The wiki lists items as pending | `npm run -s wiki -- pending`, then `/design-os:wiki-ingest --product` or `--pending` |
| The wiki looks out of date or contradictory | `/design-os:wiki-lint`; as a last resort `/design-os:wiki-rebuild` (keeps these guides) |

## Related
- [[how-to/getting-started]] — the short version
- [[how-to/planning-flow]] — the flow as a diagram and table
- [[how-to/personas]] · [[how-to/user-flows]] · [[how-to/project-brain]]
