// The stair-lens regression suite (E-27 T-107-01).
// Pure, GPU-free: meshing is deterministic given blocksStates, so the T-097
// "stairs-invisible" defect is testable without a single GL call. Root cause:
// prismarine-viewer 1.33.0's getModelVariants short-circuited any block whose NAME
// CONTAINS "air" — and every *_stairs name does ("st-AIR-s"). These tests pin:
// (1) the patch core (idempotent, throws on viewer drift), (2) the installed file is
// patched, (3) the mesher actually emits stair geometry while slabs and real air are
// unchanged.

import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

import { patchSource, modelsPath, BUGGY_PATTERN, FIXED_PATTERN } from '../scripts/patch-viewer-lens.mjs'
import { assertLensPatched } from '../src/lens-guard.mjs'
import { MINECRAFT_VERSION } from '../src/version.mjs'

const require = createRequire(import.meta.url)

// --- the patch core ------------------------------------------------------------

test('patchSource: rewrites the buggy substring check exactly once, idempotently', () => {
  const src = `foo\n  ${BUGGY_PATTERN}\nbar`
  const first = patchSource(src)
  assert.equal(first.changed, true)
  assert.ok(first.src.includes(FIXED_PATTERN))
  assert.ok(!first.src.includes(BUGGY_PATTERN))
  const second = patchSource(first.src)
  assert.equal(second.changed, false)
  assert.equal(second.src, first.src)
})

test('patchSource: THROWS when neither pattern is present (viewer drift is never guessed at)', () => {
  assert.throws(() => patchSource('something else entirely'), /re-verify the stair lens/)
})

// --- the installed lens --------------------------------------------------------

test('installed models.js is patched and the tripwire passes', () => {
  assert.ok(!readFileSync(modelsPath(), 'utf8').includes(BUGGY_PATTERN))
  assert.doesNotThrow(() => assertLensPatched())
})

// --- the mesher (the actual T-097 regression) -----------------------------------

function sectionVertexCount (placeStateId) {
  const { World } = require('prismarine-viewer/viewer/lib/world')
  const { getSectionGeometry } = require('prismarine-viewer/viewer/lib/models')
  const { Vec3 } = require('vec3')
  const Chunk = require('prismarine-chunk')(MINECRAFT_VERSION)
  const states = require(`prismarine-viewer/public/blocksStates/${MINECRAFT_VERSION}.json`)
  const world = new World(MINECRAFT_VERSION)
  world.addColumn(0, 0, new Chunk().toJson())
  if (placeStateId !== null) world.setBlockStateId(new Vec3(8, 8, 8), placeStateId)
  const geometry = getSectionGeometry(0, 0, 0, world, states)
  return geometry.positions.length / 3
}

const mcData = require('minecraft-data')(MINECRAFT_VERSION)

test('mesher emits stair geometry — default state and an explicit non-default state', () => {
  const stairs = mcData.blocksByName.oak_stairs
  assert.ok(sectionVertexCount(stairs.defaultState) > 0, 'default-state oak_stairs must mesh')
  // east/top/straight — the T-097 CARD_ROWS-style explicit state (id pinned in world-build.test).
  assert.ok(sectionVertexCount(2935) > 0, 'east/top oak_stairs must mesh')
})

test('mesher emits stair geometry for the roof-program families (spruce, deepslate_brick)', () => {
  for (const name of ['spruce_stairs', 'deepslate_brick_stairs']) {
    const block = mcData.blocksByName[name]
    assert.ok(block, `${name} exists in ${MINECRAFT_VERSION}`)
    assert.ok(sectionVertexCount(block.defaultState) > 0, `${name} must mesh`)
  }
})

test('no collateral: slabs still mesh, real air still meshes nothing', () => {
  assert.ok(sectionVertexCount(mcData.blocksByName.oak_slab.defaultState) > 0, 'oak_slab must mesh')
  assert.equal(sectionVertexCount(null), 0, 'an empty (air) section must stay empty')
})
