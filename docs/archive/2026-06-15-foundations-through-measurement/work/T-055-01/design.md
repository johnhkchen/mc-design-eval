# T-055-01 — design: material-clean-pass (E-17 rung R2)

Decisions, with rationale, grounded in `research.md`. R2 is a recomposition of proven E-10/E-11/E-16
primitives, so the design work is mostly about *where the seams go* and *what stays pure*.

## Decision 1 — Palette source: extract from the texture, snap to it (the headline)

**Chosen:** run the E-10 `extractPaletteFromPixels` on the **decoded baseColor texture atlas** to get a
small canonical block set, then snap every voxel to the nearest block *within that set*.

**Why.** This is the ticket's central directive and it directly attacks the speckle's *cause*. The R1
speckle is not noise in the colors per se — it is that the **snap target is the whole 305-block table**, so
two near-identical texels fall on either side of a Voronoi boundary between two table blocks and diverge.
Shrinking the snap target to ~8 value-true blocks collapses those boundaries: adjacent texels now almost
always resolve to the *same* canonical block. Manifest size drops from 71/91 (R1) toward `k`.

**Rejected — cluster the per-voxel samples.** Explicitly forbidden by the ticket, and rightly: the
per-voxel sample set is a *biased subsample* (one sample per occupied cell, weighted by the voxel
distribution, already a lossy nearest-vertex read), whereas the texture atlas is the ground-truth color
field E-10 was built to read. Clustering the samples would also re-introduce the very per-cell quantization
we are trying to remove. Use the picture, not the shadows of the picture.

**Rejected — a hand-authored per-subject whitelist.** Defeats the point (the instrument must generalize
across 7 subjects with no per-subject tuning) and `extractPaletteFromPixels` already does "which real
blocks are in this image" automatically.

## Decision 2 — `materialCleanVoxel(build, opts)` is PURE; the GLB wrapper is impure-via-injection

**Chosen:** mirror `glb-voxel-build.mjs` exactly. The headline function
`materialCleanVoxel(build, opts) → DesignArtifact` takes `build = { occupancy, surface, texture }` — an
**already-decoded** texture — and is fully pure (palette-extract, sample, snap, denoise, compile are all
pure). A thin impure `materialCleanGlb(glb, { decodeTexture, scale, ... })` wraps voxelize + parse +
injected decode + `materialCleanVoxel`, with the WebP codec injected by the runner.

**Why.** AC #3 demands the function be unit-tested on synthetic noisy color, pure and GL-free — only
possible if `materialCleanVoxel` takes decoded pixels. The `glbVoxelBuild` precedent already proves this
split is the house style (pure core + injected `decodeTexture`); R2 should be indistinguishable in shape.
`build` bundling `{occupancy, surface, texture}` matches `sampleSurfaceColors`'s existing argument exactly,
so the seam is already familiar.

**Rejected — make `materialCleanVoxel` take the raw GLB + `decodeTexture`.** That pushes WebP/GL concerns
into the function the test must exercise purely; the synthetic test would have to fake a GLB. The decoded-
`build` seam is strictly cleaner.

## Decision 3 — Reuse the R1 coordinate/manifest build via a small refactor (DRY)

**Chosen:** extract `keysToArtifact(occupancy, keys, opts)` out of `colorVoxelsToArtifact` in
`src/form/glb-voxel-build.mjs`, and have `colorVoxelsToArtifact` delegate to it after it computes keys.
`materialCleanVoxel` — which produces **keys** (after snap + denoise), not colors — calls `keysToArtifact`.

**Why.** The i/j/k→`pos` centering (`ox=⌊nx/2⌋`, `oz=⌊nz/2⌋`), the `minecraft:` prefixing, the sorted-
unique manifest, and the metadata/style/palette wrapper are a single source of truth that **both** R1
(colors→keys→artifact) and R2 (keys→artifact) must share. Duplicating it is exactly the
`parallel-roots-duplicate-shared-deps` smell. The refactor is behavior-preserving: `colorVoxelsToArtifact`
keeps its signature and output (the existing `glb-voxel-build.test.mjs` asserts this), it just routes the
last 10 lines through the new helper.

**Rejected — re-inline the coordinate map in `material-clean.mjs`.** Small (~10 lines) but it forks the
coordinate convention; a future change to the map would silently desync R1 and R2 builds. Not worth it.

## Decision 4 — Snap target is the canonical palette's table-Lab, not its representative color

