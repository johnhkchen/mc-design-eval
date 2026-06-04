// World construction from a (primitive-expanded) design artifact — T-003-02.
// Pure, GPU-free unit suite: state/orientation resolution, voxel placement,
// the unknown/unmappable report, determinism, and a known-small-artifact oracle.
// Maps 1:1 to the ticket's acceptance criteria. Runs anywhere (no WebGL).

import test from 'node:test'
import assert from 'node:assert/strict'
import { Vec3 } from 'vec3'

import { blockStateId } from '../src/version.mjs'
import { buildWorldFromArtifact, buildWorldFromVoxels } from '../src/world.mjs'

// --- AC #2: block state / orientation resolves to the right state id ----------

test('state resolution: stairs orientation maps to the correct state id (AC #2)', () => {
  // Full, non-default state — pinned against the mixed-radix id (verified vs prismarine-block).
  assert.equal(blockStateId('oak_stairs', { facing: 'east', half: 'top', shape: 'straight', waterlogged: 'false' }), 2935)
  // Partial state fills the rest from the block default; straight/false ARE the defaults.
  assert.equal(blockStateId('oak_stairs', { facing: 'east', half: 'top' }), 2935)
  // A partial state that resolves exactly to the block default.
  assert.equal(blockStateId('oak_stairs', { facing: 'north' }), blockStateId('oak_stairs'))
  // Directional (axis) block.
  assert.equal(blockStateId('oak_log', { axis: 'x' }), 130)
  // Bool property accepts the schema's string form.
  assert.equal(typeof blockStateId('oak_stairs', { waterlogged: 'true' }), 'number')
})

test('state resolution: stateless path is unchanged and prefix-tolerant', () => {
  const g = blockStateId('glowstone')
  assert.ok(Number.isInteger(g) && g > 0)
  assert.equal(blockStateId('minecraft:glowstone'), g)
  assert.equal(blockStateId('glowstone', {}), g, 'empty state == stateless')
})

test('state resolution: unmappable input throws a located error (AC #3 detection)', () => {
  assert.throws(() => blockStateId('not_a_block'), /unknown block/)
  assert.throws(() => blockStateId('glowstone', { lit: 'true' }), /takes no state properties/)
  assert.throws(() => blockStateId('oak_stairs', { nonsense: 'x' }), /no state property "nonsense"/)
  assert.throws(() => blockStateId('oak_stairs', { facing: 'sideways' }), /illegal value .* "oak_stairs\.facing"/)
})

// --- AC #1: every voxel written at the right coordinate with the right type ---

test('placement: every expanded voxel lands at its coordinate with its block (AC #1)', async () => {
  const artifact = {
    placements: [
      { op: 'fill', from: [0, 0, 0], to: [2, 0, 0], block: 'minecraft:stone' },
      { op: 'voxel', pos: [1, 1, 0], block: 'minecraft:glowstone' }
    ]
  }
  const { world, placed, unmapped } = await buildWorldFromArtifact(artifact)

  assert.equal(placed, 4)
  assert.equal(unmapped.length, 0)
  for (const x of [0, 1, 2]) {
    assert.equal((await world.getBlock(new Vec3(x, 0, 0))).name, 'stone')
  }
  assert.equal((await world.getBlock(new Vec3(1, 1, 0))).name, 'glowstone')
  // Everything else is air.
  assert.equal((await world.getBlock(new Vec3(5, 5, 5))).name, 'air')
})

// --- AC #3: unknown/unmappable reporting + determinism ------------------------

test('report: unmappable blocks are collected, not crashed on (AC #3)', async () => {
  const artifact = {
    placements: [
      { op: 'voxel', pos: [0, 0, 0], block: 'minecraft:stone' },
      { op: 'voxel', pos: [1, 0, 0], block: 'minecraft:not_a_block' }
    ]
  }
  const { world, placed, unmapped } = await buildWorldFromArtifact(artifact)

  assert.equal(placed, 1)
  assert.equal((await world.getBlock(new Vec3(0, 0, 0))).name, 'stone', 'good voxel still placed')
  assert.equal(unmapped.length, 1)
  assert.deepEqual(unmapped[0].pos, [1, 0, 0])
  assert.equal(unmapped[0].block, 'minecraft:not_a_block')
  assert.match(unmapped[0].reason, /unknown block/)
})

