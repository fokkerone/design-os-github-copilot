---
title: Getting Started
summary: Run the Design OS app, choose Claude Code or GitHub Copilot, and learn the rules every planning command follows.
tags: [how-to]
sources: [agents.md]
created: 2026-10-09
updated: 2026-10-09
---

# Getting Started

## Summary
Design OS is a **planning and design tool**. You describe your product in a guided conversation, and Design OS turns it into planning files, screen designs, a clickable prototype and an export package for implementation in a separate codebase. This page gets you running.

## 1. Start the app

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The app shows every planning step as a card and updates live while the agent writes files. The **Wiki** button in the header opens the project brain.

## 2. Pick your agent

Every step exists twice, with the same behavior:

| You use | How you start a step | Example |
|---------|----------------------|---------|
| Claude Code | Slash command | `/product-vision`, `/design-os:userflow` |
| GitHub Copilot | Agent in the chat | `@00-product-vision`, `@userflow` |

The full list is in [[how-to/planning-flow]].

## 3. Rules every command follows

- **One job per command.** Each command produces only its own output and tells you which command comes next.
- **Conversation first.** No file is written before you have answered questions and confirmed a summary.
- **Multiple-choice questions.** Commands ask through a question picker with 2–4 options, the recommendation first. Use *Other* for free text.
- **The wiki is read first.** Before asking, commands look up earlier decisions in the wiki so you are not asked twice.
- **Adjust anytime.** After writing, every command asks whether you want changes.

## 4. Where things live

| Folder | What it holds |
|--------|---------------|
| `product/` | Planning files: overview, roadmap, data shape, design system, shell, personas, flows, section specs |
| `src/sections/`, `src/shell/` | Screen design components (React, Tailwind CSS v4, props-based) |
| `wiki/` | The project brain, also an Obsidian vault |
| `product-plan/` | The generated export package |

## 5. Your first session

1. Run `/product-vision` (or `@00-product-vision`) and describe your product in your own words.
2. Run `/design-os:persona` to make your primary user concrete.
3. Continue with `/product-roadmap`. From here, follow [[how-to/planning-flow]].

## Related
- [[how-to/planning-flow]] — every step in order
- [[how-to/project-brain]] — how the wiki works
- `agents.md` — the full directive for agents
