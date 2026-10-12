// The nine h1 helpers from plan.md VOCABULARY. Each takes the grid first, then the position it is given (inclusive
// ranges), and returns how many blocks it wrote. Every write goes through put(): it lands only inside the helper's
// footprint and only into air, so a helper can't cut into another part's cells or the ground under it. opts.over
// writes into anything inside the footprint instead. Ground helpers (groundPatch) may also re-lay ground material.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const GROUND = new Set(["minecraft:grass_block", "minecraft:dirt", "minecraft:coarse_dirt", "minecraft:podzol", "minecraft:rooted_dirt", "minecraft:gravel"]);
const GROUND_MIX = { grass_block: 6, coarse_dirt: 3, podzol: 2, rooted_dirt: 1 };
const FENCE_POST = { north: "false", east: "false", south: "false", west: "false" };

// One write, refused unless (x, y, z) is inside fp = [x0, y0, z0, x1, y1, z1] and the cell is air
// (or ground, for ground helpers; or anything, with opts.over). Returns 1 if written, 0 if refused.
function put(g, fp, [x, y, z], block, state, { over = false, ground = false } = {}) {
  if (!(g instanceof Grid)) throw new TypeError("h1 helpers take the build grid (Grid or a guard/runParts view) first");
  const [x0, y0, z0, x1, y1, z1] = fp;
  if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) return 0;
  const free = g.isAir(x, y, z) || (ground && GROUND.has(g.blockAt(x, y, z)));
  if (!free && !over) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

// Deterministic cell hash: the "1 in 6" picks and the patch layout come out the same on every run.
function hash(x, y, z, seed = 1) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519) ^ Math.imul(seed, 3266489917);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return (h ^ (h >>> 16)) >>> 0;
}
const unit = (x, y, z, seed) => hash(x, y, z, seed) / 2 ** 32;

// Pick a key of weights {name: weight} from u in [0, 1).
function pickBy(weights, u) {
  const entries = Object.entries(weights), total = entries.reduce((s, [, w]) => s + w, 0);
  let acc = 0;
  for (const [block, w] of entries) { acc += w / total; if (u < acc) return block; }
  return entries.at(-1)[0];
}

/** plinthCourse(x0,z0,x1,z1,y): the ring of cobblestone at the edge of the box; corners always mossy, 1 in 6 elsewhere. */
export function plinthCourse(g, x0, z0, x1, z1, y, opts = {}) {
  const fp = [x0, y, z0, x1, y, z1];
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (!edge) continue;
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    const moss = corner || hash(x, y, z) % 6 === 0;
    n += put(g, fp, [x, y, z], moss ? "mossy_cobblestone" : "cobblestone", undefined, opts);
  }
  return n;
}

/**
 * paneWindow(x0,x1,y0,y1,fixed,axis): glass_pane over the span x0..x1 (along the wall; the run axis is `axis`, 'x' or
 * 'z') and y0..y1, in the wall plane `fixed` (z when axis is 'x', x when axis is 'z'). A spruce_slab (top) sill sits one
 * row below, one cell outside the wall: opts.out = -1 (north/west, the default) or +1 (south/east).
 */
export function paneWindow(g, x0, x1, y0, y1, fixed, axis, opts = {}) {
  const out = opts.out ?? -1;
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
  const planes = [fixed, fixed + out];
  const fp = axis === "x"
    ? [lo, y0 - 1, Math.min(...planes), hi, y1, Math.max(...planes)]
    : [Math.min(...planes), y0 - 1, lo, Math.max(...planes), y1, hi];
  const at = (s, y, p) => (axis === "x" ? [s, y, p] : [p, y, s]);
  // Panes join their neighbours along the wall; the wall ends are solid, so both ends connect.
  const pane = axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  let n = 0;
  for (let s = lo; s <= hi; s++) {
    for (let y = y0; y <= y1; y++) n += put(g, fp, at(s, y, fixed), "glass_pane", pane, opts);
    n += put(g, fp, at(s, y0 - 1, fixed + out), "spruce_slab", { type: "top", waterlogged: "false" }, opts);
  }
  return n;
}

/** lampPost(x,z,h): spruce_fence post y=1..h with a standing lantern on top at y=h+1. */
export function lampPost(g, x, z, h, opts = {}) {
  const fp = [x, 1, z, x, h + 1, z];
  let n = 0;
  for (let y = 1; y <= h; y++) n += put(g, fp, [x, y, z], "spruce_fence", FENCE_POST, opts);
  return n + put(g, fp, [x, h + 1, z], "lantern", { hanging: "false", waterlogged: "false" }, opts);
}

/** topPlate(x0,z0,x1,z1): stripped_spruce_wood ring at y=6; axis x on the z edges (corners included), axis z on the x edges. */
export function topPlate(g, x0, z0, x1, z1, opts = {}) {
  const fp = [x0, 6, z0, x1, 6, z1];
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (z === z0 || z === z1) n += put(g, fp, [x, 6, z], "stripped_spruce_wood", { axis: "x" }, opts);
    else if (x === x0 || x === x1) n += put(g, fp, [x, 6, z], "stripped_spruce_wood", { axis: "z" }, opts);
  }
  return n;
}

