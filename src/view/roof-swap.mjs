// Roof swap under the cage — replace the sampled roof with the generated one (T-104-01, S-104,
// epic E-27). The swap is ONE judged step using the T-102 cage's own checks (reused, never
// re-implemented — Rule 2):
//   (a) per-azimuth silhouette IoU vs the GLB must hold at every gate azimuth within the declared
//       tolerance, anchored to the input shell. Judged on a MASS VIEW: form marks are cleared for
//       the GENERATED roof keys only, so stair/slab courses count as silhouette mass — at the
//       128-cell raster a bottom-half stair fills its cell from every gate azimuth and solid wedge
//       backs it; the standard fixtures-are-dressing rule would erase the entire surface course
//       and report a spurious regression. Everything else keeps the standard rule (a trapdoor is
//       still dressing). Closure is judged on the same view for the same reason (an eave-edge
//       column can be a single stair cell).
//   (b) six-direction closure no-regress (closureCheck, T-091 semantics: closed input must stay
//       closed; an open input must not grow its exterior-reachable count).
//   (c) protected regions byte-identical (protectViolations) — the chimney passes through: its
//       columns are excluded from both carve and generation, and RE-SEATING (filling the gap
//       between the new roof surface and a stack base the old blob used to meet) adds cells in
//       the stack's own bottom block, listed in `reseat.added`, never silent. The protect check
//       runs on the candidate WITHOUT the reseat cells so additions are explicit, not excused.
// Any failed check → the INPUT occupancy is returned unchanged with named reasons — auto-rollback,
// the regularized sampled roof stays (Rule 1's honest fallback).
//
// FIT-ERROR GATE (Rule 1): after generation, each gable's realized surface is measured against its
// chosen planes (programFitError); a gable beyond `programRmseTol` is dropped with a named finding
// and the remaining gables are re-composed — never an invented shape kept because it was cheap.
//
// ROOF-BAND CENSUS: the AC's "roof-band protrusions → ≈0" measurement — the ≥4/6-exposed-face
// count restricted to the generated footprint at/above the band floor, chimney columns excluded
// (a stack top legitimately exposes 5 faces). Reported before/after beside the cage metrics.
//
// PURE — no I/O, no GL, no Date/random; runs under the `src/**/*.test.mjs` glob.

import { occupancyFromCells } from "./occupancy.mjs";
import { closureCheck } from "./shell-integrity.mjs";
import {
  REGULARIZE_DEFAULTS, silhouetteIoUs, protectViolations, protrudingStackRegion,
} from "./shell-regularize.mjs";
import { generateRoof } from "./roof-generate.mjs";
import { programFitError, ROOF_FIT_DEFAULTS } from "../form/roof-fit.mjs";
import { runCells } from "../form/component-decompose.mjs";

