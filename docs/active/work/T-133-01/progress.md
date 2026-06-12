# T-133-01 measured-proportions — Progress

## Step 1 — pure seam module + unit tests ✓

- `src/recognition/measured-program.mjs` — `applyMeasuredProportions` (attempt-ladder validated,
  sketch-wins recorded), `sketchMeasurements` (unit normalization), `factorEave`, `snapPitch`,
  `scaleFootprint` (endpoint scaling), `impliedRidgeRise` (compile-mirrored, drift-pinned),
  `silhouetteRatios` + `sketchTargetRatios` (standalone, record-scoped).
- `src/recognition/measured-program.test.mjs` — MP1–MP13, all pass; full suite 1938/1938 green.
- Deviation: none from plan. Transient suite failures (20×`colsOf is not defined`) observed once —
  a sibling session mid-write in `src/view/roof-generate.mjs`/`src/pack/idiom-registry.mjs`
  (S-134's seam); files clean at HEAD on re-check, suite green. My commits stage ONLY this
  ticket's files.

## Step 2 — runner + named scripts (in progress)

## Step 3 — re-seed cottage + barn (pending)

## Step 4 — replay + suite + prior-pin proof (pending)

## Step 5 — review (pending)
