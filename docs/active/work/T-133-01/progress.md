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

## Step 2 — runner + named scripts ✓

- `benchmarks/sculpture/measured-proportions.mjs` — live / `--repro` / `--offline`; records at
  `benchmarks/sculpture/measured/<runKey>.*`; pin-guarded; self-grep clean; skip-not-fail repro.
- `package.json`: `measured:cottage|barn|repro|offline`.

## Step 3 — re-seed cottage + barn ✓

- Cottage: attempt `fp:xz eave:measured`, conformance PASS, 7803 cells. Eave 8→20 (4×5, band
  excursion recorded), footprint 26×28→27×32 (aspect lands exactly on target 1.1852),
  ridge:eave 2.25→1.55 (target 1.4145), roofShare 0.5556→0.3548 (target 0.293).
- Barn: PASS, 11594 cells. Eave 9→10 (2×5), d 24→26 (aspect exact 1.8462),
  ridge:eave 2.4444→2.4 (target 2.1 — residual is the 45° pitch-class ceiling, recorded).
- Renders committed (4 azimuths each), inspected: cottage reads as the tall cross-gabled mass.

## Step 4 — replay + suite + prior-pin proof ✓

- `measured:repro` + `measured:offline`: both subjects REPRODUCE byte-identically, exit 0.
- `patternbook:repro`, `patternbook:saltcrag:repro`, `recognize:offline`: all prior pins hold.
- `npm test`: 1937/1938 — the single failure is
  `brush door: technique imports appear ONLY through the allowlist` tripping on
  `src/view/roof-steep.mjs` (untracked, created 20:55 by the concurrent S-134 session; not this
  ticket's file). Suite was 1938/1938 green at this ticket's Step-1 commit; this ticket adds no
  src/view code.

## Step 5 — review (in progress)
