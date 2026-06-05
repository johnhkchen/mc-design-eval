# T-028-01 — Review: self-shadow relief pass

Handoff for a human reviewer. The relief pass (seed craft **pass B**, E-11 / S-028) completes the
chain `massing → material → relief`: a `stage(state, intent) → state` that assigns `relief` (Z-depth)
over the **material-locked** state and locks it, never touching the locked `occupied` or `material`.
Shipped in one commit: **b7bdbb6**.

## What changed

| File | Change | Summary |
| --- | --- | --- |
| `src/sculptor/relief.mjs` | **new** (~210 lines) | the relief stage, feature vocabulary, detection, metric, compile |
| `src/sculptor/relief.test.mjs` | **new** (17 tests) | unit + AJV round-trip + lock/composition + metric |
| `src/sculptor/index.mjs` | modified | re-export `relief, reliefStage, reliefMetrics, compileRelief, FEATURE_RELIEF, RELIEF_STYLE` |
| `src/sculptor/README.md` | modified | `relief.mjs` (pass B) bullet in "The pieces" |
| `docs/active/work/T-028-01/*` | new | the six RDSPI artifacts |

**No change** to schema, `compile.mjs`, `build-state.mjs`, `orchestrator.mjs`, `massing.mjs`, or
`material.mjs`. Relief is purely additive — negative Z is already schema-legal and compile already
writes `pos:[x, y, relief]`.

## How it works

- **Feature → Z.** A feature is `{type, region}`. `FEATURE_RELIEF` is a closed vocabulary mapping each
  type to a relief *kind*: `recess/window → inset (−1)`, `trim/cornice/frame/lip/eave/base → pop (+1)`.
  `reliefValueFor` resolves the kind to an integer via `intent.relief.inset/pop` (tunable for a deeper
  facade). An unknown type throws `FeatureTypeError` (typed guard, like review's `assertDefect`).
- **Regions.** `regionPredicate` accepts `null`/predicate/`[[x,y],…]` (material's exact intent shape).
  `resolveFeatures` claims cells in order (explicit features first, then auto-detected), first-claim
  wins; cells in no feature stay flat (relief is sparse — most wall is flat).
- **Detection.** `detectFeatures` is geometry-only: the top occupied row → a `cornice` lip (+1),
  on by default; the bottom row → a `base` course, off by default (`intent.relief.detect`/`base`).
- **Stage.** `reliefStage` writes only `{relief}` on occupied feature cells; `relief(state, intent)`
  runs it through `runStages` → locks exactly `relief`.
- **Metric.** `reliefMetrics(state)` is a pure projection (like `proportionsOf`): `coverage`
  (relieved / occupied) and population `variance` of Z, plus min/max/range. Zero on a flat state, >0
  after relief — the quantitative "less flat" signal.

## AC verification

- **AC1 — relief assigns Z, leaves locked `occupied`/`material` untouched; lock enforcement verified.**
  ✅ Group 3 asserts every cell's material value is preserved and occupancy stable; group 6 asserts
  `relief` is locked, the `occupied`+`material` locks survive, a re-cut throws `LockViolationError`
  (write-time), a draft-bypass throws `StageRejectedError` (accept-time), and a material repaint still
  throws (relief did not loosen prior locks). The stage's patch only ever carries `{relief}`, so the
  happy path never even attempts an illegal write.
- **AC2 — marked recess/trim/horizontal → −1/+1/lip; recesses carved by exclusion.** ✅ Group 3
  (recess −1), group 5 (frame +1, explicit cornice line +1 lip), group 4 (compiled: exactly one
  placement per occupied cell, a recessed cell's lone voxel at z=−1 — no buried front block, honoring
  [[facade-recess-by-exclusion]] structurally).
- **AC3 — chain compiles to AJV-valid artifact, measurably less flat.** ✅ Group 8
  (`mass→material→relief` → `compileRelief` passes `parseArtifact`/`assertArtifact`, both −1 and +1 Z
  present); group 7 (`reliefMetrics` coverage & variance are 0 on massing-only and material-only, and
  strictly increase after relief).
- **AC4 — `npm test` green.** ✅ 291/291 (274 baseline + 17 new). No regressions.

## Test coverage & gaps

- **Covered:** vocabulary guard + overrides, detection (cornice default, base opt-in, detect:false),
  recess/trim/cornice geometry, exclusion (placement count + z), the full lock/composition matrix
  (write-time, accept-time, prior-lock survival, idempotent re-write), the metric increase across the
  chain, determinism, intent precedence over detection, the AJV round-trip, and the barrel re-export.
- **Gaps (acceptable for this phase):**
  - **No live render assertion.** Like material/spine, the "renders less flat" judgement is proven
    *quantitatively* via `reliefMetrics` rather than by a GL render or the BAML critic — there is no GL
    in these pure tests by design (the live leaves live only in `review.mjs`). The visual confirmation
    (and the `flat→relief` route firing on a real render) belongs to an end-to-end trial, not this unit.
  - **Window/recess auto-detection not implemented** (Design D4-C): there is no segmentation engine,
    so interior openings must be named via `intent.relief.features`. Detection covers only horizontal
    lines. This is a deliberate scope line, not a defect.

## Open concerns / notes for the reviewer

- **Detection-on-by-default is a behavioral choice.** A bare `relief(materialLockedState)` with no
  intent pops the top row as a cornice. This guarantees the metric AC on the no-intent path and is
  honest "simple detection over occupancy," but a caller who wants a truly flat result must pass
  `{relief:{detect:false}}`. Documented in the README and the module header.
- **Lip = +1 pop on the line course.** The voxel lattice has no sub-cell geometry, so "lip/overhang"
  is modeled as the line course projecting +1 over the row beneath. Faithful within the integer-Z
  model; a future curve pass (review's `ringing→curve` route) is where sub-voxel shaping would live.
- **`inset`/`pop` are uniform per run**, not per-feature. A feature carries a *type*, not a raw depth
  (Design D2-B keeps the legal-geometry policy in the module). If a future plan needs per-feature
  depths, add an optional `depth` override on the feature object — additive, no breaking change.

## Boundaries honored

Spine-only imports; no E-10 color engine, no SDK, no I/O, no render, no schema import. The chain's
lock invariant holds end-to-end: massing locks `occupied`, material locks `material`, relief locks
`relief` — each pass adds a field within bounds, none can undo a prior one. "Improve" is additive.
