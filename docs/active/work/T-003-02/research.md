# T-003-02 — Research: voxel-world-construction

Epic E-02, spec §3. Build an in-memory `prismarine-world` from a normalized
(primitive-expanded) artifact, writing each voxel's block type **and** block
state/orientation directly into the world. No bot, no placement actions, no
Minecraft server. This is the cross-section seam where the render harness
(`render/`) reads the artifact contract produced by `src/` (S-001).

Descriptive only — what exists and how it connects. No solutions here.

## Where the pieces live

Two packages, deliberately separate (each with its own `node_modules`):

- **`src/`** (top-level package `mc-design-eval`, pure ESM, no GPU deps) — the
  artifact contract: schema, validation, primitive expansion, SDK binding.
- **`render/`** (package `mc-design-eval-render`) — the headless render harness:
  version pin, in-memory world, headless WebGL → PNG.

The two meet at exactly one place this ticket cares about: `render/` must read
the *expanded voxel set* that `src/expand.mjs` produces. The top-level
`package.json` has **no `exports` field**, so a deep relative import
(`../../src/expand.mjs`) from `render/src/` resolves cleanly — verified by
running `expandArtifact` on the canonical example from inside `render/`.

## The upstream seam — `src/expand.mjs` (T-001-02)

`expandArtifact(artifact) → Voxel[]` is the named entry. A `Voxel` is
`{ pos: [x,y,z], block: string, state?: Record<string,string> }`, where `state`
is **present only when the source placement carried it** (a stateless voxel has
no `state` key). Key guarantees this ticket can lean on:

- **Deterministic**: same artifact ⇒ byte-identical voxel array.
- **Canonical order**: ascending `y`, then `z`, then `x`. Iterating in this
  order makes any per-voxel report (AC #3) deterministic for free.
- **Deduplicated**: last-writer-wins, full replace — one voxel per coordinate.
- **Pure**: no I/O, no `minecraft-data`, no knowledge of palettes/rendering.
- **Contract**: input is assumed schema-valid (gated upstream by
  `artifact.mjs`). Expansion owns one extra guard (the `line` straight-lattice
  rule) and throws a located error on violation.

`block` strings are bare or `minecraft:`-prefixed (the canonical example uses
the prefixed form). `state` values are **strings** in the artifact
(`{ "facing": "north", "half": "bottom" }`), per `schema/examples/`.

## The world API — `render/src/world.mjs` (T-003-01)

Built by the scaffold ticket, and explicitly scoped to be extended here. Today:

- `createEmptyWorld() → World` — an empty (all-air) `prismarine-world` for the
  pinned version, backed by an `emptyColumnGenerator` that lazily yields an
  all-air `prismarine-chunk` column for any requested chunk (so
  `setBlockStateId` always has a loaded column to write into).
- `setBlock(world, pos, name, props) → Promise<void>` — resolves a name (+props)
  to a state id via `version.mjs` and writes it with `world.setBlockStateId`.
  Accepts `[x,y,z]` or `{x,y,z}`.
- `buildSampleWorld() → { world, center }` — the AC #4 render subject from
  T-003-01: a hard-coded 5×5 stone floor plus a few distinct blocks. **Not**
  artifact-driven; this ticket adds the artifact-driven path beside it.

The module header already states the intent: *"T-003-02 builds artifact→world
expansion on top of `createEmptyWorld` + `setBlock` without re-deciding the
pin."* So the seam is named and the pin is owned elsewhere.

## The name→id seam — `render/src/version.mjs` (T-003-01)

Single source of the version pin (`MINECRAFT_VERSION = '1.20.4'`, equal to
`palettes/industrial.json`). Memoised `mcData()` and `assetsFor()` handles.

The relevant function:

```js
export function blockStateId (name, props) {
  const block = mcData().blocksByName[name.replace(/^minecraft:/, '')]
  if (!block) throw new Error(`unknown block "${name}" ...`)
  if (props && Object.keys(props).length) {
    throw new Error(`block-state props not supported in the render scaffold (T-003-02 owns this): ...`)
  }
  return block.defaultState ?? block.minStateId ?? block.id
}
```

So **stateless** resolution is done and returns the block's `defaultState`. The
**stateful** path is deliberately a fail-fast stub with a comment handing
ownership to this ticket. This is the single edit point for state/orientation.

## How `minecraft-data` 1.20.4 models block state

Each block carries `{ id, minStateId, maxStateId, defaultState, states[] }`.
`states[]` is an ordered list of property descriptors:

```
oak_stairs: min=2874 max=2953 default=2885
  states: [ {name:"facing", type:"enum", num_values:4, values:[north,south,west,east]},
            {name:"half",   type:"enum", num_values:2, values:[top,bottom]},
            {name:"shape",  type:"enum", num_values:5, values:[straight,inner_left,...]},
            {name:"waterlogged", type:"bool", num_values:2} ]
stone_slab: states:[ {type:"top|bottom|double"}, {waterlogged bool} ]
oak_log:    states:[ {name:"axis", enum, [x,y,z]} ]
glowstone:  states: []   (no properties)
```

The state id is a **big-endian mixed-radix** number over `states[]`: the last
property varies fastest. `data = Σ idx_i · Π_{j>i} num_values_j`, then
`stateId = minStateId + data`. `defaultState` is *not* generally `minStateId`
(oak_stairs default = min+11), so omitted properties must default to the value
encoded in `defaultState`, **not** to index 0.

Boolean ordering: Minecraft orders `true` before `false`
(`true→0, false→1`) — confirmed by both `prismarine-block` and a 48-combo
cross-check.

## Reference implementation already in the tree

`render/node_modules/prismarine-block` (v1.23.0, transitive via
`prismarine-chunk`/`-world`) has `Block.fromProperties(typeId, props) → Block`
with a `.stateId`. Its algorithm (`getStateValue`) is the canonical mixed-radix
sum. **But it is permissive in ways a measurement instrument must not be:**

- Unknown property **name** → silently ignored (offset 0), yields `minStateId`.
- Unknown enum **value** → `indexOf` returns `-1`, yields a stateId *below*
  `minStateId` (corrupt, out of range).
- Omitted properties → treated as index 0, i.e. `minStateId`, **not**
  `defaultState`.

It is also not a declared dependency of `render/` (only transitive), so relying
on it directly is fragile across installs.

## Acceptance-criteria mapping (what "done" touches)

- **AC #1** (every voxel at correct coord + type): iterate `expandArtifact`
  output, `setBlock` each → assert read-back name/coord.
- **AC #2** (state/orientation where applicable): the `version.mjs` stateful
  path — stairs/slabs/logs/directional blocks.
- **AC #3** (deterministic + report unknown/unmappable): canonical iteration
  order + a structured report of voxels that fail to resolve.
- **AC #4** (known small artifact → expected structure): a tiny fixture with a
  **non-default** stair so the test fails if orientation were ignored.

## Constraints / assumptions surfaced

- `state` values arrive as **strings** (schema + examples); bool comparison must
  accept `"true"`/`"false"`.
- The render mesher does not draw sections below `y=0` (noted in T-003-01); that
  is a *render* concern (T-003-03), not a *construction* concern — construction
  must still write sub-zero voxels correctly.
- Block-name *legality vs. palette* is E-04's job, not this ticket; here an
  unknown block is a runtime "unmappable" to report, not a schema error.
- Validation of the artifact shape is `artifact.mjs`'s job; the expand contract
  assumes schema-valid input, and so does world construction.
