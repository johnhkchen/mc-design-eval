// SILHOUETTE-RESIDUAL pass — protruding masses the GLB does not show, removed under the cage
// (T-109-01, story S-109, epic E-28).
//
// The roof program byte-protects "chimneys" via chimneyColumns: record protrusion-role masses ∪
// the geometric stack derivation. That protection is IDENTITY-BLIND — the gatehouse records THREE
// protrusion masses that are blob residue (its concept has no chimney), and the resemblance
// majors name them ("chimney-like protrusions"). This pass RE-GROUNDS the protection in the GLB:
//
//   SHOWN(mass, azimuth) ⇔ the mass's silhouette — rasterized under the FULL build's camera and
//   normalized under the FULL build's crop — spills 0 px outside the GLB's normalized silhouette
//   after a ONE-VOXEL dilation (ceil(grid / longest-build-axis-in-cells) grid px — the
//   quantization allowance, derived from geometry, never tuned).
//
//   AGGREGATION (measured, not assumed): at the gate cameras' 30° elevation a roof's TOP FACE
//   projects as a wide band, so a blob wart on the camera-NEAR side hides INSIDE the silhouette
//   at that one azimuth — interior pixels attest nothing. A mass the GLB truly contains is
//   spill-free at EVERY azimuth (its own outline is in the reference, quantization absorbed by
//   the dilation); a mass the GLB lacks is REFUTED wherever the view separates it. So: EXEMPT ⇔
//   shown at ALL azimuths; refuted at ≥1 azimuth → unsupported, removal proposed.
//
// An exempt mass (the cottage chimney — it is in the GLB) is logged with its evidence; an
// unsupported mass (the gatehouse lumps — they are not) is removed, each removal judged by the
// cage's own checks (silhouette-IoU
// floors at every azimuth anchored to the pass input, closure no-regress, protect violations —
// reused from shell-regularize/shell-integrity, the roof-swap precedent, Rule 2) and rolled back
// on any regression. Every decision — exempt, removed, rolled back — is logged with its
// per-azimuth spill evidence. Membership is measured on the PASS INPUT occupancy (one stable
// camera framing for all candidates); removals thread sequentially through the judged occupancy.
//
// PURE — no I/O, no GL, no Date/random; runs under the `src/**/*.test.mjs` glob.

import { componentLabels } from "../form/voxel-components.mjs";
import { rasterizeSilhouette } from "../form/glb-silhouette.mjs";
import { normalizeSilhouette } from "../form/form-fidelity.mjs";
import { runCells } from "../form/component-decompose.mjs";
import {
  REGULARIZE_DEFAULTS, exposedFaceMesh, voxelSilhouettes, silhouetteIoUs,
  protrudingStackRegion, protectViolations,
} from "./shell-regularize.mjs";
import { closureCheck } from "./shell-integrity.mjs";
import { occupancyFromCells } from "./occupancy.mjs";
import { resolveAngle } from "./multi-angle.mjs";

/** Schema tag for residual-pass logs embedded in durable records. */
export const RESIDUAL_SCHEMA = "silhouette-residual/v1";

const keyPos = (k) => k.split(",").map(Number);
const round4 = (x) => Math.round(x * 1e4) / 1e4;

/**
 * Candidate protruding masses: 26-connected components of (record protrusion-mass cells — plan
 * columns at y ≥ yRange[0]) ∪ (the geometric stack region's cells). Exactly the population that
 * chimneyColumns blanket-protects — now enumerated for arbitration. Deterministic order: size
 * desc, then smallest key; ids `res-0…`. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {object|null} record component-record/v1 (masses) — null tolerated (stack-only)
 * @returns {{id:string, cells:Set<string>, columns:Set<string>, size:number}[]}
 */
