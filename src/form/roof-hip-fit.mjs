// Hip / pyramidal-cap fit — the missing roof family members (T-112-01, story S-112, epic E-29).
//
// The construction vocabulary fits gable slopes, ridges, verges and arches, but any tower,
// hip-roofed mass or pavilion is UNFITTABLE BY CONSTRUCTION: a pyramidal cap read as a ridge
// pair is an insane gable (the church tower's T-110 named fallback — "no sane pitch (voxel 19,
// glb 189.361)"). This module fits the two missing shapes:
//
//   • fitHipCap — a PYRAMIDAL CAP / HIP CAP over a component mass: four eave-anchored face
//     planes meeting at a constructed apex (square-ish footprint) or a short emergent ridge
//     (elongated footprint — the same min-of-planes surface realizes both). The result is a
//     FOUR-SIDED GABLE consumed by the existing single surface definition
//     (roof-fit gableSurfaceHeight iterates sides generically), so the generator, the
//     fit-error measure and the cage path are reused, never paralleled.
//   • fitHipEnds — a HIP END: the slope plane replacing a gable triangle at a roof end,
//     fitted per demanded end from the GLB (today's realization uses the mean of the side
//     pitches, a heuristic the gatehouse showed can be invented). The fitted pitch rides the
//     gable as `hip.fitted.{lo,hi}` and roof-fit's hipEndPlanes prefers it.
//
// PARAMETER SOURCING (the E-27/E-28 doctrine, unchanged): positions anchor to the AS-BUILT
// occupancy (the cap footprint is the occupied cross-section at the band floor; eave edges are
// the footprint bbox); slopes are the GLB-fittable parameter — a recorded plane's source-selected
// pitch where one exists, otherwise the area-weighted normal gradient of the face's own GLB
// roof-band triangles (quadrant-assigned by dominant horizontal normal component — no new cone
// constant). Absolute GLB heights are EVIDENCE only (`capFit.apex.glbMaxY`), never applied — the
// aabb-affine vertical is unreliable (the roof-end-fit lesson).
//
// GEOMETRIC GATES ONLY (E-25 Rule 3 — shared sanity, no subject tuning): pitch in
// (0, maxPitch], run ≥ minRun per face, apex above the eave ring and at most one quantization
// cell above the as-built mass top. Out-of-tolerance → NAMED refusal with the fit error
// recorded (E-28 Rule 2 — never an invented shape); the swap-ladder cage arbitrates everything
// beyond sanity (the T-104 mechanism).
//
// PURE — no I/O, no GL, no Date/random; runs under the `src/**/*.test.mjs` glob.

import { ROOF_FIT_DEFAULTS, fillBetween } from "./roof-fit.mjs";
import { runCells } from "./component-decompose.mjs";

/** Schema tag for hip/pyramid fit results embedded in durable records. */
export const HIP_FIT_SCHEMA = "roof-hip-fit/v1";

/** Declared parameters — shared across subjects, never subject-tuned (E-25 Rule 3). */
export const HIP_FIT_DEFAULTS = Object.freeze({
  minTriangles: 1, // a face/end slope is well-posed from one GLB triangle (END_FIT precedent)
  apexSlack: 1.0,  // constructed apex may exceed the as-built mass top by one quantization cell
});

const roundHalf = (v) => Math.round(v * 2) / 2;
const noNegZero = (v) => (v + 0 === 0 ? 0 : v);
const round3 = (v) => noNegZero(Math.round(v * 1e3) / 1e3);

const FACES = Object.freeze([
  { dir: "+x", axis: "x", idx: 0, sign: 1 },
  { dir: "-x", axis: "x", idx: 0, sign: -1 },
  { dir: "+z", axis: "z", idx: 2, sign: 1 },
  { dir: "-z", axis: "z", idx: 2, sign: -1 },
]);

/**
 * The as-built cap footprint: occupied columns at the band-floor course, restricted to the
 * mass's plan columns, rows/ribs made contiguous (roof-fit's fill-between rule — a parametric
 * cap has straight eave lines). Also reports the as-built top over those columns (the apex
 * sanity bound). Exported for tests.
 * @param {import("../view/occupancy.mjs").Occupancy} occ
 * @param {Set<string>} planCols "x,z" keys of the mass plan
 * @param {number} bandFloor integer y of the eave course
 * @returns {{cols:Set<string>, bbox:object|null, massTop:number|null}}
 */
