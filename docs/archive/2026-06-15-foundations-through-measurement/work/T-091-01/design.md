# T-091-01 shell-integrity-and-debris — Design

Decisions for the three ops (component strip, void repair, six-direction closure), grounded in the
research measurements and three throwaway prototypes run on the witnessed artifacts (numbers below are
from those runs, 2026-06-10).

## D1. Component strip keeps the largest component PLUS grounded components

**Rejected: literal keep-only-largest** (the AC's surface reading, `pruneStrays`' relative-floor rule).
The gatehouse's 1259-cell second component is a grounded, central, *visible* standing structure (the
inner passage/door leaf seen through the arch) — 17.7% of the main mass, so `pruneStrays`' 0.5-relative
floor also drops it. Deleting it is a witnessed-render regression and violates AC2's "arch is preserved"
spirit.

**Chosen**: keep the largest 6-connected component and any component whose min-y equals the occupancy's
ground plane (`bounds.min[1]`); strip everything else; report every kept exception + every stripped
component (count, sizes) — S-091's "exceptions must be declared" satisfied by construction. Rationale:
*floating* is what makes debris debris; a grounded mass is a standing structure. No size constant, no
subject constant (E-25 Rule 3). Verified: cottage strips exactly **22 comps / 126 cells → 1 component**
(every cottage stray floats, min-y 2..25 vs ground 0) — the AC numbers hold; gatehouse keeps its inner
structure.

Deletion has no artifact op (`facade-recess-by-exclusion`), so the strip **rebuilds** the artifact:
one `{op:"voxel"}` per kept cell in `expandArtifact`'s canonical (y,z,x) order, manifest = sorted unique
placed blocks, template's `schema_version`/`metadata`/`style`/`palette_id` preserved (precedent:
`keysToArtifact`). Round-trip identity `artifactOccupancy(rebuild(occ)) ≡ occ` is the test anchor.
Per-voxel `state` is not carried (occupancy doesn't hold it; the pipeline never places fixtures — noted
as a limitation).

## D2. Void detection = per-face depth-BASIN fill with a relief floor (minDepth)

**Rejected: occlusion-counting** (exterior-reachable air with ≥5 of 6 axis rays occluded): the arch and
existing leaks make the whole hollow interior exterior-reachable — 3577 false cells on the 8.4k
gatehouse. **Rejected: global depth-median outliers**: conflates the pitched roof's gradual slope and
the arch with true recesses.

**Chosen**: a cavity is a **basin in a face's depth field** — deep relative to its own rim, exactly the
hydrological structure `regularizeRoofCourses` already uses on the +y height map. Per ortho face
(4 elevations + `+y`): priority-flood the projected depth field (outlets = cells missing a 4-neighbour,
i.e. the silhouette edge, seeded at own depth); a cell deeper than its spill level by **≥ minDepth** is
missing mass; patch by adding voxels from the spill depth down to the current surface (flush with the
rim — same "neighbour-flush" philosophy as `sealRoof`). `minDepth` default **3**, an op parameter like
`minRun`/`minKeep`, not a subject constant. Grounding (pocket-depth histograms): intentional facade
relief (timber framing, reveals, quoins) lives at depth 1–2 (cottage: 75–86 depth-1 cells per ±z face);
the witnessed defects are deep (cottage see-through slits: pockets 9–23; gatehouse cavity: 39–52; the
durable gatehouse slits: 24). An unfloored basin fill is catastrophic — it would flatten relief
(1571 adds on the cottage, 9602 on building/best).

