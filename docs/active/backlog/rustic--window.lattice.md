---
draft: "rustic--window.lattice"
style: "rustic"
brush: "window.lattice"
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

# Brush draft: `window.lattice` (style: rustic)

> DRAFT — not a ticket. This directory is outside lisa's scan dirs; promotion is a human
> act (see `README.md` beside this file). E-32 Rule 3: the system never schedules its own work.

## Context (self-contained)

Vernacular cottage windows are unglazed lights closed either by hinged board shutters or by a thin lattice reading as leading. dark_oak_trapdoor sits on the reveal face as shutter boards; spruce_fence stands inside the opening as an open grid. The opening-dressing brush only frames the hole in stone — the closure of the light itself is unowned, so apertures currently render as empty holes.

**Purpose:** Closes unglazed window apertures with either coppice-oak shutters (dark_oak_trapdoor) or an open leaded lattice (spruce_fence), giving both cottage storeys the gridded reveal the concept shows.

## Acceptance Criteria

- [ ] shutter fill places dark_oak_trapdoor on the reveal plane of a 2×2 aperture, facing outward.
- [ ] leaf='double' splits the shutter into two leaves with a centre seam.
- [ ] lattice fill spans the aperture void with spruce_fence members reading as a grid.
- [ ] A solid (un-voided) aperture produces no placements and is flagged in the report.
- [ ] facing places the closure on the correct reveal face for each of the four wall orientations.

## Parameter sketch

```
{ fill: 'shutter'|'lattice', block: string, leaf?: 'single'|'double' (shutter hinge split), facing?: cardinal (reveal face the closure sits on) }
```

## Composition

Runs AFTER opening-dressing has dressed the stone reveal (jambs/heads) and AFTER hollow (so the aperture is genuinely void), consuming feature-tagged window apertures. Emits leaf/lattice cells into the aperture air. Must precede surface.paint so the grid members keep their kit block rather than being repainted to the field.

## Test plan

shutter fill on a 2×2 aperture → trapdoors on the reveal plane facing outward; leaf='double' splits down the centre column; lattice fill on a 1×3 light → spruce_fence members spanning the void; a tagged aperture with no void (still solid) → no-op plus a report flag; facing honoured against all four wall orientations.

## Preview subject

A one-block stone wall panel with a single 2×2 dressed aperture cut clean through it.
