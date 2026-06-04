// The in-memory voxel world (Design decision 5; AC #2 + the AC #4 sample subject).
//
// Artifact-agnostic on purpose: owns world creation and block writes, and knows
// NOTHING about placement ops or artifact shape. T-003-02 builds artifact→world
// expansion on top of `createEmptyWorld` + `setBlock` without re-deciding the pin.

import pworldLoader from 'prismarine-world'
import pchunkLoader from 'prismarine-chunk'
import { Vec3 } from 'vec3'
import { MINECRAFT_VERSION, mcData, blockStateId } from './version.mjs'

const World = pworldLoader(MINECRAFT_VERSION)
const Chunk = pchunkLoader(MINECRAFT_VERSION)

// A generator that yields an empty (all-air) column for any requested chunk. This is
// what makes the world "empty but writable": `prismarine-world.setBlockStateId`
// requires a loaded chunk at the target column, and the generator supplies one lazily.
function emptyColumnGenerator () {
  const data = mcData()
  const minY = data.minY ?? -64
  const worldHeight = data.height ?? 384
  return () => new Chunk({ minY, worldHeight })
}

/**
 * Create an empty in-memory `prismarine-world` for the pinned version (AC #2).
 * @returns {object} a prismarine-world World instance
 */
export function createEmptyWorld () {
  return new World(emptyColumnGenerator())
}

/**
 * Write a single block by name at a coordinate.
 * @param {object} world
 * @param {[number,number,number]|{x:number,y:number,z:number}} pos
 * @param {string} name bare or `minecraft:`-prefixed block name
 * @param {object} [props] reserved; not supported in the scaffold (see version.mjs)
 */
export async function setBlock (world, pos, name, props) {
  const v = Array.isArray(pos) ? new Vec3(pos[0], pos[1], pos[2]) : new Vec3(pos.x, pos.y, pos.z)
  await world.setBlockStateId(v, blockStateId(name, props))
}

/**
 * Build the AC #4 sample: a small stone floor with a few visually distinct blocks on
 * top, at a known center. Deliberately simple so the render is "correct" by eye and
 * stable across runs.
 * @returns {Promise<{world: object, center: Vec3}>}
 */
export async function buildSampleWorld () {
  const world = createEmptyWorld()
  // Keep the whole sample at y >= 0: prismarine-viewer's mesher does not render
  // sections below y = 0 for this version, so a sub-zero floor would be invisible.
  const center = new Vec3(0, 1, 0)

  // 5×5 stone floor at y = 0, centered on the origin.
  for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
      await setBlock(world, [x, 0, z], 'stone')
    }
  }

  // A few distinct blocks on top of the floor so the image is unambiguously the sample.
  await setBlock(world, [0, 1, 0], 'glowstone')
  await setBlock(world, [2, 1, 2], 'oak_planks')
  await setBlock(world, [-2, 1, -2], 'redstone_block')
  await setBlock(world, [0, 1, 2], 'gold_block')

  return { world, center }
}
