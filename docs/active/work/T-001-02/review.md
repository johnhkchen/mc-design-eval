# T-001-02 — Review: placement-primitive expansion

Handoff for a human reviewer. Summarizes what changed, evaluates test coverage
against the acceptance criteria, and flags open concerns. The work is complete
and `npm test` is green.

## What changed

| File | Change | Lines |
|------|--------|-------|
| `src/expand.mjs` | **NEW** — the expansion kernel (public API). | ~185 |
| `src/expand.test.mjs` | **NEW** — 20-test `node:test` unit suite (AC-4). | ~205 |
| `src/README.md` | **NEW** — documented semantics + overlap rule (AC-3). | ~120 |
| `package.json` | **MOD** — additive: `test:unit` script + folded into `test`. | +2/−1 |

Nothing deleted. New `src/` is the repo's first library-source dir. No new
runtime or dev dependencies — pure integer geometry on `node:`-builtins only.

Commits (on `main`, the shared ticket branch):
- `bf3df92` — Step 1, the kernel.
- `T-001-02: unit suite + npm test wiring …` — Step 2.
- `T-001-02: document expansion semantics + overlap rule …` — Step 3.

## Public surface

- `expandArtifact(artifact) → Voxel[]` — the seam T-003-02 (voxel-world build)
  and T-002-02 (schematic export) depend on. Deduplicated, canonical (y,z,x).
- `expandPlacement(placement) → Voxel[]` — single placement, for tests/reuse.
- `voxelKey(pos) → "x,y,z"` — shared dedup/identity key.
- `Voxel = { pos:[x,y,z], block, state? }` — `state` present only when carried.

## Acceptance criteria — all met

- **AC-1 (box/line/fill → explicit voxels):** ✅ tests 3–11. Each op asserts
  exact counts and spot-membership; degenerate `box` cases (flat plane, 1×1×1)
  and uniform 2-D/3-D diagonal lines covered.
- **AC-2 (mixed artifact → one deduped set):** ✅ test 14 — count and key-set
  checked against an independently-computed coordinate union.
- **AC-3 (deterministic, order-independent, documented overlap rule):** ✅
  tests 15–19 (last-writer-wins full-replace incl. state-stripping, byte-equal
  determinism, canonical ordering, non-overlapping order-independence). Rule
  documented in `src/README.md` and the `expandArtifact` JSDoc.
- **AC-4 (unit tests per primitive + overlap rule):** ✅ the whole suite, run by
  `npm test` behind the schema gate. `# pass 20 / # fail 0`.

## Test coverage assessment

Strong for a pure function. The two correctness properties most likely to
regress — determinism and order-independence — are themselves expressed as
assertions, so they are machine-checked, not just prose. Both guard/throw paths
(non-uniform line, unknown op) are witnessed. The integration test exercises the
realistic T-001-01 fixture rather than only synthetic inputs.

**Gaps (acceptable, noted):**
- No property-based / fuzz testing — counts are checked on fixed hand-chosen
  cuboids. A volume-formula property test (`fill` count == `(dx+1)(dy+1)(dz+1)`
  over random corners) would broaden coverage cheaply; deferred.
- No explicit test for large-build performance — `expandArtifact` is `O(voxels)`
  in a `Map`, fine for the in-memory worlds this phase renders; unmeasured at
  scale.
- Negative-coordinate inputs aren't exercised. The math (`Math.min/max`, `sign`)
  is sign-agnostic so this should be correct, but it is unasserted.

## Open concerns for the human reviewer

1. **`line` rejects non-uniform slopes (design D5).** A line like `dx=4, dz=2`
   throws rather than rasterizing. This is deliberate — a measurement instrument
   should fail honestly rather than guess a shape — but it is a real authoring
   constraint. If downstream styles want slanted runs, the path is either
   multi-segment lines or a future generalized rasterizer (would need a chosen,
   documented algorithm + its own tests). **Flagged, not a blocker.**

2. **Schema-validity is assumed, not enforced.** `expandPlacement` indexes
   `placement.pos`/`from`/`to` without guarding shape; a malformed placement
   that slipped past validation would throw a generic `TypeError`, not a located
   error. This matches the contract boundary (T-001-01/03 validate upstream),
   but if expansion is ever called on un-validated input the failure mode is
   ugly. Consider a cheap assert at the seam if that risk materializes.

3. **No `minecraft-data` block-ID check here, by design.** `block` strings are
   passed through verbatim — palette/buildability validation is E-04's job. A
   reviewer expecting this module to reject unknown blocks should know it
   intentionally does not.

4. **Output `Voxel` has no provenance.** A voxel does not record which placement
   produced it. The overlap rule makes that unrecoverable anyway (the loser is
   gone). If a downstream debug/visualization layer wants "which primitive owns
   this cell," that information must be threaded in separately. Not needed by
   the current consumers.

5. **Shared-branch / `package.json` contention.** The edit is additive and was
   serialized cleanly, but T-001-03 may also append to `scripts`. If a future
   merge shows a conflict here, the resolution is to keep both script keys — no
   semantic merge.

## Recommendation

Ready for review and downstream consumption. The kernel is small, pure, fully
tested against all four ACs, and documented. Concern #1 (line strictness) is the
only item that may warrant a product decision; the rest are boundary notes for
whoever wires this into the voxel world (T-003-02).
