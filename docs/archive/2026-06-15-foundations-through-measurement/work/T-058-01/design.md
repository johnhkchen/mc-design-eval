# T-058-01 — Design: material-region segmentation

Decisions, with rejected alternatives, grounded in `research.md`. The shape: a new **pure** core
`segmentMaterials(build, opts) → DesignArtifact` (mirrors `materialCleanVoxel`'s purity split), plus a
GL/host runner mirroring `glb-voxel-clean.mjs`. R2 is left untouched (committed history; its runner and
artifacts are the before/after baseline).

## The pipeline (overview)

```
segmentMaterials(build, opts):
  1. tight fixed palette  ← extractTexturePalette(texture, { k:6, dropColor:null })   [the ONLY blocks]
  2. per-cell Lab         ← sampleSurfaceColors → srgbToLab                            [occupiedCells order]
  3. grow regions         ← connected components over occupied cells, 6-neighbour,
                            join when ΔE(lab_a, lab_b) ≤ growΔE                        [structural coherence]
  4. absorb specks        ← regions with count < minRegion merged into the adjacent
                            region whose mean-Lab is nearest                            [off-colour singleton fix]
  5. fill each region:
       flat   (Lab spread ≤ gradΔE)  → ONE palette block (nearest to region mean Lab)
       gradient (spread  > gradΔE)   → band/ordered-dither between adjacent palette steps
                                       along the region's gradient axis
  6. optional E-11 texture WITHIN the fixed palette (default OFF)
  7. keys → keysToArtifact                                                             [shared compile + AJV gate]
```

Every key emitted in step 5/6 is a member of the step-1 palette ⇒ **off-palette = 0** structurally, and
**distinct ≤ palette size**. That is the palette-leakage directive met by construction.

## Decision 1 — Region growth (connected components by Lab ΔE), not a stronger denoiser

**Chosen.** Build regions as 6-neighbour connected components over occupied cells where two adjacent
cells join iff `deltaE(labA, labB) ≤ growΔE`. Then fill per region.

*Why.* The R2 residual (research §1, §4) is precisely a failure of *locality*: `denoiseVoxelKeys` is a
radius-1 majority with no concept of a region, so a speck in a split neighbourhood survives. Growing
regions first, filling second, makes coherence structural — a lone off-colour voxel is, by construction,
either its own tiny region (absorbed in step 4) or already inside the big region (overwritten by the
region fill). This is the literal ticket instruction ("group contiguous same-material voxels into
regions … fill each region with one palette block").

*Rejected.* (a) **Bigger denoise radius / more passes** — still local, still coverage-blind, blurs real
boundaries before it kills isolated specks; it's the knob we already turned. (b) **K-means over colour
only (ignore space)** — produces global colour classes but not *contiguous* regions, so disconnected
same-colour patches merge and a gradient collapses to classes with hard seams; loses the spatial
structure the band step needs. (c) **Mesh-face / UV-island segmentation** — segment on the GLB surface
then transfer — richer, but couples to mesh topology, is far heavier, and the voxel grid is the unit we
fill; deferred.

## Decision 2 — Tight fixed palette via `extractTexturePalette` with small k; the pass NEVER leaves it

**Chosen.** Reuse `extractTexturePalette(texture, { k:6, dropColor:null })` (E-10 median-cut over the
texture, value-true block Lab). `k` is the lone palette-size knob (default 6, down from R2's 8). Every
downstream choice — region fill, gradient band, optional E-11 texture — selects **only** from this
`snapPalette`. Record `offPalette` = blocks placed that are not in it (must be 0).

*Why.* The leakage directive: "a handful of value-true blocks, zero off-palette, distinct ≈ palette
size." Extracting once and treating the result as a closed set is the simplest enforcement — there is no
code path that can place a non-palette block.

*Rejected.* (a) **Full 305-table snap** (R1) — the original leak. (b) **E-11 `hueFamilySet` expansion in
the fill path** — research §1 names it a leakage vector (near-duplicates); demote to opt-in *within* the
fixed palette only (Decision 6). (c) **A hand-authored fixed palette per subject** — defeats the
"extract from the subject's own texture" property that made R2 value-true and would not generalise across
the 7 subjects.

## Decision 3 — Flat vs gradient is decided by a region's Lab spread; bands handle gradients

**Chosen.** Per region compute mean Lab and **Lab spread** = max pairwise spread along the principal Lab
axis (cheap proxy: `max(L)−min(L)` combined with a/b range, i.e. the diagonal of the per-axis Lab
bounding box). If `spread ≤ gradΔE` → **flat**, fill one block (nearest palette to mean). If `spread >
gradΔE` → **gradient**, band it.

The region-grow threshold makes this clean: a *smooth* gradient has small adjacent ΔE, so it grows into
**one** region with a **large** total spread (→ gradient); a *flat but noisy* patch grows into one region
with **small** spread (→ one block). The two symptoms separate naturally.

**Band/dither** (the gradient directive):
1. **Gradient axis** = the spatial axis (i, j, or k) whose voxel-coordinate most correlates (abs Pearson)
   with voxel L*; tie/degenerate → j (height). This is the direction the colour actually changes along.
2. **Steps** = the distinct palette blocks the region's voxels snap to (nearest palette per voxel),
   deduped, **ordered by L\*** → `steps[0..K-1]` (dark→light). If `K==1` the region is effectively flat
   → one block.
3. For each voxel: normalised position `p∈[0,1]` along the gradient axis (region min..max). Continuous
   step `s = p·(K−1)`; `base=⌊s⌋`, `frac=s−base`. Assign `steps[base]` if `dither(cell) ≥ frac` else
   `steps[base+1]` (clamp to `K−1`). `dither` is an **ordered** value: a small Bayer matrix indexed by the
   two axes perpendicular to the gradient axis (deterministic, structured) — so a 1-wide column is a hard
   monotonic staircase and a wide surface gets a structured dithered boundary.

*Property (the AC):* at any position only `steps[base]` and `steps[base+1]` are possible ⇒ **≤2 adjacent
palette blocks across a transition**; `base` is monotonic non-decreasing in `p` ⇒ **monotonic, not
random**. Total distinct in the region ≤ K ≤ palette size ⇒ small.

*Rejected.* (a) **One block per gradient region** (pure flat fill) — kills the gradient, flattening the
koi/heart shading the form pass fought for; banding preserves it deliberately. (b) **Per-voxel snap
inside the gradient region** — that *is* the speckle. (c) **Random/`cellHash` dither** — softens the
boundary but reads as noise and fails "monotonic, not random"; ordered (Bayer) dither is deterministic
and structured. (d) **Error-diffusion (Floyd–Steinberg) in 3-D** — higher quality dithering but
order-dependent and hard to make deterministic/testable over `occupiedCells` order; ordered dither is the
right cost/clarity point.

## Decision 4 — Absorb small regions into the nearest-Lab neighbour (the off-colour singleton fix)

**Chosen.** After growth, any region with `count < minRegion` (default 2 — i.e. true singletons; tunable)
is merged into the adjacent region (sharing a 6-face) whose **mean Lab is nearest**. Iterate
smallest-first until none remain (or no adjacent region exists — then it keeps its own nearest-palette
fill). Deterministic order: by ascending count, then by first-cell `occupiedCells` index.

*Why.* This is the explicit "off-color singletons absorbed" instruction and the direct cure for the
surviving speck. Merging into the *nearest-Lab* neighbour (not just the largest) keeps value-true intent.

*Rejected.* **Skip absorption, rely on the grow threshold alone** — a speck that differs by > growΔE from
all neighbours is its own region and would get its own block (a sanctioned speck). Absorption closes that.

## Decision 5 — A new module + new runner; R2 untouched

**Chosen.** New pure module `src/form/material-segment.mjs` exporting `segmentMaterials` and its testable
sub-steps; new runner `benchmarks/sculpture/glb-voxel-seg.mjs` writing `glb-voxel-seg/<subject>/`. Reuse
`extractTexturePalette`, `sampleSurfaceColors`, `keysToArtifact`, `speckleScore` (import from
`material-clean.mjs`), `srgbToLab`/`deltaE`/`nearestLab`, `occupiedCells`, and the E-11 helpers.

*Why.* R2 (`materialCleanVoxel`) is committed history and the before/after baseline — its runner reads its
own artifacts. Adding alongside keeps the rung ladder auditable and avoids touching files T-059-01 may be
editing (research §7: new files only). `speckleScore` is already the right metric — importing it (not
re-defining) keeps one source of truth.

*Rejected.* **Edit `materialCleanVoxel` in place** — destroys the R2 baseline and risks a write collision
with the sibling root.

## Decision 6 — Optional E-11 texture, in-palette only, default OFF

**Chosen.** Keep an opt-in `materialTexture` flag that expands a region's chosen block via `hueFamilySet`
**filtered to the fixed palette** and re-picks by height + `cellHash`. Default OFF for the measured sweep
(it adds blocks, opposing the distinct-block-down metric). When on, picks are intersected with the fixed
palette so off-palette stays 0.

*Why.* Preserves the deliberate-texture capability the ticket calls "optional E-11 material within the
fixed palette" without compromising the headline leakage metric.

*Rejected.* **E-11 unfiltered** — the leakage vector itself (research §1).

## Metrics (recorded before/after per subject)

- **speckle** — `speckleScore(occupancy, keys)`, R2 → R-seg. Drops on the noisy ones (heart, koi) [AC].
- **distinct-block** — `palette.manifest.length`, R2 → R-seg. Large drop; R-seg ≈ palette size.
- **off-palette** — count of placed blocks not in the fixed palette. R-seg = **0**; R2 measured against
  the same palette shows the leakage it removes.
- **form IoU** — silhouette vs GLB mesh at `SCULPTURE_VIEW_3Q`, R2 → R-seg. Must **not** drop (occupancy
  untouched).

## Default tunables (justified in `plan.md`, tuned on the sweep)

`{ k:6, growΔE:10, gradΔE:18, minRegion:2, neighbourhood:6, materialTexture:false }`. growΔE < gradΔE so a
single material's internal noise grows together while a smooth gradient stays one region yet trips the
gradient test; both are ΔE in the same CIE76 space the whole stack uses.
