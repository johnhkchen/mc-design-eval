// T-075-01 (E-22 / S-075) — the deterministic, GL-free proof of the supersample downscale math.
// The lisa CI env has no headless GL, so the MATH is unit-tested here (the live GL render is the
// impure proof in the work dir). Core claim (AC #3): a box-filter downscale drops the
// high-frequency noise that point-sampled (nearest) minification keeps — i.e. it removes the
// "static".

import test from 'node:test'
import assert from 'node:assert/strict'

import { boxDownscale, nearestDownscale, highFreqEnergy } from './render-supersample.mjs'

// A 4×4 RGBA image whose red channel encodes a known value per pixel (g=b=0, a=255), so we can
// hand-check the 2×2 block means.
function ramp4x4 () {
  const v = [
    0, 40, 80, 120,
    40, 80, 120, 160,
    80, 120, 160, 200,
    120, 160, 200, 240
  ]
  const out = new Uint8ClampedArray(4 * 4 * 4)
  for (let i = 0; i < 16; i++) { out[i * 4] = v[i]; out[i * 4 + 3] = 255 }
  return out
}

test('boxDownscale: 4×4 → 2×2 averages each 2×2 block per channel (AC #3 mechanics)', () => {
  const out = boxDownscale(ramp4x4(), 4, 4, 2, 2)
  assert.equal(out.length, 2 * 2 * 4, 'output length is dstW*dstH*4')
  // top-left block = mean(0,40,40,80) = 40 ; top-right = mean(80,120,120,160) = 120
  // bottom-left = mean(80,120,120,160) = 120 ; bottom-right = mean(160,200,200,240) = 200
  assert.equal(out[0], 40, 'TL red mean')
  assert.equal(out[4], 120, 'TR red mean')
  assert.equal(out[8], 120, 'BL red mean')
  assert.equal(out[12], 200, 'BR red mean')
  for (const i of [0, 1, 2, 3]) assert.equal(out[i * 4 + 3], 255, 'alpha preserved')
})

test('boxDownscale: non-integer factor throws (no fractional resampling — determinism)', () => {
  const src = new Uint8ClampedArray(5 * 5 * 4)
  assert.throws(() => boxDownscale(src, 5, 5, 2, 2), /integer multiple/)
  assert.throws(() => boxDownscale(src, 0, 5, 2, 2), /must be > 0/)
})

test('boxDownscale: identity factor (w→w) returns the input values unchanged', () => {
  const src = ramp4x4()
  const out = boxDownscale(src, 4, 4, 4, 4)
  assert.equal(out.length, src.length)
  for (let i = 0; i < src.length; i++) assert.equal(out[i], src[i], `pixel byte ${i} unchanged`)
})

test('AC #3: box-downscale crushes high-frequency noise that nearest decimation keeps', () => {
  // The "static" analogue, built so the two filters provably diverge under a ×2 downscale.
  // Within each 2×2 source block the TOP-LEFT pixel carries a block-to-block checker (0/255 by
  // block parity) while the other three pixels are set so EVERY block averages to ~128. Result:
  //   - nearest (samples the top-left) → a full-contrast 0/255 checker across blocks → max HF.
  //   - box (averages the block) → ~flat mid-grey → ~0 HF.
  // This is exactly the real failure: point-sampling a busy texture keeps the static; averaging
  // (what supersampling does) removes it.
  const W = 64 // 32×32 blocks at factor 2
  const src = new Uint8ClampedArray(W * W * 4)
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const p = ((x >> 1) + (y >> 1)) % 2 // block parity
      const isTopLeft = (x % 2) === 0 && (y % 2) === 0
      const o = (y * W + x) * 4
      // TL: 0 or 255 by parity; the other three balance the block mean to ~128 regardless.
      src[o] = isTopLeft ? (p ? 255 : 0) : (p ? 86 : 170)
      src[o + 3] = 255
    }
  }

  const box = boxDownscale(src, W, W, W / 2, W / 2)
  const near = nearestDownscale(src, W, W, W / 2, W / 2)

  const eBox = highFreqEnergy(box, W / 2, W / 2)
  const eNear = highFreqEnergy(near, W / 2, W / 2)

  // A 2×2 box average of a 1px checker → flat mid-grey (~128) everywhere → ~0 HF energy.
  // Nearest decimation samples one corner per block → still a full-contrast checker → huge HF.
  assert.ok(eBox < eNear, `box (${eBox.toFixed(1)}) must be smoother than nearest (${eNear.toFixed(1)})`)
  assert.ok(eBox < eNear * 0.05, `box removes the bulk of the static (box ${eBox.toFixed(1)} ≪ nearest ${eNear.toFixed(1)})`)
  assert.ok(eNear > 1000, `nearest decimation keeps the high-frequency checker (${eNear.toFixed(1)})`)
})

test('boxDownscale: deterministic — identical input yields byte-identical output', () => {
  const src = ramp4x4()
  const a = boxDownscale(src, 4, 4, 2, 2)
  const b = boxDownscale(src, 4, 4, 2, 2)
  assert.deepEqual(Array.from(a), Array.from(b))
})

test('nearestDownscale: picks the block top-left sample (the aliasing baseline)', () => {
  const out = nearestDownscale(ramp4x4(), 4, 4, 2, 2)
  // top-left corners of the four 2×2 blocks: indices 0,2,8,10 in the ramp → 0,80,80,160
  assert.equal(out[0], 0)
  assert.equal(out[4], 80)
  assert.equal(out[8], 80)
  assert.equal(out[12], 160)
})