export function protrusionCandidates(occ, record) {
  const pool = new Set();
  const stack = protrudingStackRegion(occ);
  for (const key of occ.cells.keys()) {
    if (occ.forms?.has(key)) continue;
    const pos = keyPos(key);
    if (stack.contains(pos)) pool.add(key);
  }
  for (const mass of record?.masses ?? []) {
    if (mass.role !== "protrusion") continue;
    const yLo = Number.isFinite(mass.yRange?.[0]) ? mass.yRange[0] : null;
    if (yLo === null) continue;
    const cols = new Set(runCells(mass.plan?.runs ?? []).map(([x, z]) => `${x},${z}`));
    for (const key of occ.cells.keys()) {
      if (occ.forms?.has(key)) continue;
      const [x, y, z] = keyPos(key);
      if (y >= yLo && cols.has(`${x},${z}`)) pool.add(key);
    }
  }
  if (!pool.size) return [];

  const keys = [...pool].sort();
  const flat = new Int32Array(keys.length * 3);
  keys.forEach((k, i) => {
    const [x, y, z] = keyPos(k);
    flat[i * 3] = x; flat[i * 3 + 1] = y; flat[i * 3 + 2] = z;
  });
  const { labels, sizes } = componentLabels({ occupied: flat, count: keys.length }, { connectivity: 26 });
  const byLabel = new Map();
  keys.forEach((k, i) => {
    const l = labels[i];
    if (!byLabel.has(l)) byLabel.set(l, []);
    byLabel.get(l).push(k);
  });
  const comps = [...byLabel.values()]
    .map((cellKeys) => ({ cellKeys, size: cellKeys.length, minKey: cellKeys[0] }))
    .sort((a, b) => b.size - a.size || (a.minKey < b.minKey ? -1 : 1));
  return comps.map((c, i) => ({
    id: `res-${i}`,
    cells: new Set(c.cellKeys),
    columns: new Set(c.cellKeys.map((k) => { const [x, , z] = keyPos(k); return `${x},${z}`; })),
    size: c.size,
  }));
}

/** Chebyshev dilation of a normalized binary mask by `r` grid px. */
function dilateMask(mask, r) {
  const { w, h, data } = mask;
  const out = new Uint8Array(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!data[y * w + x]) continue;
      const y0 = Math.max(0, y - r), y1 = Math.min(h - 1, y + r);
      const x0 = Math.max(0, x - r), x1 = Math.min(w - 1, x + r);
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) out[yy * w + xx] = 1;
    }
  }
  return { w, h, data: out };
}

/** One voxel's worth of normalized-grid pixels for this occupancy (the quantization allowance). */
function voxelGridRadius(occ, grid) {
  const { min, max } = occ.bounds;
  const longest = Math.max(max[0] - min[0] + 1, max[1] - min[1] + 1, max[2] - min[2] + 1);
  return Math.max(1, Math.ceil(grid / longest));
}

/**
 * Per-azimuth GLB-silhouette membership of one mass. The mass rasters under the FULL build's
 * camera (exposedFaceMesh subset keeps the full bounds) and normalizes under the FULL build's
 * crop; the GLB side normalizes exactly as silhouetteIoUs does, then dilates by the one-voxel
 * allowance. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ the PASS INPUT occupancy
 * @param {Set<string>} cells the mass's cell keys
 * @param {Record<string, object>} refSils azimuth → rasterizeSilhouette of the GLB
 * @param {{grid?:number, fullSils?:Record<string,object>}} [opts] fullSils = precomputed
 *   voxelSilhouettes(occ, azimuths) (the caller computes once for all candidates)
 * @returns {{perAzimuth:Record<string,{massPx:number, spillPx:number, spillFrac:number}>,
 *            shownAt:string[], dilationPx:number}}
 */
export function massSpill(occ, cells, refSils, { grid = REGULARIZE_DEFAULTS.grid, fullSils = null } = {}) {
  const azimuths = Object.keys(refSils);
  const full = fullSils ?? voxelSilhouettes(occ, azimuths);
  const massMesh = exposedFaceMesh(occ, { cells });
  const r = voxelGridRadius(occ, grid);
  const perAzimuth = {};
  const shownAt = [];
  for (const a of azimuths) {
    const massSil = rasterizeSilhouette(massMesh, { view: resolveAngle(a) });
    const massNorm = normalizeSilhouette(massSil, { grid, fit: "aspect", bbox: full[a].bbox });
    const glbNorm = dilateMask(normalizeSilhouette(refSils[a], { grid, fit: "aspect" }), r);
    let spill = 0;
    for (let i = 0; i < massNorm.data.length; i++) {
      if (massNorm.data[i] && !glbNorm.data[i]) spill++;
    }
    perAzimuth[a] = {
      massPx: massNorm.fgCount,
      spillPx: spill,
      spillFrac: massNorm.fgCount ? round4(spill / massNorm.fgCount) : 0,
    };
    if (spill === 0) shownAt.push(a);
  }
  return { perAzimuth, shownAt, dilationPx: r };
}

