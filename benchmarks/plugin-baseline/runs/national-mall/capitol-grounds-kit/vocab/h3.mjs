// The eight plan.md helpers for the Capitol West Front grounds: copingRing, slabStep, hedgeBed, balustradeRun,
// fountainBasin, pedestal, cavalryGroup, lampPost. Each takes its position as arguments and returns how many blocks
// it placed. Blocks and states follow plan.md's PALETTE and VOCABULARY; coordinates are module coordinates.
//
// Placement rule, for every helper: a cell takes a block only if it is air. A write into ground, water, walls or an
// earlier part's block is refused and counted in g.refused (the record guard() keeps), so the ground part's columns
// stay as laid. One exception, bounded to the column's top block: a plan's ground-level surface (a walk slab, a moss
// bed) replaces the top block of its column and nothing below it. Heights come from the grid: the top ground block of
// a column, skipping trees, props and walls.

import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air", "minecraft:structure_void"]);
const PROP = /_leaves$|_log$|^shroomlight$|^decorated_pot$|^lantern$|_wall$|_fence$/;

const isAir = (g, x, y, z) => AIR.has(g.blockAt(x, y, z));
const bare = (block) => block.replace(/^minecraft:/, "");

/** A wall block with its state written in full: up, and each side none / low / tall. */
const WALL = (block, { up = true, ...sides } = {}) => [block, { up: String(up), north: "none", east: "none", south: "none", west: "none", ...sides }];
/** Leaves that stay put: persistent, as plan.md requires. */
const LEAF = (block) => [block, { persistent: "true", distance: "1", waterlogged: "false" }];

/** Write one block into air. Returns 1 when placed, 0 when refused (a non-air cell, unless `over`). */
function put(g, x, y, z, block, state, over = false) {
  if (!g.inBounds(x, y, z)) throw new Error(`out of bounds: ${x},${y},${z}`);
  if (!isAir(g, x, y, z) && !over) {
    (g.refused ??= []).push([x, y, z, block]);
    return 0;
  }
  g.set(x, y, z, block, state);
  return 1;
}

/** The plan's ground-level surface: replace (x, y, z) only when it is the column's top block. */
function surface(g, x, y, z, block, state) {
  if (isAir(g, x, y, z)) return put(g, x, y, z, block, state);
  for (let yy = y + 1; yy < g.size[1]; yy++) {
    if (!isAir(g, x, yy, z)) {
      (g.refused ??= []).push([x, y, z, block]);
      return 0;
    }
  }
  g.set(x, y, z, block, state);
  return 1;
}

/** The top ground block of a column (trees, props and walls skipped). Throws when the column has no ground. */
function groundY(g, x, z) {
  for (let y = g.size[1] - 1; y >= 0; y--) {
    if (!isAir(g, x, y, z) && !PROP.test(bare(g.blockAt(x, y, z)))) return y;
  }
  throw new Error(`no ground at ${x},${z}`);
}

/** Pool coping: a 2-wide ring x0..x1, z0..z1 at y3. Outer row: polished_andesite on stone fill y1..2. Inner row: a
 * bottom smooth_stone_slab, touching the water. */
export function copingRing(g, x0, z0, x1, z1, { over = false } = {}) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const outer = x === x0 || x === x1 || z === z0 || z === z1;
    const ring = outer || x - x0 === 1 || x1 - x === 1 || z - z0 === 1 || z1 - z === 1;
    if (!ring) continue;
    if (outer) {
      n += put(g, x, 1, z, "stone", undefined, over);
      n += put(g, x, 2, z, "stone", undefined, over);
      n += put(g, x, 3, z, "polished_andesite", undefined, over);
    } else {
      n += put(g, x, 3, z, ...B.slab("smooth_stone", "bottom"), over);
    }
  }
  return n;
}

/** A walk step at ground height H: dirt filled up to H-1, then a bottom smooth_sandstone_slab at H (over the grass). */
export function slabStep(g, x, z, H) {
  let n = 0;
  for (let y = 1; y < H; y++) n += put(g, x, y, z, "dirt");
  return n + surface(g, x, H, z, ...B.slab("smooth_sandstone", "bottom"));
}

/** A planting bed x0..x1, z0..z1: moss_block at each ground top H, then azalea leaves at H+1 (flowering every 5th,
 * a shroomlight in place of the leaf every 4th, so the hedge stays one high). */
export function hedgeBed(g, x0, z0, x1, z1) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const H = groundY(g, x, z);
    n += surface(g, x, H, z, "moss_block");
    const i = x - x0 + (z - z0);
    if (i % 4 === 0) n += put(g, x, H + 1, z, "shroomlight");
    else if (i % 5 === 0) n += put(g, x, H + 1, z, ...LEAF("flowering_azalea_leaves"));
    else n += put(g, x, H + 1, z, ...LEAF("azalea_leaves"));
  }
  return n;
}

