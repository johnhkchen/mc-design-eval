// T-032-01 verification — turntable / orbit render.
//
// Two tiers (mirrors view.test.mjs). The pure azimuth math runs ANYWHERE and is the primary
// defense of AC #4 (evenly-spaced angles are a property of numbers, provable with no GPU).
// The GL-gated tier renders a small ASYMMETRIC build at 4 azimuths and proves the frames
// actually differ — the automated analog of AC #2 ("not all identical") — skipping (with the
// captured reason) when headless GL is unavailable.

import test from 'node:test'
import assert from 'node:assert/strict'

import { orbitAzimuths, oscillateAzimuths, orbitFramePath, defaultOrbitDir } from '../src/orbit.mjs'

// --- AC #4: evenly-spaced azimuths, no GL --------------------------------------

test('orbitAzimuths: N frames → N evenly-spaced angles starting at 0 (AC #4)', () => {
  assert.deepEqual(orbitAzimuths(8), [0, 45, 90, 135, 180, 225, 270, 315])
  assert.deepEqual(orbitAzimuths(4), [0, 90, 180, 270])
  assert.deepEqual(orbitAzimuths(1), [0])
  assert.equal(orbitAzimuths(36).length, 36)
})

test('orbitAzimuths: spacing is exactly 360/N between every consecutive frame (AC #4)', () => {
  for (const n of [1, 3, 4, 6, 12, 36]) {
    const a = orbitAzimuths(n)
    const step = 360 / n
    for (let i = 1; i < a.length; i++) {
      assert.ok(Math.abs((a[i] - a[i - 1]) - step) < 1e-9, `N=${n}: gap ${i} is 360/N`)
    }
    // ...and frame N would wrap back to frame 0 (a seamless loop, not a 0°/360° double-count).
    const wrapped = ((a[a.length - 1] + step) % 360 + 360) % 360
    assert.ok(Math.abs(wrapped - a[0]) < 1e-9, `N=${n}: frame N coincides with frame 0`)
  }
})

test('orbitAzimuths: startDeg offsets the phase and wraps past 360', () => {
  assert.deepEqual(orbitAzimuths(4, { startDeg: 315 }), [315, 45, 135, 225]) // 315+90=405→45
  assert.deepEqual(orbitAzimuths(4, { startDeg: 45 }), [45, 135, 225, 315])
  assert.deepEqual(orbitAzimuths(2, { startDeg: -90 }), [270, 90]) // -90 normalizes to 270
})

// --- front-arc oscillation (oscillateAzimuths), no GL --------------------------

test('oscillateAzimuths: seamless ping-pong — starts at center, frame N wraps to it', () => {
  const a = oscillateAzimuths(24, { centerDeg: 0, amplitudeDeg: 40 })
  assert.equal(a.length, 24)
  assert.ok(Math.abs(a[0]) < 1e-9, 'frame 0 sits at center (sin 0 = 0)')
  const wrap = ((0 + 40 * Math.sin(2 * Math.PI)) % 360 + 360) % 360 // hypothetical frame N
  assert.ok(Math.abs(wrap - a[0]) < 1e-9, 'frame N coincides with frame 0 → seamless loop')
})

test('oscillateAzimuths: stays within ±amplitude of center (never swings to the back)', () => {
  const a = oscillateAzimuths(36, { centerDeg: 0, amplitudeDeg: 40 })
  for (const ang of a) {
    const signed = ang > 180 ? ang - 360 : ang // fold [0,360) → (-180,180]
    assert.ok(Math.abs(signed) <= 40 + 1e-9, `${ang}° within ±40° of front`)
  }
})

test('oscillateAzimuths: peaks at +amp (i=N/4) and -amp (i=3N/4)', () => {
  const a = oscillateAzimuths(8, { centerDeg: 0, amplitudeDeg: 40 })
  assert.ok(Math.abs(a[2] - 40) < 1e-9, 'i=N/4 → +amplitude')
  assert.ok(Math.abs(a[6] - 320) < 1e-9, 'i=3N/4 → -amplitude (320° = -40°)')
})

test('oscillateAzimuths: a non-positive-integer frame count throws', () => {
  assert.throws(() => oscillateAzimuths(0), /positive integer/)
  assert.throws(() => oscillateAzimuths(2.5), /positive integer/)
})

test('orbitAzimuths: a non-positive-integer frame count throws (caller bug, not rounding)', () => {
  for (const bad of [0, -1, 2.5, NaN, '8', null, undefined]) {
    assert.throws(() => orbitAzimuths(bad), /positive integer/, `frames=${String(bad)} rejected`)
  }
})

