# T-024-01 Review — staged-build-spine

Handoff self-assessment for the E-11 framework spine (story S-024). The spine — build
state, lock semantics, stage interface, orchestrator, and compile — is implemented,
tested, and committed (`ce0ab81`). `npm test`: **230 pass / 0 fail** (200 baseline
preserved, 30 new).

## What changed

**New — `src/sculptor/` (all additive; no existing file modified):**

| File | Lines | Role |
|------|-------|------|
| `build-state.mjs` | ~200 | Sparse cell grid, `Draft` (guarded mutation), `lockFields`, `LockViolationError` |
| `orchestrator.mjs` | ~95 | `changedFields`, `defineStage`, `runStages`, `StageRejectedError` |
| `compile.mjs` | ~75 | `toDesignArtifact` (voxel-per-cell, relief→Z, derived manifest) |
| `index.mjs` | ~25 | Public barrel |
| `README.md` | ~45 | One-screen spine overview |
| `build-state.test.mjs` | 14 tests | Cell/key/draft/lock-throw/freeze |
| `orchestrator.test.mjs` | 10 tests | Diff, compose, both rejection paths, intent threading |
| `compile.test.mjs` | 7 tests | AJV round-trip, relief→Z, manifest, defaults, empty-reject |

**Design choices worth a reviewer's eye (rationale in `design.md`):**
- **Diff-derived locks** (not a declared `writes` list): the orchestrator observes what
  a stage changed (`changedFields`) and locks exactly that — no second source of truth a
  stage author can desync.
- **Two-layer lock enforcement:** the `Draft.set` write-time throw is the primary,
  structural cure; the orchestrator's accept-time `changed ∩ locked` check is defense
  against a stage that hand-builds a state bypassing the draft. Both are tested.
- **Compile does not validate** — it imports neither `ajv` nor the schema. Validation is
  the consumer's seam (`src/artifact.mjs`), exercised in the round-trip test. This keeps
  the spine free of the gate and proves render/judge/export stay unchanged.
- **Immutability by construction:** every successor is a fresh frozen wrapper; `Map`/`Set`
  are treated as immutable because only `draftState`/`lockFields` mint successors. Tests
  assert the source state is untouched after a stage runs.

## Test coverage

Strong on the spine's contract:
- **Lock semantics** — both rejection paths (draft `LockViolationError`, bypass
  `StageRejectedError`), the same-value no-op escape hatch, unlocked-add-then-lock, and
  `lockFields` union/log/empty-noop. This is the load-bearing behavior and it is the most
  thoroughly covered.
- **Composition** — two trivial stages compose with independent lock records (the AC),
  plus `intent` threading and the `{}` default.
- **Compile** — the real AJV round-trip on a hand-built 3-cell state including a
  negative-relief inset, plus relief→Z, unique/sorted manifest, `defaultBlock`, metadata
  override, and empty-state rejection.

### Gaps / not covered (intentional, scoped out)
- **No render/score proof.** The epic's "demonstrably less flat" end-to-end demo is
  T-028's AC, not this ticket's — the spine only proves schema-valid compile, not visual
  quality.
- **No massing/material/relief stages.** Only two *trivial* stages exist (proving the
  interface); the real craft passes are T-025/T-027/T-028.
- **`changedFields` is O(cells × FIELDS) per stage.** Fine for facades (≤48 wide); not
  benchmarked for large 3-D states. A later per-voxel model may want a touched-set
  optimization, noted in `progress.md`.
- **2-D only.** Cells are `(x,y)`; the per-voxel `(x,y,z)` extension is isolated to
  `cellKey`/`parseKey` but not implemented (no consumer needs it yet).

## Open concerns / flags for a human reviewer

1. **Lock granularity is global-per-field, not per-cell.** Massing locks *all* of
   `occupied`, material locks *all* of `material`, etc. This matches every stage in the
   E-11 chain (no two stages co-own one field on disjoint cells). If a future pass needs
   to own one field on a *subset* of cells while another pass owns the rest, the lock
   model would need to become per-cell — a deliberate deferral, called out here so it
   isn't discovered late.
2. **Map/Set immutability is by convention, not deep-frozen.** A stage that reaches into
   `state.cells` directly (instead of via `draftState`) could mutate in place. The
   accept-time diff catches a *locked-field* mutation, but an unlocked in-place mutation
   of a prior state would not be caught. Mitigation today: `defineStage` is the blessed
   path and never exposes the raw map; the bypass test documents the boundary. A deep
   freeze of cells could harden this later at some clone cost.
3. **Compile defaults carry a placeholder trial identity** (`trial_id:
   "sculptor-compile"`, `style.name: "massing"`). These are meant to be overridden by the
   producing bookend; a stray compile with no `opts` produces a valid-but-generic
   artifact. Acceptable for the spine; downstream callers should pass real metadata.

## Verdict

All five acceptance criteria met and tested; `npm test` green; additive with zero
changes to existing modules or the schema. The interface is real and input-agnostic — a
massing source (concept grid or future GLB) and the craft passes plug in via
`defineStage` with no orchestrator changes. Ready for the dependent tickets (T-025,
T-026) to build on.
