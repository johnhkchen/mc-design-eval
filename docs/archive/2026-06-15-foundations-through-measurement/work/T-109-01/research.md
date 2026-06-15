# T-109-01 ridge-and-silhouette-fit — Research

Phase artifact (RDSPI). Descriptive only — what exists, where, how it connects. No solutions here.

## 1. The ticket's evidence, located

The gatehouse fails 3 of 4 gate views; every major names the top of the build. The cottage passes
with minor `roof ridge` gaps. The committed evidence:

- `benchmarks/sculpture/multi-angle/gatehouse-*.json` — the verdicts (45° `form @ roof — ridge line
  and slopes` + `massing @ upper roof edges and chimney-like protrusions`; 135°, 225° similar).
- `benchmarks/sculpture/roof/gatehouse.json` — roof program **accepted**
  (`mass-0:end-fitted-voxel-pitch-gable-ends`), census 18→2 spikes, IoU held at all 4 azimuths.
- `benchmarks/sculpture/roof/cottage.json` — **accepted** (`mass-0:end-fitted-voxel-pitch`),
  census 16→0, 3 fitted ends.

So the roof *slopes* are already clean; what remains is exactly the ticket's three items: the ridge
itself, the upper-edge terminations of the **unfitted** regions, and protruding residue.

### Where the "chimney-like protrusions" actually live (key finding)

`components/gatehouse.json` records **three protrusion-role masses** — mass-1 (yRange [26,25],
3 plan runs), mass-2 ([27,30], 7 runs), mass-3 ([26,25], 2 runs). The gatehouse concept has no
chimney: these are blob residue that survived regularization (openShell's selective restore keeps
removed components ≥ `minKeep:9` — "a chimney, a spire") and were then *recorded* as protrusions by
the component decomposition. The roof program **protects them byte-identically**:
`chimneyColumns(record, occ)` (roof-swap.mjs:69) unions record protrusion masses with the geometric
`protrudingStackRegion` — gatehouse: 22 protected columns, stackRidgeY 31. The cottage's single
protrusion mass (mass-1, [19,26], 8 columns) is the real chimney, present in the GLB.

So today's protection is *identity-blind*: anything recorded/derived as a stack is sacred. The
ticket's residual pass must ground protection in the GLB ("the cottage chimney stays — it is in the
GLB; the gatehouse lumps go — they are not").

### Where the ragged upper edges live

`gablesFromRecord` left these gatehouse regions to the regularized blob (named findings):
`roof-2` **flat, area 151**, `roof-3/5/7/8` pitched fragments (28/14/9/9), plus the insane
`gable-roof-1-roof-6`. The swap never carves outside the surviving pool's footprints, so these
regions keep sampled-blob tops and edges — the "upper roof edges" majors. Cottage analogues:
`roof-1` flat 101, `roof-5/6/7` fragments.

## 2. The module map (E-27/E-28 roof program)

Three pure cores + one impure runner; T-108/T-110 just extended all of them:

- **`src/form/roof-fit.mjs`** (386 ln) — `gablesFromRecord(record)` pairs pitched planes into
  parametric gables (pitch glb-first under a 15° agreement gate, eave/ridge positions anchored to
  the voxel record). `gableSurfaceHeight(gable,x,z)` is THE single surface definition (generator
  and fit-error measure share it). `pitchVariant`, `gableEndsVariant` feed the swap ladder.
  `programFitError` gates at `programRmseTol:0.75`. The ridge today: `ridge.y` = rounded mean of
  the two planes' recorded `ridge.y` (blob-derived); no GLB ridge fit exists anywhere.
- **`src/form/roof-end-fit.mjs`** (262 ln, T-108) — the *pattern to follow*: positions anchor to
  as-built occupancy, the GLB supplies **differentials within one alignment** (aabb absolute
  offsets unreliable, offsetDelta up to 4.4 cells). `alignedTriangles(mesh, alignment)` transforms
  expanded triangles into voxel space — reusable. Geometric sanity gates, no tuned constants;
  unfittable end = named finding, as-built stays (Rule 2).
- **`src/view/roof-generate.mjs`** (179 ln) — `roofHeightfield` composes per-column max over sane
  gables (honors `g.ends` trim/sheet from T-108); `generateRoof` realizes it: solid wedge from
  bandFloor, stair treads on whole-step edges (facing uphill, `half:bottom`), slabs on half-steps,
  `sheetKeys` for census exclusion. The ridge line is *incidental*: a ridge column is just the
  heightfield top (full block, or slab when `ridge.y` lands on a half) — there is no explicit cap
  construction. `roofFamily(kit, vocab)` derives field/stairs/slab ids; missing shaped block =
  named finding + full-block fallback.
- **`src/view/roof-swap.mjs`** (328 ln) — `swapRoof(occ, args)`: declared attempt ladder
  (end-fitted rungs first, E-27 rungs as tail, duplicate shapes skipped via `pitchKey`), each rung
  judged by `judgeVariant`: carve over UNTRIMMED footprints, compose, chimney re-seat (listed),
  then the cage's three checks — per-azimuth silhouette IoU on a `massView` (generated keys count
  as mass) vs `refSils` within `iouTolerance:0.02` anchored to the input, closure no-regress,
  `protectViolations` = 0. Reject → input unchanged, reasons named. `roofBandCensus` with
  `exclude` (sheet keys counted, not hidden).
