// Compositional surface-treatment grammar (T-175-01, story S-175, epic E-43) — the chosen approach from the
// T-174-01 spike (candidate A), built properly. The spike proved the LEVER is AMPLITUDE (token→amplified is
// the glance jump) and that A — a systematic, edges-from-geometry grammar at RESTRAINED amplitude — reads
// best (B's extra mid-field belt was the busy tell). This module is that grammar:
//
//   A declarative, layered, AMPLITUDE-CARRYING treatment applied over an element's geometry. Per the epic's
//   abstraction, an ordered stack: base (a course at the bottom edge) → field (a recess BY EXCLUSION) →
//   edges (treated DIFFERENTLY from the field and DERIVED FROM GEOMETRY: corners→quoins, top→cornice,
//   opening-perimeter→reveal). The load-bearing idea is (4): EDGES ARE COMPUTED FROM GEOMETRY (deriveEdges),
//   which is what makes "trim on the edges" portable across shapes and lets the cornice EXCLUDE the corner
//   columns so the quoin/cornice junction reads crisply (the spike's open concern, fixed here).
//
// THE BRUSHES ARE THE LAYER IMPLEMENTATIONS — this module COMPOSES them (quoin, surface.relief, and the
// injected dressOpenings); it invents NO geometry primitive. Every brush is reached through the REGISTRY
// DOOR (applyArticulation → getBrush — never a direct technique import; the brush-door tripwire, the
// wall-skin precedent). The spec is SERIALIZABLE (pure JSON, functions only constructed at compose time) so
// S-176's recognition / style pattern-book can emit it.
//
// CHARTER (inherited from surface-relief, never weakened): proud cells ONLY in front of existing exterior
// shell cells; RECESS BY EXCLUSION (facade-recess-by-exclusion) — there is NO air op; the field reads
// recessed because the EDGES stand proud of it. `recessClosureGuard` proves the recess did not reopen holes
// (closureOf over the original footprint). PURE — no GL/IO/Date/random; byte-stable placement order. The
// opening-dressing technique is DEPENDENCY-INJECTED (the brush-door tripwire: a src/view brush may not
// import it), exactly as wall-skin.mjs does.

import { bareBlock, occupancyFromCells } from "./occupancy.mjs";
import { projectSurface } from "./surface-grid.mjs";
import { applyArticulation } from "../recognition/compile.mjs";
import { closureOf } from "./wall-generate.mjs";

export const TREATMENT_GRAMMAR_SCHEMA = "treatment-grammar/v1";

const FACES = Object.freeze(["+x", "-x", "+z", "-z"]);
const DIRS = Object.freeze({ "+x": [1, 0, 0], "-x": [-1, 0, 0], "+z": [0, 0, 1], "-z": [0, 0, -1] });
const isInt = (n) => Number.isInteger(n);
const fail = (where, msg) => { throw new Error(`${where}: ${msg}`); };
const namespaced = (id) => (typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id);
/** Side-face dir → the {u (along), v (vertical), w (depth/normal)} world-axis indices. */
const OPENING_AXES = Object.freeze({
  "+x": { u: 2, v: 1, w: 0 }, "-x": { u: 2, v: 1, w: 0 },
  "+z": { u: 0, v: 1, w: 2 }, "-z": { u: 0, v: 1, w: 2 },
});
const checkFaces = (where, faces) => {
  if (!Array.isArray(faces) || !faces.length) fail(where, "faces must name at least one face");
  for (const f of faces) if (!DIRS[f]) fail(where, `unknown face "${f}"`);
};

/** Per-face exterior skin extrema (first-hit per ray — the canonical lens, like facade-articulation's
 *  private faceSkin). `along` = z for the x-faces, x otherwise. Restricted to the [floor,eaveY] band when
 *  given, so the wall-band footprint is not contaminated by a roof prism above. PURE. */
function faceSkinExtrema(occ, f, band) {
  let aMin = Infinity, aMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const row of projectSurface(occ, f).cells) for (const c of row) {
    if (!c) continue;
    const [x, y, z] = c.voxel;
    if (band && (y < band.yLo || y > band.yHi)) continue;
    const a = f === "+x" || f === "-x" ? z : x;
    if (a < aMin) aMin = a;
    if (a > aMax) aMax = a;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }
  return { aMin, aMax, yMin, yMax };
}

