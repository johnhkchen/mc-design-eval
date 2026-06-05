# T-028-01 — Progress: self-shadow relief pass

## Status: implementation complete, all ACs verified, suite green (291/291)

## Done (per plan)

- **Step 1–3 — `src/sculptor/relief.mjs`** (one file, all in one pass): constants
  (`DEFAULTS{inset:-1,pop:1,detect:true,base:false}`), the closed `FEATURE_RELIEF` vocabulary,
  `RELIEF_STYLE`, the `FeatureTypeError`/`assertFeatureType` typed guard, `reliefValueFor`, the private
  `regionPredicate`/`bbox`/`detectFeatures`/`resolveFeatures` partition, `reliefStage`/`relief`,
  `reliefMetrics`, and `compileRelief`. Imports the spine only (orchestrator, build-state, compile) —
  geometry-only, no E-10 color engine.
- **Step 4 — `src/sculptor/relief.test.mjs`** — 17 tests across the 10 planned groups. Fixtures are
  **material-locked** (`material(mass(...).state)`), since relief composes on the material pass.
- **Step 5 — barrel + README** — `index.mjs` re-exports `relief, reliefStage, reliefMetrics,
  compileRelief, FEATURE_RELIEF, RELIEF_STYLE`; `README.md` gains the `relief.mjs` (pass B) bullet.
- **Step 6 — suite** — `npm test` → **291/291** green (baseline 274 + 17 new). No regressions.

## AC coverage

- **AC1 (relief assigns Z, leaves `occupied`/`material` locked & untouched; lock enforcement)** —
  group 3 (material values preserved cell-for-cell, occupied stable) + group 6: `relief` locked,
  `occupied`/`material` locks survive, `LockViolationError` on re-cut, `StageRejectedError` on
  draft-bypass, and a material-repaint still throws (relief did not loosen prior locks). ✅
- **AC2 (marked recess/trim/horizontal → −1/+1/lip; recesses by exclusion)** — groups 3 (recess −1),
  5 (frame +1, explicit cornice line +1 lip), 4 (one placement per cell; recessed lone voxel at
  z=−1). ✅
- **AC3 (chain compiles → AJV pass; measurably less flat)** — group 8 (`mass→material→relief` →
  `compileRelief` passes `parseArtifact`/`assertArtifact`, negative + positive Z present) + group 7
  (`reliefMetrics` coverage & variance are 0 on massing-/material-only and strictly increase after
  relief). ✅
- **AC4 (`npm test` green)** — 291/291. ✅

## Deviations from plan

- **Implemented `relief.mjs` in a single write** rather than three commits — the module is one cohesive
  ~200-line file mirroring `material.mjs`; splitting it would have produced non-compiling intermediate
  states. Tests + barrel + README landed together. (Plan steps 1–5 collapsed into one commit.)
- **Base-course detection ships but defaults OFF** (`DEFAULTS.base = false`) as decided in Design D4 —
  the minimal default effect is a single top-row cornice lip. Opt in via `intent.relief.base:true`.
- **`reliefMetrics` returns more fields than the AC strictly needs** (`min/max/range` alongside
  coverage/variance) — cheap, and gives the review critic a richer flatness signal. No downside.

## Notes / no open code concerns

- No schema or compile change was needed: negative Z is schema-legal and `compile.mjs` already writes
  `pos:[x,y,relief]`. Relief is purely additive.
- Determinism is structural (discrete classification, no hash/RNG), so no seed plumbing.
