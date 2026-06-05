// Turntable / orbit render (T-032-01).
//
// The azimuth sweep, layered on the proven head-on render path. There is no new camera
// math here: framedCamera (camera.mjs) already takes a per-call `azimuthDeg`, and the
// build's bounding SPHERE makes the fit rotation-independent — so distance, elevation and
// fov are identical for every frame and only `view.azimuthDeg` changes. An N-frame orbit
// is therefore N independent renderArtifact calls (which are stateless by construction:
// each builds a fresh world and tears down its GL/workers), with a per-frame angle and a
// per-frame output path.
//
// Artifact-general on purpose (AC #3): renderOrbit takes ANY DesignArtifact, so E-11's
// review bookend (src/sculptor/review.mjs already holds an artifact at render time) can
// call it for multi-view inspection. No facade/temple specifics live here.
//
// Split into a PURE core (orbitAzimuths / orbitFramePath / defaultOrbitDir — no GL, no I/O,
// the AC #4 testable surface) and the render loop (renderOrbit — GL-gated via renderArtifact).

import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderArtifact } from './render-tool.mjs'

// Same sanitize rule as src/render-tool.mjs:derivePath — ids are ultimately file/model
// authored, so they must reduce to safe path characters and never escape the out dir.
const sanitize = (s) => String(s).replace(/[^a-zA-Z0-9._-]/g, '_')

const normalize360 = (d) => ((d % 360) + 360) % 360

/**
 * The evenly-spaced azimuths for an N-frame turntable. PURE — this is the AC #4 surface,
 * unit-testable with no GPU. Frames tile [0,360): the step is 360/N over i ∈ [0,N), so a
 * hypothetical frame N coincides with frame 0 (a seamless loop) rather than double-counting
 * the 0°/360° endpoint.
 * @param {number} frames a positive integer
 * @param {{ startDeg?: number }} [opts] phase offset (default 0 = the ticket's "0→360")
 * @returns {number[]} `frames` angles in [0,360), starting at `startDeg`
 */
export function orbitAzimuths (frames, { startDeg = 0 } = {}) {
  if (!Number.isInteger(frames) || frames <= 0) {
    throw new Error(`orbitAzimuths: frames must be a positive integer, got ${frames}`)
  }
  const step = 360 / frames
  return Array.from({ length: frames }, (_, i) => normalize360(startDeg + i * step))
}

/**
 * Front-arc OSCILLATION azimuths — a gentle sinusoidal rock of `amplitudeDeg` around
 * `centerDeg`, so the camera stays in the front hemisphere (showing depth/parallax from both
 * 3/4 sides) and never swings around to the flat back of a facade build. PURE (no GL),
 * seamless: `angle = center + amp·sin(2π·i/N)`, so a hypothetical frame N coincides with
 * frame 0 — a ping-pong loop with no double-counted endpoint. Sine-eased (slows at the
 * extremes), unlike a linear triangle. Keep `|center| + amplitude < ~90` to stay off the back.
 * @param {number} frames a positive integer
 * @param {{ centerDeg?: number, amplitudeDeg?: number }} [opts]
 * @returns {number[]} `frames` azimuths oscillating ±amplitude around center (normalized to [0,360))
 */
export function oscillateAzimuths (frames, { centerDeg = 0, amplitudeDeg = 40 } = {}) {
  if (!Number.isInteger(frames) || frames <= 0) {
    throw new Error(`oscillateAzimuths: frames must be a positive integer, got ${frames}`)
  }
  return Array.from({ length: frames }, (_, i) =>
    normalize360(centerDeg + amplitudeDeg * Math.sin((2 * Math.PI * i) / frames)))
}

/**
 * Per-frame PNG path with lexical order == angular order: the index is zero-padded so `ls`
 * and ffmpeg's `%0Nd` globbing both walk the frames in sweep order.
 * @param {string} dir       the build's orbit directory
 * @param {string} baseName  frame stem (sanitized)
 * @param {number} index     0-based frame index
 * @param {number} total     total frame count (sets the padding width)
 * @returns {string}
 */
