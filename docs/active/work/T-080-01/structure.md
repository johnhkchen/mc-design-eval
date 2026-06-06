# Structure — T-080-01 hollow-the-mass

File-level blueprint. Not code — the shape of the code. Ordering matters where noted.

## Files

### Created — `src/view/hollow-carve.mjs` (PURE)

The deterministic carve core. No GL, no model, no I/O, no Date/random → runs under `src/**/*.test.mjs`.
Imports: `enclosedMassKeys` from `./surface-coherence.mjs`, `footprint` from `./structural-read.mjs`,
`projectSurface`, `ORTHO_DIRS` from `./surface-grid.mjs`, `occupancyFromCells` from `./occupancy.mjs`,
`expandArtifact`, `voxelKey` from `../expand.mjs`.

Public interface:

```
export const HOLLOW_SCHEMA = "hollow-carve/v1"

// --- marking the removable mass (AC #1) ---
cornerPostKeys(occ) -> Set<string>
  // every voxel key in the 4 footprint-bbox-corner (x,z) columns. PURE.

tallColumnKeys(occ, { minSpanFrac = 0.9 } = {}) -> Set<string>
  // every voxel key in columns whose occupied y-extent >= minSpanFrac * buildHeight
  // (chimney shaft + floor-to-roof posts). PURE.

markHollowable(occ, { keep, regions, inset = 1 } = {})
  -> { remove: Set<string>, removeCount, enclosed, protectedCount, perBand:[{yStart,yEnd,removed}] }
  // base = enclosedMassKeys(occ) eroded (inset-1) times; restrict to region y-bands if `regions`;
  // subtract `keep`. perBand bins removed count by storey band (reuses storeyBands via opts? -> no:
  // bin by the regions if given, else a single band). PURE.

// --- the carve (AC #2) ---
carveArtifact(artifact, remove) -> artifact'
  // flatten-by-exclusion: expandArtifact -> drop keys in `remove` -> re-emit kept cells as
  // {op:"voxel", pos, block, [state]}. Shallow-clones the artifact, replaces placements. PURE.

carveOccupancy(occ, remove) -> Occupancy
  // occupancyFromCells of occ.cells minus `remove`. For measurement without a re-expand. PURE.

// --- proofs (AC #3, #4) ---
cavityReport(occ, remove) -> { before, removed, after }   // block counts. PURE.

exteriorSurfaceDigest(occ) -> string
  // stable join over ORTHO_DIRS of each filled surface cell "dir|x,y,z=block", sorted. PURE.

exteriorHeld(beforeOcc, afterOcc) -> { held:boolean, digestBefore, digestAfter }
  // held === digests equal. The exterior-render-unchanged proof. PURE.
```

Internal helpers (not exported): `erodeKeys(occ, keys, steps)` (morphological erosion via the 6-neighbour
rule), `columnExtents(occ)` (per-(x,z) min/max occupied y, shared by tallColumnKeys/perBand binning),
`toVoxelPlacement(voxel)`.

### Created — `src/view/hollow-carve.test.mjs` (PURE)

Synthetic-occupancy unit tests. Mirrors `surface-coherence.test.mjs` shape (`solidBox`, `hollowBox`
helpers, a source-guard test). Pins every AC clause — see `plan.md` for the list.

### Created — `benchmarks/sculpture/hollow-cottage.mjs` (METERED / GL)

The impure runner. Mirrors `benchmarks/sculpture/surface-coherence.mjs`:
1. Load the **sealed** cottage `docs/active/work/T-084-01/cottage-sealed-artifact.json` (the watertight-
   shell precondition). Fallback: if absent, load `concept-materials/cottage/after-artifact.json` and run
   `sealRoof`+`sealWalls` first (note in the log).
2. `artifactOccupancy` → `structuralRead` → pure priors (`hollowableCore`).
3. Render BEFORE views (`threeQuarter`, `front`, `top`) via `renderViews`.
4. METERED light-tier detector: `buildHollowablePrompt` + `runTieredOp({tier:HOLLOW_TIER, images:[3q]})`
   + `parseHollowable` → `{hollowable, regions, blockers}`. Log seal-before-hollow if blockers.
5. `watertightCheck` (skin watertightness, recorded honestly).
6. PURE carve: `keep = cornerPostKeys ∪ tallColumnKeys`; `markHollowable(occ, {keep, regions, inset})`
   using the detector's regions/inset when `hollowable` and no blockers, else the geometric default.
   `carveArtifact` → sealed-hollow artifact.
7. `exteriorHeld(occ, carvedOcc)` (the proof) + `cavityReport`.
8. Render AFTER the same 3 views. Assert/record `exteriorHeld.held === true`.
9. Write `hollow-cottage-artifact.json`, `hollow-report.json`, `view-before-*.png`, `view-after-*.png` to
   `docs/active/work/T-080-01/`.

Imports the model/GL edge only here (`multi-angle.renderViews`, `model-tier.runTieredOp`,
`sdk-binding.requestTextWithImage`) — never in the pure module.

### Modified — `src/view/surface-coherence.mjs`

One change: `function enclosedMassKeys` → `export function enclosedMassKeys`. Additive; the JSDoc already
describes it as "mirrors hollowableCore's rule … returns the KEYS so the watertight flood … treat them as
the simulated cavity." No behaviour change. `watertightCheck` keeps using it unchanged.

### Modified — `src/view/surface-coherence.test.mjs`

Add one test asserting `enclosedMassKeys` returns the all-6-neighbours set on a small synthetic box
(pins the now-public contract so the carve's reuse can't silently drift).

### Modified — `package.json`

Add `"hollow:cottage": "node benchmarks/sculpture/hollow-cottage.mjs"` next to `coherence:cottage`.

### Created (run artifacts) — `docs/active/work/T-080-01/`

`research.md`, `design.md`, `structure.md`, `plan.md`, `progress.md`, `review.md`,
`hollow-cottage-artifact.json`, `hollow-report.json`, `view-{before,after}-{threeQuarter,front,top}.png`.

## Module boundaries & invariants

- **Pure ↔ impure seam** is the file boundary: `src/view/hollow-carve.mjs` (pure) vs
  `benchmarks/sculpture/hollow-cottage.mjs` (GL + metered). Pinned by a source-guard test (no model / GL /
  `ANTHROPIC_API_KEY` import in the pure module).
- **One enclosed-mass definition.** `hollow-carve` imports `enclosedMassKeys`; it never re-derives the
  6-neighbour loop.
- **No air op.** `carveArtifact` only omits + copies; it never appends an `air` voxel and never deletes
  in-place. Re-expansion of the kept cells is byte-identical to the original kept cells.
- **Exterior-safety is structural, not checked-after-the-fact.** Removable ⊆ enclosed ⊆ non-skin, so the
  ortho surface projections are provably invariant; `exteriorHeld` verifies the invariant held rather than
  *making* it hold.

## Ordering of changes

1. Export `enclosedMassKeys` (+ its test) — unblocks the import.
2. `hollow-carve.mjs` pure core + tests (commit when green).
3. `package.json` script + `hollow-cottage.mjs` runner.
4. Live run → artifacts → progress/review.

Steps 1–2 are independently verifiable by `npm test`; step 3 is the metered/GL run.
