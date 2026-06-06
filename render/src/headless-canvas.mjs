// The swappable render seam (Design decision 3).
//
// The ONLY file that knows *how* a headless WebGL surface is obtained. Isolating it
// here is what lets the documented Playwright/Chromium fallback replace this
// in-process path later without touching world construction or the render wiring.
//
// Primary (committed) path: a node-canvas `Canvas` whose `getContext('webgl')`
// returns a headless-gl context, exactly the trick `node-canvas-webgl` performs.
// That package pins ancient `canvas@^2`/`gl@^6` that won't build on Node 22, so we
// depend on modern `canvas@^3` + `gl@^8` directly and replicate its ~40-line trick
// here (the Design's "contingency branch 2", taken at install time).

import canvasPkg from 'canvas'
import createGLContext from 'gl'

const { Canvas, Image } = canvasPkg
const _ctx = Symbol('ctx')

// headless-gl renders into its own framebuffer; copy those pixels (flipped, since GL
// origin is bottom-left) into the node-canvas 2D backing store so PNG encoding works.
function blitGlToCanvas (gl, canvas) {
  const { width, height } = canvas
  const ctx = canvas[_ctx]
  const data = ctx.getImageData(0, 0, width, height)
  const pixels = new Uint8Array(width * height * 4)
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const row = height - i - 1
      for (let k = 0; k < 4; k++) {
        data.data[4 * (row * width + j) + k] = pixels[4 * (i * width + j) + k]
      }
    }
  }
  ctx.putImageData(data, 0, 0)
  return ctx
}

class HeadlessCanvas extends Canvas {
  constructor (width, height) {
    super(width, height)
    this.__attributes__ = {}
    this.__listeners__ = new Map()
    this.style = {}
  }

  get clientWidth () { return this.width }
  get clientHeight () { return this.height }

  // Force a GL→2D blit and return the 2D context (used by the encoders below).
  get __synced2d__ () { if (this.__gl__) blitGlToCanvas(this.__gl__, this); return this[_ctx] }

  getContext (type, options) {
    if (this.__contextType__ && this.__contextType__ !== type) return null
    if (this.__gl__) return this.__gl__
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      this.__contextType__ = type
      const { width, height } = this
      this[_ctx] = super.getContext('2d', options)
      const gl = createGLContext(width, height, options || {})

      // headless-gl getUniformLocation fix for array uniforms (stackgl/headless-gl#170).
      const _getUniformLocation = gl.getUniformLocation
      gl.getUniformLocation = function (program, name) {
        if (program._uniforms && !/\[\d+\]$/.test(name)) {
          const reg = new RegExp(`${name}\\[\\d+\\]$`)
          for (let i = 0; i < program._uniforms.length; i++) {
            if (reg.test(program._uniforms[i].name)) name = program._uniforms[i].name
          }
        }
        return _getUniformLocation.call(this, program, name)
      }

      gl.canvas = this

      // three.js uploads textures from Image/Canvas; headless-gl needs raw pixels, so
      // rasterise any Image through a node-canvas first.
      const _texImage2D = gl.texImage2D
      gl.texImage2D = function (...args) {
        let pixels = args[args.length - 1]
        if (pixels && pixels._image) pixels = pixels._image
        if (pixels instanceof Image) {
          const c = new Canvas(pixels.width, pixels.height)
          c.getContext('2d').drawImage(pixels, 0, 0)
          args[args.length - 1] = c
        }
        return _texImage2D.apply(this, args)
      }

      this.__gl__ = gl
      return gl
    }
    return super.getContext(type, options)
  }

  toBuffer (...a) { if (this.__gl__) blitGlToCanvas(this.__gl__, this); return super.toBuffer(...a) }
  toDataURL (...a) { if (this.__gl__) blitGlToCanvas(this.__gl__, this); return super.toDataURL(...a) }
  createPNGStream (...a) { if (this.__gl__) blitGlToCanvas(this.__gl__, this); return super.createPNGStream(...a) }

  // three.js attaches WebGL context-loss listeners and probes width/height; node-canvas
  // is not a DOM element, so provide the minimal EventTarget/attribute surface it needs.
  addEventListener (type, cb) {
    if (!this.__listeners__.has(type)) this.__listeners__.set(type, new Set())
    this.__listeners__.get(type).add(cb)
  }

  removeEventListener (type, cb) {
    const set = this.__listeners__.get(type)
    if (set) set.delete(cb)
  }

  dispatchEvent (event) {
    const set = this.__listeners__.get(event.type)
    if (set) for (const cb of set) cb({ ...event, target: this })
    return true
  }

  setAttribute (k, v) {
    this.__attributes__[k] = v
    if (k === 'width') this.width = v
    if (k === 'height') this.height = v
  }

  getAttribute (k) {
    if (k === 'width') return this.width
    if (k === 'height') return this.height
    return this.__attributes__[k]
  }
}

// Probe GL availability once at import. A GL-less environment (no GPU/display, or an
// un-built `gl`) flips this false so the render smoke test can skip rather than
// hard-fail — keeping the no-GPU acceptance criteria green everywhere.
export let GL_AVAILABLE = true
export let GL_LOAD_ERROR = null
try {
  const probe = createGLContext(1, 1)
  if (!probe) throw new Error('headless-gl returned a null context (no GPU/display?)')
  probe.getExtension('STACKGL_destroy_context')?.destroy?.()
} catch (err) {
  GL_AVAILABLE = false
  GL_LOAD_ERROR = err
}

/**
 * Create a headless, WebGL-capable canvas of the given size.
 * @param {number} width
 * @param {number} height
 * @returns {HeadlessCanvas}
 */
export function createHeadlessCanvas (width, height) {
  return new HeadlessCanvas(width, height)
}

// --- Supersampling support (T-075-01) ---------------------------------------------
// The two seams the SSAA render lens needs, kept here because this is the ONLY file
// that knows the node-canvas/GL surface trick (Design decision 3): read the rendered
// pixels OUT of a (supersampled) canvas, and encode a downscaled RGBA buffer back to a
// PNG. The averaging itself lives in the pure, GL-free src/render-supersample.mjs.

/**
 * Read the rendered RGBA8 pixels off a HeadlessCanvas. Forces the GL→2D blit via the
 * `__synced2d__` getter, which already flips GL's bottom-left origin to top-left, so the
 * returned buffer is in the same orientation as the PNG encoders.
 * @param {HeadlessCanvas} canvas
 * @returns {{ data: Uint8ClampedArray, width: number, height: number }}
 */
export function readCanvasRgba (canvas) {
  const ctx = canvas.__synced2d__
  const { width, height } = canvas
  return { data: ctx.getImageData(0, 0, width, height).data, width, height }
}

/**
 * Encode an RGBA8 buffer to a PNG Buffer at the given size (node-canvas, synchronous).
 * Used to emit the box-downscaled 512² image after a supersampled render.
 * @param {Uint8ClampedArray|Uint8Array} rgba length width*height*4
 * @param {number} width @param {number} height
 * @returns {Buffer}
 */
export function encodeRgbaToPng (rgba, width, height) {
  const c = new Canvas(width, height)
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(width, height)
  img.data.set(rgba)
  ctx.putImageData(img, 0, 0)
  return c.toBuffer('image/png')
}
