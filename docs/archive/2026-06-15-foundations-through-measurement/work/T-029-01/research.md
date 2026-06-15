# T-029-01 — Research: sculptor consolidation

**Ticket:** T-029-01 · story S-029 · epic E-11 (staged-sculptor-framework). Terminal link, gated on
the review bookend (T-026-01) and the relief pass (T-028-01). This phase maps what already exists; it
proposes nothing.

## What the ticket asks (restated)

1. Wire and demonstrate the **full staged loop** on one facade: concept→grid massing → material-noise →
   self-shadow relief → run the diagnostic critic on the composed render. End-to-end, valid
   `DesignArtifact`, renders, **measurably less flat** than massing-only (cite the metric), critic's
   diagnosis recorded.
2. A **boundary check**: the middle (material, relief) + review stages have **no concept-grid-specific
   import** — only `MassingSource` — so a GLB source is drop-in (the E-09-reuse hook).
3. `docs/knowledge/design-learnings.md` gains a **staged-sculptor section**.
4. `npm test` green.

This is a *consolidation*, the exact analog of E-10's T-023-01 (reconcile parallel tickets, remove
duplication where any, confirm the reuse boundary, write the journal). The capability already exists in
the five sibling modules; T-029-01 wires them into one demonstrated loop and proves the boundary.

## The spine and passes that already exist (`src/sculptor/`)

All six modules are built and individually tested. The barrel `index.mjs` re-exports every public name —
the single import site the ticket's "one import" claim rests on.

- **`build-state.mjs`** (leaf, T-024) — sparse facade grid `Map("x,y" → {occupied, material, relief})`
  plus a `locked` field-set and `lockLog`. Mutation only through `draftState(state) → Draft`; `Draft.set`
  **throws `LockViolationError`** the instant it changes a LOCKED field (re-writing the same value is a
  permitted no-op). `occupiedCells(state)` returns occupied cells sorted (y,x). **Zero project imports.**
- **`orchestrator.mjs`** (T-024) — `defineStage({name, run})` → pure `apply(state, intent) → state`.
  `runStages(state, stages, intent)` runs an ordered list and, after each stage, **locks exactly the
  fields it changed** (`changedFields` diff) — two-layer enforcement: write-time (the draft throw) +
  accept-time (`StageRejectedError` if a changed field was already locked). Imports only build-state.
- **`compile.mjs`** (T-024) — `toDesignArtifact(state, opts)`: one `voxel` placement per occupied cell at
  `[x, y, relief]`; manifest derived from blocks placed; throws on an empty state. Imports build-state +
  `config.mjs` (the pinned model id). **Does not validate** — the AJV gate (`src/artifact.mjs`) is the
  consumer-side check exercised in tests. Recesses are carved by exclusion: one voxel per cell, a recess
  just shifts that lone voxel to z=−1.
- **`massing.mjs`** (bookend 1, T-025) — `MassingSource` = `{width, height, occupied()}` in BUILD coords,
  **the one form seam**. `conceptGridSource(gridResult, {flipY})` is the **only** concept-grid-aware
  function — it adapts a `{grid, n, m}` (the E-10 image→block grid) to that contract and is the single
  place `null`-means-air / top-down-rows live. It does **not** import image-grid.mjs. `mass(source)` runs
  a "massing" stage → **locks `occupied`** (the proportion lock), leaving material/relief free.
  `proportionsOf(state)` is a pure projection. `compileMassing` paints one gray block.
- **`material.mjs`** (pass A, T-027) — over the locked massing, `material(state, intent)` runs a
  "material" stage that writes a deterministic, height-varied same-hue block pick on every occupied cell
  and **locks `material`**. `hueFamilySet(target)` upgrades E-10's single-block match to a k-nearest set
  via the engine's ΔE. Imports the spine + the **portable color engine** (`../color/cielab.mjs`,
  `../color/block-table.mjs`) — *not* image-grid. Namespace boundary: bare table keys ↔ namespaced ids.
- **`relief.mjs`** (pass B, T-028) — over the locked material, `relief(state, intent)` runs a "relief"
  stage that writes per-cell integer Z from a closed feature vocabulary (`FEATURE_RELIEF`: recess/window
  → −1, trim/cornice/frame/lip/eave/base → +1) plus simple cornice auto-detection, and **locks `relief`**.
  `reliefMetrics(state)` (occupied / relievedCount / **coverage** / **variance** / min / max / range) is
  the pure "less-flat" signal. Geometry-only: imports only the spine.
- **`review.mjs`** (bookend 2, T-026) — `reviewBuildState(state, {brief, render, diagnose})` renders →
  diagnoses → routes. PURE core: `ROUTING_TABLE` (flat→[material,relief], ringing→[curve],
  under-detailed-focal→[detail], proportion→[massing]), `routeDefect`/`routeDiagnosis`. `flat` is
  disambiguated FROM THE STATE (un-textured→material, textured-flat→relief). LIVE leaves (`defaultRender`
  = GL via `../../render/src/render-tool.mjs`; `defaultDiagnose` = BAML categorical judge via a tsx
  subprocess) are **injectable**, so tests stub them. "Routes, never re-emits" — the P14 cure as a type.

