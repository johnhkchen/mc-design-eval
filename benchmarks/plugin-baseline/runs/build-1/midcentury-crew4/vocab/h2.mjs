// Mid-century house helpers, part h2 (plan.md VOCABULARY): header course, clerestory, fascia ring, joint row,
// saguaro, lounger, terrazzo floor, sideboard, dining set, bath fit. Same contract as h1: each takes its grid, then its
// position (and facing) as arguments, writes only the footprint those arguments define, and only into air. An `over`
// option names the blocks a helper may replace (default: none). Every helper returns { placed, skipped, below }.
// Footprints are in each comment; a caller keeps the furniture inside the room it was given.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const result = () => ({ placed: 0, skipped: [], below: 0 });
const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);
const ids = (over = []) => over.map((b) => (b.includes(":") ? b : `minecraft:${b}`));
// the beam lines (plan.md: every 3 cells from x=10 to x=31); the header course skips them
const isBeamLine = (x) => x >= 10 && x <= 31 && (x - 10) % 3 === 0;

// one block [block, state?, nbt?] into an air cell (or into a cell holding a block named in `over`)
function put(g, out, over, x, y, z, [block, state, nbt]) {
  if (y < 0) { out.below++; return; }
  if (!g.isAir(x, y, z) && !over.includes(g.blockAt(x, y, z))) { out.skipped.push([x, y, z]); return; }
  g.set(x, y, z, block, state, nbt);
  out.placed++;
}

// seeded generator (mulberry32): the same seed gives the same flecks on every build
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- exterior -----------------------------------------------------------------------------------------------------

/** Dark header band under the eave: dark_oak_planks at y (default 5) over x0..x1, z0..z1, skipping the beam lines. */
export function header_course(g, x0, z0, x1, z1, { y = 5, over = [] } = {}) {
  const out = result(), o = ids(over);
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    if (isBeamLine(x)) continue;
    put(g, out, o, x, y, z, ["dark_oak_planks"]);
  }
  return out;
}

/** Clerestory strip on the north wall: glass_pane at x0..x0+2, x0+4..x0+5, x0+7..x0+8 and dark_oak_log mullions at x0+3, x0+6.
 *  Plan: x0=22, z=8, y=4. Footprint: x0..x0+8 at row y, cell z. */
export function clerestory(g, x0, z, y, { over = [] } = {}) {
  const out = result(), o = ids(over);
  for (const dx of [0, 1, 2, 4, 5, 7, 8]) put(g, out, o, x0 + dx, y, z, B.pane());
  for (const dx of [3, 6]) put(g, out, o, x0 + dx, y, z, B.log("dark_oak", "y"));
  return out;
}

/** Dark fascia on the roof: the outer ring of roof = [x0, z0, x1, z1] and the rim round a hole = [x0, z0, x1, z1] swap
 *  each smooth_stone_slab (the roof band) for dark_oak_slab of the same type, at y in yLo..yHi. This is the one helper that
 *  replaces: it touches only roof slabs, never other blocks. Plan: roof=[9,6,32,27], hole=[17,12,21,17], y 6..7. */
export function fascia_ring(g, roof, { hole = null, yLo = 6, yHi = 7 } = {}) {
  const out = result();
  const [x0, z0, x1, z1] = roof;
  const [hx0, hz0, hx1, hz1] = hole ?? [];
  const inHole = (x, z) => hole && x >= hx0 && x <= hx1 && z >= hz0 && z <= hz1;
  const nearHole = (x, z) => hole && x >= hx0 - 1 && x <= hx1 + 1 && z >= hz0 - 1 && z <= hz1 + 1;
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    const rim = x === x0 || x === x1 || z === z0 || z === z1;
    if (!rim && !(nearHole(x, z) && !inHole(x, z))) continue;
    for (const y of span(yLo, yHi)) {
      const cell = g.get(x, y, z);
      if (cell?.block !== "minecraft:smooth_stone_slab") continue;
      put(g, out, ["minecraft:smooth_stone_slab"], x, y, z, B.slab("dark_oak", cell.state?.type ?? "bottom"));
    }
  }
  return out;
}

/** Light-gray joint across a driveway: light_gray_concrete at y (default 0) over x0..x1 at row z. Cuts into the driveway's
 *  smooth_stone by default (joints are only ever cut into paving). Footprint: x0..x1 at y, row z. */
export function joint_row(g, z, x0, x1, { y = 0, over = ["smooth_stone"] } = {}) {
  const out = result(), o = ids(over);
  for (const x of span(x0, x1)) put(g, out, o, x, y, z, ["light_gray_concrete"]);
  return out;
}

// ---- site ----------------------------------------------------------------------------------------------------------

/** Saguaro: a cactus trunk at (x, 1..h, z); h = 3 adds the arm at (x-1, 2..3, z). The sand under it belongs to the site
 *  part and is not written. Footprint: x-1..x, y 1..h, row z. */
export function saguaro(g, x, z, h, { over = [] } = {}) {
  const out = result(), o = ids(over);
  for (const y of span(1, h)) put(g, out, o, x, y, z, ["cactus"]);
  if (h === 3) for (const y of [2, 3]) put(g, out, o, x - 1, y, z, ["cactus"]);
  return out;
}

