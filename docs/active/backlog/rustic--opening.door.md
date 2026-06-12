---
draft: "rustic--opening.door"
style: "rustic"
brush: "opening.door"
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

# Brush draft: `opening.door` (style: rustic)

> DRAFT — not a ticket. This directory is outside lisa's scan dirs; promotion is a human
> act (see `README.md` beside this file). E-32 Rule 3: the system never schedules its own work.

## Context (self-contained)

Door leaves are deliberate diegetic materials here: warm panelled spruce boards for the cottage, brighter golden oak boarding for the barn's big wagon doors, both set into stone reveals. opening-dressing frames the stone jambs and head but never places the leaf, and surface.paint only repaints existing surfaces — it cannot fill an aperture's air. The leaf and the wide wagon fill are therefore unowned.

**Purpose:** Sets the leaf into a dressed opening — a spruce_door panel for cottage doorways and an oak_planks board fill for the barn's wide wagon apertures.

## Acceptance Criteria

- [ ] door kind places a single spruce_door at the threshold, oriented to the hinge.
- [ ] wagon kind fills a 3×4 aperture plane with oak_planks boarding.
- [ ] split=true divides the wagon leaf with a centre seam.
- [ ] The aperture head row is left clear for the arch/flat-head brush.
- [ ] A solid aperture produces no placements.

## Parameter sketch

```
{ kind: 'door'|'wagon', block: string, hinge?: cardinal, split?: boolean (double wagon leaf) }
```

## Composition

Runs AFTER opening-dressing (stone reveal) and arch/head.flat (the opening's head) and AFTER hollow, consuming door-tagged apertures. kind='door' places a single door block at the threshold; kind='wagon' fills the aperture plane with boards, optionally split as a double leaf. Precedes surface.paint so the boarding keeps its kit block.

## Test plan

door kind on a 1×2 aperture → spruce_door oriented to hinge, threshold at floor level; wagon kind on a 3×4 aperture → oak_planks plane filling the void, split=true leaves a centre seam; the head row is left clear for the arch/flat head; a solid (un-voided) aperture → no-op.

## Preview subject

A stone wall carrying one 1×2 doorway and one 3×4 wagon opening, both dressed and voided.
