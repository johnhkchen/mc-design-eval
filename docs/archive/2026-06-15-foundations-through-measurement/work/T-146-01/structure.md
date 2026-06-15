# T-146-01 — Structure

The shape of the code. Five files: two created, three modified. No deletions.

## Created

### `src/view/surface-relief.mjs` (the technique module)
The shared relief op + the no-regress harness predicate. Header documents: proud emission in front of
existing shell cells (clinker charter), recess by exclusion (no air op), in-plane silhouette preserved
by construction, **construction-stage capability — never a workshop paint air-op**, PURE / byte-stable /
idempotent. Imports `bareBlock`, `occupancyFromCells`, `occupancy` helpers from `./occupancy.mjs`;
`projectSurface` from `./surface-grid.mjs`; `elevationMask`, `maskProportions`, `proportionRatios` from
`../form/silhouette-proportion.mjs`. (All three are cores/metrics, not TECHNIQUES — free to import.)

Public API:
```
export const SURFACE_RELIEF_SCHEMA = "surface-relief/v1";
export const RELIEF_DEFAULTS = Object.freeze({ depth: 1, span: 1, phase: 0 });

export function surfaceRelief(occ, opts) -> { placements:[{op:"voxel",pos,block}], report }
  // report: { faces, axis, every, span, phase, depth, strips, proudCells, fieldCells }

export function reliefNoRegress(occBefore, placements, { faces }) ->
  { inPlanePreserved:boolean, ratiosPreserved:boolean,
    perFace:[{face, maskEqual, propsEqual}], ratios:{before,after}, expectedWidening }
```
Internals (module-private): `DIRS` (face→unit vec, as clinker), `ALONG_AXIS` (face→ the wall-run axis
index: ±x→z(2), ±z→x(0)), `namespaced`, `fail`, `isInt`, a `stripHit(rhythm, alongIndex, y, yBase)`
predicate. `surfaceRelief` order: validate opts (fail-loud) → per face build skin set via
`projectSurface` → collect eligible sorted cells → per cell, if on a strip emit `depth` proud cells
(break on `occ.has(out)`), else count as `fieldCells`. `reliefNoRegress`: build `occAfter` from
`occupancyFromCells(beforeCells ++ placements)`, project per-face elevations, compare masks +
`maskProportions`, compare whole-build `ridgeToEave`/`roofShare`, compute `aspect` delta as
`expectedWidening`.

### `src/view/surface-relief.test.mjs` (the proof)
Mirrors `clinker.test.mjs` group style. A `wallStub()` fixture: a hollow-ish shell with a flush front
face wide enough for ≥3 pilaster strips with a field between. Groups:
- **SR1 proud emission on a column rhythm** — strip columns get `depth` proud cells outward along the
  face normal; positions match `(alongIndex - phase) % every < span`.
- **SR2 recess by exclusion** — field columns (between strips) receive **zero** placements; `report.
  fieldCells > 0`; only strip columns are proud (the recessed read).
- **SR3 in-plane silhouette honored** — every placement shares (u,v) with an existing exterior cell
  (the rake/silhouette containment, clinker CL4 generalized).
- **SR4 idempotent** — second run on own output emits 0 placements.
- **SR5 row rhythm (belt course)** — `axis:"row"` emits horizontal proud bands by y parity/period.
- **SR6 depth ≥ 2 contiguous, stops at occupancy** — `depth:2` emits two cells; a blocked ray breaks.
- **SR7 byte-stable order** — placements deep-equal across repeated runs (sorted determinism).
- **SR8 fail-loud opts gates** — missing material, bad rhythm.axis/every, unknown face, depth 0 throw.
- **SR9 reliefNoRegress is the gate** — for a relieved face, `inPlanePreserved && ratiosPreserved`;
  and the perpendicular `aspect` widening is reported in `expectedWidening` (not a failure).
- **SR10 reliefProfile reads the relief** — (cross-module) project the relieved occupancy, assert
  `reliefProfile` reports `proud > 0` on the relieved face and `recessed`/`flush` on the field.

## Modified

### `src/view/surface-grid.mjs` (the relief-aware read — AC3)
Append one exported pure function (no change to existing exports):
```
export function reliefProfile(grid) ->
  { plane:number, proud:number, flush:number, recessed:number, max:number,
    byCell: (number)[][] }   // -1 proud | 0 flush | +1 recessed | null air, m×n
```
plane = modal `depth` over filled cells; classify each filled cell vs plane. Works on ortho and diag
grids (both carry `depth`). Header note: this consumes the per-cell depth the projection already
records, so the workshop can SEE proud/recessed structure; relief itself is a CONSTRUCTION-stage op
(`surface-relief.mjs`), never a paint air-op.

### `src/view/surface-grid.test.mjs` (cover the new read)
Add a group: build an occupancy with a known proud strip + a recessed field, project, assert
`reliefProfile` counts and `byCell` classification; assert an all-flush wall reports `proud===0 &&
recessed===0`; assert it runs on a diagonal grid.

### `src/pack/idiom-registry.mjs` (the door — AC1, AC4)
- Add import: `import { surfaceRelief } from "../view/surface-relief.mjs";` (next to clinker/limewash).
- Add a `"surface.relief"` `kind:"pass"` entry after `surface.limewash`: `fn: surfaceRelief`, `source`,
  `tests: "src/view/surface-relief.test.mjs"`, `composition:{consumes:["occupancy"],
  emits:["placements","report"]}`, `preview` (shell substrate `x0..x1=0..8, z0..z1=0..4, height 5`;
  params a column rhythm `every:3, span:1` on `["-z"]` with `material:"stripped_oak_log"`, depth 1;
  `realize` calls `surfaceRelief(occ, …)` and returns `overlayCells(cells, r.placements)`),
  `paramsSchema` over `{material, faces, rhythm{axis,every,span,phase}, depth}`.

### `src/pack/brush-door.conformance.test.mjs` (the tripwire — AC1)
Add `"surface-relief"` to the `TECHNIQUES` array (the E-35 comment line). No `ALLOWED` entry — only the
door imports it; the closed sweep then guards it like clinker/limewash.

## Ordering of changes (each step independently green)
1. `surface-relief.mjs` + `surface-relief.test.mjs` — the op, harness, and its proofs stand alone
   (imports only cores/metrics). `npm test` green in isolation.
2. `surface-grid.mjs` `reliefProfile` + its test — the read; SR10 in step 1's test then also passes.
3. `idiom-registry.mjs` entry + `brush-door.conformance.test.mjs` TECHNIQUES — wire the door; this is
   the shared-file blast-radius step, done last and verified with the full suite + `--repro`/`--offline`.

## Boundaries respected
- surface-relief is a TECHNIQUE: reachable ONLY through the registry door; never imported by a runner.
- The relief READ (`reliefProfile`) is in the free core surface-grid, so the workshop/gate can call it.
- No committed runner changes → no pinned record (`challenge/*.json`, `durable-skin/*.json`, milestone)
  changes → `--repro`/`--offline` byte-identical.
- No new per-building constants; `RELIEF_DEFAULTS` is the only frozen default table.
