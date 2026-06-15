# T-062-01 — Design: cleanliness metrics

Three decisions: (1) how the new stray-voxel/component metric is shaped and where it lives; (2) how
`speckleScore` is redefined to measure fragmentation while keeping its contract; (3) how the before-baseline
is produced. Grounded in Research.

---

## Decision 1 — Stray-voxel metric: a new pure module reusing the flood fill

### The shape

`strayVoxelStats(occupancy, {connectivity=6}) → { components, largestCount, largestFraction, strayCount,
subFloorCount }`:

- `components` — number of 6-connected occupancy components (color-blind, geometry only).
- `largestCount` — cells in the biggest component.
- `largestFraction` — `largestCount / occupancy.count` ∈ (0,1]; **1.0 ⇔ a single solid mass** (AC).
- `strayCount` — `count − largestCount`: every cell *not* in the main mass (floating islands, duplicate
  TRELLIS masses, hallucinated debris).
- `subFloorCount` — cells in **non-largest** components whose `j` is **strictly below the largest
  component's minimum `j`** — i.e. islands floating *under the floor* of the main build (the moai failure
  shape). A precise, testable refinement of strayCount.

Defaults to **6-connectivity** (face-adjacency) per the AC. Empty occupancy → all-zero struct (no throw).

### Why a new module + the labels gap

`connectedComponents` in `glb-thin.mjs` returns only `{count, sizes}` — no per-cell labels, no coords — so it
**cannot** name which cells are stray nor test sub-floor membership. The stray metric needs labels and `j`
coords. Two ways to get them:

- **(A) Fork a third flood fill** in a new file. Rejected — violates the house "no reimplementation" rule;
  there would be three copies of the same DFS (glb-thin, …, new).
