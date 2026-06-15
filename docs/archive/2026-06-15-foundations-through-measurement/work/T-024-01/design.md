# T-024-01 Design — staged-build-spine

Decisions for the four spine pieces, grounded in `research.md`. Each section states
the options considered, the choice, and what was rejected and why.

## D1 — Build-state shape & cell indexing

**Options.**
- (a) Dense 2-D array `cells[y][x]` with parallel field planes.
- (b) Sparse `Map<"x,y", cell>` of occupied/known cells only.
- (c) Three separate `Map`s (occupancy / material / relief).

**Choice: (b) — a sparse `Map` keyed `"x,y"`, value `{occupied, material, relief}`.**
A facade is a silhouette (research: image-grid emits AIR for background) — most of the
bounding box is empty, so a sparse map is the honest representation and avoids
materializing air cells. One cell object per key keeps the three fields co-located so a
stage reads a cell's full state in one lookup. The key is a string `` `${x},${y}` ``;
a `cellKey(x,y)` / `parseKey(k)` pair isolates the scheme so per-voxel `"x,y,z"` is a
later one-line change (ticket: "ready to extend to per-voxel").

Rejected: (a) wastes space on air and fixes dimensions early; (c) scatters a cell's
fields across three structures, making the per-cell lock diff awkward.

`BuildState = { width, height, cells: Map, locked: Set<field>, lockLog: [] }`, frozen
at the wrapper level. `width/height` are the facade bounds (metadata for the review
critic later, and the compile bounding box). `locked` is a `Set` of field names
(`"occupied" | "material" | "relief"`). `lockLog` is an ordered array of
`{ stage, fields }` accept records.

