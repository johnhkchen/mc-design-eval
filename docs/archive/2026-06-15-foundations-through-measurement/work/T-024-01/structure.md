# T-024-01 Structure — staged-build-spine

The blueprint: files, public interfaces, internal organization, and the ordering of
changes. Shapes only — code lives in the Implement phase. All new files under
`src/sculptor/`; no existing file is modified (the spine is additive and reuses
`src/artifact.mjs` + `src/config.mjs` by import only).

## File manifest

| File | Status | Purpose |
|------|--------|---------|
| `src/sculptor/build-state.mjs` | **new** | State model, draft/commit, lock helpers, errors |
| `src/sculptor/orchestrator.mjs` | **new** | `runStages`, `defineStage`, `changedFields` |
| `src/sculptor/compile.mjs` | **new** | `toDesignArtifact` |
| `src/sculptor/index.mjs` | **new** | Barrel re-export of the public surface |
| `src/sculptor/build-state.test.mjs` | **new** | State, draft, lock-throw, freeze tests |
| `src/sculptor/orchestrator.test.mjs` | **new** | Compose, lock-derive, reject tests |
| `src/sculptor/compile.test.mjs` | **new** | Round-trip + AJV-gate tests |
| `src/sculptor/README.md` | **new** | One-screen spine overview (matches `src/color/README.md` habit) |

No schema change, no `package.json` change (deps already present), no edits to the
runner, render, or color modules.

## `build-state.mjs` — public interface

```
export const FIELDS = Object.freeze(["occupied", "material", "relief"]);

export function cellKey(x, y) -> string            // `${x},${y}`
export function parseKey(key) -> {x, y}             // inverse, integers

export function createBuildState({width, height}) -> BuildState
  // empty: cells = new Map(), locked = new Set(), lockLog = []

export function getCell(state, x, y) -> Cell | undefined
export function occupiedCells(state) -> Array<{x, y, cell}>   // sorted (y,x)
export function isLocked(state, field) -> boolean

export function draftState(state) -> Draft
export function lockFields(state, stageName, fields) -> BuildState
  // returns NEW state: locked ∪ fields; lockLog + {stage, fields:[...]} IF fields non-empty

export class LockViolationError extends Error   // code "lock_violation"; {field, x, y}
```

**Types (JSDoc).**
- `Cell = { occupied: boolean, material: string|null, relief: number }` — default cell
  is `{occupied:false, material:null, relief:0}`. A cell exists in the map only once
  written; `getCell` returns `undefined` for never-touched keys (callers treat as the
  default).
- `BuildState = { width, height, cells: Map<string,Cell>, locked: Set<string>,
  lockLog: Array<{stage, fields}> }` — wrapper `Object.freeze`d; `cells`/`locked` are
  treated as immutable by convention (only `draftState` produces successors).

**`Draft` (internal class, not exported as a type to construct directly).**
```
class Draft {
  #cells   // shallow-cloned Map of cloned cell objects
  #locked  // reference to source locked Set (read-only use)
  #width #height #lockLog
  set(x, y, patch)   // patch: {occupied?, material?, relief?}
    // for each field in patch whose new value !== current value:
    //   if #locked.has(field) -> throw LockViolationError({field, x, y})
    // apply patch onto a (cloned) cell, creating the cell at default if absent
  get(x, y) -> Cell  // current draft value (default if absent), a copy
  commit() -> BuildState  // freeze wrapper; carry source locked/lockLog UNCHANGED
}
```
`set` compares against the **current draft** cell value so two writes in one stage are
idempotent; the locked check is against the *source* `locked` set. Writing the same
value to a locked field is allowed (no-op) — the "only add" escape hatch.

## `orchestrator.mjs` — public interface

```
export function changedFields(prev, next) -> Set<string>
  // walk union of cell keys; for each FIELD, if any cell's value differs -> include.
  // a key present in one state but not the other contributes its non-default fields.

export function defineStage({name, run}) -> Stage
  // Stage = { name, apply(state, intent) -> state }
  // apply = (s, i) => { const d = draftState(s); run(d, i, s); return d.commit(); }

export function runStages(state, stages, intent = {}) -> BuildState
  // for each stage: next = stage.apply(state, intent)
  //   illegal = changedFields(state, next) ∩ state.locked
  //   if illegal.size -> throw StageRejectedError(stage.name, [...illegal])
  //   state = lockFields(next, stage.name, [...changedFields(state, next)])
  // return state

export class StageRejectedError extends Error  // code "stage_rejected"; {stage, fields}
```

