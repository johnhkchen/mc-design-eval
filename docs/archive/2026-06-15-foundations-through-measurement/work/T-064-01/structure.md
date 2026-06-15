# T-064-01 — Structure: clean-color-materials

File-level blueprint. Five source modules + one data file + three test files. No deletions.
Ordering matters: the table regen (data) and `nearestFlat` (primitive) are prerequisites for the
consumers; gradient + minRegion are independent and can land in any order.

## 1. `src/color/block-table.mjs` (MODIFY)

Add a variance helper next to `meanOpaqueRgb`; do NOT touch `meanOpaqueRgb` (keeps `rgb`/`lab` stable).

- **New export `varianceOpaque(png, alphaThreshold=128)`** — mirror `meanOpaqueRgb`'s frame/alpha logic
  exactly (first animation frame, alpha fallback `[threshold,1]`). Two-pass over opaque pixels: pass 1
  accumulate per-channel sums → means; pass 2 accumulate squared deviations → per-channel variance;
  return `Math.round(varR + varG + varB)` (summed channel variance, RGB² units). Return `0` if <2
  opaque pixels (no variance defined). Reuse the same opaque-pixel selection as `meanOpaqueRgb` so the
  pixel set matches the recorded mean.
- **`buildBlockTable`**: after `const rgb = meanOpaqueRgb(png)`, compute `const v = varianceOpaque(png)`
  and push `{ block, texture, rgb, lab: srgbToLab(rgb), var: v }`. Field name `var` (reserved word is
  fine as an object key/JSON key).

## 2. `src/color/block-lab-table.json` (REGENERATE — data)

Regenerate via a one-off node invocation of `buildBlockTable`, write back with the same 2-space JSON
formatting. Net diff: every block object gains a `"var": <int>` line; `block/texture/rgb/lab` byte-
identical. A guard test (see §7) asserts this. Provenance fields unchanged.

## 3. `src/color/cielab.mjs` (MODIFY)

- **New const `FLAT_LAMBDA = 0.10`** (exported) — the variance penalty weight.
- **New export `nearestFlat(targetLab, palette, {lambda = FLAT_LAMBDA, metric = deltaE76} = {})`** —
  linear scan minimizing `metric(targetLab, e.lab) + lambda * (Number.isFinite(e.var) ? Math.sqrt(e.var)
  : 0)`. Track the winner by penalized score but RETURN `{ key, deltaE, lab }` where `deltaE` is the
  TRUE (unpenalized) ΔE of the winner. Throws on empty palette (mirror `nearestLab`). Entries without
  `var` ⇒ identical to `nearestLab` (back-compat). Pure.
- Keep `nearestLab` unchanged.

## 4. `src/form/glb-voxel-build.mjs` (MODIFY)

- `blockPaletteFromTable(table)`: map to `{ key: b.block, lab: b.lab, var: b.var }` (carry variance).
- `paletteFromManifest(manifest, table)`: same — `{ key, lab, var }` for resolved blocks.
- No signature/return-shape change (extra field is additive; existing consumers ignore it).

## 5. `src/form/palette-augment.mjs` (MODIFY)

- Import `nearestFlat` (+ `FLAT_LAMBDA`) from `cielab.mjs`.
- `AUGMENT_DEFAULTS`: add `varCeiling` (calibrated, e.g. ~1500 RGB² — set after table regen) and
  `lambda: FLAT_LAMBDA`.
- `tablePalette(table)`: map to `{ key: b.block, lab: b.lab, var: b.var }`.
- `augmentReport`:
  - `const best = nearestFlat(c.lab, tbl, { lambda: o.lambda })` (flat-preferring fit).
  - New gate term in `qualifies`: `Number(best.var ?? tableVarOf(best.key)) <= o.varCeiling`. Since
    `nearestFlat` returns `{key,deltaE,lab}` (no `var`), look the candidate's `var` up from the chosen
    `tbl` entry — keep a `key→var` map built once from `tbl`. A candidate above the ceiling is rejected
    (recorded in `candidates` with `qualifies:false` for the audit trail).
  - `meanSnapBefore/After` keep using `nearestLab` (TRUE drift, honest metric) — penalty is selection-
    only, not a drift inflator.
- `augmentPalette` return shape unchanged (`{key,lab}` entries; `var` not required downstream but
  harmless to include — keep it minimal: return `{key,lab}` as today).

## 6. `src/form/material-segment.mjs` (MODIFY)

- Import `nearestFlat` from `cielab.mjs` (alongside `nearestLab`, `deltaE`, `srgbToLab`).
- `SEG_DEFAULTS`: add `absorbDE` (default = `growDE`, i.e. 22) and `tinyFloor` (default 2). Document.
- **`absorbSmallRegions(state, occupancy, labs, {minRegion, absorbDE, tinyFloor})`** — the noise-vs-
  intent rule. Inside the small-region loop, after computing `best`/`bestD` (ΔE to nearest neighbour
  mean): absorb iff `r.cells.length <= tinyFloor || bestD <= absorbDE`; else `continue` (keep region).
  Everything else (smallest-first, iterate-to-stable, no-neighbour keep) unchanged. Plumb the two new
  opts through `segmentMaterials` (read `opts.absorbDE`/`opts.tinyFloor`).
