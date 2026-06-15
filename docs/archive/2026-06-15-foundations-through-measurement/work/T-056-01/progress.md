# T-056-01 — Progress (ablation-sweep)

Status: **implementation complete**, all 4 ACs met, `npm test` green (530). Live R3 sweep + R0–R3
collection run on all 7 subjects.

## Commits

1. `feat(E-17 T-056-01): ablation pure core — autoRegions + rungVerdict + assembleAblation` — `src/form/
   ablation.mjs` + 8 unit tests.
2. `feat(E-17 T-056-01): R3 surgical sweep across 7 subjects + r3 roll-up` — `glb-voxel-surgical-sweep.mjs`
   + `glb-voxel-surgical-sweep/{r3.md,r3.json,<subj>/summary.json,<subj>/artifact.json}` + `.gitignore`.
3. `feat(E-17 T-056-01): sweep-ablation collector + R0–R3 data spine` — `sweep-ablation.mjs` +
   `sweep-ablation.{md,json}` + `sweep-ablation/<subj>/ablation.json` + `.gitignore`.

## AC evidence

### AC #1 — R3 run for all 7 subjects; P14 holds
`node benchmarks/sculpture/glb-voxel-surgical-sweep.mjs` → 7/7 subjects. Each: `reviseLoop` on the R2
cleaned build with `score = liveFormScore({ formTarget: glbFormTarget({ glbPath, buildBounds }) })`,
generic `autoRegions` slabs, default model-free procedural diagnose (no `claude -p`). Per-subject render
(`before.png`/`after.png`, gitignored) + per-region tweak trace in `glb-voxel-surgical-sweep/<subj>/
summary.json`. **P14 holds for all 7** (`p14.ok: true`, zero violations) — non-improving tweaks rolled
back. Result: 6/7 `held` (cage held the already-close builds); bow-and-arrow `regressed` — one region's
tweak cleared the per-region accept-gate (GLB IoU 0.289→0.292) but lowered whole-object IoU
(0.473→0.469): the genuine per-region-vs-whole-object divergence (`[[per-region-vs-whole-object-iou-
diverge]]`), recorded not hidden.

### AC #2 — one structured record with marginal Δ
`benchmarks/sculpture/sweep-ablation.{md,json}`: `subject × rung → { formIoU, valueDeltaE, verdict }` for
R0–R3, plus `dFormIoU`/`dValueDeltaE` (the marginal Δ each rung added). formIoU is READ from each rung's
committed summary (R1 `silhouetteIoU`, R2 `formIoUAfter`, R3 `wholeObjectIoUAfter`) so the table cannot
drift from the rung records; R0 is the one render (no GLB-IoU on disk). The data:

| | R0→R1 ΔformIoU | R1→R2 ΔvalueΔE |
| --- | --- | --- |
| dancing-man | +0.308 | −2.10 |
| moai | +0.286 | −1.22 |
| pineapple | +0.124 | −4.38 |
| bow-and-arrow | +0.174 | −3.80 |
| heart | +0.421 | −5.91 |
| mushroom | +0.204 | −6.44 |
| koi | +0.150 | −7.87 |

The headline: **R1 (glb-voxel) is the decisive form win on every subject** (+0.12…+0.42 IoU); **R2
(material-clean) buys the palette cleanliness** (ΔE descends R0→R1→R2 for all 7); **R3 (surgical) holds**
(≈0 form Δ — the cage on already-close builds).

### AC #3 — all 7 present; zero/negative Δ recorded honestly
All 7 subjects × 4 rungs are in both records — none dropped. R3's six `held` rungs (zero Δ) and
bow-and-arrow's `regressed` (negative Δ) are recorded as such. R2/R3 `valueDeltaE = 0.00` is reported
plainly (it is correct-by-construction: R2 draws from the GLB canonical palette, so its distance to that
palette is zero — the documented tautology, surfaced in review.md, not papered over).

### AC #4 — pure logic unit-tested; live is GL/metered; npm test green
`src/form/ablation.mjs` (`autoRegions`, `rungVerdict`, `assembleAblation`) is pure and covered by 8 tests
in `src/form/ablation.test.mjs` (under the `src/**/*.test.mjs` glob). `npm test` → **530 pass / 0 fail**
(was 522 + 8). The two runners are GL/host-metered (render + `dwebp`) and are NOT in the test glob — same
split as every prior rung. Both ship `--offline`: R3 r3.* rebuild is byte-identical except `durationSec`;
the ablation record rebuild is byte-identical.

## Deviations from plan

- **`perRegionTrace` representative-entry fix (R3 runner):** the first cut picked the first *scored*
  attempt as a region's outcome, which mislabeled a region whose *later* attempt was the one accepted
  (kept read 0 while the loop had locked it). Fixed to prefer the accepted attempt. This is what surfaced
  bow-and-arrow's real `kept 1/3 regressed` (vs a misleading `kept 0/3`).
- **`changed` short-circuit (R3 runner):** when no region is accepted, `reviseLoop` returns the same
  artifact reference, so the build is unchanged and `afterWhole = beforeWhole` is reported without a second
  render — avoiding a false `regressed` from GL rasterization jitter between two renders of the same build.

## Secret hygiene
Neither new runner shells to `trellis-glb.mjs` or touches `MODAL_ENDPOINT_URL`; no endpoint/URL or GLB
bytes are logged. PNGs are gitignored; verified nothing image-heavy is staged.
