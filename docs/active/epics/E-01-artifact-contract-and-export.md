---
id: E-01
title: artifact-contract-and-export
type: epic
status: open
priority: high
depends_on: []
spec: "§5, §6"
stories: [S-001]
---

## Goal

Define and implement the **design-artifact contract** — the structured object the LLM emits — and the deterministic **schematic export** from it. This is the spine of the whole instrument (§5): everything downstream reads the artifact, and the human-buildable deliverable is exported from it.

## Why it matters

The seam between "LLM emits a design" and "everything else operates on that design" is what makes the system analyzable. Get the contract right and the render, evaluation, rating, and Phase-2 layers all stay fixed while only prompt construction varies. Get it wrong and every downstream layer churns.

> **Milestone scope (current):** Story **S-001** — schema, primitive expansion, structured-output binding, style palette — is in the active "see-an-image" milestone. The **schematic exporter and Litematica round-trip are deferred**: they are off the path to rendering an image, and the round-trip requires a human building in Litematica (not autonomously completable by the swarm). They remain in this epic's scope and will be drafted as a story when the export milestone is tackled.

## Scope

**In:**
- The design-artifact schema: placements (explicit voxels **and** compact primitives like box/line/fill), palette manifest, style intent + rationale, reproducibility metadata (method ID, model ID, seed, server-state ID).
- One style palette as a JSON whitelist of survival-obtainable blocks (§6).
- Schematic exporter: artifact → Litematica `.litematic` (and/or WorldEdit `.schem` via conversion).
- A hand-built round-trip check: export a trivial design, load it in Litematica, build it in survival.

**Out:**
- Validation logic (palette/buildability) — that's E-04.
- Rendering — that's E-02.
- Multiple palettes / styles — one is enough to start (open question, §12).

## Candidate stories

- Design-artifact schema + structured-output binding for the Agent SDK.
- Style-palette data format + first palette whitelist.
- Schematic exporter (`.litematic`) with a Litematica round-trip test.

## Definition of done

- A schema a model can emit against, with both voxel and primitive placements representable.
- One palette whitelist committed as data.
- An artifact can be exported to a `.litematic` that loads and builds correctly in Litematica.

## Open questions (from §12)

- Explicit voxel list, primitive ops, or both — and the token-budget ceiling that forces the choice.
- Schematic format: `.litematic` directly vs `.schem` + convert.