export function capFootprint(occ, planCols, bandFloor) {
  const cols = new Set();
  let massTop = null;
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    if (!planCols.has(`${x},${z}`)) continue;
    if (y === bandFloor) cols.add(`${x},${z}`);
    if (massTop === null || y > massTop) massTop = y;
  }
  if (!cols.size) return { cols, bbox: null, massTop };
  fillBetween(cols);
  const bbox = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (const k of cols) {
    const [x, z] = k.split(",").map(Number);
    if (x < bbox.minX) bbox.minX = x;
    if (x > bbox.maxX) bbox.maxX = x;
    if (z < bbox.minZ) bbox.minZ = z;
    if (z > bbox.maxZ) bbox.maxZ = z;
  }
  return { cols, bbox, massTop };
}

/** Area-weighted mean + rmse of per-triangle pitches (n·dir / n_y) for an upward-facing set. */
function pitchOfTris(tris, idx, sign) {
  let area = 0;
  let sum = 0;
  for (const t of tris) {
    const p = (t.normal[idx] * sign) / t.normal[1];
    area += t.area;
    sum += p * t.area;
  }
  const mean = area > 0 ? sum / area : null;
  let sse = 0;
  for (const t of tris) {
    const r = (t.normal[idx] * sign) / t.normal[1] - mean;
    sse += t.area * r * r;
  }
  return { pitch: mean, rmse: area > 0 ? Math.sqrt(sse / area) : null, triangles: tris.length, area: round3(area) };
}

/** Upward roof-band triangles inside a plan window, quadrant-assigned to their dominant
 *  horizontal normal direction. Returns a Map dir → tris. */
function quadrantTris(tris, { bbox, bandFloor }) {
  const byDir = new Map(FACES.map((f) => [f.dir, []]));
  for (const t of tris) {
    if (t.area === 0 || t.normal[1] <= 0) continue;
    const c = t.centroid;
    if (c[1] < bandFloor - 0.5) continue;
    if (c[0] < bbox.minX - 0.5 || c[0] > bbox.maxX + 0.5 || c[2] < bbox.minZ - 0.5 || c[2] > bbox.maxZ + 0.5) continue;
    const ax = Math.abs(t.normal[0]);
    const az = Math.abs(t.normal[2]);
    if (ax === 0 && az === 0) continue; // a flat top contributes to no face
    const dir = ax >= az ? (t.normal[0] > 0 ? "+x" : "-x") : (t.normal[2] > 0 ? "+z" : "-z");
    byDir.get(dir).push(t);
  }
  return byDir;
}

/**
 * Fit a pyramidal / hip cap over one component mass. Eave candidates are the group's recorded
 * pitched-side eaves tried HIGHEST FIRST (the cap hypothesis; lower eaves are likelier
 * mis-segmented wall fragments) — the first sane fit wins, every refusal is a named finding.
 * @param {{record:object, massId:string, gables:object[],
 *          occ:import("../view/occupancy.mjs").Occupancy,
 *          tris:{verts:number[][], centroid:number[], normal:number[], area:number}[],
 *          opts?:object}} args `tris` = roof-end-fit alignedTriangles output
 * @returns {{gable:object|null, findings:object[]}} gable carries `capFit` (the fit evidence)
 */
export function fitHipCap({ record, massId, gables, occ, tris, opts = {} }) {
  const o = { ...ROOF_FIT_DEFAULTS, ...HIP_FIT_DEFAULTS, ...opts };
  const findings = [];
  const refuse = (detail) => {
    findings.push({ code: "hip-cap-unfitted", where: massId, detail: `${detail} — regularized mass stays (Rule 2)` });
    return null;
  };

  const mass = (record.masses ?? []).find((m) => m.id === massId);
  if (!mass?.plan?.runs) return { gable: refuse("mass has no recorded plan"), findings };
  const planCols = new Set(runCells(mass.plan.runs).map(([x, z]) => `${x},${z}`));

  // recorded pitched sides of this group: pitch + eave evidence, keyed by eave direction
  const sideByDir = new Map();
  const eaves = new Set();
  for (const g of gables) {
    for (const s of g.sides ?? []) {
      if (s.eaveY === null || s.eaveY === undefined || !s.eaveDir) continue;
      eaves.add(s.eaveY);
      if (!sideByDir.has(s.eaveDir)) sideByDir.set(s.eaveDir, s);
    }
  }
  if (!eaves.size) return { gable: refuse("no recorded eave on any group side — band floor underivable"), findings };

  for (const eaveY of [...eaves].sort((a, b) => b - a)) {
    const attempt = fitCapAt({ massId, planCols, sideByDir, eaveY, occ, tris, o });
    if (attempt.gable) {
      findings.push(...attempt.findings);
      return { gable: attempt.gable, findings };
    }
    findings.push({
      code: "hip-cap-candidate-refused",
      where: `${massId} @ eave ${eaveY}`,
      detail: attempt.reasons.join("; "),
    });
  }
  return { gable: refuse(`every eave candidate refused (${[...eaves].sort((a, b) => b - a).join(", ")})`), findings };
}

