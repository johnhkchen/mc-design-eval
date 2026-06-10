// Component decomposition — the blob becomes NAMED COMPONENTS WITH GEOMETRY (T-103-01, story S-103,
// epic E-27). The E-25/E-26 finding: surfaces the pipeline re-authors from geometry pass; surfaces
// inherited raw from the decimated mesh fail every judge. To re-author the major masses (S-104
// roof-as-program, S-105 shaped vocabulary, S-106 component-aware skinning), the shell must first be
// segmented into components downstream code can fit parameters to: ROOF PLANES (normal, extent, eave
// edge, ridge candidate), WALL SLABS (plane + bounds), ATTACHED MASSES (separable volumes + junction
// — a church tower vs its nave), OPENING GROUPS (apertures with head/jamb geometry).
//
// The output is the component record (`component-record/v1`, schema/component-record.schema.json) —
// the SINGLE contract every E-27 consumer reads (Rule 4); no consumer-specific variants. Everything
// here derives from the structural read's primitives lifted into geometry; the GLB enters only as the
// fitted REFERENCE (Rule 1, src/form/component-glb-fit.mjs) — never as the segmentation substrate.
//
// Robustness note: the raw shells carry voxelization noise (276 protrusions / 23.9% ragged columns on
// the cottage — the E-27 motivating census). All ANALYSIS runs on a 3×3-median-smoothed heightfield,
// so the module tolerates both raw and T-102-regularized shells; raw per-column heights are reported
// beside the fits (rmseRaw) so the smoothing never hides what the shell actually is.
//
// PURE — no GL, no I/O, no Date/random. Deterministic: fixed scan orders, exact LSQ, stable ids.

import { solidOccupancy, occupancyFromCells } from "../view/occupancy.mjs";
import { openings } from "../view/structural-read.mjs";
import { projectSurface, orthoSpec } from "../view/surface-grid.mjs";

export const COMPONENT_RECORD_SCHEMA = "component-record/v1";

const SIDE_FACES = ["+x", "-x", "+z", "-z"];
const round3 = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return r === 0 ? 0 : r; // never emit -0 (JSON keeps it; byte-determinism cares)
};

// ---- record cell codec ------------------------------------------------------------------------

/**
 * Encode a list of plan cells `[x,z][]` as sorted row runs `[{z, x0, x1}]` — exact, diff-friendly,
 * and ~10× smaller than raw cell lists on building footprints. Inverse: {@link runCells}.
 */
export function columnRuns(cells) {
  const byZ = new Map();
  for (const [x, z] of cells) {
    if (!byZ.has(z)) byZ.set(z, []);
    byZ.get(z).push(x);
  }
  const runs = [];
  for (const z of [...byZ.keys()].sort((a, b) => a - b)) {
    const xs = byZ.get(z).sort((a, b) => a - b);
    let x0 = xs[0], x1 = xs[0];
    for (let i = 1; i < xs.length; i++) {
      if (xs[i] === x1) continue; // duplicate cell
      if (xs[i] === x1 + 1) { x1 = xs[i]; continue; }
      runs.push({ z, x0, x1 });
      x0 = x1 = xs[i];
    }
    runs.push({ z, x0, x1 });
  }
  return runs;
}

/** Decode {@link columnRuns} output back to `[x,z][]` (sorted by z then x). */
export function runCells(runs) {
  const cells = [];
  for (const { z, x0, x1 } of runs) for (let x = x0; x <= x1; x++) cells.push([x, z]);
  return cells;
}

// ---- plane fit --------------------------------------------------------------------------------

/**
 * Exact least-squares fit of the height plane `y = a·x + b·z + c` over `[{x,z,y}]`. Returned with a
 * unit normal (ny > 0), the fit centroid as `point`, and residual stats. Degenerate inputs (<3
 * cells, collinear columns) fall back to the horizontal plane through the mean height, flagged.
 * @returns {{normal:number[], point:number[], gradient:number[], rmse:number, maxResidual:number,
 *            cells:number, degenerate:boolean}}
 */