/** A balustrade along a straight line: line = { axis: "x" | "z", at, from, to } (at is the fixed coordinate). A
 * diorite_wall at y, with quartz_pillar piers at y every 8 from `from`, at `to`, and either side of each gap; a
 * smooth_quartz_slab top rail at y+1 on every wall. gaps = [[a, b], ...] stay open: nothing is placed in them. */
export function balustradeRun(g, line, y, gaps = [], { over = false } = {}) {
  const cell = (t) => (line.axis === "x" ? [t, y, line.at] : [line.at, y, t]);
  const inGap = (t) => gaps.some(([a, b]) => t >= a && t <= b);
  const pier = (t) => (t - line.from) % 8 === 0 || t === line.to || gaps.some(([a, b]) => t === a - 1 || t === b + 1);
  const run = (t) => t >= line.from && t <= line.to && !inGap(t);
  const link = (d) => (run(d) ? "low" : "none");
  let n = 0;
  for (let t = line.from; t <= line.to; t++) {
    if (inGap(t)) continue;
    const [x, , z] = cell(t);
    if (pier(t)) {
      n += put(g, x, y, z, "quartz_pillar", { axis: "y" }, over);
      continue;
    }
    const sides = line.axis === "x"
      ? { east: link(t + 1), west: link(t - 1) }
      : { north: link(t - 1), south: link(t + 1) };
    const straight = link(t + 1) === "low" && link(t - 1) === "low";
    n += put(g, x, y, z, ...WALL("diorite_wall", { up: !straight, ...sides }), over);
    n += put(g, x, y + 1, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" }, over);
  }
  return n;
}

/** A fountain basin x0..x1, z0..z1 with its rim at y: smooth_quartz floor at y-1, a smooth_quartz rim ring at y, still
 * water one deep inside it. jet: a 2-high water column at the centre. A decorated_pot urn on each rim corner. */
export function fountainBasin(g, x0, z0, x1, z1, y, jet = false, { over = false } = {}) {
  if (x1 - x0 < 2 || z1 - z0 < 2) throw new Error("fountainBasin needs at least 3 x 3 cells");
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    n += put(g, x, y - 1, z, "smooth_quartz", undefined, over);
    const rim = x === x0 || x === x1 || z === z0 || z === z1;
    n += rim ? put(g, x, y, z, "smooth_quartz", undefined, over) : put(g, x, y, z, "water", undefined, over);
  }
  if (jet) n += put(g, (x0 + x1) >> 1, y + 1, (z0 + z1) >> 1, "water", undefined, over);
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) n += put(g, x, y + 1, z, "decorated_pot", undefined, over);
  return n;
}

/** A pedestal x0..x1, z0..z1: a quartz_pillar shaft from y0 to y1-1, a polished_blackstone top course at y1. */
export function pedestal(g, x0, z0, x1, z1, y0, y1, { over = false } = {}) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    for (let y = y0; y < y1; y++) n += put(g, x, y, z, "quartz_pillar", { axis: "y" }, over);
    n += put(g, x, y1, z, "polished_blackstone", undefined, over);
  }
  return n;
}

/** The cavalry group x0..x1, z0..z1 on a white smooth_quartz base at baseY. Three horses charge west, staggered
 * (z offsets 1, 2, 4): each has wall legs at baseY+1, a 2-long polished_blackstone body at baseY+2 with a stair head
 * facing west, and a wall rider at baseY+3. Needs 5 x 5 cells. */
export function cavalryGroup(g, x0, z0, x1, z1, baseY = 7, { over = false } = {}) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) n += put(g, x, baseY, z, "smooth_quartz", undefined, over);
  for (const [dz, dx] of [[1, 0], [2, 1], [4, 0]]) {
    const z = z0 + dz, xw = x0 + dx;
    if (z > z1 || xw + 2 > x1) throw new Error("cavalryGroup: the box is too small for three horses");
    n += put(g, xw, baseY + 1, z, ...WALL("polished_blackstone_wall"), over);
    n += put(g, xw + 2, baseY + 1, z, ...WALL("polished_blackstone_wall"), over);
    n += put(g, xw, baseY + 2, z, ...B.stairs("polished_blackstone", "west", "bottom"), over);
    n += put(g, xw + 1, baseY + 2, z, "polished_blackstone", undefined, over);
    n += put(g, xw + 2, baseY + 2, z, "polished_blackstone", undefined, over);
    n += put(g, xw + 1, baseY + 3, z, ...WALL("polished_blackstone_wall"), over);
  }
  return n;
}

/** A lamp post at (x, z): a polished_blackstone_wall at H+1..H+2 and a standing lantern at H+3. H is the ground top
 * unless opts.H is given. */
export function lampPost(g, x, z, { H, over = false } = {}) {
  const h = H ?? groundY(g, x, z);
  let n = 0;
  n += put(g, x, h + 1, z, ...WALL("polished_blackstone_wall"), over);
  n += put(g, x, h + 2, z, ...WALL("polished_blackstone_wall"), over);
  n += put(g, x, h + 3, z, ...B.lantern(false), over);
  return n;
}
