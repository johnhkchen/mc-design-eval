# T-063-01 — Research: stray-voxel pruning

Map of the codebase as it bears on (a) a geometric `pruneStrays` over an occupancy grid, and (b) the
verified-bug claim that the combined build never places the gated secondary blocks. Descriptive only.

---

## The problem, restated from the data

TRELLIS reconstructions leave content the reference does not have: floating islands, and — for **moai** — a
**3-view contact sheet input → multiple statues + hallucinated connecting bars**. The committed
before-baseline (`benchmarks/sculpture/cleanliness-baseline.md`, T-062-01) quantifies it. Re-scored on the
fixed metrics, the E18 (thin+segment) build per subject:

| subject | components | largest-frac | strayCount | sub-floor |
|---|--:|--:|--:|--:|
| dancing-man | 1 | 1.0 | 0 | 0 |
| **moai** | **3** | **0.519** | **2912** | 0 |
| pineapple | 1 | 1.0 | 0 | 0 |
| bow-and-arrow | 1 | 1.0 | 0 | 0 |
| heart | 1 | 1.0 | 0 | 0 |
| mushroom | 1 | 1.0 | 0 | 0 |
| koi | 1 | 1.0 | 0 | 0 |

**moai is the sole multi-component subject after the thin pass.** Its three 6-connected components measure
**3147 / 1560 / 1352 cells** — ratios **1.000 / 0.496 / 0.430** of the largest. The two non-largest masses are
duplicate statues (≈half the principal mass each), not tiny debris. This single fact shapes the whole design:
no *absolute* small-island floor can drop them; the discriminator has to be **relative to the principal mass**.
Every other subject is already one solid mass — for them pruning must be a strict **no-op**.

## The occupancy data structure (the thing pruned)

`src/form/glb-voxelize.mjs` defines the contract every occupancy obeys:

```
{ scale, voxelSize, dims:[nx,ny,nz], bounds:{min,max}, occupied:Int32Array, count }
```

- `occupied` is **flat-packed [i,j,k] triples** in grid-scan order (i outer, j, k inner).
- `occupiedCells(occupancy)` is the canonical iterator — yields `[i,j,k]` tuples; **all** downstream code
  (color sampling, region growth, key compilation, the metrics) walks cells in this order, so *that order is
  the join key*. Any transform must preserve it.
- `voxelizeGlbThin` (`src/form/glb-thin.mjs`) returns the **same shape plus** an additive
  `thin:{surfaceOnlyCount, components}` diagnostic field. It is what the combined build voxelizes with.

## The component machinery already in place (T-062-01)

`src/form/voxel-components.mjs` (new last commit) is the natural home:

- `componentLabels(occupancy, {connectivity=6}) → { labels:Int32Array, sizes:number[], count }` — iterative
  DFS flood fill over an `"i,j,k"→index` map; `labels[n]` is the component id of the n-th occupied cell (in
  `occupiedCells` order), `sizes[label]` in **label/discovery order** (not sorted). PURE, deterministic.
- `strayVoxelStats(occupancy, {connectivity=6}) → { components, largestCount, largestFraction, strayCount,
  subFloorCount }` — the S-062 metric. Largest = max size, ties broken by lowest label index. This is exactly
  the **before/after instrument** AC #5 wants, and it already exists.
- `glb-thin.mjs:connectedComponents` delegates to `componentLabels` (one flood fill, two consumers).

So `pruneStrays` does **not** need a new flood fill — it reads `componentLabels`, picks which labels to keep,
and filters `occupied`. It is the third consumer of the same core.

## The build path (where pruning must be wired) — `benchmarks/sculpture/e18-remeasure.mjs`

This is the ×7 combined-build runner; `buildSubject` is the per-subject body:

