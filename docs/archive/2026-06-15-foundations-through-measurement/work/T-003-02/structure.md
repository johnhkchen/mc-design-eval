# T-003-02 — Structure: voxel-world-construction

The blueprint: file-level changes, public interfaces, internal organization, and
the ordering of changes. No code — the shape of the code. Grounded in
`design.md`.

## Change set at a glance

| File | Action | Why |
|------|--------|-----|
| `render/src/version.mjs` | **modify** | Replace the stateful fail-fast stub in `blockStateId` with real state→id resolution (Decision A3). |
| `render/src/world.mjs` | **modify** | Add `buildWorldFromVoxels` + `buildWorldFromArtifact` beside `buildSampleWorld` (Decision B). |
| `render/test/world-build.test.mjs` | **create** | Unit suite for AC #1–#4 (no GPU). |
| `render/README.md` | **modify** | Document the artifact→world path + state resolution. |

No deletions. No changes to `render.mjs`, `cli.mjs`, `headless-canvas.mjs`,
`schema/`, or `src/expand.mjs`. `buildSampleWorld` and the existing
`render/test/scaffold.test.mjs` stay green unchanged (regression guard).

## `render/src/version.mjs` — `blockStateId(name, state)`

Signature unchanged (`props` → read as `state`; both names denote the same map).
Behaviour split into helpers, all module-private except the existing export:

```
export function blockStateId(name, state) → number     // throws on any unmappable input
  // stateless path unchanged: returns defaultState ?? minStateId ?? id

// new module-private helpers:
function decodeDefaultIndices(block) → number[]         // big-endian mixed-radix decode of defaultState
function valueIndex(state, value) → number              // enum/bool/int → index, or throws (located)
function composeStateId(block, indices) → number        // recompose + assert in [min,max]
```

Contract of `blockStateId`:
- `name`: bare or `minecraft:`-prefixed.
- `state`: `undefined`/`{}` → stateless fast path (unchanged).
- Throws **located** errors, message names the block and the offending
  field/value, for: unknown block; props on a stateless block; unknown property
  name; illegal property value; (defensive) computed id out of `[min,max]`.
- Returns the numeric state id `prismarine-world` stores.

These throws are the detection surface `world.mjs` catches. `setBlock` already
calls `blockStateId(name, props)`; once the stub is replaced it transparently
gains state support — **no `setBlock` signature change**.

Internal ordering inside the function: strip prefix → lookup block → stateless
short-circuit → empty-`states` guard → decode defaults → apply overrides →
compose → range assert → return.

## `render/src/world.mjs` — construction API

New import at top:

```js
import { expandArtifact } from '../../src/expand.mjs'   // the cross-package seam (S-001 → E-02)
```

New exports (additive; `createEmptyWorld`, `setBlock`, `buildSampleWorld`
untouched):

```js
/**
 * Build a world from an already-expanded voxel set.
 * @param {Voxel[]} voxels  canonical-order voxels ({pos,block,state?})
 * @param {{strict?: boolean}} [opts]  strict → throw (aggregated) if any voxel is unmapped
 * @returns {Promise<BuildResult>}
 */
export async function buildWorldFromVoxels(voxels, opts = {}) → BuildResult

/**
 * Build a world directly from a (schema-valid) design artifact: expand → build.
 * The single place render/ reads the artifact contract.
 * @param {{placements:Placement[]}} artifact
 * @param {{strict?: boolean}} [opts]
 * @returns {Promise<BuildResult>}
 */
export async function buildWorldFromArtifact(artifact, opts = {}) → BuildResult
```

`BuildResult` (documented via JSDoc `@typedef`):

```
{ world:   World,                 // populated prismarine-world
  center:  Vec3,                  // rounded bbox centre of placed voxels (origin if none)
  bounds:  {min:[x,y,z], max:[x,y,z]} | null,
  placed:  number,                // voxels written
  unmapped:[{pos:[x,y,z], block:string, state?:object, reason:string}] }
```

Internal flow of `buildWorldFromVoxels`:
1. `world = createEmptyWorld()`.
2. For each voxel **in input (canonical) order**: `try { await setBlock(world,
   pos, block, state) ; placed++ ; extend bounds }` `catch (e) { unmapped.push({
   pos, block, state, reason: e.message }) }`.
3. Compute `center` from `bounds` (rounded midpoint; `Vec3(0,0,0)` when nothing
   placed).
4. If `opts.strict && unmapped.length`: throw an `Error` whose message
   enumerates every unmapped voxel (`<n> unmappable voxel(s): ...`).
5. Return `BuildResult`.

`buildWorldFromArtifact` = `buildWorldFromVoxels(expandArtifact(artifact), opts)`.

A small private `boundsExtend(bounds, pos)` / `centerOf(bounds)` keep step 2/3
readable; no new module.

## `render/test/world-build.test.mjs` — new suite

Uses `node:test` + `node:assert/strict`, mirroring `scaffold.test.mjs`. No GPU.
Imports `blockStateId` from `../src/version.mjs`, the new builders from
`../src/world.mjs`, and `expandArtifact` from `../../src/expand.mjs`. Cases map
1:1 to ACs (detailed in `plan.md`):

- **state resolution** (AC #2): `blockStateId('oak_stairs', {facing,half,...})`
  for non-default orientations equals the known mixed-radix ids; partial state
  uses defaults; stateless unchanged.
- **state errors**: unknown prop name, illegal value, props-on-stateless,
  unknown block each throw with a located message.
- **voxel placement** (AC #1): build a known artifact; every voxel reads back at
  the right coord with the right block name **and** orientation (read back via
  `world.getBlock().getProperties()` / stateId).
- **unmapped report** (AC #3): an artifact with a bad block yields a deterministic
  `unmapped` entry and a partial world; `strict:true` throws listing it.
- **determinism** (AC #3): build twice → identical `placed`/`bounds`/`unmapped`
  and identical read-back stateIds across the bbox.
- **known small artifact** (AC #4): a tiny inline fixture with a **non-default**
  stair (e.g. `facing:east, half:top`) — the test fails if orientation were
  dropped — asserting the exact expected structure.

## `render/README.md` — doc delta

Add an "Artifact → world construction (T-003-02)" subsection under the existing
module map: the two new entry points, the `BuildResult` shape, the
state-resolution rule (mixed-radix over `minecraft-data` states, true-before-
false bools, omitted = default), the unmapped/`strict` policy, and the
cross-package `../../src/expand.mjs` seam note.

## Ordering of changes (atomic commits)

1. `version.mjs` state resolution + its unit cases (self-contained; no world).
2. `world.mjs` builders + placement/report/determinism cases (depends on 1).
3. AC #4 known-small-artifact case (depends on 2) — kept its own commit so the
   "expected structure" oracle is reviewable in isolation.
4. `README.md` doc update.

Each step leaves `npm test` (top-level) and `render/` `npm test` green.

## Interface boundaries preserved

- **Pin** stays owned solely by `version.mjs` (no version literal added
  elsewhere).
- **Expansion** stays owned solely by `src/expand.mjs` (imported, never
  reimplemented in `render/`).
- **World creation / single-block write** stays `createEmptyWorld` / `setBlock`;
  the builders compose them, they do not bypass them.
