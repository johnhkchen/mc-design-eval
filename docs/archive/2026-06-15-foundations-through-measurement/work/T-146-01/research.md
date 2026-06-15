# T-146-01 — Research

Story S-146 (relief-by-construction), epic E-35. The crux ticket: skinning today is
**recolor-on-fixed-geometry**, and recoloring a voxelized smooth box can never make a pilaster
proud of its infill. Relief must be **construction**. This phase maps what already exists so the
shared relief op can be a *generalization of proven mechanisms*, not a new invention.

## The recolor world (what relief is NOT)

- `src/view/face-paint.mjs:9-13` — "PAINT IS A RECOLOR, NOT A MOVE … a paint is just an appended
  `{op:"voxel", pos, block}` at an EXISTING surface voxel … There is NO air op
  (`facade-recess-by-exclusion`): paint never removes a voxel, only re-blocks it."
- `src/view/zone-fill.mjs:12-16` — "FILL IS A RECOLOR, NOT A MOVE … Surface = the union of the five
  exposed-face projections, deduped by voxel — exactly the skin the render lens sees; interior cells
  are never touched." One dominant block per zone.
- Consequence (memory [[facade-grammar-recolor-vs-construction]]): the boxy/flat look is recolor on
  fixed geometry; relief must be CONSTRUCTION. The no-air-op rule **stands for paint** — it is a
  property of the workshop paint canvas, not a defect to fix.

## The construction mechanism already ships (the generalization seed)

Two production modules already emit cells PROUD of the wall plane, in front of existing shell cells:

### `src/view/clinker.mjs` (`clinkerCourses`) — the charter to copy
- Header (lines 1-12) states the exact contract the relief op must inherit: proud layer emitted
  **only in front of EXISTING zone wall cells**, so the wall's in-plane silhouette (gable rake
  included) is **preserved by construction — no board can protrude past the rake line**; idempotent
  (a cell already carrying the material neither repaints nor re-laps); **PURE — no GL/IO/Date/random,
  byte-stable placement order**.
- Mechanism (lines 50-99): build the per-face exterior skin via `projectSurface(occ, face)` (first
  occupied voxel per ray); iterate `[...occ.cells.entries()].sort()` (byte-stable); for an eligible
  proud cell, for each exposed face compute `out = pos + DIR[face]`, and `if (occ.has(...out)) continue`
  (idempotency + never tunnel into another mass), else push `{op:"voxel", pos:out, block}`.
- Signature: `clinkerCourses(occ, opts) -> {placements, report}`. opts: `{board, lap, course,
  trimBlock, zoneOf, zone, faces}`. `zoneOf` is **required** (the zone lens decides where boards go).
- Tests `src/view/clinker.test.mjs`: CL1 horizontal-course parity, CL2 alternating proud/flush, CL3
  zone containment, **CL4 the rake is honored — `wallPlane.has("x,y")` for every placement** (the
  in-plane silhouette proof), CL5 trim caps, **CL6 idempotent (second run on own output → 0
  placements)**, CL7 fail-loud opts gates.

### `src/form/idiom-constructs.mjs` (`jettyOverhang`) — the other proud precedent
- Lines 207-244: a bressummer course projected `overhang` cells past the wall line along an edge,
  optional joist ends beneath; returns `upperWallLine` geometry metadata. Same "project past the wall
  line" pattern, edge-parametrized rather than skin-parametrized. PURE, fail-loud, exhaustively
  orientation-tested (idiom-constructs.test.mjs Jetty group). Sibling proof the proud-emission idea
  generalizes across parametrizations.

### Recess by exclusion (memory [[facade-recess-by-exclusion]])
- No air op exists or is wanted. A recess is the **absence** of proud emission: proud pilasters with a
  field left at the base plane reads recessed. The op only ever ADDS proud cells; the recessed field is
  what the caller does NOT touch.

## The ruler the relief must not move (E-34)

`src/form/silhouette-proportion.mjs`:
- `maskProportions(mask, opts)` (lines 209-251) — eave/ridge/ground lines from a silhouette mask via
  per-row **extent** thresholds (`ridgeMinWidthFrac`, `eaveWidthFrac`, skirt-aware `eaveReference`).
  Returns `{ridgeRow, eaveRow, groundRow, totalH, eaveH, maxExtent}`. **All height-bearing.**
- `elevationMask(occ, axis, {bbox})` (127-147) — orthographic elevation along x|z onto (u,y), row 0 at
  top. **This collapses the depth axis.** A proud cell at the same (u,y) as its wall cell sets the same
  mask bit → byte-identical mask along that face's own normal axis.
- `ratiosFromMask` / `proportionRatios` (254-315) — `ridgeToEave = totalH/eaveH`,
  `roofShare = (totalH-eaveH)/totalH` (heights), `aspect = max/min plan bbox` (footprint plan).
