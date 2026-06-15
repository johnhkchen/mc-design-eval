# T-118-01 roof-form-seam — Structure

File-level blueprint. Layering rule observed throughout: `src/view/` may import `src/form/`,
never the reverse; runners in `benchmarks/sculpture/` import both and own all fs/argv.

## New files

### `src/view/roof-region-diff.mjs` — the pure instrument core

Lives view-side (needs `exposedFaceMesh`/`voxelSilhouettes` from `shell-regularize.mjs` and
`resolveAngle` from `multi-angle.mjs`; pulls `cameraForMeshBounds`, `projectPoint`,
`rasterizeSilhouette` from `src/form/glb-silhouette.mjs`, `alignedTriangles` from
`src/form/roof-end-fit.mjs`, `normalizeSilhouette`/`normalizePlacement` from
`src/form/form-fidelity.mjs`). No fs, no GL, no Date/random.

Exports:

- `ROOF_DIFF_SCHEMA = "roof-region-diff/v1"`
- `ROOF_DIFF_DEFAULTS` — `{ grid: REGULARIZE_DEFAULTS.grid, precedence: ["ridge","ends","eaves","slopes"],
  endBandWidth: 1 }` — declared once, shared across subjects (no tuning; grid reuses the cage's).
- `roofRegions(gables, occ, { bandFloor })` → per-column region map:
  `{ assign: Map<"x,z"→"ridge"|"ends"|"eaves"|"slopes">, tops: Map<"x,z"→y>, bandFloor,
     fallback: null | {region:"unpartitioned", reason} }`
  - ridge: gable ridge cells; ends: run-coord beyond `ends.{lo,hi}.faceCoord` (or the outermost
    footprint column band, width `endBandWidth`, when no fitted end); eaves: `eaveEdge` strips
    along each side's `eaveDir`; slopes: remaining footprint. Precedence resolves overlaps.
  - `tops` from the build heightfield restricted to the roof band (y ≥ bandFloor).
  - Empty/absent gables → `fallback` populated; `assign` maps every roof-band column to
    `unpartitioned`.
- `projectRegions(regionMap, meshBounds, view, { width, height })` → per-azimuth projected points
  `[{ region, sx, sy }]` via `cameraForMeshBounds` + `projectPoint` (the same camera
  `rasterizeSilhouette` derives — meshBounds is the build's `exposedFaceMesh().bounds`).
- `attributeMismatch({ buildSil, refSil, points, grid })` → one azimuth's diff:
  `{ iou, mismatchPx, byRegion: { [region]: { extra, missing } }, wall: { extra, missing } }`
  - both masks normalized to `grid` under their OWN bbox (the cage's comparison); projected points
    mapped through the build mask's placement (`normalizePlacement`); each XOR pixel attributed to
    the nearest point's region (squared-distance; precedence order breaks exact ties); points whose
    column sits below bandFloor carry region `wall`.
- `heightProfiles({ gable, tops, aTris })` → `{ ridge: {build:[], glb:[], raw:[], eaveRel:[],
  rmse, maxAbs, mean}, rakes: [{end:"lo"|"hi", ...same}] }`
  - GLB heights: per column-line cell, max y of `aTris` triangle coverage over the cell footprint
    (point-in-triangle on the xz projection, y interpolated; columns with no triangle → null,
    excluded from rmse, counted as `uncovered`).
  - eave anchors: build = gable side `eaveY` (mean of sides); GLB = median sampled height over the
    recorded eave-edge columns. Both recorded.
- `roofRegionDiff({ occ, gables, mesh, alignment, azimuths, grid })` → full record body:
  `{ schema, regions: {counts, fallback}, views: { [azimuth]: attributeMismatch result },
     profiles: [per gable], summary }` — floats rounded to 3 decimals before return.

### `src/view/roof-region-diff.test.mjs`

Node built-in runner, synthetic fixtures only: hand-built gables + tiny occupancies (a 5×3×5
gabled box), synthetic masks for attribution (known XOR pixels land in known regions), synthetic
triangles for profile sampling. Determinism test: two calls byte-identical via
`JSON.stringify`. Partition test: Σ byRegion + wall === mismatchPx (nothing dropped).

### `benchmarks/sculpture/roof-diff.mjs` — the runner (impure shell)

Mirrors `roof-program.mjs` conventions (double-run + sha256, params block with the no-tuning
note, `--repro` re-check). CLI: `npm run diff:roof [-- --subject <s>] [--path generated|reconstructed]`.

Per subject (iterating `SUBJECTS` — no subject keys in this file) × path:

| path | build artifact | gables source | bandFloor |
|---|---|---|---|
| generated | `generated/<s>/artifact.json` | `generated/<s>/provision-fit.json` `roofs[].gables` | provision-fit roof record |
| reconstructed | `challenge/<s>/artifact.json` | `roof/<s>.json` accepted gables (swap-final if recorded, else `fit.gables` + endFit) | `roof/<s>.json` band floor |

- GLB: `SUBJECTS[s].glb` → `loadMeshFromGlb` (silhouettes) + `parseGlbMesh` + `aabbAlignment(mesh.bounds,
  occ.bounds)` (profiles) — the same two uses roof-program has.
- refSils at `MULTI_ANGLE_GATE.azimuths` (config-frozen).
- Missing input (no committed build on a path) → record `{ status: "skipped", reason }` — barn gets
  `"T-117 not landed — no committed build on either path"`. Skip records are committed too.
- Outputs:
  - `benchmarks/sculpture/roof-diff/<s>-<path>.json` — committed record.
  - `benchmarks/sculpture/roof-diff/<s>-<path>/view-<angle>.png` — overlay renders (build mask
    grey, `missing` red, `extra` blue, tinted by region brightness), via pngjs — **gitignored**.
  - `pr/assets/frames/roof-diff-<s>-<path>.png` — 4-up contact sheet with caption bar
    (node-canvas, the multi-angle-gate pattern) — **committed** (the AC's "renders committed").
  - `benchmarks/sculpture/roof-diff/<s>-<path>.md` — human summary beside the JSON (record-pair
    convention used by roof/, generated/).

### `benchmarks/sculpture/roof-diff/findings.md`

The committed analysis (AC 2): per subject, which regions carry the deltas behind the failing
verdicts; the gatehouse `-x+z` (315°) decomposition called out explicitly; each proposed refit (or
named impossibility) cites these numbers. Work-dir copy: `docs/active/work/T-118-01/findings.md`.

## Modified files

- **`src/form/form-fidelity.mjs`** — factor `resampleInto`'s placement header (tw/th/ox/oy from
  bbox, G, fit) into an exported `normalizePlacement(bbox, { grid, fit })`; `resampleInto` calls
  it. Behavior-identical (existing tests must pass unchanged); new export lets the diff module map
  screen points through the exact letterbox transform instead of re-deriving it (one-definition
  rule, the T-113 lesson).
- **`package.json`** — add `"diff:roof": "node benchmarks/sculpture/roof-diff.mjs"`.
- **`.gitignore`** — add `benchmarks/sculpture/roof-diff/**/*.png` (JSON/md committed; per-view
  overlays regenerable). Contact sheets live under `pr/assets/frames/` which is already committed.
- **Refit wave (gated on findings — E-30 Rule 2; exact set decided in Implement):**
  - `src/form/roof-ridge-fit.mjs` — candidate `ridgeApexDifferential(gable, apexLine, glbEave)`:
    ridge y = voxel eave anchor + (glbApex − glbEave), rounded to halves; sanity-gated like
    `ridgeFromPlanes` (above eaves, within run window). Pure + unit tests.
  - `src/view/roof-swap.mjs` — wire the new rung flavor into the ladder (where `-ridge-fit` sits),
    judged by the unchanged cage. No threshold changes.
  - `src/form/roof-end-fit.mjs` — only if findings attribute cottage mismatch to the ends; any new
    evidence source is a named `source` value on the existing record shape, fallback semantics
    unchanged.
  - `benchmarks/sculpture/roof/{gatehouse,cottage}.json` (+ `.md`) — regenerated by re-running
    `roof-program.mjs` for refit subjects; new shas recorded by the runner itself.
  - `benchmarks/sculpture/roof-diff/*` — re-run after refits; before-state preserved in git and
    copied to `docs/active/work/T-118-01/artifacts/before/` for side-by-side reading.

## Not touched

- `multi-angle-gate.mjs`, judge-reply seams, `styled-milestone.mjs`, kit/zone records, pins — no
  judge runs, no gate re-runs (S-121).
- Cage thresholds (`iouTolerance` 0.02, `programRmseTol` 0.75), sanity gates, fallback semantics.
- Legacy single-mass paths (sculpture mode) — roof-swap ladder additions only activate when
  `endFit`/`ridgeFit` inputs exist (component subjects); legacy `--repro` asserted after.

## Interfaces & ordering constraints

1. `normalizePlacement` extraction lands first (everything else reads it).
2. `roof-region-diff.mjs` + tests next (pure, reviewable in isolation).
3. Runner + gitignore + npm script; then instrument run → records/sheets/findings committed
   (the BEFORE state — the standing instrument exists even if every refit were refused).
4. Refits, one subject per commit, each: pure change + tests → `roof-program` re-run → `diff:roof`
   re-run → before/after numbers into findings.md.
5. Final: `npm test`, `diff:roof -- --repro`-style double-run check, legacy `--repro` spot-check.