/** Remove a key set from an occupancy (solid cells only; fixtures/states carried). */
function withoutCells(occ, cells) {
  const kept = [];
  for (const [key, block] of occ.cells) {
    if (cells.has(key) && !occ.forms?.has(key)) continue;
    kept.push({ pos: keyPos(key), block, form: occ.forms?.get(key), state: occ.states?.get(key) });
  }
  return occupancyFromCells(kept);
}

/**
 * THE PASS: enumerate candidates, arbitrate each against the GLB silhouette, remove the
 * unsupported ones under the cage. See the header for the decision rule. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ the post-swap/post-termination shell
 * @param {{record:object|null, refSils:Record<string,object>, regions?:object[],
 *          protect?:{name:string,contains:Function}[], grid?:number, iouTolerance?:number}} args
 * @returns {{occ:import("./occupancy.mjs").Occupancy, removedCells:number, dilationPx:number|null,
 *            log:{id:string, size:number, perAzimuth:object, shownAt:string[],
 *                 refutedAt:string[], outcome:string, reasons:string[]}[]}}
 */
export function residualPass(occ, {
  record = null, refSils, regions = [], protect = [],
  grid = REGULARIZE_DEFAULTS.grid, iouTolerance = REGULARIZE_DEFAULTS.iouTolerance,
}) {
  if (!refSils || typeof refSils !== "object") {
    throw new Error("residualPass: refSils (azimuth → GLB silhouette) required — membership IS the GLB");
  }
  const candidates = protrusionCandidates(occ, record);
  if (!candidates.length) return { occ, removedCells: 0, dilationPx: null, log: [] };

  const azimuths = Object.keys(refSils);
  const fullSils = voxelSilhouettes(occ, azimuths);
  const baseline = silhouetteIoUs(occ, refSils, { grid });
  const inputClosure = closureCheck(occ, { regions });

  let occCur = occ;
  let removedCells = 0;
  let dilationPx = null;
  const log = [];
  for (const cand of candidates) {
    const spill = massSpill(occ, cand.cells, refSils, { grid, fullSils });
    dilationPx = spill.dilationPx;
    const refutedAt = azimuths.filter((a) => !spill.shownAt.includes(a));
    const entry = { id: cand.id, size: cand.size, perAzimuth: spill.perAzimuth,
      shownAt: spill.shownAt, refutedAt };

    if (refutedAt.length === 0) {
      log.push({ ...entry, outcome: "exempt-shown", reasons: ["GLB accounts for the mass at every gate azimuth"] });
      continue;
    }
    let touchesProtect = false;
    for (const key of cand.cells) {
      if (protect.some((p) => p.contains(keyPos(key)))) { touchesProtect = true; break; }
    }
    if (touchesProtect) {
      log.push({ ...entry, outcome: "exempt-protected", reasons: ["intersects a caller-protected region"] });
      continue;
    }

    // removal, judged by the cage's own checks (anchored to the pass input)
    const candidateOcc = withoutCells(occCur, cand.cells);
    const reasons = [];
    const final = silhouetteIoUs(candidateOcc, refSils, { grid });
    for (const a of azimuths) {
      if (final[a] < baseline[a] - iouTolerance) {
        reasons.push(`silhouette IoU regressed @ ${a}: ${round4(final[a])} < ${round4(baseline[a])} − ${iouTolerance}`);
      }
    }
    const closure = closureCheck(candidateOcc, { regions });
    if (inputClosure.closed ? !closure.closed : closure.reached > inputClosure.reached) {
      reasons.push(`closure regressed: reached ${inputClosure.reached} → ${closure.reached}`);
    }
    const violations = protectViolations(occCur, candidateOcc, protect);
    if (violations > 0) reasons.push(`protected regions touched: ${violations} cells`);

    if (reasons.length) {
      log.push({ ...entry, outcome: "rolled-back", reasons });
    } else {
      occCur = candidateOcc;
      removedCells += cand.size;
      log.push({ ...entry, outcome: "removed", reasons: [] });
    }
  }
  return { occ: occCur, removedCells, dilationPx, log };
}