/** One cap attempt at a fixed eave height. Returns `{gable, findings}` or `{reasons}`. */
function fitCapAt({ massId, planCols, sideByDir, eaveY, occ, tris, o }) {
  const reasons = [];
  const bandFloor = Math.floor(eaveY);
  const { cols, bbox, massTop } = capFootprint(occ, planCols, bandFloor);
  if (!cols.size) return { reasons: [`no occupied mass columns at the band floor ${bandFloor}`] };

  const runX = (bbox.maxX - bbox.minX) / 2;
  const runZ = (bbox.maxZ - bbox.minZ) / 2;
  if (runX < o.minRun) reasons.push(`x half-extent ${runX} < minRun ${o.minRun}`);
  if (runZ < o.minRun) reasons.push(`z half-extent ${runZ} < minRun ${o.minRun}`);
  if (reasons.length) return { reasons };

  // per-face pitch: recorded side first (source-selected by roof-fit), GLB quadrant otherwise
  const byDir = quadrantTris(tris, { bbox, bandFloor });
  const saneP = (p) => p !== null && p !== undefined && p > 0 && p <= o.maxPitch;
  const sides = [];
  const faceEvidence = [];
  for (const f of FACES) {
    const recorded = sideByDir.get(f.dir);
    const glb = pitchOfTris(byDir.get(f.dir), f.idx, f.sign);
    const glbSane = saneP(glb.pitch) && glb.triangles >= o.minTriangles;
    let pitch = null;
    let pitchSource = null;
    if (recorded && saneP(recorded.pitch)) {
      pitch = recorded.pitch;
      pitchSource = recorded.pitchSource;
    } else if (glbSane) {
      pitch = glb.pitch;
      pitchSource = "glb-quadrant";
    } else {
      reasons.push(`face ${f.dir} unfittable (recorded ${recorded ? recorded.pitch : "none"}, ` +
        `glb ${glb.pitch === null ? "n/a" : round3(glb.pitch)} over ${glb.triangles} tris)`);
      continue;
    }
    sides.push({
      planeId: recorded?.planeId ?? null,
      eaveDir: f.dir,
      pitch: round3(pitch),
      pitchSource,
      voxelPitch: recorded?.voxelPitch ?? null,
      glbPitch: glb.pitch === null ? null : round3(glb.pitch),
      glbAngleDeg: recorded?.glbAngleDeg ?? null,
      eaveY,
      eaveEdge: f.sign > 0 ? (f.axis === "x" ? bbox.maxX : bbox.maxZ) : (f.axis === "x" ? bbox.minX : bbox.minZ),
      overhang: null,
      extentCells: recorded?.extentCells ?? [],
      reasons: [],
    });
    faceEvidence.push({ dir: f.dir, pitch: round3(pitch), pitchSource,
      glb: { pitch: glb.pitch === null ? null : round3(glb.pitch), rmse: glb.rmse === null ? null : round3(glb.rmse),
        triangles: glb.triangles, area: glb.area } });
  }
  if (reasons.length) return { reasons };

  // the constructed apex: max of the 4-plane min surface over the footprint (the surface the
  // generator will realize — evaluated with the same arithmetic evalSideHeight uses)
  const heightAt = (x, z) => {
    let h = Infinity;
    for (const s of sides) {
      const v = s.eaveDir[1] === "x" ? x : z;
      const dist = s.eaveDir.startsWith("+") ? s.eaveEdge - v : v - s.eaveEdge;
      h = Math.min(h, s.eaveY + s.pitch * dist);
    }
    return h;
  };
  let apexRaw = -Infinity;
  for (const k of cols) {
    const [x, z] = k.split(",").map(Number);
    const h = heightAt(x, z);
    if (h > apexRaw) apexRaw = h;
  }
  const apexY = roundHalf(apexRaw);
  if (apexY <= eaveY + 0.5) reasons.push(`constructed apex ${apexY} not above the eave ring ${eaveY}`);
  if (massTop !== null && apexY > massTop + o.apexSlack) {
    reasons.push(`constructed apex ${apexY} exceeds the as-built mass top ${massTop} + ${o.apexSlack}`);
  }
  if (reasons.length) return { reasons };

  // GLB apex EVIDENCE (never applied — the aabb-affine vertical is unreliable)
  let glbMaxY = null;
  for (const t of tris) {
    if (t.area === 0) continue;
    const c = t.centroid;
    if (c[1] < bandFloor - 0.5) continue;
    if (c[0] < bbox.minX - 0.5 || c[0] > bbox.maxX + 0.5 || c[2] < bbox.minZ - 0.5 || c[2] > bbox.maxZ + 0.5) continue;
    for (const v of t.verts) if (glbMaxY === null || v[1] > glbMaxY) glbMaxY = v[1];
  }

  const axis = (bbox.maxX - bbox.minX) >= (bbox.maxZ - bbox.minZ) ? "x" : "z";
  return {
    gable: {
      id: `hip-cap-${massId}`,
      kind: "hip-cap",
      ridge: { axis, y: apexY },
      sides,
      footprint: { cols, bbox, area: cols.size },
      hip: { demanded: false },
      sane: true,
      reasons: [],
      capFit: {
        schema: HIP_FIT_SCHEMA,
        massId,
        bandFloor,
        eaveY,
        faces: faceEvidence,
        apex: { constructedY: apexY, glbMaxY: glbMaxY === null ? null : round3(glbMaxY) },
        footprint: { bbox, area: cols.size },
      },
    },
    findings: [],
  };
}

