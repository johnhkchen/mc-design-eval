# T-058-01 — Plan: ordered, verifiable steps

Five steps, each committable. Steps 1–3 land the pure core + tests (verified by `npm test`). Steps 4–5
land the GL/host runner and the 7-subject sweep (verified by running the runner; not in `npm test`, the
established split). Verification criteria are concrete per step.

## Step 1 — Palette + region growth + absorption (pure core, part A)

**Do.** Create `src/form/material-segment.mjs` with the header comment, imports, `SEG_DEFAULTS`,
`MATERIAL_SEG_STYLE`, and:
- `indexCells` (internal), `paletteKeySet` (internal), `cellLabs(colors)`.
- `growRegions(occupancy, labs, {growDE, neighbourhood})` — BFS connected components, 6-neighbour,
  join when `deltaE ≤ growDE`. Returns `{ labelOf:Int32Array, regions:[{label, cells:int[]}] }`.
- `regionStats(region, labs)` — Lab bbox (`min/max/mean/spread`).
- `absorbSmallRegions(state, occupancy, labs, {minRegion})` — merge `count<minRegion` regions into the
  nearest-mean-Lab 6-adjacent region; smallest-first; deterministic tie-break. Returns relabelled state.

**Verify.** `node -e` smoke: a hand-built 3×3 occupancy with two colour halves → 2 regions; a uniform
field with one off cell → after absorb, 1 region. No test runner yet (added Step 3) — smoke only.

**Commit.** `feat(E-18 T-058-01): region growth + small-region absorption (segment core A)`

## Step 2 — Region fill, gradient banding, metrics, top-level entry (pure core, part B)

**Do.** Add to `material-segment.mjs`:
- `gradientAxis(region, occupancy, labs)` — argmax abs Pearson(coord, L*); degenerate → 1.
- `BAYER4` constant + `orderedDither(a, b, frac)`.
- `bandRegion(region, occupancy, labs, palette)` — ordered steps by L*; per-cell `p→s→base/frac→dither`.
- `fillRegion(region, occupancy, labs, palette, {gradDE})` — flat→one block, else `bandRegion`.
- `applyPaletteTexture(occupancy, keys, palette, opts)` — E-11 ∩ palette (optional).
- `offPaletteCount(keys, palette)`.
- `segmentMaterials(build, opts)` — full pipeline → keys → `keysToArtifact`. Re-export `speckleScore`
  (imported) so the runner has one import site.
- `segmentMaterialsGlb(glb, {scale, decodeTexture, …})` — injected-impurity wrapper.

**Verify.** `node -e` smoke: a 1×16 gradient column → keys form a monotonic non-decreasing staircase;
`offPaletteCount==0`; `assertArtifact(segmentMaterials(syntheticBuild))` does not throw.

**Commit.** `feat(E-18 T-058-01): gradient band/dither + region fill + segmentMaterials entry`

## Step 3 — Unit tests (the AC's offline assertions)

**Do.** Create `src/form/material-segment.test.mjs` mirroring `material-clean.test.mjs` fixtures
(`makeOcc`, `atlasRow`, `makeLabs`). Cover (structure.md list): growRegions, absorbSmallRegions, flat
fill (one block), **gradient band** (monotonic staircase, adjacent cells differ ≤1 step, distinct ≤
palette), orderedDither determinism, palette discipline (off-palette 0, distinct ≤ palette), speckle
drop vs naive R1 snap, end-to-end `segmentMaterials` (AJV-valid, style, one placement/cell, manifest ≤
palette), applyPaletteTexture stays in palette, determinism (deep-equal on repeat).

**Verify.** `npm test` green (artifact validation + `node --test "src/**/*.test.mjs"`, all suites
including the new one). This is the AC "`npm test` green" gate and the unit-tested-on-synthetic AC.

**Commit.** `test(E-18 T-058-01): segment core — regions, gradient band, palette discipline`

## Step 4 — The GL/host sweep runner

**Do.** Create `benchmarks/sculpture/glb-voxel-seg.mjs` cloning `glb-voxel-clean.mjs`: `decodeTexture`
(dwebp), `judgeIoU`, `SUBJECTS` import, `runSeg()`/`buildSeg()`/`emit()`/`regenerateOffline()`/`main()`.
Before-baseline = committed R2 (`glb-voxel-clean/<subject>/{artifact,summary}.json`); after =
`segmentMaterials`. Per-subject `summary.json` records distinct/speckle/off-palette/formIoU before&after +
paletteSize + regionCount. Roll-up `seg.{md,json}`.

**Verify.** Lint-run a single subject live: `node benchmarks/sculpture/glb-voxel-seg.mjs 32` reaches at
least one subject's render + summary without throwing; `assertArtifact` passes inside the runner.

**Commit.** `feat(E-18 T-058-01): glb-voxel-seg sweep runner (R-seg vs R2 before/after)`

## Step 5 — Run the 7-subject sweep, write outputs, confirm the directives

**Do.** Run `node benchmarks/sculpture/glb-voxel-seg.mjs 32` for all 7 subjects (scale parity with the
committed R2 sweep). Write `glb-voxel-seg/<subject>/{artifact.json, render-3q.png, summary.json}` and
`glb-voxel-seg/seg.{md,json}`. Inspect renders (not block counts — see memory: inspect renders).

**Verify (the ACs):**
- off-palette = 0 for every subject (after); distinct-block ≈ palette size and a large drop vs R2.
- speckle drops on the noisy ones (heart, koi) and does not rise elsewhere.
- form IoU not harmed (within GL-rounding of R2).
- renders read as coherent regions / banded gradients, not scatter.
Record the before/after numbers in `progress.md` and `review.md`. If a default tunable misbehaves
(e.g. growDE merges a real boundary, or a gradient flattens), adjust `SEG_DEFAULTS`, note the deviation
in `progress.md`, re-run, re-commit.

**Commit.** `chore(E-18 T-058-01): R-seg 7-subject sweep — seg.{md,json} + per-subject artifacts/renders`
(renders gitignored per repo convention; tables + summaries committed).

## Testing strategy (what is tested how)

- **Unit (pure, in `npm test`)** — every algorithmic claim: region growth, absorption, flat fill,
  gradient monotonicity/≤2-block transition, ordered-dither determinism, palette discipline, speckle
  drop, AJV round-trip, determinism. Synthetic occupancy + atlas; no GL/WebP/GLB.
- **Integration (manual, GL/host, not in CI)** — the 7-subject sweep: real GLBs, dwebp decode, render,
  silhouette IoU, the before/after roll-up. Verified by running the runner; outputs inspected visually.
- **Regression guard** — R2 left untouched; its suite and the rest of `src/**/*.test.mjs` must stay green.

## Risks & mitigations

- **growDE too high → merges a real material boundary** (under-segmentation). Mitigate: start at 10,
  inspect renders; the absorb step only touches *small* regions so it won't fuse two large ones.
- **gradient axis ill-defined on a blobby region** → falls back to height (j); acceptable, banding still
  monotonic along that axis.
- **Bayer dither on a 1-wide test column** must collapse to a hard staircase (perpendicular coords
  constant) — asserted directly so the monotonicity AC is deterministic.
- **Sibling-root collision** — only new files touched; `glb-voxelize.mjs` consumed read-only.
