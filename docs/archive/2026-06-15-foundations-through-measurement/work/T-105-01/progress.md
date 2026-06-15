# T-105-01 shaped-vocabulary — Progress

All five plan steps executed in order; no plan deviations except those noted. `npm test`:
**1335 pass, 0 fail** (includes 28 new tests and the sibling T-104 thread's suites).

## Step 1 — generators ✅ (commit `0cd915f`)

`src/form/shaped-vocab.mjs` + tests (10). `stairRun` (4 ascents × 2 windings, hand-written
expected states), `slabStep` (axes × kinds), `archRing`/`flatHead` (hand-enumerated r=2.5 disc:
aperture/ring/head/jamb cells), `SHAPED_DEFAULTS` frozen and declared.

## Step 2 — fits ✅ (commit `c4b87d9`)

`src/form/shaped-fit.mjs` + tests (11). **Plan deviation (recorded):** the arch gate was
strengthened beyond the design — Kåsa's *radial* RMSE alone is gameable (a zigzag head profile
rings the fitted center within tolerance: radial 0.668 on alternating 10/15s). The gate is now
(a) every profile column covered by the disc (`arch-profile-uncovered`), (b) **vertical** RMSE
vs the upper arc ≤ rmseTol. Pinned in tests. The design's named risk resolved: the real
gatehouse candidates fit at vertical rmse **0.439** (gate 0.8); church/cottage dispatch
flat/miss, never arch. Plane fits prefer glbFit gated by `glbRmseTol` (the witnessed gatehouse
glbFit rmse 5.6 falls back to voxelFit *with a named finding*).

## Step 3 — application ✅ (commit `c0efbd6`)

`src/view/opening-reconstruct.mjs` + tests (7). **Fix found by prototyping:** the record's
`jambs[].at` are the aperture's own edge columns (air) — wall depth is measured at the
*flanking* columns instead. Carve only full cubes (dressing preserved), ring fills need
≥ minRingSupport solid neighbors (no lips into open air), fill blocks by neighbor majority.
Caged integration case green: dressed aperture under the full T-102 cage — accepted, closure
no-regress, trapdoors byte-identical through `rebuildArtifact`; zero-tolerance rollback pinned.

## Step 4 — runner ✅ (commit `a008ec9`)

`benchmarks/sculpture/shaped-vocabulary.mjs`, `shaped:{cottage,gatehouse,church}` scripts,
gitignore stanza. All three subjects run live + `--offline` re-asserted:

| subject | heads | edits | cage | plane fits (stair/slab-legal) |
|---|---|---|---|---|
| gatehouse | **2 arch** (rmse 0.439), 4 noop | carved 723, filled 118 | accepted, IoU unchanged | 3/9, 0/9 |
| church | 6 flat squared, 26 noop | carved 2, filled 39 (594 `ring-unsupported` named) | accepted, IoU unchanged | 3/17, 2/17 |
| cottage | 6 noop, 2 named-miss (`flat-out-of-tolerance` 0.707>0.6) | **zero** | accepted (no-op) | 4/8, 1/8 |

Gatehouse witness (numeric): both gate mouths went from ragged `12 14 15 … 11 10 ▮ 14 12` to the
symmetric arc `12 13 14 15 … 15 15 13 12`; render `unmapped` = 0 on every after-render
(enforced, runner throws otherwise). Renders + committed frames `pr/assets/frames/shaped-*`.

**Runner fix:** `renderArtifact` returns `unmapped` as a list in this path — normalized to a
count before the Rule 3 gate (first gatehouse run failed loudly on `[]≠0`, correctly-shaped gate
now).

## Step 5 — docs ✅ (this commit)

## Concurrency log

T-104-01 (roof-as-program) ran in a sibling thread the whole session (commits `77ee1f5`,
`09faaf0`, `667faac` interleaved with mine). Zero shared source files; the one shared file is
`package.json`, where the sibling's `roof:*` script lines appeared in my working tree — carried
verbatim in my Step 4 commit (noted in its message) rather than reverted.
