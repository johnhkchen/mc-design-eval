# T-063-01 — Structure: file-level blueprint

Not code — the shape of the code. Three files changed; one runner regeneration. Ordering matters: the pure
core + tests first (offline-verifiable), then the runner wiring, then the live regeneration.

---

## 1. `src/form/voxel-components.mjs` — ADD `pruneStrays` (pure)

New exported function, placed **after** `strayVoxelStats` (it consumes the same `componentLabels` core):

```js
/**
 * Drop stray components from an occupancy, keeping the largest plus any component whose size is ≥ a relative
 * floor (`minFraction × largestCount`) and ≥ an absolute floor (`minCells`). Geometric cleanup for TRELLIS
 * debris: floating islands and (moai) duplicate masses + hallucinated connectors. PURE; deterministic;
 * preserves occupiedCells order. Empty / single-component occupancy → returned unchanged.
 * @param {{occupied:Int32Array, count:number, dims?:number[], bounds?:object, voxelSize?:number, scale?:number}} occupancy
 * @param {{connectivity?:number, minFraction?:number, minCells?:number}} [opts]
 * @returns {object} a new occupancy with the same shape (minus a stale `thin` field), `occupied`/`count` pruned
 */
export function pruneStrays(occupancy, { connectivity = 6, minFraction = 0.5, minCells = 0 } = {}) { … }
```

Body shape:
- `if (!occupancy.count) return occupancy;`
- `const { labels, sizes } = componentLabels(occupancy, { connectivity });`
- if `sizes.length <= 1` → return occupancy unchanged (no-op fast path).
- argmax → `largest`, `largestCount = sizes[largest]`.
- `const floor = Math.max(minCells, minFraction * largestCount);`
- `const keep = sizes.map((s, l) => l === largest || s >= floor);`
- walk `occupiedCells(occupancy)` with an index `n`; push `[i,j,k]` to a plain array when `keep[labels[n]]`.
- `const occupied = Int32Array.from(kept); const count = kept.length / 3;`
- `const pruned = { ...occupancy, occupied, count }; delete pruned.thin; return pruned;`

Reuses `occupiedCells` (already imported) and `componentLabels` (same module). **No new imports.** No change to
`componentLabels`/`strayVoxelStats`/the file header beyond a one-line mention that the module now also *acts on*
occupancy (prunes), not only *measures* it.

Public surface of the module after the change: `componentLabels`, `strayVoxelStats`, **`pruneStrays`**.

## 2. `src/form/voxel-components.test.mjs` — ADD a `pruneStrays` section

Reuse the existing `makeOcc(dims, cells)` and `box(a,b,c)` helpers (already in the file). New tests under a
`// --- pruneStrays: AC cases ---` banner:

- **tiny island removed, main kept** — `box(3,3,3)` + one far cell `[9,9,9]` → pruned `count === 27`, one
  component, `largestFraction === 1`.
- **two large legitimate parts → both kept** — two `box(3,3,3)` masses separated by a gap, equal size → pruned
  `count === 54` (nothing dropped; each is ≥ 0.5× the other).
- **moai-like half-mass dropped** — main `box(4,4,4)` (64) + a detached `box(3,3,3)` (27, ratio 0.42 < 0.5) →
  pruned to 64; one component; `strayVoxelStats(pruned).largestFraction === 1`.
- **size-floor boundary (inclusive)** — main of 8 cells + a detached component of exactly 4 cells with
  `minFraction: 0.5` (floor = 4) → **kept** (`>=`); rerun with a 3-cell second component → **dropped**. Pins
  the inclusive boundary AC.
- **`minFraction` tunable** — the two-equal-masses occupancy with `minFraction: 1.01` keeps only the largest
  (argmax tie → lowest label) → demonstrates the knob without affecting defaults.
- **no-op on a single solid mass** — `box(3,3,3)` → identical `count`; (optionally) same `occupied` contents.
- **empty occupancy → returned unchanged** — `makeOcc([1,1,1], [])` → `count === 0`, no throw.
- **order preserved** — after pruning a main + trailing island, the surviving cells equal the main block's
  cells in original order (guards the occupiedCells-order contract that downstream color sampling relies on).

