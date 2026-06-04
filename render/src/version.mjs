// Single source of the Minecraft version pin for the whole render harness.
//
// The ticket states pinning here "fixes the canonical block-ID vocabulary used by
// the schema (T-001-01) and palette (T-001-04)". `palettes/industrial.json` already
// pins 1.20.1, so this MUST stay equal to that, or the two halves of the instrument
// would disagree on what a block ID means. Bumping the version is a single edit here.
//
// IT MUST ALSO be a version prismarine-viewer supports (see its `supportedVersions`).
// setVersion() silently resolves an unsupported pin to the nearest supported one
// (e.g. 1.20.4 → 1.20.1) while the world is written with the *pinned* version's
// global state-ids — so a mismatch renders every block as the wrong block. render.mjs
// hard-guards against that downgrade.

import mcDataLoader from 'minecraft-data'
import minecraftAssets from 'minecraft-assets'

export const MINECRAFT_VERSION = '1.20.1'

let _mcData
/** Memoised `minecraft-data` handle for the pinned version. Throws if unknown. */
export function mcData () {
  if (!_mcData) {
    _mcData = mcDataLoader(MINECRAFT_VERSION)
    if (!_mcData || !_mcData.blocksByName) {
      throw new Error(`minecraft-data has no block data for version ${MINECRAFT_VERSION}`)
    }
  }
  return _mcData
}

let _assets
/** Memoised `minecraft-assets` handle (texture directory/atlas) for the pin. */
export function assetsFor () {
  if (!_assets) {
    _assets = minecraftAssets(MINECRAFT_VERSION)
    if (!_assets || !_assets.directory) {
      throw new Error(`minecraft-assets has no assets for version ${MINECRAFT_VERSION}`)
    }
  }
  return _assets
}

/**
 * Resolve a bare or `minecraft:`-prefixed block name (+ optional state) to the
 * numeric block-state id that `prismarine-world` stores. The one place name→id
 * lives, so `world.mjs` stays thin.
 *
 * State/orientation (T-003-02): `state` is a partial map of string-valued
 * properties (`{ facing: "east", half: "top" }`). Omitted properties take the
 * block's DEFAULT value (not index 0), so a partial state still yields a legal,
 * least-surprising id. The id is the big-endian mixed-radix composition over
 * `minecraft-data`'s ordered `states[]` — computed directly from the declared
 * `minecraft-data` dependency rather than the permissive (and only transitive)
 * `prismarine-block`, so anything unmappable becomes an explicit located throw
 * rather than a silently wrong state. `world.mjs` catches these throws to build
 * its unknown/unmappable report.
 *
 * @param {string} name bare or `minecraft:`-prefixed
 * @param {Record<string,string|boolean|number>} [state] partial property map
 * @returns {number}
 * @throws if the block is unknown, the block takes no state, a property name is
 *   unknown, or a value is illegal for its property.
 */
export function blockStateId (name, state) {
  const data = mcData()
  const bare = name.replace(/^minecraft:/, '')
  const block = data.blocksByName[bare]
  if (!block) throw new Error(`unknown block "${name}" for ${MINECRAFT_VERSION}`)

  const base = block.defaultState ?? block.minStateId ?? block.id
  if (!state || Object.keys(state).length === 0) return base // stateless fast path

  const states = block.states ?? []
  if (states.length === 0) {
    throw new Error(`block "${bare}" takes no state properties (got ${JSON.stringify(state)})`)
  }

  // Start from the block's default, then override only the supplied properties.
  const indices = decodeDefaultIndices(block, states, base)
  for (const [key, value] of Object.entries(state)) {
    const i = states.findIndex((s) => s.name === key)
    if (i < 0) throw new Error(`block "${bare}" has no state property "${key}"`)
    indices[i] = valueIndex(states[i], value, bare)
  }
  return composeStateId(block, states, indices)
}

/**
 * Decode `defaultState` into per-property indices (big-endian mixed radix: the
 * LAST property varies fastest). So omitted properties keep their default value.
 * @returns {number[]} one index per entry of `states`
 */
function decodeDefaultIndices (block, states, base) {
  let rem = base - block.minStateId
  const indices = new Array(states.length)
  for (let i = states.length - 1; i >= 0; i--) {
    indices[i] = rem % states[i].num_values
    rem = Math.floor(rem / states[i].num_values)
  }
  return indices
}

/**
 * Map a property value to its index within a `minecraft-data` state descriptor.
 * enum/`values` → position; bool → true:0/false:1 (Minecraft's order, accepting
 * the schema's string form); int → the integer itself if in `[0, num_values)`.
 * @throws on any value with no legal index.
 */
function valueIndex (descriptor, value, bare) {
  const illegal = () => new Error(`illegal value ${JSON.stringify(value)} for "${bare}.${descriptor.name}"`)
  if (descriptor.values) {
    const idx = descriptor.values.indexOf(String(value))
    if (idx < 0) throw illegal()
    return idx
  }
  if (descriptor.type === 'bool') {
    if (value === true || value === 'true') return 0
    if (value === false || value === 'false') return 1
    throw illegal()
  }
  if (descriptor.type === 'int') {
    const n = Number(value)
    if (Number.isInteger(n) && n >= 0 && n < descriptor.num_values) return n
    throw illegal()
  }
  throw illegal()
}

/**
 * Recompose indices into a state id (`minStateId + Σ idx_i·Π_{j>i} num_values_j`)
 * and assert it lands in the block's `[minStateId, maxStateId]` range.
 */
function composeStateId (block, states, indices) {
  let data = 0
  for (let i = 0; i < states.length; i++) data = data * states[i].num_values + indices[i]
  const id = block.minStateId + data
  if (id < block.minStateId || id > block.maxStateId) {
    throw new Error(`computed state id ${id} out of range [${block.minStateId}, ${block.maxStateId}] for "${block.name}"`)
  }
  return id
}