- **(B) Extract a labeling core, build both metrics on it.** Chosen. Add `componentLabels(occupancy,
  {connectivity}) → { labels:Int32Array(count), sizes:number[] (label order), count }` to a new
  `src/form/voxel-components.mjs`, and **refactor `connectedComponents` to delegate** to it
  (`{count, sizes: [...sizes].sort(desc)}`). One flood fill, two consumers; glb-thin's public API is
  unchanged (it still returns `{count, sizes}` sorted desc, same as today's tests assert).

`strayVoxelStats` then reads labels + `occupiedCells` coords — no second traversal of the grid beyond a
linear pass for the largest-label min-`j` and the sub-floor tally.

### Why a separate file, not append to glb-thin or material-clean

glb-thin is *thin-feature voxelization* (a build step); material-clean is the *color* pass. The
stray/component metric is neither — it is pure structural scoring, the natural sibling of the (now relocated)
labeling core. `voxel-components.mjs` is the honest home: "connectivity over occupancy." glb-thin imports the
core from it (geometry depending on a lower-level geometry primitive — clean direction, no cycle:
voxel-components imports only `occupiedCells` from `glb-voxelize`).

### Tie-break & determinism

Largest component = the max-size label, ties broken by **lowest label index** (discovery order, which is
`occupiedCells` order) — fully deterministic. Sizes from `componentLabels` are in label order; `sort` only
happens in `connectedComponents`'s adapter.

---

## Decision 2 — `speckleScore` redefined as local-outvote fragmentation

### The definition

A cell is a **speck** when it is *locally outvoted*: among the multiset `{the cell's own block} ∪ {blocks of
its occupied face-neighbours}`, some **other** block is **strictly more frequent** than the cell's own block.

```
speckleScore(occupancy, keys):
  for each occupied cell c (block b) with ≥1 occupied face-neighbour:
    denom++
    tally = {b: 1} + counts of each face-neighbour's block      // self included
    if max-other-block-count > tally[b]:  specks++
  return denom === 0 ? 0 : specks / denom
```

Returns a **fraction of cells** ∈ [0,1] (was a fraction of *pairs*). Signature, range, and monotone direction
are preserved — the public contract holds.

### Why this satisfies every AC case

- **2-region clean block → ≈0.** Interior cells: all neighbours share the block → not outvoted. A boundary
  cell still has its *own* region as the local majority (≥4 of its ≤6 neighbours are same-region) → its block
  ties-or-wins → **not a speck.** The shared edge is no longer penalized. ✓
- **Checkerboard → high.** Every cell's 6 face-neighbours are the opposite block: self=1, other=6 → outvoted
  → speck. Score → 1. ✓
- **Single floating speck** (one odd cell inside a solid block): self=1, neighbours all the other block →
  outvoted → speck (and stray metric also flags it as a disconnected/odd cell). ✓
- **Solid mass / uniform field → 0.** No cell is outvoted. ✓ (keeps `material-clean.test.mjs:104`,
  `denoise → 0` assertions.)

"Self included" in the tally is the load-bearing trick: it makes a region edge cost nothing while keeping a
genuine lone speck flagged. Including the cell guarantees `tally[b] ≥ 1`, so a speck needs **≥2** neighbours
agreeing on some *other* single block — exactly "differs from a strong neighbourhood majority / isolated
singleton" from the AC.

### Impact on existing call sites (Research §call-sites)

- **Relative assertions stay green** — a cleaner build still scores ≤ a noisier one (the metric is monotone
  in fragmentation): `material-segment.test.mjs:163,230,235,245` and all benchmark before/after pairs. The
  denoise-drop test (`material-clean.test.mjs:103`) holds: a 3×3 with one center speck → 1 speck/9 ≈ 0.111
  before, 0 after.
- **One assertion changes** — `material-clean.test.mjs:117–123`. The `[red,blue]` 2-cell case is now 0 (each
  cell ties 1–1, not outvoted) instead of 1. That is the *correct* new semantics (a 2-cell two-tone is the
  minimal clean two-region, not speckle). This test is rewritten as part of the ticket, with new cases for
  checkerboard (→1) and a 2-region block (→0). `[red,red]→0` and lone→0 are unchanged.

### Rejected speckle alternatives

- **Keep pair-fraction, subtract intentional boundaries** (detect "regions" and exclude inter-region pairs).
  Rejected — needs a region segmentation just to score, fragile, and circular (segmentation is what we're
  measuring the quality of).
- **Connected-component count *per block color*** (fragmentation = #color-components − #colors). Rejected —
  expensive (a flood fill per color), and a thin legitimate stripe reads as many components. The
  local-outvote rule is O(cells·6), single pass, and local fragmentation is exactly what "speckle" means.

---

## Decision 3 — Before-baseline by offline artifact rescoring

`benchmarks/sculpture/cleanliness-baseline.{md,json}`: for each of the 7 subjects, re-score the three
committed builds (R1 `glb-voxel`, R2 `glb-voxel-clean`, E18 `e18-build`) on the **fixed** metrics
(new speckle + the four stray fields).

**No GL, no GLB, no decode.** Each committed `artifact.json` carries `pos`+`block` per cell in occupied order
(Research §round-trip). The runner reconstructs `{occupancy, keys}` from `placements` via a small local
`occupancyFromArtifact(artifact)` helper (translation-invariant; `j` exact — preserves adjacency and
sub-floor), then calls the pure metrics. This makes the baseline a deterministic, dependency-free read that
reruns anywhere (CI, headless), unlike `e18-remeasure` which needs `dwebp`+GL for form IoU.

Output mirrors the sibling runners: `round3` numbers, a per-subject × per-build table in `.md`, the full
structured rows + a `meta` block (metric definitions, generated-from) in `.json`. The runner has a
`--offline`-equivalent single path (it is *always* offline) and lives next to `e18-remeasure.mjs`.

Helper placement: `occupancyFromArtifact` is kept **local to the runner** (benchmarks) — it is a presentation
concern, not a core primitive, and no other ticket has asked for the inverse yet (YAGNI). If E-19 later needs
it in `src/`, it lifts cleanly.

---

## Summary of files

- **new** `src/form/voxel-components.mjs` — `componentLabels`, `strayVoxelStats`.
- **edit** `src/form/glb-thin.mjs` — `connectedComponents` delegates to `componentLabels` (API unchanged).
- **edit** `src/form/material-clean.mjs` — rewrite `speckleScore` body (signature unchanged).
- **new** `src/form/voxel-components.test.mjs`; **edit** `material-clean.test.mjs` (speckle cases).
- **new** `benchmarks/sculpture/cleanliness-baseline.mjs` + emitted `.md`/`.json`.
