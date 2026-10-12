// VOCAB H1: the first ten helpers from plan.md VOCABULARY. Each takes the grid first, then its position (and facing
// where it has one). Nothing is hard-wired to a spot. Every write goes through put(), which places only into air, so a
// cell an earlier part built is left alone: no holes in walls, no sinking into the ground.
import { B, DIRS, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Inclusive a..b, in either order.
const range = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

// One block spec ([block, state?, nbt?], as B.* returns) into air. Returns 1 if placed, 0 if the cell is already built.
function put(g, x, y, z, spec) {
  if (!g.isAir(x, y, z)) return 0;
  g.set(x, y, z, ...spec);
  return 1;
}

// Every cell of the inclusive box a..b through put(). Returns the number placed.
function fill(g, [x0, y0, z0], [x1, y1, z1], spec) {
  let n = 0;
  for (const x of range(x0, x1)) for (const y of range(y0, y1)) for (const z of range(z0, z1)) n += put(g, x, y, z, spec);
  return n;
}

const dirOf = (x, z) => Object.keys(DIRS).find((k) => DIRS[k][0] === x && DIRS[k][2] === z);

/** White stucco wall: white_concrete over x0..x1 by z0..z1 (one cell thick on x or z), y0..y1. */
export function stucco_wall(g, x0, z0, x1, z1, y0 = 2, y1 = 4) {
  return fill(g, [x0, y0, z0], [x1, y1, z1], B.block("white_concrete"));
}

/**
 * Glass over a sliding-door gap at x0..x0+1, z. The 2 x 2 opening (y0..y0+1) is never written, so it stays as the shell
 * left it (air) and can't be closed here. glass_pane goes on the cells above it, at y0+2.
 */
export function slider_gap(g, x0, z, y0 = 2) {
  return fill(g, [x0, y0 + 2, z], [x0 + 1, y0 + 2, z], B.pane());
}

/**
 * One roof band at height y and half ("bottom" | "top"): smooth_stone_slab over the roof's x0..x1 for z in zA..zB,
 * skipping each hole. fascia: the roof's outer ring (x0, x1, z0, z1) and the rim of each hole marked edge take
 * dark_oak_slab at the same half, so a dark line runs round the eave and the atrium.
 * holes: [{ x0, x1, z0, z1, edge? }]
 */
export function roof_band(g, zA, zB, y, half, { x0 = 9, x1 = 32, z0 = 6, z1 = 27, holes = [], fascia = false } = {}) {
  const inHole = (x, z) => holes.some((h) => x >= h.x0 && x <= h.x1 && z >= h.z0 && z <= h.z1);
  const onRim = (x, z) => holes.some((h) => h.edge && x >= h.x0 - 1 && x <= h.x1 + 1 && z >= h.z0 - 1 && z <= h.z1 + 1);
  let n = 0;
  for (const x of range(x0, x1)) for (const z of range(zA, zB)) {
    if (inHole(x, z)) continue;
    const trim = fascia && (x === x0 || x === x1 || z === z0 || z === z1 || onRim(x, z));
    n += put(g, x, y, z, B.slab(trim ? "dark_oak" : "smooth_stone", half));
  }
  return n;
}

/** Breeze-block screen on z, x0..x1, y0..y1: white_concrete where x+y is even; the other cells stay air (the holes). */
export function breeze_screen(g, x0, x1, z, y0 = 1, y1 = 4) {
  let n = 0;
  for (const x of range(x0, x1)) for (const y of range(y0, y1)) if ((x + y) % 2 === 0) n += put(g, x, y, z, B.block("white_concrete"));
  return n;
}

/**
 * Palm at (x, z): a jungle_log trunk y=1..7; a crown of persistent jungle_leaves, a 3 x 3 at y=7 and a plus-and-corner
 * ring of radius 2 at y=6. The trunk is placed first, and cells already built (roof, wall) are skipped.
 */
export function palm(g, x, z) {
  let n = 0;
  for (const y of range(1, 7)) n += put(g, x, y, z, ["jungle_log", { axis: "y" }]);
  const leaves = ["jungle_leaves", { persistent: "true" }];
  for (const y of [6, 7]) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const inCrown = y === 7
      ? Math.max(Math.abs(dx), Math.abs(dz)) <= 1
      : (dx === 0 && Math.abs(dz) <= 2) || (dz === 0 && Math.abs(dx) <= 2) || (Math.abs(dx) === 1 && Math.abs(dz) === 1);
    if (inCrown) n += put(g, x + dx, y, z + dz, leaves);
  }
  return n;
}

