# T-086-01 — value-true-block-selection — Structure

File-level blueprint. Shapes and boundaries, not code.

## Files

### Modified: `src/color/image-grid.mjs`

One back-compatible extension to `gridFromPixels(img, opts)`:
- New opt `cellMeans` (boolean, default false). When true, the returned GridResult gains
  `cellMeans`: an `m×n` array-of-rows; each entry is the cell's foreground mean `[r,g,b]`
  (floats, unrounded) for FILLED cells, `null` for air cells. Computed from the existing
  `aggregateCells` buckets — no second pass, no behavior change when the opt is absent.
- `gridFromImage` forwards opts unchanged (no edit needed beyond the core).
- Module-header note: one sentence documenting the opt and its consumer (S-086 role sampling).

### Created: `src/color/value-select.mjs` (the pure core)

PURE, GL-free, network-free — runs under the `src/**/*.test.mjs` glob with nothing mocked.
Imports only sibling color modules (`cielab.mjs`, `block-table.mjs`) — keeps `cielab.mjs`'s
reuse boundary untouched (it is imported, never imports back).

Constants (exported, single-sourced):
- `VALUE_SELECT_SCHEMA = "value-select/v1"` — record version tag.
- `CHROMA_WEIGHT = 2` — a*/b* weight in the selection metric.
- `SWITCH_MARGIN = 0.15` — relative score improvement required to dethrone the prior.
- `MIN_CELLS = 24` — sample floor below which the prior is kept (`thin-sample`).
- `SAMPLE_GRID_N = 96` — default concept quantize width for role sampling.

