# T-028-01 — Research: self-shadow relief pass

Descriptive map of the code the relief pass (seed craft **pass B**) builds on. Epic E-11 / story
S-028. The pass is a `stage(state, intent) → state` over the **material-locked** state that assigns
`relief` (Z-depth) and locks it, never touching the locked `occupied` or `material`. This is the
proof that a pass composes on a *prior pass's* locked output — the third link in the chain.

## The chain so far (what is already built and locked)

`massing (T-025) → material (T-027) → relief (T-028, this ticket)`. Each pass is a stage run through
the spine's `runStages`, which **locks exactly the fields the stage wrote** on accept. By the time
relief runs, `occupied` (from massing) and `material` (from material-noise) are both LOCKED; `relief`
is the one field still free. Relief writes it and locks it — the chain is then fully sculpted.

## Spine modules (`src/sculptor/`)

- **`build-state.mjs`** — the leaf. A sparse `Map` keyed `"x,y"` of cells
  `{occupied:boolean, material:string|null, relief:number}` (`defaultCell()` → `relief:0`), plus a
  `locked` `Set<field>` and a `lockLog`. `FIELDS = ["occupied","material","relief"]` — **relief is
  already a first-class field**, no schema/state change needed. Mutation only via
  `draftState(state) → Draft`; `Draft.set(x,y,patch)` walks `FIELDS`, and for each field whose new
  value *differs* from the current draft value: if that field is LOCKED it throws
  `LockViolationError`, else applies. **Writing the same value to a locked field is a permitted
  no-op** ("only add within bounds"). `commit()` freezes a successor carrying `locked`/`lockLog`
  unchanged. Helpers: `getCell`, `isLocked`, `occupiedCells` (sorted (y,x)), `lockFields`.
- **`orchestrator.mjs`** — `defineStage({name, run})` wraps a `(draft, intent, prev) → void` body
  into the pure `apply(state, intent) → state` stage. `runStages(state, stages, intent)` runs each
  stage, computes `changedFields(prev, next)` (the FIELDS differing on any cell), **rejects**
  (`StageRejectedError`) if a changed field was already locked (accept-time, defense in depth), else
  `lockFields(next, stage.name, changed)`. Two-layer lock enforcement: write-time
  (`LockViolationError` in `Draft.set`) and accept-time (`StageRejectedError`).
- **`compile.mjs`** — `toDesignArtifact(state, opts)`: **one `voxel` placement per occupied cell at
  `pos:[x, y, cell.relief ?? 0]`** — *relief is already wired to Z*. Manifest derived from blocks
  placed. Pure, no validation. One placement per cell sidesteps the schema's last-writer-wins overlap
  rule.
- **`massing.mjs`** (T-025) — `mass(source) → {state, proportions}`, `conceptGridSource`,
  `proportionsOf`, `compileMassing`, `MASSING_BLOCK = "minecraft:stone"`, `MASSING_STYLE`. Locks
  `occupied`.
- **`material.mjs`** (T-027) — **the closest template for this ticket.** `material(state, intent)`
  runs a `materialStage` that paints every occupied cell and locks `material`. Reads
  `intent.material` for `palette`/`surfaces`. Key reusable patterns:
  - `resolveSurfaces(state, intent)` — partitions occupied cells into surfaces: explicit
    `intent.material.surfaces[].region` claim cells first (in order, via a `claimed` Set), the rest
    form a default surface. **Relief's feature-region partition is the same shape.**
  - `regionPredicate(region)` — `null`→all, a `(x,y)→bool` function, or a `[[x,y],…]` list → a
    predicate. **Directly reusable** for relief feature regions (same intent vocabulary).
  - `cellHash(x,y)` — deterministic xorshift hash → [0,1) (no `Math.random`). Relief is deterministic
    too but likely needs no jitter (Z is discrete: −1/0/+1), so it may not need the hash.
  - The convenience/stage/compile/STYLE export quartet + barrel entry + README bullet.
- **`review.mjs`** (T-026) — the diagnostic critic. Relevant because its `flat` defect is
  *disambiguated from the state*: an un-textured field routes to `material`, a **textured-but-flat**
  field routes to `relief`. So relief is the named cure for "flat" in the routing table
  (`ROUTING_TABLE`: flat→material/relief). Not imported by this ticket, but it is relief's consumer —
  the metric AC ("measurably less flat") is the quantitative side of that defect.