/**
 * EDGES FROM GEOMETRY (the load-bearing engine). Derive serializable edge descriptors from the occupancy's
 * wall-band geometry alone: the footprint bbox, the ≤4 footprint corner columns (the quoin set), a
 * `cornerKey` Set the cornice excludes, and the top/bottom rows. `floor`/`eaveY` default to the band's skin
 * y-extrema; pass them explicitly when a roof prism sits above the wall band (the gatehouse). PURE; output
 * is JSON-round-trippable (no functions).
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{faces?:string[], floor?:number, eaveY?:number}} [opts]
 * @returns {{footprint:{xMin,xMax,zMin,zMax}, corners:number[][], cornerKey:string[],
 *            top:{row:number}, bottom:{row:number}, band:{yLo:number,yHi:number}}}
 */
export function deriveEdges(occ, opts = {}) {
  if (!occ?.bounds) fail("deriveEdges", "occupancy is empty");
  const faces = opts.faces ?? FACES;
  checkFaces("deriveEdges", faces);
  // resolve the band: explicit floor/eaveY win; else the skin y-extrema across the named faces.
  let yLo = opts.floor, yHi = opts.eaveY;
  if (yLo == null || yHi == null) {
    let lo = Infinity, hi = -Infinity;
    for (const f of faces) { const { yMin, yMax } = faceSkinExtrema(occ, f); if (yMin < lo) lo = yMin; if (yMax > hi) hi = yMax; }
    if (!Number.isFinite(lo)) fail("deriveEdges", "no exterior skin on the named faces");
    yLo = yLo ?? lo; yHi = yHi ?? hi;
  }
  if (!isInt(yLo) || !isInt(yHi) || yHi < yLo) fail("deriveEdges", "band must be integers with eaveY >= floor");
  const band = { yLo, yHi };
  // footprint from the actual in-band occupied columns (geometry, not an assumption of squareness).
  let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    if (y < yLo || y > yHi) continue;
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
  }
  if (!Number.isFinite(xMin)) fail("deriveEdges", "no in-band cells to derive a footprint");
  const footprint = { xMin, xMax, zMin, zMax };
  const corners = [[xMin, zMin], [xMin, zMax], [xMax, zMin], [xMax, zMax]];
  const cornerKey = [...new Set(corners.map(([x, z]) => `${x},${z}`))];
  return { footprint, corners, cornerKey, top: { row: yHi }, bottom: { row: yLo }, band };
}

/** Last-writer-wins fold of placements onto an occupancy (the wall-skin/registry overlay rule); a relief
 *  cell drops the fronted cell's form/state. Returns a fresh occupancy. PURE. */
function overlay(occ, placements) {
  const byKey = new Map();
  for (const [k, b] of occ.cells) byKey.set(k, { pos: k.split(",").map(Number), block: b, form: occ.forms.get(k), state: occ.states.get(k) });
  for (const p of placements) byKey.set(p.pos.join(","), { pos: [...p.pos], block: p.block, ...(p.state ? { state: { ...p.state } } : {}) });
  return occupancyFromCells([...byKey.values()]);
}

/** Run a single registry brush through the DOOR (applyArticulation → getBrush — never a direct technique
 *  import; the brush-door tripwire, the wall-skin precedent). Returns {placements, report}. PURE. */
function runBrush(occ, brush, params) {
  const r = applyArticulation(occ, [{ brush, params }]);
  return { placements: r.placements, report: r.report.perBrush[0]?.report };
}

/** A single proud row course at `row` on the named faces, optionally excluding a set of (x,z) corner
 *  columns — the field-only cornice. The shared relief op (surface.relief) at row rhythm every=1, reached
 *  through the registry door. PURE. */
function rowCourse(occ, { material, faces, depth, row, excludeKey, zone }) {
  const excl = excludeKey ?? null;
  return runBrush(occ, "surface.relief", {
    material, faces, depth, zone,
    zoneOf: (pos) => (pos[1] === row && !(excl && excl.has(`${pos[0]},${pos[2]}`)) ? zone : null),
    rhythm: { axis: "row", every: 1, span: 1 },
  });
}