export function orbitFramePath (dir, baseName, index, total) {
  const pad = Math.max(3, String(Math.max(0, total - 1)).length)
  return join(dir, `${sanitize(baseName)}.${String(index).padStart(pad, '0')}.png`)
}

/**
 * Default output directory for a build's frame sequence, under the gitignored render/out/
 * (render/.gitignore → out/), one subdir per build so sequences never collide with
 * build.png/sample.png or each other.
 * @param {string} [trialId]
 * @returns {string}
 */
export function defaultOrbitDir (trialId) {
  const safe = sanitize(trialId ?? '') || 'orbit'
  return fileURLToPath(new URL(`../out/orbit/${safe}/`, import.meta.url))
}

/**
 * @typedef {Object} FrameReport
 * @property {number} index
 * @property {number} azimuthDeg
 * @property {string} path
 * @property {number} bytes
 * @property {number} placed
 * @property {object[]} unmapped
 * @property {{min:number[],max:number[]}|null} bounds
 *
 * @typedef {Object} OrbitReport
 * @property {string} dir              the directory the frames were written to
 * @property {FrameReport[]} frames    one per azimuth, in sweep order
 * @property {object} view            the fixed framing used (azimuthDeg omitted — it varies)
 * @property {number[]} azimuths      the angles rendered (== frames.map(f => f.azimuthDeg))
 */

/**
 * Render a turntable: N frames of one artifact, sweeping azimuth 0→360° at fixed
 * elevation/distance. Reuses the head-on render path verbatim — only `view.azimuthDeg`
 * changes per frame. Frames are rendered SERIALLY (each renderArtifact spins up and tears
 * down a GL context + viewer workers; running them concurrently would multiply live GL
 * contexts).
 *
 * @param {{ metadata?: { trial_id?: string }, placements: object[] }} artifact a DesignArtifact
 * @param {{
 *   frames?: number,            // default 8
 *   startDeg?: number,          // default 0
 *   outDir?: string,            // default defaultOrbitDir(artifact.metadata.trial_id)
 *   baseName?: string,          // default 'frame'
 *   view?: object,              // partial view (elevation/fov/margin/size); azimuthDeg is set per frame
 *   strict?: boolean,           // passed to renderArtifact
 *   onFrame?: (f: FrameReport) => void  // progress callback
 * }} [opts]
 * @returns {Promise<OrbitReport>}
 */
export async function renderOrbit (artifact, opts = {}) {
  const {
    frames = 8,
    startDeg = 0,
    baseName = 'frame',
    view = {},
    strict,
    onFrame
  } = opts
  const outDir = opts.outDir ?? defaultOrbitDir(artifact?.metadata?.trial_id)
  // Default: a full 360° sweep. Callers may pass an explicit `azimuths` list (e.g. the
  // front-arc oscillation from oscillateAzimuths) to drive any path while reusing this loop.
  const azimuths = opts.azimuths ?? orbitAzimuths(frames, { startDeg })

  const reports = []
  for (let i = 0; i < azimuths.length; i++) {
    const azimuthDeg = azimuths[i]
    const outPath = orbitFramePath(outDir, baseName, i, azimuths.length)
    const r = await renderArtifact(artifact, { outPath, view: { ...view, azimuthDeg }, strict })
    const frame = {
      index: i,
      azimuthDeg,
      path: r.path,
      bytes: r.bytes,
      placed: r.placed,
      unmapped: r.unmapped,
      bounds: r.bounds
    }
    reports.push(frame)
    if (onFrame) onFrame(frame)
  }

  // The fixed framing actually used, with the (varying) azimuth removed.
  const { azimuthDeg: _omit, ...fixedView } = { ...view }
  return { dir: outDir, frames: reports, view: fixedView, azimuths }
}
