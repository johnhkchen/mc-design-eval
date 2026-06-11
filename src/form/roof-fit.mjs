// Roof fit core — gable parameters from the component record (T-104-01, story S-104, epic E-27).
//
// THE REFERENCE IS THE SPEC, NOT THE SUBSTRATE (E-27 Rule 1): the sampled roof blob is replaced by
// a roof REGENERATED from fitted parameters. This module does the fitting — and it fits against the
// COMPONENT RECORD (component-record/v1, T-103), not the GLB file: the record's per-plane `glbFit`
// IS the least-squares fit of the GLB roof region (area-weighted over the extent-bound, angle-gated
// triangle cone — component-glb-fit.mjs), and Rule 4 says components are the contract — no
// re-derivation where a definition exists.
//
// PARAMETER SOURCING (recorded, never silent):
//   • pitch — from `glbFit.gradient` when the GLB fit exists, agrees with the voxel fit within
//     `pitchAgreeDeg`, and is geometrically sane; otherwise from `voxelFit.gradient` with a named
//     `fit-source-voxel` finding. The aabb-affine glbFits are honest-but-approximate (cottage
//     roof-0: rmse 8.35, offsetDelta 4.42) — the agreement gate is what keeps a wild GLB fit from
//     dictating an invented slope.
//   • positions (eave line, ridge height, footprint) — anchored to the VOXEL fits and extents: the
//     regularized shell is itself cage-held against the GLB (T-102), and the glbFit vertical offset
//     under aabb-affine alignment is unreliable (offsetDelta up to 4.4 cells on committed records).
//     Pitch is the GLB-fittable parameter; where the building stands is the as-built truth.
//   • overhang — MEASURED (eave edge vs the matching wall-slab plane) and recorded; `null` + a
//     named finding when no wall slab matches (the record carries slab-low-coverage findings).
//
// A gable that cannot be parameterized sanely (`sane:false`, reasons named) is NOT generated — the
// regularized sampled roof stays for its region (Rule 1's honest fallback, never an invented
// shape). Flat planes and unpaired pitched fragments are named `roof-region-unfitted` and left to
// the cage-regularized mass.
//
// PURE — no I/O, no GL, no Date/random; runs under the `src/**/*.test.mjs` glob.

import { runCells } from "./component-decompose.mjs";

/** Schema tag for fit results embedded in durable records. */
export const ROOF_FIT_SCHEMA = "roof-fit/v1";

/** Declared fit tolerances — shared across subjects, never subject-tuned (E-25 Rule 3). */
export const ROOF_FIT_DEFAULTS = Object.freeze({
  pitchAgreeDeg: 15,    // glbFit usable when angleToVoxelDeg ≤ this; otherwise voxel fit + finding
  programRmseTol: 0.75, // generated surface vs chosen plane, RMSE in cells — the Rule 1 gate
  minRun: 2,            // ridge→eave horizontal run floor (a 1-cell "roof" is not a slope)
  maxPitch: 4,          // rise/run ceiling (steeper reads as a wall, not a roof)
});

const roundHalf = (v) => Math.round(v * 2) / 2;
const round3 = (v) => Math.round(v * 1e3) / 1e3;

/** Height of a recorded plane fit (`y = a·x + b·z + c`, c recovered from the fit centroid). */
export function planeHeightAt(fit, x, z) {
  const [a, b] = fit.gradient;
  const c = fit.point[1] - a * fit.point[0] - b * fit.point[2];
  return a * x + b * z + c;
}

/** Signed pitch of a plane fit along its eave (run) axis: positive = falls toward the eave. */
function pitchToward(fit, eaveDir, runIdx) {
  const g = fit.gradient[runIdx];
  return eaveDir.startsWith("+") ? -g : g;
}

/** Eave-edge coordinate along the run axis (the outermost eave cell toward the eave direction). */
function eaveEdgeCoord(eaveCells, eaveDir) {
  const idx = eaveDir[1] === "x" ? 0 : 1;
  let edge = null;
  for (const cell of eaveCells) {
    const v = cell[idx];
    if (edge === null) edge = v;
    else edge = eaveDir.startsWith("+") ? Math.max(edge, v) : Math.min(edge, v);
  }
  return edge;
}

/**
 * One side of a gable: pitch (source-selected), eave line, overhang. Returns `{side, findings}`;
 * `side.reasons` is non-empty when the side cannot be parameterized sanely.
 */
