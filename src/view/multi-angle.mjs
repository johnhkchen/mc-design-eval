// Multi-angle view reader — Path R, the READING lens (T-078-01, story S-078, epic E-23).
//
// READING from any angle is in scope (AC). This module renders a build through the E-22 FIXED LENS
// (supersampled, render/src/render.mjs via renderArtifact) from the 6 orthographic faces, the 45°
// diagonals, the canonical 3/4, and any ARBITRARY 3-axis angle. Perspective is fine here — the LLM is
// looking, not painting; the unambiguous-back-projection constraint belongs to Path P (surface-grid.mjs).
//
// The angle TABLE + the resolver are PURE and unit-tested; the GL render (`renderViews`) is the thin
// impure edge that lazy-imports the render tool, so the `src/**/*.test.mjs` glob stays GL-free.

import { BUILDING_VIEW_3Q } from "../building.mjs";

/** elevation for the 4 side elevations / diagonals — a slight downward tilt reads two faces + a hint of
 *  roof without parading the back (mirrors BUILDING_VIEW_3Q's gentle elevation). 0 would be a pure
 *  elevation; we keep a small tilt so a single render is legible. */
const SIDE_ELEV = 0;
const DIAG_ELEV = 30;

/** The named view table. Azimuth is measured around +Y from +Z toward +X (camera.mjs convention). The 6
 *  orthographic faces, the 4 ground diagonals (the 3/4 family), the top/bottom, and the canonical 3/4. */
export const VIEW_ANGLES = Object.freeze({
  ortho: Object.freeze({
    front: { azimuthDeg: 0, elevationDeg: SIDE_ELEV },   // looks toward -Z (the +Z-facing camera)
    back: { azimuthDeg: 180, elevationDeg: SIDE_ELEV },
    right: { azimuthDeg: 90, elevationDeg: SIDE_ELEV },
    left: { azimuthDeg: 270, elevationDeg: SIDE_ELEV },
    top: { azimuthDeg: 0, elevationDeg: 89.9 },          // ~plan view (90 is degenerate up-vector)
    bottom: { azimuthDeg: 0, elevationDeg: -89.9 },
  }),
  diag: Object.freeze([
    { name: "+x+z", azimuthDeg: 45, elevationDeg: DIAG_ELEV },
    { name: "+x-z", azimuthDeg: 135, elevationDeg: DIAG_ELEV },
    { name: "-x-z", azimuthDeg: 225, elevationDeg: DIAG_ELEV },
    { name: "-x+z", azimuthDeg: 315, elevationDeg: DIAG_ELEV },
  ]),
  threeQuarter: { azimuthDeg: BUILDING_VIEW_3Q.azimuthDeg, elevationDeg: BUILDING_VIEW_3Q.elevationDeg, fov: BUILDING_VIEW_3Q.fov },
});

/** Flat name→view map for the named angles (ortho + diag + threeQuarter). */
const NAMED = (() => {
  const m = new Map();
  for (const [k, v] of Object.entries(VIEW_ANGLES.ortho)) m.set(k, v);
  for (const d of VIEW_ANGLES.diag) m.set(d.name, { azimuthDeg: d.azimuthDeg, elevationDeg: d.elevationDeg });
  m.set("threeQuarter", VIEW_ANGLES.threeQuarter);
  return m;
})();

/**
 * Resolve an angle spec to a render `view` partial. Accepts a NAMED angle (any key of the table —
 * `front`, `+x+z`, `threeQuarter`, …) or an ARBITRARY `{azimuthDeg, elevationDeg[, fov]}` (reading any
 * angle is in scope). Throws on an unknown name or a non-finite arbitrary angle. PURE.
 * @param {string|{azimuthDeg:number, elevationDeg:number, fov?:number}} angle
 * @returns {{azimuthDeg:number, elevationDeg:number, fov?:number}}
 */
export function resolveAngle(angle) {
  if (typeof angle === "string") {
    const v = NAMED.get(angle);
    if (!v) throw new Error(`multi-angle: unknown named angle "${angle}" (have ${[...NAMED.keys()].join(", ")})`);
    return { ...v };
  }
  if (angle && Number.isFinite(angle.azimuthDeg) && Number.isFinite(angle.elevationDeg)) {
    const out = { azimuthDeg: angle.azimuthDeg, elevationDeg: angle.elevationDeg };
    if (Number.isFinite(angle.fov)) out.fov = angle.fov;
    return out;
  }
  throw new Error(`multi-angle: angle must be a known name or {azimuthDeg,elevationDeg}, got ${JSON.stringify(angle)}`);
}

/**
 * Render a build from each requested angle through the E-22 fixed lens. IMPURE — lazy-imports the render
 * tool (GL); one `renderArtifact` per angle. `angles` is a list of names and/or arbitrary specs.
 * @param {{placements:object[]}} artifact
 * @param {(string|object)[]} angles
 * @param {{outDir:string, supersample?:number, width?:number, height?:number, label?:(a:any,i:number)=>string}} opts
 * @returns {Promise<{angle:any, view:object, path:string, bytes:number}[]>}
 */
export async function renderViews(artifact, angles, opts = {}) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const { mkdir } = await import("node:fs/promises");
  const { join } = await import("node:path");
  if (!opts.outDir) throw new Error("renderViews: opts.outDir is required");
  await mkdir(opts.outDir, { recursive: true });
  const labelOf = opts.label || ((a, i) => (typeof a === "string" ? a : `angle${i}`));
  const out = [];
  for (let i = 0; i < angles.length; i++) {
    const angle = angles[i];
    const view = resolveAngle(angle);
    if (opts.width) view.width = opts.width;
    if (opts.height) view.height = opts.height;
    const path = join(opts.outDir, `view-${labelOf(angle, i)}.png`);
    const ss = opts.supersample === undefined ? {} : { supersample: opts.supersample };
    const r = await renderArtifact(artifact, { outPath: path, view, ...ss });
    out.push({ angle, view, path: r.path, bytes: r.bytes });
  }
  return out;
}
