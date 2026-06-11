# T-103-01 component-decomposition — Research

Epic E-27 / Story S-103. Goal (from ticket): a component-record schema + pure decomposition core that
segments a shell into named components with explicit geometry (roof planes, wall slabs, attached
masses, opening groups), derived from the structural read + GLB plane fits; per-subject records
committed and visualized; the record is the single downstream contract (E-27 Rule 4). This document
maps what exists. No solutions proposed here.

## 1. Inputs: where each subject's shell lives

Subjects are registry entries in `benchmarks/sculpture/durable-skin.mjs` (`SUBJECTS`, lines 94–206):
`cottage`, `gatehouse`, `church`, each with `glb`, `concept`, `frontDir`/`sideDir`, policies. Church
has `provision: { scale: 48 }` (it was voxelized from GLB at scale 48 by the E-25 challenge run).

Shell artifacts on disk (the geometry-only, pre-skin builds the decomposition will read):

- cottage — `benchmarks/sculpture/styled/cottage/shell-artifact.json` (~1.0 MB, committed)
- gatehouse — `benchmarks/sculpture/styled/gatehouse/shell-artifact.json` (~1.2 MB, committed)
- church — `benchmarks/sculpture/challenge/church/shell-artifact.json` (committed; the styled/church
  dir is empty — church never completed the styled chain, it is named-blocked at kit, E-26)

All are schema-valid design artifacts (`schema/design-artifact.schema.json`, ajv-validated):
`{schema_version, metadata, style, palette.manifest, placements[]}` with placements
`{op:"voxel", pos:[x,y,z], block:"minecraft:…"}`, last-write-wins. Coordinates are centered:
`keysToArtifact` (src/form/glb-voxel-build.mjs:229) maps grid `(i,j,k)` → `(i−⌊nx/2⌋, j, k−⌊nz/2⌋)`.

E-27 context measured on these shells: the cottage shell already carries 276 protrusions (≥4/6
exposed faces) and 23.9% ragged columns — the noise the sibling ticket T-102 (regularization cage)
will reduce. T-102 has **not started** (no work dir, no output artifact path declared yet), so this
ticket cannot name a regularized input path; the AC's "tolerant of both raw and regularized shells"
means the core must not assume either a clean or a spiky substrate.

## 2. The occupancy substrate (the one adapter)

`src/view/occupancy.mjs` — `artifactOccupancy(artifact)` → `Occupancy`:
`{bounds{min,max}, dims, size, cells: Map "x,y,z"→block, forms (sparse, non-cube), states (sparse),
has(), block(), formOf(), solid()}`. Pure, no GL. `solidOccupancy(occ)` filters to full cubes
(fixture-dressed cells are occupied-not-solid — T-097 semantics). All view-layer modules consume
this; the decomposition should too (shells are cube-only today, but church dressing exists upstream).

## 3. Structural read: what exists vs what the ticket needs

`src/view/structural-read.mjs` (pure, unit-tested on synthetic occupancy):

- `footprint(occ)` — (x,z) column set + bbox/area.
- `storeyBands(occ)` — per-y dominant-block bands + `floorLines` (fill ≥ 0.6 layers).
- `roofRegion(occ)` — the +y top-exposed surface: per-cell `{x,z,y,block}`, yRange, coverage. This is
  a **heightfield** of the top shell, exactly one cell per occupied (x,z) column.
- `wallFields(occ)` — four ortho elevations (`+x,-x,+z,-z`) with surface cells `{u,v,voxel,block}`,
  enclosed-air `holes`, block tallies.
- `openings(occ, dir)` — air components of the **solid-view** ortho mask classified window (enclosed)
  / door (bottom-touching only), with `dressing` attribution and `cellsUV` internally (only bbox,
  kind, cells, dressing are returned — the per-cell aperture shape is computed but not exposed).
- `airComponents(mask)` — exported 4-connected air-region helper (the one enclosed-vs-border
  definition; reused by shell-integrity).
- `structuralZones(occ)` — `zoneOf: voxel → base|upper|roof` via floor lines + roof membership.

Gap the ticket names: everything is per-cell labels over one projection. There is **no plane** (no
normal/extent/eave/ridge), no mass separation (church tower and nave are one undifferentiated cell
set), no aperture head/jamb geometry (openings expose only a uv bbox per face).

## 4. Existing geometry/segmentation machinery (candidate building blocks)

- `src/form/voxel-components.mjs` — `componentLabels(occupancy, {connectivity:6|26})` flood-fill over
  the **voxelize-shaped** occupancy (`{dims, occupied: Int32Array}`), plus `strayVoxelStats`,
  `pruneStrays`. Pure, deterministic label order. Note the input shape mismatch: view-layer modules
  use the `cells` Map occupancy; voxel-components uses the Int32Array grid form. Both shapes coexist
  in the codebase; `artifactOccupancy` ↔ grid conversion is done ad hoc by callers today.
