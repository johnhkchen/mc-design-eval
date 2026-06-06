# T-044-01 — Structure: file-level blueprint

The shape of the code, not the code. Files created/modified, public interfaces, internal
organization, and the order changes must land in.

## Files

| Path | Action | Purpose |
|------|--------|---------|
| `src/revise/region.mjs` | **create** | Pure region addressing + region-lock; lazy GL leaf `observeRegion`. |
| `src/revise/region.test.mjs` | **create** | Pure unit suite (no GL): sub-bounds math, membership, lock reject/permit, round-trip schema-validity, purity. |
| `render/test/observe-region.test.mjs` | **create** | One **GL-gated** live crop render on the committed koi artifact (AC #4). |

No existing files are modified. `src/revise/` is a new directory (the E-15 home). No deletions.

## `src/revise/region.mjs` — public interface

Module header (repo idiom): declares it owns region addressing + the per-region lock over a
`DesignArtifact`; PURE core imports only `../expand.mjs` (geometry) — **no GL, no schema, no SDK**;
the one live leaf `observeRegion` **lazy-imports** the render stack so the pure graph stays GL-free.

### Constants / vocabulary

```
export const REGION_SCHEMA = "region/v1"          // tag stamped on R
export const DEFAULT_FRACTION = 0.5               // slab thickness for named/where regions
export const PART_NAMES = Object.freeze([...])     // the geometric vocabulary keys (for docs/validation)
```

### Errors

```
export class RegionEditOutOfBoundsError extends Error
  // .name, .code = "region_edit_out_of_bounds", .index, .coord, .subBounds
  // thrown by applyRegionEdit when an edit voxel falls outside subBounds (the spatial LockViolation)
```

### Bounds helpers (pure)

```
export function artifactBounds(artifact) -> {min:[x,y,z], max:[x,y,z]}
  // overall integer extent over all placements (via expand corner scan); throws if no placements
export function placementBounds(placement) -> {min, max}
  // a single placement's integer bbox (voxel: pos..pos; fill/box/line: normalized from..to)
export function boundsContain(outer, inner) -> boolean        // inner ⊆ outer (inclusive)
export function coordInBounds(coord, bounds) -> boolean
export function clampBounds(inner, outer) -> {min,max}        // intersect, integer
export function subBoundsOf(R) -> {min,max}                   // accessor R.subBounds (AC name)
```

### Region resolution (pure)

```
export function resolveNamedRegion(bounds, name, fraction?) -> {min,max}
  // geometric direction -> fractional slab of `bounds`; throws on unknown name
export function resolveWhereRegion(bounds, whereStr, fraction?) -> {min,max}
  // keyword-scan -> union of matched slabs; no keyword/empty -> whole `bounds`
export function selectRegion(artifact, spec, opts?) -> R
  // spec: {bbox:{min,max}} | {part:name} | {where:str} | a raw {min,max} | a string (treated as where)
  // R = { schema, spec, subBounds, placements, indices, fraction }  (frozen)
```

`selectRegion` dispatch:
1. `spec` is a string → `resolveWhereRegion`.
2. `spec.bbox` or a raw `{min,max}` → clamp to `artifactBounds`.
3. `spec.part` → `resolveNamedRegion`.
4. `spec.where` → `resolveWhereRegion`.
Then compute in-region set: for each placement, `boundsContain(subBounds, placementBounds(p))` →
collect placement + original index. Freeze and return R.

### The lock (pure)

```
export function applyRegionEdit(artifact, R, edit, opts?) -> artifact'
  // edit: Placement[] | ((inRegion: Placement[]) => Placement[])
  // 1. resolve newInRegion = Array.isArray(edit) ? edit : edit(R.placements)
  // 2. VALIDATE: every voxel of every newInRegion placement ∈ subBounds (expandPlacement),
  //    else throw RegionEditOutOfBoundsError(index, firstStrayCoord, subBounds)
  // 3. assemble: outOfRegion (original order) ++ newInRegion
  // 4. rebuild palette.manifest = deduped union of placement blocks (sorted, like compile.mjs)
  // 5. throw if 0 placements (schema minItems:1)
  // 6. return fresh artifact (inputs never mutated)
```

`outOfRegion` = placements whose original index ∉ `R.indices`, kept in original order.

### The live leaf (GL, lazy)

```
export { /* re-exported */ GL_AVAILABLE, GL_LOAD_ERROR }   // via lazy probe or render-tool re-export
export async function observeRegion(artifact, R, opts?) -> {path, bytes, view, bounds}
  // lazy-import buildWorldFromArtifact (render/src/world.mjs) + renderWorldToPng (render/src/render.mjs)
  // build FULL world; renderWorldToPng(world, world.center, { bounds: subBoundsOf(R), view, outPath,
  //   width, height })  -> framedCamera(subBounds) does the crop
  // returns the crop's path/bytes/view + the subBounds it framed
```

Re-exporting the GL gate: to keep the pure import graph GL-free, `GL_AVAILABLE`/`GL_LOAD_ERROR`
must **not** be imported at module top-level from `render.mjs` (that would pull GL). Instead expose
an async `observeRegion` that lazy-imports; the **GL-gated test** imports `GL_AVAILABLE` directly
from `render/src/render-tool.mjs` (as the existing render tests do) rather than from this module.
So `region.mjs` does **not** re-export the gate — the test owns the skip check. (Simpler; no top-level
GL coupling.)

## `src/revise/region.test.mjs` — pure suite organization

Mirrors the repo's grouped-test idiom. Builds minimal synthetic artifacts + uses the committed koi
artifact (read from `benchmarks/.../artifact.json`) for a realistic membership/round-trip check.
**Never imports GL**; never calls `observeRegion`.

- **Group A — sub-bounds math.** `artifactBounds`, `placementBounds` (voxel/fill/line/box),
  `boundsContain`, `coordInBounds`, `clampBounds`; pin koi bounds `min[-15,0,-7] max[16,15,7]`.
- **Group B — named/where resolution.** `top/bottom/left/right/front/back/core` slabs over a known
  cube; `front`=max-major-end convention; `where:"the top of the tail"` matches `top`; empty/unknown
  `where` → whole bounds; unknown part name throws.
- **Group C — selectRegion.** bbox spec, part spec, where spec, raw `{min,max}`, bare string; R
  carries the right in-region placements + indices + subBounds; frozen.
- **Group D — the lock.** an **in-R edit permitted** (round-trips schema-valid via `assertArtifact`);
  an **out-of-R edit rejected** (`RegionEditOutOfBoundsError`, `.code`, `.index`); the **invariant**
  (voxels outside subBounds byte-identical before/after, checked via `expandArtifact`); manifest
  rebuilt to include a swapped-in block; empty-result throws; **purity** (inputs unchanged).
- **Group E — reuse boundary (static scan).** `region.mjs`'s top-level import specifiers contain no
  GL/render/prismarine module (only `./expand` allowed; render imports must be **dynamic** only) —
  the analog of `src/sculptor/reuse-boundary.test.mjs` and `src/color/reuse-boundary.test.mjs`.

## `render/test/observe-region.test.mjs` — GL-gated live proof

Mirrors `render/test/render-tool.test.mjs`:
- Import `GL_AVAILABLE, GL_LOAD_ERROR` from `../src/render-tool.mjs`; `t.skip(reason)` when absent.
- Read the committed koi artifact (`../../benchmarks/sculpture/runs/009-vConcept-a-koi-fish/artifact.json`).
- `selectRegion(koi, {part:"top"})` (or `{bbox:...}` on the head end), then `observeRegion(koi, R,
  {outPath: render/out/observe-koi-top.png})`.
- Assert: PNG signature, non-trivial bytes, the framed `view.distance/radius` reflect the **smaller**
  sub-bounds (crop is tighter than a whole-build frame — a comparison render of the whole build gives
  a larger radius), the file exists. One live render; the rest is pure.

## Ordering of changes (why this order)

1. Pure bounds helpers + resolution + `selectRegion` (no deps but `../expand.mjs`) — testable alone.
2. `applyRegionEdit` + `RegionEditOutOfBoundsError` — depends on (1) + `expandPlacement`.
3. `region.test.mjs` Groups A–E — lock everything pure behind `npm test`.
4. `observeRegion` lazy leaf — added last; cannot break the pure suite (lazy import).
5. `render/test/observe-region.test.mjs` — the live proof, GL-gated, run under `render/`'s tests.

This lets each commit be independently green: (1)+(3 partial), then (2)+(3), then (4)+(5).

## Interfaces this ticket deliberately leaves open (for S-045+)

- `applyRegionEdit`'s function-form `edit` is the seam a **procedural pass** or an **LLM editor**
  plugs into later (both are just `(inRegion) => newPlacements` behind the same lock).
- `observeRegion`'s report is what the **accept-gate** (S-045) and the **form metric** (S-043) will
  consume. No metric is computed here.
