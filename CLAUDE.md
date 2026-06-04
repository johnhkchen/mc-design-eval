# CLAUDE.md

## Project

mc-design-eval — a measurement instrument for evaluating an LLM's spatial/material *design* capability via constrained, styled Minecraft builds. See `docs/specification.md`. Phase 1 holds the model fixed and compares prompting methods; the first milestone is an end-to-end "see an image" trial.

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
