# Design — T-084-01 surface-coherence-ops

Decisions, grounded in the Research map. Three deliverables: a **watertight roof op**, a **coherent
wall-skin op**, and a **watertight shell check** — all pure/deterministic, unit-tested, then run on the
cottage with before/after numbers.

## D1 — Output shape: placement deltas, not occupancy mutation

**Chosen:** the ops emit append-only **placement deltas** (`{op:"voxel", pos, block}`) and a helper applies
them to the artifact, exactly like `face-paint.applyPaint`. Re-derive occupancy via `artifactOccupancy`
when we need to *measure* the result.

- **Why:** the artifact is the source of truth; `expandArtifact` last-write-wins makes a recolor "free"
  (append a voxel at an existing pos) and a hole-seal a new voxel — no geometry deletion, honouring
  `facade-recess-by-exclusion` (no air op). AJV stays valid because we only ever place the dominant/field
  material, already in the manifest. Mirrors the established write-back seam, so downstream (T-080-01) keeps
  consuming artifacts, not a bespoke mutable occupancy.
- **Rejected — mutate `occupancy.cells` in place:** occupancy is a derived read model (a Map with closures);
  mutating it desyncs from the artifact and invites a second expansion path. The Research note "never refork
  expansion" rules this out.
- **Rejected — return a brand-new occupancy only:** loses the artifact lineage T-080-01 and the renderer
  need; we'd have to invent an occupancy→artifact serializer. Deltas + `applyPaint` already exist.

## D2 — "Hole" = enclosed air component (shared definition)

A hole is a cell **inside the silhouette/outline** with no surface voxel — *not* a bbox corner open to the
border. This is exactly `structural-read`'s `airComponents` enclosed test (`!top&&!bottom&&!left&&!right`),
already used by `wallFields.holes` and `openings`.

**Chosen:** **export `airComponents`** from `structural-read.mjs` and reuse it in the seal ops over
`gridMaskOf(projectSurface(occ,dir))`. One definition of "enclosed", used by the detector, the wall fields,
and the seal — they cannot drift.

- **Rejected — re-implement a local flood in the seal module:** duplicates the border-tagged BFS and risks a
  subtly different enclosed test than the detector flags, breaking the detector→op contract. Export is a
  one-line surface change with no behavioural risk (pure function, already covered by structural-read tests).

This fixes the roof-coverage measurement too: `roofRegion.coverage` is over the full +y bbox grid (corners
included), so the AC's "roof coverage → 100%" is measured over the **roof outline** = filled cells ∪ enclosed
holes. After sealing the enclosed holes, outline coverage → 1.0 by construction.

## D3 — Sealing a hole: where does the new voxel go?

A hole cell `(u,v)` has no `SurfaceCell`, so no stored `voxel`. We must synthesize a world pos.

**Chosen:** seal the hole **flush with its neighbours** — take the world depth (axis-W coord) of the
front-most filled 4-neighbour in the grid, and place the field/roof block at `(u,v)` on that depth plane.
Compute the world pos with the ortho spec: `pos[axisU]=worldOnAxis(min,max,signU,u)`,
`pos[axisV]=worldOnAxis(…,signV,v)`, `pos[axisW]=neighbourW`. A new tiny exported helper
`cellWorldPos(occ, spec, u, v, w)` in surface-grid (or re-derived inline) does the mapping.

- **Why flush-with-neighbour:** the roof/wall is not a single flat plane (eaves, a sloped roof), so a global
  "roof y" would punch voxels at the wrong height. The local neighbour depth keeps the seal on the same
  surface as the gap it closes. Deterministic: pick the **front-most** (min depth) neighbour, ties broken by
  grid order, so the result is a pure function of the occupancy.
- **Rejected — fill the whole interior column:** that's a hollow-filling, not a skin seal; it would defeat
  T-080-01 (re-solidify the mass we want to carve).
- **Rejected — fill at `roofRegion.yRange` top:** wrong for sloped/multi-height roofs; over-fills.

We **export `cellWorldPos` + the `worldOnAxis` mapping** from surface-grid (currently internal) so the seal
op reconstructs positions without re-deriving the projection math. Minimal, pure, additive export.

## D4 — The roof op `sealRoof`

`sealRoof(occ, { dominant?, patches? })` → `{ placements, stripped, filled, before, after }`.

1. **Determine the field block** = `dominant` arg, else the dominant roof block from `roofCandidates`
   (`structural-read.roofRegion` → most-common block).
2. **Strip strays** — every roof surface cell whose `bareBlock ≠ dominant` → a recolor placement at that
   cell's stored `voxel`. (If `patches` from the detector are supplied, restrict to the union of detector
   `stray-material`/`wrong-tone` cells; default = all non-dominant cells.)
