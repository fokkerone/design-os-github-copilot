# Design OS Agents

Containerized Design OS agents. Each agent is defined once in `definitions/<id>/agent.md`
and runs in its own Docker image (`FROM designos-agent-base`).
See `docs/agents/PLAN.md` for the migration plan.

```
agents/
├── definitions/            # Single source of truth — one folder per agent
│   └── <id>/
│       ├── agent.md        # Frontmatter (contract) + system prompt
│       └── Dockerfile      # Thin image: FROM designos-agent-base + agent.md   (Iteration 1)
├── runtime/                # Shared runner (Agent SDK, ask_user tool, write guard)   (Iteration 1)
└── base/Dockerfile         # designos-agent-base image                                (Iteration 1)
```

## Definition format (`agent.md`)

```yaml
---
id: product-vision              # kebab-case, equals folder name and image suffix
step: "00"                      # position in the Design OS flow
title: Product Vision
description: One line shown in the UI / agent picker
tools: [Read, Write, Edit, Glob]  # built-in SDK tools the agent may use (ask_user is always added)
reads:                          # files the agent may read (globs, relative to /workspace)
  - product/**
writes:                         # files the agent may create/modify — enforced by the runner
  - product/product-overview.md
requires: []                    # files that must exist before the agent starts
next: product-roadmap           # handoff: suggested next agent
params: []                      # runtime parameters, e.g. [section] (used from Iteration 5)
---
<system prompt in Markdown>
```

### Prompt conventions

- **Tool-neutral:** ask questions only via the `ask_user` tool (it renders as numbered options in the
  CLI and as buttons in the web app). Never reference `/slash-commands` or `@copilot-agents`;
  refer to other agents by their `id` (e.g. "the `product-roadmap` agent").
- **One job:** the agent only writes what is listed in `writes:`. The runner rejects anything else.
- **Paths** are relative to the workspace root (`/workspace` in the container), e.g. `product/...`.
