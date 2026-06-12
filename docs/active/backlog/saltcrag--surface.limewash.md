---
draft: "saltcrag--surface.limewash"
style: "saltcrag"
brush: "surface.limewash"
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
  - "aspect: weather|seaward named values dropped — builds carry no compass; the contract is aspects: array<direction> and the caller names the weather face"
  - "preserveRoles became preserve (block ids): passes see blocks, not roles; the role→block mapping is the caller's (material-identity-is-semantic)"
---

# Brush draft: `surface.limewash` (style: saltcrag)

> DRAFT — not a ticket. This directory is outside lisa's scan dirs; promotion is a human
> act (see `README.md` beside this file). E-32 Rule 3: the system never schedules its own work.

## Context (self-contained)

Saltcrag's limewash is 'an accent of thrift, not a clad finish' — shell-burned lime is brushed only on the face the storm hits, so a white gable-end stands against grey rubble. No owned pass is aspect-aware: surface.paint applies by role-priority across the whole skin and surface.fill is zone- not direction-driven, so neither can restrict a coat to the gale-facing aspect while leaving the field showing. This brush adds directional, partial-coverage finishing that preserves the role beneath rather than overwriting it.

**Purpose:** Brushes a thrifty lime sealing coat (white_terracotta) onto only the weather-facing exterior — saltcrag's seaward gable and gale-struck walls — preserving the grey rubble field everywhere else.

## Acceptance Criteria

- [ ] With one wall marked weather-facing, ≥90% of placements land on that aspect's exterior cells
- [ ] Landward walls retain their underlying field role (zero limewash placements there)
- [ ] Cells whose role is in preserveRoles (quoins, jambs) are never overpainted
- [ ] coverage=0.5 yields limewash on ~half the eligible weather-face cells, contiguous in runs ≥ minRun
- [ ] report lists painted aspect, eligible-vs-painted counts, and skipped preserved cells
- [ ] Re-running on its own output is idempotent (zero new placements)

## Parameter sketch

```
{ block: string, aspect: "weather"|"seaward"|array<direction>, coverage: number(0..1), minRun: integer, preserveRoles: array<string> }
```

## Composition

Consumes occupancy+zones (needs a facing/aspect zone), emits placements+report. Runs AFTER surface.fill and surface.paint have laid the rubble skin (it overlays, never replaces the structural field) and AFTER opening-dressing (so it laps around dressed jambs/quoins instead of burying them). Must run BEFORE surface.strip-salt so weathering can streak the fresh coat.

## Test plan

Unit tests: (1) shell with exactly one seaward-flagged wall → every placement lands on that aspect's exterior; (2) landward walls have zero limewash placements; (3) cells whose role ∈ preserveRoles never appear in placements; (4) coverage=1.0 paints every eligible weather cell, coverage=0.5 paints ~half in contiguous runs ≥ minRun; (5) second pass emits zero new placements (idempotent); (6) report counts eligible/painted/preserved-skipped.

## Preview subject

A single gabled cottage shell with one wall flagged seaward and three flagged landward, rubble field already laid.