/**
 * Kidney pool from its rows, { z: [[x0, x1], ...] } (plan.md RESERVED cells). The floor is light_blue_concrete at floorY
 * (default -2). Rim cells (open to the deck on any side) get a light_blue_concrete liner at floorY+1; every other pool cell
 * is water from floorY+1 up to y=0. The coping (smooth_quartz_slab at y=0 on the deck cells beside the pool) goes only
 * into air: the deck's smooth_stone is not replaced.
 */
export function kidney_pool(g, rows, floorY = -2) {
  const pool = (x, z) => (rows[z] ?? []).some(([a, b]) => x >= Math.min(a, b) && x <= Math.max(a, b));
  const rim = (x, z) => !pool(x - 1, z) || !pool(x + 1, z) || !pool(x, z - 1) || !pool(x, z + 1);
  const cells = Object.keys(rows).map(Number).flatMap((z) => rows[z].flatMap(([a, b]) => range(a, b).map((x) => [x, z])));
  let n = 0;
  for (const [x, z] of cells) {
    n += put(g, x, floorY, z, B.block("light_blue_concrete"));
    for (let y = floorY + 1; y <= 0; y++) n += put(g, x, y, z, y === floorY + 1 && rim(x, z) ? B.block("light_blue_concrete") : B.block("water"));
  }
  const deck = new Set();
  for (const [x, z] of cells) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!pool(x + dx, z + dz)) deck.add(`${x + dx},${z + dz}`);
  for (const k of deck) { const [x, z] = k.split(",").map(Number); n += put(g, x, 0, z, B.slab("smooth_quartz", "bottom")); }
  return n;
}

/** Hanging lantern at (x, y, z), hung from the block above it (a beam or the ceiling). With nothing above it places nothing and returns 0. */
export function hung_lantern(g, x, z, y = 4) {
  if (g.isAir(x, y + 1, z)) return 0;
  return put(g, x, y, z, B.lantern(true));
}

/**
 * Egg chair at (x, z). The seat is a smooth_red_sandstone stair at y=2 facing `facing` (its back side). The high back is
 * two open iron_trapdoors stacked at y=2..3 on the cell behind the seat; one open iron_trapdoor on each side at y=2 closes
 * the shell. The trapdoors hinge on the edge that faces the seat.
 */
export function egg_chair(g, x, z, facing) {
  const dx = DIRS[facing][0], dz = DIRS[facing][2];
  const [sx, sz] = [dz, dx]; // the side vector: 90 degrees from facing
  let n = put(g, x, 2, z, B.stairs("smooth_red_sandstone", facing, "bottom"));
  for (const y of [2, 3]) n += put(g, x + dx, y, z + dz, B.trapdoor("iron", face.opposite(facing), "bottom", true));
  n += put(g, x + sx, 2, z + sz, B.trapdoor("iron", dirOf(-sx, -sz), "bottom", true));
  n += put(g, x - sx, 2, z - sz, B.trapdoor("iron", dirOf(sx, sz), "bottom", true));
  return n;
}

/**
 * Freestanding fireplace on the 2 x 2 at x0..x0+1, z0..z0+1: mud_bricks hearth at y=1; a lit campfire on the x0 column at
 * y=2 with mud_bricks beside it; a mud_bricks lintel at y=3; a black_concrete flue at y=4..7; a smooth_stone_slab cap at y=8.
 */
export function fireplace_stack(g, x0, z0) {
  const campfire = ["campfire", { facing: "south", lit: "true" }];
  let n = 0;
  for (const x of [x0, x0 + 1]) for (const z of [z0, z0 + 1]) {
    n += put(g, x, 1, z, B.block("mud_bricks"));
    n += put(g, x, 2, z, x === x0 ? campfire : B.block("mud_bricks"));
    n += put(g, x, 3, z, B.block("mud_bricks"));
    for (const y of range(4, 7)) n += put(g, x, y, z, B.block("black_concrete"));
    n += put(g, x, 8, z, B.slab("smooth_stone", "bottom"));
  }
  return n;
}

/**
 * Wardrobe of len cells from (x, z) along axis ("x" | "z"): spruce_planks 2 high (y=2..3) on the back row, and a row of
 * open spruce_trapdoors on the front row, one cell out in `facing`, hinged on the body side so they read as doors.
 */
export function wardrobe(g, x, z, len, axis, facing) {
  if (axis !== "x" && axis !== "z") throw new Error(`wardrobe: axis must be "x" or "z", got ${axis}`);
  const [ax, az] = axis === "x" ? [1, 0] : [0, 1];
  const fx = DIRS[facing][0], fz = DIRS[facing][2];
  let n = 0;
  for (let i = 0; i < len; i++) {
    const bx = x + i * ax, bz = z + i * az;
    for (const y of [2, 3]) {
      n += put(g, bx, y, bz, B.block("spruce_planks"));
      n += put(g, bx + fx, y, bz + fz, B.trapdoor("spruce", face.opposite(facing), "bottom", true));
    }
  }
  return n;
}
