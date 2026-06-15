# T-045-01 — Structure: deterministic-revision-loop

The blueprint: files, public interfaces, internal organization, ordering. Two new pure modules under
`src/revise/` (beside `region.mjs`) plus their suites; no existing file is modified.

## File change set

| File | Action | Purpose |
|------|--------|---------|
| `src/revise/tweak.mjs` | **create** | scoped procedural passes (`reliefPass`/`materialPass`), `tweakFor`, `proceduralDiagnose`, box-overlap helper. Pure. |
| `src/revise/tweak.test.mjs` | **create** | unit suite for the passes, the diagnosis, the selector. Pure. |
| `src/revise/loop.mjs` | **create** | `reviseLoop` (control flow), the accept-gate, the trace, the live `liveFormScore` seam (lazy). |
| `src/revise/loop.test.mjs` | **create** | the cage proof: convergence, accept-gate/rollback, spatial lock, determinism, no-GL import scan. Pure. |
| `render/test/revise-loop.live.test.mjs` | **create (GL-gated)** | optional live proof: one `reviseLoop` over the committed koi with the real render score, guarded by GL availability. Not part of `npm test`. |

No edits to `region.mjs`, `form-fidelity.mjs`, `review.mjs`, or the schema — the loop is pure
composition over their existing public surfaces.

## `src/revise/tweak.mjs` — the scoped procedural passes (pure)

Imports: `expandPlacement` from `../expand.mjs` (clamp/lock awareness), `{ROUTING_TABLE, ROUTE_TARGETS,
DEFECTS }` from `../sculptor/review.mjs` (pure route vocabulary — no GL). **No** render/world import.

```
export const TWEAK_SCHEMA = "revise-tweak/v1"
export const TWEAK_DEFAULTS = { reliefDelta: 1, materialBlocks: ["minecraft:stone", …] }

// --- box geometry shared with the loop's spatial lock ---
export function boxesIntersect(a, b): boolean          // inclusive 3-D integer overlap

// --- placement-level passes (each returns NEW placements; pure; clamped to R.subBounds) ---
export function reliefPass(inRegion, subBounds, { delta }): placement[]
        // shift Z of every placement (voxel pos[2]; box/fill/line from[2]&to[2]) by delta,
        // clamped into [subBounds.min[2], subBounds.max[2]] so no voxel escapes R.
export function materialPass(inRegion, { block }): placement[]
        // remap every placement's block to `block`; positions untouched (always in-region).

// --- route → editor selector (the loop calls this) ---
export function scopedTweakFor(route, attempt, intent): (inRegion) => placement[]
        // relief → reliefPass(delta stepped by attempt: +1,-1,+2,-2,…)
        // material → materialPass(block stepped through intent.material.blocks)
        // anything else → identity (inRegion) => inRegion   (safe no-op → rolled back)

// --- model-free geometric diagnosis (default `diagnose`) ---
export function proceduralDiagnose(artifact, R): Array<{defect, where, route}>
        // R voxels with zero Z-variance → {defect:"flat", route:"relief"}
        // else single uniform block      → {defect:"flat", route:"material"}
        // else                            → []  (clean)
        // routes drawn from ROUTING_TABLE / ROUTE_TARGETS so the model critic is a drop-in.
```

Internal helpers (not exported): `zSpanOf(inRegion)` (min/max Z over expanded voxels),
`uniqueBlocks(inRegion)`, `clampZ(z, lo, hi)`, `shiftPlacementZ(p, delta, lo, hi)`.

**Invariants the passes guarantee** (so `applyRegionEdit` never throws on our own tweaks):
every emitted placement's voxels lie in `subBounds` (relief clamps Z; material moves nothing). The
lock remains the enforcement for *arbitrary* editors — our passes simply never trip it.

## `src/revise/loop.mjs` — the control flow + accept-gate (pure core, lazy live seam)

Imports (top-level, pure): `{ selectRegion, applyRegionEdit, subBoundsOf }` from `./region.mjs`;
`{ scopedTweakFor, proceduralDiagnose, boxesIntersect }` from `./tweak.mjs`. **No** render/world at top
level — `liveFormScore` reaches them via `await import()`.

```
export const REVISE_SCHEMA = "revise-loop/v1"
export const LOOP_DEFAULTS = { maxIterations: 24, perRegion: 2, epsilon: 0 }

/**
 * The deterministic revision loop. Walks `regions` in order; per region: diagnose → (for each of up
 * to perRegion attempts) tweak → re-score → accept-if-improved-else-rollback → on accept, lock R.
 * @returns {Promise<{schema, artifact, trace, iterations, converged, locked}>}
 */
export async function reviseLoop(artifact, {
  regions,                          // required: ordered array of selectRegion specs (the "picker")
  score = liveFormScore(),          // (artifact, R) => number | Promise<number>  — the FORM seam
  diagnose = proceduralDiagnose,    // (artifact, R, observation?) => routed defects
  observe,                          // optional live seam: (artifact, R) => observation (default skipped)
  tweakFor = scopedTweakFor,        // (route, attempt, intent) => editor fn
  budget = LOOP_DEFAULTS,           // { maxIterations, perRegion }
  intent = {},
  fraction,                         // forwarded to selectRegion
  epsilon = LOOP_DEFAULTS.epsilon,
} = {})

/**
 * The default live FORM score (the GL seam, lazy). Renders the artifact via observeRegion and scores
 * with formFidelity against a concept reference. Returns an async (artifact, R) => number. NOT
 * unit-tested (pulls GL); pure tests inject a synthetic score instead.
 */
export function liveFormScore({ conceptPath, view, region, grid, fit } = {}): (artifact, R) => Promise<number>
```

