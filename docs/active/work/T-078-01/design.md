# Design — T-078-01 view-layer-and-structural-read

Decide the shape of the view-layer substrate, grounded in Research. The AC has four mechanisms:
(1) multi-angle view **reader** (GL, any angle), (2) the 2.5-D projected **surface grid** + unambiguous
back-projection (ortho/45° only), (3) the pure **structural read** (footprint, storey bands, openings,
roof region, wall fields), (4) the **same-angle reference** grid-quantize. Plus pure cores unit-tested
on synthetic occupancy and one live cottage GL render.

## The central decision: two projection paths, not one

The seductive wrong move is to make the GL render the single source for everything — read the painted
canvas back off a perspective screenshot. Research rules this out: a perspective render's pixel→voxel
inverse is **ambiguous** (foreshortening, occlusion, sub-pixel blocks), and the AC explicitly scopes
paint-back to ortho/45° and rules arbitrary-oblique paint-back **out**. So:

- **Path R (read, GL, any angle)** — perspective renders via `renderArtifact` at chosen views. For
  *looking* (the LLM reads an image), perspective is fine and matches the E-22 lens. Reused, not new.
- **Path P (paint canvas, pure lattice, ortho/45° only)** — an **orthographic, lattice-aligned**
  projection computed directly on occupancy. Each grid cell is one lattice column along the view axis;
  the front-most occupied voxel + its depth + face normal are exact integers, so project→back-project
  is a bijection on surface voxels. This is the only place back-projection is promised, and it is
  promised precisely because ortho-lattice projection is invertible.

This split is the design. It honors the AC's own scoping (paint-back ortho/45° only) and the purity
boundary (Path P is GL-free → unit-testable on synthetic occupancy).

## Occupancy adapter (shared input)

Both Path P and the structural read consume **occupancy**, not the raw artifact or a GL world. Decision:
a thin pure adapter `artifactOccupancy(artifact)` that runs `expandArtifact` (reuse — never refork) and
returns the glb-voxelize *vocabulary* extended with material:
`{ bounds:{min,max}, dims:[nx,ny,nz], cells: Map<voxelKey, blockId>, has(x,y,z), block(x,y,z) }`.
Coordinates stay in the artifact's own integer space (cottage uses negatives); `dims`/`min` let callers
index a 0-based grid like glb-voxelize does. **Rejected:** converting to glb-voxelize's `Int32Array
occupied` and dropping block ids — the surface grid needs the block per cell (it is the paint canvas's
*current* material), so a material-carrying map is required. **Rejected:** building a `prismarine-world`
to query occupancy — that pulls GL/CJS into a pure core.

## Path P — the 2.5-D projected surface grid

`projectSurface(occ, dir)` where `dir` is one of **6 ortho** (`+x,-x,+y,-y,+z,-z`) or **diagonals**
(the 45° set). Output mirrors image-grid's grid shape so downstream reads one idiom:
```
{ dir, n, m, axisU, axisV, axisW,          // U=grid col, V=grid row, W=depth (view) axes
  cells: [[ { block, depth, voxel:[x,y,z], normal:[..] } | null ]]  // m rows × n cols
  filled, air }
