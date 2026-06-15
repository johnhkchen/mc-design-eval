# T-003-02 — Review: voxel-world-construction

Handoff for a human reviewer: what changed, how it's tested, and what to watch.

## Summary

`render/` can now build a populated in-memory `prismarine-world` from a
primitive-expanded design artifact — every voxel's block **type** and
**state/orientation** written directly into the world, no bot, no server. This is
the S-001 → E-02 cross-section seam: `render/` reads the artifact contract by
consuming the *same* `src/expand.mjs` expansion every other consumer reads, then
resolving each voxel to a numeric block-state id and writing it.

## Files changed

| File | Type | Change |
|------|------|--------|
| `render/src/version.mjs` | modified | `blockStateId(name, state)` resolves state/orientation (was a fail-fast stub). +3 private helpers. |
| `render/src/world.mjs` | modified | `+ buildWorldFromArtifact`, `+ buildWorldFromVoxels`, `BuildResult` typedef, `boundsExtend`/`centerOf`; imports `../../src/expand.mjs`. |
| `render/test/world-build.test.mjs` | **new** | 9 GPU-free unit cases. |
| `render/README.md` | modified | New "Artifact → world construction" section; module table + scope updated. |

No deletions. No changes to `expand.mjs`, the schema, `render.mjs`, `cli.mjs`, or
`buildSampleWorld`. 3 atomic commits (`2b02523`, `874b773`, `c6823b8`).

## Acceptance criteria

- **AC #1 — every voxel at the correct coordinate with the correct type.** ✅
  `buildWorldFromArtifact` writes each expanded voxel via `setBlock`; test
  *"placement…"* reads back name at each coordinate and asserts air elsewhere.
- **AC #2 — state/orientation set where applicable.** ✅ `blockStateId(name,
  state)` computes the exact mixed-radix id; tests cover stairs (full +
  partial), an axis (log) block, and bool string-form, with the AC #4 oracle
  asserting a **non-default** stair orientation is actually present in the world
  (`getProperties()` → `facing:east, half:top`).
- **AC #3 — deterministic + reports unknown/unmappable.** ✅ Construction is total;
  unmappable voxels collect into `unmapped` (skipped, not fatal). Determinism
  test builds twice and asserts equal `placed`/`bounds`/`unmapped` and identical
  state ids across the bbox. `strict:true` throws an aggregated error.
- **AC #4 — known small artifact builds expected structure.** ✅ A tiny inline
  fixture (4-cell floor + oriented stair + glowstone); asserts exact `placed`,
  `bounds`, per-cell blocks, and the stair's orientation/state id.

## Test coverage

- `cd render && npm test` → **13 pass** (9 new + 4 scaffold, incl. the GL render
  smoke when GL is available).
- `npm test` (top-level) → **54 pass** — `src/` suites unchanged (no regression).

Coverage is total at the unit level because world construction and state
resolution are GPU-free. Exercised: full/partial/empty state; enum, bool, int
property kinds; all four throw classes; multi-primitive artifacts (fill/box/
voxel); the unmapped report; strict mode; build-twice determinism; bounds/center;
and the end-to-end known-artifact oracle.

**Gaps (acceptable):**
- No test renders a built world to PNG — rendering is T-003-03's contract and is
  already smoke-tested separately. The `center`/`bounds` returned here are the
  hook for that, and are unit-tested.
- `int`-typed state values are not exercised by a real fixture (no target block
  uses one yet); the code path is range-guarded and unit-reachable via the throw
  tests.

## Open concerns / known limitations

1. **`int` state base assumption.** `valueIndex` treats an int value as its own
   index (`0..num_values-1`). Correct for 1.20.4 states that index from 0
   (the common case; nothing in the industrial palette uses int states), but a
   block whose int property starts at a nonzero base would mis-index. Mitigated:
   out-of-range throws (no silent mis-map) and `composeStateId` asserts the final
   id is within `[minStateId, maxStateId]`. Revisit if a target block needs it.

2. **Sub-`y=0` voxels build but won't render.** Construction writes negative-y
   voxels correctly (verified by the world API; minY=-64). `prismarine-viewer`
   does not *mesh* sections below `y=0` (T-003-01 finding). This is a framing
   concern for T-003-03, not a construction defect — flagged so the renderer
   ticket offsets the build above `y=0` if needed.

3. **Cross-package import coupling.** `render/src/world.mjs` imports
   `../../src/expand.mjs` across the two package boundaries. Intentional (the
   single named seam) and verified to resolve (top-level package has no `exports`
   restriction); `expand.mjs` is pure and dependency-free. If a future packaging
   change adds `exports` to the top-level package, this path must be allow-listed.

4. **Validation is upstream.** `buildWorldFromArtifact` assumes a schema-valid
   artifact (consistent with the expansion contract); it does not call
   `artifact.mjs`. A malformed-but-not-validated artifact could throw from
   `expandArtifact` rather than producing a clean report. Callers in the trial
   harness should validate first (they already hold `parseArtifact`).

## Verdict

Safe to advance. All four ACs met with machine-checked tests, no regressions, and
the seam/pin/expansion boundaries preserved. The open concerns are bounded,
documented, and either owned by downstream tickets (2) or guarded against silent
failure (1, 3, 4).
