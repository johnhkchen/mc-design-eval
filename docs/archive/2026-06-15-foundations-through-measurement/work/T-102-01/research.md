# T-102-01 regularization-cage — Research

Descriptive map of what exists. No solutions proposed here.

## Ticket in one line

Add morphological open/close on the voxel shell + a protrusion/ragged-column census, every step
caged against the GLB (per-azimuth silhouette IoU tolerance, six-direction closure, protected
sub-regions), wired as a pipeline stage after shell integrity, run on cottage/gatehouse/church.

## Verified baselines (metric definitions pinned by reproduction)

Reproduced the ticket's cottage numbers exactly from
`benchmarks/sculpture/styled/cottage/shell-artifact.json` (7693 cells), which pins the definitions:

- **Protrusion census**: a cell with **≥4 of 6 face-neighbors empty** (6-neighborhood on the full
  occupancy). Cottage = **276**.
- **Ragged-column rate**: heightmap = max y per occupied (x,z) column; a column is ragged when
  **|Δheight| ≥ 3 vs any present 4-neighbor column**. Cottage = **157/656 = 23.9%**.

Same metrics on the other two shells (measured 2026-06-10, this phase):

| subject | shell artifact | cells | spikes ≥4-face | ragged columns |
|---|---|---|---|---|
| cottage | `styled/cottage/shell-artifact.json` | 7,693 | 276 | 23.9% (157/656) |
| gatehouse | `styled/gatehouse/shell-artifact.json` | 8,729 | 132 | 28.1% (191/679) |
| church | `challenge/church/shell-artifact.json` | 13,647 | 602 | 24.3% (334/1376) |

(All paths relative to `benchmarks/sculpture/`. Church has no `styled/church/` artifacts — it was
named-blocked at the kit stage in E-26; its shell lives under `challenge/`.)

## Where the shell stage lives

Pure cores: `src/view/shell-integrity.mjs` — `componentStrip` (keep largest 6-connected + grounded;
strip declared), `rebuildArtifact(occ, template)` (deletion has no artifact op → canonical
(y,z,x)-ordered rebuild, carries per-voxel `state`), `openingRegions` (declared door/window/arch
world-AABBs = allow-list), `inRegion(pos, regions)`, `fillVoids` (depth-basin repair, minDepth=3
relief floor), `closureCheck` (six-direction ground-solid watertightness; returns
`{closed, reached, byDirection, mouths, dressed}`), `plugClosure` (THROWS if unclosed at cap).

Runners that invoke the stage:
- `benchmarks/sculpture/shell-integrity.mjs` — T-091 witnessed-artifact runner (cottage/gatehouse
  with pinned AC numbers, `--offline` re-assert mode, double-run byte-identity, sha256 record).
- `benchmarks/sculpture/challenge-milestone.mjs` — `shellStage(baseArtifact)` (line ~157), called
  by the exported `runChain(def, paths)`: `[provision] → shellStage → buildSkin`. `runChain` writes
  `<out>/shell-artifact.json` then `buildSkin` reads it from disk (deliberate file seam).
- `benchmarks/sculpture/styled-milestone.mjs` — `styledChain` calls `runChain` (line ~88), then
  grammar → dressing → settle → kit-aware multi-angle gate. `PIPELINE_ORDER` string documents the
  chain and is asserted in records.

So "wired after shell integrity" means: inside/immediately after `shellStage` in
challenge-milestone's `runChain` — styled-milestone then inherits it for free, and the standalone
shell runner can carry it too.

## Occupancy representation

`src/view/occupancy.mjs`: `occupancyFromCells(cellList)` / `artifactOccupancy(artifact)` build
`{cells: Map<"x,y,z" → block>, forms?, states?, bounds:{min,max}, size, has(), solid()}`.
`solidOccupancy(occ)` filters fixtures; `bareBlock(id)` strips namespace. `componentStrip` shows
the int32 adapter pattern for reusing `componentLabels` (`src/form/voxel-components.mjs`, 6/26
connectivity flood fill). `applyDeltas(artifact, placements)` (`src/view/surface-coherence.mjs`)
applies ADD/RECOLOR deltas; removals require `rebuildArtifact`.

## What does NOT exist yet

- **No erode/dilate (morphological) ops anywhere.** `componentStrip` removes disconnected debris
  only; `fillVoids` fills basins (pits seen from a face), not bumps; zone-fill paints surfaces.
- **No protrusion-census or ragged-column metric module** (obs 12878 confirmed no 6-face per-voxel
  exposure enumeration as a metric; `zone-fill.mjs` has `exposedVoxelEntries`/`surfaceVoxelEntries`
  as iterators for painting, not census metrics).
- **No pure voxel→silhouette at the 4 gate azimuths.** `surface-grid.mjs` `projectSurface` handles
  the 6 ortho dirs + 45° ground diagonals as 2.5-D cell grids (no 30° elevation, no perspective).

## Silhouette IoU machinery (the cage's measuring stick)

