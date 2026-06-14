// Surface relief — the shared PROUD-EMISSION op (T-146-01, story S-146, epic E-35; the crux).
// Skinning is recolor-on-fixed-geometry (face-paint: "PAINT IS A RECOLOR, NOT A MOVE … There is NO
// air op"; zone-fill: one dominant block per zone). Recoloring a voxelized smooth box can never make
// a pilaster proud of its infill. RELIEF IS CONSTRUCTION. This module generalises the mechanism that
// already ships — clinker's lap courses and idiom-constructs' jetty both emit cells PROUD of the wall
// plane, in front of existing shell cells — into one face/rhythm/depth/material-parametrized op.
//
// THE CHARTER (clinker's, generalised):
//   • Proud cells are emitted ONLY in front of EXISTING exterior shell cells, so a relieved face's
//     IN-PLANE silhouette (gable rake included) is preserved BY CONSTRUCTION — nothing protrudes past
//     the rake line, because nothing is emitted where the face has no cell. (clinker CL4, generalised.)
//   • RECESS BY EXCLUSION (facade-recess-by-exclusion): there is NO air op. A recessed field is the
//     ABSENCE of proud emission — pilaster strips proud, the field left at the base plane reads
//     recessed relative to them. The op only ADDS; `report.fieldCells` makes the recess observable.
//   • IDEMPOTENT on its own output: a cell already carrying the relief material is never re-emitted
//     (the clinker rule — material identity, not geometry), and a proud ray stops at the first occupied
//     cell, so a second run on the brush's own output emits nothing.
//   • CONSTRUCTION-STAGE ONLY. Relief is built here, where geometry can move. It is NEVER a workshop
//     paint air-op — the no-air-op rule stands for paint. The workshop SEES relief through the
//     2.5-D depth read (surface-grid.reliefProfile), it does not paint it.
//   • PURE — no GL/IO/Date/random; byte-stable placement order (sorted cell iteration).

import { bareBlock, occupancyFromCells } from "./occupancy.mjs";
import { projectSurface } from "./surface-grid.mjs";
import { elevationMask, maskProportions, proportionRatios } from "../form/silhouette-proportion.mjs";

export const SURFACE_RELIEF_SCHEMA = "surface-relief/v1";

/** Declared parameter defaults — named in any durable record that uses them, never subject-tuned
 *  (the SHAPED_DEFAULTS / PROPORTION_DEFAULTS posture). `every` has no universal value — the caller
 *  supplies the pilaster/course period from the recognized grammar. */
export const RELIEF_DEFAULTS = Object.freeze({ depth: 1, span: 1, phase: 0 });

const DIRS = Object.freeze({
  "+x": [1, 0, 0], "-x": [-1, 0, 0], "+z": [0, 0, 1], "-z": [0, 0, -1],
});
/** face → the position-axis index the wall RUNS ALONG (⊥ to the face normal, horizontal). */
const ALONG_AXIS = Object.freeze({ "+x": 2, "-x": 2, "+z": 0, "-z": 0 });

const isInt = (n) => Number.isInteger(n);
const fail = (msg) => { throw new Error(`surfaceRelief: ${msg}`); };
const namespaced = (id) => (typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id);

/** Strip membership: a periodic band of width `span` every `every`, offset by `phase`. `idx` is the
 *  along-wall index (column rhythm) or the height index (row rhythm). PURE integer arithmetic. */
function stripHit(every, span, phase, idx) {
  const r = (((idx - phase) % every) + every) % every;
  return r < span;
}

/**
 * SURFACE RELIEF — emit proud cells in front of a zone's exterior faces on a column/row rhythm.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{material:string, faces?:Array<"+x"|"-x"|"+z"|"-z">,
 *          rhythm:{axis:"column"|"row", every:number, span?:number, phase?:number},
 *          depth?:number, zoneOf?:(pos:number[])=>string|null, zone?:string}} opts
 *   `rhythm.axis` — "column" = vertical pilaster strips along the wall; "row" = horizontal belt
 *   courses up the wall. `depth` — proud projection in cells (≥1). `zoneOf`/`zone` — optional storey
 *   restriction (clinker's lens); omitted ⇒ the whole exterior of the named faces is eligible.
 * @returns {{placements:{op:"voxel",pos:number[],block:string}[],
 *            report:{faces:string[], axis:string, every:number, span:number, phase:number,
 *                    depth:number, strips:number, proudCells:number, fieldCells:number}}}
 */