**Chosen:** build the snap-palette as `entries.map(e => ({ key: e.block, lab: e.blockColor.lab }))` — the
**block's** Lab from the table, not the cluster's `repColor.lab`.

**Why.** The whole value-true discipline (E-14, the moai win, project memory `value-true-palette-codesign`)
is "snap to where the real block actually sits in Lab." `nearestLab(srgbToLab(texel), snapPalette)` must
measure distance to the *blocks*, so each cell goes to the block it is genuinely closest to among the
canonical set. Using `repColor.lab` would measure distance to cluster centroids — a second quantization on
top of median-cut. `blockColor.lab` is already on every entry, free.

## Decision 5 — Spatial denoise: single-pass majority over a box neighborhood, ties keep current

**Chosen:** `denoiseVoxelKeys(occupancy, keys, { radius=1, minVotes })` — for each occupied cell, take the
**most frequent block among occupied cells within Chebyshev `radius`** (the cell included); on a tie, keep
the cell's current block. Read from the old key array, write to a new one (**single synchronous pass**, so
the result is independent of iteration order and fully deterministic).

**Why.** Majority-in-neighborhood is the classic salt-and-pepper remover and is exactly the ticket's "a
voxel takes its neighborhood's dominant block." Reading-old/writing-new avoids a sweep-direction bias.
Keeping the current block on a tie is the conservative choice — it only flips a cell when the neighborhood
genuinely outvotes it, so it cannot manufacture a new majority. `radius=1` (a 3×3×3 box) is the smallest
neighborhood that denoises; exposed as an opt for tuning. Iterating denoise (2 passes) is available via the
opt but defaults to 1 — one pass already collapses isolated specks; more risks washing out real 2-block
boundaries.

**Rejected — 6-connected (face) neighborhood.** Sparser votes on a voxel surface (many cells have few
face-neighbors), weaker denoise. The 26-cell box gives a stronger, more stable majority. **Rejected —
Gaussian/mode-filter in Lab then re-snap.** Heavier, and re-snapping after blurring can drift colors off
their value-true block; majority over discrete keys preserves value-true-ness exactly.

## Decision 6 — E-11 material texture is opt-in and OFF for the measured sweep

**Chosen:** `opts.materialTexture` (default `false`). When on, each canonical block is expanded via
`hueFamilySet` and each cell repicked by `pickMaterial(set, t, cellHash(i,k), spread)` with `t` the
height fraction. The R2 breadth sweep runs it **OFF**.

**Why.** E-11 deliberately *adds* a small, controlled number of same-hue blocks for "deliberate texture."
That raises distinct-block count — directly opposing AC #4's "distinct-block count down" measurement. The
clean signal (palette + denoise) must be measured without it. Implementing + lightly testing the option
satisfies the ticket's "(+ optional E-11 material texture)" mention; leaving it off keeps the headline
before/after honest. The three `material.mjs` helpers are pure and compose over `(key, height, hash)`, so
reuse is clean (no build-state needed).

## Decision 7 — Noise metric: manifest size AND a spatial speckle score

**Chosen:** record per subject **distinct-block count** (manifest size) before (R1 artifact) → after (R2),
plus a pure **`speckleScore(occupancy, keys)`** = fraction of face-adjacent occupied cell pairs whose
blocks differ (lower = cleaner). Report both, and re-measure form IoU (expected ≈R1).

**Why.** Distinct-block count is the AC's named metric and the R1 evidence (71/91) makes the drop legible.
But manifest size alone could fall while specks remain rearranged; the adjacency speckle score measures the
*actual surface cleanliness* the ticket is about, and it is pure/testable from occupancy + keys (the R1
"before" keys are reconstructable from the committed R1 `artifact.json` placements — same deterministic
occupancy, same `occupiedCells` order). "Value ΔE" is satisfied implicitly: snapping to value-true blocks
keeps each cell's ΔE-to-true small (E-14), and the metric the ticket truly cares about is the speckle.

## Module placement

New pure module `src/form/material-clean.mjs` (sits beside `glb-voxel-build.mjs`, same E-16 family) with
`materialCleanVoxel` + helpers + impure-via-injection `materialCleanGlb`. New runner
`benchmarks/sculpture/glb-voxel-clean.mjs` mirroring `glb-voxel-breadth.mjs`. Unit tests
`src/form/material-clean.test.mjs`. The `keysToArtifact` refactor lands in `glb-voxel-build.mjs`.
