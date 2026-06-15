# T-064-01 — Design: clean-color-materials

Three independent sub-problems (AC#1 palette busy-ness, AC#2 diagonal gradients, AC#3 minRegion).
Each gets its own decision below, grounded in the research map. Guiding constraint: reuse
`nearestLab`, keep the pure/decoded-texture split, keep the committed table's `lab`/`rgb` byte-identical.

---

## AC#1 — Texture-variance-aware palette

### The signal
`meanOpaqueRgb` collapses a texture to its mean; a busy block's mean can tie a flat block's mean ΔE
while the block reads as noise. We need per-block **texture variance** and a way to make a busy block
*lose to a flat block of comparable mean ΔE* in BOTH the design-doc snap and the gated secondary.

### Options for sourcing variance
- **(A) Regenerate the committed table with a `var` field** (mean per-channel variance over the same
  opaque first-frame pixels `meanOpaqueRgb` averages). Build-time, pure runtime read, one number/block.
- **(B) Compute variance lazily at runtime from PNGs.** Rejected: drags `pngjs`/`minecraft-assets` onto
  the runtime path, violating the portability boundary; slow per-run.
- **(C) Hardcode a denylist of known-busy blocks.** Rejected: brittle, doesn't generalize, doesn't
  satisfy "compute each candidate block's texture variance."

**Decision: (A).** Add `varianceOpaque(png)` mirroring `meanOpaqueRgb` (same frame/alpha logic), return
the summed per-channel variance (RGB² units). `buildBlockTable` records `var` (rounded). Regenerate
`block-lab-table.json`; assert `lab`/`rgb` unchanged vs the old table (only `var` added).

### Options for *using* variance in selection
- **(A) Variance-penalized ΔE:** pick argmin of `deltaE + λ·busy(var)` where `busy(var)=sqrt(var)`
  (an RGB std-dev, same order of magnitude as Lab ΔE). At equal ΔE the flatter block wins; a busy block
  only wins when its ΔE advantage exceeds `λ·Δbusy`. One mechanism, both surfaces.
- **(B) Hard variance ceiling only** (drop blocks above a variance cutoff). Too blunt for the snap (could
  empty a small design-doc palette) but ideal as a *secondary* safety net for egregious blocks.
- **(C) Two-pass: filter then nearest.** Equivalent to (B); same drawback.

**Decision: (A) as the primary mechanism + (B) as a ceiling only on the gated secondary.**
- Add `nearestFlat(targetLab, palette, {lambda})` to `cielab.mjs`: when a palette entry carries a numeric
  `var`, score `deltaE + lambda·sqrt(var)`; entries without `var` score plain ΔE (graceful, back-compat).
  Returns the same `{key, deltaE, lab}` shape (`deltaE` is the TRUE ΔE, not the penalized score — callers
  that report drift stay honest). Default `lambda` small (≈0.10) — a tie-breaker, not a hammer.
- Palette builders attach `var` to entries: `paletteFromManifest`/`blockPaletteFromTable` copy `b.var`
  from the table; `extractTexturePalette` copies `blockColor.var` if present.
- The **design-doc snap** (`material-segment` fill/band) routes its `nearestLab` calls through
  `nearestFlat` — so when two design-doc blocks are comparable, the flatter wins per cell.
- The **gated secondary** (`augmentPalette`): (i) replace `best = nearestLab(c.lab, tbl)` with
  `nearestFlat(c.lab, tbl, {lambda})` so a flat table block beats a busy one of comparable fit; (ii) add a
  hard `varCeiling` gate — a candidate whose `var` exceeds the ceiling cannot be added at all (kills
  coral/ore/mycelium regardless of fit). Ceiling chosen from the table's variance distribution (below).

### Why not penalize the design-doc palette into emptiness
`paletteFromManifest` must always return the model's chosen blocks (it throws if empty). We never DROP a
design-doc block — `nearestFlat` only re-ranks WITHIN the set. The hard ceiling applies ONLY to the
secondary (candidate table blocks the model never asked for). This respects "the model's deliberate few".

---

## AC#2 — PCA / true-axis gradient banding

### The problem
`gradientAxis` returns one of three cardinal axes; a diagonal gradient (color varies along i+k) has its
variation split across two cardinals, so banding by either scatters.

### Options
- **(A) True principal direction via least-squares L*-gradient.** Fit `L* ≈ α·i+β·j+γ·k+δ` over the
  region; the gradient `(α,β,γ)` normalized is the direction colour changes fastest along. Project each
  cell's coord onto it for the band position. Closed-form, pure, deterministic, no eigensolver.
- **(B) Full PCA (3×3 covariance eigen-decomposition) of spatial coords weighted by L*.** Heavier
  (Jacobi eigensolver), and "principal axis of the point cloud" ≠ "axis colour varies along" — a long
  thin region's principal spatial axis can be orthogonal to its colour gradient. Wrong objective.
- **(C) Keep cardinal but pick the 2-axis diagonal with best correlation.** Half-measure; only handles
  45° diagonals, not arbitrary directions.

**Decision: (A) least-squares L*-gradient direction.** The normal equations for a 3-variable linear fit
are a 3×3 solve (coords are cheap, region sizes small) — implement a tiny 3×3 Gaussian solve or, since
we only need the direction, use the analytic gradient = `Cov(coord, L*)` vector decorrelated by the
coord covariance. To stay simple and robust, fit via the **3×3 normal equations** `(XᵀX)β = Xᵀy` with a
direct solve; if `XᵀX` is singular (degenerate region/plane), fall back to `gradientAxis`'s cardinal pick
(keeps the old behaviour as a safety net and keeps that function alive for its test). Direction is sign-
normalized so banding runs dark→light. `bandRegion` projects `coord·dir` for lo/hi/extent and position;
step-cap uses the projected extent rounded to an integer cell count → ≤1 step per adjacent cell still
holds (adjacent cells differ by ≤1 in each coord, so their projection differs by ≤‖dir‖₁·1; we cap steps
to `floor(projExtent)+1`). Monotonic non-decreasing along the projection either way.

`gradientAxis` stays exported and used as the degenerate fallback + sign reference; existing test passes
unchanged. New `gradientDirection(region, cellCoords, labs)` returns the unit vector.

---

## AC#3 — minRegion noise-vs-intent rule

### The problem
`absorbSmallRegions` absorbs every `<minRegion` region unconditionally — a colour-distinct small feature
(mushroom spot, eye) dies with the noise.

### Options
- **(A) Distance-gated absorb:** absorb a small region ONLY when its mean Lab is CLOSE to the best
  neighbour (`bestΔE ≤ absorbDE`) — i.e. it's noise *of that material*. A small region that is colour-
  distinct (`bestΔE > absorbDE`) is INTENT → kept. Plus an absolute `tinyFloor` (≤2 cells) always
  absorbed (single/double-voxel snap flecks are noise regardless).
- **(B) Lower minRegion globally.** Rejected: trades one failure for the other — raises speckle (more
  surviving noise specks) to save detail; the metric AC#5 would regress.
- **(C) Shape heuristic (compactness).** A compact blob = intent, scattered = noise. More complex, and a
  colour-distinct compact blob is already caught by (A); scattered noise is caught by (A)'s closeness
  test too. Not worth the extra surface.

**Decision: (A).** Extend `absorbSmallRegions` opts: `{minRegion, absorbDE, tinyFloor}`. Rule per small
region `r` (size `< minRegion`): compute `bestΔE` to the nearest-mean differently-labelled neighbour;
absorb iff `size ≤ tinyFloor` OR `bestΔE ≤ absorbDE`; otherwise keep `r` as its own region (it then gets
its own nearest-palette fill). Defaults: `absorbDE = growDE` (a region within grow distance of its
neighbour *should* have merged anyway — it's noise; beyond it, it's a distinct material), `tinyFloor = 2`.
Smallest-first iteration and deterministic tie-breaks unchanged. The existing
"single off-colour speck absorbed" test uses a speck close in colour → still absorbed (passes).

---

## Tunables & calibration

`SEG_DEFAULTS` gains `absorbDE`/`tinyFloor`. `nearestFlat` `lambda` lives as a named const
(`FLAT_LAMBDA ≈ 0.10`). `augmentPalette` gains `varCeiling` (+ uses `lambda`); the ceiling is set from the
regenerated table's variance distribution — chosen so coral/ore/mycelium fall above it and ordinary
matte blocks (concrete/terracotta/wool/planks) fall below. Calibrated empirically after the table
regen (plan Step 1), recorded in `progress.md`. All ΔE in CIE76, consistent with the stack.

## Risks
- Table regen could shift a `lab`/`rgb` byte if `meanOpaqueRgb` is touched — mitigate: do NOT change
  `meanOpaqueRgb`; add `varianceOpaque` alongside; diff old vs new table on `lab`/`rgb` only.
- `lambda` too high could pull snaps off-color (raise value ΔE) — keep small, verify value-ΔE metric in
  the sweep doesn't regress.
- `varCeiling` too low could starve a subject that legitimately needs a textured secondary — most
  subjects add 0 secondary anyway; verify form IoU/value ΔE hold in the ×7 sweep.
