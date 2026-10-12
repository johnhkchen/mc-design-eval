// plan.md VOCABULARY, second batch: header_course, clerestory, fascia_ring, joint_row, saguaro, lounger,
// terrazzo_floor, sideboard, dining_set, bath_fit. Each takes its position as arguments and writes only its own
// footprint, and only into air: a cell an earlier part owns is left as it is (the write is skipped, not thrown).
// Block ids are plan.md's PALETTE; states come from the build library's B helpers (valid states, see mcd states).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// plan.md: beam lines every 3 cells from x=10 to x=31 (the east and west wall lines x=10 and x=31 are among them)
const BEAM_X = [10, 13, 16, 19, 22, 25, 28, 31];

const id = (block) => (block.includes(":") ? block : `minecraft:${block}`);

// Places one [block, state] pair into air, or over the one block id `swap` if the caller names it. Returns 1 if placed.
function put(g, x, y, z, [block, state], swap = null) {
  if (!g.isAir(x, y, z) && !(swap && g.blockAt(x, y, z) === id(swap))) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

// Mulberry32: a small seeded PRNG, so the same seed gives the same flecks.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Header course: dark_oak_planks over x0..x1 x z0..z1 at height y, skipping every beam-line x (the roof logs go there). */
export function header_course(g, x0, z0, x1, z1, y) {
  let n = 0;
  for (let x = x0; x <= x1; x++) {
    if (BEAM_X.includes(x)) continue;
    for (let z = z0; z <= z1; z++) n += put(g, x, y, z, B.block("dark_oak_planks"));
  }
  return n;
}

/** Clerestory strip: glass_pane at x0+0..2, 4..5, 7..8 and dark_oak_log mullions (axis y) at x0+3 and x0+6, on row z, height y. */
export function clerestory(g, x0, z, y) {
  let n = 0;
  for (const dx of [0, 1, 2, 4, 5, 7, 8]) n += put(g, x0 + dx, y, z, B.pane());
  for (const dx of [3, 6]) n += put(g, x0 + dx, y, z, B.log("dark_oak", "y"));
  return n;
}

/**
 * Roof fascia: dark_oak_slab (half = the band's half) on the outer ring of x0..x1 x z0..z1 at height y, and on the
 * band cells 4-adjacent to each hole [hx0, hz0, hx1, hz1] (the atrium and chimney holes). swap: the band's block id
 * (smooth_stone_slab), the one block the fascia may replace; every other cell is written into air only.
 */
export function fascia_ring(g, { x0, z0, x1, z1, y, half = "bottom", holes = [], swap = null }) {
  const spec = B.slab("dark_oak", half);
  const cells = [];
  for (let x = x0; x <= x1; x++) cells.push([x, z0], [x, z1]);
  for (let z = z0; z <= z1; z++) cells.push([x0, z], [x1, z]);
  for (const [hx0, hz0, hx1, hz1] of holes) {
    for (let x = hx0; x <= hx1; x++) cells.push([x, hz0 - 1], [x, hz1 + 1]);
    for (let z = hz0; z <= hz1; z++) cells.push([hx0 - 1, z], [hx1 + 1, z]);
  }
  return cells.reduce((n, [x, z]) => n + put(g, x, y, z, spec, swap), 0);
}

/** Joint row: light_gray_concrete along x0..x1 at row z, height y (the driveway's joints). swap: the paving id it may replace. */
export function joint_row(g, x0, x1, z, y, { swap = null } = {}) {
  let n = 0;
  for (let x = x0; x <= x1; x++) n += put(g, x, y, z, B.block("light_gray_concrete"), swap);
  return n;
}

/**
 * Saguaro: cactus trunk at (x, 1..h, z); when h = 3, an arm of cactus at x-1 on y=2 and y=3. The sand under it is an
 * earlier part's cell, so it is not written here.
 */
export function saguaro(g, x, z, h) {
  if (!Number.isInteger(h) || h < 1) throw new RangeError(`saguaro height must be a whole number >= 1, got ${h}`);
  let n = 0;
  for (let y = 1; y <= h; y++) n += put(g, x, y, z, B.block("cactus"));
  if (h === 3) for (const y of [2, 3]) n += put(g, x - 1, y, z, B.block("cactus"));
  return n;
}

/**
 * Lounger, two cells, white, at height 1: foot = smooth_quartz_slab (bottom) at (x, 1, z); head = smooth_quartz_stairs at
 * (x+1, 1, z) for axis "x", or (x, 1, z+1) for axis "z". Stairs' facing is the side of the full-height back (toolkit
 * convention), so the back sits at the far end and the seat slopes down toward the foot.
 */
export function lounger(g, x, z, axis) {
  if (axis !== "x" && axis !== "z") throw new RangeError(`lounger axis must be "x" or "z", got ${axis}`);
  const [hx, hz] = axis === "x" ? [x + 1, z] : [x, z + 1];
  const back = axis === "x" ? "east" : "south";
  return put(g, x, 1, z, B.slab("smooth_quartz", "bottom")) + put(g, hx, 1, hz, B.stairs("smooth_quartz", back, "bottom"));
}

/** Terrazzo: smooth_stone over the box [x0, y0, z0, x1, y1, z1] with ~12% light_gray_concrete and ~6% white_concrete flecks. */
export function terrazzo_floor(g, [x0, y0, z0, x1, y1, z1], seed = 1) {
  const rand = rng(seed);
  let n = 0;
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
        const r = rand();
        const block = r < 0.12 ? "light_gray_concrete" : r < 0.18 ? "white_concrete" : "smooth_stone";
        n += put(g, x, y, z, B.block(block));
      }
  return n;
}

