// Facade articulation brushes (T-147-01, story S-147, epic E-35) — the four idioms the pattern book
// was missing, each realized ON T-146-01's shared relief op (surfaceRelief). Skinning is
// recolor-on-fixed-geometry; ARTICULATION IS CONSTRUCTION (the E-35 narrowing). These do not
// re-implement relief — they PARAMETRIZE it from the recognized facade grammar (T-145-01):
//
//   • pilaster      — proud vertical strips on a rhythm (period from the grammar), the rake
//                     preserved by construction (surfaceRelief only emits in front of existing cells).
//   • quoin         — corner stepped accent: a proud run up each corner column with an ALTERNATING
//                     depth schedule (stretcher 1, header 2, …) — the stretcher/header read is the
//                     geometry, not a recolor.
//   • infillPanel   — the thing timber-frame stops short of: proud STUDS on the rhythm PLUS the PANEL
//                     field recolored between them (studs = relief/construction; field = base-plane
//                     recolor; the field reads recessed by exclusion — no air op).
//   • eaveOverhang  — a soffit course proud of the wall plane at the EAVE row (distinct from jetty,
//                     which is a storey-floor bressummer lip).
//
// CHARTER (inherited from surface-relief, never weakened): proud cells only in front of existing
// exterior shell cells (in-plane silhouette preserved); recess by exclusion (NO air op); idempotent
// (a ray stops at the first occupied cell; the relief material is never re-emitted); pure — no
// GL/IO/Date/random, byte-stable placement order. Roles are resolved to blocks UPSTREAM (compile's
// roleBlock — the program-path vocabulary authority); these brushes take resolved block ids.

import { bareBlock } from "./occupancy.mjs";
import { projectSurface } from "./surface-grid.mjs";
import { surfaceRelief } from "./surface-relief.mjs";

export const FACADE_ARTICULATION_SCHEMA = "facade-articulation/v1";

/** Declared defaults — named in any durable record, never subject-tuned (the RELIEF_DEFAULTS
 *  posture). `period`/`run`/`faces` have no universal value: the caller supplies them from the
 *  recognized grammar. */
export const ARTICULATION_DEFAULTS = Object.freeze({ depth: 1, span: 1, run: 3, headerDepth: 2 });

const DIRS = Object.freeze({ "+x": [1, 0, 0], "-x": [-1, 0, 0], "+z": [0, 0, 1], "-z": [0, 0, -1] });
const isInt = (n) => Number.isInteger(n);
const fail = (where, msg) => { throw new Error(`${where}: ${msg}`); };
const namespaced = (id) => (typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id);

/** stripHit, replicated from surface-relief (a periodic band of width `span` every `every`, offset
 *  by `phase`) — pure integer arithmetic, so infillPanel's field selection matches surfaceRelief's
 *  stud selection EXACTLY (same columns are studs ⇒ the complement is the field). */
function stripHit(every, span, phase, idx) {
  const r = (((idx - phase) % every) + every) % every;
  return r < span;
}

/** Build a {zoneOf, zone} relief restriction from a recognized storey band (T-145-02). The compiler
 *  carries the band as PURE DATA `{yLo,yHi}` (inclusive) so the plan stays replay-stable; the brush
 *  turns it into the y-band predicate surfaceRelief gates on. Returns null when no band is given, so a
 *  bandless call is byte-identical to before the feature. An explicit `zoneOf` always wins (test seam). */
function bandZone(band) {
  if (!band) return null;
  const { yLo, yHi } = band;
  if (!isInt(yLo) || !isInt(yHi)) fail("bandZone", "band must be {yLo:int, yHi:int}");
  return { zoneOf: (pos) => (pos[1] >= yLo && pos[1] <= yHi ? "band" : null), zone: "band" };
}

const checkMaterial = (where, m) => { if (typeof m !== "string" || !m.length) fail(where, "material must be a non-empty block id"); };
const checkFaces = (where, faces) => {
  if (!Array.isArray(faces) || !faces.length) fail(where, "faces must name at least one face");
  for (const f of faces) if (!DIRS[f]) fail(where, `unknown face "${f}"`);
};

/** Per-face exterior skin as voxels (the first occupied cell per ray — the canonical lens), plus the
 *  along-axis extrema (corner columns) and the y range. `along` = z for the x-faces, x otherwise. */
