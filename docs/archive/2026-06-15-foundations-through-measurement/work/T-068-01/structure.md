# T-068-01 — high-res-voxel-build · Structure

The blueprint. One pure module + tests, one impure runner, additive edits to `package.json` + `.gitignore`,
and generated artifacts under `benchmarks/sculpture/building/`. No existing pipeline module is touched.

## New files

### `src/form/building-build.mjs` — PURE scale-selector + report (the AC core, unit-tested)

Mirrors `e19-cleanup.mjs`'s shape (schema const + pure assemble + private `render*Md`). No GL/I/O/Date/random.

```
export const BUILDING_BUILD_SCHEMA = "building-build/v1"

// The metric axes per scale + the improvement direction (formIoU up; everything else down).
export const AXES  // { formIoU:"up", speckle:"down", distinct:"down", offPalette:"down",
                   //   valueDeltaE:"down", strayCount:"down", largestFraction:"up" }

// Deterministic best-scale pick. Rank by form IoU desc; if top-2 within iouEps, prefer the LOWER scale
// ("best-reading, not biggest"). PURE, null-tolerant (rows with null formIoU rank last).
export function pickBestScale(rows, { iouEps = 0.01 } = {}) → {
  scale, formIoU, reason, ranked:[{scale, formIoU}], tieBreak:boolean }

// One scale's measured cell → a normalized row (pass-through + guards). PURE.
export function buildingRow({ scale, blocks, formIoU, speckle, distinct, offPalette, valueDeltaE,
  strayCount, largestFraction, occ }) → row

// Assemble the report. PURE.
export function assembleBuildingBuild({ rows, chosen, generatedFrom }) → { md, json }
```

`pickBestScale` is the heart (AC#1 "best-reading kept, recorded which + why"). `assembleBuildingBuild`
renders: a per-scale table (scale · blocks · form IoU · speckle · distinct · off-pal · value ΔE · stray ·
largest-frac), the **chosen scale + reason** (incl. the tie-break note), a non-monotonicity note (angular
forms can read worse at high scale — the kept scale is the best IoU, not the biggest block count), and a
cleanliness headline (off-palette 0? speckle ≤ E-19 bar? single mass?). Null-tolerant per `e19-cleanup`.

### `src/form/building-build.test.mjs` — pure unit tests (CI-safe)

~10–12 cases, no GL/I/O:
- `pickBestScale`: clear winner (highest IoU); **tie-break** (top-2 within eps → lower scale chosen,
  `tieBreak:true`, reason names it); a NON-monotonic set (48 > 96 IoU → 48 kept though 96 has more blocks);
  null formIoU rows rank last / all-null → graceful; the `reason` string content.
- `buildingRow`: pass-through + guards (missing fields tolerated).
- `assembleBuildingBuild`: the table + the chosen line + the non-monotonicity note present; empty rows →
  degenerate-but-valid (no throw); throws on non-array rows.

### `benchmarks/sculpture/building-build.mjs` — IMPURE runner (live + `--offline`)

Cloned from `e19-build.mjs` (per-cell compose+score), iterating SCALES of one subject. Owns GLB read, dwebp
decode, GL render, file I/O. NOT unit-tested.

```
const SUBJECT = { key:"building", glb:"stone-gatehouse.glb",
                  run:"015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate" }
const SCALES = [48, 64, 96]   // a couple+ tried; --scales overrides; the pure pick keeps the best-reading

decodeTexture(baseColor)              // WebP→PNG via dwebp (the impure edge), clone of e19-build
judgeIoU(renderPath, glbBytes)        // GLB silhouette IoU at BUILDING_VIEW_3Q (e19-build pattern, building view)
buildAtScale(scale, {glbBytes, surface, texture, designManifest, renderArtifact}) → row
                                      // voxelizeRouted → gated pruneStrays → segmentMaterials(augmented) →
                                      // assertArtifact + assertPaletteDiscipline → render → score → write
                                      //   building/scale-<n>/{artifact.json, summary.json}
runLive({ scales })                   // build each scale → pickBestScale → copy chosen to building/best/ →
                                      //   emit building-build.{md,json} → copy pr/assets/frames/building-best.png
verifyOffline()                       // re-derive the pick + report from committed scale-<n>/summary.json, no GL
emit(rows, chosen)                    // assembleBuildingBuild → write the report
```

Reuses, never re-implements: `voxelizeGlb`/`voxelizeRouted`/`formTypeOf`, `parseGlbColoredSurface`,
`segmentMaterials`/`speckleScore`/`offPaletteCount`, `paletteFromManifest`/`assertPaletteDiscipline`,
`augmentPalette`, `pruneStrays`/`strayVoxelStats`, `extractTexturePalette`, `valueGate`/
`realizedPaletteFromArtifact`, `loadMeshFromGlb`/`rasterizeSilhouette`/`extractSilhouette`/`iou`,
`assertArtifact`, `BUILDING_VIEW_3Q`/`BUILDING_DEFAULT_SCALE` (from `building.mjs`), `renderArtifact`,
`occupancyFromArtifact`. The design-doc manifest = `runs/015-…/artifact.json` `palette.manifest`.

## Modified files (additive only)

- `package.json` — add `"building:build": "node benchmarks/sculpture/building-build.mjs"`.
- `.gitignore` — add `benchmarks/sculpture/building/**/*.png` (renders gitignored; artifacts/summaries
  committed) + (if added) `pr/assets/frames/building-best.png` stays committed (a frame, like the others).

## Generated artifacts (committed)

- `benchmarks/sculpture/building/scale-<n>/{artifact.json, summary.json}` per scale tried.
- `benchmarks/sculpture/building/best/artifact.json` — the chosen scale's AJV-valid deliverable.
- `benchmarks/sculpture/building-build.{json,md}` — the per-scale table + the pick + the why.
- `pr/assets/frames/building-best.png` — the chosen render (E-12 nicety).

## Ordering (matters)

1. Pure module + tests first (the contract; `npm test` green before any live run).
2. The runner; verify wiring with `--offline` once a scale summary exists (or against a stub).
3. Live: build 48 + 64 (+96 if cheap) → pick → emit → copy best + frame.
4. `npm test`; commit incrementally per the plan.

## Interfaces / boundaries

- **Purity boundary** = the file split: the scale pick + report are pure (the AC core); the runner is the
  only GL/dwebp/I/O surface. The suite never pulls GL or a host tool (the idiom).
- **`building-build/v1`** is the durable record schema downstream reads. Stable or bump.
- **No coupling to E-21** — this is the colorimetric E-19 high-res build; it does not import the T-071/T-072
  map/feature path.