/** Resolve a layer's amplitude integer, fail-loud. */
function amp(where, layer, key, def, min = 1) {
  const v = layer?.amplitude?.[key] ?? def;
  if (!isInt(v) || v < min) fail(where, `amplitude.${key} must be an integer >= ${min}`);
  return v;
}

/**
 * VOUSSOIR ARCH-HEAD recolor placements (T-179-01) — for each ARCHED aperture, recolor the wedge stones
 * forming the crown CURVE with `material`. The curve cells come from {@link deriveArchHead} (pure, aperture-
 * local); the world depth is probed here against `occ` along the opening's normal axis within the aperture's
 * region span (the seam owns world coords; this stays a recolor of EXISTING solid stones — last-writer-wins,
 * no air op, closure unaffected). Flat lintels carry no `isArch` ⇒ no voussoir (the existing flat head
 * stands). PURE; byte-stable (aperture then sorted voussoir order). `occ.solid` selects the wall-plane stone.
 */
function archHeadPlacements(occ, apertures, material) {
  const out = [];
  for (const ap of apertures) {
    if (!deriveOpeningEdges(ap).isArch) continue; // only an arch has a curved head to dress
    const ax = OPENING_AXES[ap.dir];
    if (!ax || !ap.region) continue;
    const wLo = ap.region.min[ax.w], wHi = ap.region.max[ax.w];
    for (const { au, av } of deriveArchHead(ap).voussoirs) {
      for (let w = wLo; w <= wHi; w++) {
        const pos = [0, 0, 0];
        pos[ax.u] = au; pos[ax.v] = av; pos[ax.w] = w;
        if (occ.solid(pos[0], pos[1], pos[2])) { out.push({ op: "voxel", pos, block: namespaced(material) }); break; }
      }
    }
  }
  return out;
}

/**
 * COMPOSE THE TREATMENT — apply the spec's layers in order over `occ`, each layer mapped to an existing
 * brush. Order: base (proud course at the floor row) → field (recess BY EXCLUSION: no proud emission) →
 * edges.corners (full-height geometry-derived quoins) → edges.top (a corner-EXCLUDED eave cornice) →
 * edges.opening (the injected dressOpenings arch reveal). Folding is last-writer-wins; the field reads
 * recessed because the edges stand proud of it. Returns the final occupancy, all placements, the derived
 * edges, a per-layer report, and the recess closure verdict. PURE modulo the injected dressing seam.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {object} spec a treatment-grammar/v1 spec (pure data)
 * @param {{faces?:string[], floor:number, eaveY:number,
 *          extractApertures?:Function, dressOpenings?:Function}} ctx
 * @returns {{occ, placements:object[], edges:object,
 *            report:{layers:object[], byLayer:object}, closure:object}}
 */
