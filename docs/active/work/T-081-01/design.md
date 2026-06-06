# Design — T-081-01 nxm-floorplan-infill

Decide the architecture for the floorplan generator + plausibility gate + the metered steering call.
Grounded in Research; every choice cites the codebase reality it respects.

## The core decision: where the LLM/program boundary sits

The AC says the LLM **authors/steers a generator** that **partitions** the footprint, places floors at
storey lines, dividing walls, and aligned interior doorways; the program does the **bulk placement**; the
**floorplan reasoning is the metered call**; generator + gate are **pure/deterministic + unit-tested**.

**Three candidate boundaries:**

| Option | The metered call returns | Who computes the grid | Verdict |
| --- | --- | --- | --- |
| **A. LLM emits placements** | every wall/floor voxel | the LLM | ✗ violates "bulk placement is the program's job"; overflows context ([[surgical-edit-path-scale-limit]]); not deterministic |
| **B. LLM emits the full grid geometry** | exact xCuts/zCuts/door coords | the LLM | ✗ partial — the *partition* (an N×M divide) is mechanical; making the model do lattice arithmetic is the E-15 failure mode in miniature |
| **C. LLM emits a small steering SPEC; a pure generator partitions + places** | `{rows, cols, materials, doorPolicy, frontDoor?}` | the **program**, deterministically from the footprint | ✓ matches "authors/steers a generator" + "bulk placement is the program's job"; generator stays pure/testable; metered call is the *reasoning* (how many rooms, which materials, where the front door is) |

**Chosen: C — the program-author pattern, exactly as `hollowable-mass.mjs` splits it.** The strong-tier
call is the **floorplan reasoning**: seeing the plan + elevation renders and the structural summary, it
returns a compact `FloorplanSpec`. A **pure generator** expands that spec into the partition and the bulk
placements; a **pure gate** scores plausibility. This is the only option that satisfies all four AC
clauses at once and keeps the heavy logic in unit-tested pure code.

## The FloorplanSpec (the metered call's whole output)

```
FloorplanSpec = {
  rows: int≥1,            // N — partitions along z
  cols: int≥1,            // M — partitions along x   (N×M grid, the AC's literal ask)
  materials: { floor: <manifest id>, wall: <manifest id> },
  doorPolicy: "spanning", // open one doorway per adjacent room pair → a connected (reachable) plan
  frontDoor?: { face: "+x"|"-x"|"+z"|"-z", u: int }  // the exterior door the LLM SEES (geom read is []),
}                                                     // so the perimeter room behind it gets a doorway
```

Small on purpose: the model supplies **judgement the geometry can't** (room count appropriate to a
cottage, materials that read as floors/walls, the front-door position `openings()` can't extract —
Research constraint 5), and **nothing the program can compute** (the cut coordinates, the per-cell
placements). Parser defaults everything → a missing/garbled field degrades to a sensible plan, never a
throw (mirrors `parseHollowable`).

## The generator (pure, deterministic)

`storeysFromRead(read)` — derive storeys from `read.storeyBands.floorLines` (sorted): storey *i* =
`{floorY: lines[i], ceilY: (lines[i+1]-1) ?? wallTop}`. **Storey count = floorLines.length** — the
anchor the gate's "storey count matches" checks against. On the cottage: `[0,14]` → 2 storeys.

`gridPartition(bbox, {rows, cols})` — evenly divide the **interior** bbox (footprint bbox inset by 1 for
the perimeter wall) into rows×cols cells: `cols-1` interior wall-x lines, `rows-1` wall-z lines, computed
by integer interpolation. Returns `{interior, xWalls, zWalls, rooms:[{id,x0,x1,z0,z1}]}`. Pure lattice
arithmetic — exactly what the LLM should **not** do.

`interiorColumnsAtY(occ, y)` — the per-storey **inside-the-shell** mask (Research constraint 7): take the
(x,z) occupancy slice at height `y`, run `airComponents`, keep the **enclosed** components (the rule
`structural-read` already owns). Returns a `Set<"x,z">` of room-air columns at that height. This is what
gates every placed cell so floors/walls never poke through the gabled roof or the outer wall.

