# T-068-01 — high-res-voxel-build · Design

Decisions for the E-20 high-res building build. Grounded in Research: mirror `e19-build.mjs`'s per-cell
compose+score logic, but iterate over **scales of one subject** (the building) instead of subjects, add a
deterministic **best-scale selector** as a pure unit-tested core, and clean with the matured E-19 pipeline.

## D1 — One pure scale-selector/report module + one impure runner (the established split)

**Decision.** Add `src/form/building-build.mjs` (PURE: per-scale row assembly + the best-scale pick + report
md/json) + `benchmarks/sculpture/building-build.mjs` (impure: voxelize/segment/prune/render/score/I/O, live +
`--offline`). The pure module owns "which scale reads best and why"; the runner owns GL/dwebp/I/O.

**Why.** This is the reviewed idiom every E-19/E-21 ticket followed (`e19-cleanup.mjs` + `e19-build.mjs`;
`concept-materials-ab.mjs` + its runner). It keeps `npm test` green deterministically (the selector is pure),
keeps the report reproducible via `--offline`, and isolates the GL/host-tool edges from the suite. Rejected:
a single impure script computing the pick inline (the pick logic — the AC's "best-reading kept, recorded why"
— is the most important thing to unit-test; it must be pure).

## D2 — Scales to try: 48 and 64, optionally 96 — keep best form IoU (non-monotonicity honored)

**Decision.** Build the GLB at **48** (BUILDING_DEFAULT) and **64** as the two required scales, and
**optionally 96** (BUILDING_SCALE_MAX) if cheap. The selector keeps the scale with the **highest form IoU vs
the GLB at BUILDING_VIEW_3Q**, with ties / near-ties (within an epsilon) broken toward the **lower** scale
(fewer blocks, the simpler build) — the explicit anti-"biggest is best" rule the AC demands. Records the
chosen scale + the per-scale IoU table as the "why".

**Why.** A building is an **angular** mass; Research's measured caveat says angular forms can read *worse* at
very high scale. 48 and 64 bracket the likely sweet spot (markedly above the 32 sculptures = "high"); 96
tests the upper bound where regression is plausible. Form IoU vs the GLB at the build view is the codebase's
existing fidelity arbiter (`judgeIoU` in e19-build). Tie→lower-scale operationalizes "keep the best-reading,
not the biggest." Rejected: a single fixed high scale (violates "a couple tried"); picking max block count
(directly contradicts the caveat); a purely visual pick (not reproducible / not unit-testable — though the
renders are saved for a human to confirm).

## D3 — Clean via the E-19 pipeline, design-doc flat palette, prune-gated

**Decision.** Per scale: `voxelizeRouted({subject:"building", scale})` (→ plain `voxelizeGlb`, solid) →
gated `pruneStrays` (E-19 gate `largestFraction < 0.9`) → `segmentMaterials` under
`augmentPalette(paletteFromManifest(designDocManifest), texture)` → `assertArtifact` +
`assertPaletteDiscipline(cap = designDoc + 2)`. Score: form IoU, speckle, distinct, off-palette (vs the
augmented palette), value ΔE, occupancy, stray stats.

**Why.** AC#2 names exactly this E-19 clean (value-true within the design-doc flat palette, segmented,
stray-pruned). Reusing the *exact* `e19-build` composition guarantees parity with the proven cleanup and zero
new cleaning code. The design-doc manifest is the committed run-015 `artifact.json` palette (4 flat blocks).
The prune gate is honored even though the building is single-mass (largestFraction 1.0 → no-op): keep the
gate, don't special-case, so the runner stays a faithful E-19 instance. Rejected: a fresh/looser palette
(would re-admit busy blocks E-19 killed); ungated prune (E-19's own lesson: clips legitimate detached detail
— moot here but principled).

## D4 — Render at BUILDING_VIEW_3Q; form IoU vs the GLB silhouette at the same view

**Decision.** Render each scale's artifact at `BUILDING_VIEW_3Q` (azimuth 45, elevation 30, fov 45) and
compute form IoU against the GLB's own silhouette rasterized at the **same** view (the `e19-build judgeIoU`
pattern, swapping `SCULPTURE_VIEW_3Q → BUILDING_VIEW_3Q`).

**Why.** AC#3 says "a building-appropriate view"; `building.mjs` defines exactly that view. Scoring IoU at the
same view the build is judged on is the existing, correct fidelity method. Rejected: the sculpture view
(wrong framing for a wide building); a turntable average (more GL cost, the single 3/4 is the rubric view).

## D5 — Outputs under `benchmarks/sculpture/building/`

**Decision.**
- `benchmarks/sculpture/building/scale-<n>/{artifact.json, summary.json}` + render (gitignored PNG) per scale.
- `benchmarks/sculpture/building/best/artifact.json` — a copy of the chosen scale's artifact (the deliverable).
- `benchmarks/sculpture/building-build.{json,md}` — the per-scale table + the pick + the "why".
- `pr/assets/frames/building-best.png` — the chosen render for E-12 (optional, low-cost handoff nicety).
- `package.json` += `"building:build"` script.

**Why.** AC#3 mandates `benchmarks/.../building/`. Mirrors `e19-build/<subject>/` (here `building/scale-<n>/`).
Committing the chosen artifact under `best/` gives downstream one obvious deliverable. PNGs gitignored,
artifacts/summaries committed (the convention). Rejected: a new top-level dir; committing renders.

## D6 — The deterministic best-scale pick (the pure AC core)

**Decision.** `pickBestScale(rows, {iouEps=0.01}) → {scale, reason, ranked}`: rank by form IoU descending;
if the top-2 are within `iouEps`, prefer the **lower** scale; the `reason` string names the chosen scale, its
IoU, the runner-up, and the tie-break if applied. `assembleBuildingBuild({rows, chosen}) → {md, json}`
renders the per-scale table (scale · blocks · form IoU · speckle · distinct · off-pal · value ΔE · stray) +
the pick + the non-monotonicity note. PURE, null-tolerant (a failed scale → null cell, never throws).

**Why.** This is the AC's "best-reading kept, recorded which + why" expressed as testable pure logic. The
epsilon tie-break is the operational "not the biggest block count" rule. Rejected: an LLM/visual judge
(non-reproducible, can't unit-test, can't run `--offline`); raw argmax with no tie-break (would pick a
marginally-higher-IoU bigger build, against the caveat).

## What is deliberately NOT done

- No concept-grounded materials (T-071/T-072) — E-20 is the colorimetric E-19 high-res build; the E-21 axis
  is separate (and T-074, the dep, already measured it).
- No change to any pipeline module (voxelize/segment/prune/augment/value-gate/building) — additive runner +
  pure module only; zero regression surface beyond new files + additive lines.
- No new GLB / no re-provisioning (T-067-01 owns that). No turntable scoring (single rubric view).
- The absolute form-IoU ceiling set by the GLB's lost fine detail (T-067) is inherited, not fixed — the
  cross-scale comparison is the signal; recorded in the honesty notes.
