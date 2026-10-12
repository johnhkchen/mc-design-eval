// Vocabulary helpers from plan.md VOCABULARY, part 2: the ten the brief names. Each takes its position as arguments,
// places blocks through the build library (B.* states), and writes only into air, or over the one block an option
// names (`swap` / `over`). It returns { placed, skipped }: skipped lists [x, y, z, block] for each cell it left alone,
// so the caller can report what an earlier part already owns. Nothing here reaches below its own footprint.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const BEAM_X = [10, 13, 16, 19, 22, 25, 28, 31];   // beam lines every 3 cells from x=10 (plan STRUCTURE)
// plan ROOFS: the z-bands of the main roof, with the y and half each band's slab sits at
export const ROOF_BANDS = [
  { z0: 6, z1: 10, y: 6, half: "bottom" }, { z0: 11, z1: 13, y: 6, half: "top" }, { z0: 14, z1: 15, y: 7, half: "bottom" },
  { z0: 16, z1: 17, y: 7, half: "top" }, { z0: 18, z1: 19, y: 7, half: "bottom" }, { z0: 20, z1: 22, y: 6, half: "top" },
  { z0: 23, z1: 27, y: 6, half: "bottom" },
];
const bandAt = (z) => ROOF_BANDS.find((b) => z >= b.z0 && z <= b.z1);
const ns = (name) => (name.includes(":") ? name : `minecraft:${name}`);
const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);
const tally = () => ({ placed: 0, skipped: [] });

// Write one block into air, or over `over` when the cell holds that block. Anything else is recorded, not written.
function put(g, t, x, y, z, [block, state, nbt], over = null) {
  if (g.isAir(x, y, z) || (over && g.blockAt(x, y, z) === ns(over))) {
    g.set(x, y, z, block, state, nbt);
    t.placed++;
    return true;
  }
  t.skipped.push([x, y, z, g.blockAt(x, y, z).replace("minecraft:", "")]);
  return false;
}

// Exterior ----------------------------------------------------------------------------------------------------------

/** header_course: dark_oak_planks along a wall at y (default 5), skipping beam-line x so the roof's logs go there. */
export function header_course(g, x0, x1, z0, z1, y = 5) {
  const t = tally();
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    if (BEAM_X.includes(x)) continue;
    put(g, t, x, y, z, B.block("dark_oak_planks"));
  }
  return t;
}

/** clerestory: glass strip at y along z, with dark_oak_log mullions at x0+3 and x0+6 (plan default x0=22, z=8, y=4). */
export function clerestory(g, z = 8, y = 4, x0 = 22) {
  const t = tally();
  for (const dx of [0, 1, 2, 4, 5, 7, 8]) put(g, t, x0 + dx, y, z, B.pane());
  for (const dx of [3, 6]) put(g, t, x0 + dx, y, z, B.log("dark_oak", "y"));
  return t;
}

/**
 * fascia_ring: dark_oak_slab on the outer ring of the main roof and on the rim of the atrium hole. Each cell takes the
 * y and half of its roof band (ROOF_BANDS). The roof_band slabs already there are swapped (`swap`, default
 * smooth_stone_slab); pass swap: null to write into air only.
 */
export function fascia_ring(g, { x0 = 9, x1 = 32, z0 = 6, z1 = 27, hole = [17, 12, 21, 17], swap = "smooth_stone_slab" } = {}) {
  const t = tally();
  const cells = new Map();
  for (const x of span(x0, x1)) { cells.set(`${x},${z0}`, [x, z0]); cells.set(`${x},${z1}`, [x, z1]); }
  for (const z of span(z0, z1)) { cells.set(`${x0},${z}`, [x0, z]); cells.set(`${x1},${z}`, [x1, z]); }
  const [hx0, hz0, hx1, hz1] = hole;
  for (const x of span(hx0 - 1, hx1 + 1)) for (const z of span(hz0 - 1, hz1 + 1)) {
    if (x >= hx0 && x <= hx1 && z >= hz0 && z <= hz1) continue;   // the hole itself stays open
    cells.set(`${x},${z}`, [x, z]);
  }
  for (const [x, z] of cells.values()) {
    const band = bandAt(z);
    put(g, t, x, band.y, z, B.slab("dark_oak", band.half), swap);
  }
  return t;
}

/** joint_row: light_gray_concrete across a driveway at y (default 0), from x0 to x1 at row z. */
export function joint_row(g, z, x0 = 1, x1 = 8, { y = 0, over = null } = {}) {
  const t = tally();
  for (const x of span(x0, x1)) put(g, t, x, y, z, B.block("light_gray_concrete"), over);
  return t;
}

