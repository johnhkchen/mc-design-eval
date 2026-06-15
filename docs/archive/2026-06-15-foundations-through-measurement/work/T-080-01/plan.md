# Plan — T-080-01 hollow-the-mass

Ordered, independently-verifiable steps. Each commits atomically. Testing strategy inline.

## Step 1 — Export `enclosedMassKeys` (the shared definition)

- `src/view/surface-coherence.mjs`: `function enclosedMassKeys` → `export function enclosedMassKeys`.
- `src/view/surface-coherence.test.mjs`: add `enclosedMassKeys` to the import; one test — on a 3×3×3 solid
  box the only enclosed cell is the centre `(1,1,1)`; on a 2×2×2 box the set is empty.
- **Verify:** `npm test` green. Commit `feat(E-23 T-080-01): export enclosedMassKeys as the shared rule`.

## Step 2 — `hollow-carve.mjs` pure core + tests

Write `src/view/hollow-carve.mjs` (interfaces per `structure.md`) and `src/view/hollow-carve.test.mjs`.

### Test matrix (synthetic occupancy — pins every AC clause)

**`markHollowable` / marking (AC #1):**
- Solid 5×5×5 box → enclosed = the inner 3×3×3 = 27 cells; `markHollowable` with no keep removes exactly
  those 27; every removed key is NOT a skin cell.
- `inset:2` on the 5×5×5 → erodes once → only the centre `(2,2,2)` survives erosion → removeCount 1.
- `regions:[{yStart,yEnd}]` restricts removal to that y-band (cells outside the band are kept).

**Carve preserves skin / removes enclosed / keeps structure (AC #2):**
- Solid box → `carveArtifact(art, remove)` → re-`artifactOccupancy`: **skin cells survive** (all 6 face
  layers present), **enclosed cells removed** (centre gone), `after.size === before - removeCount`.
- **Structure retained:** pass an explicit `keep` containing an interior column; assert those keys survive
  even though enclosed.
- `cornerPostKeys`: on a solid box the 4 corner columns are returned; carving with `keep=cornerPostKeys`
  retains them.
- `tallColumnKeys`: a synthetic build with one full-height interior post + a short interior blob → the post
  column is returned, the blob is not; `minSpanFrac` boundary respected.

**Carve is flatten-by-exclusion / no air op:**
- `carveArtifact` output placements are all `op:"voxel"`; no `minecraft:air`; kept voxels' blocks/state
  copied exactly (a stateful voxel keeps its `state`).
- Re-`expandArtifact(carved)` of the kept set is byte-identical to the original minus removed (same blocks
  per pos).

**Exterior-held proof (AC #3, #4):**
- `exteriorSurfaceDigest(before) === exteriorSurfaceDigest(after)` after carving a solid box's interior;
  `exteriorHeld(...).held === true`.
- Negative control: a carve that (artificially) removes a *skin* cell flips `held` to false — proves the
  digest actually discriminates (use a hand-built remove set including a skin key).
- `cavityReport` arithmetic: `{before, removed, after}` consistent with `occ.size`.

**Purity / source guard:**
- `hollow-carve.mjs` source contains no `ANTHROPIC_API_KEY`, no `render`, no model import (mirrors
  `surface-coherence.test.mjs`'s guard).

- **Verify:** `npm test` green (new tests + the existing ~916 still pass). Commit
  `feat(E-23 T-080-01): hollow-carve pure ops (mark, carve, exterior-held proof)`.

## Step 3 — package.json script + metered/GL runner

- `package.json`: add `hollow:cottage`.
- `benchmarks/sculpture/hollow-cottage.mjs` per `structure.md` step list. Loads the **sealed** cottage
  (T-084 output); runs the light hollowable detector (metered); pure carve with
  `keep = cornerPostKeys ∪ tallColumnKeys` and the detector's `regions`/`inset`; proves exterior-held;
  renders before/after; writes the hollow artifact + `hollow-report.json` + PNGs.
- **Verify:** `npm test` still green (runner is excluded from the glob). Commit
  `feat(E-23 T-080-01): hollow-cottage runner + npm script`.

## Step 4 — Live run + artifacts

- `npm run hollow:cottage`. Expect (sealed cottage): ~1100 enclosed cells, a few hundred protected by
  structure, the rest carved; `exteriorHeld.held === true`; before/after PNGs visually identical.
- Record block-count before/after + cavity size + exterior-held digests + watertight before/after in
  `hollow-report.json`.
- **Verify:** open `hollow-report.json`; confirm `exteriorHeld.held === true` and `cavity.removed > 0`;
  eyeball `view-before-threeQuarter.png` vs `view-after-threeQuarter.png` (must be identical — the hollow
  is invisible from outside). Commit `feat(E-23 T-080-01): live cottage hollow run + artifacts`.

## Step 5 — Review

- Write `progress.md` (what was done, any deviations) and `review.md` (the handoff: files, AC mapping, test
  coverage, open concerns). Commit `docs(E-23 T-080-01): progress + review handoff`.

## Testing strategy summary

- **Unit (pure, in `npm test`):** all marking, carve, structure-keep, exterior-digest, and no-air-op
  invariants on synthetic occupancy — the AC's "Pure, unit-tested on synthetic occupancy (skin cells
  survive; enclosed cells removed; structure retained)".
- **Integration (metered/GL, `npm run hollow:cottage`):** the live detector + the real cottage + before/
  after renders + the exterior-held assertion on a real build — the AC's "re-render the exterior post-carve
  and confirm the resemblance verdict does not regress" and "record block count before/after".
- **Not unit-tested (by design):** the `claude -p` detector call and the GL render — metered/GL, same
  boundary excluded from the glob as `surface-coherence.mjs`'s runner. Covered by the round-trip run.

## Risks / mitigations

- *Detector returns `hollowable:false` or blockers.* → The sealed cottage has 0 skin holes; if the model
  still flags, the runner logs "seal first" and carves the geometric enclosed mass anyway (exterior-safe).
- *GL render unavailable in this environment.* → The exterior-held **proof is pure** (digest equality); the
  render is confirmation. If `renderViews` fails, the pure proof + report still satisfy AC #3/#4; note it.
- *Over-protecting structure on the cottage* (tallColumnKeys keeping too much) → report `protectedCount`;
  tune `minSpanFrac` so the cavity is non-trivial; corner posts alone are the floor.