// ---- furniture (interior and patio) --------------------------------------------------------------------------------

/** Lounger on the patio: head = smooth_quartz_stairs at (x, 1, z) facing the foot; foot = smooth_quartz_slab (bottom) one cell
 *  away along axis x|z in direction d (1 or -1). Footprint: the two cells at y=1. */
export function lounger(g, x, z, axis, d, { over = [] } = {}) {
  const out = result(), o = ids(over);
  const fx = axis === "x" ? x + d : x, fz = axis === "z" ? z + d : z;
  const facing = axis === "x" ? (d > 0 ? "east" : "west") : (d > 0 ? "south" : "north");
  put(g, out, o, fx, 1, fz, B.slab("smooth_quartz", "bottom"));
  put(g, out, o, x, 1, z, B.stairs("smooth_quartz", facing, "bottom"));
  return out;
}

/** Terrazzo floor: smooth_stone over x0..x1, z0..z1 at y (default 1), with light_gray_concrete (~12%) and white_concrete (~6%)
 *  flecks from a seeded generator. Footprint: x0..x1, y, z0..z1. */
export function terrazzo_floor(g, x0, z0, x1, z1, { y = 1, seed = 1, over = [] } = {}) {
  const out = result(), o = ids(over), rnd = rng(seed);
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    const r = rnd(); // drawn for every cell, so a skipped cell does not shift the flecks after it
    const block = r < 0.12 ? "light_gray_concrete" : r < 0.18 ? "white_concrete" : "smooth_stone";
    put(g, out, o, x, y, z, [block]);
  }
  return out;
}

/** Sideboard: a row of len cells from (x, z) along axis x|z. Birch_trapdoor cabinet fronts at y=2 (closed, facing the room
 *  side `facing`), a birch_slab top at y=3, and a potted_cactus on the middle cell at y=4. One cell deep; len up to 3 fits the
 *  dining room's west wall (x=11). Footprint: the row, y 2..4. */
export function sideboard(g, x, z, len, axis, facing, { over = [] } = {}) {
  const out = result(), o = ids(over);
  const cells = Array.from({ length: len }, (_, i) => (axis === "x" ? [x + i, z] : [x, z + i]));
  for (const [cx, cz] of cells) {
    put(g, out, o, cx, 2, cz, B.trapdoor("birch", facing, "top", false));
    put(g, out, o, cx, 3, cz, B.slab("birch", "bottom"));
  }
  const [mx, mz] = cells[Math.floor((len - 1) / 2)];
  put(g, out, o, mx, 4, mz, ["potted_cactus"]);
  return out;
}

/** Dining set for six: spruce_fence legs at the corners of a 2x3 table (x..x+1, z..z+2), a spruce_slab top (type=top) at y=3
 *  over it, three birch_stairs chairs each long side (x-1 facing east, x+2 facing west), and a hanging lantern at (x, 4, z+1)
 *  only if a beam or ceiling block sits above it at (x, 5, z+1). Footprint: x-1..x+2, y 2..4, z..z+2. Dining room is
 *  x 11..15, z 14..18, so x is 12 or 13 and z is 14..16. */
export function dining_set(g, x, z, { over = [] } = {}) {
  const out = result(), o = ids(over);
  for (const [lx, lz] of [[x, z], [x + 1, z], [x, z + 2], [x + 1, z + 2]]) put(g, out, o, lx, 2, lz, B.fence("spruce"));
  for (const tx of [x, x + 1]) for (const tz of span(z, z + 2)) put(g, out, o, tx, 3, tz, B.slab("spruce", "top"));
  for (const cz of span(z, z + 2)) {
    put(g, out, o, x - 1, 2, cz, B.stairs("birch", "east", "bottom"));
    put(g, out, o, x + 2, 2, cz, B.stairs("birch", "west", "bottom"));
  }
  if (!g.isAir(x, 5, z + 1)) put(g, out, o, x, 4, z + 1, B.lantern(true));
  else out.skipped.push([x, 4, z + 1]);
  return out;
}

/** Bath fit, 2 wide x 3 deep, back against the north wall at row z: cauldron basin at (x, 2, z) with a glass_pane mirror above
 *  it at (x, 3, z); quartz_stairs WC at (x+1, 2, z) facing south; row z+1 is the clear lane; tub = two smooth_quartz_slab
 *  (bottom) cells at (x..x+1, 2, z+2). Footprint: x..x+1, y 2..3, z..z+2. Fits both baths (x 26..27 and 29..30, z 14..16). */
export function bath_fit(g, x, z, { over = [] } = {}) {
  const out = result(), o = ids(over);
  put(g, out, o, x, 2, z, ["cauldron"]);
  put(g, out, o, x, 3, z, B.pane());
  put(g, out, o, x + 1, 2, z, B.stairs("quartz", "south", "bottom"));
  put(g, out, o, x, 2, z + 2, B.slab("smooth_quartz", "bottom"));
  put(g, out, o, x + 1, 2, z + 2, B.slab("smooth_quartz", "bottom"));
  return out;
}
