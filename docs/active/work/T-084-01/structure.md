# Structure — T-084-01 surface-coherence-ops

File-level blueprint. The shape of the code, not the code. Ordering where it matters.

## Files at a glance

| File | Action | Why |
| --- | --- | --- |
| `src/view/surface-grid.mjs` | **modify** | export `cellWorldPos(occ, spec, u, v, w)` + `orthoSpec(dir)` so the seal op can synthesize a hole's world pos from `(u,v,depth)`. Internal `worldOnAxis` math, now reusable. |
| `src/view/structural-read.mjs` | **modify** | export `airComponents(mask)` — the one enclosed-vs-border definition the seal ops reuse (no drift from `wallFields.holes`). |
| `src/view/surface-coherence.mjs` | **create** | the pure ops: `sealRoof`, `sealWallFace`, `sealWalls`, `watertightCheck`, `applyDeltas`, geometry helpers. |
| `src/view/surface-coherence.test.mjs` | **create** | synthetic-occupancy unit tests (holed shell seals; strays strip; breached shell fails; watertight passes a sealed shell). |
| `benchmarks/sculpture/surface-coherence.mjs` | **create** | the metered/GL runner on the cottage (detectors = metered; ops = pure). Writes report + sealed artifact + before/after PNGs. |
| `package.json` | **modify** | add `coherence:cottage` script. |

No deletions. All edits additive.

## `src/view/surface-grid.mjs` (modify — additive exports)

New exports, pure, no behaviour change to existing functions:

```
export function orthoSpec(dir)            // resolveDir(dir) → spec, throws if not ortho (diag/oblique out)
export function cellWorldPos(occ, spec, u, v, w)   // [x,y,z] from grid (u,v) + world W coord, via worldOnAxis
```

- `orthoSpec` wraps `resolveDir` and asserts `kind==="ortho"` (sealing is ortho-only; the +y roof and the
  four side faces). Diagonal/oblique → throw (consistent with the projection contract).
- `cellWorldPos` uses the existing `worldOnAxis(min,max,sign,idx)` against `occ.bounds` and the spec's
  `axisU/signU, axisV/signV, axisW`. `w` is the **world** coordinate on the depth axis (not an index).
- `worldOnAxis` stays internal; only these two wrappers are exported.

## `src/view/structural-read.mjs` (modify — one new export)

```
export function airComponents(mask)       // already implemented internally; just export it
```

Its return contract is unchanged: `[{ cellsUV:[[u,v]], bbox:{u0,v0,u1,v1}, borders:{top,bottom,left,right} }]`.
An enclosed component is `!top && !bottom && !left && !right`.

## `src/view/surface-coherence.mjs` (create — the deliverable, ~210 lines)

Imports: `projectSurface, gridMaskOf, orthoSpec, cellWorldPos` (surface-grid); `airComponents, roofRegion,
wallFields` (structural-read); `hollowableCore` (hollowable-mass); `bareBlock` (occupancy); `voxelKey`
(expand). **No** model/GL/API-key import (pure; runs under `src/**/*.test.mjs`).

### Constants / helpers
```
const SIDE_FACES = ["+x","-x","+z","-z"];
function namespaced(id)                    // bare → minecraft: (storage form), mirrors face-paint
function dominantBlock(cells, blockOf)     // most-common bareBlock over a cell list
function enclosedHoleCells(grid)           // airComponents(gridMaskOf(grid)) → flat [{u,v}] of enclosed comps
function neighbourDepthW(grid, spec, occ, u, v)  // world-W of the front-most filled 4-neighbour (for D3)
```

### `applyDeltas(artifact, deltas)`  → cloned artifact
Append-only placements under last-write-wins (alias of the face-paint write-back; re-exported here so the
op + its test + the runner share one entry point). Pure.

### `sealRoof(occ, { dominant, strip } = {})`  → `{ field, placements, stripped, filled, before, after }`
1. `region = roofRegion(occ)`; `grid = projectSurface(occ,"+y")`.
2. `field = dominant ?? dominantBlock(region.cells)`.
3. **strip**: for each roof surface cell `bareBlock(block) !== field` (∩ `strip` set if given) → recolor
   delta `{op:"voxel", pos:cell.voxel, block:namespaced(field)}`.
4. **fill**: `enclosedHoleCells(grid)` → for each, `pos = cellWorldPos(occ, spec, u, v, neighbourDepthW(...))`,
   delta block = field.
5. `before/after` = `roofOutlineCoverage` + stray count, the latter re-derived from
   `artifactOccupancy(applyDeltas(...))`. Returns counts + deltas.