- **Gate azimuths are config-frozen**: `src/config.mjs` `MULTI_ANGLE_GATE.azimuths =
  ["+x+z","+x-z","-x-z","-x+z"]` (45/135/225/315°). `src/view/multi-angle.mjs` `VIEW_ANGLES.diag`
  maps them to `{azimuthDeg, elevationDeg: 30}`; `resolveAngle(name)` resolves either form.
- **GLB mesh silhouette, pure**: `src/form/glb-silhouette.mjs` — `loadMeshFromGlb(bytes)` →
  `{positions, indices, bounds, triCount}`; `rasterizeSilhouette(mesh, {view})` projects every
  triangle through the *same camera math the build render uses* (`cameraForMeshBounds` →
  `framedCamera` adapter; default 512×512) and returns `{w, h, data:Uint8Array, bbox}`. Used per
  gate azimuth already: `multi-angle-gate.mjs:339` `rasterizeSilhouette(mesh, {view: resolveAngle(a)})`.
  Crucially, `rasterizeSilhouette` takes **any** `{positions, indices, bounds}` — nothing in it is
  GLB-specific.
- **Silhouette comparison, pure**: `src/form/form-fidelity.mjs` — `normalizeSilhouette(mask,
  {grid: 128, fit: "aspect"})` (bbox-crop + aspect-fit resample, removes framing differences) and
  `iou(a, b)`. `src/form/resemblance.mjs` `formScores` is the precedent: meshIoU = IoU of two
  normalized silhouettes from *different* sources (GL render vs rasterized mesh).
- **The existing multi-angle gate** itself is GL render + LLM judge (resemblance), not IoU — the
  ticket's cage tolerance is a *new, deterministic* check, but every ingredient (per-azimuth mesh
  silhouette, normalize, IoU) is shipped and pure.

GLBs on disk for all three subjects: `benchmarks/sculpture/glb/{cottage,stone-gatehouse,church}.glb`
(paths declared per subject in `durable-skin.mjs` `SUBJECTS[*].glb`).

## Cage precedent (accept/rollback)

- `src/revise/loop.mjs` (E-15): candidate tweak → score gate (strict improvement) → accepted or
  **rolled back with a trace entry** `{scoreBefore, scoreAfter, accepted, …}`; locked regions.
- `src/form/surgical-standard.mjs` `p14SafetyCheck(trace)`: post-hoc verification that the cage
  held (kept-non-improving / overlap violations). Pattern to follow: failing steps are *recorded*,
  never silently kept; the trace is part of the durable record.

## Protected sub-regions

- `openingRegions(occ)` → world AABBs; `inRegion(pos, regions)` membership test (shipped).
- Chimney precedent: `protrudingStackRegion(occ)` in `benchmarks/sculpture/spray-paint.mjs`
  (procedural — cells forming a stack above the roof ridge; no subject constants). Lives in a
  runner today, not in `src/`.
- "Thin features" have no existing detector; thinness is measurable from the occupancy (e.g. a
  cell column/wall ≤1–2 cells thick — erosion-sensitive by construction).

## Conventions and constraints that bind this ticket

1. **Pure core in `src/`, impure runner in `benchmarks/sculpture/`**; `npm test` globs only
   `src/**/*.test.mjs`. No GL, I/O, Date, or randomness in cores (double-run byte-identity is
   asserted by the milestone runners).
2. **No subject-specific constants in cores** (E-25 Rule 3): radii/tolerances are op parameters;
   zone policy and regions come from the caller.
3. **Artifact contract is ADD + RECOLOR only**: erosion (cell removal) must go through
   `rebuildArtifact` (componentStrip precedent), and must carry `forms`/`states` (T-097 fixtures).
4. **Honest failure** (E-25 Rule 6): gates THROW or record FAIL; rolled-back steps must appear in
   the record (ticket: "recorded — never silently kept").
5. **Renders are a lens, never logic** (`tryRender` best-effort pattern); evidence frames are
   committed to `pr/assets/frames/`.
6. **Reproducibility**: `reproducibility-excludes-gl-from-decisions` — decision gates must be
   GL-free; the cage must therefore measure silhouettes purely (rasterizer, not GL render).
7. npm script naming: `shell:cottage` / `challenge:church` / `styled:cottage` — a new stage gets
   the same per-subject named-chain treatment.

## Assumptions to carry into Design

- Shells are **solid-filled** masses (voxelizeGlb parity fill), so erosion peels the surface and
  opening (erode→dilate) deletes only what dilation cannot regrow — spikes/fins; but it equally
  deletes *legitimate* thin features (chimney) — exactly why the AC demands protected regions.
- The cage compares **before vs after IoU at the same azimuth** (drift tolerance), both sides
  produced by the same pure rasterizer — camera framing differences cancel via the
  normalize-then-IoU precedent.
- Church's styled chain is kit-blocked, but its **shell** exists under `challenge/` — the ticket's
  three-subject run is satisfiable today.
