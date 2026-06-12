---
draft: "rustic--dressing.pier"
style: "rustic"
brush: "dressing.pier"
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

# Brush draft: `dressing.pier` (style: rustic)

> DRAFT — not a ticket. This directory is outside lisa's scan dirs; promotion is a human
> act (see `README.md` beside this file). E-32 Rule 3: the system never schedules its own work.

## Context (self-contained)

Dressed quarry stone is spent only at structural and weather lines — quoins lace the corners of an otherwise rubble cottage, and buttresses brace the long walls of the heavy tithe barn. Both are vertical runs of the same crisp stone_bricks kept deliberately distinct from the uncoursed fieldstone. No owned brush places dressed stone at corners or as a projecting pier; one parametrized brush covers both because they are the same member at different placements.

**Purpose:** Lays vertical dressed-stone (stone_bricks) members at structural lines — alternating corner quoins on the cottage and projecting buttress piers on the tithe barn — so the dressed-vs-rubble distinction reads where structure and weather demand it.

## Acceptance Criteria

- [ ] quoin mode skins alternating stone_bricks up a corner arris, leaving field courses between untouched.
- [ ] buttress mode with projection=N stands a pier N cells off the wall face.
- [ ] batter steps the pier inward by the configured set-back as it rises.
- [ ] height='wallTop' terminates the run at the eave/wall-top line.
- [ ] A corner or face with no underlying field produces no placements.

## Parameter sketch

```
{ block: string, mode: 'quoin'|'buttress', projection: integer (0 = flush quoin, ≥1 = buttress stand-off), height: integer | 'wallTop', batter?: integer (set-back courses per step) }
```

## Composition

Runs AFTER surface.fill/surface.paint has laid the rubble field (the pier over-skins corners and faces) and reads the wall/zone lines plus corner features. In buttress mode it ADDS cells beyond the wall plane, so it must run before exterior-exposure reasoning is final and before surface.strip-salt. Sits on the plinth course and shares the dressing kit with opening-dressing.

## Test plan

quoin mode on a box corner → alternating stone_bricks up the arris, field between courses untouched; buttress mode projection=1 → a one-deep pier standing off the wall face to height; batter steps the pier inward per set-back; height='wallTop' stops the run at the eave line; a corner/face with no field → no-op.

## Preview subject

An L-corner of cobblestone wall two storeys tall, plus a flat barn wall face for the buttress case.
