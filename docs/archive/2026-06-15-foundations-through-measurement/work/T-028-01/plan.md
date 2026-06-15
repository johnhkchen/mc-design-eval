# T-028-01 — Plan: self-shadow relief pass

Ordered, independently verifiable steps. Each ends green; the doc-only steps (barrel, README) land
last. Commit after the implementation + tests are green, then again after barrel/README if separated.

## Step 1 — `relief.mjs`: constants, vocabulary, typed guard

Create `src/sculptor/relief.mjs` with the house-style header, imports (`orchestrator`, `build-state`,
`compile` — no color engine), and:
- `DEFAULTS = { inset:-1, pop:+1, detect:true, base:false }`
- `FEATURE_RELIEF` (frozen `type → "inset"|"pop"`): recess/window→inset; trim/cornice/frame/lip/eave/
  base→pop.
- `RELIEF_STYLE`.
- `FeatureTypeError` + `assertFeatureType(type)`.
- `reliefValueFor(type, {inset, pop})`.

**Verify:** `node -e` import smoke (no syntax error); `assertFeatureType("window")` ok,
`assertFeatureType("nope")` throws. (Covered by test group 1.)

## Step 2 — `relief.mjs`: region predicate, bbox, detection, resolution

Add the private helpers:
- `regionPredicate(region)` (local mirror of material's).
- `bbox(cells)` (occupancy bbox or null).
- `detectFeatures(cells, {cornice, base})` — top row → `cornice`, bottom row → `base` (each as an
  explicit `[[x,y],…]` list); `[]` when off/empty.
- `resolveFeatures(state, intent)` — explicit `intent.relief.features` first (claim-in-order), then
  appended detected features; resolves each to `{cells, value}`; drops empty; flat cells excluded.

**Verify:** test groups 2 (detection) and 10 (precedence) exercise this through the stage.

## Step 3 — `relief.mjs`: stage, convenience, metric, compile

- `reliefStage(intent)` — `defineStage` writing only `{ relief: value }` on each feature cell
  (`intentArg.relief ? intentArg : intent` selection).
- `relief(state, intent)` — `runStages(state, [reliefStage(intent)], intent)`.
- `reliefMetrics(state)` — `{occupied, relievedCount, coverage, variance, min, max, range}`, rounded.
- `compileRelief(state, opts)` — `toDesignArtifact(state, {style:RELIEF_STYLE, ...opts})`.
- The `export { … }` block (Structure's public surface).

**Verify:** import the barrelless module directly in the test; groups 3–9 green.

## Step 4 — `relief.test.mjs`

Author the 10 test groups (Structure §test groups). Reuse `material.test.mjs` scaffolding:
- `gridOf(rows)` `#/.` → `{grid,n,m}`; `TALL` 4×6 solid; `tallMassed()` then `material(...)` to get a
  **material-locked** fixture (relief composes on material, so fixtures must be material-painted).
- `assert.throws(fn, ErrorType)` form (S1048 gotcha); local `occupiedOf` helper.
- Window fixture: a material-locked TALL with an interior region predicate (e.g. `x===1 && y in 2..3`)
  marked `recess`.

**Key assertions per AC:**
- AC1 (lock enforcement): group 6 — `isLocked(relief, "relief")`, `occupied`/`material` still locked,
  `LockViolationError`/`StageRejectedError` on re-write/bypass, material unchanged value-wise.
- AC2 (fixture −1/+1/lip + exclusion): groups 3, 4, 5 — marked recess→−1, trim→+1, cornice line→+1
  lip; `placements.length===occupiedCount` and recessed lone placement at `pos[2]===-1`.
- AC3 (less flat + AJV): groups 7, 8 — `reliefMetrics` 0 on massing-/material-only, >0 after relief;
  `compileRelief` passes `parseArtifact`/`assertArtifact`; negative Z present.
- AC4 (`npm test` green): the whole suite.

**Verify:** `node --test src/sculptor/relief.test.mjs` green.

## Step 5 — barrel + README

- `index.mjs`: add the `relief` export block (`relief, reliefStage, reliefMetrics, compileRelief,
  FEATURE_RELIEF, RELIEF_STYLE`).
- `README.md`: add the `relief.mjs (pass B, T-028)` bullet after `material.mjs`.
- Add a barrel round-trip assertion to test group 10.

**Verify:** `node --test src/sculptor/relief.test.mjs` still green (barrel import path).

## Step 6 — full suite + commit

- `npm test` — expect the prior 274 + the new relief tests, all green; no regression in
  massing/material/review/spine.
- Commit: `feat(sculptor): self-shadow relief pass — recess/trim/lip Z-depth over locked skin
  (T-028-01)`.

## Testing strategy

- **Unit (pure):** vocabulary guard, `reliefValueFor`, detection, `reliefMetrics`, region precedence —
  all on hand-built/material-locked states, no GL, no model.
- **Integration (real AJV gate):** `compileRelief` → `parseArtifact`/`assertArtifact` (the round-trip
  AC), proving render/judge/export stay unchanged with negative Z.
- **Composition (lock semantics):** the headline proof — `LockViolationError` (write-time),
  `StageRejectedError` (accept-time bypass), and locks-survive across the full chain.
- **No live leaves:** relief has none (no render, no BAML) — unlike review, every relief test is pure
  and fast. The metric AC stands in for the "renders less flat" judgement quantitatively (a Z-variance
  proxy), avoiding a GL dependency in CI.

## Risks & mitigations

- **R1 — relief accidentally writing material/occupied.** Mitigation: the stage's patch carries only
  `{relief}`; group 6 asserts material values unchanged and the `occupied` count stable. Even a bug
  would be caught at accept-time (`StageRejectedError`) since those fields are locked.
- **R2 — detection masks the "intent-driven" AC.** Mitigation: tests for AC2 pass *explicit* features
  and assert exact cells; detection is tested separately and is skippable (`detect:false`). Explicit
  precedence is group 10.
- **R3 — metric not strictly increasing on a degenerate fixture.** Mitigation: AC3 uses a fixture with
  a guaranteed feature region (a window) so `relievedCount ≥ 1`; massing/material baselines are
  provably all-zero (no relief field written), so any non-zero is an increase.
- **R4 — exclusion misread.** Mitigation: assert one placement per (x,y) AND a recessed cell's single
  placement at z=−1 — there is no separate front block, satisfying the memory rule structurally.
