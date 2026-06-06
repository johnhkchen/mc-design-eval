# T-072-01 — feature-aware-assignment · Review

Handoff. E-21's "place style" step ships: a PURE geometric feature classifier + a feature-aware assigner
that places the T-071 material map's block by *where a voxel is*, not its colour — restoring the
stone_bricks-vs-cobblestone distinction mean-colour matching collapses. All 5 ACs met; `npm test` green
(706). 4 commits, purely additive.

## What changed (files)

**Created**
- `src/form/feature-classify.mjs` — PURE core (the heart). `classifyFeatures(occupancy) →
  Map<"i,j,k", feature>` over `{flat-face, edge-corner, top-roof, base, opening-recess}`;
  `assignFeatureBlocks(occupancy, features, map, opts) → bare keys[]`; helpers `mapByRule`,
  `fallbackPalette`, `featureCounts`, `featureBlockMatrix`; `FEATURES`, `FEATURE_RULE`, `CLASSIFY_DEFAULTS`.
- `src/form/feature-classify.test.mjs` — 15 unit cases (synthetic mass; AJV round-trip).
- `benchmarks/sculpture/material-assign.mjs` — IMPURE runner (live build + `--offline` re-verify).
- `benchmarks/sculpture/material-assign/gatehouse.json` — the record of AC#4 (manifest + block×feature
  matrix + verdict).
- `benchmarks/sculpture/material-assign/gatehouse/artifact.json` — the built DesignArtifact (AJV-valid).

**Modified**
- `package.json` — `"material:assign"` script.
- `.gitignore` — `material-assign/**/render-3q.png` (renders derived/gitignored, the project convention).

**Untouched** — `src/artifact.mjs`, the schema, the block→Lab table, `material.mjs`, `material-map.mjs`,
`glb-voxel-build.mjs`, `cielab.mjs`, every existing runner. Zero regression surface beyond new files +
two additive lines.

## How it works (the design in one paragraph)

`classifyFeatures` reads only `{dims, occupied, count}` (no colour, no GL). Per cell it combines a
**vertical band** signal (lowest layer → `base`; upward-facing surface in the top 40% → `top-roof`) with a
**horizontal exposure** signal (an exterior empty cell enclosed by wall → `opening-recess`; exposed on
≥2 horizontal sides → `edge-corner`; else → `flat-face`/interior), resolved by a fixed priority so the
output is deterministic. `assignFeatureBlocks` maps each feature → a `placementRule` (`FEATURE_RULE`) →
the map's block — **the primary path, chosen by form**. When the map is silent for a cell's rule (the
gatehouse names no `base`), the demoted E-14 `nearestLab` matcher fills it from the cell's sampled colour;
with no colours it falls to a deterministic default. The runner samples colours, builds the artifact via
`keysToArtifact`, runs the AJV gate, renders, and tabulates the block×feature matrix.

## AC verification

- **AC#1** `classifyFeatures → Map<cell, feature>`, pure/deterministic/GL-free — ✓ (`feature-classify.mjs`;
  determinism unit-tested).
- **AC#2** synthetic-mass unit test — ✓ prism: lowest layer→base, top→top-roof, mid edge column→
  edge-corner, broad face→flat-face; carved slot back→opening-recess (a flat wall is not).
- **AC#3** assigner places the map's block per feature; colorimetric matcher kept for within-material
  value + silent-map fallback; output passes the AJV gate — ✓ (unit: brick≠cobble by feature,
  fallback with/without colours, `keysToArtifact`+`assertArtifact` round-trip).
- **AC#4** gatehouse: corners/buttresses **cobblestone**, walls **stone_bricks**, distinction restored,
  verified in manifest + render — ✓ live run: `brickNotCobbleByFeature=true`; matrix:
  cobblestone→edge-corner 880 / stone_bricks→flat-face 5431 / deepslate→top-roof 1083 /
  planks→opening-recess 407. Render confirms distinct corner columns vs wall field.
- **AC#5** `npm test` green — ✓ 706 pass, 0 fail.

## Test coverage

- **Unit (`npm test`, CI-safe):** 15 cases cover the frozen vocabulary, all five feature rules on a
  synthetic prism, the recess test on a carved slot, the interior default, determinism, `baseBand`/
  `upperFrac` opts, empty occupancy, the assigner's feature-primary placement and BOTH silent-map fallback
  branches (colour and default), and the AJV round-trip. The pure core is fully exercised offline.
- **Live (manual, GL):** the gatehouse build (`material:assign`) proves AC#4 on the real GLB; re-checkable
  with `material:assign -- --offline` (re-runs the matrix + AJV on the committed artifact, no GL).

**Coverage gaps (by design):** the runner's live branch (voxelize, texture decode via `dwebp`, GL render)
is NOT unit-tested — the suite must never pull GL or a host tool (the project idiom, same as
`e19-build.mjs` / `material-map.mjs`). It is exercised by the committed live run + the offline re-verify.

## Open concerns / flags for a human reviewer

1. **`trim` is unplaced by geometry (known gap).** The gatehouse map's `dark_oak_log` arch voussoir
   (`placementRule: trim`) has no geometric feature — a 1-block accent band is below the resolution of
   form-based zoning. It is recorded in `unplacedRules` and surfaced on only 8 base cells via the colour
   fallback, not as the voussoir ring. If E-21 wants trim placement, that needs a finer selector (e.g.
   "the ring around an opening-recess"), separate from this coarse classifier — same spirit as T-071-01's
   door/lantern fixtures note. Worth a line on the epic.
2. **Lumpy GLB → fuzzy feature boundaries.** The gatehouse is a TRELLIS reconstruction; corner/face edges
   are not crisp. The manifest/matrix separation is unambiguous (the metric is "each material dominates
   its own feature"), but a per-cell render is not pixel-perfect architectural zoning. Acceptable for the
   "restore the collapsed distinction" goal; not a guarantee of clean masonry coursing.
3. **Tunables not swept.** `baseBand=1`, `upperFrac=0.6`, `recessFlank=2` zoned the gatehouse correctly on
   the first run, so they were not tuned. They are `opts`-overridable per subject; a second subject (the
   cottage map exists) may want different values — left for a follow-up if E-21 broadens.
4. **`opening-recess` can over-claim concave corners.** The recess test flags any exterior empty cell
   enclosed by ≥2 in-plane walls, which includes the inner corner of an L-shaped footprint, not only
   doors/windows. Harmless on the gatehouse (407 recess cells map to the openings block, which is the
   intended dark wood); flagged in case a future subject has large concave massing.
5. **The map is the upstream contract.** This consumes `material-map/<subj>.json` (`schema
   material-map/v1`). If T-071's schema version-bumps, re-run `material:assign`. The committed
   `material-assign/gatehouse.json` (`schema material-assign/v1`) is the durable record; the PNG is
   regenerable and gitignored.

## Verification commands
- `npm test` → 706 pass.
- `node benchmarks/sculpture/material-assign.mjs` → live gatehouse build + render + write.
- `node benchmarks/sculpture/material-assign.mjs --offline` → re-verify brick≠cobble from committed JSON.
