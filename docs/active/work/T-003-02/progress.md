# T-003-02 — Progress: voxel-world-construction

Implement phase. All plan steps complete; both test suites green.

## Status: complete

| Step | Plan item | State | Commit |
|------|-----------|-------|--------|
| 1 | State→id resolution in `version.mjs` | ✅ done | `2b02523` |
| 2 | World builders in `world.mjs` | ✅ done | `874b773` |
| 3 | Known-small-artifact oracle (AC #4) | ✅ done | `874b773` (with Step 2) |
| 4 | README documentation | ✅ done | `c6823b8` |

## What was built

- **`render/src/version.mjs`** — `blockStateId(name, state)` now resolves
  state/orientation. Private helpers `decodeDefaultIndices` (big-endian
  mixed-radix decode of `defaultState`), `valueIndex` (enum/bool/int → index,
  located throw on illegal), `composeStateId` (recompose + `[min,max]` assert).
  Stateless fast path preserved byte-for-byte.
- **`render/src/world.mjs`** — `buildWorldFromVoxels(voxels, opts)` and
  `buildWorldFromArtifact(artifact, opts)` (the latter the `../../src/expand.mjs`
  seam), private `boundsExtend`/`centerOf`, `BuildResult` typedef. Collect-don't-
  crash with opt-in `strict`.
- **`render/test/world-build.test.mjs`** — 9 GPU-free cases.
- **`render/README.md`** — "Artifact → world construction (T-003-02)" section;
  module table + out-of-scope updated.

## Verification

- `cd render && npm test` → **13 pass** (9 new + 4 scaffold, render smoke incl.).
- `npm test` (top-level) → **54 pass** — `src/expand.mjs` untouched, no regression.

## Deviations from the plan

1. **Steps 2 and 3 landed in one commit (`874b773`), not two.** The plan kept the
   AC #4 oracle as its own commit, but its assertions live in the same new test
   file (`world-build.test.mjs`) as the Step-2 cases; splitting one file across
   two commits added churn without improving reviewability. The oracle is a
   clearly-delimited, self-contained `test(...)` block at the end of the file, so
   it remains reviewable in isolation. Net: 3 commits instead of 4. No scope
   change.

2. **No change to `cli.mjs` / `buildSampleWorld`.** As planned — the artifact path
   is additive; the sample render entrypoint and its sub-`y=0` framing are
   unchanged (that framing is a render concern, T-003-03).

3. **`prismarine-block` not used.** Confirmed during research it is only a
   transitive dep and is permissive in instrument-fatal ways (unknown prop →
   silently dropped; bad value → out-of-range id; omitted → index 0 not default).
   Implemented the mixed-radix math directly on the declared `minecraft-data`
   dependency instead. Cross-checked equal to `prismarine-block` across all 48
   oak_stairs facing×half×shape×waterlogged combinations before writing code.

## Notes for downstream / review

- Construction writes sub-`y=0` voxels correctly; `prismarine-viewer` will not
  *render* sections below `y=0` (T-003-01 finding) — a T-003-03 framing concern,
  not a construction bug.
- `int`-typed states are assumed to index from 0 (range-guarded; nothing in the
  industrial palette uses them). Documented as a known limitation in `review.md`.
