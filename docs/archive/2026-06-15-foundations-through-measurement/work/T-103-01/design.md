# T-103-01 component-decomposition — Design

Decisions for the decomposition core, the component-record contract, GLB involvement, and the runner.
Each decision lists the options considered and why one wins, grounded in research.md.

## D1. Where the core lives, what it consumes

**Options:** (a) `src/view/` next to structural-read; (b) `src/form/` next to the GLB/kit machinery;
(c) extend structural-read itself.

**Chosen: (b) `src/form/component-decompose.mjs`** consuming the **Map-occupancy** (view shape) plus
optional GLB mesh data. The record feeds the form pipeline (S-104/S-105/S-106 are form-side), and the
module imports from both layers exactly like `multi-angle-gate.mjs` and `kit-presence.mjs` already do
(form modules importing view primitives is established; the reverse is not). (c) is rejected: T-102's
session may be live and structural-read is a shared dependency — we make only one **additive** change
there (D5) and keep everything else in new files.

## D2. Attached-mass segmentation (tower vs nave, chimney)

**Options:** (1) 3-D erosion-until-split + watershed regrow; (2) plan-space segmentation on the
column heightfield with gap-based height clustering; (3) GLB-driven mesh segmentation.

**Chosen: (2), heightfield plan segmentation.** Masses that matter downstream are vertical prisms in
plan (tower footprint vs nave footprint; chimney footprint). Algorithm, all deterministic:

1. Heightfield `H(x,z)` = top solid y per column (exactly `roofRegion`'s cells). Build an
   **analysis copy** `H̃` = 3×3 median of H (robust to the 276-protrusion class of noise — a spike is
   a single-column outlier the median ignores; works on raw AND regularized shells, the tolerance AC).
2. Sort the unique values of `H̃`; split into **height classes** at gaps ≥ `max(3, 0.12·heightRange)`.
   A continuous gable slope produces no gap (one class); a tower above a nave produces one (two
   classes). No subject constants — the rule is relative.
3. 4-connected plan components per class = mass candidates. A candidate with area <`minMassArea` (12
   columns) and height above its surrounding mass ≥3 is a **protrusion mass** (the chimney) —
   `protected: true` (E-27 Rule 2 vocabulary). Other small candidates merge into the neighbor with
   the longest shared plan boundary.
4. **Junction surface** between adjacent masses = the shared plan boundary edge × the overlapping
   y-range (a vertical rectangle, recorded as axis/line/bounds); a protrusion mass's junction is its
   base footprint at the host's local top surface.

(1) is rejected: expensive at 50k cells, ordering-sensitive, and hard to unit-test crisply. (3) is
rejected as primary: GLB↔shell alignment is exact only for church (research §5) — the mesh becomes a
*reference*, never the segmentation substrate (which is also the epic's thesis applied to ourselves:
we decompose the build we actually have).

## D3. Roof-plane extraction + the GLB fit

**Options:** (A) GLB normal clusters as hypotheses, voxels assigned to them; (B) voxel heightfield
region-growing, GLB used to *refine and score* each found plane; (C) voxel-only.

**Chosen: (B).** Per non-protrusion mass, on `H̃` restricted to the mass (protrusion columns
excluded — the chimney must not bend the plane fit):

1. Deterministic region growing: scan cells in (x,z) lex order; seed an unassigned cell, fit a plane
   to its 3×3 neighborhood by least squares, BFS-grow accepting a neighbor when its `H̃` residual to
   the current plane is ≤1.25; refit every 16 accepted cells (incremental sums — exact LSQ, no
   randomness). Regions <`minPlaneArea` (8 cells) dissolve into the adjacent plane of min residual.
2. Adjacent regions whose planes agree (normal angle <10°, offset <1) merge. Classify
   `flat` (|gradient| < 0.15) vs `pitched`.
3. **Eave edge** = region boundary cells adjacent to outside-the-mass plan (or to a ≥3 drop) on the
   plane's downhill side (height within 1.0 of the plane's minimum over the region). **Ridge
   candidate** = the shared boundary polyline of two regions with opposing gradient directions
   (dot < −0.5), recorded with its fitted axis line + y; absent for flat caps (church tower).
4. **GLB fit (Rule 1):** align mesh→voxel by the per-axis AABB affine (exact-scale path used when the
   registry records `provision.scale` — church); take mesh triangles whose aligned centroid falls in
   the region's plan extent and whose normal is within 25° of the voxel plane; the area-weighted LSQ
   plane over those triangles is the **glbFit**, recorded beside the voxelFit with angular deviation,
   offset delta, supporting-triangle area, and rms. No matching triangles ⇒ `glbFit: null` + a named
   finding in the record (honest fallback — the regularized sampled mass stays authoritative).

(A) is rejected: a decimated TRELLIS mesh's normal field is noisy and full of wall/ground triangles;
making it load-bearing couples segmentation quality to alignment quality for the two subjects where
alignment is approximate. (C) fails the AC's explicit "GLB plane fits" and forfeits the reference
anchor S-104 needs.

## D4. Wall slabs

