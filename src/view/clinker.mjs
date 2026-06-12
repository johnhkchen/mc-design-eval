// Clinker cladding — lapped board courses (T-132-01, story S-132, epic E-32; saltcrag's
// boarded loft). The visual signature is the horizontal shadow-line rhythm of overlapping
// hull-planking: alternating courses sit PROUD of the wall plane (a one-cell lap in front of
// the wall face) while the courses between are repainted flush, so every other course casts
// a shadow line. Neither surface.fill (flat recolor) nor timber-frame (post-and-beam) can
// produce the lap.
//
// The proud layer is emitted only in front of EXISTING zone wall cells, so the wall's
// in-plane silhouette (the gable rake included) is preserved by construction — no board can
// protrude past the rake line. Idempotent: a cell already carrying the board/trim material
// neither repaints nor casts a further lap (re-running on the brush's own output emits
// nothing). PURE — no GL/IO/Date/random; byte-stable placement order.

import { bareBlock } from "./occupancy.mjs";
import { projectSurface } from "./surface-grid.mjs";

const DIRS = Object.freeze({
  "+x": [1, 0, 0], "-x": [-1, 0, 0], "+z": [0, 0, 1], "-z": [0, 0, -1],
});

const isInt = (n) => Number.isInteger(n);

function fail(msg) { throw new Error(`clinkerCourses: ${msg}`); }

function namespaced(id) {
  return typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id;
}

/**
 * CLINKER COURSES — lap-board cladding over a zone's exterior walls.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{board:string, lap?:0|1, course?:number, trimBlock?:string|null,
 *          zoneOf:(pos:number[])=>string|null, zone?:string,
 *          faces?:Array<"+x"|"-x"|"+z"|"-z">}} opts
 * @returns {{placements:{op:"voxel",pos:number[],block:string}[],
 *            report:{courses:number, shadowLines:number, proudCells:number, flushCells:number}}}
 */
export function clinkerCourses(occ, opts = {}) {
  const {
    board, lap = 1, course = 1, trimBlock = null,
    zoneOf, zone = "upper", faces = ["+x", "-x", "+z", "-z"],
  } = opts;
  if (typeof board !== "string" || !board.length) fail("opts.board must be a non-empty block id");
  if (lap !== 0 && lap !== 1) fail("opts.lap must be 0 (flush) or 1 (one proud face)");
  if (!isInt(course) || course < 1) fail("opts.course must be an integer ≥ 1");
  if (trimBlock !== null && (typeof trimBlock !== "string" || !trimBlock.length)) fail("opts.trimBlock must be a block id or null");
  if (typeof zoneOf !== "function") fail("opts.zoneOf is required (the zone lens decides where boards belong)");
  for (const f of faces) if (!DIRS[f]) fail(`opts.faces contains unknown face "${f}"`);

  const clad = new Set([bareBlock(board), ...(trimBlock ? [bareBlock(trimBlock)] : [])]);

  // eligible: zone cells on a face's EXTERIOR projection skin (first occupied voxel per ray —
  // the canonical lens; an inner face exposed into a hollow interior is never boarded), that
  // are not themselves already clinker material (the idempotency rule — boards do not re-lap)
  const skin = new Map(faces.map((f) => {
    const keys = new Set();
    for (const row of projectSurface(occ, f).cells) for (const c of row) if (c) keys.add(c.voxel.join(","));
    return [f, keys];
  }));
  const eligible = [];
  for (const [key, blk] of [...occ.cells.entries()].sort()) {
    const [x, y, z] = key.split(",").map(Number);
    if (zoneOf([x, y, z]) !== zone) continue;
    const exposed = faces.filter((f) => skin.get(f).has(key));
    if (!exposed.length) continue;
    eligible.push({ pos: [x, y, z], block: bareBlock(blk), exposed });
  }
  if (!eligible.length) {
    return { placements: [], report: { courses: 0, shadowLines: 0, proudCells: 0, flushCells: 0 } };
  }

  const ys = eligible.map((c) => c.pos[1]);
  const yBase = Math.min(...ys);
  const idxOf = (y) => Math.floor((y - yBase) / course);
  const maxIdx = idxOf(Math.max(...ys));
  const blockAt = (idx) => (trimBlock && (idx === 0 || idx === maxIdx) ? trimBlock : board);

  const placements = [];
  let proudCells = 0;
  let flushCells = 0;
  for (const cell of eligible) {
    if (clad.has(cell.block)) continue; // already boarded — never re-lap
    const [x, y, z] = cell.pos;
    const idx = idxOf(y);
    const target = blockAt(idx);
    const proud = lap === 1 && idx % 2 === 1;
    if (proud) {
      for (const f of cell.exposed) {
        const d = DIRS[f];
        const out = [x + d[0], y + d[1], z + d[2]];
        if (occ.has(...out)) continue; // lap already cast (or another mass) — skip
        placements.push({ op: "voxel", pos: out, block: namespaced(target) });
        proudCells++;
      }
    } else if (cell.block !== bareBlock(target)) {
      placements.push({ op: "voxel", pos: [x, y, z], block: namespaced(target) });
      flushCells++;
    }
  }

  const courses = maxIdx + 1;
  const shadowLines = lap === 1 ? Math.floor(courses / 2) : 0;
  return { placements, report: { courses, shadowLines, proudCells, flushCells } };
}