### Loop body (deterministic)

```
current = artifact; trace = []; locked = []; iterations = 0
for (index, spec) of regions:
  if iterations >= budget.maxIterations: break
  R = selectRegion(current, spec, { fraction })
  sub = subBoundsOf(R)
  if locked.some(L => boxesIntersect(L, sub)):
    trace.push({ iteration: iterations, region: spec, subBounds: sub, reason: "locked-overlap", accepted: false }); continue
  observation = observe ? await observe(current, R) : null
  routed = await diagnose(current, R, observation)
  if routed.length === 0:
    trace.push({ …, reason: "clean", accepted: false }); continue
  { defect, where, route } = routed[0]
  before = await score(current, R)
  accepted = false
  for attempt in 0 .. budget.perRegion-1:
    iterations++
    if iterations > budget.maxIterations: break
    candidate = applyRegionEdit(current, R, tweakFor(route, attempt, intent))   // lock-checked
    after = await score(candidate, R)
    entry = { iteration: iterations, region: spec, subBounds: sub, defect, route, tweak: tweakLabel(route, attempt),
              scoreBefore: before, scoreAfter: after, accepted: after > before + epsilon }
    if entry.accepted:
      current = candidate; locked.push(sub); trace.push(entry); accepted = true; break
    else:
      entry.reason = "rolled-back"; trace.push(entry)
converged = iterations < budget.maxIterations
return { schema: REVISE_SCHEMA, artifact: current, trace, iterations, converged, locked }
```

`tweakLabel(route, attempt)` is a pure string (`"relief+1"`, `"material#0"`, `"noop"`) for the trace —
no behavior, just a stable, readable record.

## Public API summary (what other code may import)

- From `loop.mjs`: `reviseLoop`, `liveFormScore`, `REVISE_SCHEMA`, `LOOP_DEFAULTS`.
- From `tweak.mjs`: `reliefPass`, `materialPass`, `scopedTweakFor`, `proceduralDiagnose`,
  `boxesIntersect`, `TWEAK_SCHEMA`, `TWEAK_DEFAULTS`.

## Test plan (file-level)

`src/revise/tweak.test.mjs` — **T-groups**:
- **TA** `boxesIntersect` — overlap / touch / disjoint, inclusive.
- **TB** `reliefPass` — Z shifts by delta; clamps at `subBounds.z` (no escape); voxel & box forms;
  pure (input not mutated); deterministic.
- **TC** `materialPass` — block remapped, every `pos`/`from`/`to` byte-identical; in-region by
  construction.
- **TD** `scopedTweakFor` — relief/material/identity routing; attempt stepping; unknown route → no-op.
- **TE** `proceduralDiagnose` — flat→relief, uniform→material, mixed→clean; routes ∈ ROUTE_TARGETS.

`src/revise/loop.test.mjs` — **L-groups** (the cage):
- **LA Convergence** — a monotone synthetic score → the loop terminates with `converged:true`,
  `iterations ≤ regions.length × perRegion`.
- **LB Accept-gate** — a flat/decreasing score (and a `material` tweak) → nothing accepted, returned
  artifact **deep-equal** to input; every trace entry `accepted:false, reason:"rolled-back"`.
- **LC Spatial lock** — two overlapping specs, first accepted → second `reason:"locked-overlap"`,
  skipped; assert the lock invariant (T-044) holds across the run via `expandArtifact` byte-identity
  outside edited bounds.
- **LD Determinism** — run twice with identical seams → `deepEqual` traces & artifacts.
- **LE No-GL** — static import scan: `loop.mjs` top-level imports match no `render|world|gl|camera`;
  `liveFormScore` reaches render only via `await import(...render...)`.
- **LF Trace contract** — each accepted/rejected entry carries region, defect, tweak, score
  before/after, accepted? (the AC's required fields).

`render/test/revise-loop.live.test.mjs` (GL-gated, optional) — one `reviseLoop` over the koi with the
real `liveFormScore`, asserting it renders and returns a trace; skipped when GL is absent.

## Ordering of changes

1. `tweak.mjs` + `tweak.test.mjs` (no deps beyond expand/review) → commit.
2. `loop.mjs` + `loop.test.mjs` (depends on region + tweak) → commit.
3. Optional GL-gated live proof under `render/test/` → commit.
