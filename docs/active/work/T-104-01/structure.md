# T-104-01 roof-as-program — Structure

File-level blueprint. Pure cores in `src/` (under the `npm test` glob), impure runner in
`benchmarks/sculpture/`, following the T-102/T-103 seam exactly.

## Files created

### 1. `src/form/roof-fit.mjs` (+ `roof-fit.test.mjs`) — PURE fit core

Consumes the component-record JSON (the contract — no GLB, no occupancy). No I/O/GL/Date/random.

```
export const ROOF_FIT_SCHEMA = "roof-fit/v1";
export const ROOF_FIT_DEFAULTS = Object.freeze({
  pitchAgreeDeg: 15,    // glbFit usable when angleToVoxelDeg ≤ this; else voxel fit + finding
  programRmseTol: 0.75, // declared tolerance: generated surface vs chosen plane (cells)
  minRun: 2,            // ridge→eave horizontal run sanity floor
  maxPitch: 4,          // rise/run sanity ceiling
});

export function gablesFromRecord(record, opts) → { gables, findings }
  // gables: one per ridge pair of pitched planes, each:
  // { id: "gable-<a>-<b>", ridge: {axis, y},                       // y rounded to halves
  //   sides: [{ planeId, eaveDir, pitch, pitchSource: "glb"|"voxel",
  //             glbAngleDeg|null, eaveY, overhang|null }],
  //   footprint: { runs, bbox },                                   // union of the pair's extents
  //   hip: { demanded, ends },                                     // end-slope detection
  //   sane: boolean, reasons: [] }                                 // ridge>eaves, run≥minRun, pitch∈(0,maxPitch]
  // findings: fit-source-voxel / glb-fit-missing / roof-region-unfitted (flat + unpaired planes,
  //           insane gables) — every non-participating plane is named.

export function evalSideHeight(side, ridge, x, z) → number   // chosen-plane height at a column
export function programFitError(gable, heights) → { perSide: [{planeId, rmse}], rmse }
  // RMSE of generated column heights vs the chosen fit planes over each side's extent —
  // the recorded fit error; gable rejected when rmse > programRmseTol (Rule 1 fallback).
```

Internal: pitch/eave extraction from `voxelFit|glbFit.gradient` resolved against `eave.dir`;
overhang from `wallSlabs` plane offsets (null + finding when slab missing); hip demand from
step-down height profile at ridge-axis end columns of the combined extent.

### 2. `src/view/roof-generate.mjs` (+ test) — PURE generator

