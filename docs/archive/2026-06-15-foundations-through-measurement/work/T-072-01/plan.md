# T-072-01 — feature-aware-assignment · Plan

Six ordered, independently-verifiable steps. Steps 1–4 + 7 are pure/CI-safe and gate the ACs `npm test`
checks; Steps 5–6 are the metered GL live proof (committed JSON, gitignored PNG). Commit after each.

## Step 1 — Pure classifier `classifyFeatures`

`src/form/feature-classify.mjs`: imports, `FEATURES`, `FEATURE_RULE`, `CLASSIFY_DEFAULTS`, adjacency
consts, `occupiedKeySet`, and `classifyFeatures(occupancy, opts)`.
- Pass 1: build occupied `Set<"i,j,k">`, track `jMin`/`jMax`.
- Pass 2: per cell compute `surface`, `upwardFacing`, `horizExposed`, recess flank; apply priority
  base → top-roof → opening-recess → edge-corner → flat-face; set Map entry.
- **Verify:** `node -e` smoke on a hand-built 3×3×3 prism prints a feature for every cell, no throws.
- **Commit:** `feat(E-21 T-072-01): pure geometric feature classifier`.

## Step 2 — Assigner + helpers

Add `mapByRule`, `fallbackPalette`, `assignFeatureBlocks`, `featureCounts`, `featureBlockMatrix` to the
same file.
- `assignFeatureBlocks`: walk `occupiedCells`; feature→rule→map block (primary); silent rule →
  `nearestLab(srgbToLab(rgb), palette)` when `colors` given, else `defaultBlock`/walls block; strip to bare
  key.
- `fallbackPalette(map)`: `paletteFromMap(map)` → `[{key:bareBlock, lab}]` from `loadBlockTable`.
- **Verify:** `node -e` smoke: stub map + prism → keys length === count, edge-corner→cobblestone,
  flat-face→stone_bricks.
- **Commit:** `feat(E-21 T-072-01): feature→block assigner + colorimetric fallback`.

## Step 3 — Unit tests (the AC#2/#3 gate)

`src/form/feature-classify.test.mjs` per Structure's case list:
- frozen vocab; prism classification (base/edge-corner/flat-face/top-roof); carved-slot recess; interior
  default; assigner brick≠cobble; silent-map fallback (colors vs default); **AJV round-trip**
  (`keysToArtifact` + `assertArtifact`); helper shapes.
- **Verify:** `npm test` → green; new file's cases all pass; suite total grows (~691 + new).
- **Commit:** `test(E-21 T-072-01): feature classifier + assigner unit tests`.

## Step 4 — Runner skeleton + `--offline`

`benchmarks/sculpture/material-assign.mjs`: arg parse (`--offline`, scale), imports, `readJson`, the
`--offline` branch (re-read committed `material-assign/gatehouse.json` + built `artifact.json`,
`occupancyFromArtifact` → `featureBlockMatrix` → re-assert brick≠cobble, no GL), `main()` wiring, the
`feature-assign` style object. Live branch stubbed/guarded so the file imports cleanly.
- **Verify:** `node benchmarks/sculpture/material-assign.mjs --offline` runs without GL (prints "no
  committed artifact yet" gracefully before Step 5). Syntax/import clean.
- **Commit:** `feat(E-21 T-072-01): material-assign runner + offline re-verify`.

## Step 5 — Live gatehouse build (metered/GL)

Implement the live branch: voxelize `glb/stone-gatehouse.glb` → sample colors → load
`material-map/gatehouse.json` → `classifyFeatures` → `assignFeatureBlocks` → `keysToArtifact` →
`assertArtifact` → `renderArtifact` (3Q) → `featureBlockMatrix`.
- Tune `baseBand`/`upperFrac` only if the render visibly mis-zones (record any change in `progress.md`).
- **Verify:** run completes; `assertArtifact` passes; render PNG produced; manifest has BOTH
  `minecraft:cobblestone` and `minecraft:stone_bricks`; matrix shows cobble trending on `edge-corner` and
  stone_bricks on `flat-face`.
- **Commit:** `feat(E-21 T-072-01): live feature-assign gatehouse build + render`.

## Step 6 — Commit the artifacts of record

Write/commit `benchmarks/sculpture/material-assign/gatehouse.json` (schema, subject, scale, featureCounts,
manifest, matrix, `brickNotCobbleByFeature`, blocksByRule, trim-unplaced note) and the build
`artifact.json`. Confirm PNG is gitignored (matches `e19-build`); JSON committed.
- **Verify:** `git status` shows only JSON staged under `material-assign/`, no PNG; `--offline` now
  re-verifies the committed artifact green.
- **Commit:** `docs(E-21 T-072-01): saved feature-assign gatehouse map + artifact (live run)`.

## Step 7 — `package.json` script

Add `"material:assign"`. Final `npm test` green.
- **Commit:** `chore(E-21 T-072-01): material:assign npm script`.

## Testing strategy

- **Unit (`npm test`, CI-safe):** all of the classifier's geometry + the assigner's feature-primary /
  silent-fallback logic on synthetic occupancy, plus the AJV round-trip. This is where AC#1, AC#2, the
  assigner half of AC#3, and AC#5 (`npm test` green) are proven. No GLB, no GL, no color sampling, no
  metered call.
- **Live (manual, metered/GL):** the gatehouse build proves AC#4 (real GLB, real render, manifest carries
  both materials by feature) and the IO half of AC#3 (real artifact through the AJV gate). Verified by the
  committed `material-assign/gatehouse.json` + `--offline` re-check — the e19-build idiom.

## Verification commands

- `npm test` → green (artifact self-test + unit suite incl. new feature-classify cases).
- `node benchmarks/sculpture/material-assign.mjs` → live gatehouse build + render + write.
- `node benchmarks/sculpture/material-assign.mjs --offline` → re-verify brick≠cobble from committed JSON.

## Acceptance-criteria → step map

- AC#1 `classifyFeatures` pure/deterministic/GL-free → Step 1.
- AC#2 synthetic-mass unit test (corners/top/base/faces/inset) → Step 3.
- AC#3 assigner + colorimetric fallback, AJV-valid → Steps 2, 3 (round-trip), 5 (real).
- AC#4 gatehouse: corners cobblestone, walls stone_bricks, restored & verified → Steps 5, 6.
- AC#5 `npm test` green → Steps 3, 7.
