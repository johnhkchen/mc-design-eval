# T-025-01 Research — massing-bookend

Descriptive map of the codebase as it bears on producing a **locked gray massing
shell** (the first staged-build state) from a form source, behind a `MassingSource`
interface. No solutions here — only what exists, where, and how it connects.

## The ticket in one line

Bookend 1 of the staged sculptor (E-11 / S-025): take a *form* (the E-10 image→block
grid today, a GLB later), set `occupied` per cell, leave `material`/`relief` unset,
**lock the occupancy** (the proportion lock), attach proportion metadata for the review
critic (S-026), and compile to a gray single-material `DesignArtifact` that passes AJV.

## The spine this builds on (T-024-01, already implemented)

`src/sculptor/` is the framework spine. Everything T-025 needs is exported from the
`index.mjs` barrel. The relevant surface:

- **`build-state.mjs`** (the leaf — no intra-project imports):
  - `createBuildState({width, height})` → frozen `BuildState` = `{width, height,
    cells:Map<"x,y",Cell>, locked:Set<string>, lockLog:[]}`. Cells sparse: an absent
    key reads as `defaultCell() = {occupied:false, material:null, relief:0}`.
  - `draftState(state)` → `Draft`; `Draft.set(x,y,patch)` enforces locks at WRITE time
    (throws `LockViolationError` on changing a locked field) and `commit()` freezes a
    successor carrying `locked`/`lockLog` UNCHANGED.
  - `occupiedCells(state)` → `[{x,y,cell}]` sorted by `(y,x)`.
  - `lockFields(state, stageName, fields)` → new state with `fields` unioned into
    `locked` and a `{stage,fields}` lockLog entry (no entry if `fields` empty).
  - `FIELDS = ["occupied","material","relief"]`, `cellKey`/`parseKey`, `isLocked`.
- **`orchestrator.mjs`**:
  - `defineStage({name, run})` → `{name, apply(state,intent)}`; `run(draft,intent,prev)`
    only mutates the draft, the wrapper drafts/commits.
  - `runStages(state, stages, intent={})`: per stage, `apply` → diff via
    `changedFields(prev,next)` → reject (`StageRejectedError`) if any changed field was
    already locked → else `lockFields(next, stage.name, [...changed])`. **This is where
    "lock occupancy on accept" happens for free**: a stage that writes only `occupied`
    gets exactly `occupied` locked.
  - `changedFields(prev,next)` → `Set<field>` differing on any cell (a newly occupied
    cell contributes `"occupied"`).
- **`compile.mjs`**:
  - `toDesignArtifact(state, opts)` → one `{op:"voxel", pos:[x,y,relief], block}`
    placement per occupied cell; `block = cell.material ?? opts.defaultBlock` (default
    `minecraft:stone`); `palette.manifest` = unique sorted blocks placed; throws if zero
    occupied cells. **Pure — does not validate** (the AJV gate is a consumer check).
  - `COMPILE_DEFAULTS`: `schema_version "1.0.0"`, `style {name:"massing", rationale}`,
    metadata `{trial_id, prompting_method_id:"staged-sculptor.v1", model_id:
    PHASE1_MODEL_ID, seed:0, server_state_id:"in-memory"}`. `opts.metadata`/`opts.style`/
    `opts.defaultBlock`/`opts.palette_id` override.

Key consequence: **an un-materialed occupied cell already compiles to a single gray
block** via `defaultBlock`. A massing-only state (occupied set, material null) compiles
to a uniform-material artifact with zero extra work — exactly the "gray shell."

## The form source today (E-10, `src/color/image-grid.mjs`)

`gridFromImage(path, opts)` / `gridFromPixels(img, opts)` → a `GridResult`:

- `grid` — `m` rows × `n` columns, `grid[gy][gx]` is a block-id string or **`null`
  (air)**. Row `gy=0` is the **top** of the image; `gx=0` is the left.
- `n` (cols), `m` (rows, aspect-correct: `m = round(n·H/W)`), `width`/`height` (source
  px), `filledCells`, `airCells`, `totalCells`, `legend`, `usedBlocks`, `meanDeltaE`,
  `description`.
