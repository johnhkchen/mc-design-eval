# Research — T-079-01 spray-paint-materials

Epic **E-23** / Story **S-079** — the **judgement path** (craft). Map the substrate this ticket
stands on, the failure it reverses, and the existing machinery to reuse. Descriptive, not prescriptive.

## The failure being reversed (the "why")

The cottage face failed. The E-21 material map (`benchmarks/sculpture/material-map/cottage.json`) is
*correct*: `white_terracotta` = "upper-storey plaster infill between the timbers" (`placementRule:
"walls"`), `dark_oak_log` = half-timber frame (`trim`), `stone_bricks` = ground-floor ashlar (`walls`),
`cobblestone` = corner quoins (`corners-edges`). But the 3-D feature placer **collapsed plaster into
stone**: the built cottage (`benchmarks/sculpture/concept-materials/cottage/after-artifact.json`,
6429 placements) has **`white_terracotta` = 8** placements against `stone_bricks` = 3933. Both plaster
and the ashlar wall body carry `placementRule: "walls"`, and 3-D feature space **has no storey axis** —
so "the upper band is plaster" (a *horizontal stripe* on a painted wall) had nowhere to live. This is
the `[[twodee-interaction-sector]]` thesis: give the LLM a *view* with a storey axis, not raw voxels.

The build manifest is the 6 blocks `[cobblestone, dark_oak_log, dark_oak_planks, spruce_planks,
stone_bricks, white_terracotta]` (the map's 7th, `bricks` chimney-cap, never placed; the map also
*dropped* `spruce_door`/`dark_oak_trapdoor`/`lantern` as unknown-block — these are the E-21
concept-justified-growth candidates an add-back could restore).

## The substrate this ticket consumes (T-078-01, DONE — `src/view/`)

The dependency shipped the view layer. The relevant seams, all **pure**:

- **`occupancy.mjs`** — `artifactOccupancy(artifact)` runs `expandArtifact` (reuse, never refork) →
  `{ bounds:{min,max}, dims, size, cells: Map<"x,y,z", blockId>, has(x,y,z), block(x,y,z) }`. Coords
  stay in the artifact's own integer space. `bareBlock(id)` strips `minecraft:`.
- **`surface-grid.mjs`** — `projectSurface(occ, dir)` → a `SurfaceGrid` `{ dir, kind:"ortho"|"diag",
  n, m, cells: (SurfaceCell|null)[m][n], filled, air }` where `SurfaceCell = { block, depth,
  voxel:[x,y,z], normal:[..] }`. **The cell stores its source voxel**, so `backProject(grid)` →
  `[{pos, block}]` is the front-most surface set (round-trip identity, unit-tested). `ORTHO_DIRS`
  (6 faces) + `DIAG_DIRS` (4× 45°); `resolveDir` **throws** on arbitrary-oblique (paint-back scope).
  `gridMaskOf(grid)` → binary fill mask. **This is the paint canvas.** The front face is `-z`
  (camera on +Z); a "side" is `+x`/`-x`.
- **`reference-quantize.mjs`** — `quantizeToFace(imagePath, grid, {manifest})` and
  `referenceTarget(imagePath, {n, manifest})` → `gridFromImage(imagePath, { n: grid.n,
  whitelist: bareList(manifest) })`. **This is the concept-splat seam already built**: render a
  reference at the face angle, quantize to the face's cell grid, snap WITHIN the design manifest.
- **`structural-read.mjs`** — `footprint`, `storeyBands` (the shared storey axis), `openings`,
  `roofRegion`, `wallFields(occ)` (per side face: `surfaceCells`, `holes`, `blockCounts`).
- **`multi-angle.mjs`** — `renderViews(artifact, angles, {outDir})` (impure, lazy-imports
  `render-tool.mjs`, E-22 fixed lens) + `resolveAngle`. `VIEW_ANGLES.ortho.front` = azimuth 0
  (looks toward −Z), `right`/`left` = the side elevations. **This renders the BUILD** (Minecraft) at
  a face angle — used to produce the build-face image the LLM judges and the resemblance gate scores.

## The splat machinery (`src/color/image-grid.mjs`, E-10)

`gridFromImage(path, opts)` → `gridFromPixels` → a `GridResult` `{ grid:(block|null)[m][n], n, m,
paletteMode, outOfPalette, blockCounts, legend, meanDeltaE, ... }`. **`whitelist` is the palette
enforcement**: in *validate* mode `nearestLab` can only return a manifest block, so `outOfPalette`
is **0 by construction** (the "4 cans"). Air cells (coverage < threshold) → `null`. `comparePalettes`
gives present/missing/added. This is the cell→material target the splat lays down.

