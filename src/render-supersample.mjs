// Supersample (SSAA) downscale math — the PURE, GL-free core of the T-075-01 render lens
// fix (E-22 / S-075). render/src/render.mjs renders the scene into an N×-larger framebuffer
// and calls boxDownscale() here to resolve it back to the 512² contract. Averaging N² rendered
// samples per output pixel is what minification SHOULD do — it removes the high-frequency
// texture noise that the viewer's point-sampled (NearestFilter, no mipmap) minification turns
// into "grey static" when a 16px block texture is drawn into ~6px on screen.
//
// PURE on purpose: Uint8 in / Uint8 out, no THREE, no canvas, no GL, no IO — so the root
// `npm test` (which globs src/**/*.test.mjs and runs on GL-less CI) exercises every line. The
// render package imports this by relative path, the same render→src coupling world.mjs already
// uses (../../src/expand.mjs).

/**
 * Box-filter downscale of an RGBA8 image by an EXACT integer factor on each axis. Each output
 * pixel is the per-channel mean of the fx·fy source pixels it covers.
 * @param {Uint8ClampedArray|Uint8Array|number[]} src length srcW*srcH*4, RGBA row-major
 * @param {number} srcW @param {number} srcH @param {number} dstW @param {number} dstH
 * @returns {Uint8ClampedArray} length dstW*dstH*4
 * @throws if the factor is not a positive integer on each axis (no fractional resampling —
 *   determinism + an exact box are the whole point).
 */
export function boxDownscale (src, srcW, srcH, dstW, dstH) {
  assertExactFactor(srcW, srcH, dstW, dstH)
  const fx = srcW / dstW
  const fy = srcH / dstH
  const n = fx * fy
  const out = new Uint8ClampedArray(dstW * dstH * 4)

  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      let r = 0; let g = 0; let b = 0; let a = 0
      const sy0 = dy * fy
      const sx0 = dx * fx
      for (let j = 0; j < fy; j++) {
        let row = ((sy0 + j) * srcW + sx0) * 4
        for (let i = 0; i < fx; i++) {
          r += src[row]
          g += src[row + 1]
          b += src[row + 2]
          a += src[row + 3]
          row += 4
        }
      }
      const o = (dy * dstW + dx) * 4
      out[o] = Math.round(r / n)
      out[o + 1] = Math.round(g / n)
      out[o + 2] = Math.round(b / n)
      out[o + 3] = Math.round(a / n)
    }
  }
  return out
}

/**
 * Nearest-neighbour decimation by an exact integer factor — keep ONE source sample (the block's
 * top-left corner) per output pixel. This is the aliasing analogue of the viewer's point-sampled
 * minification; provided as the unit test's contrast baseline (box must beat it) and as the
 * N===1 identity case. Same signature/guards as boxDownscale.
 * @returns {Uint8ClampedArray}
 */
export function nearestDownscale (src, srcW, srcH, dstW, dstH) {
  assertExactFactor(srcW, srcH, dstW, dstH)
  const fx = srcW / dstW
  const fy = srcH / dstH
  const out = new Uint8ClampedArray(dstW * dstH * 4)
  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const s = ((dy * fy) * srcW + dx * fx) * 4
      const o = (dy * dstW + dx) * 4
      out[o] = src[s]
      out[o + 1] = src[s + 1]
      out[o + 2] = src[s + 2]
      out[o + 3] = src[s + 3]
    }
  }
  return out
}

/**
 * A scalar proxy for high-frequency energy ("how much static"): the mean over pixels of the
 * squared RGB difference to the right and down neighbours. Higher = busier/noisier. Used by the
 * unit test to show box-downscale yields a far smoother image than nearest decimation. Pure.
 * @param {Uint8ClampedArray|Uint8Array|number[]} rgba @param {number} w @param {number} h
 * @returns {number}
 */
export function highFreqEnergy (rgba, w, h) {
  let acc = 0
  let count = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4
      if (x + 1 < w) {
        const r = (y * w + x + 1) * 4
        acc += sq(rgba[o] - rgba[r]) + sq(rgba[o + 1] - rgba[r + 1]) + sq(rgba[o + 2] - rgba[r + 2])
        count++
      }
      if (y + 1 < h) {
        const d = ((y + 1) * w + x) * 4
        acc += sq(rgba[o] - rgba[d]) + sq(rgba[o + 1] - rgba[d + 1]) + sq(rgba[o + 2] - rgba[d + 2])
        count++
      }
    }
  }
  return count === 0 ? 0 : acc / count
}

function sq (n) { return n * n }

function assertExactFactor (srcW, srcH, dstW, dstH) {
  if (!(srcW > 0 && srcH > 0 && dstW > 0 && dstH > 0)) {
    throw new Error(`downscale: all dimensions must be > 0 (got ${srcW}×${srcH} → ${dstW}×${dstH})`)
  }
  if (srcW % dstW !== 0 || srcH % dstH !== 0) {
    throw new Error(
      `downscale: source ${srcW}×${srcH} must be an integer multiple of target ${dstW}×${dstH} ` +
        `(supersampling uses an exact box filter — no fractional resampling)`
    )
  }
}
