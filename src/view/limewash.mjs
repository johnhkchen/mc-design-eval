// Limewash — the aspect-aware thrift coat (T-132-01, story S-132, epic E-32; saltcrag's
// weather-face accent). Shell-burned lime is brushed only on the face the storm hits: a white
// seaward gable against grey rubble. No owned pass is directional — surface.paint applies by
// role-priority across the whole skin, surface.fill by zone — so neither can coat ONE aspect
// while the landward field stays showing.
//
// A RECOLOR, NOT A MOVE (face-paint's invariant): every placement repaints an EXISTING
// exterior cell of the named aspect(s); geometry is untouched and other aspects are never
// visited. Partial coverage is deterministic — each face row is chunked into runs of `minRun`
// and chunks are selected by the coverage ratio (no randomness), so a 0.5 coat is contiguous
// brush strokes, not salt. Preserved materials (dressed quoins, jambs) are never overpainted.
// Idempotent: the selection grid includes already-washed cells (stable chunks), placements
// skip them — a second pass emits nothing. PURE — no GL/IO/Date/random.

import { bareBlock } from "./occupancy.mjs";
import { projectSurface } from "./surface-grid.mjs";

const DIRS = Object.freeze({
  "+x": [1, 0, 0], "-x": [-1, 0, 0], "+z": [0, 0, 1], "-z": [0, 0, -1],
});

function fail(msg) { throw new Error(`limewashAspect: ${msg}`); }

function namespaced(id) {
  return typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id;
}

/**
 * LIMEWASH — directional partial-coverage finishing coat.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{block:string, aspects:Array<"+x"|"-x"|"+z"|"-z">, coverage?:number,
 *          minRun?:number, preserve?:string[]}} opts
 *   aspects — the weather-facing direction(s); only these exteriors are ever visited.
 *   preserve — block ids (the dressed roles' materials) that are never overpainted.
 * @returns {{placements:{op:"voxel",pos:number[],block:string}[],
 *            report:{aspects:string[], eligible:number, painted:number, preservedSkipped:number,
 *                    alreadyCoated:number}}}
 */
export function limewashAspect(occ, opts = {}) {
  const { block, aspects, coverage = 1, minRun = 2, preserve = [] } = opts;
  if (typeof block !== "string" || !block.length) fail("opts.block must be a non-empty block id");
  if (!Array.isArray(aspects) || !aspects.length) fail("opts.aspects must name at least one weather-facing direction");
  for (const a of aspects) if (!DIRS[a]) fail(`opts.aspects contains unknown direction "${a}"`);
  if (!Number.isFinite(coverage) || coverage <= 0 || coverage > 1) fail("opts.coverage must be in (0, 1]");
  if (!Number.isInteger(minRun) || minRun < 1) fail("opts.minRun must be an integer ≥ 1");

  const wash = bareBlock(block);
  const preserveSet = new Set(preserve.map(bareBlock));

  const placements = [];
  const report = { aspects: [...aspects], eligible: 0, painted: 0, preservedSkipped: 0, alreadyCoated: 0 };

  for (const aspect of aspects) {
    const rowAxis = DIRS[aspect][0] !== 0 ? 2 : 0; // rows run along the wall, ⊥ to the normal

    // the aspect's EXTERIOR skin: the first occupied voxel per ray — the canonical projection
    // lens (one skin definition, no refork). An interior face exposed into the hollow shell is
    // NOT this aspect's exterior and is never visited.
    const rows = new Map(); // y → [{pos, block}] sorted along the row axis
    for (const gridRow of projectSurface(occ, aspect).cells) {
      for (const c of gridRow) {
        if (!c) continue;
        const cell = { pos: [...c.voxel], block: bareBlock(c.block) };
        if (preserveSet.has(cell.block)) { report.preservedSkipped++; continue; }
        report.eligible++;
        const y = cell.pos[1];
        if (!rows.has(y)) rows.set(y, []);
        rows.get(y).push(cell);
      }
    }

    for (const y of [...rows.keys()].sort((a, b) => a - b)) {
      const row = rows.get(y).sort((a, b) => a.pos[rowAxis] - b.pos[rowAxis]);
      // chunk into brush strokes of minRun; select chunk i when the coverage ratio crosses an
      // integer — deterministic, contiguous, ~coverage of the row
      for (let i = 0; i * minRun < row.length; i++) {
        if (Math.floor((i + 1) * coverage) <= Math.floor(i * coverage) && coverage < 1) continue;
        for (const cell of row.slice(i * minRun, (i + 1) * minRun)) {
          if (cell.block === wash) { report.alreadyCoated++; continue; }
          placements.push({ op: "voxel", pos: [...cell.pos], block: namespaced(block) });
          report.painted++;
        }
      }
    }
  }
  return { placements, report };
}
