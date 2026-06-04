// Scaffold verification. Three no-GPU cases (version pin, world API, sample) run
// anywhere; the render smoke case exercises the headless WebGL path when GL is
// available and skips (with the captured reason) otherwise — so `npm test` stays
// green on GL-less CI while still proving the render path wherever GL exists.

import test from 'node:test'
import assert from 'node:assert/strict'
import { Vec3 } from 'vec3'

import { MINECRAFT_VERSION, mcData, assetsFor, blockStateId } from '../src/version.mjs'
import { createEmptyWorld, setBlock, buildSampleWorld } from '../src/world.mjs'

test('version pin: 1.20.1 with minecraft-data + minecraft-assets loaded (AC #1)', () => {
  assert.equal(MINECRAFT_VERSION, '1.20.1')

  const data = mcData()
  assert.ok(Object.keys(data.blocksByName).length > 1000, 'minecraft-data blocks present')

  const assets = assetsFor()
  assert.ok(assets.directory, 'minecraft-assets resolves a texture directory')

  const stone = blockStateId('stone')
  assert.ok(Number.isInteger(stone) && stone > 0, 'stone resolves to a positive state id')
  assert.equal(blockStateId('minecraft:stone'), stone, 'minecraft: prefix is accepted')
})

test('world API: empty world is writable and reads back (AC #2)', async () => {
  const world = createEmptyWorld()

  await setBlock(world, [3, 5, 7], 'glowstone')
  assert.equal(await world.getBlockStateId(new Vec3(3, 5, 7)), blockStateId('glowstone'))
  assert.equal((await world.getBlock(new Vec3(3, 5, 7))).name, 'glowstone')

  // everything else is air
  assert.equal((await world.getBlock(new Vec3(0, 5, 7))).name, 'air')
})

test('sample world builds with a center and a floor (AC #4 subject)', async () => {
  const { world, center } = await buildSampleWorld()
  assert.ok(center instanceof Vec3, 'returns a Vec3 center')
  assert.equal((await world.getBlock(new Vec3(0, 0, 0))).name, 'stone', 'floor at y=0')
  assert.equal((await world.getBlock(new Vec3(0, 1, 0))).name, 'glowstone', 'block on top')
})

test('render smoke: sample renders to a valid PNG (AC #3 + #4)', async (t) => {
  const { GL_AVAILABLE, GL_LOAD_ERROR } = await import('../src/headless-canvas.mjs')
  if (!GL_AVAILABLE) {
    t.skip('headless GL unavailable: ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
    return
  }

  const { renderWorldToPng } = await import('../src/render.mjs')
  const { world, center } = await buildSampleWorld()
  const buf = await renderWorldToPng(world, center)

  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  assert.ok(Buffer.from(buf.subarray(0, 8)).equals(PNG_SIG), 'valid PNG signature')
  assert.ok(buf.length > 2000, `non-trivial PNG (got ${buf.length} bytes)`)
})
