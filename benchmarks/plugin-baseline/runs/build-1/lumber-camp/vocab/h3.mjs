// Helpers for the lumber camp (plan.md VOCABULARY items 3, 7, 11, 15, 19, 23, 27, 31): saddleNotch, doorPair, millPost,
// boardBay, lumberStack, boilerFirebox, stump, pathRun. Each takes the grid (a runParts view or a Grid) first, then the
// plan's arguments, then an optional { over } (default false: write only into air). Coordinates are absolute, x east,
// y up, z south. A helper writes only its own footprint and never below y=1: ground, floors and sand belong to earlier
// parts. pathRun is the one helper that touches y=0, laying dirt_path on ground it finds there. A cell that is not air
// is skipped and listed in `skipped`, never overwritten. Each returns { placed, skipped }.
import { DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const GROUND = new Set(["minecraft:grass_block", "minecraft:coarse_dirt", "minecraft:podzol", "minecraft:rooted_dirt",
  "minecraft:dirt", "minecraft:gravel", "minecraft:sand", "minecraft:dirt_path"]);
const HINGES = ["left", "right"];
const lo = (a, b) => Math.min(a, b), hi = (a, b) => Math.max(a, b);
const inBox = (x, y, z, [a, b, c, d, e, f]) => x >= lo(a, d) && x <= hi(a, d) && y >= lo(b, e) && y <= hi(b, e) && z >= lo(c, f) && z <= hi(c, f);

/**
 * Write [x, y, z, block, state] cells. Every cell is checked first (bounds, y >= 1, air). With `atomic` (a unit such as
 * a door, post or stack) one blocked cell means nothing is written; otherwise each free cell is written on its own.
 */
function place(g, cells, over = false, atomic = true) {
  for (const [x, y, z] of cells) {
    if (!g.inBounds(x, y, z)) throw new Error(`refusing to write out of bounds at ${x},${y},${z}`);
    if (y < 1) throw new Error(`refusing to write at y=${y}: helpers stand above the ground (y >= 1)`);
  }
  const skipped = cells.filter(([x, y, z]) => !over && !g.isAir(x, y, z)).map(([x, y, z]) => [x, y, z]);
  if (atomic && skipped.length) return { placed: 0, skipped };
  let placed = 0;
  for (const [x, y, z, block, state] of cells) {
    if (!over && !g.isAir(x, y, z)) continue;
    g.set(x, y, z, block, state);
    placed++;
  }
  return { placed, skipped };
}

// ---- log wall detail (item 3) ----------------------------------------------------------------------------------------
/** One protruding log end on a wall; `axis` is the axis the wall runs along (x or z). */
export function saddleNotch(g, x, y, z, axis, opts = {}) {
  if (axis !== "x" && axis !== "z") throw new Error(`saddleNotch: axis is x or z, got ${axis}`);
  return place(g, [[x, y, z, "spruce_log", { axis }]], !!opts.over);
}

// ---- doors (item 7) --------------------------------------------------------------------------------------------------
/** A spruce door at (x, y, z) and its upper half at y + 1. `facing` is the way it faces out of the room it closes. */
export function doorPair(g, x, y, z, facing, hinge, opts = {}) {
  if (!DIRS[facing]) throw new Error(`doorPair: facing is north, south, east or west, got ${facing}`);
  if (!HINGES.includes(hinge)) throw new Error(`doorPair: hinge is left or right, got ${hinge}`);
  const st = (half) => ({ facing, half, hinge, open: "false" });
  return place(g, [[x, y, z, "spruce_door", st("lower")], [x, y + 1, z, "spruce_door", st("upper")]], !!opts.over);
}

// ---- mill frame and boards (items 11, 15) ----------------------------------------------------------------------------
/** A pale stripped spruce post at (x, z), y = 1..5. */
export function millPost(g, x, z, opts = {}) {
  const cells = [1, 2, 3, 4, 5].map((y) => [x, y, z, "stripped_spruce_log", { axis: "y" }]);
  return place(g, cells, !!opts.over);
}

/**
 * A spruce plank wall panel at z, x0..x1 by y0..y1. `doorway` (optional, a ROOMS-style box [x0,y0,z0,x1,y1,z1]) is left
 * as air. Cells that are not air are skipped one by one, so posts already in place are kept.
 */
export function boardBay(g, x0, x1, z, y0, y1, opts = {}) {
  const cells = [];
  for (let x = lo(x0, x1); x <= hi(x0, x1); x++)
    for (let y = lo(y0, y1); y <= hi(y0, y1); y++) {
      if (opts.doorway && inBox(x, y, z, opts.doorway)) continue;
      cells.push([x, y, z, "spruce_planks", {}]);
    }
  return place(g, cells, !!opts.over, false);
}

// ---- sawn lumber (item 19) -------------------------------------------------------------------------------------------
/**
 * A sawn-lumber stack, 3 wide (x0..x0+2) by 6 deep (z0..z0+5) by 4 high (y=1..4): stripped skids at y=1 (z0, z0+2,
 * z0+5), birch planks at y=2, stripped stickers at y=3 (z0+1, z0+4), top course at y=4 as birch planks, or birch slabs
 * (type top) with `slabTop`. Atomic: a stack is all or nothing.
 */
export function lumberStack(g, x0, z0, opts = {}) {
  const xs = [x0, x0 + 1, x0 + 2], zs = [0, 1, 2, 3, 4, 5].map((i) => z0 + i);
  const cells = [];
  for (const z of [z0, z0 + 2, z0 + 5]) for (const x of xs) cells.push([x, 1, z, "stripped_spruce_wood", { axis: "x" }]);
  for (const z of zs) for (const x of xs) cells.push([x, 2, z, "birch_planks", {}]);
  for (const z of [z0 + 1, z0 + 4]) for (const x of xs) cells.push([x, 3, z, "stripped_spruce_wood", { axis: "x" }]);
  for (const z of zs) for (const x of xs) cells.push(opts.slabTop
    ? [x, 4, z, "birch_slab", { type: "top" }] : [x, 4, z, "birch_planks", {}]);
  return place(g, cells, !!opts.over);
}

// ---- boiler firebox (item 23) ----------------------------------------------------------------------------------------
/** The boiler's firebox: a lit blast_furnace at (x, 1, z) and a lit furnace at (x, 1, z + 1), both facing west. */
export function boilerFirebox(g, x, z, opts = {}) {
  return place(g, [
    [x, 1, z, "blast_furnace", { facing: "west", lit: "true" }],
    [x, 1, z + 1, "furnace", { facing: "west", lit: "true" }],
  ], !!opts.over);
}

// ---- stumps (item 27) ------------------------------------------------------------------------------------------------
/**
 * A spruce stump h high (y=1..h) at (x, z). A fern goes on the first free cell beside it at y=1 that has ground under
 * it (+x, -x, +z, -z). The ground (podzol, rooted dirt) is groundPatch's; this writes none of it.
 */
export function stump(g, x, z, h, opts = {}) {
  if (!(h >= 1)) throw new Error(`stump: h is at least 1, got ${h}`);
  const cells = [];
  for (let y = 1; y <= h; y++) cells.push([x, y, z, "spruce_log", { axis: "y" }]);
  const r = place(g, cells, !!opts.over);
  if (r.skipped.length) return r;
  const beside = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]
    .find(([fx, fz]) => g.inBounds(fx, 1, fz) && g.isAir(fx, 1, fz) && !g.isAir(fx, 0, fz));
  if (beside) { g.set(beside[0], 1, beside[1], "fern", {}); r.placed++; }
  return r;
}

