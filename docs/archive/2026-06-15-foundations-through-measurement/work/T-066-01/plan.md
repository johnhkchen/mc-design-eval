# T-066-01 — Plan: cleanup-consolidation

Ordered, independently-verifiable steps. Pure logic first (CI-gated), then the live sweep, then docs. Commit
after each step.

## Step 1 — Pure assembler + tests (`src/form/e19-cleanup.mjs`, `…test.mjs`)

Write `e19-cleanup.mjs` per Structure: `E19_CLEANUP_SCHEMA`, `cleanupRow`, `assembleCleanup`,
private `renderCleanupMd`, `classifyAxis`. Then `e19-cleanup.test.mjs` with a synthetic fixture.

- **Verify:** `node --test src/form/e19-cleanup.test.mjs` green; then full `npm test` green.
- **Done when:** assembler tested in isolation (delta math, axis classification, null tolerance, md shape),
  no dependency on GL or any data file.
- **Commit:** `feat(E-19 T-066-01): pure e19-cleanup assembler + tests`.

## Step 2 — Runner (`benchmarks/sculpture/e19-build.mjs`) + `package.json`

Clone `e18-remeasure.mjs`'s impure scaffolding (run/decodeTexture/judgeIoU/readJson/valueDeltaEOf), swap
`voxelizeGlbThin` → `voxelizeRouted(glb,{subject,scale})`, add `rescoreBusy` (via `occupancyFromArtifact`),
`intermediateCell` (read `e18-build/<subj>/summary.json` `e18`), `marginals` assembly, and the frame copy.
Add `--offline`. Wire `e19:build` into `package.json`.

- **Verify (no GL):** `node benchmarks/sculpture/e19-build.mjs --offline` runs without throwing on whatever
  summaries exist (empty/partial OK — emits a report with `—` cells). Lint: `node --check`.
- **Done when:** runner imports resolve, offline path emits `e19-cleanup.{md,json}` without error.
- **Commit:** `feat(E-19 T-066-01): e19-build runner (routed+prune+clean) + e19:build script`.

## Step 3 — Live sweep ×7

`node benchmarks/sculpture/e19-build.mjs 32`. Builds + renders all 7, re-scores busy, assembles the report,
copies frames.

- **Verify:**
  - `e19-build/<7>/{artifact.json,render-3q.png,summary.json}` all present, each render > 0 bytes.
  - `assertPaletteDiscipline` passed for all 7 (runner throws otherwise) → off-palette 0, distinct ≤ cap.
  - Each `summary.json` has `busy`/`intermediate`/`e19` cells.
  - moai: confirm routed-solid component split + post-prune `strayVoxelStats` (record whatever it is; do **not**
    tune `minFraction`).
  - `e19-cleanup.md` table: per-subject busy→intermediate→E19 + per-axis Δ; averages row.
  - `pr/assets/frames/e19-{heart,moai,koi}-{before,after}.png` present.
- **Done when:** all 7 built/rendered, report + frames written, npm test still green (data-only change).
- **Commit:** `feat(E-19 T-066-01): rebuild all 7 (routed+prune+clean) + before/after vs busy E-18` and a
  separate `docs(E-19 T-066-01): e19-cleanup report + before/after frames` if cleaner.

## Step 4 — `design-learnings.md` E-19 section

Append the **Voxel cleanup (E-19)** section using the *measured* numbers from Step 3. Must:
- Mark each backlog item closed with its number: **T-063** (stray pruning — moai duplicate masses gone),
  **T-064** (variance-aware flat palette + gradient banding + minRegion/keepFloor — busy blocks gone, speckle
  down), **T-065** (per-subject thin routing — solids de-thickened, form recovered), each with its marginal Δ.
- Give the busy→E-19 before/after summary table (avg speckle, distinct, off-pal, stray, form IoU, value ΔE).
- **Answer the headline:** *is GLB-voxel colour now as clean as text→JSON?* — yes/qualified, with the speckle +
  off-palette + distinct evidence, and the honest caveat (value ΔE cost; moai's corrupt-GLB form signal).
- Be honest about anything **not** fully closed (value ΔE rise = the design-doc-palette discipline cost, the
  ablation tautology; moai form IoU is invalid vs its own hallucinated GLB → root fix is single-view regen, a
  separate ticket).
- **Verify:** section present after the E-18 block; numbers match `e19-cleanup.json`.
- **Commit:** `docs(E-19 T-066-01): design-learnings voxel-cleanup section — backlog closed`.

## Step 5 — E-12 handoff (`pr/assets/voxel-cleanup.md`)

Narrative handoff referencing the frames + `e19-cleanup.md`. Honest residuals. Update `pr/assets/README.md` if
it indexes sections.

- **Verify:** links resolve (relative paths to frames + benchmark md).
- **Commit:** `docs(E-19 T-066-01): E-12 handoff — voxel-cleanup.md + frames`.

## Step 6 — Final verification + review.md

- `npm test` green (record count).
- Re-read each AC against the produced artifacts; note any gap honestly.
- Write `review.md` (changes, test coverage, open concerns: value ΔE, moai, production-path wiring deferred).

## Testing strategy

- **Unit (CI):** the assembler only — delta math, axis classification, null tolerance, md/json shape. This is
  the sole new logic and the only thing that *can* be pure-tested. Target: keep `npm test` green, +N tests.
- **Integration (not CI, by repo convention):** the ×7 live sweep is the evidence for AC #1/#2/#3; reproducible
  via `npm run e19:build`. `assertPaletteDiscipline` inside the runner is a hard self-check (off-palette → fail
  loud). The `--offline` path re-derives the report from committed summaries for cheap re-verification.
- **No new metric/algorithm** → no new metric tests needed; the four metrics are owned + tested by T-062.

## Risks & mitigations (carried from Design)

- **Sweep fails mid-run:** per-subject try/skip, assembler tolerates null cells. GL proven on a probe.
- **Busy re-score depends on `occupancyFromArtifact`:** imported from `cleanliness-baseline.mjs` (no third copy).
- **moai threshold edge:** measured, reported, not tuned. The honest signal is stray/component, not IoU.
- **Determinism:** assembler is pure; segmentation deterministic; only PNGs are binary (regenerated by sweep).
