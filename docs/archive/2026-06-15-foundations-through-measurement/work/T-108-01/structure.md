# T-108-01 gable-and-verge-fit — Structure

## Files

| File | Change | Role |
|---|---|---|
| `src/form/roof-end-fit.mjs` | **create** | Pure end-face fit: GLB mesh → per-end face/verge parameters on gables |
| `src/form/roof-end-fit.test.mjs` | **create** | Synthetic-mesh + synthetic-gable unit tests |
| `src/view/roof-generate.mjs` | modify | Ends-aware heightfield (trim + sheet flag) and fill rule |
| `src/view/roof-generate.test.mjs` | modify | Trim/sheet/solid fill cases |
| `src/view/roof-swap.mjs` | modify | Carve set from pool footprints; end-fitted ladder rungs; ends in attempt records |
| `src/view/roof-swap.test.mjs` | modify | Carve-residue, ladder order/dedup, rollback cases |
| `benchmarks/sculpture/roof-program.mjs` | modify | Alignment + end-fit wiring, evidence angles (+45°), record/md fields, acceptance budget |
| `benchmarks/sculpture/roof/{cottage,gatehouse}.{json,md}` + artifacts/frames | regenerate | Live evidence (runner output, committed) |

No deletions. No schema-file changes (`roof-program/v1` gains additive fields only).

## Module: `src/form/roof-end-fit.mjs` (new, PURE — no I/O/GL/Date/random)

```js
export const END_FIT_SCHEMA = "roof-end-fit/v1";
export const END_FIT_DEFAULTS = Object.freeze({
  faceAngleDeg: 25,   // end-face triangle selection: |normal·dir| ≥ cos(this) — glbFitForPlane's default
  minTriangles: 1,    // a face plane is well-posed from one triangle (unlike a gradient fit)
});

/** Voxel-space triangles from a GLB mesh under an alignment: {verts, centroid, normal, area}[].
 *  Normals transformed per-axis (divide by alignment.scales, renormalize). */
export function alignedTriangles(mesh, alignment)

/** Fit both ends of every sane, non-hip-demanded gable against the GLB end faces.
 *  Returns NEW gables (input untouched) with `ends: {lo, hi}` attached, plus findings.
 *  An end: {dir:"+z"|…, coord, faceCoord, overhang, source:"glb",
 *           glb:{face, faceRmse, wall, roofEnd, triangles, wallTriangles}}  — or null (not fitted),
 *  with every null explained by a named finding (end-unfitted / end-fit-insane / end-hip).  */
export function fitGableEnds(gables, record, mesh, alignment, opts = {})
```

Internal shape (not exported): per gable — `bandFloor = min ⌊eaveY⌋` over sides; plan window =
footprint bbox on the cross axis (±0.5); per end dir `d` (±ridge.axis):

1. select end-facing triangles (`|n·d| ≥ cos faceAngleDeg`, centroid in window) split at bandFloor
   into band (gable face) and below (wall); wall cluster = triangles within 1.0 voxel of the
   extreme vertex along `d` (quantization unit);
2. `glbFace` / `glbWall` = area-weighted mean coordinate along `d`; `faceRmse` = area-weighted RMSE
   of band-face vertices about `glbFace` (**the recorded fit error**);
3. `glbRoofEnd` = extreme vertex along `d` over roof-band triangles (any orientation) in the window;
4. anchor: `faceCoord = wallSlab.value + round(glbFace − glbWall)`;
   `coord = faceCoord + max(0, round(glbRoofEnd − glbFace))`; `overhang = coord − faceCoord`;
5. geometric sanity (no constants): `wallSlab.value ≤ faceCoord ≤ coord ≤ as-built footprint end`
   (and for −dir, mirrored) — else not fitted, finding `end-fit-insane` with the numbers;
   missing wall slab → `end-unfitted` (anchorless); empty selection → `end-unfitted`;
   `hip.demanded` (unsuppressed) → ends not fitted, finding `end-hip` (a hip end is a slope).

## Module: `src/view/roof-generate.mjs` (modify)

- `roofHeightfield(gables)`: when a gable has `ends`, columns whose ridge-axis coordinate lies
  beyond `ends.{lo,hi}.coord` are **skipped** (not in heights/owner); columns beyond
  `ends.{lo,hi}.faceCoord` get `owner.sheet = true` when that gable wins the column. Winner
  semantics unchanged (per-column max over gables; a solid winner overrides a sheet loser).
