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
import { programFitError, pitchVariant, gableEndsVariant, ROOF_FIT_DEFAULTS } from "../form/roof-fit.mjs";
import { ridgeVariant } from "../form/roof-ridge-fit.mjs";
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
 * Protrusion census restricted to the roof band: SOLID cells with ≥ spikeFaces of 6 faces exposed,
 * within `cols` at y ≥ bandFloor (same emptiness test as the pinned T-102 definition; emptiness
 * still counts fixture neighbors as occupied). Solid-only follows the cage's own semantics —
 * fixtures are dressing, not shell mass: a slab half-step or stair tread at an eave edge exposes
 * 4 faces BY CONSTRUCTION (it is the declared shaped vocabulary, placed with states), which is
 * exactly what this census must not confuse with sampled-mesh noise. `exclude` (T-108-01) extends
 * the same declaration to GENERATED SHEET COURSES — full field blocks the verge/eave-overhang
 * strips place with an open underside (≥4 exposed faces by design, like a real overhang): the
 * caller passes the generator's sheet keys, and what was excluded is COUNTED, never hidden.
 * @returns {{spikes:number, cells:number, excluded:{cells:number, spikes:number}}}
 */
export function roofBandCensus(occ, { cols, bandFloor, spikeFaces = REGULARIZE_DEFAULTS.spikeFaces, exclude = null }) {
  let spikes = 0;
  let cells = 0;
  const excluded = { cells: 0, spikes: 0 };
  for (const key of occ.cells.keys()) {
    if (occ.forms?.has(key)) continue; // shaped vocabulary, not sampled mass
    const [x, y, z] = keyPos(key);
    if (y < bandFloor || !cols.has(`${x},${z}`)) continue;
    const skip = exclude?.has(key) ?? false;
    if (skip) excluded.cells++;
    else cells++;
    let e = 0;
    for (const [dx, dy, dz] of NEIGH6) if (!occ.cells.has(`${x + dx},${y + dy},${z + dz}`)) e++;
    if (e >= spikeFaces) {
      if (skip) excluded.spikes++;
      else spikes++;
    }
  }
  return { spikes, cells, excluded };
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

/** One judged carve-compose-judge pass for a fixed set of gables (one attempt of the ladder). */
function judgeVariant(occ, { gables, family, refSils, regions = [], protect = [], chimney = new Set(), opts = {} }) {
  const iouTolerance = opts.iouTolerance ?? REGULARIZE_DEFAULTS.iouTolerance;
  const grid = opts.grid ?? REGULARIZE_DEFAULTS.grid;
  const spikeFaces = opts.spikeFaces ?? REGULARIZE_DEFAULTS.spikeFaces;
  const programRmseTol = opts.programRmseTol ?? ROOF_FIT_DEFAULTS.programRmseTol;

  const { gen, fitErrors, pool, findings } = gatedGenerate(gables, family, programRmseTol);
  // fitted ends (T-108-01): trims applied by the generator, named per gable for the record
  const endCoords = pool
    .filter((g) => g.ends?.lo || g.ends?.hi)
    .map((g) => ({
      id: g.id,
      ...Object.fromEntries(["lo", "hi"].map((e) => [e, g.ends[e]
        ? { coord: g.ends[e].coord, faceCoord: g.ends[e].faceCoord, overhang: g.ends[e].overhang }
        : null])),
    }));
  const fittedEnds = endCoords.reduce((n, e) => n + (e.lo ? 1 : 0) + (e.hi ? 1 : 0), 0);
  const base = {
    fitError: fitErrors, findings,
    generated: { counts: gen.counts, gables: pool.map((g) => g.id), fittedEnds, endCoords },
    bandFloor: gen.bandFloor,
  };
  if (!gen.cells.length) {
    return { ...base, occ, accepted: false, reasons: ["nothing generated (no sane in-tolerance gable or no kit family)"],
      iou: null, closure: null, carve: { removed: 0 }, reseat: { added: [] }, census: null };
  }

  // carve/census over the surviving pool's UNTRIMMED footprints: the blob past a fitted verge tip
  // is removed and measured, never silently kept (the generated set may be smaller than this)
  const footCols = new Set();
  for (const g of pool) for (const c of g.footprint.cols) footCols.add(c);
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
  // the after-census declares the generated sheet courses (open-underside overhang construction)
  // the way the before-census never could — excluded by KEY and counted, not hidden
  const after = roofBandCensus(out, {
    cols: activeCols, bandFloor: gen.bandFloor, spikeFaces,
    exclude: accepted ? gen.sheetKeys : null,
  });

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

/** The shape signature of a gable set — used to skip a variant identical to an earlier one.
 *  Fitted ends are part of the shape (a no-end fit normalizes to null = the legacy shape), and so
 *  is the ridge height (T-109-01: a ridge-fitted gable is a distinct rung; an intersection that
 *  lands on the as-built height collapses into the plain rung and is skipped). */
const pitchKey = (gables) =>
  JSON.stringify(gables.map((g) => [
    g.hip?.demanded ?? false,
    g.ridge?.y ?? null,
    g.sides.map((s) => [s.pitch, s.pitchSource]),
    g.ends && (g.ends.lo || g.ends.hi)
      ? ["lo", "hi"].map((e) => (g.ends[e] ? [g.ends[e].coord, g.ends[e].faceCoord] : null))
      : null,
  ]));

/**
 * THE SWAP: carve the sampled roof over the generated footprint, compose the generated roof,
 * re-seat the chimney, judge with the cage's three checks, roll back on any regression.
 *
 * ATTEMPT LADDER (declared, deterministic, every attempt recorded): END-FITTED rungs first when
 * the caller supplies a roof-end-fit (T-108-01 — the better-fitted hypothesis: footprint trimmed
 * at the fitted verge tip, sheet courses past the gable face), each in glb-preferred and all-voxel
 * pitch flavors, hips-as-detected then suppressed; the four E-27 rungs follow verbatim as the
 * honest tail. T-109-01 doubles each rung with a leading RIDGE-FITTED flavor (the
 * plane-intersection ridge height — roof-ridge-fit.mjs); the as-built-ridge rung remains the
 * fallback, so the worst case is exactly the pre-T-109 geometry. Two failure modes motivate the pitch/hip rungs, both measured live: a glb gradient
 * can pass the angle-agreement gate yet be inconsistent with the recorded eave/ridge geometry
 * (the cottage roof-0 apex shortfall — eave 15 + 0.773·run 8.5 never reaches ridge 24), and a
 * segmentation-fragmented ridge can invent a hip demand that deletes real end mass (the gatehouse
 * — ridge cells x 1..5 under a footprint x −12..13). The cage vs the GLB silhouette is the
 * arbiter between the declared hypotheses — the E-15 lesson as a mechanism, not a tuned constant.
 * Duplicate shapes are skipped; all rungs rejected → the input stands (Rule 1 fallback).
 * @param {import("./occupancy.mjs").Occupancy} occ the regularized shell
 * @param {{gables:object[], family:object, refSils:Record<string,object>, regions?:object[],
 *          protect?:{name:string, contains:(pos:number[])=>boolean}[], chimney?:Set<string>,
 *          endFit?:{gables:object[], suppressed?:object[]},
 *          opts?:{iouTolerance?:number, grid?:number, spikeFaces?:number, programRmseTol?:number}}} args
 *          `endFit.gables` = ends fitted on the as-detected gables; `endFit.suppressed` = ends
 *          fitted AFTER hip suppression (a hip end is not fittable, its suppressed variant is).
 */
export function swapRoof(occ, args) {
  const { gables, endFit = null, opts = {} } = args;
  const voxel = pitchVariant(gables, "voxel", opts);
  const candidates = [];
  if (endFit?.gables) {
    candidates.push(
      { name: "end-fitted", gables: endFit.gables },
      { name: "end-fitted-voxel-pitch", gables: pitchVariant(endFit.gables, "voxel", opts) },
    );
  }
  if (endFit?.suppressed) {
    candidates.push(
      { name: "end-fitted-gable-ends", gables: endFit.suppressed },
      { name: "end-fitted-voxel-pitch-gable-ends", gables: pitchVariant(endFit.suppressed, "voxel", opts) },
    );
  }
  candidates.push(
    { name: "as-fitted", gables },
    { name: "voxel-pitch", gables: voxel },
    { name: "as-fitted-gable-ends", gables: gableEndsVariant(gables) },
    { name: "voxel-pitch-gable-ends", gables: gableEndsVariant(voxel) },
  );
  // T-109-01: each candidate gets a RIDGE-FITTED flavor first (the plane-intersection ridge —
  // the better-fitted hypothesis, like the end-fitted rungs before it), the plain candidate
  // follows as the honest tail. The flavor is emitted only when the intersection actually MOVES a
  // ridge height — an unfittable or as-built-identical intersection collapses into the plain rung
  // (which keeps its name and carries the ridge findings).
  const flavored = candidates.flatMap((c) => {
    const rv = ridgeVariant(c.gables);
    const moved = rv.gables.some((g, i) => g.ridge?.y !== c.gables[i].ridge?.y);
    if (!moved) return [{ ...c, ridgeFindings: rv.findings }];
    return [
      { name: `${c.name}-ridge-fit`, gables: rv.gables, ridgeFindings: rv.findings },
      c,
    ];
  });
  const seen = new Set();
  const variants = [];
  for (const v of flavored) {
    const key = pitchKey(v.gables);
    if (seen.has(key)) continue;
    seen.add(key);
    variants.push(v);
  }

  const attempts = [];
  let first = null;
  for (const v of variants) {
    const res = judgeVariant(occ, { ...args, gables: v.gables });
    if (v.ridgeFindings?.length) res.findings = [...res.findings, ...v.ridgeFindings];
    attempts.push({ name: v.name, accepted: res.accepted, reasons: res.reasons, iou: res.iou,
      census: res.census, generated: res.generated, findings: res.findings,
      pitches: v.gables.filter((g) => g.sane).map((g) => ({
        id: g.id, sides: g.sides.map((s) => ({ planeId: s.planeId, pitch: s.pitch, source: s.pitchSource })) })),
      ends: v.gables.filter((g) => g.sane && (g.ends?.lo || g.ends?.hi)).map((g) => ({
        id: g.id, lo: g.ends.lo?.coord ?? null, hi: g.ends.hi?.coord ?? null })),
      ridge: v.gables.filter((g) => g.sane && g.ridgeIntersect).map((g) => ({
        id: g.id, y: g.ridge.y, intersectY: g.ridgeIntersect.y, v: g.ridgeIntersect.v,
        deltaVsRecord: g.ridgeIntersect.deltaVsRecord })) });
    if (!first) first = res;
    if (res.accepted) return { ...res, attempt: v.name, attempts };
  }
  return { ...first, attempt: variants[0].name, attempts };
}