**Field-level, global locks (not per-cell).** The chain (research D-on-locks) locks a
*whole field* per stage: massing locks `occupied`, material locks `material`, relief
locks `relief`. Per-cell locks would be needed only if two stages co-owned one field on
disjoint cells — nothing in E-11 does that. Global-per-field is simpler and matches the
"only add within bounds" reading exactly: once `occupied` is locked, no cell's
occupancy may change (so the silhouette can't grow), but `material`/`relief` stay open.

## D2 — Stage interface & how locks are derived

**The interface is exactly the ticket's:** `stage.apply(buildState, intent) →
buildState`, a pure transform. The open question is **how the orchestrator learns what
to lock**.

**Options.**
- (a) Stage declares `writes: ["material"]`; orchestrator locks that list.
- (b) Orchestrator **diffs** input vs output, locks whatever fields changed.
- (c) A guarded draft tracks touched fields; the committed state carries them.

**Choice: (b) diff-derived locks, backed by (c) a guarded draft for write-time
enforcement.** Diffing keeps the stage interface *exactly* `(state, intent) → state`
with no extra `writes` bookkeeping a stage author can get wrong — the framework
observes contributions rather than trusting a declaration. A `changedFields(prev, next)`
helper walks the union of cell keys and returns the set of fields whose value differs on
any cell (and flags occupancy added/removed). The orchestrator locks that set.

Rejected (a): a declared `writes` list is a second source of truth that can drift from
what the stage actually wrote; diffing can't drift. We keep a *defense* equivalent of
(a)'s intent via the orchestrator's locked-field check below.

## D3 — Lock enforcement: structural, two layers

The epic demands locks be "load-bearing ... the structural fix," not advisory. Two
layers, so a correct stage is stopped early and a *bypassing* stage is still caught:

1. **Write-time (the structural cure).** A stage never mutates a `BuildState` directly;
   it goes through `draftState(prev)` → a `Draft` whose `set(x, y, patch)` **throws
   `LockViolationError`** if `patch` changes a field in `prev.locked` to a new value
   (re-writing the *same* value is a no-op, honoring "only add within bounds"). The
   draft inherits `prev.locked`, so the very act of trying to overwrite a locked field
   fails at the point of the write — this is the P14 cure enforced in code.
2. **Accept-time (defense in depth).** Even if a stage hand-builds a state bypassing the
   draft, the orchestrator computes `changedFields(prev, next)` and, if any changed
   field is in `prev.locked`, **rejects** the stage (`StageRejectedError`) before
   locking or advancing. A bypass cannot slip a locked-field mutation past the
   orchestrator.

This dual guard directly satisfies the AC: "a stage that tries to overwrite a locked
field is rejected; a stage that only adds to unlocked fields succeeds" — the first via
the draft throw, the second because an unlocked-field write diffs clean and gets locked.

`Draft.commit()` returns a new frozen `BuildState` carrying `prev.locked`/`prev.lockLog`
**unchanged** — locking is the orchestrator's job on accept, not the stage's. This keeps
"the orchestrator locks each stage's contributions" literally true and lets a stage be
run in isolation (in a test) without self-locking.

## D4 — Orchestrator

`runStages(state, stages, intent) → BuildState`:

```
for (const stage of stages):
  const next   = stage.apply(state, intent)        // may throw LockViolationError
  const changed = changedFields(state, next)        // Set<field>
  const illegal = changed ∩ state.locked            // defense vs draft bypass
  if (illegal.size) throw StageRejectedError(stage.name, illegal)
  state = lockFields(next, stage.name, changed)     // lock contributions, log them
return state
```

- `intent` is threaded read-only to every stage; the spine never interprets it.
- `lockFields(state, name, fields)` appends `{stage:name, fields:[...]}` to `lockLog`
  and unions `fields` into `locked`. If a stage contributes nothing (true no-op), no
  log entry is added — but the two **trivial** stages in the AC each write a distinct
  field, so they produce two **independent** lock records (AC satisfied).
- A stage is `{ name, apply }`. A `defineStage({ name, run })` helper wraps the
  draft/commit boilerplate: `apply = (s, i) => { const d = draftState(s); run(d, i, s);
  return d.commit(); }` — so stage authors write only `run(draft, intent, prevState)`.

## D5 — Compile to DesignArtifact

`toDesignArtifact(state, opts) → DesignArtifact`. The build state is geometry with no
trial identity, so `opts` supplies the non-geometry wrapper with safe defaults:

- `opts.metadata` — merged over defaults (`trial_id:"sculptor-compile"`,
  `prompting_method_id:"staged-sculptor.v1"`, `model_id: PHASE1_MODEL_ID` from
  `src/config.mjs`, `seed:0`, `server_state_id:"in-memory"`).
- `opts.style` — default `{name:"massing", rationale:"…"}` (massing bookend overrides).
- `opts.defaultBlock` — `"minecraft:stone"`, used for an occupied cell with no
  `material` yet (the gray-massing compile T-025 needs).
- `opts.schemaVersion` — `"1.0.0"`.

**Mapping.** For each occupied cell, emit one `voxel` placement: `pos = [x, y, relief ??
0]`, `block = material ?? defaultBlock`. Placements sorted by `(y, x)` for deterministic
output (stable diffs, reproducible tests). `palette.manifest` = the sorted unique set of
blocks emitted (guarantees `uniqueItems` + `minItems 1` whenever ≥1 cell is occupied).
Voxel-per-cell sidesteps the schema's last-writer-wins overlap rule (each cell written
once) and keeps Z=relief explicit per cell.

Rejected: run-length / box compaction of contiguous same-block cells. It would shrink
placement count but complicate relief handling (a box can't carry per-cell Z) and is
premature — facades are ≤48 wide; voxel-per-cell is clear and correct. Compaction is a
later optimization that doesn't change the contract.

**Validation seam.** `toDesignArtifact` itself does not validate (pure construction);
tests call `parseArtifact`/`assertArtifact` from `src/artifact.mjs` to prove the output
passes the live gate — reusing the one true validator, never restating the schema.

## D6 — Error types

Two named errors so callers and tests can branch precisely:
- `LockViolationError` (thrown by `Draft.set`) — carries `{field, x, y}`.
- `StageRejectedError` (thrown by `runStages`) — carries `{stage, fields}`.

Both extend `Error` with a `code` (`"lock_violation"` / `"stage_rejected"`) mirroring
`artifact.mjs`'s value-style error codes, so behavior is greppable and testable by code.

## D7 — File layout

Under `src/sculptor/` (ticket: "e.g. under `src/sculptor/`"): `build-state.mjs`
(state + draft + locks + errors), `orchestrator.mjs` (runStages, defineStage),
`compile.mjs` (toDesignArtifact), `index.mjs` (barrel). Co-located `*.test.mjs` for the
first three. Detailed boundaries in `structure.md`.

## What is explicitly out (per epic "Out")

No massing source, no material/relief/curve passes, no review critic, no GLB, no
render. Those are T-025…T-029. This ticket ships only the spine + lock semantics +
compile, proven by two trivial composing stages and a hand-built round-trip.
