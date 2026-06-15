# T-024-01 Progress — staged-build-spine

Implementation log against `plan.md`. Status: **complete** — all four spine pieces
built, 30 new unit tests, `npm test` green (230 pass), committed.

## Steps completed

### Step 1 — `build-state.mjs` ✓
Implemented `FIELDS`, `cellKey`/`parseKey`, `defaultCell`, `createBuildState`,
`getCell`, `isLocked`, `occupiedCells` (sorted `(y,x)`), the guarded `Draft`
(`set`/`get`/`commit`), `draftState`, `lockFields`, and `LockViolationError`. The
write-time lock guard compares each patched field to the current draft value and throws
only on a *changed* value to a *locked* field (same value = no-op, the "only add within
bounds" escape hatch). Source state is never mutated — `draftState` shallow-clones the
map and each cell; `commit`/`lockFields` return fresh frozen states.

### Step 2 — `orchestrator.mjs` ✓
Implemented `changedFields` (union-of-keys per-field diff), `defineStage` (wraps a
`run(draft, intent, prev)` body into the pure `apply` interface), `runStages` (locks
each stage's diffed contributions on accept), and `StageRejectedError`. The
illegal-mutation check (`changed ∩ locked`) is the accept-time defense against a draft
bypass; the draft throw is the primary write-time guard.

### Step 3 — `compile.mjs` ✓
Implemented `COMPILE_DEFAULTS` (model id from `src/config.mjs`) and `toDesignArtifact`:
one `voxel` placement per occupied cell at `[x, y, relief]`, manifest = sorted-unique
blocks, metadata merged over defaults, throws on an empty state. No AJV import — the
round-trip test validates via `src/artifact.mjs`.

### Step 4 — `index.mjs` + `README.md` ✓
Barrel re-export of the public surface; one-screen README covering the pieces, the
load-bearing lock rule, and boundaries.

### Step 5 — full gate ✓
`npm test` → 230 pass / 0 fail (200 baseline preserved + 30 new). Committed as `ce0ab81`.

## Deviations from plan

- **Single commit, not four.** The plan sketched a commit per step; the work landed as
  one cohesive `feat(sculptor)` commit (the spine is a single tight unit and all files
  are new/additive). No behavioral deviation — same files, same scope.
- **Test capture idiom.** Two tests initially used `const err = assert.throws(...)`
  expecting the error back; Node's `assert.throws` returns `undefined`. Switched both to
  the validation-callback form `assert.throws(fn, (err) => { …asserts…; return true })`
  to inspect `code`/`field`/`stage`/`fields`. Pure test-harness fix; the asserted
  behavior is unchanged and both lock-rejection paths are still covered.

No deviations to the public interface, the lock semantics, or the compile contract as
specified in `design.md`/`structure.md`.

## AC verification

- [x] Build-state model + `stage` interface + orchestrator + lock semantics under
      `src/sculptor/`.
- [x] Lock enforcement tested — a stage overwriting a locked field is rejected (two
      tests: draft write-time `LockViolationError`; hand-built bypass → accept-time
      `StageRejectedError`); a stage adding to an unlocked field succeeds and gets locked.
- [x] `toDesignArtifact` compiles to an artifact that **passes the AJV validator**;
      round-trip tested on a hand-built 3-cell state (incl. negative-relief inset).
- [x] Two trivial stages (`material`, `relief`) compose through the orchestrator with
      independent lock records (`lockLog` = two entries).
- [x] `npm test` green (230 pass).

## Notes for downstream tickets

- **T-025 (massing)** wraps a `MassingSource` and produces a state with `occupied` set,
  then `lockFields(state, "massing", ["occupied"])`. The spine already supports the gray
  compile via `defaultBlock`.
- **T-027/T-028 (material/relief)** are `defineStage` bodies writing `material` then
  `relief`; the orchestrator locks each automatically. T-028's "must not alter locked
  occupied/material" is enforced by the draft guard with zero extra code.
- The cell-key scheme is isolated to `cellKey`/`parseKey` — a per-voxel `"x,y,z"`
  extension is a one-line change when 3-D massing (GLB) arrives.