function faceSkin(occ, f) {
  const voxels = [];
  for (const row of projectSurface(occ, f).cells) for (const c of row) if (c) voxels.push(c.voxel);
  let aMin = Infinity, aMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const [x, y, z] of voxels) {
    const a = f === "+x" || f === "-x" ? z : x;
    if (a < aMin) aMin = a;
    if (a > aMax) aMax = a;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }
  return { voxels, aMin, aMax, yMin, yMax };
}

/**
 * PILASTER — proud vertical strips on a column rhythm. A thin adapter over surfaceRelief: the
 * grammar's `{period, phase}` becomes the relief column rhythm; the rake is preserved by construction.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{material:string, faces:string[], rhythm:{period:number, phase?:number}, span?:number,
 *          depth?:number, zoneOf?:Function, zone?:string}} opts
 * @returns {{placements:object[], report:object}}
 */
export function pilaster(occ, opts = {}) {
  const { material, faces, rhythm, span = ARTICULATION_DEFAULTS.span, depth = ARTICULATION_DEFAULTS.depth, zoneOf, zone, band } = opts;
  checkMaterial("pilaster", material);
  checkFaces("pilaster", faces);
  const period = rhythm?.period;
  const phase = rhythm?.phase ?? 0;
  if (!isInt(period) || period < 1) fail("pilaster", "rhythm.period must be an integer ≥ 1");
  const zoneArgs = zoneOf ? { zoneOf, zone } : (bandZone(band) ?? {}); // band → storey y-gate (T-145-02)
  const r = surfaceRelief(occ, {
    material, faces, depth, ...zoneArgs,
    rhythm: { axis: "column", every: period, span, phase },
  });
  return { placements: r.placements, report: { brush: "pilaster", period, phase, span, depth, band: band ?? null, ...r.report } };
}

/**
 * QUOIN — corner stepped accent: a proud run up each corner column of the named faces, with an
 * ALTERNATING depth schedule (course parity → stretcher `1` / header `headerDepth`). Built by
 * composing surfaceRelief per face with a corner+course-parity `zoneOf`; the proud-ray charter and
 * idempotence come for free from the relief op.
 * @param {{material:string, faces:string[], run?:number, headerDepth?:number, zoneOf?:Function,
 *          zone?:string}} opts
 */
export function quoin(occ, opts = {}) {
  const { material, faces, run = ARTICULATION_DEFAULTS.run, headerDepth = ARTICULATION_DEFAULTS.headerDepth, zoneOf, zone, band } = opts;
  checkMaterial("quoin", material);
  checkFaces("quoin", faces);
  if (!isInt(run) || run < 1) fail("quoin", "run must be an integer ≥ 1");
  if (!isInt(headerDepth) || headerDepth < 1) fail("quoin", "headerDepth must be an integer ≥ 1");
  // an explicit zoneOf wins; otherwise the recognized band becomes the outer y-gate the run composes with
  const outer = zoneOf ? { zoneOf, zone } : (bandZone(band) ?? { zoneOf: null, zone: undefined });
  const byKey = new Map();
  let corners = 0;
  for (const f of faces) {
    const { aMin, aMax, yMin } = faceSkin(occ, f);
    if (!Number.isFinite(aMin)) continue;
    const cornerSet = new Set([aMin, aMax]);
    corners += cornerSet.size;
    for (const parity of [0, 1]) {
      const depth = parity === 0 ? 1 : headerDepth; // even course = stretcher, odd = header
      const Q = "quoin";
      const restrict = (pos) => {
        const [x, y, z] = pos;
        const a = f === "+x" || f === "-x" ? z : x;
        if (!cornerSet.has(a)) return null;
        const c = y - yMin;
        if (c < 0 || c >= run) return null;
        if (c % 2 !== parity) return null;
        if (outer.zoneOf && outer.zoneOf(pos) !== outer.zone) return null; // respect the outer zone/band restriction
        return Q;
      };
      const r = surfaceRelief(occ, { material, faces: [f], depth, zoneOf: restrict, zone: Q, rhythm: { axis: "row", every: 1, span: 1 } });
      for (const p of r.placements) byKey.set(p.pos.join(","), p);
    }
  }
  const placements = [...byKey.values()].sort((a, b) => a.pos[0] - b.pos[0] || a.pos[1] - b.pos[1] || a.pos[2] - b.pos[2]);
  return { placements, report: { brush: "quoin", run, headerDepth, corners, band: band ?? null, proudCells: placements.length } };
}