/**
 * Fit the hip END planes of hip-demanded gables against the GLB: per demanded end, the upward
 * triangles between the recorded ridge end and the footprint edge whose dominant horizontal
 * normal points out the end. The fitted pitch rides the gable as `hip.fitted.{lo,hi}` —
 * roof-fit's hipEndPlanes prefers it over the mean-of-sides heuristic; an unfittable end is a
 * named finding and the heuristic stays (Rule 2). PURE; inputs untouched.
 * @param {object[]} gables from gablesFromRecord
 * @param {{verts:number[][], centroid:number[], normal:number[], area:number}[]} tris
 * @param {object} [opts]
 * @returns {{gables:object[], findings:object[]}}
 */
export function fitHipEnds(gables, tris, opts = {}) {
  const o = { ...ROOF_FIT_DEFAULTS, ...HIP_FIT_DEFAULTS, ...opts };
  const findings = [];
  const saneP = (p) => p !== null && p !== undefined && p > 0 && p <= o.maxPitch;
  const out = gables.map((g) => {
    if (!g.sane || !g.hip?.demanded) return g;
    const axis = g.ridge.axis;
    const idx = axis === "x" ? 0 : 2;
    const crossIdx = axis === "x" ? 2 : 0;
    const bbox = g.footprint.bbox;
    const crossLo = (axis === "x" ? bbox.minZ : bbox.minX) - 0.5;
    const crossHi = (axis === "x" ? bbox.maxZ : bbox.maxX) + 0.5;
    const bandFloor = Math.min(...g.sides.map((s) => Math.floor(s.eaveY)));
    const fitted = { lo: null, hi: null };
    for (const [end, demanded, sign] of [["lo", g.hip.lo, -1], ["hi", g.hip.hi, 1]]) {
      if (!demanded) continue;
      const ridgeEnd = end === "lo" ? g.hip.ridgeLo : g.hip.ridgeHi;
      const edge = sign > 0 ? (axis === "x" ? bbox.maxX : bbox.maxZ) : (axis === "x" ? bbox.minX : bbox.minZ);
      const winLo = Math.min((ridgeEnd ?? edge) * sign, edge * sign) - 0.5;
      const winHi = Math.max((ridgeEnd ?? edge) * sign, edge * sign) + 0.5;
      const endTris = [];
      for (const t of tris) {
        if (t.area === 0 || t.normal[1] <= 0) continue;
        const c = t.centroid;
        if (c[1] < bandFloor - 0.5 || c[crossIdx] < crossLo || c[crossIdx] > crossHi) continue;
        const v = c[idx] * sign;
        if (v < winLo || v > winHi) continue;
        if (Math.abs(t.normal[idx]) < Math.abs(t.normal[crossIdx])) continue; // a side slope, not the end
        if (t.normal[idx] * sign <= 0) continue; // faces the wrong way
        endTris.push(t);
      }
      const fit = pitchOfTris(endTris, idx, sign);
      if (fit.triangles >= o.minTriangles && saneP(fit.pitch)) {
        fitted[end] = { pitch: round3(fit.pitch), rmse: fit.rmse === null ? null : round3(fit.rmse),
          triangles: fit.triangles, source: "glb" };
      } else {
        findings.push({
          code: "hip-end-unfitted",
          where: `${g.id}:${end}`,
          detail: `no sane GLB end slope (pitch ${fit.pitch === null ? "n/a" : round3(fit.pitch)} over ` +
            `${fit.triangles} tris) — mean-of-sides heuristic stays (Rule 2)`,
        });
      }
    }
    if (!fitted.lo && !fitted.hi) return g;
    return { ...g, hip: { ...g.hip, fitted } };
  });
  return { gables: out, findings };
}
