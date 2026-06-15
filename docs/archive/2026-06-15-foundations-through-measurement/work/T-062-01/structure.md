# T-062-01 — Structure: cleanliness metrics

The blueprint — file-level changes, interfaces, internal organization, ordering. Not code.

## File map

| File | Change | Why |
|---|---|---|
| `src/form/voxel-components.mjs` | **new** | `componentLabels` (shared flood-fill core) + `strayVoxelStats` |
| `src/form/voxel-components.test.mjs` | **new** | unit tests for both exports (AC stray cases) |
| `src/form/glb-thin.mjs` | **edit** | `connectedComponents` delegates to `componentLabels`; drop local DFS |
| `src/form/material-clean.mjs` | **edit** | rewrite `speckleScore` body (signature/shape unchanged) |
| `src/form/material-clean.test.mjs` | **edit** | replace the one direct-value speckle test with fragmentation cases |
| `benchmarks/sculpture/cleanliness-baseline.mjs` | **new** | offline rescore of R1/R2/E18 on fixed metrics |
| `benchmarks/sculpture/cleanliness-baseline.json` | **new (generated)** | before-baseline rows + meta |
| `benchmarks/sculpture/cleanliness-baseline.md` | **new (generated)** | human table |

No deletions of public symbols. `connectedComponents`, `speckleScore` keep their exact public signatures.

---

## `src/form/voxel-components.mjs` (new)

Header comment in house style: purpose (pure structural cleanliness metrics over occupancy face-adjacency),
purity statement (no GL/GLB/network; reads only `occupied`/`count`/`dims`), reuse note (the labeling core that
`glb-thin.connectedComponents` now delegates to — one flood fill, not three copies).

Imports: `occupiedCells` from `./glb-voxelize.mjs`. (Nothing else — lowest geometry layer.)

Module-private:
- `FACE_DIRS` = `[[±1,0,0],[0,±1,0],[0,0,±1]]` (6), `BOX_DIRS` = the 26 offsets. Owned here now (moved from
  glb-thin), since the shared core needs them.
- `indexCells(occupancy) → Map("i,j,k"→n)` — the same `"i,j,k"→n` index used everywhere; lives with the core.

Public:

