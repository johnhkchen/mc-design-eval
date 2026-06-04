---
id: E-02
title: render-harness
type: epic
status: open
priority: high
depends_on: [E-01]
spec: "§3, §4"
stories: [S-003]
---

## Goal

Stand up the **render harness**: turn a design artifact into images for scoring and optional vision-feedback, and expose that as a tool the Agent SDK can invoke (§4). Render-only — it never builds anything a human will place (§3, §6). **Decided: no Minecraft server and no Mineflayer** — the design is built as an in-memory voxel world and rendered headless with existing Minecraft rendering tools (JavaScript + `prismarine-viewer`).

## Why it matters

Scoring (rubric, head-to-head) and the multimodal archetype all need images of the build. The render path must be reliable and decoupled, so the artifact stays the source of truth and renders can be regenerated without re-querying the model. Dropping the live server removes the heaviest moving part and keeps the whole hot path in one JavaScript toolchain.

## Scope

**In:**
- JavaScript render environment: pinned Minecraft version (`minecraft-data`), textures (`minecraft-assets`), in-memory world (`prismarine-world` / `prismarine-chunk`).
- Build the artifact into an in-memory voxel world (no bot, no placement actions).
- Headless render to PNG with `prismarine-viewer` (Playwright/headless Chromium or headless-gl), with consistent camera/angles for comparability.
- Expose construct + render as an in-process Agent SDK tool (standalone MCP server optional).
- Render is confined to producing scoring images; never operates in survival.

**Out:**
- Schematic export (E-01, deferred) and validation (E-04).
- Any Minecraft server or Mineflayer bot.

## Candidate stories

- JavaScript render-environment scaffold (version + assets + in-memory world + headless render).
- Voxel-world construction from the expanded artifact.
- Headless prismarine-viewer render with fixed, comparable views.
- Render tool exposing construct+render to the harness.

## Definition of done

- Given an artifact, the harness returns deterministic, comparable render images headless, with no Minecraft server running.
- Exposed as a tool the Agent SDK can invoke within a trial.

## Resolved

- **No Minecraft server.** Build an in-memory voxel world (`prismarine-world`) and render headless with `prismarine-viewer`. Stack is JavaScript. (Was the §12 open question of live server vs direct render.)