`generateFloorplan(occ, read, spec)` → `{ plan, placements }`:
- **plan** (abstract, for the gate): `{ storeys:[{index,floorY,ceilY,rooms,interiorCols}], grid, doors }`.
- **placements** (appended to the shell): per storey —
  - **Floor slab**: `materials.floor` at `(x, floorY, z)` for every interior column of that storey **not
    already occupied** (the y=0 foundation is already solid → skipped). Emitted as `voxel` ops (irregular
    footprint ⇒ per-cell, not one `fill` box; keeps it inside the enclosed mask).
  - **Dividing walls**: `materials.wall` at `(x, y, z)` for `y ∈ [floorY+1 .. ceilY]`, `(x,z)` on a grid
    wall line **∩ that storey's interior columns**, **minus doorway cells**.
  - **Doorways**: per `doorPolicy:"spanning"`, for each pair of grid-adjacent rooms pick the wall cell on
    their shared edge nearest the room centres and **exclude** a 1-wide × 2-tall gap (`floorY+1,floorY+2`)
    — the opening is the *absence* of wall ([[facade-recess-by-exclusion]]), never an air block. The
    `frontDoor` perimeter room additionally gets its interior doorway on the edge facing inward.

All placements are **interior-only** by the `interiorColumnsAtY` gate ⇒ `exteriorHeld` is true by
construction; we still **prove** it at runtime (reuse `exteriorSurfaceDigest`/`exteriorHeld` from
`hollow-carve.mjs` — Research constraint 2).

## The plausibility gate (pure, the AC's six constraints + Rule 7)

`gateFloorplan(occ, read, plan)` → `{ pass, constraints:[{name,pass,detail}], residual }`:

1. **roomsValid** — every room area > 0 (no degenerate cells after the integer divide).
2. **roomsNonOverlap** — within a storey, room column-sets are pairwise disjoint (the partition is a true
   tiling).
3. **reachable** — build a room graph per storey: edge iff a **doorway** gap exists in the shared wall;
   require the graph **connected** (union-find). The ground storey's front-door room must be in the graph.
4. **floorsAtStoreyLines** — every `storey.floorY ∈ read.storeyBands.floorLines`.
5. **storeyCountMatches** — `plan.storeys.length === read.storeyBands.floorLines.length`.
6. **gridFitsEnvelope** — `interior ⊆ footprint.bbox` and every wall line strictly inside it; every placed
   cell ∈ its storey's interior mask (nothing poking through the shell).
7. **openingsAlignShell** — each exterior opening (`openings()` per face) has an interior doorway in the
   perimeter room "behind" it. **When `openings()` is empty (the cottage), this is the named residual**
   (Research constraint 5): reported `pass:true, detail:"no exterior openings read; front-door alignment
   steered, not geometric"`, and surfaced as the gate's **`residual`** string (Rule 7 — shown, not hidden).

`pass` = all hard constraints (1–6) true. Constraint 7 is reported but, when vacuous, contributes the
residual rather than a fail — design-without-reference is honest about what it could not verify.

## What was rejected, and why

- **Emit placements / full geometry from the LLM (A/B).** Rejected above — violates the program-owns-bulk
  AC and re-creates the context-overflow + non-determinism the view layer was built to avoid.
- **A new air/delete op for doorways.** Rejected — the project has a standing **no-air-op** rule
  ([[facade-recess-by-exclusion]]); exclusion is the established idiom and keeps the artifact AJV-valid
  with only manifest blocks.
- **One `fill` box per floor/storey.** Rejected — the footprint is irregular (662/832); a box would place
  floor under the eaves and outside the shell, breaking `exteriorHeld` and "grid fits envelope". Per-cell
  `voxel` gated by the enclosed-slice mask is correct; the slightly larger placement count is the same
  accepted trade the carve made (flatten-to-voxels).
- **Inventing floor/wall block ids.** Rejected — must stay within the manifest ([[voxel-palette-must-be-
  design-doc]]); the spec's `materials` is validated against `artifact.palette.manifest` and falls back to
  `spruce_planks` (floor) / `cobblestone` (wall), both already present.
- **Reading the front door geometrically.** Rejected as the *primary* path — `openings()` returns [] here
  (Research constraint 5). Geometry is still consulted; the LLM's `frontDoor` is the fallback and the
  reason the call is metered.
- **Light tier for the reasoning.** Rejected — the rubric routes *authoring a generator* to **strong**;
  this is design-with-invention across the plan + elevation, not a one-view label. Add a `floorplan-author`
  **strong** entry to `OP_ROUTING` so the record stays single-sourced.

## Exterior-safety, restated as the invariant

Every placed cell ∈ `interiorColumnsAtY` ⊆ enclosed air ⊆ non-skin ⇒ no front-most ortho surface voxel
changes ⇒ `exteriorHeld(before, after).held === true`. The fill is **invisible from outside** — the same
proof, and the same runtime throw, that made the carve safe. The floorplan adds an interior; it cannot
touch the measured exterior.
