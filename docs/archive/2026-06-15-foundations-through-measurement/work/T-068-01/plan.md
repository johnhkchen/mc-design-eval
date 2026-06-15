# T-068-01 — high-res-voxel-build · Plan

Ordered, independently-verifiable steps. Pure selector first (keeps `npm test` green), then the runner wired
against committed data, then the live multi-scale build + pick, then final verification. Atomic commits.

## Step 1 — Pure scale-selector + report (`src/form/building-build.mjs` + `.test.mjs`)

- Write `pickBestScale` (IoU-desc rank; top-2-within-eps → lower scale; reason string + tieBreak flag),
  `buildingRow`, `assembleBuildingBuild` + `render*Md`. Mirror `e19-cleanup.mjs` (schema const, null-tolerant).
- Write 10–12 unit cases (Structure §test): clear winner, tie-break→lower, NON-monotonic (48>96 kept though
  96 bigger), null/all-null tolerance, the report tables + non-monotonicity note, empty-rows degeneracy,
  throw on non-array.
- **Verify:** `npm test` → 758 + new cases, 0 fail.
- **Commit:** `feat(E-20 T-068-01): pure building-build scale selector + report`.
- AC: #1 (the "best-reading kept, recorded why" core).

## Step 2 — The runner + `--offline`, wired against committed data

- Write `benchmarks/sculpture/building-build.mjs`: `SUBJECT`/`SCALES`, imports, `decodeTexture`, `judgeIoU`
  (BUILDING_VIEW_3Q), `buildAtScale`, `runLive`, `verifyOffline`, `emit`. Read the design-doc manifest from
  `runs/015-…/artifact.json`.
- Add `package.json` `"building:build"` + `.gitignore` render glob.
- **Verify:** `node benchmarks/sculpture/building-build.mjs --offline` runs without GL (degenerate/empty
  report if no summaries yet, no throw); `npm test` still green.
- **Commit:** `feat(E-20 T-068-01): building-build runner + offline re-derive`.
- AC: #3 (the record path).

## Step 3 — Live multi-scale build + clean + score (the payoff)

- Implement `buildAtScale`: `voxelizeRouted({subject:"building", scale})` → gated `pruneStrays` →
  `segmentMaterials` under `augmentPalette(paletteFromManifest(designManifest), texture)` → `assertArtifact`
  + `assertPaletteDiscipline(cap = designDoc+2)` → render at `BUILDING_VIEW_3Q` → score (form IoU, speckle,
  distinct, off-pal, value ΔE, occ, stray). Write `building/scale-<n>/{artifact.json, summary.json}`.
- Run scales 48 + 64 (+96 if it completes cheaply). Build is single-mass (largestFraction 1.0) → prune no-op.
- `pickBestScale` → copy chosen to `building/best/artifact.json`; `emit` the report; copy
  `pr/assets/frames/building-best.png`.
- **Verify:** each scale's artifact passes AJV + palette discipline; **block count markedly > the ~32
  sculptures** (e.g. thousands of cells); off-palette **0**; the report records the chosen scale + why; the
  best render reads as a recognizable building (visual + IoU). `node … --offline` re-derives the same pick.
- **Commit:** `feat(E-20 T-068-01): high-res building build — scales {48,64,96}, best kept` (chosen scale in
  the body).
- AC: #1, #2, #3.

## Step 4 — Final verification + handoff

- `npm test` → green. `node … --offline` → re-derive pick + re-validate all `best/`+`scale-<n>` artifacts.
- Confirm: block count recorded, form IoU per scale recorded, cleanliness axes (speckle/distinct/off-pal)
  recorded under `benchmarks/.../building/`, the npm script present, the chosen artifact committed.
- **Commit:** any cleanup; write `review.md`.
- AC: #4 + the AC#1–#3 evidence consolidated.

## Testing strategy

- **Unit (`npm test`, CI-safe):** the entire pure selector — `pickBestScale` (winner, tie-break→lower,
  non-monotonic-kept, null tolerance, reason content), `buildingRow` guards, `assembleBuildingBuild` (tables,
  chosen line, non-monotonicity note, empty/degenerate, throw-on-non-array). Deterministic, no GL/model.
- **Live (manual, GL + dwebp):** the build/clean/render/score branch — exercised by the committed multi-scale
  run; re-checkable via `--offline` (re-derives the pick + re-validates artifacts, no GL). The GL/dwebp edge
  is the project's standard untested surface (matches `e19-build.mjs`).
- **Verification criteria:** AC#1 ≥2 scales tried + best kept + recorded why + AJV-valid; AC#2 E-19 clean
  (0 off-augmented-palette, no busy blocks, segmented, stray-pruned principal mass); AC#3 building-view render
  + block count + form IoU + cleanliness axes under `building/`; AC#4 `npm test` green.

## Risk register

- **Non-monotonicity surprises (the point).** A higher scale may read worse — that is the expected finding;
  `pickBestScale` + the tie-break handle it, and the report records it. Not a failure.
- **High scale slow / heavy (96).** Mitigation: 48 + 64 are the required pair; 96 is optional and skipped if
  it doesn't complete cheaply (recorded as not-run, not a blocker). `--scales` overrides.
- **GL render of a large building artifact.** Verified GL works (T-074); a bigger artifact is more cells but
  the same path. If a scale OOMs/fails, that scale's row is null and the pick falls to the others (graceful).
- **Palette-discipline assertion fails (busy block admitted).** Would surface a real E-19 regression; the
  augmented design-doc palette (4 + ≤2) is the same discipline E-19 proved — expected to pass; if not, it is
  a genuine finding to record, not silence.
- **GLB absent on a fresh checkout (gitignored).** Runner skips with a clear message; `--offline` works off
  committed summaries.
