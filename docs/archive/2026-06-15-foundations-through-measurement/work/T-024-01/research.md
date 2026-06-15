# T-024-01 Research — staged-build-spine

Epic E-11 / story S-024. Map of the codebase territory this ticket touches: the
artifact contract it must compile down to, the existing form source it will later
consume, the test idioms it must match, and the lock/stage concepts it must invent.
Descriptive only — options and decisions are deferred to `design.md`.

## What this ticket is

The framework **spine** of the staged sculptor (E-11). Four pieces, all new:

1. **Build state** — a per-cell intermediate richer than the flat `DesignArtifact`,
   carrying `occupied` (massing), `material` (block id), `relief` (Z-depth), and a
   per-stage **lock** record.
2. **Stage interface** — `stage(buildState, intent) → buildState`, a pure transform;
   `intent` is the LLM/plan side-channel (focal hierarchy, palette-mood) a stage reads.
3. **Orchestrator** — runs an ordered stage list, **locking** each stage's
   contributions on accept; a later stage that mutates a locked field is rejected
   (the P14 destructive-revision cure, enforced structurally, not by convention).
4. **Compile** — `toDesignArtifact(buildState)` → a valid artifact whose placements
   carry Z from relief, passing the existing AJV gate unchanged.

Nothing here is LLM-facing yet: the massing source (T-025), material-noise (T-027),
relief (T-028), and the review critic (T-026) are downstream and depend on this spine.

## The artifact contract (the compile target)

`schema/design-artifact.schema.json` is the single source of truth (compiled with
`ajv` 2020, `strict:true`, `discriminator:true`). `src/artifact.mjs` is the gate:

- `parseArtifact(input) → {ok, artifact} | {ok:false, code, errors}` — validation is a
  value, not an exception; success freezes the artifact.
- `assertArtifact(input)` — fail-fast variant (throws located errors).
- `compileValidator()` / `loadSchema()` / `SCHEMA_PATH` — reusable for tests.

A valid artifact (see `schema/examples/valid-industrial-house.json`) requires:
- `schema_version` — `^\d+\.\d+\.\d+$` (examples use `"1.0.0"`).
- `metadata` — required `trial_id`, `prompting_method_id`, `model_id`, `seed`,
  `server_state_id`; optional `target` (`house|path|landscape`), `created_at`
  (date-time). `additionalProperties:false`.
- `style` — `{name, rationale}`, both non-empty. `additionalProperties:false`.
- `palette` — `{manifest: BlockId[]}` (minItems 1, **uniqueItems**), optional
  `palette_id`. `additionalProperties:false`.
- `placements` — array, **minItems 1**. Each is a discriminated union on `op`:
  - `voxel` → `{op, pos:[x,y,z], block, state?}`
  - `line` / `box` / `fill` → `{op, from, to, block, state?}`
  - `additionalProperties:false` on every branch; `block` matches
    `^[a-z0-9_.-]+:[a-z0-9_]+$`; coordinates are 3 integers (negatives allowed —
    "builds use a local origin", so relief −1 is legal).

**Compile implication:** the cleanest mapping is one `voxel` placement per occupied
cell at `pos = [x, y, relief]` with `block = material`. The artifact wrapper
(metadata/style/palette) is **not** geometry — the build state has no trial identity,
so `toDesignArtifact` must accept that wrapper as an argument (with defaults) and
derive `palette.manifest` from the set of materials actually placed. Memory
[[prompt-vs-live-artifact-schema]] warns: conform to this live AJV gate, not a looser
prompt schema, or renders fail.

`array order is application order ... last-writer-wins` (schema note on `placements`):
emitting one voxel per cell sidesteps overlap entirely — each cell is written once.

## The form source this spine will consume (downstream, T-025)

`src/color/image-grid.mjs` (E-10 / T-022) is the concept-image → block-grid producer
the massing bookend (T-025) will wrap behind a `MassingSource` interface. Relevant
shape for this ticket's compile target:

- `gridDims(width, height, n) → {n, m}` — `n` columns, aspect-correct `m` rows.
- Grid cells map to a block id **or AIR (null)** — "a facade is a silhouette, not a
  solid rectangle." So `occupied` is exactly the non-air cells.
- Grid coordinate convention: column index (x) and row index (top-down). World-up
  orientation (flipping row→y) is a **massing-stage** concern (T-025), not the spine's.
  The spine stores whatever (x,y) keys it is handed and compiles them verbatim.

This ticket does **not** import image-grid (T-025 owns that seam). But the build
state's `(x,y)` cell model must be compatible with an N×M facade grid so the massing
bookend drops in without reshaping. The facade plane is x (width) × y (height); the
**z axis is depth** — exactly what `relief` feeds (inset −1, pop +1, per T-028).

## Lock semantics — the load-bearing concept

From the epic: "once a stage is accepted, later stages may not undo it (only add
within bounds) ... the structural fix for the regression we measured when a blanket
2nd pass detached masses (P14)." Memory [[3d-reference-vs-flat-facade]] records that
same destructive-2nd-pass failure mode from the live runs.

Reading the chain for granularity:
- Massing (T-025) sets and **locks `occupied`** (the proportion lock — silhouette frozen).
- Material-noise (T-027) writes `material` over the **locked massing**.
- Self-shadow relief (T-028) writes `relief` over the **material-locked** state — it
  "must not alter the locked `occupied` or `material`." So locks are **per field**
  (occupied / material / relief), each owned by the stage that produces it, and a
  later stage may add a *different* field but never overwrite a locked one.

"Only add within bounds" = a relief stage may set `relief` on already-occupied cells
but may not extend `occupied` (that would change the locked silhouette). So adding a
brand-new occupied cell after the massing lock is itself a locked-field mutation →
rejected.

## Test idioms to match

- Runner: `node --test "src/**/*.test.mjs"` via `npm run test:unit`; full `npm test`
  also runs the validate-artifact self-test. Tests use `node:test` + `node:assert/strict`.
- Co-located `*.test.mjs` next to the module (see `src/color/*.test.mjs`).
- Pure cores are unit-tested on synthetic inputs with **no binary fixtures** and no
  domain coupling (`reuse-boundary.test.mjs` even statically scans imports to keep the
  color engine portable). The sculptor spine should be similarly pure: no SDK, no
  network, no render dependency — testable on hand-built states.
- File headers are long, explain boundaries and rationale, cite ticket/story ids.

## Constraints & assumptions surfaced

- **ESM `.mjs`, Node 20+**, no new deps (ajv/ajv-formats already present; reuse
  `src/artifact.mjs`'s validator rather than recompiling).
- **Purity:** the spine is geometry + locks only — no model calls, no I/O. The LLM
  side (`intent`) is threaded but not interpreted here.
- **Facade-first:** cells are 2-D `(x,y)`; the model is "ready to extend to per-voxel"
  (ticket wording) but need not implement 3-D now. Keep the cell key scheme trivially
  extensible.
- **AJV gate unchanged:** the schema is not edited; compile must satisfy it as-is.
- **Lock enforcement must be *structural*** — enforced in code at write time, plus a
  defense-in-depth check in the orchestrator — not a documented convention a stage
  can forget to honor.
- **Two trivial stages must compose** with *independent* lock records — so the lock
  log must record one entry per contributing stage, keyed by stage name + fields.