function fitSide(plane, ridgeAxis, wallSlabs, opts) {
  const findings = [];
  const reasons = [];
  const eaveDir = plane.eave?.dir ?? null;
  const runAxisChar = ridgeAxis === "z" ? "x" : "z";
  const runIdx = runAxisChar === "x" ? 0 : 1;
  if (!eaveDir || eaveDir[1] !== runAxisChar) {
    reasons.push(`eave dir ${eaveDir ?? "null"} not perpendicular to ridge axis ${ridgeAxis}`);
  }

  // pitch source selection (glb-first under the agreement gate; voxel fallback is NAMED)
  const vPitch = eaveDir ? pitchToward(plane.voxelFit, eaveDir, runIdx) : null;
  const gPitch = eaveDir && plane.glbFit ? pitchToward(plane.glbFit, eaveDir, runIdx) : null;
  const saneP = (p) => p !== null && p > 0 && p <= opts.maxPitch;
  let pitch = null;
  let pitchSource = null;
  if (gPitch !== null && plane.glbFit.angleToVoxelDeg <= opts.pitchAgreeDeg && saneP(gPitch)) {
    pitch = gPitch;
    pitchSource = "glb";
  } else if (saneP(vPitch)) {
    pitch = vPitch;
    pitchSource = "voxel";
    findings.push({
      code: "fit-source-voxel",
      where: plane.id,
      detail: plane.glbFit
        ? `glb fit ${saneP(gPitch) ? `disagrees (${plane.glbFit.angleToVoxelDeg}° > ${opts.pitchAgreeDeg}°)` : `insane pitch ${gPitch === null ? "n/a" : round3(gPitch)}`} — voxel gradient stands (the cage-held shell)`
        : "glb fit missing on this plane — voxel gradient stands (the cage-held shell)",
    });
  } else {
    reasons.push(`no sane pitch (voxel ${vPitch === null ? "n/a" : round3(vPitch)}, glb ${gPitch === null ? "n/a" : round3(gPitch)})`);
  }

  // positions anchor to the voxel reality (see header): eave line from the voxel plane over the
  // recorded eave cells; the edge coordinate from the cells themselves.
  const eaveCells = plane.eave?.cells ? runCells(plane.eave.cells) : [];
  let eaveY = null;
  let eaveEdge = null;
  if (eaveCells.length && eaveDir) {
    let sum = 0;
    for (const [x, z] of eaveCells) sum += planeHeightAt(plane.voxelFit, x, z);
    eaveY = roundHalf(sum / eaveCells.length);
    eaveEdge = eaveEdgeCoord(eaveCells, eaveDir);
  } else {
    reasons.push("no eave cells recorded");
  }

  // overhang: measured against the owning mass's wall slab in the eave direction, when present
  let overhang = null;
  const slab = (wallSlabs ?? []).find((s) => s.massId === plane.massId && s.dir === eaveDir);
  if (slab && eaveEdge !== null) {
    overhang = eaveDir.startsWith("+") ? eaveEdge - slab.value : slab.value - eaveEdge;
  } else if (eaveDir) {
    findings.push({
      code: "overhang-unmeasured",
      where: plane.id,
      detail: `no wall slab for ${plane.massId} @ ${eaveDir} — overhang reported null, footprint stays as-built`,
    });
  }

  const side = {
    planeId: plane.id,
    eaveDir,
    pitch: pitch === null ? null : round3(pitch),
    pitchSource,
    glbAngleDeg: plane.glbFit?.angleToVoxelDeg ?? null,
    voxelPitch: vPitch === null ? null : round3(vPitch),
    glbPitch: gPitch === null ? null : round3(gPitch),
    eaveY,
    eaveEdge,
    overhang,
    extentCells: runCells(plane.extent.runs),
    reasons,
  };
  return { side, findings };
}

/**
 * Surface height of one gable side at a column: eave line rising at the fitted pitch toward the
 * ridge, capped at the ridge height. The generator and the fit-error measure share this single
 * definition.
 */
export function evalSideHeight(side, ridgeY, x, z) {
  const v = side.eaveDir[1] === "x" ? x : z;
  const dist = side.eaveDir.startsWith("+") ? side.eaveEdge - v : v - side.eaveEdge;
  return Math.min(ridgeY, side.eaveY + side.pitch * dist);
}

/**
 * Extract parametric gables from a component record: one per reciprocal ridge pair of pitched
 * planes. Every plane that does not participate in a sane gable is a NAMED finding — flat planes,
 * unpaired fragments, broken pairs (Rule 1: the regularized mass stays for those regions).
 * @param {object} record component-record/v1 JSON
 * @param {object} [opts] ROOF_FIT_DEFAULTS overrides (declared by the caller's record)
 * @returns {{gables:object[], findings:object[]}}
 */