`changedFields` is computed once per stage and reused for both the illegal check and
the lock set (compute-once, in the loop body). `intent` defaults to `{}` so the spine is
runnable with no plan side-channel yet.

A raw stage object `{name, apply}` is also accepted by `runStages` (a stage need not be
built via `defineStage`) — `defineStage` is sugar, not a gate.

## `compile.mjs` — public interface

```
import { PHASE1_MODEL_ID } from "../config.mjs";

export const COMPILE_DEFAULTS = Object.freeze({
  schemaVersion: "1.0.0",
  defaultBlock: "minecraft:stone",
  metadata: { trial_id, prompting_method_id:"staged-sculptor.v1",
              model_id: PHASE1_MODEL_ID, seed:0, server_state_id:"in-memory" },
  style: { name:"massing", rationale:"…" },
});

export function toDesignArtifact(state, opts = {}) -> DesignArtifact
  // placements: for each occupiedCells(state) cell ->
  //   { op:"voxel", pos:[x, y, cell.relief ?? 0], block: cell.material ?? defaultBlock }
  // palette.manifest: sorted unique blocks emitted
  // metadata: COMPILE_DEFAULTS.metadata <- opts.metadata (shallow merge)
  // style:    opts.style ?? COMPILE_DEFAULTS.style
  // throws if no occupied cells (artifact requires >=1 placement) — a located Error
```

Pure construction — **no AJV call here**. The boundary: `compile.mjs` builds the
object; `src/artifact.mjs` validates it. Tests assert the cross-module contract
(compile → `assertArtifact`). `compile.mjs` imports only `build-state.mjs`
(`occupiedCells`) and `config.mjs` (the model id) — no schema, no ajv.

## `index.mjs` — barrel

Re-exports the public surface: `createBuildState, getCell, occupiedCells, isLocked,
draftState, lockFields, cellKey, parseKey, FIELDS, LockViolationError` (build-state);
`runStages, defineStage, changedFields, StageRejectedError` (orchestrator);
`toDesignArtifact, COMPILE_DEFAULTS` (compile). One import site for downstream tickets
(T-025…T-028).

## Internal organization & dependency direction

```
config.mjs ──┐
             ▼
build-state.mjs ◀── orchestrator.mjs
        ▲                 ▲
        └──── compile.mjs ┘ (compile uses build-state only)
             ▲
        index.mjs (barrel)

artifact.mjs ◀── *.test.mjs only  (compile output validated in tests, not in compile)
```

- `build-state.mjs` has **no intra-project imports** (pure data + errors) — the leaf.
- `orchestrator.mjs` imports `build-state.mjs` (`draftState`, `lockFields`).
- `compile.mjs` imports `build-state.mjs` (`occupiedCells`) and `config.mjs`.
- No module imports `artifact.mjs` — only tests do, to validate. This keeps the spine
  free of the schema gate (so the gate stays a consumer-side check) and avoids a
  compile→ajv coupling.

## Ordering of changes (build leaf-first)

1. `build-state.mjs` + its test — the leaf; everything depends on it.
2. `orchestrator.mjs` + its test — needs draft/lock from (1).
3. `compile.mjs` + its test — needs `occupiedCells` from (1); validated via `artifact.mjs`.
4. `index.mjs` barrel + `README.md` — once the surface is settled.

Each step is independently `node --test`-able and commit-sized. Detailed step
sequencing and the test matrix are in `plan.md`.

## Test surface (what each test file proves)

- **build-state.test**: default cell; `set` writes a field; `set` to a **locked** field
  with a new value throws `LockViolationError`; `set` same value to locked field is a
  no-op; `commit` carries locked/lockLog unchanged + freezes; `lockFields` unions +
  logs; empty `fields` adds no log entry; `cellKey`/`parseKey` round-trip.
- **orchestrator.test**: `changedFields` detects per-field diffs incl. occupancy add;
  `defineStage` wraps run; **two trivial stages compose** with two independent lock
  records; a stage writing an **unlocked** field succeeds and gets locked; a stage
  attempting to overwrite a **locked** field is rejected — both via the draft throw and
  via a hand-built bypass hitting `StageRejectedError`; `intent` is threaded.
- **compile.test**: hand-built state → `toDesignArtifact` → `assertArtifact` passes
  (round-trip); `pos` carries relief Z (incl. negative inset); `manifest` is unique &
  sorted; `defaultBlock` fills unmaterialed cells; empty state throws.
