# `src/sculptor/` — the staged-sculptor spine (E-11 / S-024)

The framework that turns *form* into a **good** Minecraft build the way a great builder
works: **stage the build, each stage operating on a locked prior substrate.** This
directory is the **spine** (T-024-01) — the build-state model, the stage interface, the
orchestrator with lock semantics, and the compile-down to a `DesignArtifact`. The craft
passes (massing, material-noise, relief) and the review critic plug into it as
downstream tickets (T-025…T-029).

## The pieces

- **`build-state.mjs`** — a sparse facade grid (`Map` keyed `"x,y"`) of cells, each
  `{occupied, material, relief}`, plus a `locked` field-set and a `lockLog`. Mutation is
  only via `draftState(state) → Draft`; `Draft.set` **throws `LockViolationError`** if it
  changes a LOCKED field (re-writing the same value is a permitted no-op). `commit()`
  freezes a successor.
- **`orchestrator.mjs`** — `defineStage({name, run})` wraps a `(draft, intent, prev)`
  body into the pure `apply(state, intent) → state` stage interface. `runStages` runs an
  ordered list and, after each stage, **locks exactly the fields it contributed**
  (`changedFields` diff). A stage that changes a locked field is rejected — at write time
  (the draft throw) and, as defense against a draft bypass, at accept time
  (`StageRejectedError`).
- **`compile.mjs`** — `toDesignArtifact(state, opts)`: one `voxel` placement per occupied
  cell at `[x, y, relief]`, manifest derived from blocks placed. Pure — validation is the
  consumer's job (`src/artifact.mjs`), exercised in the round-trip test.
- **`index.mjs`** — public barrel for downstream tickets.
- **`massing.mjs`** (bookend 1, T-025) — the gray proportion shell. `conceptGridSource`
  adapts a *form* (the E-10 image grid today, a GLB later) to the neutral `MassingSource`
  contract (`{width, height, occupied()}` — no concept-grid specifics leak); `mass` sets
  `occupied` and runs a "massing" stage through `runStages` to **lock occupancy** (the
  proportion lock), leaving `material`/`relief` free; `proportionsOf` derives bounds/aspect
  for the S-026 review critic; `compileMassing` paints one gray block (`MASSING_BLOCK`).

## The load-bearing rule

**Locks make "improve" additive, never destructive** — the structural cure for the P14
regression (a blanket 2nd pass detaching masses). Massing locks `occupied` (the
proportion lock); material locks `material` over the locked massing; relief locks
`relief` over the material-locked state. Each pass adds a field within bounds; none can
undo a prior one. The lock is enforced in code, not by convention.

## Boundaries

Pure: no SDK, no network, no render, no schema import in the modules themselves. The AJV
gate (`src/artifact.mjs`) validates the compiled output in tests, proving render / judge
/ export stay unchanged. Run `npm test` (or `node --test src/sculptor/*.test.mjs`).
