// VOCABULARY helpers, set 1 (plan.md): stucco_wall, slider_gap, roof_band, breeze_screen, palm, kidney_pool,
// hung_lantern, egg_chair, fireplace_stack, wardrobe. Each takes the grid first, then world coordinates (plan.md's own).
// Every helper writes only inside its own footprint and only into air, so an earlier part's cell is never touched.
// Each returns the number of blocks it placed; a refused cell is not counted.
import { DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// One block, only into air and inside the grid. A structure has no cells below y=0, so bedding and pool basin writes
// (y<0) are not stored and not counted.
const put = (g, x, y, z, block, state) => {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return 0;
  g.set(x, y, z, block, state);
  return 1;
};

// Every cell of the inclusive box a..b (corners in any order), only into air.
const box = (g, [x0, y0, z0], [x1, y1, z1], block, state) => {
  let n = 0;
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) n += put(g, x, y, z, block, state);
  return n;
};

const facingOf = (facing) => {
  if (!DIRS[facing]) throw new Error(`facing must be north, south, east or west, got ${facing}`);
  return DIRS[facing];
};

// Blank white stucco wall: a rectangle in x and z, y0..y1 (plan: base y=1, body 2..4, header 5 come from other parts).
export function stucco_wall(g, x0, z0, x1, z1, y0 = 2, y1 = 4) {
  return box(g, [x0, y0, z0], [x1, y1, z1], "white_concrete");
}

// A 2-wide sliding-door gap at x0..x0+1 on wall line z. The 2x2 opening (y0..y0+1) is never closed: only the glass
// lintel goes above it, and only if both gap cells are already air. Returns 0 if the gap is closed.
export function slider_gap(g, x0, z, y0 = 2) {
  const gap = [[x0, y0, z], [x0 + 1, y0, z], [x0, y0 + 1, z], [x0 + 1, y0 + 1, z]];
  if (!gap.every(([x, y, zz]) => g.inBounds(x, y, zz) && g.isAir(x, y, zz))) return 0;
  return put(g, x0, y0 + 2, z, "glass_pane") + put(g, x0 + 1, y0 + 2, z, "glass_pane");
}

// One horizontal band of the stepped slab roof over x=9..32 on rows zA..zB at height y. half = bottom | top.
// The atrium hole (x=17..21, z=12..17) and chimney hole (x=20..21, z=21..22) stay open.
export function roof_band(g, zA, zB, y, half) {
  if (half !== "bottom" && half !== "top") throw new Error(`roof_band half must be bottom or top, got ${half}`);
  const hole = (x, z) => (x >= 17 && x <= 21 && z >= 12 && z <= 17) || (x >= 20 && x <= 21 && z >= 21 && z <= 22);
  let n = 0;
  for (let z = Math.min(zA, zB); z <= Math.max(zA, zB); z++)
    for (let x = 9; x <= 32; x++) if (!hole(x, z)) n += put(g, x, y, z, "smooth_stone_slab", { type: half });
  return n;
}

// Breeze-block screen: white_concrete where (x+y) is even, air where it is odd, over x0..x1 and y0..y1 on plane z.
export function breeze_screen(g, x0, x1, y0, y1, z) {
  let n = 0;
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      if ((x + y) % 2 === 0) n += put(g, x, y, z, "white_concrete");
  return n;
}

// Palm with its trunk on (x, z): jungle_log y=1..7 and a two-cell crown at y=6..7. Stands on whatever is at y=0.
export function palm(g, x, z) {
  let n = 0;
  for (let y = 1; y <= 7; y++) n += put(g, x, y, z, "jungle_log", { axis: "y" });
  const leaf = (dx, y, dz) => put(g, x + dx, y, z + dz, "jungle_leaves", { persistent: "true" });
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) n += leaf(dx, 7, dz);
  const ring6 = [[-2, 0], [-1, 0], [1, 0], [2, 0], [0, -2], [0, -1], [0, 1], [0, 2], [-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dx, dz] of ring6) n += leaf(dx, 6, dz);
  return n;
}