// ---- paths (item 31) -------------------------------------------------------------------------------------------------
/**
 * A dirt_path run from (x0, z0) to (x1, z1), straight along x or z. The body is `width` cells across (the run extends
 * toward +z or +x); the two end cells are 2 across. Only ground at y=0 is replaced (grass, dirt, podzol, gravel ...);
 * anything else on the cell (a stone, a floor) is skipped and listed.
 */
export function pathRun(g, x0, z0, x1, z1, width) {
  if (x0 !== x1 && z0 !== z1) throw new Error(`pathRun: a straight run (x0 === x1 or z0 === z1), got ${x0},${z0} to ${x1},${z1}`);
  if (!(width >= 1)) throw new Error(`pathRun: width is at least 1, got ${width}`);
  const alongX = z0 === z1, line = alongX ? z0 : x0;
  const from = alongX ? lo(x0, x1) : lo(z0, z1), to = alongX ? hi(x0, x1) : hi(z0, z1);
  const skipped = [];
  let placed = 0;
  for (let s = from; s <= to; s++) {
    const w = s === from || s === to ? Math.max(width, 2) : width;
    for (let k = 0; k < w; k++) {
      const x = alongX ? s : line + k, z = alongX ? line + k : s;
      if (!g.inBounds(x, 0, z)) continue;
      if (!GROUND.has(g.blockAt(x, 0, z))) { skipped.push([x, 0, z]); continue; }
      g.set(x, 0, z, "dirt_path", {});
      placed++;
    }
  }
  return { placed, skipped };
}
