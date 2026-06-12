---
draft: "rustic--roof.fascia"
style: "rustic"
brush: "roof.fascia"
type: brush-work-item
status: draft
provenance:
  function: "DecomposeBrushBacklog"
  model: "claude-opus-4-8"
  prompt_sha256: "54bf3d50ed7c4b0ffb4e0f596afb506fb446c1c2e0f648d16dbce2d88f0b8436"
  generated: "2026-06-12T00:26:24.816Z"
promotion:
  promoted_by: null
  date: null
  ticket: null
rework: []
---

# Brush draft: `roof.fascia` (style: rustic)

> DRAFT — not a ticket. This directory is outside lisa's scan dirs; promotion is a human
> act (see `README.md` beside this file). E-32 Rule 3: the system never schedules its own work.

## Context (self-contained)

Tudor and farmstead roofs read as boarded slopes finished with a heavy dark edge — the eaves, the gable-end verge, and the rake fascia are trimmed in the darker oak board while the field stays the lighter sawn plank. The roof construct brushes emit only the field; nothing currently distinguishes the boundary, so the slope reads as one flat colour. This brush identifies the perimeter cells of an emitted roof and over-skins the selected edges by `depth` courses.

**Purpose:** Bands the eave, verge and rake edges of every roof slope in the darker dark_oak_planks over the lighter spruce_planks field, so the roof reads as a boarded slope with a deep painted edge — the signature both the cottage and barn concepts show.

## Acceptance Criteria

- [ ] Eave courses of a gable roof are re-skinned to `block` with field cells unchanged.
- [ ] Verge and rake edges of a gable are banded; a hip roof emits no verge band.
- [ ] depth=N bands exactly N courses inward from each selected edge.
- [ ] Re-running the brush on its own output produces no new placements (idempotent).
- [ ] Empty roof-cell input yields an empty placement set and a clean report, no error.

## Parameter sketch

```
{ block: string (fascia board, e.g. dark_oak_planks), edges: array<'eave'|'verge'|'rake'>, depth: integer (courses banded inward, 1–2), returnUnder?: boolean (soffit return under the eave) }
```

## Composition

Runs AFTER a roof construct (roof.gable/roof.hip/roof.pyramid) or surface.roof-courses has laid the field, consuming the emitted roof cells; it walks the slope perimeter and re-skins the boundary courses, leaving the interior field intact. Must run BEFORE surface.strip-salt (so the thin trim run is not de-speckled) and before final surface.paint reconciliation.

## Test plan

gable input → eave+verge+rake cells become `block`, interior field unchanged; hip input → four eaves banded, no verge band emitted; pyramid input → four hips banded; depth=2 → exactly two courses banded inward from each selected edge; empty roof-cell input → empty placement set, no throw; re-run on own output → no change (idempotent).

## Preview subject

A single 7×5 pitch-1 gable roof of spruce_planks over a one-block wall stub.
