# T-024-01 Plan — staged-build-spine

Ordered, independently-verifiable steps. Each step is commit-sized and leaves
`node --test` (and after step 5, `npm test`) green. Testing strategy is unit-only —
the spine is pure (no I/O, no SDK, no render), so synthetic hand-built states cover
everything; the AJV cross-check reuses the real validator from `src/artifact.mjs`.

## Step 1 — `build-state.mjs` (the leaf)

Implement: `FIELDS`, `cellKey`/`parseKey`, `createBuildState`, `getCell`,
`occupiedCells` (sorted `(y,x)`), `isLocked`, `defaultCell`, the `Draft` class
(`set`/`get`/`commit`), `draftState`, `lockFields`, `LockViolationError`.

Key invariants to encode:
- `Draft.set(x,y,patch)` compares each patched field to the **current draft** value;
  only a *changed* value to a **locked** field throws (same value = no-op).
- `commit()` carries `locked`/`lockLog` **unchanged**, `Object.freeze`s the wrapper.
- `lockFields` appends a log entry **only if** `fields` is non-empty; unions into `locked`.

**Verify (step-1 test):** default cell shape; set then get; locked-field new value
throws `LockViolationError` with `{field,x,y}`; locked-field same value is a no-op;
unlocked write succeeds; `commit` freezes + preserves locks; `lockFields` unions/logs;
empty-fields lock adds no entry; key round-trip. Run `node --test
src/sculptor/build-state.test.mjs`.

**Commit:** `feat(sculptor): build-state model + draft/commit + lock semantics (T-024-01)`

## Step 2 — `orchestrator.mjs`

Implement: `changedFields(prev,next)`, `defineStage({name,run})`, `runStages(state,
stages, intent={})`, `StageRejectedError`. Compute `changedFields` once per stage in the
loop, use for both the illegal-intersection check and the lock set.

**Verify (step-2 test):**
- `changedFields` flags a per-field change and an occupancy add; returns empty for a
  true identity stage output.
- `defineStage` produces `{name, apply}`; `apply` runs `run` against a draft and commits.
- **Two trivial stages compose:** stage A paints `material` on all occupied cells,
  stage B sets `relief` — `runStages` returns a state with both fields set and a
  `lockLog` of two **independent** records (`[{stage:'A',fields:['material']},
  {stage:'B',fields:['relief']}]`); `locked` = {material, relief}.
- **Unlocked add succeeds:** a stage writing an unlocked field is accepted and that
  field becomes locked.
- **Locked overwrite rejected (two paths):** (i) a `defineStage` stage that calls
  `draft.set` on a locked field throws `LockViolationError` from inside `apply`; (ii) a
  hand-built raw stage `{name, apply}` that returns a state mutating a locked field is
  caught by the orchestrator's diff check → `StageRejectedError{stage,fields}`.
- `intent` is passed through to each stage's `run`.

Run `node --test src/sculptor/orchestrator.test.mjs`.

**Commit:** `feat(sculptor): stage interface + orchestrator + lock enforcement (T-024-01)`

## Step 3 — `compile.mjs`

Implement `COMPILE_DEFAULTS` (with `PHASE1_MODEL_ID`) and `toDesignArtifact(state,
opts)`. One `voxel` per occupied cell at `[x,y,relief]`; `manifest` = sorted unique
blocks; merge metadata over defaults; throw a located `Error` on an empty (no occupied
cell) state.

**Verify (step-3 test):**
- Hand-build a small state (a few occupied cells, one with `material` set, one without,
  one with `relief:-1`), compile, then `assertArtifact(result)` from `src/artifact.mjs`
  **passes** — the round-trip AC.
- `pos[2]` equals the cell's relief (incl. the `-1` inset, proving negative Z is legal).
- Unmaterialed occupied cell uses `defaultBlock`.
- `manifest` is sorted, unique, and a superset of every block placed.
- `opts.metadata`/`opts.style` override defaults; default `model_id` is `PHASE1_MODEL_ID`.
- Empty state throws.

Run `node --test src/sculptor/compile.test.mjs`.

**Commit:** `feat(sculptor): compile build-state to DesignArtifact (T-024-01)`

## Step 4 — `index.mjs` barrel + `README.md`

Re-export the public surface; write a one-screen README (spine overview, the lock rule,
the compile contract, pointer to E-11). No logic.

**Verify:** `node -e "import('./src/sculptor/index.mjs').then(m =>
{...assert exports present...})"` — or a tiny assertion in an existing test importing the
barrel. Confirm no circular import (build → orchestrator/compile, barrel → all).

**Commit:** `feat(sculptor): barrel export + README (T-024-01)`

## Step 5 — Full gate

Run `npm test` (validate-artifact self-test + all `src/**/*.test.mjs`). Confirm the
prior 200 tests still pass and the new sculptor tests are included and green. Fix any
fallout (none expected — additive, no shared files).

**Commit:** none needed if steps 1–4 already green under full `npm test`; otherwise a
fixup commit.

## Testing strategy summary

| Concern | Test | Type |
|---|---|---|
| Cell defaults / key scheme | build-state.test | unit |
| Lock throw at write time | build-state.test | unit |
| Commit freezes + preserves locks | build-state.test | unit |
| `changedFields` correctness | orchestrator.test | unit |
| Two stages compose + independent locks | orchestrator.test | unit |
| Unlocked add accepted, then locked | orchestrator.test | unit |
| Locked overwrite rejected (draft + bypass) | orchestrator.test | unit |
| intent threading | orchestrator.test | unit |
| Compile round-trips through AJV | compile.test | integration (real validator) |
| Relief → Z, defaultBlock, manifest | compile.test | unit |
| Empty state rejected | compile.test | unit |

No fixtures, no network, no render. The only cross-module dependency exercised is
`compile → src/artifact.mjs` (the real AJV gate), which is the point of the round-trip
AC — it proves render/judge/export stay unchanged because the output is schema-valid.

## Risks & mitigations

- **`changedFields` false-negative** (misses a locked mutation) would defeat the
  defense layer. Mitigation: the draft throw is the *primary* guard; `changedFields` is
  defense-in-depth and is unit-tested on an explicit occupancy-add and field-change.
- **Map/Set immutability is by convention** (not deep-frozen). Mitigation: only
  `draftState`/`lockFields` produce successors, both returning fresh structures; tests
  assert the source state is unchanged after a stage runs.
- **AJV strictness drift** (a future schema field). Mitigation: compile derives
  everything from the schema's current required set via the example; if the schema gains
  a required field, the round-trip test fails loudly — the intended tripwire.

## Definition of done (maps to ticket AC)

- [ ] Build-state + stage interface + orchestrator + lock semantics under `src/sculptor/`.
- [ ] Lock enforcement tested: locked overwrite rejected; unlocked add succeeds.
- [ ] `toDesignArtifact` round-trips through the AJV validator on a hand-built state.
- [ ] Two trivial stages compose with independent lock records.
- [ ] `npm test` green.