- `compareRatios` (478-522) — the gate arithmetic; `excess` per row, relative tolerance 0.15.

**Key fact for the invariant:** relief lives *in front of the plane* (depth direction) and *never past
the rake* (only emitted in front of existing exterior cells). So on a relieved face's **own** ortho
elevation the depth collapses → the mask, and therefore `maskProportions`, are byte-identical. Heights
(`ridgeToEave`, `roofShare`) never move on *either* elevation because relief changes no y and honors the
rake. Only the **perpendicular** elevation's extent and the **plan aspect** widen by `depth` — that is
honest geometry (a pilaster genuinely sticks out, and *is* meant to be visible from oblique angles).
This is precisely clinker's CL4 scope: "in-plane silhouette." Memory [[proportion-loop-bent-ruler]] /
[[proportion-eave-latches-plinth]] warn that *base-plane width bands* (skirts) bend the eave detector —
relief that widened a bottom band could trip the skirt logic, so the harness must prove the in-plane
mask is byte-identical, not merely "close".

## The 2.5-D layer that can read relief (AC3)

`src/view/surface-grid.mjs`:
- `projectSurface(occ, dir)` (170-174) already records **per-cell `depth`** plus `voxel` and `normal`
  for every front-most surface cell, for the 6 ortho dirs and 4 ground diagonals (`SurfaceCell =
  {block, depth, voxel, normal}`, line 54). The depth field is exactly the signal a relief-aware read
  needs but nothing consumes it for relief today.
- `gridMaskOf`, `backProject`, `cellWorldPos` are the existing pure consumers. surface-grid is a
  **freely-importable core** (NOT in the brush-door TECHNIQUES list), so a relief-aware read can live
  here and be called from anywhere (workshop, gate, tests) without a door violation.
- Memory [[twodee-interaction-sector]]: hand the LLM a task-matched view, not 57k voxels. A relief
  read turns the depth field into proud/flush/recessed structure the workshop can *see*.

## The brush door (how the op reaches runners) — [[brush-door-export-not-allowlist]]

- `src/pack/idiom-registry.mjs` is the ONLY door to a build technique (E-32 Rule 1). New techniques
  enter by being imported **there** and registered. Pass entries (clinker `:321-346`, limewash
  `:347-372`) carry `kind:"pass"`, `fn`, `source`, `tests`, `composition {consumes, emits}`, an
  in-entry `preview {substrate, params, realize({occ,cells})}`, and `paramsSchema`. `overlayCells`
  (`:176-186`) merges placements last-writer-wins for the preview.
- `src/pack/brush-door.conformance.test.mjs` — `TECHNIQUES` list (`:29-36`) + exact `ALLOWED` map
  (`:39-75`). A new technique module MUST be added to `TECHNIQUES`; only `idiom-registry.mjs` (the
  door) may import it. The conformance sweep is closed over `src/{pack,recognition,workshop,form,view}`
  and `benchmarks/sculpture`.
- `idiom-registry.test.mjs` checks every entry's `tests` file exists & names the brush; brush-catalog
  realizes each pass preview. `getIdiom(name)` / `getBrush(name)` resolve at runtime.

## Sibling pure surface op — `src/view/limewash.mjs`

`limewashAspect(occ, {block, aspects, coverage, minRun, preserve}) -> {placements, report}` — a
directional, idempotent, deterministic-partial-coverage RECOLOR over the projected exterior skin. Same
PURE charter, same `projectSurface` skin lens, `preserve` set never overpainted, "selection grid
includes already-washed cells → second pass emits nothing." A clean structural template for opts
validation, the report shape, and the idempotency phrasing.

## Constraints / assumptions surfaced

1. **Repro is byte-frozen.** `--repro`/`--offline` runs must stay byte-identical; the op is additive
   and not invoked by any committed runner, so no pinned record changes (memory
   [[reproducibility-excludes-gl-from-decisions]], [[shared-file-commit-sweep]]).
2. **No per-building constants** (the SHAPED_DEFAULTS / CONFORMANCE_DEFAULTS posture): any default
   (depth, every, span) is a named frozen constant, never subject-tuned.
3. **`occ.has` / `occ.cells` / `bareBlock` / `occupancyFromCells`** are the occupancy contract used by
   clinker/limewash — reuse verbatim.
4. **Shared-file edits** to `idiom-registry.mjs` and `brush-door.conformance.test.mjs` are the
   blast-radius (memory [[pack-edit-blast-radius]], [[shared-file-commit-sweep]]): re-Read before each
   Edit, additive only, verify `npm test` green before commit.
5. The in-plane invariant is **clinker's CL4 generalized**; the perpendicular/aspect widening is the
   intended visible relief, explicitly out of the byte-unchanged claim.