1. `occBase = voxelizeGlb(glbBytes,{scale})` — non-thin, used only to score the R1/R2 baselines.
2. `occThin = voxelizeGlbThin(glbBytes,{scale})` — **the build occupancy** (has the `thin` field).
3. `surface = parseGlbColoredSurface`, `texture = decodeTexture(...)` (the impure dwebp/GL edge).
4. `prim = paletteFromManifest(designManifest)`, `aug = augmentPalette(prim, texture)`.
5. `artifact = segmentMaterials({occupancy: occThin, surface, texture}, { palette: prim, augment: true, … })`.
6. `assertArtifact`, `assertPaletteDiscipline(artifact, aug, {cap: prim.length+2})`, write `artifact.json`.
7. render `render-3q.png`, `judgeIoU` vs the GLB silhouette → `e18.formIoU`.
8. write per-subject `summary.json`; `assembleRemeasure` rolls up `e18-remeasure.{md,json}`.

`segmentMaterials` reads occupancy purely through `occupiedCells` coords + `count` (it samples surface color
by nearest-vertex per cell, then grows/absorbs regions and compiles via `keysToArtifact`). **Therefore
shrinking the occupied set is transparent to it** — surface sampling is coordinate-based, region growth keys
by cell index, and `keysToArtifact` centers x/z from `dims` (unchanged by pruning). Pruning slots cleanly
between step 2 and step 5.

Form IoU (step 7) needs **live GL + dwebp** — the only part not reproducible offline. The geometric
before/after (stray counts) is fully offline.

## The "verified bug" (AC #4) — what is actually true today

The ticket states line ~187 passes `palette: prim` so "the ≤2 gated secondary blocks are computed but never
placed." **The current code also passes `augment: true`** on the next line, and `segmentMaterials` augments
*internally* when `augment` is truthy (`material-segment.mjs:473` →
`snapPalette = augmentPalette(snapPalette, texture, a.table, a)`). I verified the committed E18 manifests:

- **moai**: design-doc/prim = 4 blocks, E18 manifest = **5** → **1 secondary already placed**.
- **heart**: prim = 5, E18 manifest = **7** → **2 secondary already placed**.
- dancing-man / koi: prim 5, E18 5 → none needed (no high-drift colour).

So the secondary blocks are **already being placed**; the "never placed" premise is **stale** (it predates the
`augment: true` line, or read only the `palette:` line). The remaining real issue is a **single-source-of-
truth divergence**: the runner computes `aug` for the discipline guard and off-palette membership, but the
snap-candidate set is re-augmented *independently* inside `segmentMaterials`. They happen to be equal today
(`augmentPalette(prim,texture)` ≡ `augmentPalette(prim,texture,undefined,{})`), but nothing enforces it — drift
in augment defaults would let the snap set and the guard set disagree. Passing the already-computed `aug` and
dropping the redundant `augment:true` makes the snap set *identical to* the guard set by construction.

## Tests & conventions to honour

- `src/form/voxel-components.test.mjs` — the established test style: `makeOcc(dims, cells)` + `box(a,b,c)`
  helpers, hand-built occupancies, pure/offline. New `pruneStrays` tests belong here.
- `npm test` is the gate (node:test). T-062-01 left the suite green at 617.
- House rule (design.md, T-062-01): **no reimplementation** — reuse `componentLabels`, don't fork a 4th DFS.
- `cleanliness-baseline.mjs` is the committed **before** snapshot (offline, artifact-reconstructed). The
  **after** is the regenerated E18 build re-scored — recorded per-subject in `buildSubject`'s `summary.json`.

## Constraints / assumptions

- **No SAM, stay geometric** (user directive, epic E-19). The discriminator is size-of-component only.
- A relative floor that drops moai's 0.496×/0.430× masses *must* sit just above 0.496; it is the only subject
  exercising the threshold, so 0.5 is safe across the committed 7 — but the margin to moai's 0.496 is thin and
  must be called out.
- "A legitimately separate part (e.g. an arrow) is kept": after the thin pass bow-and-arrow is already one
  component, so this is protected *by design* (any part ≥ floor survives), not exercised by the 7 today.
- Form IoU regeneration needs the live GL host; if unavailable, the geometric ACs are still fully verifiable.
