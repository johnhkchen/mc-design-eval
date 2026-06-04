// The headless render (Design decision 6; AC #3 + AC #4).
//
// Owns the FIXED render contract (size, camera, view distance) — comparability is a
// property of fixed framing, so the framing is explicit, named, and defaulted here
// rather than left to incidental library defaults. T-003-03 refines the actual view
// angles; the scaffold's job is to establish the contract and prove it round-trips
// to a correct PNG, in-process, with no Minecraft server and no bot.

import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { Vec3 } from 'vec3'
import { createHeadlessCanvas, GL_AVAILABLE, GL_LOAD_ERROR } from './headless-canvas.mjs'
import { MINECRAFT_VERSION } from './version.mjs'

export { GL_AVAILABLE, GL_LOAD_ERROR }

// Use CJS require so `three` (and the prismarine-viewer internals) resolve to the
// SAME instance the viewer's workers/modules use — mixing an ESM `three` namespace
// with the viewer's `require('three')` would create two THREE objects and break it.
const require = createRequire(import.meta.url)

// The owned, fixed render contract. Defaults are deliberately explicit so two builds
// are photographed identically (E-02: deterministic, comparable renders).
export const DEFAULTS = {
  width: 512,
  height: 512,
  viewDistance: 4,
  fov: 75,
  cameraOffset: new Vec3(7, 8, 7) // fixed isometric-ish vantage, relative to center
}

/**
 * Render an in-memory `prismarine-world` to a PNG, headless and in-process.
 * @param {object} world a prismarine-world World
 * @param {Vec3|{x,y,z}} center the focus point (camera looks here)
 * @param {Partial<typeof DEFAULTS> & {outPath?: string}} [opts]
 * @returns {Promise<Buffer>} the PNG bytes (also written to opts.outPath if given)
 */
export async function renderWorldToPng (world, center, opts = {}) {
  if (!GL_AVAILABLE) {
    throw new Error('headless GL unavailable: ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
  }
  const o = { ...DEFAULTS, ...opts }
  const c = center instanceof Vec3 ? center : new Vec3(center.x, center.y, center.z)

  // The viewer reads these globals (mirrors prismarine-viewer/lib/headless.js).
  globalThis.THREE = require('three')
  globalThis.Worker = require('node:worker_threads').Worker
  const THREE = globalThis.THREE
  const { Viewer, WorldView, getBufferFromStream } = require('prismarine-viewer').viewer

  const canvas = createHeadlessCanvas(o.width, o.height)
  const renderer = new THREE.WebGLRenderer({ canvas })
  renderer.setSize(o.width, o.height, false)

  const viewer = new Viewer(renderer)
  if (!viewer.setVersion(MINECRAFT_VERSION)) {
    throw new Error(`prismarine-viewer does not support ${MINECRAFT_VERSION}`)
  }

  // Stream our in-memory world's chunks into the renderer.
  const worldView = new WorldView(world, o.viewDistance, c)
  viewer.listen(worldView)
  await worldView.init(c)

  // Fixed camera: a constant offset from center, looking at center.
  const eye = c.plus(o.cameraOffset)
  viewer.camera.position.set(eye.x, eye.y, eye.z)
  viewer.camera.fov = o.fov
  viewer.camera.aspect = o.width / o.height
  viewer.camera.updateProjectionMatrix()
  viewer.camera.lookAt(c.x, c.y, c.z)

  await viewer.waitForChunksToRender()
  viewer.update()
  renderer.render(viewer.scene, viewer.camera)

  const buffer = await getBufferFromStream(canvas.createPNGStream())

  // prismarine-viewer spawns mesh worker threads that keep the event loop alive.
  // Terminate them and drop the GL context so a single call leaves nothing running —
  // important for `node --test` and for repeated calls (T-003-04).
  for (const worker of viewer.world.workers || []) worker.terminate()
  // renderer.dispose() drives three's animation loop, which calls cancelAnimationFrame
  // (absent without a DOM) — best-effort only; the GL context destroy below frees the
  // real resources.
  try { renderer.dispose() } catch { /* headless: no animation frame to cancel */ }
  canvas.getContext('webgl')?.getExtension('STACKGL_destroy_context')?.destroy?.()

  if (o.outPath) {
    mkdirSync(dirname(o.outPath), { recursive: true })
    writeFileSync(o.outPath, buffer)
  }
  return buffer
}
