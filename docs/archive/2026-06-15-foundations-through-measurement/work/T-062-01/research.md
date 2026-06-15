# T-062-01 — Research: cleanliness metrics

Epic **E-19** regains text→JSON's clean color/material on the GLB-voxel path. The fixes hill-climb on
metrics, so the scoreboard is fixed first (this ticket gates the rest of E-19). Two metric defects:

1. **No stray-voxel measure.** TRELLIS leaves floating islands and (moai) duplicate masses + hallucinated
   connectors — disconnected components. Nothing in the codebase counts this.
2. **`speckleScore` lies.** It counts *every* face-adjacent differing-block pair, so an intentional region
   boundary reads as "speckle" and the metric rewards painting everything one block. It cannot tell
   fragmentation (bad) from a clean region edge (good).

This is descriptive: what exists, where, how it connects. No solutions here.

## The occupancy data model (the substrate both metrics read)

`src/form/glb-voxelize.mjs` is the geometry core.

- `voxelizeGlb(glb, {scale}) → { scale, voxelSize, dims:[x,y,z], bounds, occupied:Int32Array, count }`.
  `occupied` is a flat `[i,j,k, i,j,k, …]` triple stream; `count = occupied.length/3`.
- `occupiedCells(occupancy)` — generator yielding `[i,j,k]` tuples **in occupied-cell order**. This order
  is the canonical index space: every per-cell array (`keys`, sampled `colors`) is aligned to it.
- `j` is the vertical axis (y / height). `i`,`k` are the horizontal plane.