export function composeTreatment(occ, spec, ctx = {}) {
  if (!occ?.bounds) fail("composeTreatment", "occupancy is empty");
  if (!spec || typeof spec !== "object") fail("composeTreatment", "spec (treatment-grammar/v1) is required");
  const faces = ctx.faces ?? FACES;
  checkFaces("composeTreatment", faces);
  const floor = ctx.floor, eaveY = ctx.eaveY;
  if (!isInt(floor) || !isInt(eaveY) || eaveY < floor) fail("composeTreatment", "ctx.floor and ctx.eaveY must be integers with eaveY >= floor");

  const edges = deriveEdges(occ, { faces, floor, eaveY });
  const cornerSet = new Set(edges.cornerKey);
  const placements = [];
  const layers = [];
  const byLayer = {};
  // EACH LAYER RUNS INDEPENDENTLY AGAINST THE ORIGINAL occ (the applyArticulation model: passes are
  // independent over one base), then we fold ONCE. Folding sequentially would let an earlier proud layer
  // grow the footprint and corrupt a later layer's geometry derivation (e.g. a base course widening the
  // corner the quoin then fails to find). Last-writer-wins by position resolves any overlap (fold order =
  // layer order). PURE.
  const record = (layer, brush, r, extra = {}) => {
    if (r.placements.length) placements.push(...r.placements);
    layers.push({ layer, brush, placed: r.placements.length, ...(extra.skipped ? { skipped: extra.skipped } : {}) });
    byLayer[layer] = { brush, placed: r.placements.length, ...extra, ...(r.report ? { report: r.report } : {}) };
  };

  // 1. base — a proud water-table/plinth course at the floor row.
  if (spec.base) {
    if (typeof spec.base.material !== "string" || !spec.base.material) fail("composeTreatment", "base.material must be a block id");
    const depth = amp("composeTreatment(base)", spec.base, "depth", 1);
    record("base", "surface-relief", rowCourse(occ, { material: spec.base.material, faces, depth, row: floor, zone: "base" }));
  }

  // 2. field — RECESS BY EXCLUSION: emit nothing. The field reads recessed relative to the proud edges.
  if (spec.field) {
    if (spec.field.recess !== true) fail("composeTreatment", "field must declare recess:true (recess is by exclusion — there is no air op)");
    layers.push({ layer: "field", brush: null, placed: 0 });
    byLayer.field = { recess: true, placed: 0 };
  }

  // 3. edges.corners — full-height, geometry-derived rubble quoins (the load-bearing detail).
  const E = spec.edges ?? {};
  if (E.corners) {
    if (typeof E.corners.material !== "string" || !E.corners.material) fail("composeTreatment", "edges.corners.material must be a block id");
    const headerDepth = amp("composeTreatment(corners)", E.corners, "headerDepth", 2);
    const run = (E.corners.amplitude?.run != null)
      ? amp("composeTreatment(corners)", E.corners, "run", eaveY - floor + 1)
      : eaveY - floor + 1;
    record("corners", "quoin", runBrush(occ, "quoin", { material: E.corners.material, faces, run, headerDepth }));
  }

  // 4. edges.top — a corner-EXCLUDED eave cornice (the crisp quoin/cornice junction; surfaceRelief, not the
  //    corner-blind eaveOverhang). One course by default (restraint — no string course unless asked).
  if (E.top) {
    if (typeof E.top.material !== "string" || !E.top.material) fail("composeTreatment", "edges.top.material must be a block id");
    const depth = amp("composeTreatment(top)", E.top, "depth", 1);
    const courses = amp("composeTreatment(top)", E.top, "courses", 1);
    let placed = 0;
    const subReports = [];
    for (let k = 0; k < courses; k++) {
      const r = rowCourse(occ, { material: E.top.material, faces, depth, row: eaveY - k, excludeKey: cornerSet, zone: "top" });
      if (r.placements.length) { placements.push(...r.placements); placed += r.placements.length; }
      subReports.push({ row: eaveY - k, placed: r.placements.length });
    }
    layers.push({ layer: "top", brush: "surface-relief", placed });
    byLayer.top = { brush: "surface-relief", placed, courses: subReports };
  }

  // 5. edges.opening — the injected dressOpenings arch reveal (frame/door/light). Runs on the original occ
  //    (the walls carry the apertures; relief is independent). Skipped without the seam.
  if (E.opening) {
    const { extractApertures, dressOpenings } = ctx;
    if (typeof extractApertures === "function" && typeof dressOpenings === "function") {
      const apertures = extractApertures(occ);
      const slots = {};
      if (E.opening.door) slots.door = { block: E.opening.door };
      if (E.opening.frame) slots.frame = { block: E.opening.frame };
      if (E.opening.light) slots.light = { block: E.opening.light };
      const dr = apertures.length ? dressOpenings(occ, apertures, { slots }) : { placements: [] };
      if (dr.placements.length) placements.push(...dr.placements);
      // T-179-01: optional VOUSSOIR arch-head recolor — the curve the flat lintel cannot name. Additive
      // recolor of existing wall-plane stones; flat openings carry no arch ⇒ no-op (the flat head stands).
      const headPlc = (E.opening.voussoir && apertures.length) ? archHeadPlacements(occ, apertures, E.opening.voussoir) : [];
      if (headPlc.length) placements.push(...headPlc);
      const arches = apertures.filter((a) => deriveOpeningEdges(a).isArch).length;
      record("opening", "dress-openings", { placements: dr.placements }, { apertures: apertures.length, arches, voussoirs: headPlc.length });
    } else {
      record("opening", null, { placements: [] }, { skipped: "no dressing seam injected" });
    }
  }

  // fold ALL layers onto the base ONCE, last-writer-wins (fold order = layer/placement order).
  const o = placements.length ? overlay(occ, placements) : occ;
  const closure = recessClosureGuard(occ, o, { floor, eaveY });
  return { occ: o, placements, edges, report: { layers, byLayer }, closure };
}

