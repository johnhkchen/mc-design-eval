# T-057-01 Plan — ordered, verifiable steps

Five steps, each committable and independently verified. Pure cores first (testable without GL or
files), then the runner that emits the tracked outputs, then the docs.

## Step 1 — `montageRow` pure compositor + tests

- Create `src/form/montage.mjs` with `montageRow(images, {gap=0, bg=[255,255,255,255]})`.
  - Validate: non-empty array; each element has `width,height` and `data.length === 4*w*h`.
  - Output width = Σ widths + gap·(n−1); height = max height. Fill the whole canvas with `bg`, then
    blit each panel at its x-offset, top-aligned (row 0).
- Create `src/form/montage.test.mjs` (4 tests from Structure §montage.test).
- **Verify:** `node --test src/form/montage.test.mjs` green.
- **Commit:** `feat(E-17 T-057-01): montageRow pure RGBA row compositor`.

## Step 2 — `assembleScorecard` + `attributeTechniques` + tests

- Create `src/form/scorecard.mjs`: `TECHNIQUES`, `meanPresent`, `attributeTechniques`,
  `assembleScorecard`, threshold consts. Import `RUNGS`/`VERDICT_GLOSS` from `ablation.mjs`.
  - `assembleScorecard` md = Levels table + Marginal Δ table (both passthrough from spine) + the
    **AVG / Δ technique-attribution** table + per-technique verdict line + honesty notes block.
  - `json` = `scorecard/v1` with `subjects` (passthrough) + `techniques` (attributeTechniques) + note.
- Create `src/form/scorecard.test.mjs` (6 tests from Structure §scorecard.test). Test 5 asserts the
  averaged numbers against the real 7-subject marginals **inlined in the test** (no file read), so the
  test is self-contained and pins the headline numbers.
- **Verify:** `node --test src/form/scorecard.test.mjs` green; eyeball the asserted means
  (voxel +0.238 / mclean +0.000 / surgical −0.001 form; voxel −7.16 / mclean −4.53 / surgical 0 ΔE).
- **Commit:** `feat(E-17 T-057-01): scorecard assembler — per-technique attribution + AVG row`.

## Step 3 — `sweep-scorecard.mjs` runner → `pr/assets/sweep.md` + 7 march PNGs

- Create `benchmarks/sculpture/sweep-scorecard.mjs`:
  - read `sweep-ablation.json` → `assembleScorecard` → write `pr/assets/sweep.md` (scorecard +
    runner-appended E-12 handoff section referencing `frames/march-*.png`).
  - `RUNG_RENDERS` path map (R0 sweep-ablation, R1 glb-voxel, R2 glb-voxel-clean, R3 surgical-sweep
    after.png); per subject decode 4 PNGs via `PNG.sync.read`, `montageRow({gap:6})`, write
    `pr/assets/frames/march-<subj>.png` via `PNG.sync.write`. Missing render → warn + skip subject's
    frame (scorecard still written).
  - `--no-frames` flag skips the PNG stitch (md-only, for CI/doc-only refresh).
- **Verify:** run live; confirm `pr/assets/sweep.md` exists with the AVG row and 7
  `pr/assets/frames/march-*.png` written; open one composite to confirm 4 panels left→right
  (expected width ≈ 4·512 + 3·6 = 2066 px, height 512). Confirm `git status` shows the 7 PNGs as
  tracked additions under `pr/assets/` (not gitignored).
- **Commit:** `feat(E-17 T-057-01): sweep scorecard + per-subject march-of-progress frames`.

## Step 4 — journal + frames README

- Append the **Consolidation sweep (E-17)** section to `docs/knowledge/design-learnings.md`
  (attribution table with the averaged numbers, "where it didn't help", one-sentence residual; reuse
  the E-16 IoU bands).
- Add the `march-<subject>.png` provenance block + regen note to `pr/assets/frames/README.md`.
- **Verify:** read back both edits; numbers match `sweep-ablation.json` / the scorecard exactly.
- **Commit:** `docs(E-17 T-057-01): design-learnings E-17 sweep section + march frame provenance`.

## Step 5 — full gate + progress/review

- `npm test` (artifact self-test + `src/**/*.test.mjs`) green — confirms the two new test files pass
  and nothing regressed (expected total 530 + new tests).
- Write `progress.md` (AC evidence table + verification log), then `review.md`.
- **Commit:** rolled into Step 4 or a final `docs` commit if separate.

## Testing strategy

- **Unit (in `npm test`):** `montage.test.mjs` (pixel paste math), `scorecard.test.mjs` (averaging,
  thresholds, tallies, the pinned headline numbers, null-tolerance). All pure — no GL, no files.
- **Integration (manual, metered/GL-adjacent only via PNG I/O):** the runner — verified by inspecting
  the emitted `sweep.md` and one `march-*.png`. Not in `npm test` (it reads gitignored renders).
- **Honesty checks (manual):** confirm the AVG row shows material-clean form +0.000, surgical −0.001
  with bow-and-arrow −0.004 / 0 improved, and the R2/R3 valueΔE=0 tautology note — per AC #5.

## Risks & mitigations

- **Source renders absent on a clean checkout** → runner skips that frame with a warning, scorecard
  still emits; the 7 composites are *committed* so consumers never need the gitignored renders. (Risk
  is only for re-running the stitch, which needs a local build first — documented in the README.)
- **Scorecard drifts from the spine** → scorecard consumes the spine JSON verbatim (no re-derivation);
  test 5 pins the averaged numbers so a future spine change that breaks the headline fails the test.
- **march PNG accidentally gitignored** → they live under `pr/assets/` (tracked); Step 3 verify
  includes a `git status` check that they appear as additions.
- **`pngjs` import cost in the runner** → lazy/`PNG.sync` only in the runner, never in the pure cores,
  so the test glob stays GL-/lib-light.
