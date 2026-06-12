---
draft: "saltcrag--surface.clinker"
style: "saltcrag"
brush: "surface.clinker"
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
rework:
  - "zones param reshaped to the house pass convention: the sketch's zones: upper|array<zone> became the injected zoneOf lens + zone name every owned pass uses (timber-frame/surface.fill precedent)"
  - "the sketch's shadow-line formula floor(panelHeight/course) counts COURSES; shadow lines are the proud half — report carries both (courses, shadowLines)"
---

# Brush draft: `surface.clinker` (style: saltcrag)

> DRAFT — not a ticket. This directory is outside lisa's scan dirs; promotion is a human
> act (see `README.md` beside this file). E-32 Rule 3: the system never schedules its own work.

## Context (self-contained)

Saltcrag's loft and gable are 'boarded, not built' — thin softwood deals lapped clinker-fashion, the same craft that seals a hull, then tarred black. The visual signature is the horizontal shadow-line rhythm of overlapping boards, which neither surface.fill (a flat skin) nor timber-frame (post-and-beam infill panels) produces. This brush lays alternating proud/recessed courses to cast that lap shadow, and only on the light upper storey where thin boards belong.

**Purpose:** Clads the boarded upper storey and loft gable in lapped clinker boards (dark_oak family), stepping each horizontal course proud of the one below so the wall reads as overlapping tarred hull-planking.

## Acceptance Criteria

- [ ] Boards run horizontally; each course is offset by `lap` from the course below (alternating proud/flush)
- [ ] Placements stay within the named zone; ground/rubble cells are untouched
- [ ] On a gable, the rake follows the roof slope — no board protrudes past the gable line
- [ ] Visible shadow-line count equals floor(panelHeight / course)
- [ ] trimBlock caps the top and bottom course when set; null leaves raw board
- [ ] Re-run on its own output is idempotent; report gives course count and proud-cell count

## Parameter sketch

```
{ board: string, lap: integer(0..1 proud step in faces), course: integer(board height), trimBlock: string|null, zones: "upper"|array<zone> }
```

## Composition

Consumes occupancy+zones, emits placements+report. Runs on the upper zone AFTER hollow (clads a real shell, not solid) and AFTER timber-frame if any posts exist (laps between them); precedes roof.gable's eave so the topmost lap meets the wallplate. Mutually exclusive with surface.fill on the same zone — one or the other dresses the upper storey.

## Test plan

Unit tests: (1) every emitted course is exactly `course` blocks tall and horizontal; (2) adjacent courses differ in depth by `lap`, alternating proud/flush; (3) no placement outside the named zone or below the upper wallplate; (4) a gable-raked panel emits no cell past the slope line; (5) trimBlock set → top and bottom courses use it, null → board everywhere; (6) re-run is idempotent and reports course count + proud-cell count.

## Preview subject

A two-storey wall stub: a rubble ground course plus a 4-high upper panel awaiting cladding, with a raked gable on top.