```
componentLabels(occupancy, { connectivity = 6 } = {})
  → { labels: Int32Array(count), sizes: number[] /* label order */, count: number /* #components */ }
```
- Validates `connectivity ∈ {6,26}` (same error text shape as today's `connectedComponents`).
- Iterative DFS over `indexCells`; assigns a label per occupied cell into `labels` (occupiedCells order);
  pushes each component's size into `sizes` in discovery (label) order.
- `count === sizes.length`. Empty occupancy → `{labels:Int32Array(0), sizes:[], count:0}`.
- PURE, deterministic (discovery order = occupiedCells order).

```
strayVoxelStats(occupancy, { connectivity = 6 } = {})
  → { components, largestCount, largestFraction, strayCount, subFloorCount }
```
- `{labels,sizes,count:nComp} = componentLabels(occupancy,{connectivity})`; `total = occupancy.count`.
- `total === 0` → `{components:0, largestCount:0, largestFraction:0, strayCount:0, subFloorCount:0}`.
- `largest` = argmax over `sizes`, **lowest index on ties**.
- One linear pass over `occupiedCells` (zipped with `labels`): track `largestMinJ` (min `j` where
  `label===largest`); then a second linear pass tallies `subFloorCount` = #cells with `label!==largest && j <
  largestMinJ`. (Two cheap passes, or fold into one after `largestMinJ` is known — implementation detail.)
- Returns numbers raw (the runner rounds for display).

Default connectivity **6** (AC: face-adjacency).

---

## `src/form/glb-thin.mjs` (edit)

- Remove the local `connectedComponents` body + the local `FACE_DIRS`/`BOX_DIRS`/`indexCells` **iff** they are
  used *only* by `connectedComponents`. If `denoise`/thinning use the local `indexCells`/dirs, keep those and
  only re-point `connectedComponents`. (Verify usage before deleting — minimize the edit.)
- `import { componentLabels } from "./voxel-components.mjs";`
- New body:
  ```
  export function connectedComponents(occupancy, { connectivity = 26 } = {}) {
    const { sizes } = componentLabels(occupancy, { connectivity });
    return { count: sizes.length, sizes: [...sizes].sort((a,b) => b - a) };
  }
  ```
- Public signature, default `connectivity=26`, return `{count, sizes desc}` — all unchanged. Existing
  glb-thin tests stay green.

**Cycle check:** `voxel-components` imports only `occupiedCells` (from `glb-voxelize`); `glb-thin` imports
`componentLabels` (from `voxel-components`) plus its existing `glb-voxelize`/`glb-mesh`. No cycle.

---

## `src/form/material-clean.mjs` (edit) — `speckleScore` only

Replace the body of `speckleScore(occupancy, keys)` (line ~151) with the local-outvote rule (Design D2). Keep:
- the exported name, params `(occupancy, keys)`, `[0,1]` return, the JSDoc updated to describe fragmentation.
- it still uses the file's existing private `indexCells` + `occupiedCells` (no new import).
- Re-export through `material-segment.mjs` is untouched (still `export { speckleScore }`).

Algorithm: per cell, build a small `Map` tally seeded with `{ownKey:1}`, add each of the 6 face-neighbours
that are occupied; if any other key's count `> ownCount`, it's a speck; `denom` counts only cells with ≥1
occupied neighbour. `denom===0 → 0`.

---

## Tests

### `src/form/voxel-components.test.mjs` (new) — pure, hand-built occupancies via a local `makeOcc`
(mirrors the `makeOcc(dims, cells)` fixture in `material-clean.test.mjs`).

- **solid mass → fraction 1**: a 3×3×3 full block → `components 1, largestFraction 1, strayCount 0,
  subFloorCount 0`.
- **single floating island → stray**: one big block + one detached cell (gap ≥1) → `components 2,
  largestFraction < 1, strayCount === island size`.
- **sub-floor island**: main mass at `j≥2`, a detached cell at `j=0` → `subFloorCount === 1`; and a detached
  cell *above* the mass → `subFloorCount === 0` (asserts "below", not just "disconnected").
- **componentLabels basics**: labels length === count, `sizes` sums to count, `count` matches; `connectivity
  6 vs 26` differs on a diagonal-only contact pair (6 → 2 comps, 26 → 1).
- **empty occupancy** → all-zero struct, no throw.
- **delegation parity**: `connectedComponents(occ,{connectivity}).sizes` equals
  `componentLabels(...).sizes` sorted desc (one regression guard that glb-thin still agrees).

### `src/form/material-clean.test.mjs` (edit) — replace the `speckleScore` direct-value test (117–123)

New `speckleScore` block:
- **2-region clean block → ≈0**: a 4×2×1 (or 4×4×1) block, left half `red`, right half `blue` →
  `speckleScore === 0` (NOT penalized for the boundary). *This is the AC's headline case.*
- **checkerboard → high**: alternating `red`/`blue` on a filled 4×4×1 grid → `speckleScore` near 1 (assert
  `> 0.9`).
- **single speck → counted**: 3×3×1 red with a blue center → speck fraction `1/9` (assert `> 0`).
- **solid/uniform → 0** and **lone cell → 0**: keep (uniform → 0; single isolated cell, denom 0 → 0).
- Drop the `[red,blue] → 1` assertion (now 0 by the corrected semantics).

The denoise test (90–105) is unaffected (its assertions are `before > after` and `after === 0`, both still
true). Verify `material-segment.test.mjs` relative assertions still pass (no edit expected).

---

## `benchmarks/sculpture/cleanliness-baseline.mjs` (new)

House-style runner header (offline; reconstructs occupancy from committed artifacts; before-baseline for
E-19). Imports: `SUBJECTS` from `glb-voxel-breadth.mjs`; `speckleScore` from `material-clean.mjs` (or its
re-export); `strayVoxelStats` from `voxel-components.mjs`; `node:fs/promises`, path helpers.

- `occupancyFromArtifact(artifact) → { occupancy, keys }` — local. Reads `placements[].pos` → cells
  `[i,j,k]` (offset-shifted, fine), `count = placements.length`, `dims` from coord extents+1, builds the
  flat `occupied` Int32Array in placement order; `keys` = bare blocks. (Translation-invariant for both
  metrics; `j` is exact.)
- `scoreBuild(dir, subjKey) → cell | null` — read `<dir>/<subjKey>/artifact.json`; null if absent (AC-style
  graceful skip + note). Returns `{ speckle, components, largestFraction, strayCount, subFloorCount,
  distinct }` (distinct = manifest length, for context), all `round3`'d where fractional.
- `main()` — for each subject, score R1/R2/E18; assemble rows; write `cleanliness-baseline.json`
  (`{ generatedAt:null-stamped-by-caller?, metrics:{…definitions…}, scale, rows }`) and a `.md` table
  (subject × build, columns: speckle, comp, largest-frac, stray, sub-floor). Print a one-line per-subject
  summary to stderr. `Date.now()` is fine here (a benchmark script, not src), but timestamp may be omitted to
  keep the artifact diff-stable — **omit it** (deterministic output).

Run once to generate the two artifacts; commit all three.

---

## Ordering of changes (atomic-commit friendly)

1. `voxel-components.mjs` + its test (new core, self-contained).
2. Re-point `glb-thin.connectedComponents` to the core (+ verify glb-thin tests).
3. Rewrite `speckleScore` + update `material-clean.test.mjs`.
4. `cleanliness-baseline.mjs`; run it; commit runner + generated `.md`/`.json`.

Each step is independently `npm test`-greenable (step 4 adds no tests but must not break the suite).