- **`benchmarks/sculpture/roof-program.mjs`** (534 ln) — impure runner behind `npm run
  roof:{cottage,gatehouse,church}`. Deterministic core `runRoof` runs twice, byte-compared; pins
  component record `source.sha256` against the on-disk shell; per-component ladder via
  `componentGableGroups` (T-110), occupancy threads through accepted swaps;
  `composeComponentSwaps` aggregates; `assertAcceptance` enforces the declared spike budget
  (6/gable + 2/fitted end); unmapped gate; 4-azimuth before/after renders (45/135/225/315);
  durable record `roof/<subj>.{json,md}` + `roof/<subj>/artifact.json`; `--repro` / `--offline`.

## 3. The cage and silhouette machinery (what the residual pass can stand on)

- **`src/view/shell-regularize.mjs`** — `REGULARIZE_DEFAULTS` (iouTolerance 0.02, grid 128,
  spikeFaces 4, minKeep 9); `protrusionCensus`, `protrudingStackRegion` (plateau-derived stack);
  `exposedFaceMesh(occ)` → tri-soup with float bounds `[min, max+1]`; `voxelSilhouettes(occ,
  azimuths)` → same `rasterizeSilhouette` + `resolveAngle` camera as the GLB side;
  `silhouetteIoUs` normalizes both sides (`normalizeSilhouette` grid 128, fit "aspect") then IoU;
  `protectViolations(before, after, protect)`.
- **`src/form/glb-silhouette.mjs`** — `loadMeshFromGlb`, `rasterizeSilhouette(mesh, {view})`
  (512², framedCamera over the mesh's OWN AABB, winding-agnostic fill, returns
  `{w,h,data,fgCount,bbox}`), `projectPoint(p, cam, w, h)` exported for tests — the projector a
  per-cell membership test would reuse. `cameraForMeshBounds(bounds, view)` adapts continuous
  AABBs.
- **`src/form/form-fidelity.mjs`** — `normalizeSilhouette` = bbox-crop + aspect-fit letterbox into
  G×G via pull-resampling (`resampleInto`, internal — the forward pixel→grid mapping is simple
  arithmetic over the mask's own bbox); `iou`.
- **Coordinate reality**: GLB silhouettes and voxel silhouettes are framed by *different* cameras
  (each side's own AABB); comparability is established only after `normalizeSilhouette`'s
  bbox-crop. Any per-cell "is this mass shown by the GLB" test must cross that normalization
  (project cell → voxel pixel → voxel-bbox-normalized grid → sample the GLB's normalized mask),
  or be phrased as a masked-silhouette comparison in normalized space.
- **`aabbAlignment(meshTris.bounds, occ.bounds)`** (component-glb-fit.mjs) + `parseGlbMesh`
  (glb-mesh.mjs, expanded 9-floats/tri) — the alignment the end-fit uses; `alignedTriangles` puts
  GLB triangles in voxel space directly, an alternative grounding for a ridge fit that avoids
  pixel space entirely.

## 4. Constraints and assumptions

- **Rules in force**: E-27 Rule 1 (honest fallback, fit-or-named), Rule 2 (reuse the cage, never
  re-implement), E-25 Rule 3 (no subject constants — declared shared defaults only), E-28 Rule 2
  (fit, don't invent — fit error recorded), E-24 Rule 2 (double-run byte determinism; no GL/LLM on
  the decision path). Renders are evidence, never decisions.
- **No re-judging**: T-111-01 owns verdicts. This ticket produces before/after renders at the
  named views (gatehouse 45/135/225 — already in `EVIDENCE_ANGLES`; "cottage ridge profile" — a
  ridge-axis-perpendicular view, not currently a named frame) and the fit/removal log.
- **Protect semantics today**: swapRoof byte-protects chimney columns and re-seats stacks onto the
  new surface. A residual pass that removes gatehouse lumps must *not* fight the swap's own
  protection — ordering and protect-set derivation are a design decision.
- **Census budget**: `assertAcceptance`'s spike budget (6/gable + 2/fitted end) is the declared
  target the run already passes; ridge cap courses (slabs/stairs are fixtures, excluded from the
  solid-only census) interact with it only via geometry changes.
- **Heights are halves**: the heightfield quantizes to 0.5; slab half-steps already exist; stair
  states proven through the unmapped gate (T-107 lens fix — stairs render now).
- **Test baseline**: root suite 1389/1389 green (T-110 close); `node --test src/**/*.test.mjs`.
  Sibling check: no T-109-01 work dir existed at session start; T-108-01 and T-110-01 both
  complete and committed (bd256ea, 7331846). Dependency T-108-01 satisfied.
- **Subjects registry**: `SUBJECTS` in durable-skin.mjs (key, glb, kitRecord, regularizedShell
  override). The GLBs are on disk (committed inputs for cottage/gatehouse/church chains).

## 5. Open questions carried to Design

1. Ridge fit grounding: pixel-space (silhouette) vs mesh-space (`alignedTriangles` apex profile,
   the end-fit differential pattern). The end-fit pattern is the local precedent.
2. What is a "cap course" concretely — apex slab course, opposing stair pairs, or both — and how
   it composes with the existing stair/slab emission without forking `generateRoof`'s loop.
3. Candidate set for the residual pass: record protrusion masses ∪ geometric stack ∪ unfitted
   roof-region tops? Connected components of what, above which surface?
4. "Refit-or-removed": what refit means for a lump (snap to fitted planes?) before removal is
   chosen; and how azimuth evidence is recorded per removal.
5. Upper-edge terminations: scope (fitted-gable wall-tops only, or also unfitted flat planes like
   gatehouse roof-2) and which fitted planes "the fitted planes" denotes for a flat region.
