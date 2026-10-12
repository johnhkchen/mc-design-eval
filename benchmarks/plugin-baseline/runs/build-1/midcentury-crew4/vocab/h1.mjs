// Mid-century house helpers, part h1 (plan.md VOCABULARY). Each takes its grid, then its position (and facing) as
// arguments. A helper writes only the footprint its arguments define, and only into air: a cell already built is
// skipped and listed in `skipped`. Nothing is written below y=0 (the grid stores no cells there; counted in `below`).
// Every helper returns { placed, skipped: [[x,y,z], ...], below }.
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const result = () => ({ placed: 0, skipped: [], below: 0 });
const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

// one block [block, state?, nbt?] into an air cell; the tuple is the build library's [block, state] form
function put(g, out, x, y, z, [block, state, nbt]) {
  if (y < 0) { out.below++; return; }
  if (!g.isAir(x, y, z)) { out.skipped.push([x, y, z]); return; }
  g.set(x, y, z, block, state, nbt);
  out.placed++;
}

// ---- exterior -----------------------------------------------------------------------------------------------------

/** White stucco over the box x0..x1, z0..z1, y0..y1 (inclusive). */
export function stucco_wall(g, x0, z0, x1, z1, y0 = 2, y1 = 4) {
  const out = result();
  for (const x of span(x0, x1)) for (const y of span(y0, y1)) for (const z of span(z0, z1)) put(g, out, x, y, z, ["white_concrete"]);
  return out;
}

/**
 * A 2-wide sliding door opening at x..x+1, z: glass_pane at y=4 above it. The opening (y=2..3) is never closed here;
 * `open` says whether it is still air.
 */
export function slider_gap(g, x, z) {
  const out = result();
  for (const dx of [0, 1]) put(g, out, x + dx, 4, z, ["glass_pane"]);
  out.open = [0, 1].every((dx) => [2, 3].every((y) => g.isAir(x + dx, y, z)));
  return out;
}

/**
 * One band of the stepped slab roof: smooth_stone_slab (type = "bottom" | "top") over x=9..32, rows zA..zB, at y.
 * Skips the atrium hole (x=17..21, z=12..17) and the chimney hole (x=20..21, z=21..22). With { fascia: true } the
 * outer ring (x=9, x=32, z=6, z=27) and the hole edges take dark_oak_slab at the same half.
 */
export function roof_band(g, zA, zB, y, half, { fascia = false } = {}) {
  const out = result();
  const HOLES = [[17, 21, 12, 17], [20, 21, 21, 22]]; // [x0, x1, z0, z1]
  const inHole = (x, z) => HOLES.some(([a, b, c, d]) => x >= a && x <= b && z >= c && z <= d);
  const beside = (x, z) => !inHole(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => inHole(x + dx, z + dz));
  for (const x of span(9, 32)) for (const z of span(zA, zB)) {
    if (inHole(x, z)) continue;
    const edge = fascia && (x === 9 || x === 32 || z === 6 || z === 27 || beside(x, z));
    put(g, out, x, y, z, edge ? B.slab("dark_oak", half) : B.slab("smooth_stone", half));
  }
  return out;
}

/** Breeze-block screen: white_concrete where x+y is even, air elsewhere; x0..x1, y0..y1 at row z. */
export function breeze_screen(g, x0, x1, z, y0 = 1, y1 = 4) {
  const out = result();
  for (const x of span(x0, x1)) for (const y of span(y0, y1)) if ((x + y) % 2 === 0) put(g, out, x, y, z, ["white_concrete"]);
  return out;
}

// ---- garden -------------------------------------------------------------------------------------------------------

/** Palm: jungle_log trunk y=1..7 at (x,z) and a crown of persistent jungle_leaves at y=6..7 (radius 2 at y=6). */
export function palm(g, x, z) {
  const out = result();
  const LEAF = ["jungle_leaves", { persistent: "true" }];
  for (const y of span(1, 7)) put(g, out, x, y, z, B.log("jungle", "y"));
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) put(g, out, x + dx, 7, z + dz, LEAF);
  const ring6 = [[1, 0], [2, 0], [-1, 0], [-2, 0], [0, 1], [0, 2], [0, -1], [0, -2], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (const [dx, dz] of ring6) put(g, out, x + dx, 6, z + dz, LEAF);
  return out;
}

// the kidney pool's cells, as runs of x offsets for z, z+1, z+2, z+3 (plan.md RESERVED: z=29..32)
const POOL_ROWS = [[[1, 4], [7, 8]], [[0, 9]], [[0, 9]], [[1, 8]]];

