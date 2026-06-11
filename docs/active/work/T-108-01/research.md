# T-108-01 gable-and-verge-fit — Research

Descriptive map of what exists. No solutions proposed here.

## The ticket in one line

The E-27 roof program generates fitted **slopes**; the cottage's two failing views (45°, 315°) name
what it does not generate — **gable-end triangles, verge/rake lines, eave terminations** — which today
are "whatever the blob left there" (or worse: solid wedge mass the generator itself over-extends).

## The chain this ticket lives in

```
regularize:<s>  → regularize/<s>/artifact.json          (T-102 cage; the canonical shell)
components:<s>  → components/<s>.json                   (T-103 component-record/v1, pinned to shell sha)
shaped:<s>      → shaped vocabulary record
roof:<s>        → roof/<s>.json + roof/<s>/artifact.json (T-104 roof program — THIS TICKET EXTENDS IT)
reskin:<s>      → component-fed skin
reconstructed:<s> → reconstructed/<s>.json              (T-107 terminal milestone; owns judge verdicts)
```

Pinning: `roof/<s>.json` carries `inputs.shellSha256` hard-pinned against the on-disk regularized
shell (`roof-program.mjs:112-116` fails loudly on drift). Downstream (`component-skin.mjs:58-84`,
`reconstructed-milestone.mjs:240`) verifies pins and re-runs the chain in-process; changing roof
output is absorbed by re-running the chain (T-111's job — **this ticket must not re-judge**).

## The modules (all pure except the runner)

- **`src/form/roof-fit.mjs` (387 ln)** — `gablesFromRecord(record)` extracts parametric gables from
  the component record: per side `{planeId, eaveDir, pitch, pitchSource (glb|voxel), eaveY, eaveEdge,
  overhang, extentCells, run}`; gable `{ridge:{axis,y}, sides, footprint:{cols,bbox,area}, hip, sane,
  reasons}`. `gableSurfaceHeight(gable,x,z)` is THE single surface definition shared by generator and
  fit-error measure. `programFitError(gable, heights)` → per-side/total RMSE, gated at
  `programRmseTol 0.75`. Ladder variants: `pitchVariant(gables,"voxel")`, `gableEndsVariant(gables)`
  (hip suppression, `hip.suppressed` recorded). `ROOF_FIT_DEFAULTS = {pitchAgreeDeg:15,
  programRmseTol:0.75, minRun:2, maxPitch:4}`.
- **`src/view/roof-generate.mjs` (158 ln)** — `roofFamily(kitRows, vocab)` → `{field, stairs, slab}`
  (cottage: spruce_planks/spruce_stairs/spruce_slab; gatehouse: deepslate_brick family).
  `roofHeightfield(gables)` → per-column max-over-gables height + owner/downhill + `bandFloor`
  (min ⌊eaveY⌋ over all sides). `generateRoof(gables, family)` → **solid wedge: every footprint
  column filled from bandFloor to surface top**; stair tread on whole-step edges (facing uphill,
  half=bottom, shape=straight), slab on half-steps. No notion of wall envelope, end faces, verge,
  or eave underside — the wedge just stops at the footprint boundary as a full-height cliff.
- **`src/view/roof-swap.mjs` (273 ln)** — `swapRoof(occ, {gables, family, refSils, regions, protect,
  chimney, opts})`: attempt ladder (as-fitted → voxel-pitch → ±gable-ends variants, dedup by shape
  key, first accepted wins), each rung judged by `judgeVariant`: carve footprint cols ≥ bandFloor
  (chimney cols pass through), compose generated cells, re-seat chimney (additions listed), then the
  T-102 cage checks — (a) per-azimuth silhouette IoU vs GLB refSils on a **massView** (form marks
  cleared for generated keys only) within `iouTolerance 0.02` of the input baseline, (b) closure
  no-regress (`closureCheck`), (c) `protectViolations` = 0. Any failure → input returned unchanged,
  reasons named. `roofBandCensus` = solid cells ≥4/6 faces exposed within footprint cols ≥ bandFloor
  (chimney excluded); `assertAcceptance` budget = 6 per gable (ridge/eave line ends).
- **`benchmarks/sculpture/roof-program.mjs` (376 ln)** — IMPURE runner: loads shell + component
  record (sha-pin check), kit → `roofFamily`, `gablesFromRecord`, chimney protect set
  (`chimneyColumns` ∪ `protrudingStackRegion`), GLB → `loadMeshFromGlb` → `rasterizeSilhouette` at
  the 4 gate azimuths (`MULTI_ANGLE_GATE.azimuths`), `swapRoof`, rebuild artifact. Determinism:
  core runs twice, byte-equal or no record. Unmapped gate: every stair/slab state through the live
  `blockStateId` path, any unmapped throws. `--offline` re-asserts record; `--repro` fresh-process
  sha compare. **`EVIDENCE_ANGLES = [135°, 225°, 315°]` — 45° (a failing view for this ticket) is
  not currently rendered.** Writes `roof/<s>.{json,md}` + artifact + PNGs + pr/assets frames.
- **Fitting machinery available**: `component-glb-fit.mjs` — `aabbAlignment(meshBounds, occBounds)`
  → `{mode:"aabb-affine", scales, toVoxel(p)}`; the decomposition runner reconstructs it as
  `aabbAlignment(mesh.bounds, occ.bounds)` (component-decomposition.mjs:274-276) since `toVoxel` is
  not serializable (record stores mode+scales only). `glbFitForPlane` is the precedent for
  triangle-selection fitting (centroid-in-extent + normal-gated, area-weighted). `glb-silhouette.mjs`
  — `loadMeshFromGlb` → `{positions, triangleCount, bounds}`; `rasterizeSilhouette(mesh, {view})`
  with `resolveAngle` named views incl. ortho `front/back/left/right` (0/180/270/90°, elev 0).

## The committed evidence (verified by direct record inspection)

**Cottage** (`roof/cottage.json`, status accepted, attempt `voxel-pitch`):
- `gable-roof-0-roof-4`: ridge axis **z**, y 24, footprint x −8..4, **z −16..15**; sides: roof-0
  +x pitch 0.773 glb (eaveY 15, edge 4, overhang 1), roof-4 −x pitch 1.884 voxel (eaveY 18.5, edge
  −8, overhang **−3**). Wall slabs: +z **12**, −z **−12** — the footprint (from blob extent +
  fillBetween) overruns the gable walls by **3 cells (+z) / 4 cells (−z)**, and the solid wedge
  fills those columns from bandFloor 14 to surface (up to y 24): full-height solid mass past the
  wall plane at both gable ends.
- `gable-roof-2-roof-3` (cross gable): ridge axis x, y 21, footprint x −1..12, z −9..5; overhangs
  −3/−7 (eave edges pulled inside the wall planes).
- Unfitted (regularized blob stays): roof-1 flat (area 101), roof-5 (52), roof-6 (31), roof-7 (13)
  — the west wing x −13..−7. bandFloor 14, carve 2967, census 16 → 0 spikes, IoU final
  .9317/.8927/.9324/.9345.
- **Verdicts** (`reconstructed/cottage.json`): 45° drifted — major `form @ roof across the whole
  top` + major `massing @ upper storey gable ends`; 315° drifted — major `form @ roof`, minor
  `building edges/eaves`. 135°/225° same-object (minor-only). Both failing views see the **+z**
  gable end; both passing views see −z. Gap budget 2, current 10.

**Gatehouse** (`roof/gatehouse.json`, accepted, attempt **`voxel-pitch-gable-ends`** — hip demand
suppressed, i.e. its record DOES name gable ends in the sense the ticket means): `gable-roof-0-roof-4`
ridge axis x y 28, footprint x −12..13, z 1..13, hips suppressed at both ends; wall slabs +x 11,
−x −13 → +x end overruns the wall by 2. Second gable insane (roof-6 pitch null). Census 18 → 2.

## What "gable end" is in the data — and what is missing

The component record (`component-record/v1`) has **no end-face entity** (grep: zero "gable"
mentions). Ends are derivable: a gable's end faces are the footprint boundary along the ridge axis
(`footprint.bbox` min/max on `ridge.axis`), the wall plane is `wallSlabs[dir=±axis].value`, and the
end triangle profile is `gableSurfaceHeight` evaluated at the end column. Nothing measures where the
GLB says the roof ends along the ridge axis, or what the GLB end region looks like (thin verge sheet
overhanging a recessed wall vs solid mass). The generator cannot express "roof sheet only" — it
always fills bandFloor→top, so any column past the wall plane becomes upper-storey-looking mass.

## Constraints and assumptions surfaced

1. **Frozen instrument** (E-28 Rule 1): gate thresholds/azimuths/judge untouched. This ticket is
   geometry-side only; cage tolerances are reused as-is.
2. **Fit, don't invent** (Rule 2): every new construct fitted with error recorded; out-of-tolerance
   → current geometry stays, failure named.
3. **aabb-affine caution** (roof-fit header + committed records): GLB absolute offsets are unreliable
   (offsetDelta up to 4.4 cells); positions anchor to voxel reality, GLB supplies *differential*
   shape. Established answer: declared hypothesis rungs arbitrated by the cage (the T-104 ladder).
4. **Determinism**: pure cores, no Date/random/IO; runner double-runs, byte-identity required;
   `--repro`/`--offline` conventions must keep working.
5. **No subject constants** — everything from records/geometry; budgets are formulas.
6. **Stairs render now** (T-107 lens fix): verge/rake stair courses will be visible in evidence
   renders; the unmapped gate live-proves states.
7. **Tests**: colocated `*.test.mjs` under `node --test src/**`; roof-fit.test.mjs builds synthetic
   records via `rectRuns`/`fitOf`/`gableRecord(mut)` — the pattern for new synthetic gable specs.
   `npm test` = schema self-test + unit suite (1364/0 green at E-27 close); GL never in npm test.
8. **Sibling concurrency**: checked — no work dir, no recent T-108 commits; ticket frontmatter flip
   to `research` is Lisa's.
9. The reconstructed records' verdicts are testaments from T-107; re-running `reconstructed:*` here
   would re-judge — out of scope (T-111 owns it). Evidence here = geometry metrics + renders only.

## Open questions carried to Design

- How to measure the GLB end-of-roof: mesh triangles in voxel space (via reconstructed
  `aabbAlignment`) vs side-view silhouette columns; what the fitted parameters are (end coordinate,
  rake plane, wall recess) and what error is recorded.
- Where the wall envelope for "solid below, sheet beyond" comes from (wallSlabs exist per mass and
  the cottage's main-gable overhangs are negative on one side — the envelope must handle eave sides
  AND end faces).
- Whether end construction is new ladder rungs, a generator mode, or both; how it composes with the
  existing rung set without breaking gatehouse's accepted `voxel-pitch-gable-ends` outcome.
