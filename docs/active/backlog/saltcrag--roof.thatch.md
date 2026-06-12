---
draft: "saltcrag--roof.thatch"
style: "saltcrag"
brush: "roof.thatch"
type: brush-work-item
status: draft
provenance:
  function: "DecomposeBrushBacklog"
  model: "claude-opus-4-8"
  prompt_sha256: "db44b81821ec5e19914dfb2e2dd9766aa67c427ea463c95c7288df6942781ea6"
  generated: "2026-06-12T01:12:41.374Z"
promotion:
  promoted_by: "planner sanction via T-132-01 AC (gap brushes implemented off promoted drafts); executed in-ticket, no lisa dispatch"
  date: "2026-06-11"
  ticket: "T-132-01"
rework: []
---

# Brush draft: `roof.thatch` (style: saltcrag)

> DRAFT — not a ticket. This directory is outside lisa's scan dirs; promotion is a human
> act (see `README.md` beside this file). E-32 Rule 3: the system never schedules its own work.

## Context (self-contained)

The cottages that can't afford shingle pin 'down steep reed and marram cut from the dune,' raked against the gale; the poorest outbuildings are turfed (moss). Thatch's identity is its thickness and rounded, overhanging eave — a flat plank gable (roof.gable) cannot render the soft eyebrow or the rolled ridge. This brush gives a ≥2-voxel-thick pitched mass with an overshooting, rounded eave for the roofscape's poorer-neighbour pitch; turf reuses the same shape at a lower pitch via the field block.

**Purpose:** Builds the poorer cottage's steep reed/marram pitch (hay_block) with a thick, rounded, eyebrowed eave and rolled ridge — the raked thatch that reads distinctly from the village's tarred plank gables.

## Acceptance Criteria

- [ ] Roof mass is at least `thickness` voxels deep measured normal to the pitch
- [ ] Eave overshoots the wall plane by `eaveOvershoot` and rounds rather than ending in a hard plank edge
- [ ] Pitch below the steep minimum is rejected
- [ ] ridgeRoll=true caps the apex with a raised rolled course; ridgeBlock overrides the material for a bought ridge
- [ ] No interior cells are emitted below the pitch underside (roof is hollow)
- [ ] Cell list is identical across two runs of a fixed spec

## Parameter sketch

```
{ pitch: number(≥1 steep), block: string, thickness: integer(≥2), ridgeRoll: boolean, ridgeBlock: string|null, eaveOvershoot: integer }
```

## Composition

Construct: consumes spec, emits cells. An alternative to roof.gable for a given footprint — never both on one roof. Runs AFTER the wall shell/wallplate exists; precedes surface.strip-salt (thatch greys but does not tar-streak). A bought slate ridge can still be requested via ridgeBlock; the default ridge is a rolled hay course.

## Test plan

Unit tests: (1) mass thickness normal to the pitch ≥ `thickness` at every sampled column; (2) eave cells extend `eaveOvershoot` past the wall plane and include a rounding cell (no hard 90° edge); (3) pitch below the configured minimum throws; (4) ridgeRoll toggles a raised apex course, ridgeBlock overrides its material; (5) underside is hollow — no fill cells beneath the pitch; (6) byte-stable cell list across two runs of one spec.

## Preview subject

A small square byre footprint with a wallplate ring at storey height, no roof yet.
