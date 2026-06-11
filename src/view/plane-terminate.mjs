// Upper-edge TERMINATIONS — recorded roof planes the gable program left to the blob, regularized
// to their own fitted planes (T-109-01, story S-109, epic E-28).
//
// The swap regenerates only the planes that paired into sane gables; everything else (flat tower
// tops, unpaired pitched fragments) keeps the regularized blob — and the resemblance majors name
// exactly those edges ("upper roof edges"). This module clamps each UNCONSUMED plane's columns to
// the plane's OWN recorded voxelFit (the component record is the contract, Rule 4 — nothing is
// re-derived, nothing invented):
//   • flat planes: solid cells above the quantized plane height are trimmed; short columns fill
//     UP to the plane — but only when the deficit is within the fit's own recorded residual
//     spread (ceil(maxResidual) — the plane's measured raggedness, a recorded bound, not a tuned
//     constant). Deeper columns are not this surface; they are counted, never silently filled.
//     The extent is made plan-contiguous first (fillBetween — the roof-fit footprint precedent),
//     so the terminated edge line is straight by construction.
//   • pitched fragments: trim above the plane only — an unpaired fragment's fit is weaker
//     evidence (rmse ≥ 1.4 on the committed gatehouse records), so the op removes overrun and
//     never adds mass on its word.
// Added cells take the majority block of their solid 6-neighbors (the closeShell rule, REUSED via
// the shell-regularize exports). Fixtures are dressing, never touched; protected and excluded
// cells pass through (the runner protects the silhouette-residual candidates — protrusion
// arbitration belongs to that pass, with azimuth evidence, not to a trim).
//
// CAGE-WRAPPED BY THE CALLER: terminationSteps() emits one injectable step per plane for
// regularizeShell's existing seam — per-step silhouette-IoU floors anchored to the pass input,
// closure no-regress, protect checks, auto-rollback, trace. No judge logic lives here (Rule 2).
//
// PURE — no I/O, no GL, no Date/random; runs under the `src/**/*.test.mjs` glob.

import { runCells } from "../form/component-decompose.mjs";
import { planeHeightAt } from "../form/roof-fit.mjs";
import { dominantBlock, majorityNeighborBlock } from "./shell-regularize.mjs";
import { occupancyFromCells } from "./occupancy.mjs";

/** Schema tag for termination traces embedded in durable records. */
export const TERMINATE_SCHEMA = "plane-terminate/v1";

const roundHalf = (v) => Math.round(v * 2) / 2;
const keyPos = (k) => k.split(",").map(Number);

/** Make every row and rib of a plan-column set contiguous (the roof-fit fillBetween rule). */
function fillBetween(cols) {
  for (const [groupIdx, fillIdx] of [[1, 0], [0, 1]]) {
    const groups = new Map();
    for (const k of cols) {
      const c = k.split(",").map(Number);
      const g = c[groupIdx];
      const cur = groups.get(g);
      if (cur) { cur.lo = Math.min(cur.lo, c[fillIdx]); cur.hi = Math.max(cur.hi, c[fillIdx]); }
      else groups.set(g, { lo: c[fillIdx], hi: c[fillIdx] });
    }
    for (const [g, { lo, hi }] of groups) {
      for (let v = lo; v <= hi; v++) cols.add(fillIdx === 0 ? `${v},${g}` : `${g},${v}`);
    }
  }
}

/**
 * The recorded planes NOT consumed by an accepted gable — the termination work list. Flat planes
 * first (they carry the wall-top/parapet edges), then by descending area, then id: deterministic.
 * @param {object} record component-record/v1
 * @param {Set<string>} consumedPlaneIds side planeIds of every gable the swap accepted
 * @returns {{plane:object, kind:string}[]}
 */
export function unconsumedPlanes(record, consumedPlaneIds) {
  const planes = (record?.roofPlanes ?? []).filter((p) => !consumedPlaneIds.has(p.id));
  const rank = (p) => (p.kind === "flat" ? 0 : 1);
  return planes
    .slice()
    .sort((a, b) => rank(a) - rank(b) || b.extent.area - a.extent.area || a.id.localeCompare(b.id))
    .map((p) => ({ plane: p, kind: p.kind }));
}

