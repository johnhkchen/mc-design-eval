# T-086-01 — value-true-block-selection — Progress

All plan steps complete. One small deviation, documented below.

## Step log

- **Step 1 — image-grid cellMeans opt** ✅ — `gridFromPixels` gained opt-in per-cell foreground
  means (`cellMeans: true`); default result shape provably unchanged (test asserts the key is
  absent). 2 new tests; image-grid suite 16/16.
  Commit `feat(E-24 T-086-01): image-grid opt-in per-cell foreground means (cellMeans)` —
  also carried the research/design/structure/plan artifacts.
- **Step 2 — pure core** ✅ — `src/color/value-select.mjs`: constants (CHROMA_WEIGHT=2,
  SWITCH_MARGIN=0.15, MIN_CELLS=24, SAMPLE_GRID_N=96), `familyOf`, `isExcludedCandidate`,
  `familyCandidates` (memoized committed-table pools), `weightedDeltaE`, `estimateBorderColor`,
  `sampleRoleSwatches`, `selectValueTrueBlock`, `selectValueTrueMap`. Selection runs through the
  engine's `nearestFlat` with the weighted metric (no new engine math); reported ΔE is true
  unweighted ΔE76 + {dL,da,db}. 14 new tests (families/precedence, exclusions, metric, border
  estimate, sampler, decision matrix incl. floor/margin/not-in-table/no-family, and the cottage
  shape against the committed table). Unit suite 1005/1005.
  Fix along the way: a doc comment containing the literal `a*/b*` terminated the JSDoc block
  (`*/`) — reworded.
- **Step 3 — runner + script + gitignore** ✅ — `benchmarks/sculpture/value-select.mjs`
  (sample → select → substitute → render → record; `--offline` assert), `value:select` npm
  script, `.gitignore` block for `value-select/**/*.png`. `npm test` green before commit.
- **Step 4 — live cottage run** ✅ — `npm run value:select`:
  - 7/7 roles sampled (concept 1408×768 → 96×52 grid; border bg rgb(254,254,254) dropped;
    1990 filled cells).
  - **white_terracotta → sandstone [switched]**: a* drift **7.76 → −3.85** (the pink axis),
    true ΔE 13.59 → 14.02 (honestly ~tied — the win is hue, exactly the judge's `palette@upper`
    complaint), score 25.2 → 19.67 (22% margin).
  - **stone_bricks → tuff [switched]**: true ΔE 11.6 → 6.06 (genuinely closer even unweighted),
    score 16.57 → 11.04 (33% margin).
  - Kept: spruce_planks (ΔE 1.62), dark_oak_planks (ΔE 0.23), dark_oak_log (prior-is-best);
    cobblestone (6 cells) + bricks (17 cells) on thin-sample.
  - Substitution applied to the spray-paint build: 4683 placements recolored, AJV-valid; plaster
    count preserved (459 → 459, now sandstone). GL renders SUCCEEDED — front before/after PNGs
    show the pink→cream flip clearly (visually confirmed).
  - `value:select -- --offline` exits 0 (CONFIRMED line); full `npm test` 1005/1005.
  - Committed record: `value-select/cottage.{json,md}` + `cottage/artifact.json`.

## Deviations from plan

- The live numbers matched the design predictions exactly (sandstone, tuff, keeps) — no
  contingency needed.
- Plan said renders might fail without GL; they succeeded, so the "render gap" contingency was
  not exercised.
- No other deviations: spray-paint.mjs untouched (T-085 boundary held), material-map records
  untouched (the E-21 prior stays immutable).

## Remaining

- review.md (next phase artifact). Ticket frontmatter untouched per Lisa's protocol.
