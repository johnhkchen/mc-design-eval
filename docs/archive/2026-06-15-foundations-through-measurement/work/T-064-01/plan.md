# T-064-01 — Plan: clean-color-materials

Ordered, atomically-committable steps. Steps 1–2 are prerequisites (data + primitive); 3–5 are the
three ACs and are independent of each other; 6 is the live ×7 sweep (AC#5). `npm test` must be green at
every commit boundary.

## Step 1 — Texture variance in the block table (data + builder)
**Files:** `src/color/block-table.mjs`, `src/color/block-lab-table.json`, `src/color/block-table.test.mjs`
1. Add `varianceOpaque(png, alphaThreshold)` (summed per-channel variance, same opaque/first-frame
   selection as `meanOpaqueRgb`; `0` if <2 opaque pixels).
2. `buildBlockTable` records `var` per block.
3. Regenerate `block-lab-table.json`:
   `node -e "import('./src/color/block-table.mjs').then(async m=>{const t=await m.buildBlockTable();
   const fs=await import('node:fs'); fs.writeFileSync('src/color/block-lab-table.json',
   JSON.stringify(t,null,2)+'\n')})"`.
4. **Verify lab/rgb byte-stability:** diff the new table against `git show HEAD:...json` projecting only
   `block/rgb/lab` — must be identical. Record the variance distribution (min/median/p90/max, and the
   `var` of `dead_brain_coral_block`, `nether_quartz_ore`, `mycelium`, `white_concrete`, `terracotta`)
   to calibrate `varCeiling` in Step 4.
5. Tests: `varianceOpaque` uniform→0, checkerboard→known value, transparent ignored, first-frame only.
**Verify:** `npm test` green; table diff shows only added `var` lines.
**Commit:** `feat(E-19 T-064-01): per-block texture variance in the block-Lab table`

## Step 2 — `nearestFlat` variance-penalized selection (primitive)
**Files:** `src/color/cielab.mjs`, `src/color/cielab.test.mjs`
1. Add `FLAT_LAMBDA = 0.10` + `nearestFlat(targetLab, palette, {lambda, metric})` — argmin of
   `ΔE + lambda·sqrt(var||0)`, returns `{key, deltaE(true), lab}`.
2. Tests: equal-ΔE busy-vs-flat → flat wins; no `var` ⇒ == `nearestLab`; bounded penalty (small ΔE
   advantage loses, large wins); returned `deltaE` is true ΔE.
**Verify:** `npm test` green.
**Commit:** `feat(E-19 T-064-01): nearestFlat — variance-penalized block selection`

## Step 3 — Wire flat-preference into the snaps (AC#1)
**Files:** `src/form/glb-voxel-build.mjs`, `src/form/material-segment.mjs`,
`src/form/material-clean.mjs` (if `extractTexturePalette` should carry `var`), tests as needed.
1. `paletteFromManifest`/`blockPaletteFromTable` carry `var` on entries.
2. `material-segment` imports `nearestFlat`; `fillRegion` flat-pick + `bandRegion` steps-derivation use
   `nearestFlat`.
3. (Optional) `extractTexturePalette` carries `blockColor.var` for the fallback-extracted palette.
**Verify:** `npm test` green; existing segment tests unaffected (palettes without `var` in tests still
behave as `nearestLab`).
**Commit:** `feat(E-19 T-064-01): design-doc snap prefers flat blocks (nearestFlat)`

## Step 4 — Gated secondary: flat-aware + variance ceiling (AC#1)
**Files:** `src/form/palette-augment.mjs`, `src/form/palette-augment.test.mjs`
1. `tablePalette` carries `var`; build a `key→var` map from `tbl`.
2. `AUGMENT_DEFAULTS += {lambda: FLAT_LAMBDA, varCeiling}` (ceiling from Step 1 distribution).
3. `best = nearestFlat(c.lab, tbl, {lambda})`; add `varOf(best.key) <= varCeiling` to `qualifies`.
4. `meanSnapBefore/After` keep `nearestLab` (honest drift).
5. Tests: busy block above ceiling rejected at great fit; flat preferred over comparable busy; a normal
   flat secondary still admitted when warranted; coral/ore/mycelium specifically excluded.
**Verify:** `npm test` green.
**Commit:** `feat(E-19 T-064-01): gated secondary excludes busy blocks (varCeiling + nearestFlat)`

## Step 5 — Diagonal gradient direction + minRegion noise-vs-intent (AC#2, AC#3)
**Files:** `src/form/material-segment.mjs`, `src/form/material-segment.test.mjs`
1. `gradientDirection(region, cellCoords, labs)` (least-squares L*-gradient; null on degenerate).
2. `bandRegion` projects onto `dir` (fallback to cardinal path when null). Step-cap by projected extent;
   monotonic; ≤1 step per adjacent cell preserved.
3. `SEG_DEFAULTS += {absorbDE: 22, tinyFloor: 2}`; `absorbSmallRegions` absorbs iff
   `size<=tinyFloor || bestΔE<=absorbDE`, else keeps the region. Plumb opts through `segmentMaterials`.
4. Tests: `gradientDirection` ≈ (1,0,1) on a diagonal; `bandRegion` diagonal monotonic ≤2 blocks across
   any face-adjacent transition, ordered; `absorbSmallRegions` keeps a colour-distinct small region,
   absorbs a colour-close one and a tiny speck. Existing cardinal/speck tests stay green (adjust the
   legacy speck test's colour to be close if needed).
**Verify:** `npm test` green.
**Commit:** `feat(E-19 T-064-01): PCA gradient banding + minRegion noise-vs-intent rule`

## Step 6 — Apply ×7 + record before/after (AC#5)
**Files:** `benchmarks/sculpture/e18-remeasure.{json,md}`, build artifacts, `progress.md`
1. Run the live sweep: `node benchmarks/sculpture/e18-remeasure.mjs` (needs GLBs on disk + GL host +
   dwebp). If GL/GLBs are unavailable in this environment, record that and provide an OFFLINE geometric
   verification instead (per-AC unit evidence + a synthetic-build segment run showing speckle drop and
   no off-palette/busy blocks), and flag the live sweep as the open item for the human.
2. Capture per-subject before/after: speckle (fixed T-062 metric), distinct-block, off-palette (must be
   0), form IoU (must not regress), value ΔE, and the manifest (must contain NO busy blocks).
3. Update `e18-remeasure.json/.md`; summarize deltas in `progress.md`.
**Verify:** `npm test` green; speckle drops ≥ on the busy subjects; no busy block in any manifest; IoU
not harmed.
**Commit:** `feat(E-19 T-064-01): apply variance-aware palette + gradient/minRegion ×7 (before/after)`

## Testing strategy
- **Unit (offline, deterministic):** every AC has a dedicated unit test (Steps 1–5) — this is the
  load-bearing verification, GL-free and CI-safe, matching the repo's pure-core discipline.
- **Integration (live sweep):** Step 6 is the real-render confirmation; treated as evidence, not a CI
  gate (GL/GLB deps are out of `npm test`).
- **Regression guards:** table `lab/rgb` byte-stability; `assertPaletteDiscipline` still passes;
  determinism (deep-equal artifact) preserved — no randomness introduced.

## Risk register
| Risk | Mitigation |
|---|---|
| Table regen perturbs `lab`/`rgb` | Don't touch `meanOpaqueRgb`; diff-guard lab/rgb only |
| `lambda` pulls snaps off-color | Small default (0.10); watch value-ΔE in the sweep |
| `varCeiling` starves a legit secondary | Most subjects add 0; verify IoU/value-ΔE hold; ceiling from data |
| Diagonal `dir` solve singular | Fallback to cardinal `gradientAxis` path |
| Legacy speck test breaks under new rule | Speck is colour-close ⇒ still absorbed; adjust fixture if needed |
| Live sweep blocked (no GL/GLB) | Offline geometric verification + flag for human |