const NEIGH6 = Object.freeze([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
const keyPos = (k) => k.split(",").map(Number);
const round4 = (x) => Math.round(x * 1e4) / 1e4;

/**
 * The occupancy with form marks cleared for `keys` only — those cells count as shell mass for the
 * silhouette/closure judges; every other fixture keeps the standard dressing rule. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {Set<string>} keys voxel keys ("x,y,z") to treat as mass
 */
export function massView(occ, keys) {
  const cells = [];
  for (const [key, block] of occ.cells) {
    cells.push({
      pos: keyPos(key),
      block,
      form: keys.has(key) ? undefined : occ.forms?.get(key),
      state: occ.states?.get(key),
    });
  }
  return occupancyFromCells(cells);
}

/**
 * Chimney plan columns: the record's protrusion-role mass footprints ∪ the cage's own geometric
 * stack derivation (protrudingStackRegion) — defense in depth, both sources are declared.
 * @returns {Set<string>} "x,z" keys
 */
export function chimneyColumns(record, occ) {
  const cols = new Set();
  for (const mass of record?.masses ?? []) {
    if (mass.role !== "protrusion") continue;
    for (const [x, z] of runCells(mass.plan?.runs ?? [])) cols.add(`${x},${z}`);
  }
  for (const k of protrudingStackRegion(occ).columns) cols.add(k);
  return cols;
}

/**
 * Protrusion census restricted to the roof band: cells with ≥ spikeFaces of 6 faces exposed,
 * within `cols` at y ≥ bandFloor (same emptiness test as the pinned T-102 definition).
 * @returns {{spikes:number, cells:number}}
 */
export function roofBandCensus(occ, { cols, bandFloor, spikeFaces = REGULARIZE_DEFAULTS.spikeFaces }) {
  let spikes = 0;
  let cells = 0;
  for (const key of occ.cells.keys()) {
    const [x, y, z] = keyPos(key);
    if (y < bandFloor || !cols.has(`${x},${z}`)) continue;
    cells++;
    let e = 0;
    for (const [dx, dy, dz] of NEIGH6) if (!occ.cells.has(`${x + dx},${y + dy},${z + dz}`)) e++;
    if (e >= spikeFaces) spikes++;
  }
  return { spikes, cells };
}

/** Generate with the per-gable fit-error gate: out-of-tolerance gables drop (named) and the rest
 *  re-compose. Returns the surviving generation + fit errors + findings. */
function gatedGenerate(gables, family, programRmseTol) {
  const findings = [];
  let pool = gables.filter((g) => g.sane);
  for (let round = 0; round <= gables.length; round++) {
    const gen = generateRoof(pool, family);
    const fitErrors = pool.map((g) => ({ gableId: g.id, ...programFitError(g, gen.heights) }));
    const offenders = fitErrors.filter((e) => e.rmse !== null && e.rmse > programRmseTol);
    if (!offenders.length) return { gen, fitErrors, pool, findings };
    for (const o of offenders) {
      findings.push({
        code: "gable-fit-out-of-tolerance",
        where: o.gableId,
        detail: `program rmse ${o.rmse} > ${programRmseTol} — gable dropped, regularized mass stays (Rule 1)`,
      });
    }
    const bad = new Set(offenders.map((o) => o.gableId));
    pool = pool.filter((g) => !bad.has(g.id));
  }
  return { gen: generateRoof([], family), fitErrors: [], pool: [], findings };
}

/**
 * THE SWAP: carve the sampled roof over the generated footprint, compose the generated roof,
 * re-seat the chimney, judge with the cage's three checks, roll back on any regression.
 * @param {import("./occupancy.mjs").Occupancy} occ the regularized shell
 * @param {{gables:object[], family:object, refSils:Record<string,object>, regions?:object[],
 *          protect?:{name:string, contains:(pos:number[])=>boolean}[], chimney?:Set<string>,
 *          opts?:{iouTolerance?:number, grid?:number, spikeFaces?:number, programRmseTol?:number}}} args
 */
export function swapRoof(occ, { gables, family, refSils, regions = [], protect = [], chimney = new Set(), opts = {} }) {
  const iouTolerance = opts.iouTolerance ?? REGULARIZE_DEFAULTS.iouTolerance;
  const grid = opts.grid ?? REGULARIZE_DEFAULTS.grid;
  const spikeFaces = opts.spikeFaces ?? REGULARIZE_DEFAULTS.spikeFaces;
  const programRmseTol = opts.programRmseTol ?? ROOF_FIT_DEFAULTS.programRmseTol;

  const { gen, fitErrors, pool, findings } = gatedGenerate(gables, family, programRmseTol);
  const base = {
    fitError: fitErrors, findings, generated: { counts: gen.counts, gables: pool.map((g) => g.id) },
    bandFloor: gen.bandFloor,
  };
  if (!gen.cells.length) {
    return { ...base, occ, accepted: false, reasons: ["nothing generated (no sane in-tolerance gable or no kit family)"],
      iou: null, closure: null, carve: { removed: 0 }, reseat: { added: [] }, census: null };
  }

  const footCols = new Set(gen.heights.keys());
  const activeCols = new Set([...footCols].filter((c) => !chimney.has(c)));
  const before = roofBandCensus(occ, { cols: activeCols, bandFloor: gen.bandFloor, spikeFaces });

  // carve the sampled roof (chimney columns pass through untouched), keep everything else
  const kept = [];
  let removed = 0;
  for (const [key, block] of occ.cells) {
    const [x, y, z] = keyPos(key);
    if (y >= gen.bandFloor && activeCols.has(`${x},${z}`)) { removed++; continue; }
    kept.push({ pos: [x, y, z], block, form: occ.forms?.get(key), state: occ.states?.get(key) });
  }
  const genCells = gen.cells.filter((c) => !chimney.has(`${c.pos[0]},${c.pos[2]}`));
  const genKeys = new Set(genCells.map((c) => c.pos.join(",")));
  const sansReseat = occupancyFromCells([...kept, ...genCells]);

  // re-seat the chimney: fill any gap between the new surface and the stack's bottom cell with
  // the stack's own block — additions are LISTED, the protect check runs without them
  const reseatCells = [];
  for (const col of chimney) {
    const h = gen.heights.get(col);
    if (h === undefined) continue;
    const [x, z] = col.split(",").map(Number);
    const top = Math.floor(h);
    let baseY = null;
    for (const [key] of occ.cells) { /* find the stack's lowest cell above the new surface */
      const [cx, cy, cz] = keyPos(key);
      if (cx === x && cz === z && cy > top && (baseY === null || cy < baseY)) baseY = cy;
    }
    if (baseY === null || baseY <= top + 1) continue;
    let gapFree = true;
    for (let y = top + 1; y < baseY; y++) if (sansReseat.cells.has(`${x},${y},${z}`)) gapFree = false;
    if (!gapFree) continue;
    const block = occ.cells.get(`${x},${baseY},${z}`);
    for (let y = top + 1; y < baseY; y++) reseatCells.push({ pos: [x, y, z], block });
  }
  const candidate = reseatCells.length ? occupancyFromCells([...kept, ...genCells, ...reseatCells]) : sansReseat;

  // the three cage checks
  const reasons = [];
  const massOcc = massView(candidate, genKeys);
  const baseline = silhouetteIoUs(occ, refSils, { grid });
  const final = silhouetteIoUs(massOcc, refSils, { grid });
  for (const a of Object.keys(refSils)) {
    if (final[a] < baseline[a] - iouTolerance) {
      reasons.push(`silhouette IoU regressed @ ${a}: ${round4(final[a])} < ${round4(baseline[a])} − ${iouTolerance}`);
    }
  }
  const closureIn = closureCheck(occ, { regions });
  const closureOut = closureCheck(massView(sansReseat, genKeys), { regions });
  if (closureIn.closed ? !closureOut.closed : closureOut.reached > closureIn.reached) {
    reasons.push(`closure regressed: reached ${closureIn.reached} → ${closureOut.reached}${closureIn.closed ? " (input was closed)" : ""}`);
  }
  const violations = protectViolations(occ, sansReseat, protect);
  if (violations > 0) reasons.push(`protected regions touched: ${violations} cells`);

  const accepted = reasons.length === 0;
  const out = accepted ? candidate : occ;
  const after = roofBandCensus(out, { cols: activeCols, bandFloor: gen.bandFloor, spikeFaces });

  return {
    ...base,
    occ: out,
    accepted,
    reasons,
    iou: { baseline: mapRound(baseline), final: mapRound(final) },
    closure: { input: { closed: closureIn.closed, reached: closureIn.reached },
               candidate: { closed: closureOut.closed, reached: closureOut.reached } },
    carve: { removed },
    reseat: { added: reseatCells.map((c) => c.pos) },
    census: { before, after },
  };
}

function mapRound(o) {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, round4(v)]));
}
