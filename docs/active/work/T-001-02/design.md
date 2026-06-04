# T-001-02 — Design: placement-primitive expansion

Decisions, grounded in `research.md`. Each option is weighed against the repo
reality (ESM `.mjs`, minimal deps, located errors, root contract package) and
the AC. Rejected paths recorded.

## D1 — Language & toolchain: ESM `.mjs` + JSDoc types (not new TS build)

CLAUDE.md names TypeScript, but the repo has **no TS toolchain** and ships two
`.mjs` modules (research). Options:

- **(a) Introduce a TypeScript build** (`tsc`, `dist/`, `typescript` dep, a
  `.ts` source tree). Honors the letter of CLAUDE.md but is a heavyweight
  toolchain decision — emit step, source maps, a `dist/` import story — that
  belongs in a dedicated scaffold ticket, not smuggled into a feature ticket. It
  also enlarges the file footprint that the concurrent T-001-03 might race on.
- **(b) Plain ESM `.mjs` with rich JSDoc `@typedef`s.** Matches both existing
  modules exactly, adds **zero dependencies**, runs natively on Node 22, is
  importable by a future TS module (TS reads JSDoc via `allowJs`/`checkJs`), and
  keeps the footprint self-contained. The artifact types are described in JSDoc
  so consumers (T-003-02) get editor types without a build.
- **(c) `.ts` run via `--experimental-strip-types`.** Experimental on Node 22,
  fragile, and still implies a TS-flavored toolchain the repo hasn't adopted.

**Chosen: (b).** Decision is grounded in repo reality, not the aspirational
stack line; introducing TS is a separate, explicit migration. Documented as an
open concern in `review.md` so the TS question is surfaced, not buried.

## D2 — Module location: root package under `src/`

`palettes/` is a nested package only because it is *reference data* with its own
dep (`minecraft-data`). Expansion is core contract logic in the **same S-001
package as the schema**, which lives in the root package (`schema/`+`scripts/`).
Options: a new nested `expand/` package (rejected — needless package boundary,
no distinct deps) vs a `src/` dir in the root package (chosen — it is the first
of the project's actual library source, and T-003-02 imports it as a library,
not a CLI). Files land under `src/`, tests beside them as `*.test.mjs`.

## D3 — Public API surface

Two pure functions plus a key helper:

```js
/** @typedef {[number,number,number]} Coordinate */
/** @typedef {{ pos: Coordinate, block: string, state?: Record<string,string> }} Voxel */

export function expandPlacement(placement): Voxel[]      // one placement → its voxels
export function expandArtifact(artifact): Voxel[]        // whole artifact → normalized set
export function voxelKey(pos: Coordinate): string        // canonical "x,y,z" dedup key
```

- `expandPlacement` is the per-op geometry kernel (testable in isolation, AC-4
  "each primitive type").
- `expandArtifact` does the normalization: expand every placement in array
  order, dedup with last-writer-wins, emit in canonical order (AC-1, AC-2, AC-3).
- Returning a plain `Voxel[]` (not a wrapper object) keeps the seam with
  T-003-02 trivial — it iterates voxels and writes them into the world. Stats
  (raw vs deduped counts) are useful but not required by any AC; rather than
  bloat the return type, expose them only if a consumer needs them later.
  Rejected: returning `{ voxels, stats, bounds }` now (YAGNI; widens the
  interface the downstream ticket must depend on).

## D4 — `from`/`to` normalization

Schema doesn't require `from <= to` (research). **Normalize per-axis**: compute
`lo = [min(fx,tx), min(fy,ty), min(fz,tz)]`, `hi = [max...]` before generating.
This makes `box`/`line`/`fill` invariant to which corner the model named first —
a small but real determinism property, and the natural reading of "spanning
from..to". Applies to `box`/`fill`; `line` handles direction separately (D5).

## D5 — `line` voxelization: axis-aligned + uniform diagonals; reject the rest

"Straight lattice line, inclusive" is underspecified for arbitrary slopes
(research). Options:

- **(a) General 3D rasterization (Bresenham/DDA).** Handles any `from`/`to`, but
  the exact voxel set depends on the rasterization convention (which axis drives,
  tie-breaking). For a *deterministic, human-buildable* contract that is a
  footgun: two reasonable implementations disagree, and the result is a jagged
  staircase a builder did not intend.
- **(b) Axis-aligned only.** Simple, but rejects legitimate diagonal beams/edges
  the example-style builds want (a roof ridge, a diagonal strut).
