# T-072-01 — feature-aware-assignment · Progress

All 7 plan steps complete. `npm test` green (706). No deviations from the plan.

## Completed

- **Step 1–2 — pure core** `src/form/feature-classify.mjs` (committed `feat: pure geometric feature
  classifier + assigner`). `classifyFeatures` (band ∪ exposure, priority base→top-roof→opening-recess→
  edge-corner→flat-face), `assignFeatureBlocks` (feature→rule→map block primary; E-14 `nearestLab`
  silent-map fallback), `mapByRule`, `fallbackPalette`, `featureCounts`, `featureBlockMatrix`.
- **Step 3 — unit tests** `src/form/feature-classify.test.mjs`, 15 cases (same commit). Synthetic prism +
  carved-slot recess, frozen vocab, brick≠cobble-by-feature, silent-map fallback (colors vs default),
  AJV round-trip via `keysToArtifact` + `assertArtifact`.
- **Step 4 — runner** `benchmarks/sculpture/material-assign.mjs` + `.gitignore` entry (committed
  `feat: material-assign runner + offline re-verify`). Live build + `--offline` re-verify.
- **Step 5–6 — live gatehouse build.** Ran `node benchmarks/sculpture/material-assign.mjs`: 8076 cells,
  5 blocks, **brickNotCobbleByFeature=true** (walls=stone_bricks dominates flat-face; corners=cobblestone
  dominates edge-corner). Render inspected — corner columns read visibly distinct from the wall field.
  Committed `material-assign/gatehouse.json` + build `artifact.json` (PNG gitignored).
- **Step 7 — `package.json`** `"material:assign"` script.

## Results (the AC#4 evidence)

Feature distribution: flat-face 5431, top-roof 1083, edge-corner 880, opening-recess 407, base 275.
Block × feature matrix (clean separation):
- `stone_bricks` → flat-face 5431 (walls)
- `cobblestone` → edge-corner 880 (corners/buttresses) — **the restored distinction**
- `deepslate_tiles` → top-roof 1083 (roof)
- `dark_oak_planks` → opening-recess 407 (gate/door reveals)
- the 275 `base`-band cells (map silent for `base`) distributed by the colorimetric fallback:
  stone_bricks 131, deepslate_tiles 128, cobblestone 8, dark_oak_log 8 — E-14 doing exactly its demoted
  job (color fills where the map is silent).

## Deviations

None. Defaults `baseBand=1`, `upperFrac=0.6`, `recessFlank=2` were not tuned — the first render zoned
correctly (corners cobble, walls brick, roof deepslate).

## Known limitations (carried to Review)

- **`trim` is unplaced by geometry** — the gatehouse map's `dark_oak_log` (arch voussoir) has no geometric
  feature; recorded in `unplacedRules`. It surfaced on 8 base cells only via the colorimetric fallback,
  not as the voussoir ring. Documented gap (the coarse classifier can't isolate a 1-block trim band).
- GLB is a TRELLIS reconstruction (lumpy) — feature boundaries are fuzzy but the manifest/matrix
  separation is unambiguous.