Per mass, per side dir (`+x,-x,+z,-z`): project the mass's surface cells (reusing `projectSurface`
on a mass-filtered occupancy), histogram the depth coordinate, take the modal depth band (mode ±1) as
the slab; record `{axis, value (world), normalDir, boundsWorld, coverage}` where coverage = band
cells / face cells. Multi-mass subjects get per-mass slabs automatically (the church tower's +x wall
is a different slab than the nave's). Slanted/noisy faces show up as low coverage — recorded, not
hidden. Rejected: full 3-D plane fit per wall (walls are axis-aligned in voxel space by construction;
the general fit adds nothing downstream consumes).

## D5. Opening groups + head/jamb geometry

`openings(occ, dir)` computes per-cell aperture shapes (`cellsUV`) but does not return them
(research §3). **Chosen: additive opt-in** — `openings(occ, dir, {withCells: true})` returns
`cellsUV` per opening. One small, behavior-preserving edit to `structural-read.mjs` keeps the ONE
enclosed/door definition (the detector→op contract must not drift — established invariant). Rejected:
re-deriving apertures in the new module from `airComponents` (forks the classification rules).

Lifting to geometry, per opening: map uv→world via `orthoSpec` (+ the face's slab depth); record
world bbox, **sill** y, **jambs** (the two vertical edge lines), and the **head profile** = top y per
column. `archCandidate: true` when the profile is non-flat, peaks centrally, and rises ≥2 over the
jamb tops; record `spring` (y where width first narrows) and `crown` (peak y). The full circle fit is
S-105's job — the record carries the measured profile so S-105 fits from data, not from a re-read.
**Groups:** openings on one face with v-aligned bboxes (±1) and equal size (±1) form one group
(window rows); singletons are groups of one.

## D6. The component record (the contract)

`component-record/v1`, one JSON per subject at `benchmarks/sculpture/components/<subject>.json`,
validated by a real JSON Schema at `schema/component-record.schema.json` (ajv — repo convention).
Top level: `{schema, subject, source {shellPath, sha256, regularized: bool|null}, alignment {mode:
"registry-scale"|"aabb-affine", voxelSize|scales, offsets}, bounds, masses[], roofPlanes[],
wallSlabs[], openingGroups[], findings[]}`.

- **masses**: `{id, role: "primary"|"attached"|"protrusion", protected, plan: columns as sorted
  [x,z] runs ({z, x0,x1} rows), yRange, volume, junctions: [{withMass, axis, line, yRange}]}`.
  Column-run representation keeps the record ~tens of KB (research §9), exact, and diff-friendly.
- **roofPlanes**: `{id, massId, kind: "pitched"|"flat", voxelFit {normal, point, rmse, maxResidual},
  glbFit {normal, point, rmse, areaSupport, angleToVoxelDeg} | null, extent {cells [x,z] runs,
  bbox}, eave {cells, line|null}, ridge {cells, axis, y} | null}`.
- **wallSlabs**: `{id, massId, dir, axis, value, boundsWorld, coverage}`.
- **openingGroups**: `{id, massId, dir, kind, openings: [{bboxWorld, sillY, jambs, headProfile,
  archCandidate, spring|null, crown}]}`.
- **findings**: named honest gaps (`glb-fit-missing @ roofPlane:2`, low slab coverage, …).

Downstream (Rule 4) consumes this file only; no consumer-specific variants. Cell lists are sorted;
JSON is canonical (stable key order via builder); the record is byte-deterministic.

## D7. Runner, visualization, scripts

New impure runner `benchmarks/sculpture/component-decomposition.mjs`, shaped like
shell-integrity/challenge-milestone (research §6):

- Subjects from the durable-skin registry; a runner-local **registry data** table adds per-subject
  shell paths (`styled/<s>/shell-artifact.json` for cottage/gatehouse, `challenge/church/
  shell-artifact.json`) and **pinned expectations** (cottage: 2 pitched roof planes + 1 protrusion
  mass; gatehouse: ≥1 arch candidate; church: ≥2 masses with ≥2 roof forms) — hard-asserted, the
  shell-integrity `expect` idiom. `--shell <path>` overrides the input (the T-102 tolerance seam: the
  same command runs on a regularized artifact the day it exists).
- Determinism: core runs twice; record JSONs must be byte-identical; sha256 recorded; `--offline`
  re-asserts committed record + shell hash without recompute.
- **Visualization:** build a component-colored artifact (distinct wool/concrete per mass and per roof
  plane, red for protrusion masses, jamb cells outlined in black concrete) via `rebuildArtifact`-style
  template reuse; render the two oblique azimuths (`+x-z`, `-x-z`) with `renderViews`; compose a
  sheet with `montageRow`; PNGs gitignored except the committed evidence frame
  `pr/assets/frames/components-<subj>.png`. Color assignment is part of the runner (presentation),
  not the record.
- npm scripts: `components:cottage|gatehouse|church`. No edits to styled-milestone.mjs or any
  T-102-adjacent file; package.json additions are append-only (accepted overlap).

## D8. Testing strategy (Design-level)

Pure core unit-tested on **synthetic shells** built with `occupancyFromCells`: a gabled box with a
chimney (expects 1 primary + 1 protected protrusion, 2 pitched planes, ridge, 4 eaves, 4 slabs); a
two-prism "church" (2 masses + junction); a wall with an arched doorway (head profile + arch flag);
a flat-roof box (1 flat plane, no ridge); spiky variants (median robustness). GLB-fit math tested on
synthetic triangle soups (no real GLB in unit tests — files are MBs, parse is already covered by
glb-mesh tests). Schema validated in-test with ajv against a synthetic record.

## Rejected wholesale

- RANSAC/randomized fitting (determinism rule), erosion-watershed mass split (D2), GLB-primary
  segmentation (D3), embedding per-cell mass labels in the record (size; runs encode the same),
  wiring into styled-milestone now (downstream stories unbuilt; T-102 file-collision risk).