- **`index.mjs`** — public barrel. Relief adds its exports here.
- **`README.md`** — "The pieces" list; the load-bearing-rule section already names relief:
  "relief locks `relief` over the material-locked state." A `relief.mjs` bullet must be added.

## The artifact / schema boundary (constraints)

- **`schema/design-artifact.schema.json`** — `coordinate` is `[x,y,z]` integers; **"Negative values
  allowed (builds use a local origin)"** — so `relief:-1` → `pos[2]=-1` is schema-legal. No schema
  change. `voxel` op requires `["op","pos","block"]`.
- **`src/artifact.mjs`** — the live AJV gate (`parseArtifact`/`assertArtifact`). The round-trip AC is
  "compile → passes the *real* validator." Block ids must be namespaced (`^[a-z0-9_.-]+:[a-z0-9_]+$`),
  but relief never writes a block id (material owns that) — relief only changes Z, so the namespace
  concern is material's, not relief's.

## Memory rules that bind this ticket

- **Facade recess by exclusion** ([[facade-recess-by-exclusion]]) — "no air op; carve recesses by NOT
  placing front material, not by burying a block behind a solid fill." In this voxel model a recess is
  achieved by setting the existing cell's *single* voxel back to Z=−1. The compile emits **exactly one
  voxel per occupied cell**, so there is structurally never a front block burying a back one —
  exclusion is honored by construction. Relief must NOT add cells or a second placement; it only
  shifts Z. The AC "recesses are carved by exclusion (no buried blocks)" maps to: placement count ==
  occupied count, and a recessed cell's lone placement sits at z=−1.
- **Prompt vs live artifact schema** ([[prompt-vs-live-artifact-schema]]) — conform to the live AJV
  gate. Relevant for the round-trip test (use `parseArtifact`/`assertArtifact`, not a looser shape).

## Feature regions: where they come from

The ticket: "Feature regions come from `intent` (the plan's focal/trim annotations) and/or simple
detection over the material/occupancy." Two sources, mirroring material:
1. **`intent`** — the plan side-channel. There is **no region-segmentation engine** in the repo (same
   gap material noted); the established convention is explicit regions (predicate or `[x,y]` list)
   carried on `intent`. The plan's focal/trim annotations live here.
2. **Simple detection over occupancy** — geometry-only. The obvious deterministic primitive is
   horizontal extremes: the topmost occupied row of the bbox reads as a cornice/eave line; the
   bottom row as a base course. `occupiedCells` + a bbox scan (the `proportionsOf` idiom) is all that
   is needed; no material inspection required for a first detection.

## The three legal-geometry moves the ticket names

- **Recesses / windows → inset −1** (self-shadow; carve by exclusion).
- **Trim / cornices / frames → pop +1** (cast shadow under the lip).
- **Horizontal lines (cornice, eave, base) → a lip/overhang** so the course below sits in shadow — in
  Z terms, the line course pops +1 and overhangs the row beneath it.

All three are a per-cell integer in `{-1, 0, +1}`. There is no curve/sub-voxel relief in this model
(Z is the integer voxel lattice), so relief is a discrete classification, not a continuous field.

## Test harness conventions (from `material.test.mjs` / `massing.test.mjs`)

- `node:test` + `node:assert/strict`. `gridOf(rows)` builds a duck-typed `{grid,n,m}` from `#/.`
  ASCII; `mass(conceptGridSource(gridOf(rows))).state` makes a locked massing fixture.
- **S1048 gotcha:** `assert.throws()` returns undefined — assert with the `(fn, ErrorType)` form.
- Tests exercise the **real** AJV gate via `parseArtifact`/`assertArtifact`, assert lock survival with
  `isLocked`, and prove composition with `LockViolationError`/`StageRejectedError`.
- A local `occupiedOf(state)` helper mirrors the spine's sorter to avoid import coupling.

## Assumptions / open constraints

- Relief is integer Z only (lattice). "Lip/overhang" is modeled as a +1 pop on the horizontal-line
  course (no sub-cell geometry).
- No segmentation engine → feature regions are intent-driven, with a minimal occupancy-based default
  detection so the bare `massing→material→relief` chain still yields measurable relief (the metric AC).
- The metric AC needs a pure relief metric (coverage and/or Z-variance) that is 0 on massing-only /
  material-only states and >0 after relief — to assert the increase. No such metric exists yet; one
  must be added (parallels `proportionsOf` as a pure projection of the state).
- DAG/file-lock: this ticket touches only `src/sculptor/*` (one new file + barrel + README) — no
  shared-file contention with sibling tickets.
