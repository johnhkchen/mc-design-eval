# T-054-01 — plan: glb-voxel-breadth

Ordered, independently verifiable steps. Each is a clean commit. Testing strategy is woven in per step.

## Testing strategy (overall)
- **No new suite tests.** The test glob is `src/**` only and the pure voxel/color core is already covered
  (`src/form/glb-voxel-build.test.mjs`, `glb-voxelize.test.mjs`). AC #4 = *preserve* that: add nothing to
  `src/**`, keep `npm test` green. The runner is GL/host and stays out of CI by construction.
- **Verification is the live run + reproducibility:** (a) `npm test` green (nothing regressed); (b) the
  7-subject live sweep produces 7 AJV-valid artifacts + renders + the r1 table; (c) koi/heart reproduce
  E-16's ~0.622/~0.877 (faithfulness check); (d) `--offline` rebuilds byte-identical `r1.{md,json}`
  (determinism check).

## Step 1 — Write the breadth runner (no live GL yet)
Create `benchmarks/sculpture/glb-voxel-breadth.mjs` per structure.md: header, `SUBJECTS` (7 rows),
`decodeTexture`/`run`/`judgeIoU` (local glue), `regenMissingGlb`, pure `buildR1`, `runBreadth`, `emit`,
`regenerateOffline`, `main`, main-guard, exports.

**Verify (no GL, no network):**
- `node --check benchmarks/sculpture/glb-voxel-breadth.mjs` — parses.
- `node -e "import('./benchmarks/sculpture/glb-voxel-breadth.mjs').then(m=>console.log(Object.keys(m), m.SUBJECTS.length))"`
  — import is **side-effect-free** (no sweep runs) and exports `SUBJECTS` (length 7), `buildR1`,
  `runBreadth`.
- Unit-check `buildR1` on a synthetic 2-row fixture via `node -e` — asserts the md has the AC header
  columns and the json has `subjects.length === 2` (pure, offline; proves the formatter without GL).
- `npm test` — green (no `src/**` change).

**Commit:** `feat(E-17 T-054-01): glb-voxel-breadth runner (7-subject R1 sweep, no live GL yet)`.

## Step 2 — Live 7-subject sweep
Run `node benchmarks/sculpture/glb-voxel-breadth.mjs`. Expect: 7 subjects each →
`glb-voxel/<subject>/{artifact.json,render-3q.png,summary.json}` + `glb-voxel/r1.{md,json}`.

**Verify:**
- 7 `summary.json` exist; each has `unmapped:0` and `occupancy === artifact.placements.length`.
- Every `artifact.json` passes the gate — already asserted in-runner (`assertArtifact`); double-check by
  piping one through `node scripts/validate-artifact.mjs --expect valid`.
- `r1.md` has a 7-row table with `subject | occupancy | form IoU vs GLB | …`; `r1.json` has
  `subjects.length === 7`, none `skipped`.
- **Faithfulness:** koi `formIoU ≈ 0.622`, heart `formIoU ≈ 0.877` (±0.003 GL rounding). If they drift
  materially, stop and diagnose before committing (a drift means the breadth path diverged from E-16).
- Eyeball 1–2 new renders (e.g. moai, pineapple) to confirm the build is recognizable (renders are
  gitignored but worth a look — memory: inspect renders, not just block counts).

**Commit:** `feat(E-17 T-054-01): R1 GLB-voxel builds + form-IoU table across 7 subjects`
(commits the 5 new subjects' `artifact.json`/`summary.json`, re-emitted koi/heart, and `r1.{md,json}`).
Renders stay gitignored.

## Step 3 — Determinism / offline reproducibility check
Run `node benchmarks/sculpture/glb-voxel-breadth.mjs --offline`; confirm `git status` shows **no change**
to `r1.{md,json}` (the offline path rebuilds them identically from the committed summaries). This proves
the durable record is reproducible without GL — the closest this GL/host harness gets to a regression
guard.

**Verify:** `git diff --stat benchmarks/sculpture/glb-voxel/r1.*` is empty after `--offline`.
**Commit:** none if clean (no-op confirms determinism). If the offline emit differs, fix `buildR1`/
`regenerateOffline` parity and fold into Step 2's commit.

## Step 4 — AC #3 regen branch sanity (no network)
All 7 GLBs are present, so `--regen-missing` must be a no-op that changes nothing. Verify the branch is
wired without invoking TRELLIS:
- temporarily reason through (or dry-run with a non-existent fake subject in a scratch `node -e`) that an
  absent GLB routes to `regenMissingGlb` and, without `--regen-missing`, is recorded `skipped` and the
  sweep continues (skip-not-error).
- Confirm `MODAL_ENDPOINT_URL` is never logged (grep the runner for any `console.*` touching the env —
  there should be none; the child `trellis-glb.mjs` owns the read).

No commit (covered by Step 1's runner). Documented in progress.md + review.md as "regen branch present,
not exercised — all GLBs on disk."

## Step 5 — Finalize progress + housekeeping
- Update `progress.md`: steps done, deviations (if any), the measured 7-row IoU numbers.
- Confirm `.gitignore` already covers the new renders (no edit expected); confirm no GLB binary or
  `render-3q.png` got staged.
- Final `npm test` green.

## Rollback / risk
- If GL rendering fails on a subject mid-sweep: the subject errors loudly (renderArtifact throws). Treat
  as a real failure — do not silently skip a *present* GLB (skip is only for *absent* assets). Diagnose
  (likely a degenerate mesh) before committing partial results.
- If koi/heart drift from E-16 numbers: investigate the silhouette/normalize path before trusting the 5
  new numbers — the 2 known subjects are the calibration.
- Lowest-risk by construction: no `src/` change, so the proven core and all 39 test files are untouched.

## Definition of done (maps to AC)
- [x AC1] 7 subjects → glb-voxel `DesignArtifact` (AJV-valid) + `render-3q.png` @ `SCULPTURE_VIEW_3Q` +
  form IoU vs GLB, under `glb-voxel/<subject>/`.
- [x AC2] `glb-voxel/r1.{md,json}` — 7-row table: subject, occupancy count, form IoU vs GLB.
- [x AC3] missing-GLB → `--regen-missing` shells `trellis-glb.mjs` (needs `.env`, never printed); note any
  subject that needed it (none did; branch present).
- [x AC4] pure voxel/color logic stays unit-tested (existing tests), no new GL in the suite, `npm test`
  green.
