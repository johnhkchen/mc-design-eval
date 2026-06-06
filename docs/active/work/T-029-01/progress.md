# T-029-01 — Progress: sculptor consolidation

## Status: implementation complete, all ACs verified, `npm test` 302/302 green.

## Steps (per plan.md)

- [x] **Step 1 — `staged-loop.mjs`.** Created `src/sculptor/staged-loop.mjs`: `stagedSculpt(source, intent)`
  (pure chain + baseline/metrics), `lessFlat(baseline, metrics)` (the verdict), `runStagedLoop(source, opts)`
  (chain → `compileRelief` → `reviewBuildState`, render/diagnose injectable). Imports only the spine + passes
  — no concept-grid module. Smoke-checked: locks `occupied,material,relief` in order; `runStagedLoop` is a fn.
- [x] **Step 2 — barrel export.** Added `stagedSculpt, runStagedLoop, lessFlat` to `index.mjs`. Single import
  site preserved.
- [x] **Step 3 — `staged-loop.test.mjs` (AC #1).** 7 tests: the lock chain + order; the less-flat metric
  (baseline `0/0` → composed `coverage 0.17 / variance 0.16 / range 2`); the AJV gate on the composed
  artifact (valid, 3-block manifest, voxels at z=−1 and z=+1, one placement per occupied cell); the stubbed
  loop recording `flat → relief` and the clean `[]` path; the gridless-source drop-in; and a **GL-gated live
  render** of the composed artifact (ran here — valid PNG, ~1.2s). All 7 pass.
- [x] **Step 4 — `reuse-boundary.test.mjs` (AC #2).** 4 tests: static scan (no concept-grid import in
  material/relief/review/compile/orchestrator/build-state/staged-loop); geometry/spine are color-free and
  material's only `../color/` imports are the portable engine + table; `conceptGridSource` is the sole
  `{grid,n,m}` reader and the downstream stages reference no grid; and a functional gridless `MassingSource`
  runs the whole loop to a valid artifact. Confirmed the denylist regex bites a planted import. All 4 pass.
- [x] **Step 5 — README.** Added the "The full loop (T-029)" bullet + the `MassingSource`-only boundary line.
- [x] **Step 6 — full suite.** `npm test` → **302/302** (was 291 after T-028/T-032; +11 = 7 + 4 new tests).
- [x] **Step 7 — journal (AC #3).** Appended `## E-11 — staged-sculptor consolidation (S-029, T-029-01)` to
  `design-learnings.md` with the captured numbers and the GLB-reuse statement.
- [x] **Step 8 — commit.** (See review.md for the commit hash.)

## Recorded run (the demonstrated loop — `tinyGrid` 4×5, 18 occupied cells)

| signal | massing-only (baseline) | composed (massing→material→relief) |
|--------|-------------------------|------------------------------------|
| relief coverage | 0 | **0.17** |
| relief variance | 0 | **0.16** |
| relief range | 0 | **2** (z=−1 recess .. z=+1 cornice) |
| manifest blocks | 1 (gray) | **3** (stone / stone_bricks / chiseled_stone_bricks hue family) |
| placements | 18 | 18 (one per occupied cell; relief never adds a voxel) |

**Critic diagnosis (recorded):** on the textured + relieved facade, a `flat` defect routes to **`relief`**
(state-driven disambiguation — the field is already textured, so it wants depth, not material). A clean
render yields `[]`. The composed artifact passes the live AJV gate and renders to a valid PNG (GL present).

## Deviations from plan

- **None material.** Added a small `proportionsOf` re-export from `staged-loop.mjs` (single-import-site
  convenience) — additive, no behavior change.
- The journal cites the **`tinyGrid` fixture** numbers (a deterministic, in-suite facade) rather than a
  live concept-image run, because the automated demonstration must stay GL/BAML-free; the live BAML judge
  is wired (`runStagedLoop` defaults to `defaultDiagnose`) but not exercised in `npm test` (per T-026's
  design). Documented as a known limitation in review.md.

## No existing module changed

`build-state`, `orchestrator`, `compile`, `massing`, `material`, `relief`, `review` — public signatures
untouched. Consolidation was pure wiring + two guard tests + docs, exactly as the structure phase predicted.
