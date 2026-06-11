// Opening-head reconstruction — shaped vocabulary applied under the cage (T-105-01, story S-105,
// epic E-27). The component record (T-103) names each opening's head; the fit seam (shaped-fit)
// turns it into an arch or flat-head spec with the fit error recorded; this module performs the
// occupancy surgery — carve the aperture to the fitted curve, square the ring solid — and adapts
// it to the T-102 cage's injectable step seam, so EVERY application is judged by the three gates
// (per-azimuth silhouette IoU vs the GLB, closure no-regress, protected regions untouched) and a
// regressing reconstruction rolls back recorded, never kept.
//
// Edit discipline (the witnessed invariants):
//   • Only FULL-CUBE cells are ever carved — a dressed aperture cell (trapdoor/fence: occupied-
//     not-solid, T-097) is never undressed; dressing inside a fitted aperture is the expected
//     state and survives byte-identical.
//   • Ring cells are filled only where SUPPORTED (≥ minRingSupport solid 6-neighbors in the
//     INPUT occupancy) — squaring a head must not extrude a lip into open air above a wall edge;
//     an unsupported ring cell is a named per-opening finding, not a silent fill.
//   • Fill blocks are DERIVED, never constant: majority block of the input occupancy's solid
//     6-neighbors, lexicographic tie-break, then the build dominant (closeShell's rule).
//   • All edits are computed against the INPUT occupancy, then applied at once — application
//     order cannot influence the result (determinism by construction).
//   • Protected regions (the cage's `protect` predicates) are honored at edit time AND verified
//     independently by the cage afterwards (defense in depth, the openShell precedent).
//
// PURE — no GL, no I/O, no Date/random — runs under the `src/**/*.test.mjs` glob.

import { occupancyFromCells } from "./occupancy.mjs";
import { archRing, flatHead } from "../form/shaped-vocab.mjs";
import { fitOpeningHead } from "../form/shaped-fit.mjs";

export const RECONSTRUCT_SCHEMA = "opening-reconstruct/v1";

/** Declared op parameters (REGULARIZE_DEFAULTS precedent). */
export const RECONSTRUCT_DEFAULTS = Object.freeze({
  minRingSupport: 2, // solid 6-neighbors (input occ) a ring fill needs — no lips into open air
});