/** saguaro: a cactus trunk from y=1 to y=h (1..3); h=3 adds the arm at x-1, y=2..3. Sand under it is the site part's. */
export function saguaro(g, x, z, h = 2) {
  if (!Number.isInteger(h) || h < 1 || h > 3) throw new RangeError(`saguaro height must be 1..3, got ${h}`);
  const t = tally();
  for (let y = 1; y <= h; y++) put(g, t, x, y, z, B.block("cactus"));
  if (h === 3) for (const y of [2, 3]) put(g, t, x - 1, y, z, B.block("cactus"));
  return t;
}

// Back garden -------------------------------------------------------------------------------------------------------

/**
 * lounger: two cells at y=1 along axis ("x" or "z") from (x, z): the foot is a smooth_quartz_slab, the head a
 * smooth_quartz_stairs whose full-height back is at the head end (stairs facing = where the back is, per the toolkit).
 */
export function lounger(g, x, z, axis = "x") {
  if (axis !== "x" && axis !== "z") throw new RangeError(`lounger axis must be x or z, got ${axis}`);
  const t = tally();
  const [hx, hz] = axis === "x" ? [x + 1, z] : [x, z + 1];
  put(g, t, x, 1, z, B.slab("smooth_quartz", "bottom"));
  put(g, t, hx, 1, hz, B.stairs("smooth_quartz", axis === "x" ? "east" : "south", "bottom"));
  return t;
}

// Interior ----------------------------------------------------------------------------------------------------------

// Deterministic per-cell value in [0, 1): the same box and seed always give the same flecks.
function unit(seed, x, y, z) {
  let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** terrazzo_floor: smooth_stone over box [x0,y0,z0,x1,y1,z1] (inclusive) with ~12% light_gray and ~6% white flecks. */
export function terrazzo_floor(g, [x0, y0, z0, x1, y1, z1], { seed = 1 } = {}) {
  const t = tally();
  for (const x of span(x0, x1)) for (const y of span(y0, y1)) for (const z of span(z0, z1)) {
    const r = unit(seed, x, y, z);
    const block = r < 0.12 ? "light_gray_concrete" : r < 0.18 ? "white_concrete" : "smooth_stone";
    put(g, t, x, y, z, B.block(block));
  }
  return t;
}

/**
 * sideboard: a run of len cells from (x, z) along axis. Cabinet fronts are closed birch_trapdoors at y; the top is a
 * birch_slab (top half) at y+1; one potted_cactus sits on the middle cell at y+2.
 */
export function sideboard(g, x, z, len = 2, axis = "x", facing = "south", y = 2) {
  const t = tally();
  const cells = span(0, len - 1).map((i) => (axis === "x" ? [x + i, z] : [x, z + i]));
  for (const [cx, cz] of cells) {
    put(g, t, cx, y, cz, B.trapdoor("birch", facing, "bottom", false));
    put(g, t, cx, y + 1, cz, B.slab("birch", "top"));
  }
  const [mx, mz] = cells[Math.floor((len - 1) / 2)];
  put(g, t, mx, y + 2, mz, B.block("potted_cactus"));
  return t;
}

/**
 * dining_set: a 2x3 table (footprint x..x+1, z..z+2) on four spruce_fence legs at y, with the spruce_slab top at y+1.
 * Six birch_stairs chairs, three each side (west at x-1, east at x+2), seats facing the table. A lantern hangs at
 * (x+1, y+2, z+1) when there is a beam above it.
 */
export function dining_set(g, x, z, y = 2) {
  const t = tally();
  for (const [lx, lz] of [[x, z], [x + 1, z], [x, z + 2], [x + 1, z + 2]]) put(g, t, lx, y, lz, B.fence("spruce"));
  for (const tx of [x, x + 1]) for (const tz of span(z, z + 2)) put(g, t, tx, y + 1, tz, B.slab("spruce", "bottom"));
  for (const cz of span(z, z + 2)) {
    put(g, t, x - 1, y, cz, B.stairs("birch", "west", "bottom"));   // the back is on the west; the sitter faces the table
    put(g, t, x + 2, y, cz, B.stairs("birch", "east", "bottom"));
  }
  const [lx, ly, lz] = [x + 1, y + 2, z + 1];
  if (!g.isAir(lx, ly + 1, lz)) put(g, t, lx, ly, lz, B.lantern(true));
  else t.skipped.push([lx, ly, lz, "lantern (no beam above)"]);
  return t;
}

/**
 * bath_fit: a 2x3 bath (footprint x..x+1, z..z+2) at floor y. The tub is two smooth_quartz_stairs on row z with the
 * back to the wall; the lane is row z+1; the cauldron basin is at (x, z+2) and the quartz_stairs WC at (x+1, z+2).
 */
export function bath_fit(g, x, z, y = 2) {
  const t = tally();
  put(g, t, x, y, z, B.stairs("smooth_quartz", "north", "bottom"));
  put(g, t, x + 1, y, z, B.stairs("smooth_quartz", "north", "bottom"));
  put(g, t, x, y, z + 2, B.block("cauldron"));
  put(g, t, x + 1, y, z + 2, B.stairs("smooth_quartz", "south", "bottom"));
  return t;
}
