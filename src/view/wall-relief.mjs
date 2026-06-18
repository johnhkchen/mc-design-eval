// WALL-RELIEF CORE (T-195-01, story S-195, epic E-51) — the pure logic behind the picture-climb's
// `relief_walls` hand: turn a flat wall into PALE DRESSED STONE WITH PROUD QUOINS/PLINTH (construction,
// not recolor). This is the lever `articulate_walls` lacked: it recolors a flat plane, so the residual
// WALL critique item ("the dressed field reading DISTINCT FROM the rough rubble corners") never cleared.
//
// THE LOAD-BEARING MOVE is RECOLOR-THEN-COMPOSE. The E-43 proud op (surfaceRelief, reached here only
// through composeTreatment — the registry door, never a direct technique import) SKIPS a proud column
// whose SOURCE cell already IS the relief material (the idempotence / clinker rule). The gatehouse
// corners are already cobblestone == the quoin material, so composeTreatment's quoin no-op'd
// (proudCells=0 — articulate_walls' own recorded note). Recoloring the field (corners included) to the
// pale dressed block FIRST clears that collision, so the proud cobblestone quoin/plinth now EMITS against
// a uniform dressed field. The recolor fixes the value defect; the compose builds the relief.
//
// PURE — no GL, no I/O, no Date/random (program/pack are data in). Runs under `src/**/*.test.mjs`. The
// proud/quoin geometry and the recess-by-exclusion closure guard are inherited verbatim from
// src/view/treatment-grammar.mjs (the E-43 engine); this module only RECOLORS then sources a RESTRAINED
// spec (base plinth + corner quoins; no field clinker belt, no cornice by default — the amplitude-is-the
// -lever lesson, [[facade-grammar-recolor-vs-construction]]). WALL-only: no edges.opening (OPENING is
// S-194/T-194-01's aperture-carve territory).

import { occupancyFromCells, bareBlock } from "./occupancy.mjs";
import { composeTreatment } from "./treatment-grammar.mjs";
import { roleBlock } from "../recognition/compile.mjs";

export const WALL_RELIEF_SCHEMA = "wall-relief/v1";

const fail = (where, msg) => { throw new Error(`${where}: ${msg}`); };
const isInt = (n) => Number.isInteger(n);

/** The wall-band cubes the recolor must NOT touch (the dark-oak arch-frame timber). Bare ids. */
export const DEFAULT_KEEP = Object.freeze(["dark_oak_log"]);

/**
 * RECOLOR THE WALL FIELD — rewrite every wall-band CUBE to `fieldBlock`, except the `keep` set and any
 * shaped/stair cell (form !== cube, left untouched). This both fixes the value defect (dark → pale
 * dressed stone) AND clears the existing dressing-coloured corners so the proud quoin can emit (the
 * recolor-first crux). Last-writer-wins, no air op, closure held (no cell removed). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{fieldBlock:string, floor:number, eaveY:number, keep?:string[]}} opts
 * @returns {{occ:import("./occupancy.mjs").Occupancy, recolored:number}}
 */
export function recolorWallField(occ, { fieldBlock, floor, eaveY, keep = DEFAULT_KEEP } = {}) {
  if (!occ?.bounds) fail("recolorWallField", "occupancy is empty");
  if (typeof fieldBlock !== "string" || !fieldBlock) fail("recolorWallField", "fieldBlock must be a block id");
  if (!isInt(floor) || !isInt(eaveY) || eaveY < floor) fail("recolorWallField", "floor and eaveY must be integers with eaveY >= floor");
  const keepSet = new Set(keep.map(bareBlock));
  const fieldBare = bareBlock(fieldBlock);
  const cells = [];
  let recolored = 0;
  for (const [key, blk] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    let block = blk;
    const isCube = !occ.forms.has(key); // shaped/stair cells (forms entry) pass through untouched
    if (isCube && y >= floor && y <= eaveY && !keepSet.has(bareBlock(blk)) && bareBlock(blk) !== fieldBare) {
      block = fieldBlock;
      recolored += 1;
    }
    cells.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
  }
  return { occ: occupancyFromCells(cells), recolored };
}