## The lock chain (the P14 cure, already enforced)

`mass` locks `occupied` → `material` locks `material` over the locked occupancy → `relief` locks `relief`
over the material-locked state. Each pass **adds a field within bounds; none can undo a prior one**. The
lock is enforced in code (the draft throw + the accept-time reject), not by convention. This is the
structural cure for the P14 regression (a blanket 2nd pass detaching masses — design-learnings P14, runs
013/017/020). The critic encodes the same cure on the read side: it routes to the responsible pass to
re-run over the locked state, never emitting a fresh artifact.

## The "less flat" metric (already built — `reliefMetrics`)

A massing-only or material-only state is **all-flat**: every cell `relief === 0`, so `coverage === 0` and
`variance === 0`. After the relief pass both are `> 0`. That is the citable, quantitative "measurably
less flat" signal the ticket's AC #1 wants — a pure projection (like `proportionsOf`), never stored, so
it cannot drift. The review critic's `flat→relief` route is judged against the same signal.

## The render path (for AC #1 "renders")

`render/src/render-tool.mjs` `renderArtifact(artifact, {outPath, view})` builds a fresh in-memory voxel
world and renders headless to a PNG, returning a `RenderReport {path, bytes, placed, unmapped, bounds,
view}`. GL gating: `headless-canvas.mjs` exports `GL_AVAILABLE` / `GL_LOAD_ERROR`; `render-tool.mjs`
re-exports the gate. **GL is available on this dev machine** (confirmed; the orbit GL-gated test passes
here), so the consolidation can render live. `review.mjs`'s `defaultRender` lazy-imports this same module.

## Test conventions (constraints on the deliverable)

- Test discovery is `node --test "src/**/*.test.mjs"` (package.json `test:unit`). New tests live under
  `src/sculptor/`. The `render/` suite is separate and not on this glob.
- **GL-gating pattern** (from `render/test/orbit.test.mjs`): import the gate, `t.skip(reason)` when
  `!GL_AVAILABLE`, otherwise render and assert a valid PNG (signature `89 50 4E 47…`, non-trivial bytes).
- **Boundary-test pattern** (from `src/color/reuse-boundary.test.mjs`, the E-10 analog): read a module's
  source, regex out every import specifier (`from "X"`, bare `import "X"`, dynamic `import("X")`), assert
  none match a denylist. This is exactly the shape AC #2 needs, applied to the sculptor middle/review.
- **Stubbed-model pattern** (from `review.test.mjs`): `reviewBuildState` is driven with stub
  `render`/`diagnose` so `npm test` loads neither GL nor BAML; the live path is "demonstrated in
  consolidation (S-029)" — i.e. here.
- **AJV gate**: `parseArtifact(obj)` returns `{ok, artifact}` / `{ok:false, errors}`; `assertArtifact`
  throws. The compiled artifact must pass it (the round-trip AC across every pass already tests this).

## Boundary reality (what AC #2 will assert)

Grep of the sculptor middle/review imports today:
- `material.mjs` → `./orchestrator`, `./build-state`, `./compile`, `./massing` (for `MASSING_BLOCK`),
  `../color/cielab`, `../color/block-table`.
- `relief.mjs` → `./orchestrator`, `./build-state`, `./compile`.
- `review.mjs` → `node:*`, `./build-state`; lazy `./compile`, `../../render/src/render-tool` (GL leaf),
  `node:child_process` (BAML leaf).
- `compile.mjs` → `./build-state`, `../config`.

**None import `image-grid.mjs`, `palette-extract.mjs`, `nano-banana.mjs`, `expand.mjs`, or any
concept-grid module.** The ONLY concept-grid-aware code is `massing.mjs`'s `conceptGridSource`, and even
that does not import image-grid — it duck-types `{grid, n, m}`. So the form dependency really is isolated
behind `MassingSource`; AC #2 is a guard that *keeps* it isolated, mirroring E-10's `reuse-boundary.test`.

## Open assumptions / constraints

- The live BAML judge (`defaultDiagnose`) needs metered `claude -p` + a tsx subprocess — **not** runnable
  in `npm test`. The demonstrated loop must render live (GL is here) but **stub the diagnose seam** to
  record a representative diagnosis deterministically. The diagnosis is "recorded" in the work artifacts.
- `conceptGridSource` needs a `{grid, n, m}`. The demo can synthesize a tiny hand-built grid (no JPEG
  decode, no image-grid import) so the test stays pure and fast while still exercising the real adapter.
- `index.mjs` is the single import site; the consolidation harness should be reachable through it so the
  "one import" claim is literally true.
- No existing module needs behavioral change — this is wiring + a boundary test + a metric demonstration
  + the journal. Any change to a sibling module would signal a missing dependency edge, not consolidation.