/**
 * INFILL-PANEL — the half-timber field timber-frame stops short of: proud STUDS on a column rhythm
 * (construction, via surfaceRelief) PLUS the PANEL field recolored between them (base-plane recolor,
 * the complement of the stud columns — recess by exclusion). Studs and field share ONE stripHit, so
 * the field is exactly the non-stud columns.
 * @param {{memberMaterial:string, fieldMaterial:string, faces:string[],
 *          rhythm:{period:number, phase?:number}, span?:number, depth?:number,
 *          zoneOf?:Function, zone?:string}} opts
 */
export function infillPanel(occ, opts = {}) {
  const { memberMaterial, fieldMaterial, faces, rhythm, span = ARTICULATION_DEFAULTS.span, depth = ARTICULATION_DEFAULTS.depth, zoneOf, zone, band } = opts;
  checkMaterial("infillPanel(memberMaterial)", memberMaterial);
  checkMaterial("infillPanel(fieldMaterial)", fieldMaterial);
  checkFaces("infillPanel", faces);
  const period = rhythm?.period;
  const phase = rhythm?.phase ?? 0;
  if (!isInt(period) || period < 1) fail("infillPanel", "rhythm.period must be an integer ≥ 1");
  // band → storey y-gate (T-145-02): studs AND the field recolor share it, so the half-timber stays in
  // its storey (no plinth cover, no roof punch). An explicit zoneOf wins (test seam).
  const zoneArgs = zoneOf ? { zoneOf, zone } : (bandZone(band) ?? {});
  const fz = zoneArgs.zoneOf ?? null;
  const fzone = zoneArgs.zone;
  // studs — proud, on the rhythm
  const studs = surfaceRelief(occ, {
    material: memberMaterial, faces, depth, ...zoneArgs,
    rhythm: { axis: "column", every: period, span, phase },
  });
  // field — recolor the non-stud exterior skin cells (base plane, no geometry move)
  const fieldBlock = bareBlock(fieldMaterial);
  const fieldByKey = new Map();
  for (const f of faces) {
    for (const [x, y, z] of faceSkin(occ, f).voxels) {
      if (fz && fz([x, y, z]) !== fzone) continue;
      const along = f === "+x" || f === "-x" ? z : x;
      if (stripHit(period, span, phase, along)) continue; // stud column — handled by relief
      if (bareBlock(occ.cells.get(`${x},${y},${z}`)) === fieldBlock) continue; // already field
      fieldByKey.set(`${x},${y},${z}`, { op: "voxel", pos: [x, y, z], block: namespaced(fieldMaterial) });
    }
  }
  const fieldPlacements = [...fieldByKey.values()].sort((a, b) => a.pos[0] - b.pos[0] || a.pos[1] - b.pos[1] || a.pos[2] - b.pos[2]);
  return {
    placements: [...studs.placements, ...fieldPlacements],
    report: { brush: "infill-panel", period, phase, band: band ?? null, studs: studs.report.proudCells, fieldCells: fieldPlacements.length },
  };
}

/**
 * EAVE-OVERHANG — a soffit course proud of the wall plane at the EAVE row (distinct from jetty's
 * storey-floor lip). Restricts surfaceRelief to one row via a `zoneOf`; the eave row defaults to the
 * top of the named faces' wall skin (a real building supplies the eave y explicitly through compile).
 * @param {{material:string, faces:string[], depth?:number, eaveRow?:number}} opts
 */
export function eaveOverhang(occ, opts = {}) {
  const { material, faces, depth = ARTICULATION_DEFAULTS.depth, eaveRow } = opts;
  checkMaterial("eaveOverhang", material);
  checkFaces("eaveOverhang", faces);
  if (eaveRow != null && !isInt(eaveRow)) fail("eaveOverhang", "eaveRow must be an integer when given");
  let row = eaveRow;
  if (row == null) {
    row = -Infinity;
    for (const f of faces) { const { yMax } = faceSkin(occ, f); if (yMax > row) row = yMax; }
    if (!Number.isFinite(row)) return { placements: [], report: { brush: "eave-overhang", eaveRow: null, proudCells: 0 } };
  }
  const r = surfaceRelief(occ, {
    material, faces, depth, zone: "eave", zoneOf: (pos) => (pos[1] === row ? "eave" : null),
    rhythm: { axis: "row", every: 1, span: 1 },
  });
  return { placements: r.placements, report: { brush: "eave-overhang", eaveRow: row, depth, proudCells: r.report.proudCells } };
}