- **`gradientDirection(region, cellCoords, labs)`** (NEW export) — least-squares L*-gradient direction:
  build `XᵀX` (4×4 for [i,j,k,1]) and `Xᵀy` (y=L*), solve via a tiny `solve3` on the 3×3 coordinate
  block for the gradient `(α,β,γ)` (the intercept is irrelevant to direction); normalize. If `XᵀX`
  (3×3) is singular / near-zero gradient, return `null`.
- **`bandRegion`** — replace single-axis projection with the direction projection:
  - `const dir = gradientDirection(region, cellCoords, labs)`. If `dir` is null, FALL BACK to the
    existing cardinal path (current code) verbatim (keeps `gradientAxis` exercised + degenerate safety).
  - With `dir`: `proj(ci) = i*dir[0]+j*dir[1]+k*dir[2]`; compute `lo/hi/extent` over `proj`; sign is
    baked into `dir` (already dark→light), so drop the separate `sign` flip. Step-cap: `m = max(1,
    floor(extent)+1)`. Position `p = extent===0 ? 0 : (proj(ci)-lo)/extent`. Hard band: `steps[min(
    round(p*(K-1)), K-1)]`. Dither branch: keep ordered-Bayer over the two coords least aligned with
    `dir` (pick the two smallest |dir component| axes as the perpendicular pair). Monotonic in `proj`.
  - Keep `orderedDither` as-is.
- `fillRegion` unchanged (still routes gradients to `bandRegion`).
- **Snap calls use `nearestFlat`:** in `fillRegion` (flat single-block pick) and inside `bandRegion`
  (the `steps` derivation `nearestLab(labAt(...), palette)`), swap `nearestLab → nearestFlat` so the
  design-doc snap prefers flat blocks. (The palette entries now carry `var` via §4.)

## 7. Tests

- **`src/color/block-table.test.mjs` (MODIFY)** — Group B additions:
  - `varianceOpaque`: uniform texture → 0; a 2-colour checkerboard → variance > 0 and equals the known
    per-channel value; transparent pixels ignored; first animation frame only.
- **`src/color/cielab.test.mjs` (MODIFY)** —
  - `nearestFlat`: two entries at EQUAL ΔE, one with higher `var` → the flat one wins (AC#1 unit test).
  - `nearestFlat`: entries without `var` ⇒ identical result to `nearestLab`.
  - `nearestFlat`: a busy block with a small ΔE advantage still loses to a flat block within `λ·Δbusy`;
    a large ΔE advantage wins (penalty is bounded).
  - Returned `deltaE` is the TRUE ΔE (not the penalized score).
- **`src/form/material-segment.test.mjs` (MODIFY)** —
  - `gradientDirection`: a synthetic diagonal (L* increases along i+k) → direction ≈ normalized (1,0,1).
  - `bandRegion`: a DIAGONAL-gradient region bands MONOTONICALLY along the diagonal, ≤2 distinct blocks
    across any face-adjacent transition, ordered dark→light (AC#2 unit test). Existing cardinal
    `bandRegion` tests still pass (axis-aligned gradients have direction == a cardinal).
  - `absorbSmallRegions`: a colour-DISTINCT small region (bestΔE > absorbDE, size > tinyFloor) is NOT
    absorbed; a colour-CLOSE small region IS absorbed; a ≤tinyFloor speck is always absorbed (AC#3 unit
    test). Existing "single off-colour speck absorbed" test: make the speck colour-close so it still
    absorbs (or rely on tinyFloor).
- **`src/form/palette-augment.test.mjs` (MODIFY)** — a busy table block above `varCeiling` is rejected
  even at a great fit; a flat block of comparable fit is preferred over a busier one.

## 8. Runner (no code change expected)

`benchmarks/sculpture/e18-remeasure.mjs` already wires `augmentPalette(paletteFromManifest(...))` →
`segmentMaterials({palette})`; the new behaviour flows through transparently. The ×7 sweep (AC#5) is a
RUN, recorded into `e18-remeasure.json/.md` + `progress.md`. Only touch the runner if a default needs
threading (e.g. passing `varCeiling`); prefer relying on `AUGMENT_DEFAULTS`.

## Public interface deltas (summary)
- `block-table.mjs`: `+varianceOpaque`; table objects `+var`.
- `cielab.mjs`: `+nearestFlat`, `+FLAT_LAMBDA`.
- `glb-voxel-build.mjs`: palette entries `+var` (additive).
- `palette-augment.mjs`: `AUGMENT_DEFAULTS +varCeiling +lambda`; flat-aware secondary pick.
- `material-segment.mjs`: `+gradientDirection`; `SEG_DEFAULTS +absorbDE +tinyFloor`; `bandRegion`/
  `absorbSmallRegions`/`fillRegion` behaviour change; snaps via `nearestFlat`.
