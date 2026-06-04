// Single source of the Minecraft version pin for the whole render harness.
//
// The ticket states pinning here "fixes the canonical block-ID vocabulary used by
// the schema (T-001-01) and palette (T-001-04)". `palettes/industrial.json` already
// pins 1.20.4, so this MUST stay equal to that, or the two halves of the instrument
// would disagree on what a block ID means. Bumping the version is a single edit here.

import mcDataLoader from 'minecraft-data'
import minecraftAssets from 'minecraft-assets'

export const MINECRAFT_VERSION = '1.20.4'

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
 * Resolve a bare or `minecraft:`-prefixed block name to the numeric block-state id
 * that `prismarine-world` stores. The one place name→id lives, so `world.mjs` stays
 * thin. Block-state *properties* (e.g. facing, half) are out of scope for the
 * scaffold — T-003-02 owns placement/state semantics; passing `props` fails fast
 * rather than silently returning the wrong state.
 *
 * @param {string} name
 * @param {object} [props]
 * @returns {number}
 */
export function blockStateId (name, props) {
  const data = mcData()
  const bare = name.replace(/^minecraft:/, '')
  const block = data.blocksByName[bare]
  if (!block) throw new Error(`unknown block "${name}" for ${MINECRAFT_VERSION}`)
  if (props && Object.keys(props).length) {
    throw new Error(`block-state props not supported in the render scaffold (T-003-02 owns this): ${name}`)
  }
  return block.defaultState ?? block.minStateId ?? block.id
}
