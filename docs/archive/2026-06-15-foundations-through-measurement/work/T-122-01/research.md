# T-122-01 ridge-height-closure — Research

Descriptive map of where the generated ridge height comes from, where it is measured, and where
(empirically, on the committed records) the ~4 blocks are lost. No solution proposed here.

## 1. The chain under question (generated path)

`npm run generated:<subj>` → `benchmarks/sculpture/generated-milestone.mjs`. Stages (tracked in
`track.stage`): evidence → `provision-fit` (`src/form/provision-fit.mjs:fitProvision`) →
`provision-generate` (`src/form/provision-generate.mjs:generateProvision`, pure; double-run
byte-compare at generated-milestone.mjs:160–171) → skin → grammar/settle → frozen kit-aware gate.
The **swap ladder (`src/view/roof-swap.mjs`) is NOT in this path** — it serves the reconstructed
path. Generated gables come straight from the committed fit record.

- Fit record: `benchmarks/sculpture/generated/<subj>/provision-fit.json` (`provision-fit/v1`),
  revived by `reviveProvisionFit` (Sets under `__set__`). Per roof: `gables[]` (the geometry the
  generator consumes) and `ridgeFit[]` (evidence: `recordY`, `intersect` from `ridgeFromPlanes`,
  `apexLine` from `fitRidgeLine`).
- `generateProvision` → `generateRoof(roof.gables, family)` (provision-generate.mjs:117) →
  `roofHeightfield(gables)` (src/view/roof-generate.mjs:141): per footprint column
  `h = roundHalf(gableSurfaceHeight(g, x, z))` (line 160); cells placed `y ∈ [bandFloor,
  Math.floor(h)]`, slab at `Math.floor(h)+1` when `h` has a half (roof-generate.mjs:201–257).

## 2. The single surface definition (where the height is decided)

`gableSurfaceHeight(gable, x, z)` — src/form/roof-fit.mjs:223–229:

```
h = gable.ridge.y
h = min(h, evalSideHeight(side, ridge.y, x, z))   per side   // eaveY + pitch·dist, capped at ridge.y
h = min(h, hipPlaneHeight(p, v))                  per demanded hip end
```

Contract in the docblock (roof-fit.mjs:215–222): this is THE parametric surface — the generator
realizes it AND `programFitError` measures against it; the two must never diverge (the gatehouse
lesson, T-112-01). `hipEndPlanes` (roof-fit.mjs:191–209) is likewise the single hip definition:
anchor at the footprint bbox edge, eave = min side eave, pitch = mean side pitch unless a fitted
per-end pitch rides the gable (`hip.fitted.{lo,hi}.pitch` from roof-hip-fit.mjs).

Key structural fact: **`gable.ridge.y` is only an upper bound.** Nothing makes the surface reach
it. The side planes are fitted independently (eave + pitch from GLB plane fits); if they are
shallow, their intersection sits below `ridge.y` and the built apex lands at the plane
intersection, not the declared ridge. The fitted apex evidence (`apexLine.height`, the value
T-118 made trustworthy) is recorded in `ridgeFit[]` but **never consumed by the generator**.

## 3. Empirical trace on the committed records (the diagnosis groundwork)

