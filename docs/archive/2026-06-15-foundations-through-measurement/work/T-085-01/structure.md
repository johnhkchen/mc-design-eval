# T-085-01 zone-fill-dominant — Structure

File-level blueprint. Two new files, one modified runner, regenerated benchmark records. No deletions.

## 1. NEW `src/view/zone-fill.mjs` — the pure core

Header contract (mirrors the sibling cores): deterministic zone-fill of the dominant material — the
**base coat** (T-085-01, story S-085, epic E-24). PURE — no GL, no I/O, no Date/random. Imports only
`bareBlock` (occupancy.mjs) and `projectSurface` (surface-grid.mjs).

Public interface:

```js
/** The five exposed faces of the visible skin (the four elevations + the roof). */
export const FILL_FACES = ["+x", "-x", "+z", "-z", "+y"];

/**
 * zoneFill(occ, { zoneOf, zones, faces?, minRun? }) → {
 *   placements,   // [{op:"voxel", pos, block:"minecraft:<dominant>"}] — recolors at EXISTING voxels
 *   filled, kept, // totals over surface cells that have a zone policy
 *   byZone,       // { [zone]: { surface, filled, kept } }
 * }
 * zones: { [zone]: { dominant: <bare id>, preserve?: <bare id>[] } } — zones absent from the map are
 * untouched. Per surface voxel (union of projectSurface over `faces`, deduped by voxel key):
 *   dominant → keep; preserve-material in a run (same-material 6-connected component ≥ minRun, full
 *   occupancy) → keep; else → fill with the zone dominant.
 */
export function zoneFill(occ, opts)

/**
 * surfaceZoneHistogram(occ, zoneOf, { faces? }) → { [zone]: { total, byBlock: { <bare>: count } } }
 * The per-zone material census of the visible skin — the AC-#3 coverage evidence and the seam T-088-01's
 * coverage gate will consume. Zones keyed by whatever zoneOf returns.
 */
export function surfaceZoneHistogram(occ, zoneOf, opts)
```

Internal organization:

- `surfaceVoxelEntries(occ, faces)` — module-private: iterate the five projections, yield
  `{key, voxel, block}` deduped by voxel key (insertion order = face order, stable).
- `inRun(occ, key, bare, minRun, memo)` — module-private: bounded 6-connected flood over `occ.cells`
  restricted to `bareBlock === bare`; early-exits true once `minRun` cells are seen; memoizes the verdict
  for every visited key (a Map<string,boolean> shared per zoneFill call). Interior continuation counts
  (a stud running into the wall is one run).
- `namespaced(id)` — same one-liner as face-paint.mjs (private there; re-private here, two lines — not
  worth a shared util).
- Validation: throw if `zoneOf` is not a function or a policy entry lacks `dominant`. `minRun` default 2.

## 2. NEW `src/view/zone-fill.test.mjs` — unit tests on synthetic occupancy