export function gablesFromRecord(record, opts = {}) {
  const o = { ...ROOF_FIT_DEFAULTS, ...opts };
  const planes = record.roofPlanes ?? [];
  const byId = new Map(planes.map((p) => [p.id, p]));
  const used = new Set();
  const gables = [];
  const findings = [];

  for (const p of planes) {
    if (used.has(p.id) || p.kind !== "pitched" || !p.ridge) continue;
    const q = byId.get(p.ridge.withPlane);
    if (!q || q.kind !== "pitched" || !q.ridge || q.ridge.withPlane !== p.id) {
      used.add(p.id);
      findings.push({ code: "roof-region-unfitted", where: p.id, detail: "ridge pair not reciprocal — regularized mass stays" });
      continue;
    }
    used.add(p.id);
    used.add(q.id);

    const reasons = [];
    if (q.ridge.axis !== p.ridge.axis) reasons.push(`ridge axes disagree (${p.ridge.axis} vs ${q.ridge.axis})`);
    const axis = p.ridge.axis;
    const ridgeY = roundHalf((p.ridge.y + q.ridge.y) / 2);

    const a = fitSide(p, axis, record.wallSlabs, o);
    const b = fitSide(q, axis, record.wallSlabs, o);
    findings.push(...a.findings, ...b.findings);
    reasons.push(...a.side.reasons, ...b.side.reasons);
    const sides = [a.side, b.side];

    if (a.side.eaveDir && b.side.eaveDir) {
      const opposite = a.side.eaveDir[1] === b.side.eaveDir[1] && a.side.eaveDir[0] !== b.side.eaveDir[0];
      if (!opposite) reasons.push(`eave dirs not opposing (${a.side.eaveDir} vs ${b.side.eaveDir})`);
    }

    // footprint: union of both extents plus the ridge cells (the ridge line can sit between them)
    const cols = new Set();
    const bbox = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
    for (const cells of [a.side.extentCells, b.side.extentCells, runCells(p.ridge.cells ?? [])]) {
      for (const [x, z] of cells) {
        cols.add(`${x},${z}`);
        if (x < bbox.minX) bbox.minX = x;
        if (x > bbox.maxX) bbox.maxX = x;
        if (z < bbox.minZ) bbox.minZ = z;
        if (z > bbox.maxZ) bbox.maxZ = z;
      }
    }

    // sanity: ridge above both eaves, a real run on both sides
    for (const s of sides) {
      if (s.eaveY !== null && ridgeY <= s.eaveY + 0.5) reasons.push(`ridge y ${ridgeY} not above eave y ${s.eaveY} (${s.planeId})`);
      if (s.eaveEdge !== null) {
        const ridgeCells = runCells(p.ridge.cells ?? []);
        const idx = s.eaveDir?.[1] === "x" ? 0 : 1;
        if (ridgeCells.length && s.eaveDir) {
          let sum = 0;
          for (const c of ridgeCells) sum += c[idx];
          const run = Math.abs(sum / ridgeCells.length - s.eaveEdge);
          s.run = round3(run);
          if (run < o.minRun) reasons.push(`run ${round3(run)} < minRun ${o.minRun} (${s.planeId})`);
        }
      }
    }

    // hip demand: the footprint extends past the ridge ends along the ridge axis
    const ridgeCells = runCells(p.ridge.cells ?? []);
    const rIdx = axis === "x" ? 0 : 1;
    let rLo = Infinity;
    let rHi = -Infinity;
    for (const c of ridgeCells) {
      if (c[rIdx] < rLo) rLo = c[rIdx];
      if (c[rIdx] > rHi) rHi = c[rIdx];
    }
    const fLo = axis === "x" ? bbox.minX : bbox.minZ;
    const fHi = axis === "x" ? bbox.maxX : bbox.maxZ;
    const hip = {
      lo: Number.isFinite(rLo) && rLo > fLo + 1,
      hi: Number.isFinite(rHi) && rHi < fHi - 1,
      ridgeLo: Number.isFinite(rLo) ? rLo : null,
      ridgeHi: Number.isFinite(rHi) ? rHi : null,
    };
    hip.demanded = hip.lo || hip.hi;

    const gable = {
      id: `gable-${p.id}-${q.id}`,
      ridge: { axis, y: ridgeY },
      sides,
      footprint: { cols, bbox, area: cols.size },
      hip,
      sane: reasons.length === 0,
      reasons,
    };
    if (!gable.sane) {
      findings.push({ code: "gable-insane", where: gable.id, detail: reasons.join("; ") });
    }
    gables.push(gable);
  }

  for (const p of planes) {
    if (used.has(p.id)) continue;
    findings.push({
      code: "roof-region-unfitted",
      where: p.id,
      detail: `${p.kind}${p.ridge ? "" : ", no ridge pair"} (area ${p.extent.area}) — regularized mass stays`,
    });
  }

  return { gables, findings };
}

/**
 * The recorded FIT ERROR (Rule 1): RMSE of the generated column heights against each side's chosen
 * plane (evalSideHeight), over that side's own extent. Gates the gable at `programRmseTol`.
 * @param {object} gable a sane gable from {@link gablesFromRecord}
 * @param {Map<string,number>} heights generated column heights ("x,z" → top level, halves)
 * @returns {{perSide:{planeId:string, rmse:number|null, cells:number}[], rmse:number|null}}
 */
export function programFitError(gable, heights) {
  const perSide = [];
  let sse = 0;
  let n = 0;
  for (const side of gable.sides) {
    let s = 0;
    let m = 0;
    for (const [x, z] of side.extentCells) {
      const got = heights.get(`${x},${z}`);
      if (got === undefined) continue;
      const want = evalSideHeight(side, gable.ridge.y, x, z);
      const r = got - want;
      s += r * r;
      m++;
    }
    perSide.push({ planeId: side.planeId, rmse: m ? round3(Math.sqrt(s / m)) : null, cells: m });
    sse += s;
    n += m;
  }
  return { perSide, rmse: n ? round3(Math.sqrt(sse / n)) : null };
}
