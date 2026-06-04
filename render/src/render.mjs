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
import { fileURLToPath } from 'node:url'
import { Vec3 } from 'vec3'
import { createHeadlessCanvas, GL_AVAILABLE, GL_LOAD_ERROR } from './headless-canvas.mjs'
import { MINECRAFT_VERSION } from './version.mjs'
import { framedCamera, viewDistanceFor, DEFAULT_VIEW } from './camera.mjs'

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

  // Resolve the camera. With `opts.bounds`, frame the build comparably (fixed angle,
  // distance derived from the build's extent — camera.mjs; T-003-03 AC #2). Without it,
  // fall back to the scaffold's constant offset (unchanged — keeps scaffold.test green
  // and serves bounds-less callers). `viewDistance` grows so the framed build's far side
  // is streamed in before the snapshot.
  let eye, fov, viewDistance, look
  if (opts.bounds) {
    const cam = framedCamera(opts.bounds, opts.view)
    eye = cam.eye
    look = cam.target
    fov = cam.fov
    viewDistance = viewDistanceFor(cam.distance, cam.radius, o.viewDistance)
  } else {
    eye = c.plus(o.cameraOffset)
    look = c
    fov = o.fov
    viewDistance = o.viewDistance
  }

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
  // setVersion() returns truthy even when it SILENTLY resolves an unsupported pin to
  // the nearest supported version (e.g. 1.20.4 -> 1.20.1). The world's blocks are
  // written with MINECRAFT_VERSION state-ids, so a meshing-version mismatch maps every
  // id onto a neighbouring block (gray_concrete -> coral). Refuse to render rather than
  // emit a faithless image that would corrupt visual scoring.
  if (viewer.version !== MINECRAFT_VERSION) {
    throw new Error(
      `prismarine-viewer resolved ${MINECRAFT_VERSION} to ${viewer.version}: the render ` +
        `version must equal the world/pin version or block state-ids mismap. Pin ` +
        `MINECRAFT_VERSION (render/src/version.mjs) to a viewer-supported version.`
    )
  }

  // Stream our in-memory world's chunks into the renderer, centered on what we look at.
  const worldView = new WorldView(world, viewDistance, look)
  viewer.listen(worldView)
  await worldView.init(look)

  // Same camera-mutation sequence the scaffold proved; only the values differ.
  viewer.camera.position.set(eye.x, eye.y, eye.z)
  viewer.camera.fov = fov
  viewer.camera.aspect = o.width / o.height
  viewer.camera.updateProjectionMatrix()
  viewer.camera.lookAt(look.x, look.y, look.z)

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

// Default destination for renderBuild when no outPath is given.
const DEFAULT_BUILD_OUT = fileURLToPath(new URL('../out/build.png', import.meta.url))

/**
 * Render a constructed build to a PNG file with a fixed, comparable camera, and return
 * the image PATH (T-003-03 AC #2 + #3). This is the small, named entry point the Agent
 * SDK render tool (T-003-04) wraps.
 *
 * `build` is the T-003-02 `BuildResult` shape — `{ world, bounds, center? }` (extra
 * fields ignored). When `bounds` is present the build is framed comparably (camera.mjs);
 * an empty build (`bounds == null`) degrades to the constant-offset path around
 * `center`, so it still returns a path instead of throwing.
 *
 * @param {{ world: object, bounds?: {min:number[],max:number[]}|null, center?: Vec3 }} build
 * @param {Partial<typeof DEFAULTS> & { outPath?: string, view?: Partial<typeof DEFAULT_VIEW> }} [opts]
 * @returns {Promise<{ path: string, bytes: number, view: object }>}
 */
export async function renderBuild (build, opts = {}) {
  const view = { ...DEFAULT_VIEW, ...(opts.view || {}) }
  const outPath = opts.outPath || DEFAULT_BUILD_OUT

  if (build.bounds) {
    const cam = framedCamera(build.bounds, view)
    const buffer = await renderWorldToPng(build.world, cam.target, {
      ...opts, outPath, width: view.width, height: view.height, bounds: build.bounds, view
    })
    return { path: outPath, bytes: buffer.length, view: { ...view, distance: cam.distance, radius: cam.radius } }
  }

  // Empty build: no extent to frame — fall back to the scaffold's constant-offset view.
  const center = build.center instanceof Vec3
    ? build.center
    : (build.center ? new Vec3(build.center.x, build.center.y, build.center.z) : new Vec3(0, 0, 0))
  const buffer = await renderWorldToPng(build.world, center, {
    ...opts, outPath, width: view.width, height: view.height
  })
  return { path: outPath, bytes: buffer.length, view }
}