/** "x,z" columns occupied in the [floor,eaveY] band AND inside `bbox`. PURE. */
function ringIn(occ, bbox, floor, eaveY) {
  const ring = new Set();
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    if (y < floor || y > eaveY) continue;
    if (x < bbox.xMin || x > bbox.xMax || z < bbox.zMin || z > bbox.zMax) continue;
    ring.add(`${x},${z}`);
  }
  return ring;
}

/**
 * RECESS-BY-EXCLUSION CLOSURE GUARD. Prove a treated build did not reopen holes: build the wall-band ring
 * (`"x,z"` columns) for before and after, RESTRICTED to the BEFORE footprint bbox (so the benign bbox growth
 * from proud quoins is neutralized — the metric measures HOLES, not GROWTH), and require
 * `closureOf(after) >= closureOf(before)` AND that no before-column was dropped. Recess by exclusion never
 * removes a cell, so this holds by construction; an air-op recess would drop columns and TRIP it — that is
 * the guard's whole point. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occBefore
 * @param {import("./occupancy.mjs").Occupancy} occAfter
 * @param {{floor:number, eaveY:number}} band
 * @returns {{ok:boolean, before:number, after:number, droppedColumns:string[]}}
 */
export function recessClosureGuard(occBefore, occAfter, { floor, eaveY } = {}) {
  if (!isInt(floor) || !isInt(eaveY) || eaveY < floor) fail("recessClosureGuard", "floor and eaveY must be integers with eaveY >= floor");
  const fp = deriveEdges(occBefore, { floor, eaveY }).footprint;
  const beforeRing = ringIn(occBefore, fp, floor, eaveY);
  const afterRing = ringIn(occAfter, fp, floor, eaveY);
  const droppedColumns = [...beforeRing].filter((c) => !afterRing.has(c)).sort();
  const before = closureOf(beforeRing);
  const after = closureOf(afterRing);
  return { ok: after >= before && droppedColumns.length === 0, before, after, droppedColumns };
}

// ============================================================================================
// GENERALIZATION (T-176-01, story S-176) — the SAME edges-from-geometry vocabulary applied to the ROOF
// (eave / ridge / verge) and to OPENINGS (reveal / head). The honest finding is recorded in the code: the
// wall vocabulary covers the eave BAND, the ridge CAP and the opening REVEAL cleanly, but the raking VERGE
// (a sloped line, not a row) and the voussoir ARCH HEAD (a curve, not a row) LEAK — a flat row/column course
// under-treats them. deriveRoofEdges/composeRoofTreatment name where they cover and where they leak.
// ============================================================================================

/**
 * ROOF-BAND edges from the built occupancy — the sibling of deriveEdges over the band [eaveY+1, ridgeY].
 * Names `eaveRow` (the lowest roof course), `ridgeRow` (the cap), and `vergeColumns` (the gable-end /
 * rake columns: the footprint extrema along the axis PERPENDICULAR to the ridge — i.e. AT the ridge-axis
 * ends). PURE; JSON-round-trippable. The ridge axis is geometry the program declares (program.roof.ridgeAxis).
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{ridgeAxis:"x"|"z", eaveY:number, ridgeY:number, faces?:string[]}} opts
 * @returns {{band:{yLo,yHi}, eaveRow:number, ridgeRow:number, vergeColumns:string[],
 *            footprint:{xMin,xMax,zMin,zMax}}}
 */
