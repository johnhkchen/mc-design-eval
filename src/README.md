# Placement-primitive expansion

`expand.mjs` turns a design artifact's `placements` (the compact authoring
vocabulary — `voxel` / `line` / `box` / `fill`) into a **normalized,
deduplicated set of explicit voxels** (spec §5, ticket T-001-02). Primitives
keep large builds inside an LLM's token budget; downstream consumers want
voxels. This module is the bridge: artifact in, voxel array out.

Its consumers read explicit voxels, never primitives — the voxel-world
construction (T-003-02), the schematic exporter (T-002-02), and the E-04
buildability/palette validators. So expansion must be **deterministic** (same
artifact ⇒ byte-identical output) and **order-independent** for non-overlapping
placements, with a single documented rule for resolving overlaps.

The normative semantics are the code + its unit suite (`expand.test.mjs`). This
README is the human on-ramp; when the two disagree, the tests win.

## Contract boundary

Input is assumed **schema-valid** (validated upstream by T-001-01 / T-001-03).
This module does no I/O, reads no `minecraft-data`, and knows nothing about
palettes or rendering — it is pure integer lattice geometry. It owns exactly one
guard the JSON Schema cannot express: the `line` straight-lattice rule (below).

## Public API

```js
import { expandArtifact, expandPlacement, voxelKey } from "./expand.mjs";
```

- **`expandArtifact(artifact) → Voxel[]`** — the primary seam (named by
  T-003-02). Expands every placement, deduplicates, returns voxels in canonical
  order.
- **`expandPlacement(placement) → Voxel[]`** — one placement's voxels, in
  canonical order, no cross-placement dedup. Exposed for tests and reuse.
- **`voxelKey(pos) → "x,y,z"`** — the canonical identity/dedup key. Exposed so
  downstream uses the same key.

A `Voxel` is `{ pos: [x, y, z], block: string, state?: Record<string,string> }`.
`state` is **present only when the source placement carried it** — a stateless
voxel has no `state` key (not `state: undefined`).

## Op geometries

Coordinates are integer lattice cells. `from`/`to` are **corner-order
independent**: each axis is normalized to `[min, max]` first (`bounds`), so
`from`/`to` and `to`/`from` produce the same set.

| Op      | Inputs       | Voxel set |
|---------|--------------|-----------|
| `voxel` | `pos`        | the single cell at `pos`. |
| `fill`  | `from`,`to`  | every cell of the solid cuboid — `(dx+1)(dy+1)(dz+1)` cells. |
| `box`   | `from`,`to`  | the **hollow shell**: cells of the cuboid where any axis is on a face (`x∈{lo,hi}` ∨ `y∈{lo,hi}` ∨ `z∈{lo,hi}`). Interior cells are omitted. |
| `line`  | `from`,`to`  | a straight lattice line, inclusive of both ends — `n+1` cells (see below). |

Degenerate cases fall out naturally: a flat `box` (one axis equal) is a solid
plane (every cell is on that face); a `1×1×1` `box` or `fill` is a single voxel.

### The `line` straight-lattice rule

Let `d = to − from` and `n = max(|dx|, |dy|, |dz|)`. A line is **well-formed**
only if every nonzero axis delta equals `±n` — i.e. axis-aligned, or a uniform
2-D / 3-D diagonal (each step is a unit vector in `{−1,0,+1}³`). Such a line
expands to the `n+1` cells `from + i·sign(d)` for `i ∈ [0..n]`.

A line whose axis deltas are unequal and nonzero (e.g. `dx=4, dz=2`) has **no
unambiguous lattice voxelization** — there is no single integer step vector that
hits both endpoints. Rather than pick an arbitrary rasterization (Bresenham has
several reasonable variants), expansion **throws a located Error**. In a
*measurement* instrument, an honest, named failure beats a silently-guessed
shape. Authors who want a slanted run use a sequence of axis-aligned/uniform
segments. (Generalized rasterization is a possible future extension — see
`docs/active/work/T-001-02/review.md`.)

An unknown `op` likewise throws (`unknown placement op "<op>"`) — defensive
depth behind the schema, which should already have rejected it.

## Overlap rule — last-writer-wins, full replace

Placements are applied in **artifact array order** (the artifact defines array
order as application order — see `schema/README.md`). When two placements write
the same coordinate, the **later placement wins**: its `block` *and* `state`
replace the earlier voxel **whole**. There is no state merge — if the later
placement is stateless, the shared cell ends up stateless, stripping any earlier
`state`.

This is the one rule needed to make a *set* (the dedup target) out of an
*ordered list* of placements, and it is the rule the acceptance criteria name.

## Determinism & order-independence

- **Determinism:** `expandArtifact` is a pure function of the artifact. The same
  artifact always expands to a byte-identical voxel array — emission order is
  fixed by the canonical sort, not by `Map` insertion order.
- **Canonical output order:** ascending `y` (ground up), then `z`, then `x`.
  Downstream may rely on this stable, diffable order.
- **Order-independence:** reordering **non-overlapping** placements yields an
  identical voxel array (the canonical sort erases authoring order). Reordering
  *overlapping* placements does change the result — that is the overlap rule
  doing its job, not a violation of determinism.

Both properties are **machine-checked** in `expand.test.mjs` (expand-twice
deep-equal; reorder ⇒ identical), so they are guarantees, not just prose.

## Test & verify

```bash
npm run test:unit   # the expansion unit suite (node:test)
npm test            # schema gate + the unit suite
```