Parameters → voxel cells. Composes MULTIPLE gables (cottage's main + cross gable intersect): per
column the covering gable with the greater height wins (valleys fall out naturally).

```
export const STAIR_FACING = Object.freeze({ "+x": "east", "-x": "west", "+z": "south", "-z": "north" });
export function roofFamily(kitRows, vocab) → { field, stairs|null, slab|null, findings }
  // kit row: formClass "cube", whereUsed includes "roof", role preferring /field/.
  // name morphology: *_planks→<wood>_stairs/_slab; *_bricks→*_brick_stairs/_slab; else <id>_stairs/_slab;
  // candidates validated against the injected vocab Set; missing → null + finding (full-block fallback).
export function roofHeightfield(gables) → { heights: Map "x,z"→h, owner: Map "x,z"→{gable, side},
                                            bandFloor: number }
  // h = min(ridgeY, eaveY + pitch·distFromEave [, end slopes when hip.demanded]), max across
  // gables per column, quantized to halves; bandFloor = ⌊min eaveY over accepted gables⌋.
export function generateRoof(gables, family, opts) → { cells, counts: {full, stairs, slabs}, heights }
  // SOLID wedge: field block from bandFloor..⌊h⌋ per column. Surface program on top of solid:
  //   rise 1 vs downhill neighbor → stair tread {facing: uphill (STAIR_FACING), half: "bottom",
  //     shape: "straight"} replacing the top cell;
  //   h ends in .5 → slab {type:"bottom"} above the solid;
  //   rise ≥2 (steep) → full blocks carry the riser, stair only at the tread edge;
  //   ridge/valley meets (equal h, opposing owners) and family gaps → full block / slab cap.
  // cells: [{pos:[x,y,z], block, form?, state?}] — stairs/slabs carry form:"fixture" + state
  //   (CARD_ROWS vocabulary), matching occupancyFromCells semantics.
```

### 3. `src/view/roof-swap.mjs` (+ test) — PURE swap under the cage

```
export function massView(occ, keys) → occupancy        // forms cleared for `keys` only (the
  // generated roof counts as silhouette mass; everything else keeps fixtures-are-dressing)
export function chimneyColumns(record, occ) → Set "x,z" // protrusion-role mass footprints ∩ roof
  // footprint, ∪ protrudingStackRegion(occ).columns
export function roofBandCensus(occ, { footprint, bandFloor, exclude, spikeFaces }) → { spikes, cells }
  // protrusionCensus restricted to y ≥ bandFloor over footprint, chimney columns excluded
export function swapRoof(occ, { gables, family, refSils, protect, chimney, opts }) → {
  occ,                       // accepted: swapped; rejected: the INPUT, unchanged (auto-rollback)
  accepted, reasons: [],
  iou: { baseline, final },  // silhouetteIoUs: baseline on input, final on massView(candidate, roofKeys)
  closure: { input, candidate },  // closureCheck both; closed-strict / reached-no-regress (T-102 rule)
  carve: { removed },        // cells removed from the gable footprints at y ≥ bandFloor (chimney cols excluded)
  generated: { counts, keys },
  reseat: { added },         // chimney columns extended down to the new surface, own bottom block
  census: { before, after }, // roofBandCensus over the generated footprints + whole-band variant
  fitError,                  // programFitError result, recorded regardless of verdict
}
```

Judge order: per-azimuth IoU floor (`final[a] ≥ baseline[a] − iouTolerance`, REGULARIZE_DEFAULTS) →
closure → protect (`protectViolations`, reseat additions explicitly allowed + listed). Per-gable
tolerance rejection happens in fit/error space *before* composing; the cage judges the composition.

### 4. `benchmarks/sculpture/roof-program.mjs` — IMPURE runner

Template: `regularize-shell.mjs` (header comment, deterministic core run twice, honest-failure
record, renders best-effort, md twin). Registry-driven; no subject constants:

- Inputs per subject `k`: shell `regularize/<k>/artifact.json` (sha256 **must equal** the component
  record's `source.sha256` — drift pin), record `components/<k>.json` (ajv-validated against the
  committed schema), kit `kit/<k>.json`, GLB path from `SUBJECTS[k].glb` (durable-skin registry).
- Vocabulary: `Object.keys(mcData().blocksByName)` (`render/src/version.mjs`) → Set for `roofFamily`.
- Deterministic core (no GL): fit → family → generate → swap → censuses; run **twice**, artifacts
  byte-identical, sha256 recorded.
- **Unmapped gate**: `expandArtifact(artifact)` → `buildWorldFromVoxels(voxels)`; `unmapped.length
  > 0` THROWS (AC: render unmapped empty — also live-proves every stair/slab state).
- Declared targets (asserted, T-102 style): generated-region roof-band spikes after = **0**;
  whole-roof-band after reported (and ≤ before). Cage: zero unexplained rejections.
- Renders before/after at `+x-z`(135°), `-x-z`(225°), `-x+z`(315°) via `renderViews`; frames
  `pr/assets/frames/roof-<k>-{before,after}.png` from the 225° witness angle. Record carries the
  pinned stairs-invisible lens note.
- Outputs: `roof/<k>.json` (schema `roof-program/v1`) + `roof/<k>.md` + `roof/<k>/artifact.json`.
- Flags: `--offline` (re-assert committed record: artifact sha, trace consistency, pins),
  `--repro` (re-run deterministic core, compare shas vs committed record, no GL).
- Statuses: accepted run → gate-style exit 0; all-gables-fallback → record `status:"fallback"`
  with findings, exit 0 (a *correct* Rule 1 outcome); thrown stage → `{status:"pipeline-failed",
  stage, error}`, exit 1.

## Files modified

### 5. `src/view/shell-regularize.mjs`
`protectViolations(before, after, protect)` becomes **exported** (currently internal at line 424) —
the swap judge reuses the cage's protect check verbatim instead of re-implementing it. No behavior
change; existing tests untouched.

### 6. `package.json`
Scripts: `"roof:cottage" | "roof:gatehouse" | "roof:church": "node benchmarks/sculpture/roof-program.mjs --subject <k>"`.
(Church script exists for registry-generality; the AC's live runs are cottage + gatehouse.)

## Module boundaries

- `roof-fit` (src/form): record-space math only — no occupancy, no blocks. Depends on nothing in
  src/view. Mirrors `component-decompose`'s domain split.
- `roof-generate` (src/view): blocks/states/forms — depends on `fixture-card` conventions (state
  vocabulary) and `roof-fit` types (gable shape), not on the cage.
- `roof-swap` (src/view): occupancy surgery + judging — depends on `occupancy`, `shell-regularize`
  (census, silhouettes, defaults, protectViolations, protrudingStackRegion), `shell-integrity`
  (closureCheck), `roof-generate` (cells in, via caller or direct call — caller passes generated
  cells? No: swapRoof calls generateRoof internally? **Decision: swapRoof receives `gables` +
  `family` and calls the generator itself** so carve/compose/reseat agree on one heightfield).
- Runner: wiring only; every number it records comes from the cores.

## Synthetic test fixtures (in the test files, no fixture files on disk)

- `roof-fit.test.mjs`: hand-built minimal component records — a symmetric 9×6 gable pair (glb
  agreeing), a glb-disagreeing pair (>15°), a glb-missing pair, a hip-demanded pair (end
  step-down), an insane pair (ridge below eave), flat + unpaired planes (finding paths), wallSlabs
  present/absent (overhang/null).
- `roof-generate.test.mjs`: family derivation (spruce_planks, deepslate_bricks, unknown block,
  vocab-missing stair); single gable at pitch 1 (all-stair slope, facing/half per side), pitch 0.5
  (slab half-steps), pitch 2 (full-block risers), two intersecting gables (valley, owner ties);
  assertions: solid infill (no air below surface inside footprint), footprint containment, every
  state legal per CARD_ROWS property sets, counts add up.
- `roof-swap.test.mjs`: synthetic spiky-roof occupancy (walls + noisy roof + 1-column chimney) +
  matching record; accept path (band census →0, IoU/closure hold, chimney byte-identical,
  reseat.added fills the gap); rollback paths (iouTolerance:0 with adversarial refSils → rejected,
  occ === input; closure regression via forced hole; protect violation via chimney inside carve);
  massView leaves non-roof fixtures dressed.

## Order of changes (each commit-able)

1. Export `protectViolations` (with its JSDoc) — trivial, unblocks roof-swap tests.
2. `roof-fit.mjs` + tests (pure; no deps on 3–5).
3. `roof-generate.mjs` + tests.
4. `roof-swap.mjs` + tests (composes 2+3 against the cage).
5. Runner + package.json scripts; `--offline`/`--repro` paths.
6. Live runs `roof:cottage`, `roof:gatehouse`; commit records, artifacts, frames; `npm test` green.
