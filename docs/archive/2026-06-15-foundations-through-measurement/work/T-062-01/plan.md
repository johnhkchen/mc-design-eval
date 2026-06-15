# T-062-01 — Plan: cleanliness metrics

Ordered, independently-verifiable steps. Each ends `npm test`-green and commits atomically. Baseline suite =
608 tests (E-18 close). Testing strategy: pure unit tests on hand-built occupancies (no GL/GLB/network); the
benchmark is a generated artifact, not a test.

---

## Step 1 — Shared component core + stray metric (`voxel-components.mjs`)

**Do:**
- Create `src/form/voxel-components.mjs`: house header; `import { occupiedCells } from "./glb-voxelize.mjs"`.
- Module-private `FACE_DIRS` (6), `BOX_DIRS` (26), `indexCells(occupancy)`.
- `componentLabels(occupancy, {connectivity=6})` — validate connectivity ∈ {6,26}; iterative DFS; return
  `{labels:Int32Array(count), sizes (label order), count}`. Empty → `{Int32Array(0), [], 0}`.
- `strayVoxelStats(occupancy, {connectivity=6})` — derive `{components, largestCount, largestFraction,
  strayCount, subFloorCount}`; lowest-index tie-break for largest; `subFloorCount` = non-largest cells with
  `j < largestMinJ`. Empty → all-zero.

**Test (`voxel-components.test.mjs`):** solid mass → fraction 1; single floating island → comps 2,
fraction<1, stray===islandSize; sub-floor below → 1, above → 0; connectivity 6 vs 26 on a diagonal pair;
empty → all-zero; `componentLabels` length/sum invariants.

**Verify:** `node --test src/form/voxel-components.test.mjs` green.
**Commit:** `feat(E-19 T-062-01): stray-voxel + component metric (voxel-components.mjs)`

---

## Step 2 — Re-point `connectedComponents` to the shared core

**Do:**
- In `glb-thin.mjs`: `import { componentLabels } from "./voxel-components.mjs"`. Replace
  `connectedComponents` body with the delegating adapter (`{count, sizes: [...].sort(desc)}`), default
  `connectivity=26` preserved.
- Remove glb-thin's now-dead `FACE_DIRS`/`BOX_DIRS`/local DFS **only if** unused elsewhere in the file; keep
  any dir/index helper still used by other glb-thin functions (grep first — minimize the edit).

**Test:** no new tests; existing `glb-thin.test.mjs` is the regression guard. Add one parity assertion in
`voxel-components.test.mjs`: `connectedComponents(occ,{c}).sizes === componentLabels(occ,{c}).sizes` desc.

**Verify:** `node --test src/form/glb-thin.test.mjs src/form/voxel-components.test.mjs` green.
**Commit:** `refactor(E-19 T-062-01): connectedComponents delegates to componentLabels (one flood fill)`

---

## Step 3 — Fix `speckleScore` (fragmentation, not boundaries)

**Do:**
- Rewrite `speckleScore(occupancy, keys)` body in `material-clean.mjs` to the local-outvote rule: per
  occupied cell with ≥1 occupied face-neighbour, tally `{own:1}+neighbours`; speck iff some other key's count
  `> own`; return `specks/denom` (denom = cells with ≥1 neighbour; 0 → 0). Update JSDoc to "fragmentation".
- Edit `material-clean.test.mjs`: replace the `speckleScore: adjacent differing cells = 1.0 …` test with:
  2-region clean block → 0; checkerboard → >0.9; single speck (3×3, blue center) → ≈1/9 (>0); uniform → 0;
  lone cell → 0.

**Test/Verify:** `node --test src/form/material-clean.test.mjs src/form/material-segment.test.mjs` green
(segment relative assertions must still hold — confirm `hard ≤ soft`, `seg ≤ naive`, `< 0.5`). Then full
`npm test` green (count = 608 − 1 removed direct assert + new asserts; suite still passes).
**Commit:** `fix(E-19 T-062-01): speckleScore measures fragmentation, not region boundaries`

---

## Step 4 — Before-baseline runner + generated artifacts

**Do:**
- Create `benchmarks/sculpture/cleanliness-baseline.mjs`: `occupancyFromArtifact`, `scoreBuild`, `main`.
  Reads `glb-voxel/`, `glb-voxel-clean/`, `e18-build/` artifacts per subject; computes new speckle +
  strayVoxelStats; absent artifact → null cell + note. Writes `cleanliness-baseline.{md,json}` (no timestamp
  → deterministic). Pure read, no GL/decode.
- Run: `node benchmarks/sculpture/cleanliness-baseline.mjs`. Confirm all 7 subjects × 3 builds scored,
  moai shows `components > 1` / `largestFraction < 1` (the duplicate-mass signature the ticket cites) if the
  committed artifact carries it; record whatever the data actually says.

**Verify:** the two artifacts exist and parse; `npm test` still green (runner adds no tests but must not
break import-time). Sanity-eyeball the `.md` table.
**Commit:** `chore(E-19 T-062-01): cleanliness before-baseline (re-score R1/R2/E18 on fixed metrics)`

---

## Step 5 — Progress + review artifacts

- Update `progress.md` after each step (what landed, deviations).
- Write `review.md` (files changed, test coverage, open concerns) — final.
- No code commit needed for docs unless the repo commits work artifacts (it does — sibling tickets commit
  `docs/active/work/<id>/`). Commit docs with the relevant step or a trailing docs commit.

---

## Testing strategy summary

| What | How | Where |
|---|---|---|
| `componentLabels` | hand occupancies, label/size invariants, 6-vs-26 | `voxel-components.test.mjs` |
| `strayVoxelStats` | solid→1, island→stray, sub-floor below/above, empty | `voxel-components.test.mjs` |
| delegation parity | `connectedComponents` vs core | `voxel-components.test.mjs` |
| `connectedComponents` unchanged | existing suite | `glb-thin.test.mjs` |
| `speckleScore` fragmentation | 2-region→0, checker→high, speck→>0, uniform/lone→0 | `material-clean.test.mjs` |
| relative speckle monotonicity | unchanged assertions stay green | `material-segment.test.mjs` |
| before-baseline | generated, eyeballed (not a unit test) | `cleanliness-baseline.{md,json}` |

## Risks / watch-items

- **glb-thin edit scope creep** — grep before deleting any helper; only `connectedComponents` should change.
- **Segment relative assertions** — the new speckle is fraction-of-cells not pairs; re-confirm `hard ≤ soft`
  etc. hold (they should, both move the same direction). If any flips, it's a real signal — investigate, do
  not paper over.
- **`occupancyFromArtifact` correctness** — dims from coord extents; a build whose every cell is stray would
  still reconstruct fine (adjacency is translation-invariant). Verify count === placements.length.