/**
 * Build a RESTRAINED treatment-grammar/v1 spec for wall relief: a proud dressing plinth course (base),
 * the field recessed BY EXCLUSION, and full-height geometry-derived corner QUOINS in the dressing block.
 * `edges.top` (eave cornice) is OFF by default (restraint — it fights the roof / band_eave); no
 * `edges.opening` (WALL-only). FAIL-LOUD when `dressBlock === fieldBlock` — a same-material relief
 * silently no-ops in surfaceRelief (the guard `sourceTreatment` enforces; the whole point of relief is
 * the field/dressing CONTRAST). PURE; JSON-round-trippable.
 * @param {{fieldBlock:string, dressBlock:string, floor:number, eaveY:number,
 *          includeBase?:boolean, includeTop?:boolean}} opts
 * @returns {object} a treatment-grammar/v1 spec
 */
export function wallReliefSpec({ fieldBlock, dressBlock, floor, eaveY, includeBase = true, includeTop = false } = {}) {
  if (typeof fieldBlock !== "string" || !fieldBlock) fail("wallReliefSpec", "fieldBlock must be a block id");
  if (typeof dressBlock !== "string" || !dressBlock) fail("wallReliefSpec", "dressBlock must be a block id");
  if (!isInt(floor) || !isInt(eaveY) || eaveY < floor) fail("wallReliefSpec", "floor and eaveY must be integers with eaveY >= floor");
  if (bareBlock(dressBlock) === bareBlock(fieldBlock)) {
    fail("wallReliefSpec",
      `dressBlock and fieldBlock both resolve to ${bareBlock(fieldBlock)} — a same-material relief silently ` +
      `no-ops (surfaceRelief skips it). The dressing role must differ from the field role.`);
  }
  const run = eaveY - floor + 1;
  const spec = {
    schema: "treatment-grammar/v1",
    field: { recess: true },
    edges: { corners: { material: dressBlock, amplitude: { headerDepth: 2, run } } },
  };
  if (includeBase) spec.base = { material: dressBlock, amplitude: { depth: 1 } };
  if (includeTop) spec.edges.top = { material: dressBlock, amplitude: { depth: 1, courses: 1 } };
  return spec;
}

/**
 * BUILD WALL RELIEF — recolor the wall field to the pale dressed stone, then compose a restrained proud
 * quoin/plinth relief over it (the E-43 engine, door-routed). Materials are READ from the program roles:
 * field = walls.ground.role, dressing = walls.dressing.role (→ upper → ground fallbacks). Returns the
 * final occupancy, the recess-by-exclusion closure verdict (from composeTreatment's recessClosureGuard),
 * the per-layer report, the resolved materials, and the recolor count. PURE (program/pack are data; no
 * disk, no GL, no injected opening-dressing seam).
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{program:object, pack:object, floor:number, eaveY:number,
 *          keep?:string[], includeBase?:boolean, includeTop?:boolean}} opts
 * @returns {{occ, closure:object, report:object, edges:object,
 *            materials:{fieldBlock:string, dressBlock:string}, recolored:number}}
 */
export function buildWallRelief(occ, { program, pack, floor, eaveY, keep, includeBase, includeTop } = {}) {
  if (!occ?.bounds) fail("buildWallRelief", "occupancy is empty");
  if (!program?.masses?.length) fail("buildWallRelief", "program has no masses");
  if (!pack?.palette?.length) fail("buildWallRelief", "pack has no palette");
  if (!isInt(floor) || !isInt(eaveY) || eaveY < floor) fail("buildWallRelief", "floor and eaveY must be integers with eaveY >= floor");
  const w = program.masses[0]?.walls ?? {};
  if (!w.ground?.role) fail("buildWallRelief", "mass.walls.ground.role is required");
  const fieldBlock = roleBlock(pack, w.ground.role);
  const dressRole = w.dressing?.role ?? w.upper?.role ?? w.ground.role;
  const dressBlock = roleBlock(pack, dressRole);

  const { occ: recolored, recolored: nRecolored } = recolorWallField(occ, { fieldBlock, floor, eaveY, keep });
  const spec = wallReliefSpec({ fieldBlock, dressBlock, floor, eaveY, includeBase, includeTop });
  const { occ: out, placements, edges, report, closure } = composeTreatment(recolored, spec, { floor, eaveY });
  return { occ: out, placements, edges, report, closure, materials: { fieldBlock, dressBlock }, recolored: nRecolored };
}
