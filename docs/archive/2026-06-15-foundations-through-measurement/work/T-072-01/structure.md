# T-072-01 — feature-aware-assignment · Structure

The shape of the code. Two new files (pure core + its test), one new runner, one one-line `package.json`
script, and a committed output dir. Purely additive — no existing file's behavior changes.

## Files

### CREATE `src/form/feature-classify.mjs` (PURE core) — ~200 lines

The heart. No GL, no IO, no color sampling, no Date/random.

```
imports:
  occupiedCells                     from "./glb-voxelize.mjs"
  paletteFromMap                    from "./material-map.mjs"
  nearestLab, srgbToLab             from "../color/cielab.mjs"
  loadBlockTable                    from "../color/block-table.mjs"   // Lab for the fallback palette
  tableKey, blockId                 from "../sculptor/material.mjs"   // namespace boundary (reuse)

constants:
  FEATURES        = Object.freeze(["flat-face","edge-corner","top-roof","base","opening-recess"])
  FEATURE_RULE    = Object.freeze({ "flat-face":"walls", "edge-corner":"corners-edges",
                                    "top-roof":"roof", "base":"base", "opening-recess":"openings" })
  CLASSIFY_DEFAULTS = Object.freeze({ baseBand:1, upperFrac:0.6, recessFlank:2 })
  FACE_DIRS, HORIZ_DIRS, plane-neighbor offsets   // local (mirror voxel-components; ±x/±z are horizontal)

internal:
  occupiedKeySet(occupancy)         → Set<"i,j,k">           // the membership test
  key(i,j,k) / has(set,i,j,k)
  inPlaneNeighborsOccupied(set, x,y,z, axis)  → count        // for the recess flank test

exports (pure):
  classifyFeatures(occupancy, opts?) → Map<"i,j,k", feature>
    // jMin/jMax pass, then per-cell priority: base → top-roof → opening-recess → edge-corner → flat-face
  assignFeatureBlocks(occupancy, features, map, opts?) → string[]   // bare keys, occupiedCells order
    // opts: { colors?:number[] (3·count), palette?:[{key,lab}], defaultBlock?, metric? }
    // feature→rule→map block (primary); silent rule → nearestLab(colors) over map palette, else default
  mapByRule(map)                    → Map<placementRule, block>     // first entry per rule wins
  fallbackPalette(map, table?)      → [{key, lab}]                  // map palette + block-table Lab, for nearestLab
  featureCounts(features)           → Record<feature, number>       // tiny tally, for reports/tests
  featureBlockMatrix(occupancy, features, keys) → Map<block, Record<feature,count>>  // AC#4 manifest proof
```

`classifyFeatures` is the only non-trivial loop. Two passes: (1) build occupied set + jMin/jMax;
(2) for each occupied cell compute `surface`, `upwardFacing`, `horizExposed`, recess test → priority
match → set Map entry. O(count · 6).

`assignFeatureBlocks` walks `occupiedCells` once, in order, so the returned `keys[]` aligns with
`keysToArtifact`'s placement order. Namespace stripped via `tableKey` (no namespace) → `keysToArtifact`
re-adds `minecraft:`.

### CREATE `src/form/feature-classify.test.mjs` (unit) — ~180 lines

`node --test`. Synthetic occupancy built inline (no GLB). Helpers: `prism(nx,ny,nz)` →
`{dims, occupied:Int32Array, count}` (solid box); `carveSlot(occupied, …)` to make a recess.