**Load-bearing invariant (appears in every prior ticket's research):** any `keys[]` passed to a metric must
be in `occupiedCells` order *for the same occupancy that produced it*. A build scored against a different
voxelization silently misaligns. `e18-remeasure.mjs` is explicit about this (scores E18 over `occThin`,
R1/R2 over `occBase`).

## Existing connectivity helper (REUSE target)

`src/form/glb-thin.mjs` already has a connected-component flood fill:

```
connectedComponents(occupancy, {connectivity=26}) → { count, sizes:number[] }   // sizes sorted desc
```

- Iterative DFS (explicit stack) over an `indexCells` `"i,j,k"→n` Map; `FACE_DIRS` (6) / `BOX_DIRS` (26).
- Pure, deterministic. Used by `voxelizeGlbThin` to report `occ.thin.components` (defaults to 26-conn there).
- **Gap for this ticket:** it returns only `{count, sizes}` — **no per-cell labels and no coordinates**, so
  it cannot by itself compute *which* cells are stray or whether an island sits below the main mass. The
  stray metric needs labels + coords. The flood-fill core is identical, though — duplicating it would be a
  second copy of the same algorithm. (`indexCells`, `FACE_DIRS`, `BOX_DIRS` are module-private to glb-thin.)

A second, identical `indexCells` lives in `material-clean.mjs` (private). So the `"i,j,k"→n` index +
neighbour-direction pattern already appears in ≥3 places (glb-thin, material-clean, material-segment).

## `speckleScore` today (`src/form/material-clean.mjs:151`)

```
speckleScore(occupancy, keys) → number in [0,1]
  index = indexCells(occupancy)                       // "i,j,k"→n
  for each occupied cell, for each +i/+j/+k neighbour (each pair counted once):
    pairs++; if keys[n] !== keys[m] differ++
  return pairs === 0 ? 0 : differ/pairs
```

It is the **fraction of face-adjacent occupied cell pairs whose blocks differ.** Properties:
- A clean two-region block is *penalized* for its shared boundary (every boundary pair counts).
- Rewards "paint it all one block" → 0 (coverage-blind; T-058-01 review concern #4, #95).
- A checkerboard → ~1 (correctly high), but so does a legitimate fine two-tone pattern.

It is **re-exported** by `material-segment.mjs:38` (`export { speckleScore }`) so the runners have one import
site. The signature `(occupancy, keys) → number` and the `[0,1]` range are the public contract.

### Call sites (the "old call sites keep working" constraint)

Source/test:
- `material-clean.test.mjs:97,103,104,119–122` — denoise drop; **direct-value assertions** at 119–122.
- `material-segment.test.mjs:163,230,235,245` — all **relative** (`hard ≤ soft`, `seg ≤ naive`, `< 0.5`).
- `material-segment.mjs:29,38` — import + re-export.

Benchmarks:
- `glb-voxel-clean.mjs:211,222` — before/after on shared occupancy.
- `glb-voxel-seg.mjs:240,255` — before/after on shared occupancy.
- `e18-remeasure.mjs:143,205` — R1/R2 over `occBase`, E18 over `occThin`.

**Direct-value vs relative.** Only `material-clean.test.mjs:117–123` asserts *exact* values
(`[red,blue]→1`, `[red,red]→0`, lone→0). That `→1` assertion is exactly the boundary-counting behaviour the
ticket calls a lie; it must be **updated** when the semantics change. Every other call site is relative
(monotone direction: cleaner build ≤ noisier build) or a re-export — those keep working unchanged if the new
metric stays monotone in the same direction (a clean region scores ≤ a fragmented one) and stays in `[0,1]`.

## Artifact ↔ occupancy round-trip (how rescoring can stay offline)

`keysToArtifact(occupancy, keys, opts)` (`glb-voxel-build.mjs:229`) emits one placement per occupied cell, in
`occupiedCells` order:

```
{ op:"voxel", pos:[i-ox, j, k-oz], block:`minecraft:${key}` }   // ox=floor(dimsX/2), oz=floor(dimsZ/2)
```

So a committed `artifact.json`'s `placements[]` carry **both coords and block**, in occupied order. The
horizontal offset (`ox`,`oz`) is a uniform translation — it does **not** affect 6-adjacency or component
structure, and `j` (the vertical) is stored exactly. Therefore an occupancy + aligned `keys[]` can be
*reconstructed* from any committed artifact with no GLB, no GL, no decode. `keysFromArtifact` already exists
in the runners (`p.block.replace(/^minecraft:/,"")`). There is no committed inverse `pos → occupancy` yet.

## The builds to re-score (the before-baseline corpus)

`benchmarks/sculpture/glb-voxel-breadth.mjs` defines `SUBJECTS` (7): dancing-man, moai, pineapple,
bow-and-arrow, heart, mushroom, koi. Each has committed artifacts on disk (gitignored renders, but the JSON
artifacts are present):
- `glb-voxel/<subj>/artifact.json` — R1 (per-voxel snap to 305-table; the speckled baseline).
- `glb-voxel-clean/<subj>/artifact.json` — R2 (small-palette clean).
- `e18-build/<subj>/artifact.json` — the E-18 combined (thin + segment) build.

All 7 present in all three dirs (verified). `e18-remeasure.{md,json}` is the existing five-axis roll-up
(form IoU / speckle / distinct / off-palette / valueΔE). Its `assembleRemeasure` (`src/form/remeasure.mjs`)
is the pure md+json emitter pattern; sibling runners (`e18-scorecard.mjs`, `secondary-palette.mjs`) follow
the same "compute rows → write `<name>.{md,json}`" shape with a `round3` helper.

## Constraints & assumptions

- **Purity.** Metrics live in `src/form/`, must be pure (no GL/WebP/GLB/network), unit-tested offline. The
  baseline runner lives in `benchmarks/sculpture/` and may read files, but needs no host codec if it
  reconstructs occupancy from committed artifacts (above).
- **`npm test` is the gate.** Current baseline is **608** tests green (per E-18 close, S1172). New tests add
  to it; the one direct-value speckle assertion changes rather than adds.
- **Component metric must be face-adjacency (6-conn)** per the AC ("over the occupancy's face-adjacency"),
  distinct from glb-thin's 26-conn thin diagnostic. The two are color-blind (occupancy only); speckle is
  color-aware. They are orthogonal: a single-color checkerboard is one solid component (stray=0) but, if
  two-colored, high speckle.
- **"sub-floor islands"** is the one under-specified term: cells in disconnected (non-main) components that
  sit *below* the main mass — floating debris under the floor. Needs a precise, testable definition in
  Design (the AC's binding test is only "single floating island → largest-fraction < 1").
- **No new color math / no reimplementation** is the house rule (every module header repeats it). The
  component flood fill already exists; the fix should extend/reuse it, not fork a third copy.
