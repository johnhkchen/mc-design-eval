# Research — T-084-01 surface-coherence-ops

Epic **E-23** / Story **S-084**, the **program path** for the surface defects witnessed this session.
Descriptive map of what exists and how it connects; no solutions here.

## The problem this ticket sits on

Two geometric/topological coherence defects (distinct from E-18's *color* speckle) seen on the cottage
and the E-20 build:

1. **Roof not watertight** — stray non-roof blocks in the roof field, gaps/seams, the crown a "chaotic
   grey jumble". Want: roof 100% covered in roof material, strays stripped, no openings.
2. **Wall skin not coherent** — stray `spruce_planks`/`dark_oak_log` intrusions in the stone field
   ("random homes"), and `.` columns with no front voxel (holes). Want: intrusions re-assigned to the
   field material, holes sealed.

These are the **prerequisite for a safe hollow** (T-080-01): you cannot enclose an interior behind a
hole-y wall. The ticket also requires a **watertight shell check** — a flood-fill from outside the
bounding box must not reach any interior cell.

## The substrate this ticket consumes (T-078-01 + T-082-01)

### `src/view/occupancy.mjs` — the shared input
`Occupancy = { bounds:{min,max}|null, dims:[nx,ny,nz], size, cells:Map<"x,y,z",block>, has(x,y,z),
block(x,y,z) }`. Coordinates stay in the artifact's **own** integer space (negative coords OK).
`artifactOccupancy(artifact)` expands via `expandArtifact` (never reforks expansion); `occupancyFromCells`
builds from `{pos,block}` lists. `bareBlock(id)` strips a `minecraft:` namespace for material comparison.

### `src/view/surface-grid.mjs` — Path P (the paint canvas)
`projectSurface(occ, dir)` → `SurfaceGrid { dir, kind, n, m, cells[m][n], filled, air }` where each
`SurfaceCell = { block, depth, voxel:[x,y,z], normal }` is the **front-most** voxel along the view ray.
Ortho dirs `+x -x +z -z +y -y` and four 45° diagonals. `ORTHO_DIRS` carries the axis map
(`axisU/signU, axisV/signV, axisW, near:'max'|'min'`); `worldOnAxis(min,max,sign,idx)` (internal) maps a
grid index back to a world coordinate. `resolveDir(dir)` (exported) classifies ortho vs diag and **throws**
on arbitrary-oblique — paint/seal back-projection is ortho/45° only. `backProject(grid)` reads stored
voxels (the round-trip invariant). `gridMaskOf(grid)` → `{w,h,data:Uint8Array}` binary fill mask.

**Key fact:** `worldOnAxis` and the ortho spec fields are how a `(u,v)` grid cell + a chosen depth index
maps back to a world `[x,y,z]`. Sealing a *hole* (a cell with no surface voxel) needs exactly this — and
it is currently **internal** to surface-grid (only `resolveDir` + `ORTHO_DIRS` are exported).

### `src/view/structural-read.mjs` — the geometric read
- `footprint(occ)` → ground (x,z) columns + bbox + width/depth/area.
- `storeyBands(occ)` → horizontal bands grouped by dominant block + `floorLines`.
- `openings(occ, dir)` → air components in a face mask classified as `door`/`window` (enclosed → window,
  bottom-only → door). Uses the internal **`airComponents(mask)`** (4-connected air comps tagged with which
  borders they touch).
- `roofRegion(occ)` → `projectSurface(occ,"+y")` flattened: `{ cells:[{x,z,y,block}], yRange,
  coverage, area }`. **`area = top.n*top.m`** (the full +y bbox grid) and **`coverage = filled/area`** — so
  coverage counts *bbox corners outside the roof outline* as gaps. A non-rectangular footprint never reads
  1.0 here.
- `wallFields(occ)` → per side face `{ dir, surfaceCells:[{u,v,voxel,block}], holes:[{u,v}], blockCounts }`
  where **`holes` = enclosed air components** inside the face silhouette (border-touching comps dropped).
- `structuralRead(occ)` bundles footprint/storeyBands/roofRegion/wallFields.

**`airComponents` is internal** — its enclosed-vs-border classification is the exact "hole" definition this
ticket must reuse for roof holes (so we don't fill bbox corners). Either export it or re-derive it.

### `src/view/roof-patch.mjs` — light-tier roof detector (the metered call)
`roofCandidates(roofRegion)` → `{ dominant, stray:[{x,z,block}], holeCount, area, coverage }` (the bounded
candidate set). `buildRoofPatchPrompt`, `parseRoofPatch` → `{schema, patches:[{x,z,issue,note}]}` with
`ISSUES = ["stray-material","hole","wrong-tone"]`. `TIER="light"`.

### `src/view/hollowable-mass.mjs` — light-tier massing detector (feeds T-080-01)
`hollowableCore(occ)` → `{ enclosed, perBand, skinHoles }` where **enclosed = all-six-neighbours-occupied**
(the carveable bulk) and `skinHoles = Σ wallFields holes`. `buildHollowablePrompt`, `parseHollowable` →
`{hollowable, regions, blockers}`. `SEAL_BEFORE_HOLLOW` is the handoff invariant string. `TIER="light"`.

### `src/view/face-paint.mjs` — the write-back pattern to mirror
`paintFace(occ, dir, targetGrid, {allowed,source})` emits **recolor placements** `{op:"voxel", pos, block}`
at existing surface voxels — *"paint is a recolor, not a move"*. `applyPaint(artifact, placements)` shallow-
clones and **appends** placements; under `expandArtifact`'s last-write-wins a later voxel overrides the
block at that pos **without touching geometry**. There is **NO air op** (`facade-recess-by-exclusion`):
write-back only adds/recolors voxels, never deletes.

### `src/model-tier.mjs` — the routing seam
`runTieredOp({tier,prompt,images,invoke})` resolves a tier→`--model` over the `claude -p` subscription shim
(API key never on this path). `OP_ROUTING` already names **`seal-authoring → strong`** as a worked example;
this ticket's deterministic seal *ops* are pure (not a model call), and the *detectors* are the metered
calls. `routingTableMarkdown()` renders `scoping-rationale.md`.

### `src/expand.mjs` — `expandArtifact` (last-write-wins, full replace), `voxelKey("x,y,z")`.

### `benchmarks/sculpture/detector-routing.mjs` — the runner pattern (T-082-01)
Loads `concept-materials/cottage/after-artifact.json` (6429 placements, 6-block manifest), builds occ,
`structuralRead`, `renderViews(artifact, ["top","threeQuarter"], {outDir})`, runs the two light detectors
via `runTieredOp` + `requestTextWithImage`, writes a report. `npm run detect:routing`. This is the shape
the S-084 runner follows (load → read → detect (metered) → seal (pure) → re-measure → render → report).

## Boundaries & constraints

- **No air op.** Stripping a stray = a **recolor** (same pos, field block). Sealing a hole = **adding** a
  voxel (new geometry). Both are append-only placements under last-write-wins. We never delete.
- **Ortho-only back-projection.** Roof = `+y`; walls = the four side faces. Diagonals are out (surface-grid
  throws).
- **Hole = enclosed air component**, not a bbox corner. The roof "coverage" in `roofRegion` is over the full
  bbox grid, so the AC's "roof coverage → 100%" must be measured over the **roof outline** (filled ∪ sealed
  holes), reusing `airComponents`' enclosed test.
- **Watertight** must be defined without circularity. The natural definition tied to T-080-01: treat the
  interior (the enclosed mass the hollow op carves) as air, flood exterior air from the **padded** bbox
  boundary (6-connected, occupied blocks), and check the exterior flood reaches **no** interior cell. A
  solid shell with intact skin passes; a breached shell fails.
- **Purity / test glob.** Ops + the watertight check must be pure (no GL/IO/Date/random) to run under
  `src/**/*.test.mjs`. The detectors are the metered calls; the runner is the one GL/metered edge.
- **AJV consistency.** Sealing adds the dominant/field material, which is already in the manifest, so the
  appended placements stay schema-valid (no manifest growth needed, unlike `palette-cans.withAdditions`).
- **Coordinate space.** Everything stays in the artifact's own integer coords; the watertight flood pads the
  occupancy bbox by 1 on every axis to guarantee an exterior seed.

## Open questions surfaced (resolved in Design)

- Mutate occupancy vs emit placement deltas? (face-paint precedent: deltas.)
- Reuse `airComponents` by export vs re-implement a local enclosed-component finder?
- How to choose the seal voxel's depth for a hole (flush with which neighbour)?
- Does the cottage actually reach watertight after both ops, or is honest pass/fail the deliverable?