// Kidney pool. rows = { z: [[x0, x1], ...] } (inclusive spans), the RESERVED cells in plan.md. Water at y=-1..0 over the
// pool, light_blue_concrete floor at y=-2 and liner walls at y=-1 on the rim, and a smooth_quartz_slab bottom coping on
// the rim at y=1. The coping sits ON the deck (y=1), because the deck at y=0 is already laid by another part.
// The y=-2..-1 cells are not stored (see put), so in the file the pool is shallow water at y=0 as build.mjs says.
export function kidney_pool(g, rows) {
  const pool = new Set();
  for (const [z, spans] of Object.entries(rows)) for (const [a, b] of spans)
    for (let x = a; x <= b; x++) pool.add(`${x},${Number(z)}`);
  let n = 0;
  for (const k of pool) {
    const [x, z] = k.split(",").map(Number);
    n += put(g, x, -2, z, "light_blue_concrete");
    n += put(g, x, -1, z, "water");
    n += put(g, x, 0, z, "water");
  }
  const rim = new Set();
  for (const k of pool) {
    const [x, z] = k.split(",").map(Number);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = `${x + dx},${z + dz}`;
      if (!pool.has(key)) rim.add(key);
    }
  }
  for (const k of rim) {
    const [x, z] = k.split(",").map(Number);
    n += put(g, x, -1, z, "light_blue_concrete");
    n += put(g, x, 1, z, "smooth_quartz_slab", { type: "bottom" });
  }
  return n;
}

// Lantern hanging at (x, y, z). It needs a block above it at y+1; with air above it places nothing and returns 0.
export function hung_lantern(g, x, y, z) {
  if (!g.inBounds(x, y + 1, z) || g.isAir(x, y + 1, z)) return 0;
  return put(g, x, y, z, "lantern", { hanging: "true" });
}

// Egg chair, 3 wide x 2 deep x 2 high (y=2..3). facing is the seat stair's facing, i.e. the side of its full back:
// the back is the cell on that side of the seat and the sitter faces the other way. Shell: iron_trapdoor back at y=2..3
// and side plates at y=2 on the two cells beside the seat, each open and standing on its outer face.
export function egg_chair(g, x, z, facing) {
  const [dx, , dz] = facingOf(facing);
  const across = facing === "north" || facing === "south" ? ["east", "west"] : ["south", "north"];
  let n = put(g, x, 2, z, "smooth_red_sandstone_stairs", { facing, half: "bottom", shape: "straight" });
  for (const y of [2, 3]) n += put(g, x + dx, y, z + dz, "iron_trapdoor", { facing, half: "bottom", open: "true" });
  for (const side of across) {
    const [sx, , sz] = DIRS[side];
    n += put(g, x + sx, 2, z + sz, "iron_trapdoor", { facing: side, half: "bottom", open: "true" });
  }
  return n;
}

// Wardrobe: spruce_planks 2 high (y=2..3) over len cells along axis x or z from (x, z). Open spruce_trapdoor fronts
// fill the row in front of it, on the side given by facing (the room side).
export function wardrobe(g, x, z, len, axis, facing) {
  const [fx, , fz] = facingOf(facing);
  const [ax, az] = axis === "x" ? [1, 0] : [0, 1];
  let n = 0;
  for (let i = 0; i < len; i++)
    for (const y of [2, 3]) {
      const bx = x + i * ax, bz = z + i * az;
      n += put(g, bx, y, bz, "spruce_planks");
      n += put(g, bx + fx, y, bz + fz, "spruce_trapdoor", { facing, half: "bottom", open: "true" });
    }
  return n;
}

// Freestanding fireplace stack on the 2x2 footprint x0..x0+1, z0..z0+1, y=1..8 (plan.md, part 3): mud_bricks hearth,
// campfires (lit) on the x0 column at y=2, mud_bricks on the x0+1 column and a 2x2 lintel at y=3, a 2x2 black_concrete
// flue at y=4..7, and a smooth_stone_slab cap at y=8.
export function fireplace_stack(g, x0, z0) {
  let n = box(g, [x0, 1, z0], [x0 + 1, 1, z0 + 1], "mud_bricks");
  n += put(g, x0, 2, z0, "campfire", { facing: "north", lit: "true" });
  n += put(g, x0, 2, z0 + 1, "campfire", { facing: "north", lit: "true" });
  n += box(g, [x0 + 1, 2, z0], [x0 + 1, 2, z0 + 1], "mud_bricks");
  n += box(g, [x0, 3, z0], [x0 + 1, 3, z0 + 1], "mud_bricks");
  n += box(g, [x0, 4, z0], [x0 + 1, 7, z0 + 1], "black_concrete");
  n += box(g, [x0, 8, z0], [x0 + 1, 8, z0 + 1], "smooth_stone_slab", { type: "bottom" });
  return n;
}
