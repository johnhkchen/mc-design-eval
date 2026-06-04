// T-003-03 verification — fixed, comparable camera framing.
//
// Two tiers (mirrors scaffold.test.mjs): the pure framing math runs ANYWHERE and is the
// primary defense of AC #2 (comparability is a property of numbers, provable with no
// GPU); the render-correctness tier exercises renderBuild over a known build when GL is
// available and skips (with the captured reason) otherwise.

import test from 'node:test'
import assert from 'node:assert/strict'
import { Vec3 } from 'vec3'

import {
  DEFAULT_VIEW, boxOf, boundingSphere, framedCamera, viewDistanceFor
} from '../src/camera.mjs'

const deg2rad = (d) => (d * Math.PI) / 180

// A base build and uniformly-scaled copies of it, sharing the same origin corner.
const base = { min: [0, 0, 0], max: [2, 2, 2] }
const scaledBounds = (k) => ({ min: [0, 0, 0], max: [3 * k - 1, 3 * k - 1, 3 * k - 1] })

// --- AC #2: fixed viewing direction, independent of build size -----------------

test('framedCamera: viewing direction is fixed regardless of build size (AC #2)', () => {
  const small = framedCamera(base)
  const big = framedCamera({ min: [0, 0, 0], max: [40, 40, 40] })

  const dirOf = (c) => c.eye.minus(c.target).normalize()
  const ds = dirOf(small)
  const db = dirOf(big)

  // Same unit direction for both builds.
  for (const a of ['x', 'y', 'z']) assert.ok(Math.abs(ds[a] - db[a]) < 1e-12, `dir.${a} stable`)

  // And it equals the configured azimuth/elevation.
  const theta = deg2rad(DEFAULT_VIEW.azimuthDeg)
  const phi = deg2rad(DEFAULT_VIEW.elevationDeg)
  const want = new Vec3(Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta))
  for (const a of ['x', 'y', 'z']) assert.ok(Math.abs(ds[a] - want[a]) < 1e-12, `dir.${a} matches angle`)

  // Same octant as the scaffold's proven (7,8,7) vantage: all components positive.
  assert.ok(ds.x > 0 && ds.y > 0 && ds.z > 0, 'default vantage is the (+,+,+) 3/4 view')
})

// --- AC #2: comparable apparent size — the core invariant ----------------------

test('framedCamera: angular size is invariant under uniform build scaling (AC #2)', () => {
  const cams = [1, 3, 10].map((k) => ({ k, c: framedCamera(scaledBounds(k)) }))

  // distance and radius both scale linearly with k...
  const r1 = cams[0].c.radius
  const d1 = cams[0].c.distance
  for (const { k, c } of cams) {
    assert.ok(Math.abs(c.radius / r1 - k) < 1e-9, `radius scales ×${k}`)
    assert.ok(Math.abs(c.distance / d1 - k) < 1e-9, `distance scales ×${k}`)
  }

  // ...so the angular radius asin(R/d) — i.e. the on-screen footprint — is identical.
  const ang = (c) => Math.asin(c.radius / c.distance)
  const a1 = ang(cams[0].c)
  for (const { k, c } of cams) {
    assert.ok(Math.abs(ang(c) - a1) < 1e-9, `angular size invariant at ×${k}`)
  }
})

// --- framing details -----------------------------------------------------------

test('boxOf / boundingSphere: voxel occupies [p,p+1]; sphere is block-size accurate', () => {
  const { lo, hi } = boxOf(base)
  assert.deepEqual(lo, [0, 0, 0])
  assert.deepEqual(hi, [3, 3, 3], 'high side is max + 1 (a voxel fills its unit cube)')

  const { center, radius } = boundingSphere(base)
  assert.deepEqual([center.x, center.y, center.z], [1.5, 1.5, 1.5], 'center is the box midpoint')
  assert.ok(Math.abs(radius - 0.5 * Math.sqrt(27)) < 1e-12, 'radius is half the space diagonal')
})

test('framedCamera: target is the world-space box center, not the voxel min/max', () => {
  const c = framedCamera({ min: [-2, 0, -2], max: [2, 1, 2] })
  // center = ((min + (max+1)) / 2): x,z = (-2 + 3)/2 = 0.5 ; y = (0 + 2)/2 = 1
  assert.deepEqual([c.target.x, c.target.y, c.target.z], [0.5, 1, 0.5])
})

test('framedCamera: config is monotonic — wider fov closer, more margin farther', () => {
  const d = (view) => framedCamera(base, view).distance
  assert.ok(d({ fov: 90 }) < d({ fov: 60 }), 'wider fov ⇒ smaller distance')
  assert.ok(d({ margin: 1.5 }) > d({ margin: 1.0 }), 'more margin ⇒ larger distance')
})

test('viewDistanceFor: covers the framed build and never drops below the floor', () => {
  assert.equal(viewDistanceFor(10, 2, 4), 4, 'small build keeps the floor')
  assert.ok(viewDistanceFor(200, 30, 4) > 4, 'large build grows past the floor')
  // monotonic in distance
  assert.ok(viewDistanceFor(400, 30, 4) > viewDistanceFor(200, 30, 4))
})

