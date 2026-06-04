// The construct+render composition core (T-003-04; AC #1 + AC #2 + AC #4).
//
// The ONE place an artifact becomes a PNG. Combines the two halves built before it —
// T-003-02 world construction (world.mjs) and T-003-03 headless render (render.mjs) —
// into a single named unit with a useful return shape. Render-domain and SDK-free on
// purpose: the Agent SDK wrapper that exposes this to the harness lives top-level in
// src/render-tool.mjs (where the SDK is declared); this layer just builds and renders.
//
// Stateless by construction: buildWorldFromArtifact creates a FRESH empty world every
// call (there is no shared, cached world), so "reset state between trials" (AC #2) is a
// property of having no state to reset — sequential calls cannot bleed into each other.

import { buildWorldFromArtifact } from './world.mjs'
import { renderBuild, GL_AVAILABLE, GL_LOAD_ERROR } from './render.mjs'

// Re-export the GL gate so callers (and tests) can skip without a second import.
export { GL_AVAILABLE, GL_LOAD_ERROR }

/**
 * @typedef {import('./world.mjs').Unmapped} Unmapped
 * @typedef {Object} RenderReport The union of the T-003-02 build report and the
 *   T-003-03 render report, computed in one pass.
 * @property {string} path              the written PNG's path (AC #1 currency)
 * @property {number} bytes             PNG size in bytes
 * @property {number} placed            voxels actually written into the world
 * @property {Unmapped[]} unmapped      voxels skipped (unknown/illegal block) + reasons
 * @property {{min:number[],max:number[]}|null} bounds  build extent (null = empty build)
 * @property {object} view              the framing actually used (from renderBuild)
 */

/**
 * Construct the voxel world from a (schema-valid) design artifact, render it headless,
 * and return the combined build+render report. A fresh world is built every call.
 *
 * Schema validity is assumed here (the SDK wrapper validates at its door with
 * parseArtifact — defense in depth). Construction is TOTAL: an unmappable block is
 * skipped and recorded in `unmapped`, never thrown, so a partial build still renders
 * and the count is visible to the caller. An all-unmapped artifact (`bounds == null`)
 * still returns a path — renderBuild degrades to its constant-offset fallback.
 *
 * @param {{ placements: object[] }} artifact
 * @param {{ outPath?: string, view?: object, strict?: boolean }} [opts]
 *   `outPath` — where to write the PNG (renderBuild default if omitted).
 *   `view`    — partial framing override (camera.mjs DEFAULT_VIEW otherwise).
 *   `strict`  — throw (after the full scan) if any voxel is unmapped.
 * @returns {Promise<RenderReport>}
 */
export async function renderArtifact (artifact, opts = {}) {
  const build = await buildWorldFromArtifact(artifact, { strict: opts.strict })
  const r = await renderBuild(build, { outPath: opts.outPath, view: opts.view })
  return {
    path: r.path,
    bytes: r.bytes,
    placed: build.placed,
    unmapped: build.unmapped,
    bounds: build.bounds,
    view: r.view
  }
}