export function deriveRoofEdges(occ, opts = {}) {
  if (!occ?.bounds) fail("deriveRoofEdges", "occupancy is empty");
  const { ridgeAxis, eaveY, ridgeY } = opts;
  if (ridgeAxis !== "x" && ridgeAxis !== "z") fail("deriveRoofEdges", 'ridgeAxis must be "x" or "z"');
  if (!isInt(eaveY) || !isInt(ridgeY) || ridgeY < eaveY) fail("deriveRoofEdges", "eaveY/ridgeY must be integers with ridgeY >= eaveY");
  const yLo = eaveY + 1, yHi = ridgeY;
  let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    if (y < yLo || y > yHi) continue;
    if (x < xMin) xMin = x; if (x > xMax) xMax = x;
    if (z < zMin) zMin = z; if (z > zMax) zMax = z;
  }
  if (!Number.isFinite(xMin)) fail("deriveRoofEdges", "no cells in the roof band [eaveY+1, ridgeY]");
  const footprint = { xMin, xMax, zMin, zMax };
  // verge / rake columns = the roof-band columns at the ridge-axis EXTREMA (the gable ends).
  const verge = new Set();
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    if (y < yLo || y > yHi) continue;
    const atEnd = ridgeAxis === "x" ? (x === xMin || x === xMax) : (z === zMin || z === zMax);
    if (atEnd) verge.add(`${x},${z}`);
  }
  return { band: { yLo, yHi }, eaveRow: yLo, ridgeRow: yHi, vergeColumns: [...verge].sort(), footprint };
}

/**
 * THE RAKING VERGE (T-179-01, story S-179) — the PROFILE edge primitive that closes T-176-01's verge leak.
 * The wall/roof classifier vocabulary is {corner column, top row, bottom row} — all FLAT; it cannot name a
 * SLOPED line, so `deriveRoofEdges.vergeColumns` (the whole gable-end column SET) made the verge a heavy
 * triangular end band. A raking verge is the SLOPED TOP EDGE of that triangle: per ACROSS-coordinate of a
 * gable-end slice, the TOP occupied cell. As the across-coordinate moves the top-y rises then falls — a
 * sloped line. The same primitive expresses a curve in {@link deriveArchHead}; a flat course is its
 * degenerate (all tops equal). PURE; JSON-round-trippable; the rake cells are 3-D "x,y,z" keys so a
 * `surface.relief` zoneOf can key the proud emission to the SLOPE, not the face.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{ridgeAxis:"x"|"z", eaveY:number, ridgeY:number}} opts
 * @returns {{rakeCells:string[], byEnd:Record<string,string[]>, faces:string[],
 *            curve:boolean, band:{yLo:number,yHi:number}}}
 */
export function deriveRakingVerge(occ, opts = {}) {
  if (!occ?.bounds) fail("deriveRakingVerge", "occupancy is empty");
  const { ridgeAxis, eaveY, ridgeY } = opts;
  if (ridgeAxis !== "x" && ridgeAxis !== "z") fail("deriveRakingVerge", 'ridgeAxis must be "x" or "z"');
  if (!isInt(eaveY) || !isInt(ridgeY) || ridgeY < eaveY) fail("deriveRakingVerge", "eaveY/ridgeY must be integers with ridgeY >= eaveY");
  const yLo = eaveY + 1, yHi = ridgeY;
  // the gable ends = the ridge-axis extrema of the roof band; the across axis is the perpendicular one.
  let endLo = Infinity, endHi = -Infinity;
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    if (y < yLo || y > yHi) continue;
    const e = ridgeAxis === "x" ? x : z;
    if (e < endLo) endLo = e;
    if (e > endHi) endHi = e;
  }
  if (!Number.isFinite(endLo)) fail("deriveRakingVerge", "no cells in the roof band [eaveY+1, ridgeY]");
  const ends = endLo === endHi ? [endLo] : [endLo, endHi];
  // per gable end, group band cells by the across coordinate and keep the TOP cell (the rake).
  const byEnd = {};
  const rake = new Set();
  const topYs = [];
  const faces = ridgeAxis === "x" ? ["+x", "-x"] : ["+z", "-z"];
  for (const e of ends) {
    const topByAcross = new Map(); // across -> {y, key}
    for (const key of occ.cells.keys()) {
      const [x, y, z] = key.split(",").map(Number);
      if (y < yLo || y > yHi) continue;
      const ev = ridgeAxis === "x" ? x : z;
      if (ev !== e) continue;
      const across = ridgeAxis === "x" ? z : x;
      const cur = topByAcross.get(across);
      if (!cur || y > cur.y) topByAcross.set(across, { y, key });
    }
    const cells = [...topByAcross.values()].map((c) => c.key).sort();
    byEnd[e] = cells;
    for (const { y, key } of topByAcross.values()) { rake.add(key); topYs.push(y); }
  }
  // a true rake has a non-constant top profile; a flat shed/mono band does not (the honest degenerate).
  const curve = new Set(topYs).size > 1;
  return { rakeCells: [...rake].sort(), byEnd, faces, curve, band: { yLo, yHi } };
}

