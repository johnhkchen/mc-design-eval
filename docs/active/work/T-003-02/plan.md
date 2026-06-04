# T-003-02 — Plan: voxel-world-construction

Ordered, independently-verifiable steps. Each step is one atomic commit and
leaves both test suites green. Testing strategy: pure unit tests (`node:test`,
no GPU) — world construction and state resolution are GPU-free, so coverage is
total and runs on any CI. Render (GPU) stays out of scope.

Verification commands:
- `cd render && npm test` — render-package suites (scaffold + new world-build).
- `npm test` (top-level) — schema gate + `src/` unit suites (regression: expand
  must stay untouched/green).

---

## Step 1 — State→id resolution in `version.mjs`

**Change.** Replace the stateful fail-fast branch of `blockStateId(name, state)`
with the Decision A3 algorithm. Add module-private `decodeDefaultIndices`,
`valueIndex`, `composeStateId`. Keep the stateless fast path
(`defaultState ?? minStateId ?? id`) byte-identical.

**Detail.**
- Strip `minecraft:`; look up `blocksByName`; throw `unknown block "<name>"` if
  absent (unchanged).
- `state` empty/undefined → return base (unchanged).
- `block.states` empty but state supplied → throw `block "<bare>" takes no state
  properties`.
- Decode `base - minStateId` into per-property indices (big-endian).
- For each supplied `(key,value)`: find property; throw `block "<bare>" has no
  state property "<key>"` if missing; compute `valueIndex` (enum→`indexOf`,
  bool→true:0/false:1 accepting strings, int→integer in `[0,num_values)`); throw
  `illegal value <json> for "<bare>.<key>"` on `<0`.
- Recompose; assert `min ≤ id ≤ max` (defensive throw); return id.

**Tests (in `render/test/world-build.test.mjs`, added this step).**
- `blockStateId('glowstone')` and `blockStateId('minecraft:stone')` unchanged
  (positive ints; prefix accepted).
- `blockStateId('oak_stairs', {facing:'east',half:'top',shape:'straight',
  waterlogged:'false'})` equals the expected mixed-radix id (computed once and
  pinned as a literal in the test).
- Partial state `{facing:'north'}` on `oak_stairs` equals `defaultState`
  (north/bottom/straight/false *is* the default) — proves omitted = default.
- `oak_log {axis:'x'}` equals `minStateId` (x is index 0).
- Throws: unknown prop name; illegal enum value; props on `glowstone`; unknown
  block. Each asserted via `assert.throws(fn, /regex/)` on the located message.

**Verify.** `cd render && npm test` green; new state cases pass; scaffold suite
unaffected.

**Commit.** `T-003-02: resolve block state/orientation to state ids (AC #2)`

---

## Step 2 — World builders in `world.mjs`

**Change.** Add `import { expandArtifact } from '../../src/expand.mjs'`. Add
`buildWorldFromVoxels(voxels, opts)` and `buildWorldFromArtifact(artifact,
opts)`, plus private `boundsExtend`/`centerOf` and a `BuildResult` `@typedef`.
Implement the collect-don't-crash policy with opt-in `strict` (Decision B).

**Detail.** Per `structure.md` flow: fresh world; iterate voxels in order;
`try setBlock / catch → unmapped`; track bounds + placed; compute center; if
`strict && unmapped.length` throw an aggregated error; return `BuildResult`.

**Tests (same suite).**
- **Placement (AC #1).** Inline artifact mixing `fill` (floor) + a `voxel`
  block; after build, `world.getBlock(pos).name` matches at each expected
  coordinate, and an off-build coordinate reads `air`.
- **Unmapped report (AC #3).** Artifact with one bogus block
  (`minecraft:not_a_block`): `unmapped` has exactly that entry with a `reason`;
  `placed` counts the rest; the good voxels are present in `world`.
- **strict.** Same artifact with `{strict:true}` → `assert.rejects` with a
  message naming the bad block.
- **Determinism (AC #3).** Build the same artifact twice; assert equal `placed`,
  deep-equal `bounds` and `unmapped`, and identical `getBlockStateId` across the
  bounding box.
- **center/bounds.** Bounds equal the min/max of placed voxels; `center` is the
  rounded midpoint and a `Vec3`.

**Verify.** `cd render && npm test` green.

**Commit.** `T-003-02: build in-memory world from expanded artifact (AC #1, #3)`

---

## Step 3 — Known-small-artifact oracle (AC #4)

**Change.** Add the AC #4 case to the suite. A deliberately tiny artifact whose
expected world is enumerable by hand and that exercises **orientation**:

```
placements:
  fill  [0,0,0]..[1,0,1]  minecraft:stone           ; 4-block floor
  voxel [0,1,0]           minecraft:oak_stairs  state {facing:east, half:top}
  voxel [1,1,1]           minecraft:glowstone
```

**Test.** Build it; assert: `placed === 6`; each floor cell is `stone`; the
stair cell's `getBlock().getProperties()` reports `facing:'east', half:'top'`
(and its stateId equals `blockStateId('oak_stairs',{facing:'east',half:'top'})`
— i.e. a **non-default** id, so the test fails if state were ignored);
the glowstone cell is `glowstone`; `unmapped` is empty; `bounds` is
`{min:[0,0,0],max:[1,1,1]}`.

Kept as its own commit so the "expected structure" oracle is reviewable in
isolation (high-leverage per the workflow's AC-oracle guidance).

**Verify.** `cd render && npm test` green; AC #4 case passes.

**Commit.** `T-003-02: verify known small artifact builds expected world (AC #4)`

---

## Step 4 — Documentation

**Change.** Add the "Artifact → world construction (T-003-02)" subsection to
`render/README.md`: the two entry points, `BuildResult` shape, state-resolution
rule, unmapped/`strict` policy, and the `../../src/expand.mjs` seam note.

**Verify.** Prose only; both suites still green. No code touched.

**Commit.** `T-003-02: document artifact→world construction in render/README`

---

## Risk / rollback

- Each step is independently revertible; Steps 2–4 depend on Step 1, Step 3 on
  Step 2. No schema, `expand.mjs`, or render-pipeline edits, so blast radius is
  `version.mjs` + `world.mjs` + one new test + README.
- If the cross-package import fails to resolve in some environment (it resolves
  here), fallback is a thin re-export shim in `render/`; not expected.

## Progress tracking

`progress.md` updated after each commit: step done, deviations + rationale,
remaining. `review.md` written after Step 4.