- Occupancy is implicit: a cell is **occupied iff `grid[gy][gx] !== null`**. The block
  id is the E-10 color choice — irrelevant to massing (massing wants silhouette only).
- `GRID_DEFAULTS.n = 48`. A facade is a silhouette: most cells are air.

This is the only form source that exists. The ticket wants its specifics (the `grid`
2-D array, the `null=air` convention, the row/col indexing) hidden behind `MassingSource`
so a GLB voxelizer can replace it without touching massing/compile.

**Orientation constraint (load-bearing).** Image row `gy=0` is the top; build/Minecraft
`y` is up (render `world.mjs` writes `pos[1]` as world-Y, Y-up). Mapping `gy→y` directly
would render the facade upside down. The grid's bottom row must land at the build's
lowest `y`. This is the one coordinate decision the adapter must make.

## The artifact contract + AJV gate (`src/artifact.mjs`)

- `parseArtifact(input)` / `assertArtifact(input)` compile `schema/design-artifact.
  schema.json` with ajv (2020, `strict`, `discriminator`). This is the SAME gate the
  render tool's door uses (`render-tool.mjs` → `coerceArtifact` → `parseArtifact`).
- Schema requires `schema_version`, `metadata` (with the 5 required fields), `style`,
  `palette.manifest` (uniqueItems, minItems 1), `placements` (≥1). `voxel` op needs
  `pos:[int,int,int]` + `block`. `compile.mjs` already satisfies all of this.
- **In this codebase, "passes AJV" is the accepted proxy for "renders/judge/export stay
  unchanged"** — `compile.test.mjs` asserts the round-trip; the full GL render
  (`render-tool.mjs createRenderServer`, prismarine + headless Chromium) is explicitly
  **NOT run by `npm test`**. `render/src/world.mjs buildWorldFromArtifact` constructs the
  voxel world (no GL) but pulls prismarine from `render/`'s deps and is async/heavy.

## Tests + tooling conventions

- `npm test` runs schema self-tests then `node --test "src/**/*.test.mjs"`. Sculptor
  tests live beside their modules (`*.test.mjs`), use `node:test` + `node:assert/strict`,
  and are **pure** (hand-built states / synthetic inputs, no decode, no GL). Baseline
  is green (230 tests after T-024-01).
- `node:assert` gotcha already hit in this module (S1048 memory): `assert.throws()`
  returns `undefined` — don't read its return value. Use `assert.throws(fn, /regex/)`.
- `image-grid.test.mjs` builds synthetic RGBA buffers / hand grids — the model for
  testing the massing adapter without a binary fixture.

## Constraints & assumptions surfaced

1. **No edits to the spine source.** T-024-01's structure.md states the spine is
   additive and unmodified by downstream tickets. The `index.mjs` barrel is the
   documented single import site for T-025…T-028, so *extending the barrel* with the
   massing surface is in-scope; editing build-state/orchestrator/compile is not.
2. **Proportion metadata must live somewhere.** `BuildState` is frozen with a fixed
   shape (`{width,height,cells,locked,lockLog}`) and shouldn't grow a field (that's a
   spine change). Proportions are fully **derivable from the locked occupancy**, so a
   pure projection function (callable by the S-026 critic from the locked state) avoids
   storing drift-prone duplicate state.
3. **Lock via `runStages`, not raw `lockFields`.** AC says "uses the S-024 lock
   enforcement." Running a massing stage through `runStages` exercises the real
   lock-on-accept path and yields a `lockLog` entry — the idiomatic proof.
4. **`material`/`relief` must stay UNLOCKED.** Only `occupied` locks here; the material
   (T-027) and relief (T-028) passes still need to write their fields over this shell.
5. **Single-material gray.** Leaving `material` null + compiling with one `defaultBlock`
   yields the uniform gray artifact; no per-cell material is set in this bookend.
6. **GLB drop-in.** The `MassingSource` contract must be expressible by a future voxel
   source: it needs only grid bounds (`width`,`height`) and the set of occupied build
   coordinates — nothing concept-grid-specific.
