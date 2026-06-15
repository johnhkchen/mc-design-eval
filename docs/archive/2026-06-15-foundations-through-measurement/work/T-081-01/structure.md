# Structure — T-081-01 nxm-floorplan-infill

File-level blueprint. The shape of the code, not the code. Mirrors the `hollow-carve.mjs` (pure ops) +
`hollowable-mass.mjs` (prompt/parse) + `hollow-cottage.mjs` (runner) layering already in the tree.

## Created

### `src/view/floorplan.mjs` — the pure generator + gate + steering seam
One PURE module (no GL / model / API key / Date / random — runs under `src/**/*.test.mjs`). Imports only
`occupancy`, `structural-read`, `surface-grid`, `surface-coherence` (`applyDeltas`), `expand`, and
`json-reply`. Sections, top to bottom:

**Constants**
- `FLOORPLAN_SCHEMA = "floorplan/v1"`, `TIER = "strong"` (mirrored in `OP_ROUTING`).
- `DEFAULT_MATERIALS = { floor: "minecraft:spruce_planks", wall: "minecraft:cobblestone" }` — both in the
  cottage manifest; the parse fallback.

**Geometry (pure, deterministic — the "generator")**
- `storeysFromRead(read)` → `[{index, floorY, ceilY}]` from `read.storeyBands.floorLines` + wall top.
- `interiorBBox(footprintBBox, inset=1)` → the inset partition envelope.
- `gridPartition(bbox, {rows, cols})` → `{interior, xWalls:int[], zWalls:int[], rooms:[{id,x0,x1,z0,z1}]}`.
- `interiorColumnsAtY(occ, y)` → `Set<"x,z">` enclosed room-air columns in the height-`y` slice (reuses
  `airComponents` from `structural-read`). Internal helper `sliceMaskAtY(occ, y)`.
- `roomOfColumn(rooms, x, z)` → the room id a column falls in (for the gate + door placement).

**The plan + placements (pure — the "program places")**
- `generateFloorplan(occ, read, spec)` → `{ plan, placements }`.
  - `plan = { storeys:[{index,floorY,ceilY,rooms,interiorCols:Set,doors:[{wall,cell,rooms:[a,b]}]}], grid,
    materials, frontDoor }`.
  - `placements` = `{op:"voxel", pos, block}[]` — floor slabs (gated to interior, skip already-occupied) +
    dividing walls (minus doorway cells). Internal helpers `floorPlacements`, `wallPlacements`,
    `doorwayCells(grid, interiorCols, frontDoor, storey)`.
- `applyFloorplan(artifact, placements)` → thin wrapper over `applyDeltas` (append → new artifact). The
  floorplan is **additive**; this is the one place placements meet the artifact contract.

**The plausibility gate (pure)**
- `gateFloorplan(occ, read, plan)` → `{ pass, constraints:[{name,pass,detail}], residual }`. Six hard
  constraints (roomsValid, roomsNonOverlap, reachable, floorsAtStoreyLines, storeyCountMatches,
  gridFitsEnvelope) + openingsAlignShell (→ residual when vacuous). Internal `roomGraphConnected(storey)`
  (union-find), `openingsByFace(occ)`.