// --- AC #1 currency: frame paths order lexically == angularly --------------------

test('orbitFramePath: zero-padded index keeps lexical order == sweep order', () => {
  assert.equal(orbitFramePath('/d', 'frame', 7, 36), '/d/frame.007.png')
  assert.equal(orbitFramePath('/d', 'frame', 0, 8), '/d/frame.000.png')
  // padding widens so 1000+ frames still sort correctly
  assert.equal(orbitFramePath('/d', 'frame', 5, 2000), '/d/frame.0005.png')
})

test('orbitFramePath: baseName is sanitized to safe path characters', () => {
  assert.equal(orbitFramePath('/d', 'a/b c', 1, 8), '/d/a_b_c.001.png')
})

test('defaultOrbitDir: sanitized, under the gitignored render/out/', () => {
  const dir = defaultOrbitDir('001/v0')
  assert.ok(dir.endsWith('/render/out/orbit/001_v0/'), `got ${dir}`)
  assert.ok(defaultOrbitDir().endsWith('/render/out/orbit/orbit/'), 'empty id falls back to "orbit"')
})

// --- AC #2 (automated): GL-gated — frames at different azimuths differ -----------

test('renderOrbit: 4 frames render as valid distinct PNGs (AC #2)', async (t) => {
  const { GL_AVAILABLE, GL_LOAD_ERROR } = await import('../src/headless-canvas.mjs')
  if (!GL_AVAILABLE) {
    t.skip('headless GL unavailable: ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
    return
  }

  const { renderOrbit } = await import('../src/orbit.mjs')
  const { fileURLToPath } = await import('node:url')
  const { existsSync, readFileSync } = await import('node:fs')

  const outDir = fileURLToPath(new URL('../out/test-orbit/', import.meta.url))
  const res = await renderOrbit(asymmetricArtifact(), {
    frames: 4,
    outDir,
    view: { width: 128, height: 128 }
  })

  assert.deepEqual(res.azimuths, [0, 90, 180, 270], 'azimuths are the 4-frame sweep')
  assert.equal(res.frames.length, 4)

  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  for (const f of res.frames) {
    assert.ok(existsSync(f.path), `frame ${f.index} exists`)
    const buf = readFileSync(f.path)
    assert.ok(buf.subarray(0, 8).equals(PNG_SIG), `frame ${f.index} is a valid PNG`)
    assert.ok(f.bytes > 2000, `frame ${f.index} is non-trivial (${f.bytes} bytes)`)
  }

  // The point of a turntable: an asymmetric build seen 90° apart is not the same image.
  const sig = (p) => coarseHash(readFileSync(p))
  const s0 = await sig(res.frames[0].path)
  const s90 = await sig(res.frames[1].path)
  assert.notEqual(s0, s90, 'azimuth 0° and 90° produce different frames (not all identical)')
})

// --- helpers -------------------------------------------------------------------

// A minimal, schema-shaped DesignArtifact with an ASYMMETRIC footprint (an L), so rotation
// is visible. Generic on purpose (AC #3) — no facade/temple vocabulary.
function asymmetricArtifact () {
  return {
    schema_version: '1.0.0',
    metadata: { trial_id: 'orbit-test', prompting_method_id: 't', model_id: 'm', seed: 1, server_state_id: 's' },
    style: { name: 'test', rationale: 'asymmetric L for rotation visibility' },
    palette: { manifest: ['minecraft:stone', 'minecraft:glowstone'] },
    placements: [
      { op: 'fill', from: [0, 0, 0], to: [5, 0, 0], block: 'minecraft:stone' }, // long arm along +x
      { op: 'fill', from: [0, 0, 0], to: [0, 0, 2], block: 'minecraft:stone' }, // short arm along +z
      { op: 'fill', from: [0, 1, 0], to: [0, 4, 0], block: 'minecraft:glowstone' } // tower at the corner
    ]
  }
}

// A coarse, order-sensitive hash of the decoded pixels — enough to tell two frames apart
// without asserting on exact bytes. Decodes via `canvas` (already a render dependency).
async function coarseHash (pngBuffer) {
  const canvasPkg = (await import('canvas')).default
  const { createCanvas, loadImage } = canvasPkg
  const img = await loadImage(pngBuffer)
  const cv = createCanvas(img.width, img.height)
  const ctx = cv.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const { data } = ctx.getImageData(0, 0, img.width, img.height)
  let h = 0
  for (let i = 0; i < data.length; i += 97) { // sparse stride — cheap, position-sensitive
    h = (h * 31 + data[i]) >>> 0
  }
  return h
}