Evaluating the pure surface on the committed fits (this session, `gableSurfaceHeight` over each
gable's footprint cols):

| gable | ridge.y (recordY) | plane intersect | apexLine.height | max built surface |
|---|---|---|---|---|
| cottage `gable-roof-0-roof-4` | 24 | 22.54 | 24.333 | **22.268** |
| cottage `gable-roof-2-roof-3` (cross-gable) | 21 | 18.864 | **22.792** | **18.577** |
| barn `gable-roof-1-roof-8` | 19.5 | 19.126 | **20.991** | **19.098** (but see hip ramp) |

Cottage cross-gable sides: eaveY 14.5/pitch 0.453 and eaveY 15/pitch 0.885 — shallow; the planes
meet at 18.864, ~2.1 below ridge.y and ~3.9 below the trusted apex. Built cells: roundHalf(18.577)
= 18.5 → full block at y=18 + slab at 19, matching the roof-diff profile (`build` 18, slab col 19).

Barn adds a second mechanism: `hip = {lo: true, demanded: true, fitted.lo.pitch 0.231}` anchored
at v=−24. The lo hip plane (13.5 + 0.231·(v+24)) ramps the **entire lo half of the ridge**:
surface along the ridge runs 13.5 → 19.0 over v=−24..0, then flat 19.1 (the side-plane
intersection) for v≥1. The GLB ridge sampled by the instrument is **flat at 19.5 across the whole
span** (v=−24..22) — the GLB has no lo hip at the ridge row; the fitted near-flat "hip" plane
(pitch 0.231 vs side mean 0.656) crushes half the roof.

So three named loss mechanisms, all composing inside the `min()`:
- **(a) shallow side planes**: intersection below ridge.y (cottage cross −2.1, cottage main −1.7,
  barn −0.4 on the flat half);
- **(b) misfitted hip end plane** treated as a hard ceiling (barn lo half, up to −6 at the end);
- **(c) ridge.y = recordY (blob median) sits below the trusted fitted apex** (cottage cross
  21 vs 22.792; barn 19.5 vs 20.991) — the apex evidence is never consumed.

Against the ticket's candidate list: "fitted apex not consumed" = (c) confirmed; "eave/pitch
integer quantization" — it is not quantization, it is plane shallowness (a); "a swap-ladder rung
accepting a low candidate" — refuted for this path (no ladder in the generated chain).

## 4. The instrument (how closure will be measured)

`npm run diff:roof [-- --subject <s> --path generated] [--repro]` →
`benchmarks/sculpture/roof-diff.mjs` (judge-free, no GL in the decision; pure core
`src/view/roof-region-diff.mjs` run twice, byte-identical sha256 recorded). Records:
`benchmarks/sculpture/roof-diff/<subj>-generated.{json,md}` + committed contact sheet under
`pr/assets/frames/`. Registry-only: subjects from durable-skin `SUBJECTS`, no subject keys.

`heightProfiles` (roof-region-diff.mjs:314–361): build apex per ridge column (`columnTops`,
slab cells count) vs GLB barycentric sample at column centers. Two deltas: `rawDelta = build+1 −
glb`; the refit-grade `delta` is **eave-relative** — `(build − buildEave) − (glb − glbEave)`,
anchors recorded per profile (buildEave = mean recorded side eaveY; glbEave = median GLB sample
at the eave edge).

Committed numbers this ticket must move (current HEAD):
- `cottage-generated.json`: cross-gable ridge stats mean **−4.324**, rmse 4.332, maxAbs −4.401,
  count 13 (profile: build 18 vs glb 22.445); main gable mean −0.381. Cross-azimuth mismatch
  5922px, roof share 32.9%. Eave anchors ~equal (14.75 build / 14.794 glb) so raw ≈ eave-relative.
- `barn-generated.json`: ridge mean **−4.396**, rmse 4.814, maxAbs −8.8, count 47 (build ramps
  13→19, glb flat 19.5); anchors buildEave 15.75 / glbEave 13.45 (**2.3 offset** — the synthesized
  barn base carries its eave high relative to the GLB, inflating eave-relative ridge deltas; raw
  best-point delta is only ≈ −0.5+). Mismatch 4416px, share 35.1%. Both rakes unfitted.
- Provenance of the ticket's headline "−4.015": it is a **rake `rawDelta` entry** in T-118's
  before record (`docs/active/work/T-118-01/artifacts/before/cottage-generated.json`,
  profiles[1].rakes[1].profile[6]); the committed cross-gable **ridge stats mean is −4.324**
  (identical in T-118 before and current HEAD — "unchanged through T-118" holds). The unit-test
  witness should pin the committed record's values; the −4.015 figure needs this footnote.

## 5. Gate, cage, pins, re-judge, hygiene (acceptance machinery)

- **Gate**: generated-milestone runs the frozen kit-aware multi-angle gate (4 azimuths, one judge
  run per view; malformed-reply bounded re-asks live in `src/form/judge-reply.mjs` — T-114, judge
  seam only). Gate record carries `instrument` receipt (`src/form/gate-instrument.mjs:
  instrumentReceipt`, generated-milestone.mjs:334–337/558–582): `frozen`/`diffs[]` vs the
  committed styled-label gate record (contract fields + judge models) — the same-ruler proof.
  T-121 profiles to move against: cottage generated FAIL 12/2 0/4; barn FAIL 12/2 0/4.
- **Cage**: per-azimuth silhouette IoU vs GLB + closure no-regress (shell-regularize/
  shell-integrity; `cage` field in the milestone record, generated-milestone.mjs:561/577).
- **Pins** (T-119): generated-milestone writes records only via `guardedWriteRecord`
  (`src/form/pin-guard.mjs`; generated-milestone.mjs:95–96). Committed (git-tracked) records
  refuse non-identical writes without `--rotate-pins` (`ROTATE_FLAG`); byte-identical passes;
  `preflightPins` lands before any metered spend. The owned re-judge is `npm run generated:<s>
  -- --rotate-pins` (note `npm run` flag swallowing: args need `--`). roof-diff records are
  likewise tracked → refreshing them after the fix also needs `--rotate-pins` in this owning
  ticket.
- **Repro**: `-- --repro` re-proves the deterministic chain from a fresh process (no GL, no
  judge; sha256 of base/grammar/styled/fit artifacts); `-- --offline` re-asserts committed
  records. Decisions exclude GL bytes (E-24/E-28).
- **Hygiene**: `generalizationGrep()` (generated-milestone.mjs:388–393) greps the runner source
  for subject keys; record field `generalization.clean`. T-121 concern 1: a **comment** naming a
  subject trips it — the barn record currently cannot read `clean: true` until the runner comment
  hygiene is fixed (memory: the self-grep matches comments; a committed verdict is never re-judged
  to fix a cosmetic record field — cleanliness closure must ride an artifact-moving run).

## 6. Tests & constraints

- `npm test` = artifact-schema self-test + `node --test src/**/*.test.mjs` (82 unit test files;
  pure, no GL/judge). Existing roof tests: `src/form/roof-fit.test.mjs`,
  `src/view/roof-generate.test.mjs`, `src/form/roof-ridge-fit.test.mjs`,
  `src/view/roof-swap.test.mjs` — synthetic gable specs already exist as patterns to follow.
- PURE/LIVE split idiom: fix must land in pure cores (roof-fit/roof-generate/provision-fit
  territory); runners stay registry-only (no subject keys/branches/thresholds).
- `gableSurfaceHeight` is shared by the generator AND `programFitError` AND the reconstructed
  path's swap-ladder judge (`gatedGenerate`, roof-swap.mjs:115–134) — any change to the surface
  definition propagates to the swap ladder's fit-error gate and to roof-diff's region partition
  (`roofRegions` builds ridge rows from the same gables). Blast radius must be checked on the
  reconstructed-path records (committed `roof-diff/<s>-reconstructed.json` are byte-pinned).
- Tolerances on record: `programRmseTol` 0.75 cells (roof-fit.mjs:38), regularize `iouTolerance`
  0.01, `RIDGE_FIT_DEFAULTS.apexGap` 1.0. Coordinate conventions: heights in half-block units via
  `roundHalf`; cells integer y; apexLine.height/GLB samples in aligned voxel space (floats);
  diff's `+1` shifts cell index to top face.

## 7. Open questions carried to Design

1. Which value is "the fitted height" the ridge must reach: `apexLine.height` absolute, or
   eave-relative (`buildEave + (apex − glbEave)`)? Barn's 2.3 eave offset makes this material;
   the instrument's accept metric is the eave-relative delta. Memory warns GLB absolutes are
   unreliable under aabb-affine ("cage-arbitrated attempt ladder").
2. How to make the surface reach the ridge: re-derive side pitch from (ridge − eave)/run, vs
   exempting ridge columns, vs anchoring planes at the ridge — and what that does to slope/eave
   region deltas (acceptance: no other region worsens).
3. What to do with barn's misfitted lo hip (reject by pitch sanity vs anchor hip planes at the
   ridge end) — `hip.ridgeLo/ridgeHi` semantics in roof-hip-fit.mjs need reading.
4. Whether `ridge.y` should be rewritten at fit time (provision-fit, changes the committed fit
   record → pin rotation) or consumed at generate time.