/**
 * Clamp one plane's columns to its fitted surface. PURE — returns a new occupancy + the report;
 * the CALLER judges it under the cage (terminationSteps → regularizeShell).
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {object} plane a component-record roofPlane ({kind, voxelFit, extent})
 * @param {{protect?:{name:string,contains:Function}[], excludeCols?:Set<string>}} [opts]
 *   `excludeCols` = plan columns owned by another construction (the generated roof footprints) —
 *   a flat extent that leaks under an accepted gable must not eat the generated courses.
 * @returns {{occ:import("./occupancy.mjs").Occupancy, removedCells:number, addedCells:number,
 *            skipped:{deepColumns:number, emptyColumns:number, excluded:number},
 *            target:{planeId:string, kind:string, fillBound:number|null, columns:number}}}
 */
export function terminatePlane(occ, plane, { protect = [], excludeCols = null } = {}) {
  const isProtected = (pos) => protect.some((r) => r.contains(pos));
  const cols = new Set(runCells(plane.extent.runs).map(([x, z]) => `${x},${z}`));
  if (plane.kind === "flat") fillBetween(cols);
  const fillBound = plane.kind === "flat" ? Math.ceil(plane.voxelFit.maxResidual ?? 0) : null;

  // per-column solid tops/cells (fixtures are dressing — invisible to the clamp)
  const skipped = { deepColumns: 0, emptyColumns: 0, excluded: 0 };
  const removeKeys = new Set();
  const addCells = [];
  const tops = new Map();
  for (const key of occ.cells.keys()) {
    if (occ.forms?.has(key)) continue;
    const [x, y, z] = keyPos(key);
    const ck = `${x},${z}`;
    if (!cols.has(ck)) continue;
    const t = tops.get(ck);
    if (t === undefined || y > t) tops.set(ck, y);
  }

  for (const ck of cols) {
    if (excludeCols?.has(ck)) { skipped.excluded++; continue; }
    const [x, z] = ck.split(",").map(Number);
    const target = Math.floor(roundHalf(planeHeightAt(plane.voxelFit, x, z)));
    const top = tops.get(ck);
    if (top === undefined) { skipped.emptyColumns++; continue; }
    if (top > target) {
      for (let y = target + 1; y <= top; y++) {
        const key = `${x},${y},${z}`;
        if (!occ.cells.has(key) || occ.forms?.has(key) || isProtected([x, y, z])) continue;
        removeKeys.add(key);
      }
    } else if (top < target && plane.kind === "flat") {
      const deficit = target - top;
      if (deficit > fillBound) { skipped.deepColumns++; continue; }
      for (let y = top + 1; y <= target; y++) {
        if (isProtected([x, y, z])) continue;
        addCells.push([x, y, z]);
      }
    }
  }
  if (!removeKeys.size && !addCells.length) {
    return { occ, removedCells: 0, addedCells: 0, skipped,
      target: { planeId: plane.id, kind: plane.kind, fillBound, columns: cols.size } };
  }

  const fallback = dominantBlock(occ.cells);
  const cells = [];
  for (const [key, block] of occ.cells) {
    if (removeKeys.has(key)) continue;
    cells.push({ pos: keyPos(key), block, form: occ.forms?.get(key), state: occ.states?.get(key) });
  }
  addCells.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  for (const pos of addCells) cells.push({ pos, block: majorityNeighborBlock(pos, occ, fallback) });

  return {
    occ: occupancyFromCells(cells),
    removedCells: removeKeys.size,
    addedCells: addCells.length,
    skipped,
    target: { planeId: plane.id, kind: plane.kind, fillBound, columns: cols.size },
  };
}

/**
 * One regularizeShell step per unconsumed plane — the cage wrapper. Each step's report fields
 * (removedCells/addedCells) surface in the regularizeShell trace; a step that regresses any cage
 * check rolls back automatically with named reasons.
 * @param {{plane:object}[]} planes from {@link unconsumedPlanes}
 * @param {{excludeCols?:Set<string>}} [opts] protect comes from regularizeShell's own opts
 * @returns {{op:string, fn:Function}[]}
 */
export function terminationSteps(planes, { excludeCols = null } = {}) {
  return planes.map(({ plane }) => ({
    op: `terminate:${plane.id}`,
    fn: (occ, params) => terminatePlane(occ, plane, { protect: params.protect ?? [], excludeCols }),
  }));
}