/**
 * OPENING edges from one aperture record (the opening analog of deriveEdges) — PURE over data. `reveal` is
 * the solid perimeter ring (the jamb/head reveal the dressing recolors); `head` is the lintel band (flat) or
 * the shaped head cells (arch). `isArch` is true when the aperture's bbox carries interior SOLID cells (the
 * arch corners extractApertures marks) — i.e. the air cells do not fill the bbox.
 * @param {{kind?:string, bbox?:{u0,v0,u1,v1}, cells?:Array, perim?:Array, lintel?:Array}} aperture
 * @returns {{kind:string, reveal:Array, head:Array, isArch:boolean}}
 */
export function deriveOpeningEdges(aperture) {
  if (!aperture || typeof aperture !== "object") fail("deriveOpeningEdges", "aperture record is required");
  const reveal = aperture.perim ?? [];
  let isArch = false;
  if (aperture.bbox && Array.isArray(aperture.cells)) {
    const { u0, v0, u1, v1 } = aperture.bbox;
    const area = (u1 - u0 + 1) * (v1 - v0 + 1);
    isArch = aperture.cells.length < area; // some bbox interior is solid → a shaped (arched) head
  }
  const head = aperture.lintel ?? [];
  return { kind: aperture.kind ?? "opening", reveal, head, isArch };
}

/**
 * THE VOUSSOIR ARCH HEAD (T-179-01, story S-179) — the PROFILE edge primitive for an opening, the twin of
 * {@link deriveRakingVerge}. `deriveOpeningEdges.head` is the FLAT lintel band; a voussoir arch crown follows
 * a CURVE the row cannot name. Per opening COLUMN (au), the crown air cell = the highest air cell toward the
 * lintel (min `av` — the lintel sits at `v0-1`, see opening-dressing), and the VOUSSOIR = the bordering solid
 * one step further toward the lintel (the wedge stone to recolor). As the column moves the crown av varies
 * for an arch and is constant for a flat lintel — so `curve` separates them and a flat head is this
 * primitive's degenerate (the unification). PURE over the aperture record (world au/av); depth is the seam's
 * job, not this derivation's. The voussoir cells are returned sorted (au,av) for byte-stable consumption.
 * @param {{cells?:Array<{au:number,av:number}>, lintel?:Array<{au:number,av:number}>}} aperture
 * @returns {{crown:Array<{au:number,av:number}>, voussoirs:Array<{au:number,av:number}>,
 *            curve:boolean, side:"top"}}
 */
export function deriveArchHead(aperture) {
  if (!aperture || typeof aperture !== "object") fail("deriveArchHead", "aperture record is required");
  const air = Array.isArray(aperture.cells) ? aperture.cells.filter((c) => isInt(c?.au) && isInt(c?.av)) : [];
  // HEAD DIRECTION (orientation-robust): the head is toward the lintel. `av` is world-y for the ±z/±x side
  // faces, which may grow up or down relative to the grid — so we read the direction from the lintel band
  // (which sits just past the opening top) rather than assuming it. Default −1 (toward smaller av) when no
  // lintel is given, matching the simple synthetic case.
  const lintel = Array.isArray(aperture.lintel) ? aperture.lintel.filter((c) => isInt(c?.av)) : [];
  let headSign = -1;
  if (lintel.length && air.length) {
    const lAv = lintel.reduce((s, c) => s + c.av, 0) / lintel.length;
    const aAv = air.reduce((s, c) => s + c.av, 0) / air.length;
    headSign = lAv >= aAv ? +1 : -1;
  }
  // per column, the crown air cell = the one extreme toward the head; the voussoir is one step past it.
  const crownByCol = new Map();
  for (const c of air) {
    const cur = crownByCol.get(c.au);
    if (cur === undefined || (headSign > 0 ? c.av > cur : c.av < cur)) crownByCol.set(c.au, c.av);
  }
  const cols = [...crownByCol.keys()].sort((a, b) => a - b);
  const crown = cols.map((au) => ({ au, av: crownByCol.get(au) }));
  const voussoirs = crown.map(({ au, av }) => ({ au, av: av + headSign }));
  const curve = new Set(crown.map((c) => c.av)).size > 1;
  return { crown, voussoirs, curve, side: "top" };
}

