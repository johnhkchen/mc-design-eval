# Progress — T-080-01 hollow-the-mass

Tracks execution against `plan.md`. All five steps complete.

## Done

- **Step 1 — export `enclosedMassKeys`.** `function` → `export function` in `surface-coherence.mjs` (the
  single enclosed-mass rule, no third copy). Added a test on a 3×3×3 / 2×2×2 box. Commit
  `feat(E-23 T-080-01): hollow-carve pure core …` (folded with step 2).
- **Step 2 — `hollow-carve.mjs` pure core + tests.** `markHollowable`, `carveArtifact`
  (flatten-by-exclusion), `carveOccupancy`, `cavityReport`, `cornerPostKeys`, `tallColumnKeys`,
  `exteriorSurfaceDigest`, `exteriorHeld`. 17 unit tests; `npm test` 932 green. Committed.
- **Step 3 — runner + script.** `benchmarks/sculpture/hollow-cottage.mjs` + `hollow:cottage` in
  package.json. `npm test` still 932 green (runner excluded from the glob). Committed.
- **Step 4 — live run.** `npm run hollow:cottage` on the **sealed** cottage (T-084 output):
  - Light detector (`claude-haiku-4-5`) returned `hollowable:true`, two regions (y1–15 bulk, y16–22 roof
    deck), `inset:1`, no blockers. Usage ~661 output tokens, ~$0.021.
  - Carve: **1100 enclosed**, **122 protected** as structure (tall columns), **973 removed**. Cavity
    **6438 → 5465 voxels**.
  - **Exterior held: true** — all three before/after PNGs (threeQuarter, front, top) are **byte-identical**;
    the exterior digest is identical (133 355 bytes both sides).
  - Hollow artifact is **AJV-valid** (`scripts/validate-artifact.mjs --expect valid` → VALID).
  - Watertight (skin) recorded honestly: `false` before and after (intended doors/windows — see review).
  - Committed with `hollow-report.json`, `hollow-cottage-artifact.json`, `view-{before,after}-*.png`.
- **Step 5 — this `progress.md` + `review.md`.**

## Deviations from the plan

1. **`cornerPostKeys` returned 0 on the cottage** (not a bug). The cottage's footprint *bbox corners* are
   empty — the plan is non-rectangular, so the extreme (minX,minZ)… columns have no voxels. Structural
   protection therefore came entirely from `tallColumnKeys` (716 column voxels, 122 of them enclosed). Both
   helpers are unit-tested on a rectangular synthetic box where corners *are* occupied; the cottage simply
   exercises the tall-column path. The `keep` union (`cornerPosts ∪ tallColumns`) is exactly why the runner
   composes both — the geometry decides which contributes.
2. **No air-op fallback was needed.** Flatten-by-exclusion produced a valid artifact first try; the
   manifest stayed valid because only existing block ids were copied.

## Nothing left open in scope

All five AC clauses are met (see `review.md`). The watertight=false result is correct and expected (the
cottage has real openings), and is out of this ticket's scope per the seal-before-hollow routing.