### `roofOutlineCoverage(occ)`  → number in [0,1]
filled top cells / (filled ∪ enclosed-hole cells) — coverage over the **outline**, not the bbox (D2). 1.0
after holes sealed.

### `sealWallFace(occ, dir, { fieldMaterial, strip } = {})`  → `{ dir, field, placements, stripped, sealed, before, after }`
Same shape as `sealRoof` but per side face: field = `fieldMaterial ?? dominantBlock(face.surfaceCells)`;
strip non-field surface cells (∩ `strip`); seal enclosed face holes. `before/after` = intrusion count +
skin-hole count.

### `sealWalls(occ, { fieldMaterial, perFace } = {})`  → `{ faces:[…], placements, stripped, sealed }`
Folds the four `SIDE_FACES`, dedup deltas by `voxelKey` (corner voxel sealed once; last-write-wins).

### `watertightCheck(occ, { interior, padding = 1 } = {})`  → `{ watertight, interiorCells, reached, breaches }`
1. `interior` = arg set of `"x,y,z"` keys, else the enclosed mass (all-6-occupied) computed inline (same rule
   as `hollowableCore`, but we need the *keys*, so compute locally; documented as mirroring it).
2. Pad bbox by `padding`. BFS exterior air from the padded boundary, 6-connected, blocking on occupied cells
   **that are not interior** (interior is treated as air = the simulated hollow).
3. `reached` = |exterior ∩ interior|. `watertight = reached === 0`. `breaches` = up to N reached keys.
4. No bounds → `{watertight:true, interiorCells:0, reached:0, breaches:[]}`.

## `src/view/surface-coherence.test.mjs` (create — pure, ~140 lines)

Synthetic occupancies via `occupancyFromCells`. Cases (the AC's "holed shell seals; strays strip; breached
shell fails"):
- **roof strip**: 3×3 roof, 1 stray → `sealRoof` emits 1 recolor, `after.strayCount===0`, coverage 1.0.
- **roof hole**: 3×3 roof, centre missing → 1 enclosed hole → `sealRoof` fills 1, `after` coverage 1.0;
  bbox corners of a non-rectangular roof are **not** filled (enclosed-only).
- **wall strip + seal**: a wall face with one `spruce_planks` intrusion + one enclosed hole → 1 recolor +
  1 fill; intended openings (border-touching air) untouched.
- **watertight pass**: a sealed hollow box → `watertight:true`.
- **watertight fail**: same box with one skin voxel removed (breach) → `watertight:false`, `reached>0`;
  after `sealWalls` (or a manual seal of the gap) → `watertight:true`.
- **solid mass**: a filled cube → carve enclosed core → `watertight:true` (sealed by its own skin).
- **empty-safe**: `watertightCheck` / `sealRoof` on an empty occupancy return zero-deltas, no throw.
- **purity/source-guard** (optional, cheap): the module source contains no `ANTHROPIC_API_KEY`, no GL import
  (mirrors T-082-01's guard so the pure invariant can't regress).

## `benchmarks/sculpture/surface-coherence.mjs` (create — metered/GL, ~120 lines)

Mirrors `detector-routing.mjs`:
1. Load `concept-materials/cottage/after-artifact.json` → occ → `structuralRead`.
2. **Detectors (metered, light tier)** via `runTieredOp` + `requestTextWithImage`: `roof-patch` over the top
   render, `hollowable-mass` over the 3/4 — to source the candidate flags + the seal-before-hollow signal.
3. **Pure ops**: `sealRoof`, `sealWalls`, then `watertightCheck` on the sealed occupancy.
4. Re-derive occupancy from the sealed artifact; render before/after (`renderViews` top + 3/4).
5. Write `surface-coherence-report.json` (before/after coverage, stray/intrusion/skin-hole counts, watertight
   pass/fail + breach sample, detector usage/cost), the **sealed artifact**, and the PNGs to the work dir.

## Ordering of changes

1. surface-grid exports (`orthoSpec`, `cellWorldPos`) + structural-read export (`airComponents`) — enabling.
2. `surface-coherence.mjs` ops + tests — the pure core; `npm test` green here.
3. The runner + `package.json` script — the metered/GL proof.
4. Live cottage run → report + sealed artifact + PNGs → review.

## Public interface summary (what downstream imports)

- `sealRoof(occ, opts) → {field, placements, stripped, filled, before, after}`
- `sealWalls(occ, opts) → {faces, placements, stripped, sealed}` (+ `sealWallFace` per face)
- `watertightCheck(occ, opts) → {watertight, interiorCells, reached, breaches}`
- `applyDeltas(artifact, deltas) → artifact`
- surface-grid: `orthoSpec`, `cellWorldPos`; structural-read: `airComponents`.