- `generateRoof(...)`: fill rule per column — `owner.sheet` ⇒ surface course only (stair on
  whole-step edge / full block at `⌊h⌋`, slab on half above), open underside; else the existing
  solid wedge bandFloor→top. Stair/slab state vocabulary untouched (T-097 path).
- `bandFloor` computation unchanged (min ⌊eaveY⌋ over sides — ends don't move it).

## Module: `src/view/roof-swap.mjs` (modify)

- `judgeVariant`: **carve/census columns = union of the surviving pool's `footprint.cols`** (post
  `gatedGenerate` drops), minus chimney — identical to today's `gen.heights` set for end-less
  gables; strictly larger than the generated set when ends trim (the blob past `coord` is carved,
  measured, and not regenerated). A fit-error-dropped gable's footprint is NOT carved (unchanged).
- `swapRoof`: ladder becomes (dedup by extended key = pitches + hip + per-gable end coords):
  1. `end-fitted`            (args.endFit.gables)
  2. `end-fitted-voxel-pitch` (pitchVariant of 1 — spreads sides only; `ends` ride along)
  3. `end-fitted-gable-ends`  (args.endFit.suppressed — ends fitted AFTER hip suppression)
  4. `end-fitted-voxel-pitch-gable-ends`
  5.–8. the legacy four, verbatim (`as-fitted`, `voxel-pitch`, `as-fitted-gable-ends`,
     `voxel-pitch-gable-ends`) — the honest tail; all rejected ⇒ input stands (Rule 2).
  `args.endFit` optional; absent ⇒ rungs 1–4 dedup away and behavior is byte-identical to today.
- `generated` gains `fittedEnds` (count of trim-applied ends over the surviving pool) and
  `endCoords` (per gable, for the record); attempts[] entries gain `ends` summaries.

## Runner: `benchmarks/sculpture/roof-program.mjs` (modify)

- imports `aabbAlignment` (component-glb-fit), `fitGableEnds` (roof-end-fit), `gableEndsVariant`.
- `runRoof`: after `fit = gablesFromRecord(record)` and mesh load —
  `alignment = aabbAlignment(mesh.bounds, occ.bounds)`;
  `endFit = {...fitGableEnds(fit.gables, record, mesh, alignment),
             suppressed: fitGableEnds(gableEndsVariant(fit.gables), record, mesh, alignment).gables}`;
  pass `endFit` into `swapRoof`. (Deterministic: same committed inputs → same alignment → same fit;
  the double-run byte-identity proof covers it.)
- `assertAcceptance`: budget = `6·gables + 2·fittedEnds` (verge tip course ends expose 4 faces by
  geometry, two per fitted end — same class as ridge ends; formula documented in the comment).
- `EVIDENCE_ANGLES = ["+x+z", "+x-z", "-x-z", "-x+z"]` (45° added — the AC's named view);
  frame copies add `roof-<s>-end45-{before,after}.png` and `roof-<s>-end315-{before,after}.png`.
- record additions (additive to `roof-program/v1`): `params.endFit = END_FIT_DEFAULTS`,
  `fit.gables[].ends` (via `gableRecordView`), `endFit.findings`, `swap.generated.fittedEnds`,
  `swap.generated.endCoords`; `renderMd` prints ends per gable + the budget actually asserted.
- `--offline` / `--repro` logic untouched (additive record fields don't enter their checks).

## Interfaces that must NOT move

- `gablesFromRecord` / `gableSurfaceHeight` / `programFitError` signatures (S-109 builds on them).
- Cage checks (`silhouetteIoUs`, `closureCheck`, `protectViolations`) — reused, never re-implemented.
- `REGULARIZE_DEFAULTS` / `MULTI_ANGLE_GATE` — frozen instrument.
- Kit/family derivation (`roofFamily`) and the stair/slab state vocabulary.
- Record pin semantics (`inputs.shellSha256` ↔ on-disk shell).

## Ordering of changes

1. `roof-end-fit.mjs` + tests (pure, leaf — nothing depends on it yet).
2. `roof-generate.mjs` ends-aware fill + tests (consumes `ends` shape; still unused by swap).
3. `roof-swap.mjs` carve-set + ladder + tests (ties 1+2 into the cage).
4. Runner wiring + live runs (`roof:cottage`, `roof:gatehouse`, `--repro`) + committed evidence.

Each step leaves `npm test` green and the live chain runnable (legacy path intact until step 4
flips the runner).