Cases (AC#2 — "corners→edge-corner, top→top-roof, lowest→base, broad faces→flat-face, inset→
opening-recess"):
1. `FEATURES`/`FEATURE_RULE` frozen, expected keys.
2. `classifyFeatures` on a 5×7×5 solid prism:
   - bottom layer (j=0) cells → `base`.
   - a mid-band vertical edge column corner → `edge-corner`.
   - a mid-band broad-face cell (one horizontal side open) → `flat-face`.
   - top upward-facing cell → `top-roof`.
3. recess: prism with a carved slot whose back cell is flanked by jambs → `opening-recess`; a flat-wall
   surface cell → NOT opening-recess.
4. interior cell (all 6 neighbors occupied) → `flat-face` (default).
5. `assignFeatureBlocks` with a stub map (`walls→stone_bricks`, `corners-edges→cobblestone`,
   `roof→deepslate_tiles`): edge-corner cell → `cobblestone`, flat-face → `stone_bricks`,
   top-roof → `deepslate_tiles`; **brick≠cobble assigned by feature** (the core property).
6. silent-map fallback: map without `base`; base cell with a supplied `colors` → `nearestLab` pick;
   base cell with no colors → `defaultBlock` / walls block.
7. `assignFeatureBlocks` output length === count; every key is bare (no `minecraft:`); feeding it through
   `keysToArtifact` + `assertArtifact` passes (the AJV gate, imported in the test).
8. `mapByRule`, `fallbackPalette`, `featureCounts`, `featureBlockMatrix` shape checks.

### CREATE `benchmarks/sculpture/material-assign.mjs` (IMPURE runner) — ~150 lines

Mirrors `e19-build.mjs` structure. Not unit-tested (GL + texture decode); verified by the committed run.

```
flow (live):
  glbBytes = read glb/stone-gatehouse.glb
  occ      = voxelizeGlb(glbBytes, { scale })
  surface  = parseGlbColoredSurface(glbBytes); texture = decodeTexture(surface.baseColor)   // dwebp edge
  colors   = sampleSurfaceColors({ occupancy:occ, surface, texture })
  mapJson  = read material-map/gatehouse.json ; map = mapJson.map
  features = classifyFeatures(occ)
  palette  = fallbackPalette(map)
  keys     = assignFeatureBlocks(occ, features, map, { colors, palette })
  artifact = keysToArtifact(occ, keys, { style:{name:"feature-assign", rationale:…},
                                          metadata:{ trial_id:"gatehouse-feature-assign" } })
  assertArtifact(artifact)                                           // AJV gate (AC#3)
  renderArtifact(artifact, { outPath:render-3q.png, view:SCULPTURE_VIEW_3Q })   // gitignored PNG
  matrix   = featureBlockMatrix(occ, features, keys)
  verify:  cobblestone dominates edge-corner ∧ stone_bricks dominates flat-face ∧ both in manifest
  write material-assign/gatehouse.json  { schema, subject, scale, features:featureCounts, manifest,
           matrix, brickNotCobbleByFeature, blocksByRule, dropped:trim-unplaced note }

--offline: re-read committed material-assign/gatehouse.json + artifact.json, re-run featureBlockMatrix
           on occupancyFromArtifact(artifact), re-assert the brick≠cobble property — no GL.
imports: voxelizeGlb, parseGlbColoredSurface, sampleSurfaceColors, keysToArtifact, assertArtifact,
         classifyFeatures/assignFeatureBlocks/featureBlockMatrix/fallbackPalette/featureCounts,
         SCULPTURE_VIEW_3Q + DEFAULT_SCALE, lazy render-tool import (the GL edge).
```

### CREATE (committed output) `benchmarks/sculpture/material-assign/gatehouse.json`

The artifact-of-record proving AC#4 (manifest + feature matrix). PNG render gitignored per convention.
`artifact.json` for the build also committed under `benchmarks/sculpture/material-assign/gatehouse/`
(JSON committed, render not), parallel to `e19-build/<subj>/`.

### MODIFY `package.json` — one line

Add `"material:assign": "node benchmarks/sculpture/material-assign.mjs"` next to `"material:map"`.

## Module boundaries

- **Pure ↔ impure seam:** `feature-classify.mjs` never imports GL, render, fs, or `decodeTexture`. Colors
  arrive as a plain number array. The runner owns voxelize/sample/render/write.
- **Reuse seam:** adjacency offsets mirror `voxel-components` (local consts to avoid importing internals);
  color math is E-14 `nearestLab`/`srgbToLab`; Lab table is `block-table.mjs`; artifact build is
  `keysToArtifact`; the map contract is `material-map.mjs` (`paletteFromMap`). No new color or coord math.
- **Vocabulary seam:** `FEATURE_RULE` is the single place feature↔rule is wired; `PLACEMENT_RULES` stays
  owned by `material-map.mjs` (imported only if we assert membership — optional).

## Ordering of changes (informs Plan)

1. Pure core (`feature-classify.mjs`) — classifier first, then assigner.
2. Unit test — synthetic prism + recess + AJV round-trip. `npm test` green here (no GL).
3. Runner (`material-assign.mjs`) with `--offline` skeleton.
4. Live gatehouse build → render → write `material-assign/gatehouse.json` + artifact.
5. `package.json` script.

Steps 1–2 + 5 are CI-safe and the substance of the ACs that `npm test` gates. Steps 3–4 are the
metered/GL live proof (committed JSON, gitignored PNG).