No new imports beyond adding `pruneStrays` to the existing
`import { componentLabels, strayVoxelStats } from "./voxel-components.mjs";` line.

## 3. `benchmarks/sculpture/e18-remeasure.mjs` — wire pruning + before/after + AC #4

**Imports** (top block): add `pruneStrays, strayVoxelStats` to the existing
`import { … } from "../../src/form/voxel-components.mjs";` — *there is currently no such import line*, so add:

```js
import { pruneStrays, strayVoxelStats } from "../../src/form/voxel-components.mjs";
```

**`buildSubject` body** edits (between current lines ~171 and ~209):

1. After `const occThin = voxelizeGlbThin(glbBytes, { scale });` add
   `const occPruned = pruneStrays(occThin);`
2. Compute `const strayBefore = strayVoxelStats(occThin);` and
   `const strayAfter = strayVoxelStats(occPruned);` (face-adjacency default).
3. In the `segmentMaterials({ occupancy: … }, { palette: …, augment: … })` call:
   - `occupancy: occThin` → `occupancy: occPruned`.
   - `palette: prim, augment: true,` → `palette: aug,` (drop `augment: true`) — AC #4.
   - extend the `style.rationale` cell-count note `${occBase.count}→${occThin.count}` →
     `${occBase.count}→${occThin.count}→${occPruned.count}`.
4. `speckleScore(occThin, eKeys)` → `speckleScore(occPruned, eKeys)` (keys are built from the pruned artifact,
   so the occupancy they are scored against must be the pruned one).
5. Extend the `thin` summary object (or add a sibling) with the stray block:
   `const stray = { before: strayBefore, after: strayAfter };`
6. `const row = { subject, r1, r2, e18, thin, stray, scale, … };`
7. Extend the `console.error` line with `· stray ${strayBefore.strayCount}→${strayAfter.strayCount}
   (frac ${round3(strayBefore.largestFraction)}→${round3(strayAfter.largestFraction)})`.

**Leave untouched:** `occBase` (still voxelizeGlb, scores R1/R2), `judgeIoU` (now renders the pruned build —
no signature change, it reads the written render PNG), `assertPaletteDiscipline(artifact, aug, {cap:
prim.length+2})` (still correct; `aug` is now both the snap set and the guard set).

**`assembleRemeasure` (`src/form/remeasure.mjs`)** — *not modified*. It rolls up the five scored axes; the
stray before/after lives in the per-subject `summary.json` + console, which is the AC-#5 record. (Threading
stray through the roll-up md is out of scope; YAGNI — the per-subject summary is the source of truth and the
review will tabulate it.)

## 4. Regenerated artifacts (live, GL + dwebp)

`node benchmarks/sculpture/e18-remeasure.mjs` regenerates, **for all 7**:
`e18-build/<subj>/{artifact.json, summary.json, render-3q.png}` and `e18-remeasure.{md,json}`.

Expected diffs:
- **moai** `artifact.json`: ~2912 fewer placements; `largestFraction → 1.0`; manifest still 5 (5 distinct);
  render shows a single statue (no duplicates/bars); `summary.json.stray.after.strayCount === 0`; form IoU
  **rises** (spurious silhouette mass gone).
- **other 6**: `artifact.json` byte-identical (pruning a no-op, palette change behaviour-preserving);
  `summary.json` gains the `stray` block with `before == after`.

If the GL host is **unavailable**, the geometric ACs (#1, #2, #5-geometry) are still proven by the unit tests +
an **offline stray before/after** computed directly from `occThin`/`occPruned` (no render); the form-IoU rise
(part of #3) is then recorded as *pending a live run* with the geometric evidence (frac 0.519→1.0) standing in.

## Ordering of changes (commit boundaries → see plan.md)

1. `pruneStrays` + its tests (pure, `npm test` green) — atomically committable, no runner dependency.
2. Runner wiring + AC-#4 palette change (code only; verifiable by a dry import/`--offline` parse).
3. Live regeneration of `e18-build` + `e18-remeasure.{md,json}` (data commit).

No cross-file cycle is introduced: `voxel-components.mjs` still imports only `occupiedCells` from
`glb-voxelize.mjs`; the runner imports from `voxel-components.mjs`. Clean dependency direction preserved.
