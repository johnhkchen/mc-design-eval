# T-054-01 — review: glb-voxel-breadth (E-17 rung R1)

Handoff. What changed, what's covered, what a reviewer should know — without reading every diff.

## What this delivered
E-16's GLB-voxel build (the decisive *form* win, proven on koi + heart) generalized to **all 7 E-13
subjects with GLBs**, producing the **R1 ablation table** — the first rung of the E-17 consolidation
sweep. Pure orchestration over the proven E-16 core: **no `src/` change, no schema change, no test
regression.**

## Files changed
**Created**
- `benchmarks/sculpture/glb-voxel-breadth.mjs` — the 7-subject R1 sweep runner. Reuses the pure
  `glbVoxelBuild` core unchanged; carries thin, harness-local impure glue (`dwebp` WebP decode + the
  silhouette-IoU judge), the established "each harness owns its render/host glue" split. `--offline`
  (rebuild table from summaries) and `--regen-missing` (AC#3 TRELLIS regen) modes. Side-effect-free import;
  exports `SUBJECTS`, `buildR1`, `runBreadth`.
- `benchmarks/sculpture/glb-voxel/r1.{md,json}` — the AC deliverable (7-row table).
- `benchmarks/sculpture/glb-voxel/{dancing-man,moai,pineapple,bow-and-arrow,mushroom}/{artifact.json,
  summary.json}` — the 5 new subjects' durable records (+ gitignored `render-3q.png`).
- `docs/active/work/T-054-01/{research,design,structure,plan,progress,review}.md`.

**Modified**
- `benchmarks/sculpture/glb-voxel/{koi,heart}/summary.json` — **additive only**: a new `occupancy` field;
  `silhouetteIoU` preserved (see Coupling below). koi/heart artifacts and IoU numbers unchanged.

**Untouched (deliberately):** all of `src/**`, the schema, and the E-16 runner
`glb-voxel-run.mjs`/`summary.md` (E-16's 2-subject record stays intact; R1 is its own artifact).

## Results (R1, scale 32)
| subject | occupancy | form IoU vs GLB |
|---|---|---|
| dancing-man | 973 | 0.914 |
| moai | 4215 | 0.565 |
| pineapple | 3397 | 0.907 |
| bow-and-arrow | 513 | **0.473** |
| heart | 5840 | 0.877 |
| mushroom | 9505 | **0.980** |
| koi | 2164 | 0.622 |

**Faithfulness:** koi (0.622) and heart (0.877) reproduce the committed E-16 numbers **exactly** — the
strongest evidence the breadth path is the same build, not a re-derivation. The 2 known subjects calibrate
the 5 new ones.

**A legible ablation signal (the point of the rung):** form IoU tracks form *class*. The blobby/voluminous
subjects score high (mushroom 0.980, dancing-man 0.914, pineapple 0.907 — a single closed mass the
silhouette captures well). The **thin-member** subject scores lowest (bow-and-arrow 0.473 — the bow limbs
and arrow are exactly the thin geometry that both TRELLIS *and* the single-view silhouette struggle with,
the same form class that 500'd sword). moai (0.565) sits mid — its value is fine-relief facial detail the
3/4 silhouette can't reward. This is the expected, honest spread: voxelization preserves *mass* form, not
thin-member or fine-relief form.

## Test coverage
- `npm test` **514/514 green** (validate-artifact self-test + `node --test "src/**/*.test.mjs"`),
  unchanged before and after — this ticket adds nothing under `src/**`.
- The pure voxel/color core is covered by the **existing** `src/form/glb-voxel-build.test.mjs` (synthetic
  occupancy + colors → AJV round-trip) and `glb-voxelize.test.mjs`. AC#4 ("pure logic stays unit-tested,
  no new GL in the suite") is satisfied by *preserving* that boundary: the new runner is GL/host and stays
  out of CI by construction.
- **Verification beyond the suite** (the GL/host path the suite can't reach):
  - every artifact passes the AJV gate in-runner (`assertArtifact`); moai spot-validated via the CLI.
  - **determinism:** `--offline` rebuilds `r1.{md,json}` from committed summaries with **zero git diff**.
  - **faithfulness:** koi/heart reproduce E-16 numbers exactly.
  - **secret hygiene:** the harness never logs `MODAL_ENDPOINT_URL` (grep-confirmed); the child
    `trellis-glb.mjs` owns the `.env` read.

## Open concerns / limitations
1. **Metric is a single-view silhouette IoU.** `silhouette ≠ volume`; normalization removes translation +
   uniform scale but **not rotation/axis**. Mitigated by the build being voxelized *from* the same GLB it's
   scored against (alignment is as good as it gets), but a low score (bow-and-arrow) reflects both genuine
   thin-member loss *and* the metric's bluntness — don't over-read absolute values; the rung is for
   *relative* technique attribution.
2. **Cross-harness coupling (resolved, worth flagging).** `glb-voxel/<subj>/summary.json` is read by **two**
   harnesses now: this one and `glb-voxel-surgical.mjs` (`buildBaselineIoU` → `.silhouetteIoU`). The field
   name `silhouetteIoU` is load-bearing for that reader — kept intentionally. A future schema for these
   summaries should treat `silhouetteIoU` as the stable contract key. (This caught a near-miss: an early
   `formIoU` rename would have silently broken the surgical baseline.)
3. **~25 lines of impure glue duplicated** with `glb-voxel-run.mjs` (`decodeTexture`/`run`/`judgeIoU`).
   Accepted per design.md (Option B rejected): de-duplicating would mean editing GL-untested committed E-16
   code. If a *third* consumer appears, extract a shared `glb-render-util.mjs` under its **own** ticket
   (the `parallel-roots-duplicate-shared-deps` lesson).
4. **GLBs are gitignored** (~5 MB each); the durable record is `glb/README.md` + the per-subject
   `summary.json` + `r1.{md,json}`. A fresh clone must regenerate GLBs (`--regen-missing`, needs `.env`)
   before re-running the live sweep. None needed regen here (all 7 present).
5. **`durationSec` is embedded in `r1.json.subjects`** (it's the full summary object). It's read from the
   committed summaries, so `--offline` is still byte-stable — but it carries timing jitter (e.g. koi
   12.6↔12.5s across runs). Not a metric; ignore for comparison. The r1 *table* columns (occupancy,
   IoU, scale, blocks, manifest) are all deterministic.

## Nothing needs human escalation
No critical issues. The rung is faithful (E-16 numbers exact), deterministic, AJV-valid, and CI-green.
**Next in the E-17 sweep:** T-055-01 (R2 material-clean via CIE-Lab palette from the GLB surface texture),
then the S-056 ablation sweep and S-057 scorecard.

## Commits
- `4c912bf` — runner + RDSPI artifacts (no live GL).
- `d9c0d69` — R1 builds + form-IoU table across 7 subjects.
- (this) — progress.md + review.md.
