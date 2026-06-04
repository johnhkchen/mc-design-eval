// The in-memory voxel world (Design decision 5; AC #2 + the AC #4 sample subject).
//
// Artifact-agnostic on purpose: owns world creation and block writes, and knows
// NOTHING about placement ops or artifact shape. T-003-02 builds artifact→world
// expansion on top of `createEmptyWorld` + `setBlock` without re-deciding the pin.

import pworldLoader from 'prismarine-world'
import pchunkLoader from 'prismarine-chunk'
import { Vec3 } from 'vec3'
import { MINECRAFT_VERSION, mcData, blockStateId } from './version.mjs'
// The cross-package seam (S-001 → E-02): render/ reads the artifact contract by
// consuming the SAME expansion `src/` produces — never reimplementing it. The
// top-level package has no `exports` field, so this deep relative import resolves.
import { expandArtifact } from '../../src/expand.mjs'

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
 * @typedef {[number,number,number]} Coordinate
 * @typedef {{ pos: Coordinate, block: string, state?: Record<string,string> }} Voxel
 * @typedef {{ min: Coordinate, max: Coordinate }} Bounds
 * @typedef {{ pos: Coordinate, block: string, state?: object, reason: string }} Unmapped
 * @typedef {{
 *   world: object, center: Vec3, bounds: Bounds|null, placed: number, unmapped: Unmapped[]
 * }} BuildResult
 */

/** Grow `bounds` to include `pos` (mutates and returns `bounds`). */
function boundsExtend (bounds, pos) {
  if (!bounds) return { min: [...pos], max: [...pos] }
  for (let a = 0; a < 3; a++) {
    if (pos[a] < bounds.min[a]) bounds.min[a] = pos[a]
    if (pos[a] > bounds.max[a]) bounds.max[a] = pos[a]
  }
  return bounds
}

/** Rounded midpoint of `bounds` as a Vec3 (origin when nothing was placed). */
function centerOf (bounds) {
  if (!bounds) return new Vec3(0, 0, 0)
  return new Vec3(
    Math.round((bounds.min[0] + bounds.max[0]) / 2),
    Math.round((bounds.min[1] + bounds.max[1]) / 2),
    Math.round((bounds.min[2] + bounds.max[2]) / 2)
  )
}

/**
 * Build an in-memory world from an already-expanded voxel set (T-003-02).
 *
 * Writes each voxel's block type AND state/orientation directly into the world —
 * no bot, no placement actions. Construction is TOTAL: a voxel that cannot be
 * mapped (unknown block, illegal state) is skipped and recorded in `unmapped`
 * rather than crashing the build, so a single pass yields the COMPLETE report
 * (AC #3). Iteration follows the input's canonical (y,z,x) order, so the world
 * and the `unmapped` array are deterministic functions of the input.
 *
 * @param {Voxel[]} voxels canonical-order voxels from `expandArtifact`
 * @param {{ strict?: boolean }} [opts] strict → throw (after the full scan) if
 *   any voxel is unmapped, with a message listing every one.
 * @returns {Promise<BuildResult>}
 */
export async function buildWorldFromVoxels (voxels, opts = {}) {
  const world = createEmptyWorld()
  /** @type {Bounds|null} */
  let bounds = null
  let placed = 0
  /** @type {Unmapped[]} */
  const unmapped = []

  for (const voxel of voxels) {
    try {
      await setBlock(world, voxel.pos, voxel.block, voxel.state)
      placed++
      bounds = boundsExtend(bounds, voxel.pos)
    } catch (err) {
      unmapped.push({ pos: voxel.pos, block: voxel.block, state: voxel.state, reason: err.message })
    }
  }

  if (opts.strict && unmapped.length) {
    const lines = unmapped.map((u) => `  [${u.pos}] ${u.block}: ${u.reason}`).join('\n')
    throw new Error(`${unmapped.length} unmappable voxel(s):\n${lines}`)
  }

  return { world, center: centerOf(bounds), bounds, placed, unmapped }
}

/**
 * Build an in-memory world directly from a (schema-valid) design artifact: this
 * is the one place `render/` reads the artifact contract. Expands the artifact's
 * placement primitives via `src/expand.mjs`, then delegates to
 * `buildWorldFromVoxels`. Schema validity is assumed (gated upstream by
 * `src/artifact.mjs`), consistent with the expansion contract.
 *
 * @param {{ placements: object[] }} artifact
 * @param {{ strict?: boolean }} [opts]
 * @returns {Promise<BuildResult>}
 */
export async function buildWorldFromArtifact (artifact, opts = {}) {
  return buildWorldFromVoxels(expandArtifact(artifact), opts)
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
