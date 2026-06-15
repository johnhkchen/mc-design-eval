# T-123-01 glb-conditioning — Design

## The shape of the problem

Four sub-capabilities, none existing today in mesh domain: (a) decimation to ~100 faces,
(b) normal snap to the Minecraft grammar + merge, (c) mirror-plane detection/application,
(d) rectilinear footprint fit. Plus a schema, a visualization, a runner over the four registered
GLBs, and the no-coupling guarantee.

The load-bearing design question: **which domain does each step run in — raw mesh or an internal
occupancy sampling?** Research showed strong, tested machinery in voxel domain (`segmentMasses`,
`heightfield`, `componentLabels`) and only parsers in mesh domain.

## Decision 1 — hybrid substrate: planes from the mesh, body measures from an internal sampling

- **Plane extraction (a+b) runs on the raw triangle soup** (`parseGlbMesh`). This is the part that
  must be upstream — the grammar snap is the whole point, and snapping after voxelization would be
  E-27-style surgery again.
- **Symmetry, footprint, masses, proportions run on an internal occupancy sampling** of the same
  mesh: `voxelizeGlb(glb, { scale: SKETCH_SAMPLE_SCALE })` with a **declared** internal scale (48;
  scale must be in [8,64]). Rationale: these are *measurements of the body*, robust to soup noise,
  and the voxel-domain machinery for them is mature and deterministically tested — in particular
  `segmentMasses` (component-decompose.mjs:215) already solves "tower above a nave = two masses"
  via height-class splits, which is exactly the church criterion. Re-deriving mass segmentation in
  mesh domain would be new untested geometry for zero upstream benefit.
- The internal sampling is a **measurement substrate, not a build path** — nothing downstream
  receives it; the sketch JSON is the only output. This preserves "conditioned before anything
  reads it" in the sense that matters: consumers read the sketch, not the mesh or the sampling.
  (Note: `voxelizeGlb` output is solid occupancy — fine here; `segmentMasses` works on the top
  heightfield, and the known "solid shells break storey lines" footgun applies to interior-floor
  detection, which we do not attempt.)

**Rejected: pure mesh domain for everything.** Mirror symmetry over a 100k-triangle soup needs
point-set chamfer machinery (new, fiddly tolerance choices); footprint from projected triangles
needs polygon booleans (new dependency or hand-rolled). Both reinvent what occupancy gives for free.

**Rejected: pure voxel domain for everything.** Plane orientations quantize badly at scale 48
(staircase normals); the snap residual — the honest "how non-grammatical was this mesh" signal —
is only measurable against true face normals.

## Decision 2 — decimation and snap are ONE operation: snap-then-merge region clustering

Classic decimation (QEM edge collapse) ranks geometry by *its own* error metric — it works to
preserve exactly the lumps we want gone, then we'd snap afterwards anyway. Since the target
grammar is known a priori, invert the order:

1. Per-triangle: compute normal + area; **classify to the nearest grammar orientation**
   (angular distance), recording the residual angle.
2. Weld vertices on a quantized grid (declared `WELD_EPS` = 1e-4 of the bbox diagonal) to recover
   adjacency from the soup; region-grow across shared edges **within the same snapped
   orientation** → planar regions.
3. Each region becomes one **coarse face**: snapped normal, offset = area-weighted mean of
   (snapped normal · triangle centroid), area share, mean/max residual.
4. Keep regions by descending area until `FACE_TARGET` (declared, 100) is reached; record the
   dropped-area fraction honestly (no silent truncation).

This satisfies AC (a) and (b) with one mechanism whose output is grammatical *by construction*.

**Grammar set (declared, exported):** the 6 axis normals plus the 45° roof family — the 4
upward diagonals (±1,+1,0)/√2, (0,+1,±1)/√2 and their 4 downward mirrors (for eave undersides and
overhangs): **14 orientations**. The epic's "roughly eight" counts the 6 axes + the up-45 family
as one class; enumerating downs costs nothing and avoids misclassifying underside faces into walls.

**Rejected: RANSAC plane extraction** — derandomizing it is more work than not needing it; the
candidate set is known. **Rejected: snap-after-QEM** — see above.

## Decision 3 — symmetry: axis-aligned candidate mirrors, occupancy-IoU score, residual-based better half

Minecraft's grammar admits axis-aligned mirrors only, and the whole TRELLIS pipeline already
assumes gross axis alignment (registry `frontDir`/`sideDir`). So candidates are planes
`x = c` and `z = c` only. For each axis: sweep `c` over cell-center and cell-boundary positions
within the middle half of the bbox; score = **IoU of the occupancy with its reflection**
(|occ ∩ mirror(occ)| / |occ ∪ mirror(occ)|). Dominant plane = argmax; deterministic tie-break
(lower axis index, then lower offset).

- **Confidence threshold (declared): `SYMMETRY_CONFIDENCE = 0.80`.** Below it: no mirror applied,
  subject recorded asymmetric, score still recorded (AC requirement). 0.80 separates "noisy but
  symmetric building" (reflection IoU degrades roughly linearly with surface noise; a clean house
  with TRELLIS-grade wobble stays well above) from genuinely asymmetric compositions; it is a
  declared universal constant, not tuned per building — synthetic tests pin both sides of it.