const NEIGH6 = Object.freeze([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
const keyOf = (p) => `${p[0]},${p[1]},${p[2]}`;

const DIR_AXIS = Object.freeze({ "+x": "x", "-x": "x", "+z": "z", "-z": "z" });

/**
 * Measure the wall's solid depth run at an opening: the union of solid depth-axis coordinates
 * over the FLANKING columns (just outside the span — the record's `jambs[].at` are the aperture's
 * own edge columns, which are air) across the opening's y extent. Geometric, no constants —
 * openings carve through whatever thickness the wall actually has there.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{extent:{axis:string,range:number[]}, sillY?:number, crown?:number,
 *          jambs?:{y0:number,y1:number}[]}} opening
 * @param {"+x"|"-x"|"+z"|"-z"} dir the opening group's facing direction
 * @returns {{axis:"x"|"z", range:number[]}|null} null when no flank cell is solid (the honest miss)
 */
export function openingDepthRun(occ, opening, dir) {
  const depthAxis = DIR_AXIS[dir];
  const spanAxis = opening?.extent?.axis;
  const range = opening?.extent?.range;
  if (!depthAxis || (spanAxis !== "x" && spanAxis !== "z") || spanAxis === depthAxis) return null;
  if (!occ?.bounds || !Array.isArray(range) || !range.every(Number.isInteger)) return null;
  const ys = [opening.sillY, opening.crown, ...(opening.jambs ?? []).flatMap((j) => [j?.y0, j?.y1])]
    .filter(Number.isInteger);
  if (ys.length === 0) return null;
  const [yLo, yHi] = [Math.min(...ys), Math.max(...ys)];
  const [dLo, dHi] = depthAxis === "x"
    ? [occ.bounds.min[0], occ.bounds.max[0]]
    : [occ.bounds.min[2], occ.bounds.max[2]];
  const posOf = spanAxis === "z" ? (u, y, d) => [d, y, u] : (u, y, d) => [u, y, d];
  let lo = Infinity, hi = -Infinity;
  for (const flank of [range[0] - 1, range[1] + 1]) {
    for (let y = yLo; y <= yHi; y++) {
      for (let d = dLo; d <= dHi; d++) {
        const [x, py, z] = posOf(flank, y, d);
        if (occ.solid(x, py, z)) { if (d < lo) lo = d; if (d > hi) hi = d; }
      }
    }
  }
  return lo === Infinity ? null : { axis: depthAxis, range: [lo, hi] };
}

/** Majority block of the input occ's solid 6-neighbors; lexicographic tie-break; build-dominant
 * fallback (closeShell's deterministic rule). */
function fillBlockFor(occ, pos, dominant) {
  const counts = new Map();
  for (const [dx, dy, dz] of NEIGH6) {
    const x = pos[0] + dx, y = pos[1] + dy, z = pos[2] + dz;
    if (!occ.solid(x, y, z)) continue;
    const b = occ.block(x, y, z);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  let best = null;
  for (const [b, c] of counts) {
    if (best === null || c > best.c || (c === best.c && b < best.b)) best = { b, c };
  }
  return best ? best.b : dominant;
}

function buildDominant(occ) {
  const counts = new Map();
  for (const b of occ.cells.values()) counts.set(b, (counts.get(b) ?? 0) + 1);
  let best = null;
  for (const [b, c] of counts) {
    if (best === null || c > best.c || (c === best.c && b < best.b)) best = { b, c };
  }
  return best ? best.b : null;
}

const inProtected = (protect, pos) => protect.some((r) => r.contains(pos));

/**
 * Reconstruct every opening head the component record can supply a fitted spec for.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{openingGroups?:object[]}} record component-record/v1
 * @param {{protect?:{name:string,contains:Function}[], minRingSupport?:number,
 *          fit?:object}} [opts] `fit` = tolerance overrides for the fit seam
 * @returns {{occ:import("./occupancy.mjs").Occupancy, openings:object[], carved:number,
 *            filled:number}} per-opening: {groupId, openingIndex, dir, kind, fitError, spec,
 *   noop, carved, filled, headCells, jambCells, findings[]}
 */
export function reconstructOpeningHeads(occ, record, opts = {}) {
  const minRingSupport = opts.minRingSupport ?? RECONSTRUCT_DEFAULTS.minRingSupport;
  const protect = opts.protect ?? [];
  const dominant = buildDominant(occ);
  const carve = new Set();
  const fills = new Map(); // key → block
  const openings = [];

  for (const group of record?.openingGroups ?? []) {
    (group.openings ?? []).forEach((opening, openingIndex) => {
      const entry = {
        groupId: group.id, openingIndex, dir: group.dir, kind: "none",
        fitError: null, spec: null, noop: false, carved: 0, filled: 0,
        headCells: [], jambCells: [], findings: [],
      };
      openings.push(entry);
      const fit = fitOpeningHead(opening, opts.fit ?? {});
      entry.kind = fit.kind;
      entry.fitError = fit.fitError ?? null;
      if (fit.kind === "none") { entry.findings.push(fit.finding); return; }
      if (fit.kind === "flat" && fit.noop) { entry.noop = true; entry.spec = fit.spec; return; }
      const depth = openingDepthRun(occ, opening, group.dir);
      if (!depth) {
        entry.findings.push({ code: "no-depth-run", detail: "no solid jamb cells to measure the wall thickness from" });
        return;
      }
      const spec = { ...fit.spec, depth, block: null };
      entry.spec = spec;
      const construct = fit.kind === "arch" ? archRing(spec) : flatHead(spec);
      entry.headCells = construct.headCells;
      entry.jambCells = construct.jambCells;
      for (const key of construct.aperture) {
        const pos = key.split(",").map(Number);
        // carve only full cubes: dressing (occupied-not-solid) is never undressed
        if (!occ.solid(pos[0], pos[1], pos[2])) continue;
        if (inProtected(protect, pos)) { entry.findings.push({ code: "protected-cell-skipped", detail: key }); continue; }
        carve.add(key);
        entry.carved++;
      }
      for (const cell of construct.ring) {
        const pos = cell.pos;
        if (occ.has(pos[0], pos[1], pos[2])) {
          if (!occ.solid(pos[0], pos[1], pos[2])) entry.findings.push({ code: "fixture-in-ring", detail: keyOf(pos) });
          continue; // already occupied — solid ring satisfied, fixtures left alone
        }
        if (inProtected(protect, pos)) { entry.findings.push({ code: "protected-cell-skipped", detail: keyOf(pos) }); continue; }
        let support = 0;
        for (const [dx, dy, dz] of NEIGH6) if (occ.solid(pos[0] + dx, pos[1] + dy, pos[2] + dz)) support++;
        if (support < minRingSupport) {
          entry.findings.push({ code: "ring-unsupported", detail: `${keyOf(pos)} support ${support} < ${minRingSupport}` });
          continue;
        }
        fills.set(keyOf(pos), fillBlockFor(occ, pos, dominant));
        entry.filled++;
      }
    });
  }

  // apply all edits at once against the input (order-independent by construction)
  const cells = [];
  for (const [key, block] of occ.cells) {
    if (carve.has(key)) continue;
    cells.push({ pos: key.split(",").map(Number), block, form: occ.forms?.get(key), state: occ.states?.get(key) });
  }
  for (const [key, block] of fills) cells.push({ pos: key.split(",").map(Number), block });
  return { occ: occupancyFromCells(cells), openings, carved: carve.size, filled: fills.size };
}

/**
 * Cage adapter: a `{op, fn}` step for regularizeShell's injectable seam. The cage's trace picks
 * up removed/added counts; the FULL per-opening report (specs, fit errors, labels, findings) is
 * stashed on `step.report` after the run (null until then, refreshed per invocation).
 */
export function openingHeadStep(record, opts = {}) {
  const step = {
    op: "opening-heads",
    report: null,
    fn(occ, params = {}) {
      const r = reconstructOpeningHeads(occ, record, { ...opts, protect: params.protect ?? opts.protect });
      step.report = { openings: r.openings, carved: r.carved, filled: r.filled };
      return { occ: r.occ, removedCells: r.carved, addedCells: r.filled };
    },
  };
  return step;
}
