# Plan — T-081-01 nxm-floorplan-infill

Ordered, independently-verifiable steps. Each step ends `npm test` green and is committable atomically.
Pure cores first (unit-tested), the metered runner last (round-trip + `exteriorHeld` throw).

## Step 1 — generator geometry (pure) + tests

`src/view/floorplan.mjs`: `FLOORPLAN_SCHEMA`, `TIER`, `DEFAULT_MATERIALS`, `storeysFromRead`,
`interiorBBox`, `gridPartition`, `interiorColumnsAtY` (+ `sliceMaskAtY`), `roomOfColumn`.

**Tests** (`floorplan.test.mjs`, synthetic):
- `storeysFromRead`: `floorLines [0,14]` → 2 storeys with the right `floorY`/`ceilY`; empty → [].
- `gridPartition`: a 10×10 interior, `rows:2,cols:2` → 1 xWall, 1 zWall, 4 rooms tiling the interior with
  no overlap and no gap; `rows:1,cols:1` → 0 walls, 1 room = the whole interior.
- `interiorColumnsAtY`: on a hollow box-shell slice, the enclosed interior columns are returned and the
  perimeter wall columns are not; a fully-solid slice → empty.

**Verify:** `npm test` green; partition rooms are disjoint and cover the interior.

## Step 2 — plan + placements (pure) + tests

`generateFloorplan` (+ `floorPlacements`, `wallPlacements`, `doorwayCells`), `applyFloorplan`.

**Tests:**
- **Floors at storey lines** (AC): every floor placement sits at a `storey.floorY`; none below an existing
  solid cell (foundation skipped).
- **Dividing walls on the grid** (AC): wall placements lie only on `xWalls`/`zWalls` columns, within
  `[floorY+1..ceilY]`, and only on interior columns.
- **Bulk = program** (AC): a 2×2 spec on a synthetic two-storey shell yields many placements from a 5-field
  spec (the partition is generated, not enumerated by the caller).
- **Interior openings = exclusion, no air op** (AC + [[facade-recess-by-exclusion]]): each room pair has a
  doorway = a *missing* wall cell (a 1×2 gap); assert **no placement** has block `minecraft:air` and the
  gap cells are absent from `placements`.
- **Exterior untouched**: `exteriorHeld(occ, occOf(applyFloorplan(shellArtifact, placements)))` is `held`
  (reuse `hollow-carve` — fill is invisible). A negative control: a placement forced onto a skin column
  flips `held:false` (the proof discriminates).
- **Materials from manifest**: every placed block ∈ the test manifest.

**Verify:** `npm test` green; the no-air-op + exterior-held assertions pass.

## Step 3 — plausibility gate (pure) + tests

`gateFloorplan` (+ `roomGraphConnected`, `openingsByFace`).

**Tests — one per constraint, pass and fail:**
- roomsValid: degenerate (zero-area) room → fail; normal → pass.
- roomsNonOverlap: hand-built overlapping rooms → fail; a real partition → pass.
- reachable: a spanning door policy → connected (pass); strip all doors → disconnected (fail).
- floorsAtStoreyLines: a storey whose `floorY ∉ floorLines` → fail.
- storeyCountMatches: a plan with the wrong storey count → fail.
- gridFitsEnvelope: a wall line outside the bbox → fail.
- openingsAlignShell: with synthetic exterior openings + aligned doorways → pass; **with no exterior
  openings → pass + the `residual` string is non-empty** (Rule 7 named residual).
- Aggregate: a clean 2×2 plan on the synthetic two-storey shell → `pass:true`, all six hard constraints
  true, `residual` present.

**Verify:** `npm test` green; each constraint independently flips.

## Step 4 — the metered seam (prompt + parser) + tests

`buildFloorplanPrompt`, `parseFloorplanSpec`.

**Tests:**
- `parseFloorplanSpec`: clean JSON → spec; fenced / fence-then-prose (via `parseJsonReply`) → spec;
  missing fields → defaults (`rows:2,cols:2`, `DEFAULT_MATERIALS`, `doorPolicy:"spanning"`); a material not
  in the manifest → clamped to the default; non-JSON → throws.
- `buildFloorplanPrompt`: includes footprint dims, every storey line, the manifest ids, and — when
  `openings()` is empty — the "identify the front door from the elevation" instruction; output-contract
  line present.

**Verify:** `npm test` green.

## Step 5 — routing record

`OP_ROUTING` `floorplan-author` (strong) in `src/model-tier.mjs`; extend `model-tier.test.mjs` to assert
its presence + tier + that `routingTableMarkdown()` renders it.

**Verify:** `npm test` green; `routingTableMarkdown` contains `floorplan-author`.

## Step 6 — the runner + live artifacts

`benchmarks/sculpture/floorplan-cottage.mjs` + `package.json` `floorplan:cottage`. Structure §runner.
Metered (one strong `claude -p` call over the plan+elevation images) + GL renders — **not** unit-tested,
gated by:
- the round-trip (load → read → steer → generate → gate → fill → render),
- the **`exteriorHeld` throw** (the fill must be invisible — hard runtime invariant),
- the live AJV gate on the written artifact (`validate-artifact.mjs --expect valid`).

**Run** `npm run floorplan:cottage` → write `floorplan-cottage-artifact.json`, `floorplan-report.json`,
before/after PNGs to `docs/active/work/T-081-01/`. The gate verdict + residual go in the report.

**Verify:** runner exits 0; `exteriorHeld.held === true`; before/after exterior renders byte-identical
(`cmp`); written artifact validates; gate report shows per-constraint pass/fail + a named residual.

## Step 7 — progress + review

`progress.md` (what landed, deviations) then `review.md` (changes, coverage, open concerns, the residual).

## Testing strategy (summary)

| Layer | How verified |
| --- | --- |
| generator geometry (storeys, grid, interior mask) | unit — synthetic shells, exact partitions |
| plan + placements (floors, walls, doorways) | unit — AC clauses: floors@lines, walls@grid, no-air-op, exterior-held + negative control |
| plausibility gate (6 constraints + residual) | unit — each constraint flips pass↔fail; aggregate clean plan; vacuous-openings → residual |
| prompt + parser | unit — defaults, manifest clamp, fence-then-prose, throw-on-non-JSON |
| routing record | unit — `OP_ROUTING` table + `routingTableMarkdown` |
| live steering + GL render | runner — round-trip + `exteriorHeld` throw + AJV gate (metered boundary, not unit-tested, same as `hollow:cottage`) |

## Risks / mitigations
- **`openings()` empty on the cottage** → front-door alignment can't be geometric. *Mitigation:* the LLM's
  `frontDoor` steers it; "openingsAlignShell" becomes the named residual, not a fail (design.md §gate).
- **Irregular/gabled footprint** → a `fill` box would leak outside the shell. *Mitigation:*
  `interiorColumnsAtY` gates every cell to the enclosed slice; per-cell `voxel` ops; `exteriorHeld` proves
  it and the runner throws otherwise.
- **A steered material outside the manifest** → AJV reject. *Mitigation:* `parseFloorplanSpec` clamps to
  the manifest / `DEFAULT_MATERIALS`.
- **Metered call fails** → *Mitigation:* deterministic `{rows:2,cols:2}` fallback; the generator + gate run
  regardless, so the round-trip + artifact always complete.