- **Better half = the straighter half**: mean area-weighted snap residual of the coarse faces
  whose centroids fall on each side; keep the lower-residual half. Application = replace the other
  half by reflection, in *both* outputs: coarse faces (mirror the kept half's planes) and the
  occupancy mask handed to footprint/proportions (mirror the kept columns). Recorded:
  `{ axis, offset, score, threshold, applied, keptSide }`.

**Rejected: arbitrary-orientation PCA mirror** — grammar forbids non-axis mirrors downstream, so
detecting one could only produce an unusable answer. **Rejected: mesh-point chamfer scoring** —
occupancy IoU is the same signal with mature deterministic plumbing.

## Decision 4 — footprint: project, trace, snap jogs

From the (post-symmetry) occupancy: ground-plan mask = all columns with any solid cell (the eave
overhang question is a recognition concern, not a conditioning one; the mask is the body's plan).
Then: trace the mask's outer boundary (grid edges — already rectilinear at cell resolution),
merge collinear runs, and **snap away jogs shorter than `FOOTPRINT_SNAP_TOL`** (declared, 6% of
the longer plan dimension, in cells) by extending the dominant neighbor edge. Output: axis-aligned
polygon (vertex list, CCW from min corner — deterministic), `isRectangle` flag, plus per-mass
rectangles from `segmentMasses` bboxes. Barn AC: jogs from mesh wobble are < tol → 4 vertices.

**Rejected: min-area rotated rectangle** (not rectilinear-polygon general), **rectangle
decomposition of the mask** (answers "which rectangles tile it", not "what is the outline").

## Decision 5 — proportions: relative first, block-equivalent via registry scale

Raw GLB units are arbitrary and absolute offsets are unreliable under aabb-affine (memory).
The sketch reports:
- `eaveY` = highest occupancy layer whose plan area ≥ `EAVE_AREA_FRAC` (declared, 0.80) of the
  footprint area; `ridgeY` = top layer. Reported as fractions of total height.
- **Roof pitch class from raw (pre-snap) normals**: area-weighted dominant tilt of upward
  non-horizontal faces, bucketed (declared): `flat < 15° ≤ low < 35° ≤ pitched45 < 55° ≤ steep`.
  Measured pre-snap so a steep barn roof is not laundered into "45" by its own snap.
- `storeyCandidates`: using the registry's per-subject working scale (`generated.scale`, registry
  data not a constant), express eave height in block-equivalents; candidates n ∈ 1..4 with
  per-storey blocks in the declared plausible band [3, 6] are flagged. Candidates, not verdicts —
  recognition decides (E-31 Rule 3).
- `massCount` + per-mass `{ bbox, role: "body" | "protrusion" }` from `segmentMasses` (defaults).

## Decision 6 — schema, visualization, runner, guards

- **Schema `form-sketch/v1`**, one JSON per subject at `benchmarks/sculpture/form-sketch/{key}.json`
  (per-feature-dir convention). Contents: declared params block, source GLB sha256, normalization,
  coarse faces, grammar stats (area share per orientation, residual stats), symmetry, footprint,
  masses, proportions, `reproducible.sha256` of the derivation. **No timestamps** (byte-repro).
- **Visualization without GL** (deterministic, pngjs): one sheet PNG per subject —
  plan panel (mask + fitted polygon + mirror plane) and two elevation panels (occupancy
  silhouettes with eave/ridge lines), drawn by a pure pixel-buffer module; mesh silhouette overlay
  via `rasterizeSilhouette` for the at-a-glance GLB comparison. Plus a small `{key}.md` table.
- **Runner** `benchmarks/sculpture/form-sketch.mjs`: `--subject <key>|--all`, resolves via the
  `SUBJECTS` registry import (registry-only), `--repro` re-derives and sha-compares, writes through
  the **pin guard** (`guardedWriteRecord`, T-119 — new committed-record writer ⇒ must be guarded).
  npm scripts `sketch:<subject>` with direct `node` invocation (flag-swallowing footgun).
- **No-coupling proof**: the only importer of the sketch dir/schema is the runner + tests; a grep
  recorded in review.md (and the existing generalization grep stays green — keep subject names out
  of src/form comments).

## Determinism posture

All constants declared and exported; sorted/stable iteration everywhere (the reused modules
already are); no `Math.random`/`Date`; double-run byte-compare asserted in tests and re-proved by
`--repro`. Decimation, snap, IoU sweep, boundary trace, and jog-snap are all exact, order-fixed
computations.

## Test strategy (synthetic meshes, pure, offline)

In-memory triangle-soup builders (box, gabled prism, L-plan, two-mass tower+nave, noisy variants
with deterministic vertex perturbation): snap classification incl. 44°/46° boundary cases; region
merge to ≤ FACE_TARGET with 6 faces on a noisy box; symmetry above/below threshold + better-half
choice under one-sided noise; footprint jog-snap (rectangle) and L-plan (6 vertices); pitch-class
buckets; mass count 2 on tower+nave; byte-determinism double-run. Real-GLB assertions live in the
runner output (committed records), not in unit tests.