test('boxOf / framedCamera: an empty build (null bounds) throws, not silently frames', () => {
  assert.throws(() => boxOf(null), /bounds/)
  assert.throws(() => framedCamera(null), /bounds/)
})

// --- GL-gated render correctness (AC #1, #4, and AC #2 empirically) -------------

test('renderBuild: known build renders to a valid PNG and returns its path (AC #1, #3, #4)', async (t) => {
  const { GL_AVAILABLE, GL_LOAD_ERROR } = await import('../src/headless-canvas.mjs')
  if (!GL_AVAILABLE) {
    t.skip('headless GL unavailable: ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
    return
  }

  const { renderBuild } = await import('../src/render.mjs')
  const { existsSync, readFileSync } = await import('node:fs')
  const { fileURLToPath } = await import('node:url')

  const outPath = fileURLToPath(new URL('../out/test-known.png', import.meta.url))
  const build = await knownBuild(2) // a 2-block-tall marker on a small floor
  const res = await renderBuild(build, { outPath })

  assert.equal(res.path, outPath, 'returns the image path (AC #3)')
  assert.ok(existsSync(res.path), 'the PNG exists on disk')
  const buf = readFileSync(res.path)
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  assert.ok(buf.subarray(0, 8).equals(PNG_SIG), 'valid PNG signature (AC #1)')
  assert.ok(res.bytes > 2000, `non-trivial PNG (got ${res.bytes} bytes)`)

  // AC #4: the build is actually in frame — a non-trivial, non-overflowing footprint.
  const frac = await nonBackgroundFraction(buf)
  assert.ok(frac > 0.02 && frac < 0.95, `known build visibly in frame (footprint ${frac.toFixed(3)})`)
})

test('renderBuild: two build scales share a comparable on-screen footprint (AC #2)', async (t) => {
  const { GL_AVAILABLE, GL_LOAD_ERROR } = await import('../src/headless-canvas.mjs')
  if (!GL_AVAILABLE) {
    t.skip('headless GL unavailable: ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
    return
  }

  const { renderBuild } = await import('../src/render.mjs')
  const { fileURLToPath } = await import('node:url')
  const { readFileSync } = await import('node:fs')

  const out = (n) => fileURLToPath(new URL(`../out/test-scale-${n}.png`, import.meta.url))
  const small = await renderBuild(await knownBuild(2), { outPath: out('small') })
  const large = await renderBuild(await knownBuild(6), { outPath: out('large') })

  const fSmall = await nonBackgroundFraction(readFileSync(small.path))
  const fLarge = await nonBackgroundFraction(readFileSync(large.path))

  // Both occupy a real fraction of the frame...
  assert.ok(fSmall > 0.02 && fLarge > 0.02, `both builds visible (${fSmall.toFixed(3)}, ${fLarge.toFixed(3)})`)
  // ...and a COMPARABLE fraction despite a 3× size difference — the empirical proof that
  // framing is build-size-independent. A constant offset would blow this ratio out.
  const ratio = Math.max(fSmall, fLarge) / Math.min(fSmall, fLarge)
  assert.ok(ratio < 1.8, `comparable footprint across scales (ratio ${ratio.toFixed(2)})`)
})

// --- helpers -------------------------------------------------------------------

// A known build local to the test (does NOT touch world.mjs / T-003-02): a (2k+1)²
// stone floor with a glowstone marker rising `2k` tall at the center, plus its exact
// bounds. Uniformly scales with k so the two-scale comparison is apples-to-apples.
async function knownBuild (k) {
  const { createEmptyWorld, setBlock } = await import('../src/world.mjs')
  const world = createEmptyWorld()
  const r = k
  for (let x = -r; x <= r; x++) {
    for (let z = -r; z <= r; z++) await setBlock(world, [x, 0, z], 'stone')
  }
  for (let y = 1; y <= 2 * k; y++) await setBlock(world, [0, y, 0], 'glowstone')
  return { world, bounds: { min: [-r, 0, -r], max: [r, 2 * k, r] } }
}

// Fraction of pixels that differ from the top-left corner (treated as sky/background).
// Decodes the PNG via node-canvas, which is already a dependency.
async function nonBackgroundFraction (pngBuffer) {
  const canvasPkg = (await import('canvas')).default
  const { createCanvas, loadImage } = canvasPkg
  const img = await loadImage(pngBuffer)
  const cv = createCanvas(img.width, img.height)
  const ctx = cv.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const { data } = ctx.getImageData(0, 0, img.width, img.height)
  const br = data[0]; const bg = data[1]; const bb = data[2]
  let diff = 0
  const n = img.width * img.height
  for (let i = 0; i < n; i++) {
    const o = i * 4
    if (Math.abs(data[o] - br) + Math.abs(data[o + 1] - bg) + Math.abs(data[o + 2] - bb) > 24) diff++
  }
  return diff / n
}