**The metered seam (pure prompt + parser, like hollowable-mass)**
- `buildFloorplanPrompt(read, storeys, footprintSummary, manifest)` → the FIXED strong-tier prompt:
  states footprint dims, the storey lines, detected exterior openings (or "none read — identify the front
  door from the elevation"), the manifest, and asks for a single `FloorplanSpec` JSON.
- `parseFloorplanSpec(text, { manifest })` → validated spec. Coerce `rows`/`cols` to int≥1 (default 2×2),
  clamp materials to `manifest` (else `DEFAULT_MATERIALS`), default `doorPolicy:"spanning"`, keep
  `frontDoor` only when well-formed. Throws ONLY on non-JSON (reuses `parseJsonReply`).

### `src/view/floorplan.test.mjs` — pure-core tests (synthetic shells)
`node:test`. Synthetic hollow boxes (a sealed `box`-shell occupancy + a two-storey shell with a floor
line). Covers every AC clause + the source guard. ~20 tests. (Matrix in plan.md.)

### `benchmarks/sculpture/floorplan-cottage.mjs` — the metered/GL runner (`npm run floorplan:cottage`)
Mirrors `hollow-cottage.mjs`:
1. Load `docs/active/work/T-080-01/hollow-cottage-artifact.json` (fallback: seal+carve the raw cottage
   in-process so the runner is self-sufficient).
2. `occ = artifactOccupancy`; `read = structuralRead(occ)`; `storeys = storeysFromRead(read)`.
3. `renderViews(artifact, ["top","front","threeQuarter"])` (the **plan/below** + elevation canvas).
4. **METERED** `runTieredOp({tier:"strong", prompt: buildFloorplanPrompt(...), images:[plan, elevation]})`
   → `parseFloorplanSpec` → the steering spec (fallback `{rows:2,cols:2}` on call/parse failure).
5. `generateFloorplan(occ, read, spec)` → plan + placements; `applyFloorplan` → filled artifact.
6. `gateFloorplan(occ, read, plan)` → the plausibility verdict (per-constraint + residual).
7. `exteriorHeld(occ, artifactOccupancy(filled))` — **throw if not held** (the fill must be invisible).
8. `renderViews(filled, [...])` before/after; write `floorplan-cottage-artifact.json`,
   `floorplan-report.json` (spec, plan summary, gate verdict, exteriorHeld, cavity/fill counts, detector
   usage), and before/after PNGs to `docs/active/work/T-081-01/`.

## Modified

### `src/model-tier.mjs`
Add to `OP_ROUTING` (single-sourced tier record):
```
{ op: "floorplan-author", tier: "strong",
  rationale: "Authoring/steering an N×M floorplan generator from the plan + elevation is design WITH
  invention (no interior reference) — the rubric's named strong case (authoring a generator), not a
  one-view label." }
```
No behaviour change; `routingTableMarkdown()` picks it up automatically.

### `src/model-tier.test.mjs`
Extend the existing `OP_ROUTING` assertions to expect `floorplan-author` present + `strong` (the table
stays a tested record). No new test file.

### `package.json`
Add `"floorplan:cottage": "node benchmarks/sculpture/floorplan-cottage.mjs"` beside `hollow:cottage`.

## Not modified (consumed as-is)
`occupancy.mjs`, `surface-grid.mjs`, `structural-read.mjs`, `expand.mjs`, `hollow-carve.mjs`
(`exteriorHeld`/`exteriorSurfaceDigest` imported), `surface-coherence.mjs` (`applyDeltas`),
`json-reply.mjs`, `multi-angle.mjs`, `config.mjs`, the schema. No edits — the substrate is complete; this
ticket is one new pure module + one runner + the routing record.

## Public interface (what other tickets import)
```
floorplan.mjs:
  FLOORPLAN_SCHEMA, TIER, DEFAULT_MATERIALS
  storeysFromRead(read) → [{index,floorY,ceilY}]
  gridPartition(bbox,{rows,cols}) → {interior,xWalls,zWalls,rooms}
  interiorColumnsAtY(occ,y) → Set<"x,z">
  generateFloorplan(occ,read,spec) → {plan,placements}
  applyFloorplan(artifact,placements) → artifact
  gateFloorplan(occ,read,plan) → {pass,constraints,residual}
  buildFloorplanPrompt(read,storeys,footprintSummary,manifest) → string
  parseFloorplanSpec(text,{manifest}) → FloorplanSpec
```

## Ordering of changes (so each commit is green)
1. `floorplan.mjs` geometry + plan/placements + gate (pure) **with** `floorplan.test.mjs` → `npm test`.
2. `buildFloorplanPrompt` + `parseFloorplanSpec` (+ their tests) in the same module/file.
3. `OP_ROUTING` entry + `model-tier.test.mjs` update.
4. `floorplan-cottage.mjs` runner + `package.json` script (metered/GL — not unit-tested, gated by the
   round-trip + `exteriorHeld` throw).
5. Live run → artifacts under the work dir → `progress.md` → `review.md`.