- `src/view/shell-integrity.mjs` — `componentStrip`, `fillVoids`, `plugClosure`, `closureCheck`,
  `openingRegions`, `rebuildArtifact(occ, template)` (occupancy → schema-valid artifact reusing a
  template's metadata/style). The runner/core seam convention lives here (see §6).
- `src/view/surface-grid.mjs` — `projectSurface(occ, dir)` ortho/diag surface grids, `orthoSpec`,
  `cellWorldPos`, `gridMaskOf`. The uv↔world inverse used by openings' dressing attribution.
- `src/view/zone-map.mjs`, `zone-fill.mjs` — zone derivation + surface histograms (downstream
  consumers that today re-derive structure from occupancy; E-27 Rule 4 will point them at the record).

## 5. GLB path (the plane-fit reference)

- `src/form/glb-mesh.mjs` — `parseGlbMesh(glb)` → `{positions: Float64Array (9/tri, transforms
  applied, indices expanded), triangleCount, bounds{min,max} world}`. **No normals returned** —
  computable per-triangle from the expanded positions (cross product); area likewise.
- `src/form/glb-voxelize.mjs` — `voxelizeGlb(glb, {scale})`: `voxelSize = longestExtent/scale`,
  grid origin at mesh `bounds.min`, **center sampling** (`min + (i+0.5)·voxelSize`), dims =
  `round(extent/voxelSize)`. Composed with keysToArtifact's recentering this fixes the affine map
  GLB-world ↔ artifact-voxel **when the scale is known**: church 48 (registry); cottage/gatehouse
  shells descend from older lineages (concept-materials / building) whose scale is not in the
  registry. Per-axis AABB matching (mesh bounds ↔ occupancy bounds) is the alignment information
  actually available for all three subjects without archaeology.
- GLBs at `benchmarks/sculpture/glb/{cottage,stone-gatehouse,church}.glb` (committed; registry-keyed).
- `src/form/glb-silhouette.mjs` — mesh→silhouette raster (the cage's IoU reference; not needed for
  decomposition itself but shares `parseGlb`).

## 6. Runner/core conventions (what a new stage must look like)

Established pattern (shell-integrity.mjs, challenge-milestone.mjs, styled-milestone.mjs in
`benchmarks/sculpture/`):

- **Pure core** in `src/` (no GL, no I/O, no Date/random) with `*.test.mjs` beside it; `npm test` =
  `node --test "src/**/*.test.mjs"` (1217 passing today) + ajv schema validation.
- **Impure runner** in `benchmarks/sculpture/<name>.mjs`: file I/O, best-effort GL renders
  (`tryRender` via lazy `src/view/multi-angle.mjs` `renderViews`), durable JSON+MD record committed,
  PNGs gitignored EXCEPT committed evidence frames under `pr/assets/frames/<stage>-<subj>.png`.
  Determinism: core runs twice, byte-identical output, sha256 recorded; `--offline` re-asserts.
- **No subject constants in code** (E-25 Rule 3): subjects from the durable-skin registry; runner-local
  registry **data** tables (challenge-milestone's `EXTRAS`) are the accepted idiom for stage-specific
  per-subject inputs/expectations (shell-integrity pins AC numbers in `SUBJECTS[…].expect`).
- npm script naming: `<stage>:<subject>` → `node benchmarks/sculpture/<runner>.mjs --subject <s>`.
- Render vocabulary: `renderViews(artifact, angles, {outDir, label})`, named angles incl. the four
  gate azimuths `+x+z, +x-z, -x-z, -x+z` (multi-angle.mjs VIEW_ANGLES); `src/form/montage.mjs`
  `montageRow` composes contact sheets GL-free.

## 7. Concurrency & boundary constraints

- A sibling session may take T-102-01 (same epic, both "ready"). The tickets are DAG-independent;
  per RDSPI, file overlap = missing edge, so this ticket must **not** modify `styled-milestone.mjs`,
  `shell-integrity.mjs`, or other files T-102 plausibly touches. A new runner + new `src/form`
  modules + package.json script additions (small, append-only) keep the overlap to package.json only.
- Downstream consumers (S-104 roof-as-program, S-105 shaped vocabulary, S-106 component-aware
  skinning) are unwritten — the record is a forward contract; nothing imports it yet this ticket.
- The judge/gate layer is frozen (E-27 out-of-scope); decomposition produces records + visual
  evidence only, no gate changes.

## 8. Subject ground truth (what the AC expects the segmentation to find)

- **cottage** — gabled roof: 2 opposing roof planes + ridge; wall slabs on 4 sides; a chimney mass
  protruding through the roof (E-27 names it a protected sub-region); door/windows known to the kit.
- **gatehouse** — walls + roof; THE arch: a large ground-touching opening (door-like in `openings`
  terms) whose head is curved — currently only a uv bbox; crenellation noise on top (mesh-inherited).
- **church** — two attached masses: square bell tower (tall) + nave (long), each with its own roof
  form (tower cap + nave gable); window opening groups (black_stained_glass in the base artifact).

## 9. Assumptions & risks surfaced (for Design to resolve)

- Shell noise (276 protrusions, 23.9% ragged columns on cottage) will pollute naive plane fits and
  gradient estimates; the core must be robust to it (T-102 may or may not land first).
- Two occupancy shapes (Map-based vs Int32Array grid) — the decomposition sits exactly at their
  junction (view-layer reads + form-layer component labels).
- GLB↔shell alignment is exact only where the voxelization scale is recorded (church); the others
  need AABB-affine alignment, which is approximate under post-voxelization edits (strip/fill changed
  the occupancy bounds only if edits touched the extremes).
- `openings()` does not expose per-cell aperture shape (`cellsUV` is internal) — head/jamb/arch
  geometry needs either an export extension or a re-projection in the new core.
- Record size: shells are ~30–60k cells; a record embedding raw cell lists per mass would rival the
  artifact size. Compression/representation choice is a Design question.