/**
 * Sideboard: len cells from (x, z) along axis "x" or "z". Cabinet fronts = birch_trapdoor (closed, half top, facing =
 * the front) at y=2; top = birch_slab (bottom half) at y=3; a potted_cactus over the middle cell at y=4.
 * Footprint: y 2..4 over the row.
 */
export function sideboard(g, x, z, len, axis, facing) {
  if (axis !== "x" && axis !== "z") throw new RangeError(`sideboard axis must be "x" or "z", got ${axis}`);
  const mid = Math.floor((len - 1) / 2);
  let n = 0;
  for (let i = 0; i < len; i++) {
    const [cx, cz] = axis === "x" ? [x + i, z] : [x, z + i];
    n += put(g, cx, 2, cz, B.trapdoor("birch", facing, "top", false));
    n += put(g, cx, 3, cz, B.slab("birch", "bottom"));
    if (i === mid) n += put(g, cx, 4, cz, B.block("potted_cactus"));
  }
  return n;
}

/**
 * Dining set for six, footprint x-1..x+2, y 2..4, z-1..z+3. Table: 2 x 3 top = spruce_slab (top half) at y=3 over
 * (x..x+1, z..z+2), on spruce_fence legs at the four corners at y=2 (the floor is y=1, so the top sits one block up).
 * Chairs: birch_stairs at y=2, two per long side and one per end, backs turned away from the table so the seat faces it.
 * Pendant: lantern (hanging) at (x, 4, z+1) under a block at y=5; skipped when there is no block above.
 */
export function dining_set(g, x, z) {
  let n = 0;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 2], [1, 2]]) n += put(g, x + dx, 2, z + dz, B.fence("spruce"));
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 2; dz++) n += put(g, x + dx, 3, z + dz, B.slab("spruce", "top"));
  for (let dx = 0; dx <= 1; dx++) {
    n += put(g, x + dx, 2, z - 1, B.stairs("birch", "north"));
    n += put(g, x + dx, 2, z + 3, B.stairs("birch", "south"));
  }
  n += put(g, x - 1, 2, z + 1, B.stairs("birch", "west"));
  n += put(g, x + 2, 2, z + 1, B.stairs("birch", "east"));
  if (!g.isAir(x, 5, z + 1)) n += put(g, x, 4, z + 1, B.lantern(true));
  return n;
}

/**
 * Bath fitting for a 2-wide, 3-deep room whose low corner is (x, z). Footprint x..x+1, y 2..3, z..z+2.
 * Row z: tub = water one deep (on the floor). Row z+1: smooth_quartz_slab (bottom) lip along the tub. Row z+2:
 * toilet = smooth_quartz_stairs with its back to the wall at z+3, basin = cauldron, mirror = glass_pane above it at y=3.
 */
export function bath_fit(g, x, z) {
  let n = 0;
  n += put(g, x, 2, z, B.block("water")) + put(g, x + 1, 2, z, B.block("water"));
  n += put(g, x, 2, z + 1, B.slab("smooth_quartz", "bottom")) + put(g, x + 1, 2, z + 1, B.slab("smooth_quartz", "bottom"));
  n += put(g, x, 2, z + 2, B.stairs("smooth_quartz", "south", "bottom"));
  n += put(g, x + 1, 2, z + 2, B.block("cauldron")) + put(g, x + 1, 3, z + 2, B.pane());
  return n;
}
