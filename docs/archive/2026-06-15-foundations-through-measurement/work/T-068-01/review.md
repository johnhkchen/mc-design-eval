# T-068-01 — high-res-voxel-build · Review

Handoff. E-20's higher-resolution build ships: the whole-building GLB (T-067-01, `stone-gatehouse.glb`)
voxelized at a deliberately high scale, cleaned with the matured E-19 pipeline, rendered at the building 3/4
view, scored across a couple of scales with the **best-reading** kept (not the biggest block count). All 4
ACs met; `npm test` **767 green** (was 758; +9 pure selector cases). 2 commits this session, purely additive.

## What changed (files)

**Created**
- `src/form/building-build.mjs` — PURE scale-selector + report (the AC#1 core). `pickBestScale` (rank by form
  IoU; top-2-within-eps → keep the LOWER scale — the explicit "best-reading, not biggest" rule; a non-
  monotonic-aware reason string), `buildingRow`, `assembleBuildingBuild` → `{md,json}`. Mirrors
  `e19-cleanup.mjs`; no GL/I/O/Date/random.
- `src/form/building-build.test.mjs` — 9 unit cases (clear winner, tie-break→lower, non-monotonic-kept, null
  tolerance, the report tables/headline, empty-rows degeneracy, throw-on-non-array, unclean-flag).
- `benchmarks/sculpture/building-build.mjs` — IMPURE runner (live + `--offline` + `--scales`). Clones the
  `e19-build.mjs` per-cell compose+score over SCALES of one subject; `buildAtScale` does voxelize → gated
  prune → segment under the augmented design-doc palette → AJV + palette-discipline → render at
  `BUILDING_VIEW_3Q` → score; picks best; copies the chosen to `building/best/` + the frame.
- `benchmarks/sculpture/building-build.{json,md}` — the per-scale table + the pick + the cleanliness headline.
- `benchmarks/sculpture/building/scale-{48,64}/summary.json` — per-scale metrics (lightweight record).
- `benchmarks/sculpture/building/best/artifact.json` — the chosen (scale-64) AJV-valid deliverable (8.1 MB).
- `pr/assets/frames/building-best.png` — the chosen render (E-12 nicety).
- `docs/active/work/T-068-01/{research,design,structure,plan,review}.md`.

**Modified (additive only)** — `package.json` (`building:build` script), `.gitignore` (per-scale renders +
the large regenerable per-scale `artifact.json`; the summaries + `best/artifact.json` are committed).

**Untouched (zero regression surface)** — every pipeline module (voxelize/routing/segment/prune/augment/
value-gate/silhouette/building), the schema, the block→Lab table, every existing runner. This ticket adds a
build runner + a pure selector; it changes no cleaning capability (it composes the proven E-19 pipeline).

## Results

| scale | blocks | form IoU | speckle | distinct | off-pal | value ΔE | stray | largest-frac |
| ----- | ------ | -------- | ------- | -------- | ------- | -------- | ----- | ------------ |
| 48 | 22,879 | 0.908 | 0.002 | 4 | 0 | 1.65 | 0 | 1.0 |
| **64 ✓** | **57,202** | **0.929** | 0.001 | 4 | 0 | 1.73 | 0 | 1.0 |

**Chosen: scale 64** — highest form IoU (0.929) at the highest scale tried; more resolution still read better,
so the high-scale regression that bites angular *sculptures* did not appear for the bulky building up to the
ceiling. **57,202 blocks** is markedly more than the ~32-block sculptures (hundreds–low-thousands of cells) —
the "full-fledged" E-20 payoff. Both scales are dead clean: **off-palette 0**, **speckle ~0** (≤ the E-19
0.05 bar), **distinct 4** (the design-doc flat palette `[stone_bricks, cobblestone, deepslate_tiles,
dark_oak_log]`, no busy blocks), **single mass** (largest-fraction 1.0).

## AC verification

- **AC#1** building GLB voxelized at high scale → AJV-valid `DesignArtifact`; ≥2 scales tried, best-reading
  kept + recorded why — ✓ (48 + 64 built; chosen 64 with the reason in `building-build.{md,json}`;
  `best/artifact.json` passes `assertArtifact`; 22,879 / 57,202 blocks ≫ the sculptures).