/**
 * COMPOSE the roof-band treatment: a proud EAVE course (the door-reached eave-overhang at eaveRow), a RIDGE
 * cap course (rowCourse at ridgeRow — the ridge has no corners, so corner-blind), and a VERGE course
 * (surface.relief keyed to the gable-end columns). Single fold, last-writer-wins; closure guarded over the
 * roof band (additive ⇒ holds). Returns the final occupancy, placements, derived edges, a per-layer report
 * (carrying the VERGE LEAK note), and the closure verdict. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{edge:{material:string, amplitude?:object}}} roofSpec
 * @param {{ridgeAxis:"x"|"z", eaveY:number, ridgeY:number, faces?:string[]}} ctx
 */
export function composeRoofTreatment(occ, roofSpec, ctx = {}) {
  if (!occ?.bounds) fail("composeRoofTreatment", "occupancy is empty");
  if (typeof roofSpec?.edge?.material !== "string" || !roofSpec.edge.material) fail("composeRoofTreatment", "roofSpec.edge.material must be a block id");
  const faces = ctx.faces ?? FACES;
  checkFaces("composeRoofTreatment", faces);
  const edges = deriveRoofEdges(occ, ctx);
  const material = roofSpec.edge.material;
  const amp = roofSpec.edge.amplitude ?? {};
  const eaveDepth = isInt(amp.eaveDepth) ? amp.eaveDepth : 1;
  const ridgeCourses = isInt(amp.ridgeCourses) ? amp.ridgeCourses : 1;
  const placements = [];
  const layers = [];

  // eave — proud course at the lowest roof row (the door-reached eave-overhang).
  const er = runBrush(occ, "eave-overhang", { material, faces, depth: eaveDepth, eaveRow: edges.eaveRow });
  if (er.placements.length) placements.push(...er.placements);
  layers.push({ layer: "eave", brush: "eave-overhang", placed: er.placements.length, row: edges.eaveRow });

  // ridge — a cap course at the top row (corner-blind: the ridge line has no quoins).
  let ridgePlaced = 0;
  for (let k = 0; k < ridgeCourses; k++) {
    const r = rowCourse(occ, { material, faces, depth: 1, row: edges.ridgeRow - k, zone: "ridge" });
    if (r.placements.length) { placements.push(...r.placements); ridgePlaced += r.placements.length; }
  }
  layers.push({ layer: "ridge", brush: "surface-relief", placed: ridgePlaced, row: edges.ridgeRow });

  // verge — THE RAKING VERGE (T-179-01): proud relief keyed to the SLOPED rake line (the top cell per
  // across-coordinate of each gable-end slice), not the whole gable-end column SET. This closes T-176-01's
  // leak: the column-keyed course made the verge a heavy triangular end band; the rake-cell profile emits a
  // crisp sloped board following the pitch. The profile is the missing edge classifier the flat row/column
  // vocabulary lacked — a row is its degenerate (deriveRakingVerge.curve === false).
  const rake = deriveRakingVerge(occ, { ridgeAxis: ctx.ridgeAxis, eaveY: ctx.eaveY, ridgeY: ctx.ridgeY });
  const rakeSet = new Set(rake.rakeCells);
  const vr = runBrush(occ, "surface.relief", {
    material, faces: rake.faces, depth: 1, zone: "verge",
    zoneOf: (pos) => (rakeSet.has(`${pos[0]},${pos[1]},${pos[2]}`) ? "verge" : null),
    rhythm: { axis: "row", every: 1, span: 1 },
  });
  if (vr.placements.length) placements.push(...vr.placements);
  layers.push({ layer: "verge", brush: "surface-relief", placed: vr.placements.length,
    profile: "raking", rakeCells: rake.rakeCells.length, curve: rake.curve,
    resolves: "the sloped-line leak — proud cells follow the top-cell-per-across rake profile, not a flat column band" });

  const o = placements.length ? overlay(occ, placements) : occ;
  const closure = recessClosureGuard(occ, o, { floor: edges.band.yLo, eaveY: edges.band.yHi });
  return { occ: o, placements, edges, report: { layers }, closure };
}

/** Re-exported so a consumer can bare-compare blocks without a second import. */
export { bareBlock };
