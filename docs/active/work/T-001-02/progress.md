# T-001-02 — Progress: placement-primitive expansion

Tracks execution against `plan.md`. All three planned steps are complete; the
global gate (`npm test`) is green. No deviations from the design — two small,
documented refinements to the plan are noted below.

## Status: COMPLETE

| Step | Artifact | State | Commit |
|------|----------|-------|--------|
| 1 | `src/expand.mjs` (kernel) | done | `bf3df92` |
| 2 | `src/expand.test.mjs` + `package.json` wiring | done | `T-001-02: unit suite + npm test wiring …` |
| 3 | `src/README.md` (documented rule) | done | `T-001-02: document expansion semantics …` |

## Step 1 — Expansion kernel (`src/expand.mjs`)

Implemented exactly per `structure.md`, in the planned internal order:
`@typedef`s → `bounds` → `eachCell` → `voxelKey` → `expandPlacement` (switch on
`op`) → `expandArtifact` (Map accumulate in array order, last-writer-wins, sort
by y,z,x).

- `voxel` copies `state` through only when present (via the `voxelAt` helper, so
  a stateless voxel has no `state` key — not `state: undefined`).
- `fill` / `box` share the single `eachCell` (y,z,x) iteration primitive; `box`
  keeps cells matching the shell predicate.
- `line` is factored into a private `expandLine`: computes `d = to − from`,
  `n = max|dᵢ|`, throws a located Error if any nonzero axis delta `≠ ±n`, else
  steps `from + i·sign(d)` for `i ∈ [0..n]`.
- unknown `op` throws `unknown placement op "<op>"`.

**Deviation (minor):** the plan listed `voxelAt` implicitly ("each emitted voxel
gets pos/block/state"); it was extracted into a named helper so the
"state-only-when-present" rule lives in exactly one place. No behavioral change.
Verified manually before the suite existed (`node -e` over the valid sample
printed a plausible deduped count).

## Step 2 — Unit suite + `npm test` wiring

`src/expand.test.mjs` written with `node:test` + `node:assert/strict`, covering
the full plan coverage matrix (20 tests):

- **AC-1 per-op geometry:** `voxel` (single + state carried, and the stateless
  no-key case), `fill` volume + corner-order invariance, `box` shell count
  (7×5×7 − 5×3×5 = 170, corner in / interior out) + flat-plane + 1×1×1
  degenerate cases, `line` axis-aligned (`n+1`), 2-D and 3-D uniform diagonals,
  and from/to invariance.
- **Guards (D5/D10):** non-uniform line throws `/not a straight lattice line/`;
  unknown op throws `/unknown placement op "sphere"/`.
- **AC-2:** mixed artifact (voxel+fill+box+line) deduped count == an
  independently-computed coordinate-union size, and key-set deep-equal.
- **AC-3:** last-writer-wins (block AND state replaced whole; later stateless
  placement strips earlier state), determinism (JSON-stringify equal across two
  expansions), canonical (y,z,x) ordering, order-independence of non-overlapping
  placements.
- **Integration:** reuses T-001-01's `schema/examples/valid-industrial-house.json`
  — asserts non-empty output, all 49 floor cells at y=0, and that the stateful
  stair voxel kept `{ facing: "north", half: "bottom" }`.

`package.json`: added `"test:unit": "node --test \"src/**/*.test.mjs\""` and
appended `&& npm run test:unit` to `"test"`. Additive, key-distinct edit — no
semantic merge with T-001-03 needed.

**Deviation (from plan, documented):** the plan wrote `test:unit` as
`node --test src/`. On Node v22 a bare **directory** argument to `node --test`
is not honored the same way and surfaced an error during implementation; the
glob `"src/**/*.test.mjs"` is the portable form and discovers the suite
reliably. This matches the plan's own "Risks" note that discovery would be
"verified at implement time."

## Step 3 — Document the rule (`src/README.md`)

Written per `structure.md`: the contract boundary (assumes schema-valid input),
the public API, the four op geometries (incl. degenerate cases), the `line`
straight-lattice rule + rejection rationale, the last-writer-wins / full-replace
overlap rule by array order, the (y,z,x) canonical output order, and the
determinism / order-independence guarantees (noting overlapping-reorder is
*expected* to differ). Stated counts match the suite's assertions — no
doc/code drift.

## Gate

`npm test` → schema self-test + both samples **and** all 20 unit tests pass
(`# pass 20 / # fail 0`). No new runtime or dev dependencies introduced
(`node:test`/`node:assert` are built in). AC-1..AC-4 demonstrated end to end.

## Concurrency

The only shared file with siblings is `package.json`; the edit is additive and
key-distinct, serialized by Lisa's file lock. No conflict was observed during
this run. No source paths overlap T-001-03's SDK-binding module.