export function fitPlane(cells) {
  const n = cells.length;
  if (n === 0) return { normal: [0, 1, 0], point: [0, 0, 0], gradient: [0, 0], rmse: 0, maxResidual: 0, cells: 0, degenerate: true };
  let sx = 0, sz = 0, sy = 0, sxx = 0, szz = 0, sxz = 0, sxy = 0, szy = 0;
  for (const { x, z, y } of cells) {
    sx += x; sz += z; sy += y;
    sxx += x * x; szz += z * z; sxz += x * z;
    sxy += x * y; szy += z * y;
  }
  // normal equations for [a b c]: centered form avoids the explicit 3×3 solve
  const mx = sx / n, mz = sz / n, my = sy / n;
  const cxx = sxx - n * mx * mx, czz = szz - n * mz * mz, cxz = sxz - n * mx * mz;
  const cxy = sxy - n * mx * my, czy = szy - n * mz * my;
  const det = cxx * czz - cxz * cxz;
  let a = 0, b = 0, degenerate = false;
  if (n >= 3 && Math.abs(det) > 1e-9) {
    a = (cxy * czz - czy * cxz) / det;
    b = (czy * cxx - cxy * cxz) / det;
  } else {
    degenerate = true;
  }
  const c = my - a * mx - b * mz;
  let sse = 0, maxResidual = 0;
  for (const { x, z, y } of cells) {
    const r = y - (a * x + b * z + c);
    sse += r * r;
    if (Math.abs(r) > maxResidual) maxResidual = Math.abs(r);
  }
  // plane a·x + b·z − y + c = 0 → normal ∝ (a, −1, b); flip so ny > 0
  const len = Math.hypot(a, 1, b);
  return {
    normal: [round3(-a / len), round3(1 / len), round3(-b / len)],
    point: [round3(mx), round3(my), round3(mz)],
    gradient: [round3(a), round3(b)],
    rmse: round3(Math.sqrt(sse / n)),
    maxResidual: round3(maxResidual),
    cells: n,
    degenerate,
  };
}

// ---- heightfield ------------------------------------------------------------------------------

/**
 * Column heightfield of the SOLID occupancy: top y, bottom y, and solid-cell count per (x,z) column.
 * @returns {{h:Map<string,number>, bottom:Map<string,number>, count:Map<string,number>,
 *            bbox:{minX,maxX,minZ,maxZ}|null}}
 */
export function heightfield(occ) {
  const solid = solidOccupancy(occ);
  const h = new Map(), bottom = new Map(), count = new Map();
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const key of solid.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    const k = `${x},${z}`;
    if (!h.has(k) || y > h.get(k)) h.set(k, y);
    if (!bottom.has(k) || y < bottom.get(k)) bottom.set(k, y);
    count.set(k, (count.get(k) || 0) + 1);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const bbox = h.size ? { minX, maxX, minZ, maxZ } : null;
  return { h, bottom, count, bbox };
}

/**
 * 3×3 median smoothing of a heightfield's top surface — the ANALYSIS copy every segmentation step
 * reads. A single-column spike (the voxelization-noise class) is an outlier the median ignores; a
 * gable's slope line survives (the median of a monotone neighborhood is its center). Lower median on
 * even counts, for integer stability. Missing neighbors (footprint edge) just shrink the window.
 */
export function medianSmooth(hf) {
  const out = new Map();
  for (const k of hf.h.keys()) {
    const [x, z] = k.split(",").map(Number);
    const vals = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const v = hf.h.get(`${x + dx},${z + dz}`);
        if (v !== undefined) vals.push(v);
      }
    }
    vals.sort((a, b) => a - b);
    out.set(k, vals[Math.floor((vals.length - 1) / 2)]);
  }
  return { ...hf, h: out, raw: hf.h };
}