export function surfaceRelief(occ, opts = {}) {
  const {
    material, faces = ["+x", "-x", "+z", "-z"], rhythm,
    depth = RELIEF_DEFAULTS.depth, zoneOf = null, zone = "upper",
  } = opts;
  if (typeof material !== "string" || !material.length) fail("opts.material must be a non-empty block id");
  if (!rhythm || (rhythm.axis !== "column" && rhythm.axis !== "row")) fail('opts.rhythm.axis must be "column"|"row"');
  const { axis } = rhythm;
  const every = rhythm.every;
  const span = rhythm.span ?? RELIEF_DEFAULTS.span;
  const phase = rhythm.phase ?? RELIEF_DEFAULTS.phase;
  if (!isInt(every) || every < 1) fail("opts.rhythm.every must be an integer ≥ 1");
  if (!isInt(span) || span < 1) fail("opts.rhythm.span must be an integer ≥ 1");
  if (!isInt(phase) || phase < 0) fail("opts.rhythm.phase must be an integer ≥ 0");
  if (!isInt(depth) || depth < 1) fail("opts.depth must be an integer ≥ 1");
  if (!Array.isArray(faces) || !faces.length) fail("opts.faces must name at least one face");
  for (const f of faces) if (!DIRS[f]) fail(`opts.faces contains unknown face "${f}"`);
  if (zoneOf !== null && typeof zoneOf !== "function") fail("opts.zoneOf must be a function or omitted");

  const reliefBlock = bareBlock(material);

  // per-face exterior skin: the first occupied voxel per ray (the canonical lens, no refork).
  const skin = new Map(faces.map((f) => {
    const keys = new Set();
    for (const row of projectSurface(occ, f).cells) for (const c of row) if (c) keys.add(c.voxel.join(","));
    return [f, keys];
  }));

  // height base for the row rhythm: the lowest eligible skin cell across the named faces
  let yBase = Infinity;
  for (const f of faces) for (const key of skin.get(f)) {
    const y = Number(key.split(",")[1]);
    if (y < yBase) yBase = y;
  }

  const strips = new Set();
  const placements = [];
  let proudCells = 0;
  let fieldCells = 0;
  for (const [key, blk] of [...occ.cells.entries()].sort()) {
    const [x, y, z] = key.split(",").map(Number);
    if (zoneOf && zoneOf([x, y, z]) !== zone) continue;
    if (bareBlock(blk) === reliefBlock) continue; // already relief — never re-emit (the clinker rule)
    for (const f of faces) {
      if (!skin.get(f).has(key)) continue; // not on this face's exterior skin
      const along = f === "+x" || f === "-x" ? z : x;
      const idx = axis === "column" ? along : y - yBase;
      if (!stripHit(every, span, phase, idx)) { fieldCells++; continue; }
      strips.add(`${f}:${idx}`);
      const d = DIRS[f];
      for (let o = 1; o <= depth; o++) {
        const out = [x + d[0] * o, y + d[1] * o, z + d[2] * o];
        if (occ.has(out[0], out[1], out[2])) break; // never tunnel/float past existing geometry
        placements.push({ op: "voxel", pos: out, block: namespaced(material) });
        proudCells++;
      }
    }
  }
  return {
    placements,
    report: { faces: [...faces], axis, every, span, phase, depth, strips: strips.size, proudCells, fieldCells },
  };
}

// --- the no-regress harness (the AC2 acceptance gate) ------------------------

const maskEqual = (a, b) => {
  if (!a || !b) return a === b;
  if (a.w !== b.w || a.h !== b.h || a.data.length !== b.data.length) return false;
  for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) return false;
  return true;
};
const stable = (v) => JSON.stringify(v);

/** Cell list of an occupancy (key→block) for re-assembly. */
function cellsOf(occ) {
  return [...occ.cells.entries()].map(([k, b]) => ({ pos: k.split(",").map(Number), block: bareBlock(b) }));
}

/**
 * NO-REGRESS HARNESS — proves relief is in-plane-invisible by CONSTRUCTION and does not move the E-34
 * ruler. For each relieved face, the OWN-FACE orthographic elevation (projected along that face's
 * normal axis, which collapses the relief's depth) and its `maskProportions` must be byte-identical
 * before/after; whole-build `ridgeToEave` and `roofShare` (height ratios) must be byte-identical. The
 * perpendicular-extent / plan-aspect widening is HONEST VISIBLE RELIEF — recorded in `expectedWidening`,
 * never gated. A relief that moves the in-plane mask or the height ratios returns false here, and the
 * test that calls it fails — this function IS the gate (it is exported so the relief-aware gate, S-148,
 * reuses the same predicate). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occBefore
 * @param {{pos:number[],block:string}[]} placements  the surfaceRelief output
 * @param {{faces:Array<"+x"|"-x"|"+z"|"-z">, opts?:object}} args
 */
export function reliefNoRegress(occBefore, placements, { faces, opts = {} } = {}) {
  if (!Array.isArray(faces) || !faces.length) fail("reliefNoRegress: faces must name at least one relieved face");
  const occAfter = occupancyFromCells([
    ...cellsOf(occBefore),
    ...placements.map((p) => ({ pos: [...p.pos], block: bareBlock(p.block) })),
  ]);
  const perFace = [];
  let inPlanePreserved = true;
  for (const f of faces) {
    if (!DIRS[f]) fail(`reliefNoRegress: unknown face "${f}"`);
    const axis = f === "+x" || f === "-x" ? "x" : "z"; // the face's normal axis = the projection axis
    const before = elevationMask(occBefore, axis, opts);
    const after = elevationMask(occAfter, axis, opts);
    const maskEq = maskEqual(before, after);
    const propsEq = stable(maskProportions(before, opts)) === stable(maskProportions(after, opts));
    if (!maskEq || !propsEq) inPlanePreserved = false;
    perFace.push({ face: f, axis, maskEqual: maskEq, propsEqual: propsEq });
  }
  const rBefore = proportionRatios(occBefore, opts);
  const rAfter = proportionRatios(occAfter, opts);
  const ratiosPreserved =
    rBefore.ridgeToEave === rAfter.ridgeToEave && rBefore.roofShare === rAfter.roofShare;
  return {
    inPlanePreserved,
    ratiosPreserved,
    perFace,
    ratios: { before: { ridgeToEave: rBefore.ridgeToEave, roofShare: rBefore.roofShare }, after: { ridgeToEave: rAfter.ridgeToEave, roofShare: rAfter.roofShare } },
    expectedWidening: { aspectBefore: rBefore.aspect, aspectAfter: rAfter.aspect, widened: rBefore.aspect !== rAfter.aspect },
  };
}
