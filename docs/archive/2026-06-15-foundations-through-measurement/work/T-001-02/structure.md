# T-001-02 — Structure: placement-primitive expansion

The blueprint: files created/modified, their boundaries, public interfaces, and
the order they land. Not code — the shape of the code. Grounded in `design.md`.

## Files created / modified

```
src/                                  # NEW — first library-source dir in the repo
  expand.mjs                          # the expansion module (public API)         [NEW]
  expand.test.mjs                     # node:test unit suite (AC-4)               [NEW]
  README.md                           # documents the expansion + overlap rule    [NEW]
package.json                          # add test:unit; fold it into `test`        [MODIFIED]
```

Nothing deleted. Footprint is confined to a **new `src/` dir** plus a **single
line-range edit** to root `package.json`'s `scripts`. This is deliberately
disjoint from T-001-03's SDK-binding module (concurrency boundary, per the
workflow): the only shared file is `package.json`, and the edit is additive (a
new script key + appending to `test`), so the file lock is the only coordination
needed. No `schema/`, `palettes/`, or `scripts/` files are touched.

## `src/expand.mjs` — the expansion module (sole authority)

Pure ESM, no imports beyond `node:`-nothing (it needs no runtime deps — pure
integer geometry). Internal organization, top to bottom:

### Types (JSDoc `@typedef`, D1)

```js
/** @typedef {[number, number, number]} Coordinate */
/** @typedef {{ pos: Coordinate, block: string, state?: Record<string,string> }} Voxel */
/** @typedef {import("...").Placement} Placement   // structural: { op, ... } */
```

`Placement` is described loosely (the four op shapes) since the JSON Schema is
the normative definition; JSDoc mirrors it for editor types only.

### Internal helpers (not exported)

- `bounds(from, to) → { lo: Coordinate, hi: Coordinate }` — per-axis min/max
  (D4). Used by `box`/`fill`/`line` direction handling.
- `eachCell(lo, hi, fn)` — iterate the inclusive bounding box in canonical
  (`y`, then `z`, then `x`) order, calling `fn(x,y,z)`. One iteration primitive
  shared by `box` and `fill` so ordering is defined in exactly one place.

### Public functions

```
voxelKey(pos): string
  → `${x},${y},${z}` — the dedup/identity key (D8). Exported because tests and
    potentially T-003-02 want the same canonical key.

expandPlacement(placement): Voxel[]
  → switch on placement.op:
      "voxel" → [ { pos, block, state? } ]                              (D3)
      "fill"  → every cell in bounds(from,to)                           (D7)
      "box"   → cells in bounds(from,to) on the shell predicate         (D6)
      "line"  → uniform-step line; THROWS a located Error on a
                non-uniform (non-straight-lattice) line                 (D5)
      default → THROWS `unknown placement op "<op>"` (defensive; the
                schema should have caught it upstream — D10)
  → state is copied through (shallow) onto each emitted voxel.
  → returns voxels in canonical order; within one placement keys are unique
    by construction, so no dedup needed here.

expandArtifact(artifact): Voxel[]
  → const map = new Map<string, Voxel>()
    for (const p of artifact.placements)            // ARRAY ORDER = application order
      for (const v of expandPlacement(p))
        map.set(voxelKey(v.pos), v)                 // last write wins (D8/D9, full replace)
  → return [...map.values()] sorted by (y, z, x)    // canonical, order-independent output
```

### Public interface (the stable surface T-003-02 depends on)

- `expandArtifact(artifact): Voxel[]` — the seam named by T-003-02's Context.
- `Voxel` shape: `{ pos:[x,y,z], block, state? }` — exactly the per-voxel fields
  the voxel-world writer needs (block type + optional orientation state).
- Output ordering contract: ascending `y`, then `z`, then `x` — documented so
  downstream can rely on stable, diffable output.
- `expandPlacement` / `voxelKey` — secondary surface for tests and reuse.

Boundary: this module **does not** read files, validate against JSON Schema,
touch Minecraft data, or know about palettes/rendering. Artifact in (assumed
schema-valid), voxel array out. The one non-schema guard it owns is the `line`
well-formedness check (D5/D10).

## `src/expand.test.mjs` — unit suite (AC-4)

`node:test` + `node:assert/strict`, run by `node --test src/`. Mirrors the
plan's coverage matrix. Groups:

1. **Per-primitive geometry** (AC-1) — one `describe`/`test` per op:
   - `voxel` → 1 voxel, carries `state` through.
   - `fill` → exact volume `(dx+1)(dy+1)(dz+1)`; spot-check membership.
   - `box` → shell count for a known cuboid; interior cell absent, corner
     present; degenerate flat box → solid plane; 1×1×1 → single voxel.
   - `line` → axis-aligned count `n+1`; 2-D and 3-D uniform diagonals; reversed
     `from`/`to` yields the same set; **non-uniform line throws** (assert.throws
     with a message match).
2. **`from`/`to` normalization** (D4) — reversed corners on `box`/`fill` give an
   identical voxel set.
3. **Normalization / dedup / overlap** (AC-2, AC-3):
   - mixed artifact (voxels + primitives) → single deduplicated set; count is
     the size of the coordinate union.
   - overlap → later placement's `block` **and** `state` win at the shared cell
     (full replace, D9).
   - determinism → `expandArtifact(a)` twice is deep-equal (and key-order
     identical).
   - order-independence → two artifacts with the same **non-overlapping**
     placements in different array orders produce an identical voxel array.
4. **Integration** — load `schema/examples/valid-industrial-house.json`, expand
   it, assert a sane non-empty voxel set and that the `fill` floor's 49 cells
   are all present (sanity that the realistic fixture expands).

## `src/README.md` — the documented overlap rule (AC-3 "documented rule")

Short companion (the schema README points downstream here for expansion
semantics). Contents: the four op geometries as voxel sets; `from`/`to`
normalization; the `line` well-formedness rule and why non-uniform lines are
rejected; the **last-writer-wins by placement-array-order** overlap rule and the
**(y,z,x) canonical output order**; the determinism/order-independence guarantee
and how the two coexist; the "assumes schema-valid input" contract boundary.

## `package.json` — script wiring (MODIFIED)

Additive only:

```jsonc
"test:unit": "node --test src/",
"test": "<existing schema commands> && npm run test:unit"
```

`node --test src/` discovers `src/*.test.mjs` on Node 22. The existing schema
self-test + sample checks remain the first half of `test`; the unit suite
appends. `npm test` green = AC-1..AC-4 demonstrated end to end. No new deps
(node:test/assert are built in).

## Ordering of changes (why this order)

1. `src/expand.mjs` — the kernel; nothing else can be tested without it. Commit.
2. `src/expand.test.mjs` + `package.json` wiring — make AC-4 runnable and green.
   Commit.
3. `src/README.md` — document the now-final semantics (the AC-3 "documented
   rule"). Commit.

Each step is independently committable; step 2 verifies steps 1–2 via `npm test`.

## Concurrency note (T-001-03)

T-001-03 (structured-output binding) is the only sibling on this branch. It
touches an SDK-binding module (a different, not-yet-created path) and, like this
ticket, may append to `package.json` scripts. The append is additive and
key-distinct (`test:unit` here vs whatever T-001-03 adds), so the file lock
serializes the two writes without semantic conflict. No source files overlap.
