// A bridge where a graded street crosses water (thread 0013), as the blocks to lay: a paved deck at the street's level on
// a stone course, piers every 6 down to the bed, the kingdom's parapet along both sides (joined, a post over each pier),
// a lantern on each pier's posts. Pure: the grade's grids in, a block list out; the caller only says where the bed is.
//   bridgeBlocks({ X, Z, target, bridge, role, style, bedAt, pave }) -> [[x, y, z, block], ...]
//     bridge   the grade's bridge grid (1 a street running along z, 2 along x, 0 none)
//     role     the grade's roles: a deck side is where the cell across the street is neither bridge nor street
//     style    the kingdom's earthworks style (its course for the piers, its parapet)
//     bedAt    (x, z) -> the height of the first solid block under the water there
//     pave     (x, z) -> the deck's paving block (default the kingdom's street paving: polished andesite and stone brick)
import { hash } from "../lordaeron/earthworks.mjs";
import { ROLE } from "./grade.mjs";

export function bridgeBlocks({ X, Z, target, bridge, role, style: S, bedAt, pave = (x, z) => ((x + z) % 2 ? "stone_bricks" : "polished_andesite"), pierEvery = 6 }) {
  const out = [], at = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? -1 : z * X + x);
  const isDeck = (i) => i >= 0 && (bridge[i] || role[i] === ROLE.street || role[i] === ROLE.forum);
  const rails = new Map();
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const i = z * X + x; if (!bridge[i]) continue;
    const t = target[i], alongZ = bridge[i] === 1, pier = (alongZ ? z : x) % pierEvery === 0;
    for (let y = t + 1; y <= t + 3; y++) out.push([x, y, z, "air"]);
    out.push([x, t, z, pave(x, z)], [x, t - 1, z, "stone_bricks"]);
    if (pier) for (let y = t - 2, bed = bedAt(x, z); y > bed; y--) out.push([x, y, z, S.course(hash(x, y, z, 3))]);
    const across = alongZ ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
    if (across.some(([dx, dz]) => !isDeck(at(x + dx, z + dz)))) rails.set(i, { x, z, y: t + 1, pier });
  }
  // the parapet, joined along each side: a post where it ends or over a pier (with a lantern), rails between
  for (const [i, r] of rails) {
    const p = Object.fromEntries([["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]].map(([d, dx, dz]) => { const j = at(r.x + dx, r.z + dz); return [d, rails.has(j) && rails.get(j).y === r.y ? "low" : "none"]; }));
    const ends = Object.values(p).filter((v) => v === "low").length, post = r.pier || ends !== 2;
    out.push([r.x, r.y, r.z, S.parapet(p, post)]);
    if (r.pier) out.push([r.x, r.y + 1, r.z, "lantern[hanging=false,waterlogged=false]"]);
  }
  return out;
}

/** Where a street ends at the shore (a crossing not built): steps down from the street's level to a block over the
 *  water by half steps, the street's width, then a timber jetty on posts out over the water (`jetty` long), with a
 *  lantern on a post at each side of the landing. Pure: blocks out.
 *    landingBlocks({ at: [x, z], facing, level, water, width, style, jetty }) -> [[x, y, z, block], ...]
 *    at       the street's last cell on its line at the near bank; facing: the way out over the water */
export function landingBlocks({ at: [x0, z0], facing, level, water, width = 3, style: S, jetty = 4, pave = (x, z) => ((x + z) % 2 ? "stone_bricks" : "polished_andesite") }) {
  const out = [], [fx, fz] = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[facing], [sx, sz] = [fz, fx];
  const half = Math.floor((width - 1) / 2), across = [...Array(width).keys()].map((k) => k - half);
  const deck = water + 1;                                          // the jetty's deck, a block over the water
  // the steps, out from the bank: the walking surface drops half a block a cell (a slab, then a block, ...) from the
  // street's (its level + 1) to the jetty's (water + 2); each step stands on coursed stone down into the water
  let k = 1;
  for (let walk = level + 0.5; walk > deck + 1; walk -= 0.5, k++) for (const o of across) {
    const x = x0 + fx * k + sx * o, z = z0 + fz * k + sz * o, whole = Number.isInteger(walk), y = whole ? walk - 1 : Math.floor(walk);
    for (let yy = y + 1; yy <= level + 3; yy++) out.push([x, yy, z, "air"]);
    for (let yy = (whole ? y - 1 : y - 1); yy >= water - 2; yy--) out.push([x, yy, z, S.course(hash(x, yy, z, 3))]);
    out.push([x, y, z, whole ? pave(x, z) : `${S.tread_slab}_slab[type=bottom,waterlogged=false]`]);
  }
  for (let j = 0; j < jetty; j++) for (const o of across) {
    const x = x0 + fx * (k + j) + sx * o, z = z0 + fz * (k + j) + sz * o;
    out.push([x, deck, z, "spruce_planks"]);
    if ((j === jetty - 1 || j % 3 === 0) && Math.abs(o) === half) for (let y = deck - 1; y >= water - 3; y--) out.push([x, y, z, "spruce_log[axis=y]"]);
  }
  // lanterns at the head of the steps
  for (const o of [-half - 1, half + 1]) { const x = x0 + sx * o, z = z0 + sz * o; out.push([x, level + 1, z, S.lamp_post[0]], [x, level + 2, z, S.lamp_post[1] ?? S.lamp_post[0]], [x, level + 3, z, "lantern[hanging=false,waterlogged=false]"]); }
  return out;
}