/**
 * filingBench(x,z): a 2 x 3 saw-filing bench on the floor (y=1, top at y=2). Barrel (facing up) and chest (facing west)
 * on the west column, grindstone (floor) in the middle of the east column, a spruce_slab bench top with a
 * spruce_pressure_plate on it at the north end of the east column.
 */
export function filingBench(g, x, z, opts = {}) {
  const fp = [x, 1, z, x + 1, 2, z + 2];
  let n = 0;
  n += put(g, fp, [x, 1, z], "barrel", { facing: "up", open: "false" }, opts);
  n += put(g, fp, [x, 1, z + 2], "chest", { facing: "west", type: "single", waterlogged: "false" }, opts);
  n += put(g, fp, [x + 1, 1, z + 1], "grindstone", { face: "floor", facing: "north" }, opts);
  n += put(g, fp, [x + 1, 1, z], "spruce_slab", { type: "bottom", waterlogged: "false" }, opts);
  n += put(g, fp, [x + 1, 2, z], "spruce_pressure_plate", { powered: "false" }, opts);
  return n;
}

/**
 * brickStack(x,z,yTop,bandY): 2x2 bricks shaft on its own footing (y=1..yTop) at x..x+1, z..z+1. A deepslate_bricks band
 * at bandY, with hay_block in the signal cell (x+1, z+1). A lit signal campfire on the top course in that same cell,
 * and a brick_slab (bottom) cap ring at yTop+1 around the shaft, the shaft's own cells left air above it.
 */
export function brickStack(g, x, z, yTop, bandY, opts = {}) {
  const fp = [x - 1, 1, z - 1, x + 2, yTop + 1, z + 2];
  let n = 0;
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    const sx = x + dx, sz = z + dz, signal = dx === 1 && dz === 1;
    for (let y = 1; y <= yTop; y++) {
      if (y === yTop && signal) n += put(g, fp, [sx, y, sz], "campfire", { facing: "north", lit: "true", signal_fire: "true", waterlogged: "false" }, opts);
      else if (y === bandY && signal) n += put(g, fp, [sx, y, sz], "hay_block", { axis: "y" }, opts);
      else if (y === bandY) n += put(g, fp, [sx, y, sz], "deepslate_bricks", undefined, opts);
      else n += put(g, fp, [sx, y, sz], "bricks", undefined, opts);
    }
  }
  for (let cx = x - 1; cx <= x + 2; cx++) for (let cz = z - 1; cz <= z + 2; cz++) {
    const inShaft = cx >= x && cx <= x + 1 && cz >= z && cz <= z + 1;
    if (!inShaft) n += put(g, fp, [cx, yTop + 1, cz], "brick_slab", { type: "bottom", waterlogged: "false" }, opts);
  }
  return n;
}

/**
 * messTable(x0,x1,z): a long table on the x axis at row z. spruce_fence legs every 2 cells (and at x1), spruce_slab (top)
 * tops at y=3, and spruce_stairs benches at y=2 on both sides: row z-1 faces north, row z+1 faces south (each back is
 * away from the table, so the seat faces it).
 */
export function messTable(g, x0, x1, z, opts = {}) {
  const fp = [x0, 2, z - 1, x1, 3, z + 1];
  let n = 0;
  for (let x = x0; x <= x1; x++) {
    n += put(g, fp, [x, 3, z], "spruce_slab", { type: "top", waterlogged: "false" }, opts);
    if ((x - x0) % 2 === 0 || x === x1) n += put(g, fp, [x, 2, z], "spruce_fence", FENCE_POST, opts);
    n += put(g, fp, [x, 2, z - 1], "spruce_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" }, opts);
    n += put(g, fp, [x, 2, z + 1], "spruce_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" }, opts);
  }
  return n;
}

/**
 * groundPatch(x0,z0,x1,z1,mix): seeded patches at y=0. mix is { block: weight } (default: grass-heavy). Patches are 4 x 4
 * cells, and 1 cell in 4 is re-rolled so the edges break up (opts.seed picks the layout). Only air and ground cells
 * change: dirt_path, footings and everything built stay as they are.
 */
export function groundPatch(g, x0, z0, x1, z1, mix = GROUND_MIX, opts = {}) {
  const fp = [x0, 0, z0, x1, 0, z1];
  const seed = opts.seed ?? 1;
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const patch = pickBy(mix, unit(Math.floor(x / 4), 0, Math.floor(z / 4), seed));
    const rerolled = unit(x, 0, z, seed + 1) < 0.25;
    const block = rerolled ? pickBy(mix, unit(x, 0, z, seed + 2)) : patch;
    n += put(g, fp, [x, 0, z], block, undefined, { ...opts, ground: true });
  }
  return n;
}

/** leanToPost(x,z): stripped_spruce_log post, axis y, at y=1..3. */
export function leanToPost(g, x, z, opts = {}) {
  const fp = [x, 1, z, x, 3, z];
  let n = 0;
  for (let y = 1; y <= 3; y++) n += put(g, fp, [x, y, z], "stripped_spruce_log", { axis: "y" }, opts);
  return n;
}