Conventions copied from `face-paint.test.mjs`: `node:test`, `assert/strict`, `occupancyFromCells`, fixtures
built from cell lists. The shared fixture is a **synthetic two-storey hut**: stone base slab+walls
(y 0..2), an upper band (y 3..5) of stone with a vertical `dark_oak_log` stud run and one isolated log
speck, a flat `spruce_planks` roof cap with a 2-cell `bricks` chimney; `zoneOf` is a hand-rolled
y-threshold + roof-membership closure (tests must not depend on `structuralZones`' heuristics).

Test list (one behavior each — the AC's three bullets plus the contract edges):

1. upper-band stone surface cell → one plaster placement (the headline fix).
2. a `dark_oak_log` stud **run** in the upper band survives; the **isolated** log speck is filled.
3. a base stone cell emits nothing (already dominant); base `cobblestone` quoin run survives.
4. roof: plank cells emit nothing; the `bricks` chimney run survives; an isolated off-policy cell on the
   roof is filled with planks.
5. recolor-only invariant: every placement pos is an existing occupied voxel; `expandArtifact` pos-set
   identical before/after `applyPaint` (geometry untouched).
6. interior cells are never filled (a buried stone voxel in the upper band stays stone).
7. zone without a policy entry is untouched (pass `zones` with only `upper`).
8. `minRun` respected: with `minRun: 3` a 2-cell run is filled, a 3-cell run survives.
9. `surfaceZoneHistogram`: totals/byBlock match hand counts on the fixture, before and after applying the
   fill (after: upper byBlock is plaster+logs only).

## 3. MODIFIED `benchmarks/sculpture/spray-paint.mjs` — wiring (impure runner)

Ordered edits, top to bottom:

- **Imports**: add `zoneFill`, `surfaceZoneHistogram` from `../../src/view/zone-fill.mjs`.
- **Replace `ZONE_MATERIALS`** with two consts (same provenance comments, updated):
  - `ZONE_POLICY = { base: {dominant:"stone_bricks", preserve:[cobblestone,dark_oak_log], splat:[cobblestone,dark_oak_log]}, upper: {dominant:"white_terracotta", preserve:[dark_oak_log,spruce_planks,dark_oak_planks], splat:[dark_oak_log]}, roof: {dominant:"spruce_planks", preserve:[dark_oak_planks,cobblestone,bricks], splat:[dark_oak_planks,cobblestone,bricks]} }` —
    the E-21-derived zone policy; `splat` excludes every zone's *field* material by design (D4).
  - `LEGACY_ZONE_MATERIALS` = the old T-079-02 sets, kept **only** to replay the splat-only baseline (the
    "(was 9%)" evidence).
- **`stripOffZonePlaster`**: `primary` lookup reads `ZONE_POLICY.{base,roof}.dominant` (was
  `ZONE_MATERIALS.*[0]`). `surfacePlasterByZone`, `interiorPlaster`, `SURFACE_FACES` unchanged.
- **§0b**: `allowedByZone` (the splat mask) built from `ZONE_POLICY[z].splat ∩ allowed`; new
  `legacyByZone` from `LEGACY_ZONE_MATERIALS ∩ allowed`.
- **NEW §0c — THE BASE COAT (T-085-01)**: build `fillZones` from `ZONE_POLICY` (assert each dominant ∈
  `allowed`); `const fill = zoneFill(occ, { zoneOf, zones: fillZones })`; `const based = applyPaint(artifact,
  fill.placements)`; `const occBased = artifactOccupancy(based)`; log per-zone filled/kept. Recolor-only, so
  every later projection has identical geometry.
- **§1 targets**: project grids from `occBased` (same dims/voxels; blocks now base-coated so the splat's
  no-change skip works against the coat).
- **§2 paint passes**: run on `occBased` with the secondary-only `allowedByZone`.
- **§2b proofs** (both on the pre-fill sealed `occ`/`artifact`):
  (a) existing unmasked smear histogram — unchanged;
  (b) NEW splat-only baseline: zone-masked paints with `legacyByZone`, applied to `artifact`, →
  `covSplatOnly = surfaceZoneHistogram(...)`.
- **§4 gate**: `before` renders/counts use `based` (the base coat is the new baseline the splat must
  improve); candidates are `applyPaint(based, pass.placements)`. `materialCounts(artifact)` (sealed,
  pre-fill) stays the `plaster.before` reference.
- **§5 commit**: `stripOffZonePlaster(occBased, ...)`; `painted = applyPaint(based, [...strip, ...merged])`.
  §5b guard + throw unchanged. NEW: `covFilled = surfaceZoneHistogram(artifactOccupancy(painted), zoneOf)`;
  log per-zone dominant fractions (`upper white_terracotta ≈0.77 (splat-only was ≈0.09)`).
- **§6 record** additions (schema stays `spray-paint/v1`; additive fields):
  - `fill: { policy: ZONE_POLICY, minRun: 2, placements: <n>, byZone: fill.byZone }`
  - `zones.coverage: { splatOnly, zoneFilled }` — each `{ [zone]: { total, byBlock, dominant,
    dominantFraction } }` (fractions rounded ×1000).
  - `zones.materials` now records `ZONE_POLICY` (replaces the `ZONE_MATERIALS` echo).
  - `renderMd`: new "Zone-fill base coat (T-085-01)" section — per-zone dominant fraction, splat-only vs
    zone-filled, fill/kept counts.
- **`--offline`**: additionally print `zones.coverage.zoneFilled.upper.dominantFraction` when present and
  require it `> zones.coverage.splatOnly.upper.dominantFraction` (reproducibility of the *reversal*, not a
  quality gate — thresholds are T-088-01's).

## 4. Regenerated outputs (by running, never by hand — Rule 1)

- `benchmarks/sculpture/spray-paint/cottage.json`, `cottage.md` (committed records, new fields).
- `benchmarks/sculpture/spray-paint/cottage/artifact.json` (the pipeline now reproduces the base-coated
  skin that e8062fa could only hand-edit).
- Face PNGs regenerate under `spray-paint/cottage/` (gitignored).

## 5. Boundaries

`src/` stays subject-agnostic (policy is runner data). No coverage threshold/gate (T-088-01). No roof-course
regularization or post-splat salt-strip (T-087-01). Block identity of each role taken from the E-21 map
as-is (T-086-01 owns value-true swaps). No changes to `face-paint.mjs`, `structural-read.mjs`, or schemas.

## 6. Order of changes

1. `zone-fill.mjs` + tests (pure, committable alone, `npm test` green).
2. Runner wiring + record/md fields.
3. `npm run spray:paint` → verify coverage + guard → commit regenerated records.
