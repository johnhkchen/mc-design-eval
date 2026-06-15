# T-027-01 — Research: material-noise pass

Epic E-11 / story S-027. Seed craft pass **A**: a `stage(state, intent) → state` over the locked
massing that assigns each surface a **same-hue block set** (2–3 IDs) with a noise mix, varied across
height. This is the "mix stone/cobble/andesite for depth and age" move (the run-015 effect) — an
upgrade of E-10's single-block match to a hue-family *set*. It writes `material` and locks it.

Descriptive only — what exists and where the new pass plugs in. No solution here.

## The spine the pass composes onto (`src/sculptor/`)

- **`build-state.mjs`** — the rich intermediate. A sparse `Map` keyed `"x,y"` of cells, each
  `{occupied:boolean, material:string|null, relief:number}`, plus `locked:Set<field>` and `lockLog`.
  `FIELDS = ["occupied","material","relief"]`. Mutation only via `draftState(state) → Draft`; the
  `Draft.set(x,y,patch)` guard **throws `LockViolationError`** if a patch *changes* a LOCKED field —
  but **re-writing the same value is a permitted no-op** ("only add within bounds"). `commit()`
  freezes a successor whose `locked`/`lockLog` carry from the source UNCHANGED (locking is the
  orchestrator's job, not the stage's). Helpers: `getCell`, `isLocked`, `occupiedCells` (sorted by
  y,x), `defaultCell()` = `{occupied:false, material:null, relief:0}`.

- **`orchestrator.mjs`** — `defineStage({name, run})` wraps a `(draft, intent, prev) → void` body into
  the pure `apply(state, intent) → state` interface (draft → mutate → commit). `runStages(state,
  stages, intent)` runs an ordered list; after each stage it diffs (`changedFields`) and **locks
  exactly the fields that stage changed**. Two-layer enforcement: write-time (the draft throw) plus
  accept-time (`StageRejectedError` if a draft-bypassing stage changed an already-locked field).
  `intent` is a read-only side-channel threaded to every stage; the spine never interprets it.

- **`compile.mjs`** — `toDesignArtifact(state, opts)`: one `voxel` placement per occupied cell at
  `[x, y, cell.relief]`, `block = cell.material ?? opts.defaultBlock`. Manifest is the **unique sorted
  set of blocks actually placed** — so a multi-material surface yields a multi-entry manifest
  automatically. Pure; never validates. Throws if zero occupied cells.

- **`massing.mjs`** (bookend 1, T-025, the immediate upstream) — `mass(source) → {state,
  proportions}` runs a single "massing" stage that sets `occupied:true`, **locking only `occupied`**
  (material/relief stay free). `proportionsOf(state)` is a pure projection (bbox/aspect/fill).
  `compileMassing` pins one gray block. The state this pass receives has `occupied` LOCKED and
  `material`/`relief` UNLOCKED.

- **`index.mjs`** — public barrel (this pass adds its exports here). `README.md` documents the passes.

## The E-10 color engine (the hue-family source)

- **`src/color/cielab.mjs`** — the portable color core, **zero project/Minecraft knowledge**.
  `srgbToLab(rgb 0–255) → Lab`, `deltaE76`/`deltaE` (CIE76 Euclidean in Lab), and
  `nearestLab(targetLab, palette, {metric}) → {key, deltaE, lab}` (argmin scan over `[{key,lab}]`),
  `nearest(rgb, palette)`. This finds **one** nearest entry; "nearest *and its near neighbours*" is a
  k-nearest rank by `deltaE` over the same candidate list — not yet a function here, but buildable
  from `deltaE` without touching the portable core.

- **`src/color/block-table.mjs`** — `loadBlockTable() → {version, blocks:[{block, texture, rgb, lab}],
  ...}`. **305 full-cube, survival-obtainable** blocks with cached `lab`. Runtime path pulls zero
  asset deps (reads the committed `block-lab-table.json`). The candidate pool for the hue-family set.
  Verified the stone family is dense: nearest to `stone` (Lab L≈52.8) → `cobblestone` (ΔE 0.87),
  `stone_bricks` (1.58), `gravel` (2.16), `chiseled_stone_bricks` (2.75)… i.e. the run-015 set is
  literally the k-nearest of stone.

- **`src/color/palette-extract.mjs`** — `extractPalette*` produces the design's canonical palette
  `[{block, repColor:{rgb,lab,hex}, coveragePct, ...}]` ordered by coverage. The **target palette**
  the ticket references comes from here (or the design manifest). Note its `block` keys are **bare**
  (`"stone"`), matching the table.

## Load-bearing constraint: block-id namespace

The AJV gate's block-id pattern is `^[a-z0-9_.-]+:[a-z0-9_]+$` — block ids **must be namespaced**
(`minecraft:stone`). The block table and `palette-extract` keys are **bare** (`stone`). Verified: a
bare id FAILS the validator; `minecraft:stone` passes. So this pass must **strip the namespace when
looking up a block in the table** and **emit a namespaced id when writing `material`**. (Matches the
"prompt vs live artifact schema — conform to live or renders fail" memory.)

## `intent` — where the target palette enters

`intent` is the only channel a craft pass reads for plan/LLM guidance; the spine threads it untouched.
There is **no concrete `intent` schema yet** — massing ignores it; the relief sibling (T-028) will
read focal/trim annotations from it. This pass is the first to consume `intent`, so it gets to define
its own sub-shape (the target palette / per-surface targets), keeping it optional with a sensible
fallback so the pass still works on a bare massing state with empty `intent`.

## Sibling that gates on this pass (forward constraint)

`T-028-01` (relief) composes on the **material-locked** state: it writes `relief`, must not touch the
now-locked `occupied` or `material`. So this pass must lock `material` cleanly (only `material`
changes; `occupied`/`relief` untouched) or the relief pass's lock-composition proof breaks.

## Test patterns to mirror (`massing.test.mjs`)

- `gridOf(rows)` builds a duck-typed `GridResult` from ASCII (`#`=occupied). Fixtures are hand-built —
  no image decode, no GL.
- The AJV round-trip: compile, then `parseArtifact(artifact).ok` / `assertArtifact` from
  `../artifact.mjs` (the **real** gate).
- `assert.throws(fn, ErrorType)` — node:assert's `throws` returns `undefined`; never read its return
  (the S1048 gotcha, noted at the top of the massing test).
- Lock-composition tests: run a follow-on stage and assert `LockViolationError` /
  `StageRejectedError` when it tries to change a locked field.

## Assumptions & constraints carried into Design

1. **Same-hue noise, NOT color dithering.** Per surface, ONE hue family; vary block *within* the
   family for texture/age, not across hues. Default variation modest so color fields stay clean.
2. **Height variation is required and tested** (top band vs bottom band differ) — the "light break".
3. **Determinism.** No `Math.random` — the noise must be a pure function of cell position (and
   intent), so tests are stable and renders reproducible.
4. **Only `material` changes.** `occupied` (locked) must be left untouched; don't write `relief`.
5. **Out-of-palette is a failure.** Every assigned material ∈ (the computed hue-family set ∪ the
   design manifest). The set is *seeded from* the target palette, so this holds by construction.
6. **Reuse the E-10 engine** (`deltaE`/`nearestLab` + `loadBlockTable`) for the set — no new color
   math, and the portable core stays untouched.
7. **Fallback target.** With empty `intent`, default the target to the massing gray (`stone`) so the
   pass upgrades the gray shell to a stone-family noise field with no plan input.
