# T-058-03 — Design: gated secondary palette

Decisions, with rejected alternatives. Grounded in research.md.

## Decision 1 — A new pure module `src/form/palette-augment.mjs`

The augmentation is a distinct concern from "snap colours" (glb-voxel-build) and "segment regions"
(material-segment). The codebase keeps one concern per file (material-clean, material-segment,
glb-voxel-build are siblings). It reuses `aggregateForeground`+`medianCutLab` (palette-extract),
`nearestLab`/`deltaE`/`srgbToLab` (cielab), `loadBlockTable` (block-table) — and is imported BY
glb-voxel-build and material-segment.

- **Rejected: put `augmentPalette` inside `glb-voxel-build.mjs` next to `paletteFromManifest`.** It
  would need to import `palette-extract`, and material-segment already imports glb-voxel-build — fine —
  but it muddies the colour/compile core with cluster extraction, and the function is independently
  the headline deliverable (deserves its own test file). A separate module is cleaner and cycle-free
  (palette-augment must NOT import glb-voxel-build).

## Decision 2 — Two functions: `augmentReport` (rich) and `augmentPalette` (thin)

The AC signature is `augmentPalette(...) → palette`. But the benchmark (AC #3) needs the diagnostics:
*which* blocks were added (block, gain, coverage) and the *mean snap ΔE before→after*. So:

- `augmentReport(designDocPalette, texture, table, opts) → { palette, secondary, added, candidates,
  meanSnapBefore, meanSnapAfter, foregroundPx }` — the full computation.
- `augmentPalette(designDocPalette, texture, table = loadBlockTable(), opts = {}) → {key,lab}[]` —
  exactly `augmentReport(...).palette`. The wireable, AC-named entry point.

`added` carries `{key, gain, coverage, primaryDeltaE, tableDeltaE, lab}` per chosen block; `candidates`
carries every cluster's diagnostics (for an honest "considered but rejected" trail in the record).

- **Rejected: one function returning a tuple/array always.** Callers that only want the palette
  (the build paths) shouldn't carry the report; callers that want the record (the benchmark) shouldn't
  recompute. Two functions, one implementing the other, is the established pattern (cf. extractPalette).

## Decision 3 — The gate algorithm (verbatim to the ticket, deterministic)

`AUGMENT_DEFAULTS = { k: 8, driftThreshold: 12, minCoverage: 0.05, fitThreshold: 6, gainThreshold: 6, K: 2 }`
(named constants, tunable — AC #1).

1. **Clusters:** `aggregateForeground(texture, {dropColor,dropTolerance,alphaThreshold})` →
   `{points, foregroundPx}`; `medianCutLab(points, k)` → clusters. `coverage = cluster.count/foregroundPx`.
   If `foregroundPx === 0` → return primary unchanged (no augmentation).
2. **Per cluster:** `primaryΔE = nearestLab(cluster.lab, designDocPalette).deltaE`;
   `best = nearestLab(cluster.lab, tablePalette)` → `bestKey`, `tableΔE = best.deltaE`;
   `gain = primaryΔE − tableΔE`.
3. **Qualify iff ALL hold** (the four gates):
   - underserved: `primaryΔE > driftThreshold`
   - real: `coverage ≥ minCoverage`
   - super-great fit: `tableΔE ≤ fitThreshold`
   - big win: `gain ≥ gainThreshold`
   …and `bestKey ∉ primary keys` (dedupe vs the design-doc palette — a block the design doc already
   has is not "secondary").
4. **Pick ≤ K:** rank qualifying candidates by `gain × coverage` (desc; tie-break coverage desc, then
   `key` asc — fully deterministic). Dedupe by `bestKey` (two clusters → one block; keep the higher rank).
   Take the first `K`. `secondary = [{key, lab}]` (lab = the **table block's** Lab, so the snap is
   value-true, the way R2 snaps). `palette = [...designDocPalette, ...secondary]`.
5. **Drift removed (for the record):** coverage-weighted mean over clusters —
   `meanSnapBefore = Σ coverage·nearestLab(lab, primary).deltaE`,
   `meanSnapAfter = Σ coverage·nearestLab(lab, palette).deltaE`. Σcoverage = 1 (counts sum to foreground),
   so these are true weighted means. `before ≥ after` by construction (the palette only grew).

- **Rejected: snap the secondary's Lab to the cluster centroid instead of the block's Lab.** That would
  reintroduce the per-cluster colour drift the value-true table exists to remove. Use the block's table Lab.
- **Rejected: rank by gain alone.** A 5%-coverage near-miss would outrank a 40%-coverage solid win.
  `gain × coverage` favours blocks that fix a *large* drift over a *meaningful* surface — the ticket's intent.
- **Rejected: `coverage` from the median-cut `points` length (distinct colours) instead of `count`.**
  Coverage must be surface share, i.e. pixel population (`count`), not distinct-colour count.

## Decision 4 — Wire as an opt-in `augment` flag on both build paths

`glbVoxelBuild` and `segmentMaterials` gain an `augment` option. When truthy AND a design-doc `palette`
is present, the build augments that palette with the decoded texture it already has, then snaps within
the result:

- `segmentMaterials`: `snapPalette = augment ? augmentPalette(palette, texture, a.table, a) : palette`
  (it already holds `build.texture`). Stays PURE.
- `glbVoxelBuild`: augment between decode and `colorVoxelsToArtifact` (`texture` in scope at `:248`).
  Stays impure only through `decodeTexture`.

`augment` may be `true` (defaults) or an options object `{table?, driftThreshold?, …, K?}`. This satisfies
AC #1 ("the candidate palette passed to glbVoxelBuild / segmentMaterials is the augmented one") centrally:
every caller that opts in gets augmentation without re-implementing it.

- **Rejected: augment only in the runners, pass the merged palette in.** The R1 breadth runner does NOT
  decode the texture (glbVoxelBuild does, internally), so it could not call `augmentPalette` without
  re-decoding. Centralising the hook in the build functions avoids a second decode and keeps the AC literal.
- **Rejected: make augmentation always-on (no flag).** It would silently change the committed R-seg /
  e18 sweep numbers. T-058-02 is the ticket that makes the augmented palette *canonical* across all build
  paths; T-058-03 only implements the mechanism + the record. Opt-in keeps blast radius tight and lets
  T-058-02 flip the switch deliberately. Default `augment` is absent ⇒ existing behaviour unchanged.

## Decision 5 — A new sweep `benchmarks/sculpture/secondary-palette.{md,json}`

Modelled on `glb-voxel-seg.mjs` (the host/GL split, dwebp decode, `judgeIoU`, `--offline`). Per subject:
decode texture → `paletteFromManifest` (primary) → `augmentReport(primary, texture, table)` for the
diagnostics → build via `segmentMaterials(build, {palette: primary, augment:{table}})` → render →
record. The durable record carries, per subject: design-doc size, the added blocks `{block, gain,
coverage}`, secondary count, total palette size, **mean texture-snap ΔE before→after** (computed
per-voxel from the sampled surface colours — the most honest "drift removed"), off-palette count
(must be 0), and form IoU. Most subjects add **0** — the record states so honestly.

- **Mean snap ΔE — per-voxel vs cluster-weighted.** The benchmark has the actual per-cell sampled
  colours, so it reports the per-voxel mean (truest). `augmentReport` returns the cluster-weighted mean
  (GL-free, for unit tests). Both are honest; the record uses the per-voxel one and notes the method.
- **Form IoU** is invariant under recolouring (Decision in research). The sweep still renders + judges
  to confirm empirically; the JSON notes the invariance.

## Decision 6 — Tests target the pure core (`palette-augment.test.mjs`)

Synthetic atlas textures (`atlasRow`) + a synthetic `{blocks:[{block,lab}]}` table so the "tight table
block" is controlled. Cases (AC #2): (a) far-from-primary + tight-table cluster → that block added;
(b) well-served cluster → nothing added; (c) ≥3 qualifying clusters → cap holds at K; (d) low-coverage
off-colour speck → not added; plus (e) fit-gate (far cluster with NO tight table block → not added) and
(f) a wiring test: `segmentMaterials(build, {palette, augment:{table}})` → manifest ⊆ augmented palette,
off-palette 0, total ≤ design-doc size + K, AJV-valid. The buildSecondary roll-up mirrors buildSeg
(pure, not separately unit-tested — consistent with the existing runners).