- **AC#2** E-19 clean: value-true within the design-doc flat palette (0 off-augmented-palette, no busy
  blocks), segmented, stray-pruned principal mass — ✓ (off-pal 0, distinct 4, speckle ~0, single mass;
  `assertPaletteDiscipline(cap = designDoc+2)` passes; prune gated — the build is single-mass so prune is the
  E-19 no-op safety net).
- **AC#3** rendered at a building-appropriate view; block count + form IoU vs the GLB + cleanliness axes
  recorded under `benchmarks/.../building/` — ✓ (`BUILDING_VIEW_3Q` renders; the per-scale table +
  `scale-*/summary.json` carry blocks / form IoU / speckle / distinct / off-palette / value ΔE / stray).
- **AC#4** `npm test` green — ✓ 767 pass, 0 fail.

## Test coverage

- **Unit (`npm test`, CI-safe):** the entire pure selector — `pickBestScale` (winner, tie-break→lower,
  non-monotonic-kept, null/all-null/empty tolerance, reason content), `buildingRow` guards,
  `assembleBuildingBuild` (table + chosen line + non-monotonicity note, empty-degeneracy, throw-on-non-array,
  honest unclean flag). Deterministic, no GL/model. 9 cases.
- **Live (manual, GL + dwebp):** the build/clean/render/score branch — exercised by the committed 2-scale
  sweep; re-checkable via `--offline` (re-derives the pick + re-validates `best/artifact.json`, no GL —
  verified 2/2). The GL/dwebp edge is the project's standard untested surface (matches `e19-build.mjs`).
- **Coverage gaps (by design):** the runner's voxelize/segment/render/dwebp branch is not unit-tested (the
  suite must never pull GL / a host tool). The per-scale `artifact.json` re-validation is skipped offline if
  the (gitignored) intermediate is absent; `best/artifact.json` is committed and always re-validated.

## Open concerns / flags for a human reviewer

1. **`voxelizeGlb` caps scale at 64, but `building.mjs` declares `BUILDING_SCALE_MAX = 96`** — a latent
   inconsistency. Scale 96 fails (`scale must be an integer in [8, 64]`); the runner handles it gracefully (a
   null row, the sweep continues), and 96 was dropped from the defaults. The effective high-res ceiling is 64.
   Worth reconciling `BUILDING_SCALE_MAX` to the voxelizer cap (or raising the voxelizer cap) in a follow-up;
   recorded, not patched here (out of this ticket's scope — measurement, not voxelizer changes).
2. **Non-monotonicity did not bite this subject (honest framing).** The AC's caveat (angular forms can read
   worse at very high scale) is real for sculptures (moai 32>16>48), but the bulky gatehouse improved 48→64
   monotonically up to the voxelizer cap. The selector's tie-break / "keep-the-lower" machinery is in place
   and unit-tested for when it *does* bite; here it correctly kept 64 (genuinely higher IoU, > the 0.01 eps).
   So the "kept the best, not the biggest" decision was trivially satisfied (best == biggest valid here) — the
   guard matters for the next, more angular subject.
3. **The `best/artifact.json` is 8.1 MB** (57,202 placements — the high-res payoff). Committed as the
   deliverable; per-scale intermediates are gitignored (regenerable). If repo size is a concern, the summary
   + a re-run (`npm run building:build`) reproduces it; flagged so the size is a known, deliberate choice.
4. **Form IoU is bounded by the GLB reconstruction.** T-067-01 noted the TRELLIS GLB lost fine detail (slit
   windows, voussoir ring), so absolute IoU (~0.91–0.93) is capped by the mesh, not the voxelizer; the
   cross-scale comparison (the kept signal) is unaffected.
5. **E-20 is colorimetric (E-19), not concept-grounded (E-21).** This high-res build uses mean-colour
   `segmentMaterials`, not the T-071/T-072 map+feature path (the dep T-074 measured that axis separately). A
   high-res *concept-grounded* building is a possible future cross of E-20×E-21, not in scope here.

## Verification commands
- `npm test` → 767 pass.
- `node benchmarks/sculpture/building-build.mjs --offline --scales 48,64` → re-derive the pick + re-validate
  `best/artifact.json` (no GL).
- `npm run building:build` → live sweep (GL; needs `glb/stone-gatehouse.glb` + the run-015 design-doc
  manifest). `--scales 48,64` overrides the scale set.