3. **Seal holes** — enclosed air components of the `+y` mask → one fill placement per hole cell at the
   neighbour-flush depth (D3), block = dominant.
4. **Measure** `before`/`after` outline coverage + stray count by re-deriving occupancy from
   `applyPaint(artifact, placements)`. AC target: coverage → 1.0, stray → 0.

## D5 — The wall-skin op `sealWallFace` / `sealWalls`

`sealWallFace(occ, dir, { fieldMaterial?, strip? })` → `{ placements, stripped, sealed, before, after }`.

1. **Field material** = `fieldMaterial` arg, else the dominant block of that face's `blockCounts`.
2. **Strip intrusions** — surface cells whose `bareBlock ≠ fieldMaterial` → recolor to field material. The
   wrong-material "random homes". (Intended openings are *air*, never surface cells, so they're untouched —
   the op cannot accidentally fill a window because a window has no front voxel to recolor.)
3. **Seal holes** — enclosed air comps of the face mask → fill at neighbour-flush depth, block = field.
4. `sealWalls(occ, opts)` folds the four side faces, merging deltas by `voxelKey` (a corner voxel shared by
   two faces is sealed once; last-write-wins parity with `mergePaints`).

**Note on aggressiveness:** stripping *all* non-field surface cells is the ticket's literal ask ("intrusions
re-assigned to the field material"). For a real multi-material wall this is configurable via `strip` (a
detector-supplied cell set). Default = strip-all-non-field, which is what the cottage (single stone field)
needs and what the synthetic tests pin.

## D6 — The watertight check `watertightCheck`

`watertightCheck(occ, { interior? })` → `{ watertight, interiorCells, reached, breaches }`.

Definition tied to T-080-01's "seal-before-hollow":
1. **interior** = the cells to be carved = `interior` arg, else the **enclosed mass** (all-6-occupied
   voxels, the `hollowableCore` set). Treat them as **air** (the simulated hollow).
2. **pad** the occupancy bbox by 1 on each axis; the padding ring is guaranteed exterior.
3. **flood** exterior air from every padded-boundary cell, 6-connected, **occupied cells block**.
4. **reached** = count of interior cells in the exterior flood set. **watertight ⟺ reached === 0**.
   `breaches` = the reached interior cells (capped sample) for the report.

Why this is correct and non-circular:
- A **solid** mass with an intact skin: carve the inner mass → a sealed cavity; exterior flood stops at the
  skin → `reached=0` → **pass**.
- A **breached** shell (a skin voxel missing): the cavity connects to outside through the gap → exterior
  flood leaks in → `reached>0` → **fail**. Sealing the gap (D4/D5) makes it pass.
- Independent of the seal ops (it consumes occupancy only), so it is an honest external verdict, not a
  tautology over what we just sealed.

**Empty/edge:** no bounds → `{watertight:true, interiorCells:0, reached:0, breaches:[]}` (vacuously sealed;
the runner notes "no interior to enclose").

## D7 — Module layout & the runner

One new pure module **`src/view/surface-coherence.mjs`** holds `sealRoof`, `sealWallFace`, `sealWalls`,
`watertightCheck`, `applyDeltas` (thin re-export/alias of the append pattern) + the small geometry helpers.
It imports surface-grid (projection + the new `cellWorldPos`), structural-read (the now-exported
`airComponents`, `roofRegion`, `wallFields`), hollowable-mass (`hollowableCore` for the default interior),
occupancy (`bareBlock`), expand (`voxelKey`). **No** model import, **no** GL, **no** API key — pure.

The runner **`benchmarks/sculpture/surface-coherence.mjs`** (`npm run coherence:cottage`) mirrors
`detector-routing.mjs`: load cottage → read → run the two **light-tier detectors (metered)** to source the
candidate flags → apply the pure seal ops → re-measure coverage + watertight → render before/after → write
`surface-coherence-report.json` + sealed artifact + PNGs to the work dir.

## D8 — Will the cottage pass?

Honest answer recorded as the deliverable. The ops strip every stray and seal every *enclosed* hole, so
roof outline coverage → 1.0 and the enclosed skin holes close. If a residual leak is a **border-open** notch
(open to the silhouette edge, not enclosed), the watertight check will **report fail** and the report names
the residual — a truthful pass/fail per the AC, and a precise hand-off to the strong-tier `seal-authoring`
op the routing table already reserves. The synthetic unit tests prove the ops *do* reach watertight on a
clean holed shell; the cottage run records reality.
