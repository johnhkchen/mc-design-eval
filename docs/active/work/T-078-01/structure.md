# Structure — T-078-01 view-layer-and-structural-read

File-level blueprint. New sector lives under **`src/view/`** (pure cores covered by the
`src/**/*.test.mjs` glob; GL/I-O lazy-imported at the edges). Naming and JSDoc-header style mirror
`src/form/glb-voxelize.mjs` and `src/color/image-grid.mjs` (module-purpose header, exported pure
helpers, `import.meta`-guarded CLI where a runner is useful).

## New files

### `src/view/occupancy.mjs` (pure)
The shared input adapter. Reuses `expandArtifact` from `../expand.mjs`.
- `artifactOccupancy(artifact) → Occupancy`
  - `Occupancy = { bounds:{min:[x,y,z],max:[x,y,z]}, dims:[nx,ny,nz], size, cells:Map<key,blockId>,
     has(x,y,z):bool, block(x,y,z):string|null }`
  - `key(x,y,z)` reuses `voxelKey`. Block ids stored bare-or-prefixed as the artifact wrote them
    (normalize by stripping `minecraft:` for comparison helpers).
  - Empty artifact → `bounds:null, dims:[0,0,0], cells:Map()` (degrade, don't throw).
- `occupancyFromCells(cellList)` — test/utility constructor from `[{pos,block}]` (so tests build
  synthetic occupancy without a full artifact).

### `src/view/surface-grid.mjs` (pure) — Path P
- `ORTHO_DIRS` — frozen list of the 6 ortho directions with their `{axisU,axisV,axisW,signW}`.
- `DIAG_DIRS` — frozen list of the four 45° ground diagonals (`+x+z, +x-z, -x+z, -x-z`).
- `projectSurface(occ, dir, opts?) → SurfaceGrid` — front-most occupied voxel per cell + depth +
  normal. Throws on a dir outside ORTHO_DIRS ∪ DIAG_DIRS (enforces "arbitrary-oblique out").
  - `SurfaceGrid = { dir, kind:'ortho'|'diag', n, m, originU, originV, cells:Cell[m][n], filled, air }`
  - `Cell = { block, depth, voxel:[x,y,z], normal:[dx,dy,dz] } | null`
- `backProject(grid) → [{pos,block}]` — reads each cell's stored `voxel` → the surface voxel set. The
  round-trip identity: `backProject(projectSurface(occ,dir))` ⊆ occ and equals the per-column front set.
- `gridMaskOf(grid) → {w,h,data:Uint8Array}` — binary fill mask (filled cell = 1) for opening
  detection reuse and visual debug. (shape compatible with form-fidelity convention.)

### `src/view/structural-read.mjs` (pure)
Reuses `surface-grid.mjs` for face masks.
- `footprint(occ) → { cells:Set<"x,z">, bbox, width, depth }`
- `storeyBands(occ, opts?) → { bands:[{yStart,yEnd,dominantBlock,fill,floor:bool}], floorLines:[y] }`
  - `fill` = occupied / footprint-area at that y; `floor:true` when fill ≥ `floorFillThreshold`
    (default 0.6) → a floor slab. Band boundary on dominant-block change or floor onset.
- `openings(occ, dir) → [{ bbox:{u0,v0,u1,v1}, kind:'door'|'window', cells }]` — flood-fill enclosed
  air in the ortho face mask; `door` if it reaches the ground row, else `window`. Ortho dirs only.
- `roofRegion(occ) → { cells:[{x,z,y,block}], yRange:[lo,hi], coverage, footprintArea }` — per (x,z)
  highest occupied y; `coverage` = roof cells / footprint columns (S-084's →100% target).
- `wallFields(occ) → { faces: { '+x':Face, '-x':.., '+z':.., '-z':.. } }`,
  `Face = { dir, surfaceCells:[{u,v,voxel,block}], holes:[{u,v}], blockCounts }` — `holes` = footprint
  columns of that face with no surface voxel (skin gaps S-084 consumes).
- `structuralRead(occ) → { footprint, storeyBands, roofRegion, wallFields }` — the bundled read
  (openings exposed separately as it is per-direction).

### `src/view/multi-angle.mjs` — Path R (pure table + impure render edge)
- `VIEW_ANGLES` (pure frozen): `{ ortho:{front,back,left,right,top,bottom}, diag:[..4],
   threeQuarter: BUILDING_VIEW_3Q-like }` each `{azimuthDeg,elevationDeg}`.
- `resolveAngle(name|{azimuthDeg,elevationDeg}) → view` — pure; accepts arbitrary 3-axis angles
  (reading any angle is in scope).
- `renderViews(artifact, angles, opts) → Promise<[{angle,view,path,bytes}]>` — **impure**, lazy
  `import('../../render/src/render-tool.mjs')`; one `renderArtifact` per angle at the E-22 lens.

### `src/view/reference-quantize.mjs` (thin, decode via image-grid)
- `referenceTarget(imagePath, { n, manifest, ...gridOpts }) → Promise<GridResult>` — wraps
  `gridFromImage` with `whitelist:manifest` and `n = face width`. Returns the cell-aligned target.
- `quantizeToFace(imagePath, grid, { manifest }) → Promise<GridResult>` — convenience: derive `n`
  from a `SurfaceGrid` so the target lands on that face's exact cell grid.

### Tests (new, pure — exercised by `npm run test:unit`)
- `src/view/occupancy.test.mjs` — adapter on synthetic cells + a tiny artifact; bounds/dims/has/block.
- `src/view/surface-grid.test.mjs` — ortho front-most pick, depth/normal, **round-trip
  `backProject∘projectSurface` identity** (the AC), diagonal projection invertibility, throw on
  arbitrary dir.
- `src/view/structural-read.test.mjs` — footprint width×depth, storey bands on a 2-storey synthetic
  (material change + floor slab), openings (a box with one window + one door), roof coverage, wall
  holes + strays-input shape.
- `src/view/multi-angle.test.mjs` — `VIEW_ANGLES` completeness (6 ortho + 4 diag), `resolveAngle`
  named + arbitrary, validation. (No GL — the render edge is exercised by the live proof, not the unit
  glob.)
- `src/view/reference-quantize.test.mjs` — `n` derivation from a SurfaceGrid + whitelist plumb-through
  (using a synthetic RGBA buffer via `gridFromPixels`, no committed binary — mirrors image-grid.test).

## New runner (live GL proof, not in the unit glob)

### `benchmarks/sculpture/view-layer-proof.mjs`
`import.meta`-guarded CLI. Loads the cottage `after-artifact.json`, runs `structuralRead` (prints
footprint/bands/roof/walls summary), renders a **multi-angle set** (front, 3/4, top, a diagonal) via
`renderViews` into `docs/active/work/T-078-01/`, and writes a `view-layer-report.json` capturing the
structural read + the projected front-face grid summary + the same-angle reference target summary.
This is the AC's "one live multi-angle render of the cottage as the GL proof, saved under the work dir".
`npm` script alias: `view:proof`.

## Modified files

- **`package.json`** — add `"view:proof": "node benchmarks/sculpture/view-layer-proof.mjs"`.
- **`src/README.md`** *(optional, light)* — one line pointing at `src/view/` as the E-23 substrate.

No deletions. No edits to `expand.mjs`, `camera.mjs`, `render.mjs`, `image-grid.mjs` — all reused as-is.

## Module boundaries / ordering

1. `occupancy.mjs` (no deps beyond `expand.mjs`) — foundation.
2. `surface-grid.mjs` (deps: occupancy) — Path P.
3. `structural-read.mjs` (deps: occupancy, surface-grid for masks) — the read.
4. `multi-angle.mjs` (pure table; impure edge → render-tool) — Path R.
5. `reference-quantize.mjs` (deps: image-grid) — the target.
6. tests alongside each.
7. `view-layer-proof.mjs` + package.json — the live proof, last (needs all the above + GL).

Public interface kept small and data-shaped (no classes; frozen consts + pure functions returning
plain objects), matching the repo idiom so downstream stories import named functions, not a framework.
