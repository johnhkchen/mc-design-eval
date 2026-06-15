# T-062-01 — Progress: cleanliness metrics

Status: **complete.** All four implementation steps landed; `npm test` green (617, up from 608).

## Steps

### Step 1 — Shared component core + stray metric ✅
- New `src/form/voxel-components.mjs`: `componentLabels(occupancy,{connectivity=6})` (the shared flood-fill
  core, returns `{labels, sizes, count}`) and `strayVoxelStats(occupancy,{connectivity=6})` →
  `{components, largestCount, largestFraction, strayCount, subFloorCount}`.
- New `src/form/voxel-components.test.mjs` (10 tests): solid→fraction 1; floating island→stray, fraction<1;
  multi-cell island; sub-floor below/above; empty→all-zero; label/size invariants; 6-vs-26 on a diagonal
  pair; bad-connectivity throw; delegation parity.

### Step 2 — `connectedComponents` delegates ✅
- `glb-thin.mjs`: `connectedComponents` now calls `componentLabels` and re-shapes to `{count, sizes desc}` —
  same public signature/default (26). Removed the file's now-dead local `indexCells`/`FACE_DIRS`/`BOX_DIRS`
  (used only by the old body) and the now-unused `occupiedCells` import. One flood fill, two consumers.
- Existing `glb-thin.test.mjs` is the regression guard (green).

Steps 1+2 committed together: `feat(E-19 T-062-01): stray-voxel + component metric; connectedComponents
delegates to shared core`.

### Step 3 — `speckleScore` fragmentation rewrite ✅
- `material-clean.mjs`: rewrote `speckleScore` to the **local-outvote** rule — a cell is a speck iff some
  other block strictly outnumbers its own among `{self} ∪ {6 face-neighbours}`; score = specks / (cells with
  ≥1 neighbour). Signature/range/`[0,1]` unchanged; re-export through `material-segment.mjs` untouched.
- `material-clean.test.mjs`: replaced the old `[red,blue]→1` direct-value test with fragmentation cases —
  clean 2-region block → 0, checkerboard → >0.9, single speck → exactly 1/9, uniform → 0, lone → 0.
- Verified the relative speckle assertions in `material-segment.test.mjs` (hard ≤ soft, seg ≤ naive, < 0.5)
  still hold under the new semantics. Commit: `fix(E-19 T-062-01): speckleScore measures fragmentation, not
  region boundaries`.

### Step 4 — Before-baseline ✅
- New `benchmarks/sculpture/cleanliness-baseline.mjs` — fully offline. Reconstructs `{occupancy, keys}` from
  each committed `artifact.json`'s placements (`occupancyFromArtifact`; translation-invariant, `j` exact),
  scores R1/glb-voxel, R2/glb-voxel-clean, E18/e18-build on the fixed metrics. Deterministic output (no
  timestamp). Ran it → committed `cleanliness-baseline.{md,json}` (7 subjects × 3 builds). Commit: `chore(...)
  cleanliness before-baseline`.

## Deviations from plan
- **None of substance.** Steps 1 and 2 were committed as a single commit (the delegation is meaningless
  without the core, and both are small) rather than two — the plan's atomic boundary was preserved logically.
- `subFloorCount` is **0 across all current builds**: the committed islands sit beside/around the main mass,
  not strictly beneath its floor, so the stricter sub-floor diagnostic isn't triggered. `strayCount` captures
  them. This is faithful, not a bug — sub-floor is a tighter signal kept for the moai-style under-floor
  debris case.

## Baseline findings (recorded, not acted on — that's the rest of E-19)
- **moai** carries the cited duplicate-mass signature: R1/R2 = 6 components, largestFraction 0.52, 2023 stray
  cells. E18 (thin+seg) is *not* cleaner structurally — 3 components, fraction 0.519, **2912** stray — which
  lines up with the known 3-view-contact-sheet TRELLIS multi-statue hallucination. A real E-19 target.
- **bow-and-arrow** R1/R2: 21 components, largestFraction 0.277 (badly fragmented thin subject); **E18
  consolidates it to a single solid mass** (fraction 1.0, 0 stray) — thin voxelization + segment wins here.
- pineapple/heart/mushroom/koi: small stray fractions in R1/R2 (45/80/19/53 cells), all → **fraction 1.0**
  under E18.
- New speckle confirms the fix: E18 speckle is at/near 0 (clean regions no longer penalized for boundaries);
  moai E18 = 0.0 exactly.

## AC coverage
1. stray-voxel/component metric (count + largest-fraction + sub-floor) pure in `src/form/` — ✅
   `strayVoxelStats`.
2. `speckleScore` fixed to fragmentation; old signature/shape kept — ✅.
3. unit tests (2-region→0, checkerboard→high, island→stray fraction<1, solid→fraction 1) — ✅.
4. E-18 builds re-scored as before-baseline at `benchmarks/sculpture/cleanliness-baseline.{md,json}` — ✅.
5. `npm test` green — ✅ (617).