- **(c) Axis-aligned + *uniform* diagonals.** Define `d = hi - lo` componentwise
  on the directed delta `to - from`; let `n = max(|dx|,|dy|,|dz|)`. The line is
  **well-formed** iff every nonzero `|component|` equals `n` (each axis steps by
  0 or ±1 per increment — a unit step vector). Then voxel `i ∈ [0..n]` is
  `from + i·step`, `step ∈ {-1,0,1}³`. This exactly captures every line that is
  unambiguous on the lattice: axis-aligned (one nonzero), 2-D diagonals, 3-D
  diagonals — `n+1` voxels, no convention needed.

**Chosen: (c).** Non-uniform lines (e.g. `dx=4, dz=2`) are **rejected** with a
located, actionable error (`op "line" from … to … is not a straight lattice
line: axis deltas must be 0 or ±n (got dx,dy,dz)`). Rejecting beats silently
rasterizing in a measurement instrument — honest failure over arbitrary output.
The schema can't express this (it's a cross-field constraint), so it is the one
expansion-specific guard expansion owns (research D-validation). General
rasterization is recorded in `review.md` as a future extension if a need arises.

## D6 — `box` (hollow shell) via a boundary predicate

For the normalized range `[lo..hi]`, a coordinate is on the shell iff it touches
any face: `x==lo.x || x==hi.x || y==lo.y || y==hi.y || z==lo.z || z==hi.z`.
Iterate the full bounding box, keep boundary cells. This is correct and
*degenerate-safe* for free: a flat box (`lo.y==hi.y`) makes every cell a boundary
cell → a solid plane (the right answer); a 1×1×N box → a line; a 1×1×1 box → a
single voxel. Rejected: special-casing the six faces and de-duplicating edges/
corners (more code, identical result, and the predicate already dedups).

## D7 — `fill` (solid cuboid)

Every coordinate in `[lo..hi]` inclusive. Trivial triple loop. Volume
`(dx+1)(dy+1)(dz+1)`.

## D8 — Normalization, overlap, and the determinism/order reconciliation (AC-3)

The apparent tension ("deterministic **and** order-independent" vs
"last-writer-wins over **array order**") resolves cleanly:

- **Last-writer-wins is by placement array index** — this is the artifact's
  *defined semantics* (schema description), not an incidental order we may
  permute. Accumulate into a `Map<voxelKey, Voxel>`, iterating placements in
  array order and, within a placement, in generation order; a later write to the
  same key replaces the earlier entry (block **and** state — see D9).
- **Order-independence is about internal evaluation order, not the placements
  array.** The *output* must be a deterministic function of the artifact,
  independent of `Map` insertion/hash order. Achieved by emitting voxels in a
  **canonical sort**: ascending `y`, then `z`, then `x` (ground-up, row by row —
  friendly for the voxel-world consumer and for diffing renders). Two runs of the
  same artifact are therefore byte-identical, and two artifacts whose
  *non-overlapping* placements are listed in different orders produce the
  identical voxel set. Both halves of AC-3 hold, and the rule is documented.

This is the documented overlap rule AC-3 asks for; it is stated in `src/README.md`
and in the `expandArtifact` JSDoc.

## D9 — State semantics on overlap: full replace

When a later placement overwrites a coordinate, the winning `Voxel` is taken
**whole** — its `block` and its `state` (or absence of state) replace the
earlier voxel entirely. No state merge. Rationale: "last-writer-wins" is a
placement-level rule; merging two placements' states would invent a block the
model never expressed and could produce an illegal state map. Documented.

## D10 — Validation responsibility

Expansion assumes a **schema-valid artifact** (integral coords, namespaced
blocks, well-formed shapes) — validation is T-001-01's runner / T-001-03's job,
upstream of this module (research). Expansion adds exactly one guard the schema
cannot express: the D5 `line` well-formedness check, which throws a located
`Error`. It does not re-run JSON-Schema validation (that would duplicate the
contract and couple this module to ajv needlessly).

## D11 — Tests: `node:test` + `node:assert`, zero new deps

Both built into Node 22; no test framework added (matches minimal-deps ethos).
Tests live in `src/expand.test.mjs`, run via `node --test src/`, wired into
`npm test` after the existing schema gate. Coverage plan is in `plan.md`.
Rejected: vitest/jest (new dep, build, contradicts the single-toolchain ethos).