Exports (each pure, JSDoc'd in repo style):
- `familyOf(blockId) → "log"|"planks"|"stone"|"brick"|"smooth"|null` — ordered token rules
  (precedence: log → planks → stone → brick → smooth), accepts namespaced or bare ids.
- `isExcludedCandidate(bareId) → boolean` — `_ore$`, `concrete_powder$`, gravity set
  {sand, red_sand, gravel, suspicious_sand, suspicious_gravel}.
- `familyCandidates(family, table?) → [{key, lab, var}]` — table ∩ family − exclusions; throws
  on unknown family; `table` defaults to `loadBlockTable()` (lazy, memoized once, mirroring
  value-palette.mjs's `candidatesOnce` pattern).
- `weightedDeltaE(a, b, w?) → number` — √(ΔL² + (w·Δa)² + (w·Δb)²); the metric passed to
  selection; default `w = CHROMA_WEIGHT`.
- `estimateBorderColor(img) → [r,g,b]` — mean of the 1-px border of a decoded RGBA image
  (`{width,height,data}`); the background estimate for `dropColor`.
- `sampleRoleSwatches(gridResult, namedBlocks) → Map<bare, {lab, cells}>` — from a GridResult
  carrying `cellMeans`: for each named (bare) block, mean Lab of the cells assigned to it.
  Throws if `gridResult.cellMeans` is absent (actionable: "pass cellMeans:true").
- `selectValueTrueBlock({ named, sampleLab, sampleCells }, opts?) → row` — the decision core.
  Computes the prior's score and the family winner's score (winner search = argmin of
  `weightedDeltaE + 0.1·√var` over `familyCandidates(familyOf(named))`, i.e. `nearestFlat`
  with the weighted metric); applies floor and margin. Returns
  `{ named, chosen, switched, reason, family, sampleLab, sampleCells,
     namedScore, chosenScore, namedDeltaE, chosenDeltaE, namedComponents, chosenComponents }`
  where components = `{dL, da, db}` (true, unweighted) and deltaE = true ΔE76.
  `reason ∈ {"switched", "prior-is-best", "below-margin", "thin-sample", "no-family",
  "not-in-table"}` — the last two keep the prior and are recorded, never thrown.
- `selectValueTrueMap(map, swatches, opts?) → rows[]` — maps E-21 material-map rows
  (`{role, block, …}`) through the sampler output + decision core; rows keep `role` and
  `placementRule` so the output is a drop-in value-true role map.

Selection reuses `nearestFlat` (cielab.mjs) via its pluggable `metric` — no new engine math;
the flat penalty keeps T-064's λ = 0.1 and the honest-ΔE convention (selection biased, reported
ΔE true).

### Created: `src/color/value-select.test.mjs`

Pure unit tests (node:test, repo idiom — synthetic data, no fixtures):
1. `familyOf`: the 7 cottage blocks classify as expected; precedence cases (`stone_bricks` →
   stone, `quartz_bricks` → brick, `stripped_birch_wood` → log); unknown → null.
2. `isExcludedCandidate`: sand/gravel/ores/concrete_powder excluded; sandstone/tuff kept.
3. `familyCandidates`: contains expected members, excludes ores/gravity, throws on bad family.
4. `weightedDeltaE`: w=1 equals deltaE76; w=2 doubles a*/b* contribution (hand-computed case).
5. `estimateBorderColor`: synthetic 4×4 RGBA with known border vs center → border mean.
6. `sampleRoleSwatches`: synthetic GridResult (grid + cellMeans) → per-block mean Lab; missing
   cellMeans throws.
7. `selectValueTrueBlock`: (a) hue-drifted prior with a clear family winner → switched; (b)
   prior nearest → prior-is-best; (c) winner under margin → below-margin keeps prior; (d)
   `sampleCells < MIN_CELLS` → thin-sample keeps prior; (e) not-in-table prior keeps.
8. `gridFromPixels` cellMeans opt (added to `image-grid.test.mjs`, NOT here): default result has
   no `cellMeans`; with the opt, filled cell carries its foreground mean, air cell is null.

### Created: `benchmarks/sculpture/value-select.mjs` (the impure runner)

Mirrors `spray-paint.mjs`'s shape (header comment: IMPURE RUNNER, seam invariant, run modes):
- Inputs (hard paths, cottage subject): `material-map/cottage.json`,
  `runs/014-vConcept-a-cottage/concept.png`, `spray-paint/cottage/artifact.json`, block table.
- §1 sample: decode concept → `estimateBorderColor` → `gridFromImage(…, { whitelist: bare
  manifest, n: SAMPLE_GRID_N, dropColor: border, cellMeans: true })` → `sampleRoleSwatches`.
- §2 select: `selectValueTrueMap` over the map rows → per-role rows; console table of
  named→chosen with scores/ΔE.
- §3 cottage proof: substitution = the `switched` rows (bare named → bare chosen); apply to the
  spray-paint artifact's placements + `palette.manifest`; `assertArtifact`; best-effort GL
  render front before/after (local `tryRenderFace` clone of spray-paint's — render failure
  degrades to a recorded gap); write `value-select/cottage/artifact.json` + PNGs.
- §4 record: `value-select/cottage.json` — `{ schema, subject, inputs, sample: {gridN,
  borderColor, dropTolerance}, rows, map (value-true role map: role/block/placementRule with
  chosen blocks), substitution, plaster: {named, chosen, before/after deltaE + components},
  renders, note }` + `cottage.md` human summary.
- `--offline`: read the committed record; assert plaster row exists, `switched === true`, chosen
  block ≠ white_terracotta, and chosen a*-error < named a*-error; exit 1 otherwise. No GL, no
  decode.

### Modified: `package.json`

`"value:select": "node benchmarks/sculpture/value-select.mjs"` (alongside the `material:*` family).

### Modified: `.gitignore`

```
# Value-true selection renders (T-086-01) — derived, image-heavy; the durable record is
# value-select/cottage.{json,md} + value-select/cottage/artifact.json (the recolored build).
benchmarks/sculpture/value-select/**/*.png
```

## Boundaries

- **Not touched:** `benchmarks/sculpture/spray-paint.mjs` (T-085-01 owns it), `cielab.mjs`,
  `value-palette.mjs`, `block-table.mjs`, the material-map records (the E-21 prior stays
  immutable; the value-true map is a NEW artifact under `value-select/`).
- Dependency direction: value-select.mjs → {cielab, block-table}; runner → {value-select,
  image-grid, palette-extract, occupancy/multi-angle (render only), artifact.mjs}. Nothing
  imports value-select yet — S-089 consumes its RECORD as data.

## Ordering

1. `image-grid.mjs` cellMeans opt + its test (the sampler's prerequisite).
2. `value-select.mjs` pure core + tests (families → metric → sampler → decision).
3. Runner + npm script + .gitignore.
4. Live run on the cottage; commit record + artifact; verify `--offline`; full `npm test`.

Each step is independently committable and `npm test`-green.
