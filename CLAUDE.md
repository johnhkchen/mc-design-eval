# CLAUDE.md

## Project

mc-design-eval — a measurement instrument for evaluating an LLM's spatial/material *design* capability via constrained, styled Minecraft builds. See `docs/specification.md`. Phase 1 holds the model fixed and compares prompting methods; the first milestone is an end-to-end "see an image" trial.

**The architecture of record is `docs/knowledge/pipeline-philosophy.md`** (ratified 2026-06-11): AI at every stage, each in its native representation — language for world-building (materials are diegetic, not optical), image gen for the target, 3-D gen for form *evidence only* (never substrate, textures never read), VLM recognition for the building program, pure code (brushes) for construction, the workshop loop for model self-revision, and the frozen instrument for measurement. Creation is iterative and free; measurement is frozen and singular. Read it before proposing pipeline changes.

**The goal ladder is `docs/knowledge/milestones.md`**: M1 one house that looks like its picture → M2 a style invented in an afternoon → M3 a street that belongs together → M4 the Commissioned Village (one sentence in, an unattended day, strangers judge the screenshots) → M5 the self-serve site (users vote on styles with their feet; we serve the quality pipeline they can't build). Every epic names its rung. Numbers are diagnostics, never destinations; the gate is QA, the stranger is the judge; if a build passes the gate but fails the glance, the glance wins.

## Stack (Phase 1)

- **Language:** JavaScript (Node 20+, ESM / `.mjs`). Single toolchain — no Python on the hot path this phase.
- **Experiment harness:** trials invoke the model through the **`claude -p` headless shim** (default), authenticated by the Claude subscription (`--output-format stream-json --verbose --model <id>`); the Claude Agent SDK package (`@anthropic-ai/claude-agent-sdk`) is a drop-in alternative behind the same seam (`src/sdk-binding.mjs`). Model pinned by a single-sourced config ID (`src/config.mjs`) so Phase 2 can sweep it.
- **Artifact contract:** design artifacts are JSON, validated with `ajv` (JSON Schema). The canonical block-ID vocabulary comes from `minecraft-data`.
- **Rendering — no Minecraft server, no Mineflayer:** the design is built as an **in-memory voxel world** (`prismarine-world` / `prismarine-chunk`) and rendered **headless** to PNG with `prismarine-viewer` (textures via `minecraft-assets`). Headless WebGL via Playwright / headless Chromium (or headless-gl).
- **Render tool:** exposed to the harness as an in-process Agent SDK tool (a standalone MCP server is optional).
- **Out of scope this phase:** running a Minecraft server, Mineflayer bot placement, Litematica schematic export (deferred), and the scoring/rating layers (E-04/E-05).



### Directory Conventions

```
docs/active/tickets/    # Ticket files (markdown with YAML frontmatter)
docs/active/stories/    # Story files (same frontmatter pattern)
docs/active/work/       # Work artifacts, one subdirectory per ticket ID
```

---

The RDSPI workflow definition is in docs/knowledge/rdspi-workflow.md and is injected into agent context by lisa automatically.
