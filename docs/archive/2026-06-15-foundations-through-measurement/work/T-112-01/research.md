# T-112-01 hip-pyramid-cap — Research

Descriptive map of everything the ticket touches. No solutions here.

## 1. The named gap, precisely

`benchmarks/sculpture/roof/church.json` (status `accepted`, sha-pinned, committed at T-111-01):

- **mass-1 (the bell tower, role `attached`)** owns four roof planes: `roof-12` (flat, 125),
  `roof-13` (flat, 53), `roof-14` (pitched, area 21, eave `+z`), `roof-15` (pitched, area 8,
  eave `-z`). Only 14/15 pair reciprocally; the cap's ±x faces were never segmented as pitched
  planes on this mass.
- `gable-roof-14-roof-15` is **insane**: `no sane pitch (voxel 19, glb 189.361); run 1.444 <
  minRun 2 (roof-15)`. Ridge `axis x, y 32`; roof-14 eaveY 28 pitch 1.355 (voxel), roof-15
  unparameterizable (pitch 19 ≈ vertical — a pyramid face read as half a ridge pair).
- mass-1's swap: `accepted: false`, attempt `end-fitted`, reason *"nothing generated (no sane
  in-tolerance gable or no kit family)"* — the T-110 named fallback this ticket converts.
- Today the tower cap region falls through to the **termination pass** (roof-12/13/14/15 are
  clamped to their fitted planes; 12 accepted / 3 rolled back overall) — a plane clamp, not a
  constructed cap.

Judge evidence (multi-angle/church-challenge.json): the azimuths that named the tower cap are
**+x+z (45°): "tower roof/cap" (minor)** and **+x-z (135°): "tower upper section" / "tower
walls"**; -x+z (315°) names "nave and tower roofs" jointly. All four are already
`EVIDENCE_ANGLES` in the roof runner.

Tower geometry (components/church.json): mass-1 plan bbox x −24..−7, z −19..−8, yRange 0..32;
mass-3 (protrusion, y 31–32) rides the tower (junction `base` at y 30) and is chimney-protected;
the cap band per roof-14 is eaveY 28 → apex 32. The cap footprint is the occupancy cross-section
at the band, not the whole-mass plan (the plan unions all storeys).

## 2. The construction chain (what exists, where)

Pure cores (all `src/**`, no I/O/GL/Date/random, tested under the test glob):

- **`src/form/roof-fit.mjs`** — `gablesFromRecord(record, opts)`: pairs reciprocal pitched
  planes into gables; per-side pitch source-selected (glb under a 15° agreement gate, voxel
  fallback NAMED); positions anchor to voxel reality. Sanity: `minRun 2`, `maxPitch 4`, ridge
  above eaves. **`gableSurfaceHeight(gable,x,z)`** is THE single surface definition: min over
  `evalSideHeight` of each entry in `gable.sides`, the ridge cap, and — when `hip.demanded` —
  two end planes using the **mean of side pitches** anchored at the footprint bbox edges. Hip
  demand is a heuristic (recorded ridge span vs footprint span) and is never GLB-fitted; the
  gatehouse proved it can be invented by a fragmented ridge (`gableEndsVariant` suppresses it).
  `programFitError(gable, heights)`: RMSE of generated heights vs the parametric surface over
  each side's **recorded extent cells**; gate at `programRmseTol 0.75`. `pitchVariant` swaps
  pitch sources. Note: `gableSurfaceHeight`/`gableDownhillAt` already iterate `gable.sides`
  generically — nothing in them hard-codes two sides.
- **`src/form/roof-end-fit.mjs`** — the differential-anchoring precedent: as-built wall anchor
  `V_w` (median outermost wall column) + GLB differentials measured within one alignment
  (`face = V_w + round(G_f − G_w)`), because absolute aabb-affine offsets are unreliable
  (offsetDelta to 4.4 cells). Machinery here: `alignedTriangles(mesh, alignment)` (voxel-space
  tris with normals/areas), `clustersAlong` (1-voxel gap split), area-weighted `clusterRmse`,
  selection windows bounded by as-built geometry ("sanity bounds as the selection window" —
  the GLB end-fit anchor-window learning). Hip-demanded ends are NOT fitted (`end-hip`:
  "a hip end is a slope, not a face").
- **`src/form/roof-ridge-fit.mjs`** — `ridgeFromPlanes(gable)` intersects the two side lines
  (assumes exactly `[a, b] = gable.sides`); `ridgeVariant(gables)` rewrites ridge heights for the
  ladder's ridge-fit flavors; `fitRidgeLine` measures the GLB apex line as **evidence only**.
- **`src/form/component-roof.mjs`** — `componentGableGroups({record, gables})`: groups fitted
  gables by their planes' massId (primary first, then ascending); masses with pitched planes but
  no gable get a NAMED `component-roof-unfitted` finding. Insane gables stay IN their group.
- **`src/view/roof-generate.mjs`** — `roofFamily(kitRows, vocab)`: kit roof-field cube row →
  `{field, stairs, slab}` by name morphology, vocabulary-verified (church: spruce_planks /
  spruce_stairs / spruce_slab). `roofHeightfield(gables)`: per-column max over per-gable
  min-surfaces; owner tracks `{gableId, downhill, sheet, cap}`. `generateRoof`: solid wedge from
  band floor; **stair treads only ever `shape: "straight"`** (facing = uphill via
  `STAIR_FACING[FLIP[downhill]]`, emitted when the downhill neighbor drops ≥1 and the uphill
  neighbor rises ≥1); slab on half-steps; sheet columns surface-course-only; cap keys marked.
  No corner-shape stair state exists anywhere in the repo (grep: zero `inner_left|outer_*`).