/**
 * Kidney pool with its top-left cell at (x, z) (plan.md: x=13, z=29 for the house). Water at y=-1..0 and a light-blue
 * floor and liner at y<0 (below the grid, so they are counted in `below`). The coping (smooth_quartz_slab, bottom)
 * replaces only the smooth_stone deck cells beside the pool at y=0; any other cell is left alone.
 */
export function kidney_pool(g, x, z) {
  const out = result();
  out.coping = 0;
  const pool = [];
  POOL_ROWS.forEach((runs, dz) => runs.forEach(([a, b]) => span(a, b).forEach((dx) => pool.push([x + dx, z + dz]))));
  const inPool = (px, pz) => pool.some(([a, b]) => a === px && b === pz);
  const rim = new Map();
  for (const [px, pz] of pool) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const rx = px + dx, rz = pz + dz;
    if (!inPool(rx, rz)) rim.set(`${rx},${rz}`, [rx, rz]);
  }
  for (const [px, pz] of pool) {
    put(g, out, px, -2, pz, ["light_blue_concrete"]);
    put(g, out, px, -1, pz, ["water"]);
    put(g, out, px, 0, pz, ["water"]);
  }
  for (const [rx, rz] of rim.values()) {
    put(g, out, rx, -1, rz, ["light_blue_concrete"]);
    if (g.blockAt(rx, 0, rz) === "minecraft:smooth_stone") {
      const [block, state] = B.slab("smooth_quartz", "bottom");
      g.set(rx, 0, rz, block, state);
      out.coping++;
    }
  }
  return out;
}

/** A hanging lantern at (x, y, z) from the block above it at (x, y+1, z). Refused (no write) when nothing hangs it. */
export function hung_lantern(g, x, z, y = 4) {
  const out = result();
  if (g.isAir(x, y + 1, z)) { out.reason = `no block above at ${x},${y + 1},${z}`; return out; }
  put(g, out, x, y, z, B.lantern(true));
  return out;
}

// ---- interior -----------------------------------------------------------------------------------------------------

const NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

/**
 * Egg chair: seat (x,2,z) faces `facing`; its high back is two iron_trapdoors (y=2..3) on the cell behind it; one
 * iron_trapdoor at y=2 on each side. Footprint x-1..x+1, z-1..z+1 at y=2..3.
 */
export function egg_chair(g, x, z, facing) {
  const out = result();
  const [dx, , dz] = DIRS[facing];
  put(g, out, x, 2, z, B.stairs("smooth_red_sandstone", facing, "bottom"));
  for (const y of [2, 3]) put(g, out, x - dx, y, z - dz, B.trapdoor("iron", facing, "bottom", true));
  const sides = dx === 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
  for (const [px, pz] of sides) put(g, out, x + px, 2, z + pz, B.trapdoor("iron", NAME[`${-px},${-pz}`], "bottom", true));
  return out;
}

/**
 * Fireplace stack on the 2x2 at x..x+1, z..z+1 (plan.md: x=20, z=21), y=1..8: hearth mud_bricks, a lit campfire
 * firebox at y=2 on the x column, a mud_bricks lintel at y=3, a black_concrete flue at y=4..7, a slab cap at y=8.
 */
export function fireplace_stack(g, x, z) {
  const out = result();
  const cells = [[0, 0], [0, 1], [1, 0], [1, 1]];
  for (const [dx, dz] of cells) {
    put(g, out, x + dx, 1, z + dz, ["mud_bricks"]);
    put(g, out, x + dx, 3, z + dz, ["mud_bricks"]);
    for (const y of span(4, 7)) put(g, out, x + dx, y, z + dz, ["black_concrete"]);
    put(g, out, x + dx, 8, z + dz, B.slab("smooth_stone", "bottom"));
    if (dx === 0) put(g, out, x, 2, z + dz, ["campfire", { lit: "true" }]);
    else put(g, out, x + dx, 2, z + dz, ["mud_bricks"]);
  }
  return out;
}

/**
 * Wardrobe of `len` cells along `axis` ("x" or "z") from (x, z): spruce_planks body at y=2..3 on the back row, and open
 * spruce_trapdoor fronts on the front row (the row toward +z for axis x, +x for axis z), hinged on the back side.
 */
export function wardrobe(g, x, z, len, axis) {
  const out = result();
  const front = axis === "x" ? [0, 1] : [1, 0];
  const frontFacing = axis === "x" ? "north" : "west"; // hinged on the back side, so the panel sits flush on the front
  for (const i of span(0, len - 1)) {
    const bx = axis === "x" ? x + i : x, bz = axis === "x" ? z : z + i;
    for (const y of [2, 3]) {
      put(g, out, bx, y, bz, ["spruce_planks"]);
      put(g, out, bx + front[0], y, bz + front[1], B.trapdoor("spruce", frontFacing, "bottom", true));
    }
  }
  return out;
}