**Allow-list** (AC: "the structural read's `openings` + the concept's visible door/window/arch
regions"): world-space AABB regions. Source: `openings(occ, dir)` bboxes back-projected through the full
depth axis (the arch = `door`, windows = `window`), computed on the **raw pre-seal** occupancy — the
openings the concept-derived build declared before `sealWalls` closed them. A basin cell whose fill
column intersects an allow region is skipped. A true concept-*image* opening reader does not exist in
the repo and is E-26 kit scope; using the raw build's own openings is today's honest, data-driven
equivalent (documented in the record). Regions are world AABBs (not uv bboxes) so they survive
bounds-changing stages between measurement and use.

## D3. Closure = ground-solid 6-dir flood vs ray-contained interior, per-direction mouths

**Semantics**: the camera never looks from below and in-world the build sits on terrain, so the ground
plane is solid: the exterior flood is seeded from sky + sides only (no padding below `min[1]`), and the
interior containment test counts a `-y` ray that exits the bbox as a HIT (terrain). Without this, the
open bottom dominates every verdict (`-y` was the largest mouth group on all subjects: 355–1334).

**Check** (`closureCheck`): air cells inside any allow region count as skin ("declared openings are
honorary skin" — otherwise a single legitimate window makes the whole interior "reachable" and the
verdict means nothing). Interior = 6-ray containment (breach-tolerant, reusing `watertightCheck`'s
logic but *without* the simulated hollow carve — we judge the build as it stands). Breach mouths =
flood-reached interior cells adjacent to flood-reached non-interior air, classified by entry axis →
**verdict per direction** `{+x,-x,+y,-y,+z,-z}`, plus `closed` overall. This is the AC's "watertightness
verdict per direction, not just plan view".

**Repair to guarantee the gate** (`plugClosure`): while not closed, fill all current mouth cells with
the owning zone's dominant and re-check (cap iterations; THROW if the cap is hit — never ship unclosed).
Occupancy grows monotonically so it terminates. Measured: after basin fill, residual plugs are small and
converge in one iteration (cottage 55, building/best 394, durable gatehouse 86 — vs 1258/2805/150
without basin-fill-first). Plug cells sit at the interior/exterior interface — render-invisible or
reading as zone material. Basin fill runs FIRST because it restores the *visible* surface plane (AC2's
before/after render); the plug is the closure *guarantee* (AC3's loud gate).

## D4. Materials: owning zone's dominant, policy-fed or census-derived

Patch/plug material = `zones[zoneOf(voxel)].dominant`. In the durable pipeline the zone policy exists
(`SUBJECTS[..].policy`). For the witnessed-artifact runner (`building/best` has no E-21 map), dominants
are derived from the build itself: `surfaceZoneHistogram(occ, zoneOf, {skin:"exposure"})` → each zone's
most common shell block. Subject-agnostic, no new constants.

## D5. Reuse over reimplementation

- **Connected components**: adapt the view `Occupancy` (cells Map) to the Int32 shape and call
  `componentLabels` from `src/form/voxel-components.mjs` (the one flood-fill core; labels align with
  cell insertion order). No fourth DFS.
- **Priority-flood**: extract the private heap+flood from `surface-pattern.mjs` as an exported pure
  `spillLevels(valueMap)`; `regularizeRoofCourses` delegates to it (behavior identical — existing tests
  pin it); the basin detector consumes it over `-depth`. One hydrology, two consumers.
- `projectSurface`/`orthoSpec`/`cellWorldPos` for face geometry and back-projection (depth→world:
  `w = near==="max" ? wHi−d : wLo+d`); `openings` for the allow-list; `structuralZones` for `zoneOf`;
  `occupancyFromCells` for overlays/rebuilds; `coverageGate` shape for the verdict object.

## D6. Placement in the pipeline (durable-skin.mjs) and the per-ticket runner

New pure module `src/view/shell-integrity.mjs` + tests; impure runner
`benchmarks/sculpture/shell-integrity.mjs` (`npm run shell:cottage` / `shell:gatehouse`) over the
WITNESSED artifacts (`spray-paint/cottage/artifact.json`, `building/best/artifact.json`) — asserts the
AC numbers (cottage 23→1, −126), repairs, gates, renders before/after (front + oblique 135°/225°),
writes the committed record + frames (mirrors `surface-pattern.mjs`'s role for T-087).

`durable-skin.mjs buildSkin` gains three stages (order, with rationale):
1. **strip** right after value-true substitution (debris must not feed zones/projections);
2. **void repair (basin)** after seal + zones (needs `zoneOf`; patches then get skinned by the
   full-shell `zoneFill`, so they land *before* the fill); allow regions measured on the pre-seal
   occupancy;
3. **plugClosure + closureCheck terminal gate** after course/salt (those stages only add/recolor and
   cannot open holes): plug, then `closureCheck` must report `closed` or the run THROWS — a gate, not a
   logger.

Re-running `skin:cottage`/`skin:gatehouse` regenerates the committed durable records (sha256 changes are
the expected consequence of a pipeline upgrade — same as T-090's; `--offline` re-asserts the new ones).

## D7. Rejected alternatives (summary)

- `watertightCheck` as the gate directly: fails on every committed build today; simulates a hollow
  rather than judging the standing build; no per-direction verdict; no openings allow-list.
- Plug-only repair (no basin stage): closes the gate but leaves the witnessed cavity visually unrepaired
  (plugs land at the inner interface, not the wall plane) and triples the added mass.
- Filling all flood-reached interior air: 2.5k+ cells on the cottage; defeats the E-23 hollow path.
- Concept-image-derived opening regions: no reader exists; would couple T-091 to E-26's unbuilt kit.
- 26-conn strip or relative-size floors: still deletes the gatehouse inner structure (it is 26-conn
  isolated; 0.18 of main).

## D8. Risks

- `minDepth=3` fills the cottage's handful of 3-deep ±z pockets — if the after-renders show flattened
  intended detail, the parameter is data (per-call), not a constant to retune in code.
- The closure gate on `building/best` adds ~394 plug cells on a 57k build (0.7%) — acceptable, recorded.
- Oblique sky paths that never cross ray-contained interior (thin verge slits) are invisible to the
  closure flood; the basin stage catches the deep ones; the oblique renders are the honest residual
  evidence (AC4 is checked visually on the committed frames).
- Determinism: all ops iterate Maps/Sets in insertion order from canonical inputs; mouths are sorted
  before filling; double-run byte-equality stays the pipeline proof.