```
- **Ortho dirs (the core, fully unambiguous):** the grid is the two lattice axes ⟂ to `dir`; for each
  (u,v) column, scan along the view axis from the camera side and take the **first occupied** voxel →
  that is the surface voxel. `depth` = its index along the view axis (W); `normal` = `dir` reversed
  (the exposed face points back at the camera). Back-projection `backProject(grid)` reads each cell's
  stored `voxel` → returns exactly the surface voxels (round-trip identity, the AC's test).
- **45° diagonals (read + paint-back in scope):** a sheared lattice projection — the view axis is a
  unit diagonal in the ground plane (e.g. `(+x,+z)` normalized), grid col = the ⟂ ground diagonal,
  grid row = `y`. The cell stores the front-most voxel along the diagonal ray stepped on the lattice
  (Bresenham-style integer stepping so back-projection stays exact). Because every cell still stores
  its source `[x,y,z]`, back-projection is the same stored-voxel read → still a bijection. **Rejected**
  for 45°: true sub-voxel oblique rasterization — it loses the invertibility the AC requires.
- **Arbitrary oblique:** explicitly **out** for Path P (AC). `projectSurface` throws on a non-ortho/
  non-45° `dir` so the boundary is enforced, not just documented.

The face normal is trivial for ortho (the reversed view axis). For 45° it is the dominant exposed
ortho face of the surface voxel (the neighbour-air test), so the splat knows which wall it is painting.

## Path R — the multi-angle view reader

`VIEW_ANGLES` (pure const): the **6 ortho** azimuth/elevation pairs + the **45° diagonals** + a slot
for **arbitrary 3-axis** angles. `renderViews(artifact, angles, {outDir, supersample})` — impure, lazy
-imports `render-tool.mjs`, renders each angle via `renderArtifact` at the E-22 lens, returns the PNG
paths + the view used. *Reading from any angle is in scope* (AC) → arbitrary angles are accepted here
(unlike Path P). The angle *table* is pure/testable; the GL call is the thin impure edge.

## Structural read (pure, geometric, GL-free)

`structuralRead(occ)` →
- **footprint**: the `(x,z)` columns with any occupied voxel → `{ cells:Set, bbox:{minX,maxX,minZ,maxZ},
  width, depth }`. Width×depth is the AC's footprint.
- **storeyBands**: scan `y` layers bottom→top; per layer record occupied count + dominant block. A
  **band boundary** is a `y` where the dominant exterior material changes *or* occupancy jumps (a floor
  slab — a near-full `(x,z)` layer). Return `bands:[{yStart,yEnd,dominantBlock,fill}]` and the derived
  `floorLines:[y...]`. This is the shared primitive: S-079's plaster band start, S-081's floor heights.
  The cottage face failed for lack of this axis — so it is first-class.
- **openings**: per ortho elevation, the projected face mask (occupied columns); an **opening** is a
  connected air region *enclosed* by material on that face (flood-fill that does not touch the face
  border). Classify **door** (touches the ground row) vs **window** (elevated). Return per-face
  `[{bbox,kind}]`.
- **roofRegion**: the top exposed shell — for each `(x,z)` footprint column the highest occupied `y`,
  grouped into the contiguous top band; expose `roofCells`, `yRange`, and per-cell block (S-084 checks
  100% coverage / coherent material).
- **wallFields**: per ortho elevation, the surface cells with their block (the four exterior faces) +
  `holes` (footprint columns with no front voxel on that face). S-084 consumes strays (wrong material
  in a field) + holes (skin gaps).

All derived from the occupancy Map — no GL, no rendering. Each sub-result is independently testable on
hand-built synthetic occupancy (a 3×3×3 cube, an L, a box-with-a-window).

## Same-angle reference quantize

`referenceTarget(imagePath, { n, manifest })` → `gridFromImage(imagePath, { n, whitelist:manifest })`
with `n` set to the projected face's grid width and `whitelist` = the artifact's `palette.manifest`
(snap within the design doc, `[[voxel-palette-must-be-design-doc]]`). Returns the image-grid result =
the **cell-aligned material target** the S-079 splat consumes. The "same angle" guarantee is the
caller's contract (render the reference at the face's view before quantizing); this function aligns the
*resolution* (n=face width) and *palette* (manifest). Read-side only — no splat here (AC).

## Why this shape (summary of rejected alternatives)

- *One GL path for read+paint:* rejected — perspective inverse is ambiguous; AC scopes paint-back to
  ortho/45°.
- *Refork expand/voxelize:* rejected — `[[parallel-roots-duplicate-shared-deps]]`; reuse `expandArtifact`.
- *Full-305 snap for the reference target:* rejected — bloats palette (`[[voxel-palette-must-be-design-doc]]`);
  whitelist to the manifest.
- *Store openings as air placements:* rejected — no air op (`[[facade-recess-by-exclusion]]`); openings
  are found by analysis.
- *Module home `src/form/`:* rejected — E-23 is a distinct sector; a new `src/view/` keeps the substrate
  legible and the `src/**/*.test.mjs` glob still covers it.