- **`src/view/roof-swap.mjs`** — `swapRoof(occ, args)`: the declared attempt ladder. Rungs:
  end-fitted ×(plain|voxel-pitch) ×(as-detected|hip-suppressed), then the four E-27 rungs;
  each doubled with a leading `-ridge-fit` flavor when the intersection moves a ridge. Dedup
  by `pitchKey` (hip.demanded, ridge.y, per-side pitch/source, ends). **Returns on the first
  accepted rung.** Each rung = `judgeVariant`: gated generate (fit-error drop + recompose),
  carve over untrimmed footprints, chimney pass-through + reseat, then the cage: per-azimuth
  silhouette IoU vs GLB on a mass view (tolerance 0.02), 6-dir closure no-regress, protect
  byte-identical. Any failure → input returned, reasons named. `roofBandCensus` counts ≥4/6
  exposed solid cells (sheet keys excluded-and-counted).

Impure runner — **`benchmarks/sculpture/roof-program.mjs`** (`npm run roof:{cottage,gatehouse,
church}`, flags `--repro` / `--offline`): pins record.source.sha256 against the on-disk shell;
deterministic core **runs twice, byte-compared**; per-component loop threads `occCur` through
accepted swaps (T-110); after swaps: ridge-fit evidence, **termination pass over planes not
consumed by accepted gables** (`consumedPlaneIds` from accepted gables' `sides[].planeId`,
`excludeCols` from their footprints), then the silhouette-residual pass. The unmapped gate
live-builds the artifact and **throws on any unmapped state**. `assertAcceptance` enforces the
spike budget `6·gables + 2·fittedEnds` (a geometric formula, per accepted component… summed via
`composeComponentSwaps`). Renders at 45/135/225/315 + frame pairs.

## 3. Current outcomes the ticket must not disturb

- **cottage**: accepted, mass-0 at rung `end-fitted-voxel-pitch-ridge-fit` (3rd attempted rung);
  artifact sha `477399990e7c…`. Both gables sane, no hips.
- **gatehouse**: accepted, mass-0 at rung `end-fitted-voxel-pitch-gable-ends` (4th rung);
  sha `6ed2580cff4c…`. One sane gable (hip-demanded, suppressed on the accepted rung), one
  insane gable in the same group.
- `--repro` recomputes and compares status+sha against the committed record; **MATCH is the
  ticket's no-collateral proof**. Both subjects accept mid-ladder, so any rung appended after
  the existing tail is unreachable for them; any change to rung ORDER before their accepted
  rung, to `pitchKey`, to `gableSurfaceHeight` outputs for 2-side gables, or to generator
  emissions for existing owners would break the byte match.
- The cottage has real multi-gable **valleys** (main + cross gable): corner-shaped stairs, if
  emitted generally wherever two slopes meet, would change cottage cells → repro FAIL.

## 4. The proven fixture path (corner states)

`src/form/fixture-card.mjs` `CARD_ROWS` is the closed, single-source state vocabulary; the
regression runner verifies every row end-to-end (AJV → world build with empty `unmapped` →
state-id read-back → render). Stairs rows today: 4 facings straight + one `half: top`. Stair
`shape` enum in minecraft-data includes `inner_left/inner_right/outer_left/outer_right` —
unproven rows until added to the card. T-107 fixed the stairs-invisible lens (substring
air-check); stair renders are real now; re-verify before any viewer bump.

## 5. Constraints and doctrine in force

- **E-28 Rule 2**: fit, never invent — out-of-tolerance → named fallback, fit error recorded.
- **E-25 Rule 3**: declared parameters shared across subjects; no subject constants, no tuning.
- **T-104 mechanism**: hypotheses are ladder rungs; the CAGE arbitrates, not tuned thresholds.
- **GLB absolutes unreliable** under aabb-affine: anchor positions to as-built occupancy, use
  GLB differentials/slopes only (roof-end-fit, ridge-fit lessons).
- Pure cores under `src/**/*.test.mjs`; determinism via double-run; unmapped gate is a throw.
- The church chain's settle failure (13 frames / 168 foreign fills) is S-113's scope, NOT this
  ticket's; `roof:church` itself runs end-to-end and is the seam we extend.

## 6. Assumptions to validate in Design

- A pyramidal cap is expressible as a 4-sided "gable" (apex = degenerate ridge) through the
  existing `gableSurfaceHeight` min-of-planes — the surface/generator/fit-error sharing then
  comes for free; what does NOT come for free: `ridgeFromPlanes` (2-side assumption),
  `fitGableEnds` (face fit), `pitchKey`, per-side `extentCells` for synthetic ±x faces (no
  recorded plane → no extent → fit error needs another evidence base).
- The cap footprint must come from the as-built occupancy at the cap band floor (square-ish
  check there), not mass-1's whole-storey plan union (18×12).
- A hip END fit (slope plane replacing a gable triangle) can reuse roof-end-fit's window
  machinery with a slope-facing triangle cone instead of a face cone.
- If a pyramid swap accepts on mass-1, the termination pass must see roof-14/15 (and any cap
  planes) as consumed and exclude the cap footprint columns — today both sets are derived from
  accepted gables' `sides[].planeId` / `footprint.cols`, which a pyramid gable must populate.