## The "recolor only" contract (how paint becomes geometry-safe)

`expand.mjs` `expandArtifact` applies placements in **array order, last-write-wins, full replace**.
So a **recolor = append a `{op:"voxel", pos, block}` at an existing surface voxel's position** — the
later placement overrides the block at that cell *without moving geometry*. There is **no air op**
(`[[facade-recess-by-exclusion]]`) — paint never removes a voxel, only re-blocks it. `voxelKey`
canonicalizes `pos`. Back-projection (`SurfaceCell.voxel`) gives exactly the positions to paint.

## The metered-call pattern to mirror (E-21 `material-correct.mjs`)

The "refine/judge rather than place every cell" call already has a template:
- `benchmarks/sculpture/material-correct.mjs` wires `reviseLoop` (`src/revise/loop.mjs`) with the
  **swap-only material editor** (`src/revise/material-edit.mjs`). The LLM sees the **build render crop
  + the concept** (two images) via `defaultProposeCorrection` → the `baml-material-correct.mts`
  bridge → `{remaps, swaps, additions}`. Edits apply under region-lock + palette policy + AJV, and
  are **accepted only if the per-region concept agreement improves, else rolled back**.
- **The accept-gate seam** (`src/revise/loop.mjs`): `before = score(current, R)`; try tweaks;
  `after = score(candidate, R)`; `accepted = after > before + epsilon` else roll back; an accepted
  region **locks** and is never re-edited (**P14**). `LOOP_DEFAULTS.epsilon = 0`. The score seam is
  injected — pure tests pass a deterministic score, no GL.
- **`src/sdk-binding.mjs`** — `requestTextWithImage({prompt, images, model, ...})` is the direct
  two-image metered call (`claude -p --output-format stream-json`); `stripToJson`/`extractArtifact`
  parse replies. The BAML bridge is the alternative the material editor uses.

## The per-face accept signal (E-22 resemblance, `src/form/resemblance.mjs`)

`zoneAgreement(renderImg, conceptImg, blockTable, opts)` — overlay a Z×Z grid on each image's
foreground bbox (translation/scale-normalized), snap each cell's mean-fg colour to a table block,
compare common cells within `deltaEZone`; returns `{score, meanDeltaE, common, zones}`. `setAgreement`
= same-materials-at-all. Both **pure**, block-grounded, deterministic — exactly the "accept-if-closer"
hill-climb signal a paint gate needs (the verdict stays the human triptych + categorical judge; these
scores *explain*, E-22 Rule 2). The references are **immutable** (Rule 1). This is per *image*; a
**per-face** application renders the painted face vs the concept's same face.

## The GLB side/roof reference (`benchmarks/sculpture/glb/cottage.glb` + `glb-voxel-build.mjs`)

The concept image shows the front; **sides/roof the concept never shows** → the textured GLB is the
truth there. `cottage.glb` is on disk (TRELLIS, `[[trellis-glb-path-works]]`). `glb-voxel-build.mjs`
`sampleSurfaceColors({occupancy, surface, texture})` → per-voxel RGB from the baseColor texture
(nearest-vertex UV), and `colorVoxelsToArtifact(occ, colors, {palette})` snaps each to the nearest
palette block. **Constraint:** there is **no textured-GLB→PNG renderer** in the repo (the GLB is only
ever silhouette-rasterized via `glb-silhouette.mjs` `rasterizeSilhouette`, or voxel-color-sampled).
This shapes the side/roof splat decision (Design).

## Constraints, conventions, assumptions

- **Module home** `src/view/` (E-23 sector); pure cores under the `src/**/*.test.mjs` glob; impure
  GL/metered runner under `benchmarks/sculpture/`. `npm test` = AJV self-test + `test:unit`.
- **Palette is structural** (`[[voxel-palette-must-be-design-doc]]`): enforce the manifest ∪
  concept-justified additions; off-palette is impossible, not merely measured (the 91-block bloat
  fix). `nearestLab` whitelist is the mechanism.
- **Paint-back is ortho/45° only** (T-078 AC, enforced by `resolveDir`). Front = `-z`, side = `±x`.
- A **corner voxel** is visible from two faces (`surface-grid.mjs` `diagNormal` already finds the
  exposed ortho face); two ortho faces can both back-project onto it → need a precedence rule
  (concept-matching paint wins) — this is new logic this ticket owns.
- **Assumption:** the cottage concept (`runs/014-vConcept-a-cottage/concept.png`) is approximately the
  front (`-z`) elevation — the resemblance honesty ledger already flags camera mismatch; relative/
  per-face deltas are the worth, not absolute IoU.
</content>