test('report: strict mode throws an aggregated error listing every unmapped voxel', async () => {
  const artifact = {
    placements: [
      { op: 'voxel', pos: [0, 0, 0], block: 'minecraft:not_a_block' },
      { op: 'voxel', pos: [1, 0, 0], block: 'minecraft:also_not_real' }
    ]
  }
  await assert.rejects(
    () => buildWorldFromArtifact(artifact, { strict: true }),
    (e) => /2 unmappable voxel/.test(e.message) && /not_a_block/.test(e.message) && /also_not_real/.test(e.message)
  )
})

test('determinism: same artifact builds an identical world and report (AC #3)', async () => {
  const artifact = {
    placements: [
      { op: 'box', from: [0, 0, 0], to: [2, 2, 2], block: 'minecraft:stone' },
      { op: 'voxel', pos: [0, 1, 0], block: 'minecraft:oak_stairs', state: { facing: 'south', half: 'top' } },
      { op: 'voxel', pos: [3, 0, 0], block: 'minecraft:bogus' }
    ]
  }
  const a = await buildWorldFromArtifact(artifact)
  const b = await buildWorldFromArtifact(artifact)

  assert.equal(a.placed, b.placed)
  assert.deepEqual(a.bounds, b.bounds)
  assert.deepEqual(a.unmapped, b.unmapped)
  // Identical state ids across the bounding box.
  for (let y = a.bounds.min[1]; y <= a.bounds.max[1]; y++) {
    for (let z = a.bounds.min[2]; z <= a.bounds.max[2]; z++) {
      for (let x = a.bounds.min[0]; x <= a.bounds.max[0]; x++) {
        const p = new Vec3(x, y, z)
        assert.equal(await a.world.getBlockStateId(p), await b.world.getBlockStateId(p))
      }
    }
  }
})

test('bounds/center: cover placed voxels; center is the rounded midpoint', async () => {
  const voxels = [
    { pos: [0, 0, 0], block: 'stone' },
    { pos: [4, 2, 6], block: 'stone' }
  ]
  const { bounds, center, placed } = await buildWorldFromVoxels(voxels)
  assert.equal(placed, 2)
  assert.deepEqual(bounds, { min: [0, 0, 0], max: [4, 2, 6] })
  assert.ok(center instanceof Vec3)
  assert.deepEqual([center.x, center.y, center.z], [2, 1, 3])
})

// --- AC #4: a known small artifact builds the expected structure --------------

test('known small artifact builds the expected world structure (AC #4)', async () => {
  const artifact = {
    placements: [
      { op: 'fill', from: [0, 0, 0], to: [1, 0, 1], block: 'minecraft:stone' },
      { op: 'voxel', pos: [0, 1, 0], block: 'minecraft:oak_stairs', state: { facing: 'east', half: 'top' } },
      { op: 'voxel', pos: [1, 1, 1], block: 'minecraft:glowstone' }
    ]
  }
  const { world, placed, unmapped, bounds } = await buildWorldFromArtifact(artifact)

  assert.equal(placed, 6)
  assert.equal(unmapped.length, 0)
  assert.deepEqual(bounds, { min: [0, 0, 0], max: [1, 1, 1] })

  // 2x2 stone floor.
  for (const [x, z] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    assert.equal((await world.getBlock(new Vec3(x, 0, z))).name, 'stone')
  }

  // The stair: correct name AND a NON-DEFAULT orientation actually written —
  // this assertion fails if state/orientation were dropped.
  const stair = await world.getBlock(new Vec3(0, 1, 0))
  assert.equal(stair.name, 'oak_stairs')
  const props = stair.getProperties()
  assert.equal(props.facing, 'east')
  assert.equal(props.half, 'top')
  assert.equal(await world.getBlockStateId(new Vec3(0, 1, 0)), blockStateId('oak_stairs', { facing: 'east', half: 'top' }))
  assert.notEqual(await world.getBlockStateId(new Vec3(0, 1, 0)), blockStateId('oak_stairs'), 'orientation is non-default')

  assert.equal((await world.getBlock(new Vec3(1, 1, 1))).name, 'glowstone')
})
