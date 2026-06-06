# T-062-01 — Review: cleanliness metrics

Handoff doc for E-19's scoreboard fix. **`npm test` 617/617 green** (608 baseline + 9 net new). Working tree
clean; 3 code commits + work artifacts.

## What changed

### New — `src/form/voxel-components.mjs`
The structural cleanliness module. Two pure exports over a voxel occupancy's face-adjacency:
- `componentLabels(occupancy, {connectivity=6}) → {labels:Int32Array, sizes:number[], count}` — the shared
  flood-fill core (labels per occupiedCells-order cell). Connectivity 6 (face) or 26 (box).
- `strayVoxelStats(occupancy, {connectivity=6}) → {components, largestCount, largestFraction, strayCount,
  subFloorCount}` — the AC's stray-voxel metric. `largestFraction` 1.0 ⇔ one solid mass; `strayCount` = cells
  outside the main mass; `subFloorCount` = stray cells strictly below the main mass's floor.

### Edited — `src/form/glb-thin.mjs`
`connectedComponents` now **delegates** to `componentLabels` (one flood fill instead of a second copy), same
public signature/default (`connectivity=26`) and return shape (`{count, sizes desc}`). Removed the now-dead
local `indexCells`/`FACE_DIRS`/`BOX_DIRS` and the unused `occupiedCells` import.

### Edited — `src/form/material-clean.mjs`
`speckleScore` rewritten from **boundary-counting** (fraction of differing adjacent *pairs*) to
**fragmentation** (fraction of *cells* that are locally outvoted: some other block strictly outnumbers the
cell's own among `{self} ∪ {6 face-neighbours}`). Signature, `[0,1]` range, and monotone direction unchanged;
the `material-segment.mjs` re-export is untouched.

### New/edited tests
- `src/form/voxel-components.test.mjs` (new, 10 tests).
- `src/form/material-clean.test.mjs` — the one direct-value speckle test replaced with fragmentation cases.

### New — `benchmarks/sculpture/cleanliness-baseline.{mjs,md,json}`
Offline runner + generated before-baseline. Reconstructs `{occupancy, keys}` from each committed
`artifact.json` (no GL/GLB/decode) and scores R1/R2/E18 on the fixed metrics for all 7 subjects.

## Test coverage

| AC | Covered by | Status |
|---|---|---|
| stray/component metric (count + largest-frac + sub-floor), pure in `src/form/` | `strayVoxelStats` + 5 stray tests | ✅ |
| `speckleScore` fixed to fragmentation; old call sites keep working | rewrite + 5 speckle cases; segment relative asserts still green | ✅ |
| 2-region clean → ≈0; checkerboard → high; island → fraction<1; solid → fraction 1 | `material-clean.test.mjs` + `voxel-components.test.mjs` | ✅ |
| E-18 builds re-scored as before-baseline | `cleanliness-baseline.{md,json}` (7×3) | ✅ |
| `npm test` green | 617/617 | ✅ |

Specifically verified:
- **2-region clean block → exactly 0** (the headline AC case): a 4×4×1 block split red/blue, no boundary
  penalty.
- **checkerboard → > 0.9**; **single speck → exactly 1/9**; **uniform & lone cell → 0**.
- **solid mass → fraction 1, 0 stray**; **floating island → fraction < 1, stray = island size**;
  **sub-floor below → 1, above → 0** (asserts "below", not merely "disconnected").
- **delegation parity**: `connectedComponents` sizes == core sizes sorted desc (6 and 26).
- **regression**: full `glb-thin`/`material-segment`/`material-clean` suites green under the new core + metric.

## Baseline signal (for the rest of E-19)
- **moai** is the structural problem child: R1/R2 = 6 components / largestFraction 0.52 / 2023 stray; E18
  (thin+seg) is *worse* — 3 comps / 0.519 / 2912 stray — consistent with the documented 3-view-contact-sheet
  TRELLIS multi-statue hallucination. The metric now makes this visible and quantified.
- **bow-and-arrow** R1/R2 fragment to 21 components (frac 0.277); **E18 consolidates to a single solid mass**.
- The other five subjects have small R1/R2 stray (19–80 cells) and reach **fraction 1.0** under E18.
- New speckle drops sharply on every E18 build (≤0.028; moai E18 = 0.0) — boundaries no longer counted.

## Open concerns / limitations
1. **`subFloorCount` is 0 across all current builds.** The existing islands sit beside the main mass, not
   beneath its floor, so this stricter diagnostic is untriggered today. It's faithful (not a bug) but
   currently *unexercised by real data* — its behaviour rests on the unit tests alone. If E-19 never produces
   under-floor debris, consider whether the field earns its place or should fold into `strayCount`.
2. **`occupancyFromArtifact` lives in the benchmark, not `src/`.** Deliberate (presentation-only, YAGNI). If a
   later E-19 ticket needs to score artifacts in core code, lift it to `src/form/` with its own test.
3. **`largestFraction` denominator is total cells, not a floor area** — a build that is two equal masses
   reads 0.5 (correct), but the metric says nothing about *how far apart* components are or their shape. The
   stray count is a cell count, not a "number of islands"; `components` covers island count. Adequate for the
   scoreboard; a future ticket wanting "prune islands smaller than N" has the labels available via
   `componentLabels` already.
4. **Speckle is still color-fragmentation only**, orthogonal to geometry: a single-block checkerboard of
   occupancy is one solid component (stray 0) but a two-color checkerboard scores ~1 speckle. The two metrics
   are intentionally separate; consumers must read both for "clean".

## Nothing requires human intervention before merge.
The metrics are pure and tested; the baseline is a recorded read. The moai E18 regression is a *finding the
scoreboard now surfaces*, not a defect in this ticket — it is the input to the next E-19 ticket.
