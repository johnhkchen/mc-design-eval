// Vocabulary helpers, batch H1 (plan.md VOCABULARY). Every helper takes its position as arguments and writes only
// its own footprint. Writes go only into AIR unless opts.over is true: an earlier part owns the cells it built, and
// runParts refuses those writes anyway. Every helper returns { placed, skipped }, where skipped lists the cells it
// left alone (and why it could not), so a worker can report them.
//
// Coordinates: x and z are world cells (plan.md SITE). shop0 is the low-x edge of a house's shopfront: H1 25,
// H2 13, H3 5 (H3 is mirrored, so its shop is not at a+1; plan a+1 would put the fascia on the lobby).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const PRODUCTS = new Set(["bookshelf", "flower_pot", "potted_azalea_bush", "potted_pink_tulip", "anvil", "barrel"]);
const SOLID_TEST = (g, x, y, z) => g.inBounds(x, y, z) && !g.isAir(x, y, z);

/** Place one block, into air only unless over. Out-of-bounds and occupied cells are skipped and reported. */
function put(g, out, over, x, y, z, block, state) {
  if (!g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) {
    out.skipped.push({ at: [x, y, z], block });
    return;
  }
  g.set(x, y, z, block, state);
  out.placed++;
}

const result = () => ({ placed: 0, skipped: [] });

/** Dark oak fascia board, 7 wide x 3 high, on the wall face z 7 (y 5..7, x shop0+1..shop0+7). */
export function fascia_board(g, shop0, opts = {}) {
  const out = result();
  for (let x = shop0 + 1; x <= shop0 + 7; x++)
    for (let y = 5; y <= 7; y++) put(g, out, opts.over, x, y, 7, "dark_oak_planks");
  return out;
}

/**
 * Striped awning at y 5, z 6, x shop0+1..shop0+7 (7 cells). Stairs run with the high back to the wall (facing south)
 * and alternate the shop colour with quartz: even cells take shopMat (e.g. "dark_prismarine"), odd cells quartz.
 * plan.md's text says "facing north" but also "high side to the wall", which is south under toolkit.md's convention
 * (facing = side of the full-height back). The wall is at z 7, so this follows the wall.
 */
export function awning(g, shop0, shopMat = "dark_prismarine", opts = {}) {
  const out = result();
  for (let i = 0; i < 7; i++) {
    const mat = i % 2 === 0 ? shopMat : "quartz";
    put(g, out, opts.over, shop0 + 1 + i, 5, 6, ...B.stairs(mat, "south", "bottom"));
  }
  return out;
}

/**
 * Pier on the street face: cut_sandstone at z 6 (proud of the wall), smooth_sandstone at z 7, from y0 to y1.
 * opts.bracket: the bottom cell at z 6 is an upside-down smooth_sandstone stair (lip out, back to the wall), which
 * carries the pier above it (party and shop piers, y0 = 5).
 */
export function pier(g, x, y0, y1, opts = {}) {
  const out = result();
  for (let y = y0; y <= y1; y++) {
    if (opts.bracket && y === y0) put(g, out, opts.over, x, y, 6, ...B.stairs("smooth_sandstone", "south", "top"));
    else put(g, out, opts.over, x, y, 6, "cut_sandstone");
    put(g, out, opts.over, x, y, 7, "smooth_sandstone");
  }
  return out;
}

/**
 * Window in a wall at z = wallZ, columns x0..x1 and rows y0..y1. Glass sits one cell inside (wallZ + inward).
 * inward is +1 for the street face (z 7, glass z 8) and -1 for the rear (z 24, glass z 23). Adds a smooth_sandstone
 * lintel one row above and an upside-down smooth_sandstone stair sill one row below, one cell outside the wall.
 */
export function window_bay(g, x0, x1, y0, y1, wallZ, inward = 1, opts = {}) {
  const out = result();
  const sillZ = wallZ - inward;
  const sillFacing = inward > 0 ? "south" : "north";
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      put(g, out, opts.over, x, y, wallZ, "air");
      put(g, out, opts.over, x, y, wallZ + inward, "glass_pane", { north: "false", east: "true", south: "false", west: "true" });
    }
    put(g, out, opts.over, x, y1 + 1, wallZ, "smooth_sandstone");
    put(g, out, opts.over, x, y0 - 1, sillZ, ...B.stairs("smooth_sandstone", sillFacing, "top"));
  }
  return out;
}

/**
 * Lobby front door in the street face at (x, z 7): dark oak door (both halves, facing north, hinge left) at y 2..3,
 * glass fanlight at y 4, smooth_sandstone lintel at y 5. Hanging lanterns at y 4 on z 6 either side (x-1, x+1), each
 * hung from a smooth_sandstone slab at y 5 z 6, since a hanging light needs a block above.
 */
export function lobby_door(g, x, opts = {}) {
  const out = result();
  put(g, out, opts.over, x, 2, 7, ...B.door("dark_oak", "north", "lower", "left"));
  put(g, out, opts.over, x, 3, 7, ...B.door("dark_oak", "north", "upper", "left"));
  put(g, out, opts.over, x, 4, 7, "glass_pane", { north: "false", east: "true", south: "false", west: "true" });
  put(g, out, opts.over, x, 5, 7, "smooth_sandstone");
  for (const lx of [x - 1, x + 1]) {
    put(g, out, opts.over, lx, 5, 6, ...B.slab("smooth_sandstone", "bottom"));
    put(g, out, opts.over, lx, 4, 6, ...B.lantern(true));
  }
  return out;
}

/**
 * Loft ladder on the wall at (x, z) (z 10 by default): ladder cells y 14..17 facing `facing`, backed by the wall on
 * the opposite side. The hatch is an open dark_oak_trapdoor at y 18 in the loft floor. A ladder only places where
 * the cell behind it is solid. Facing: "east" for H1 and H2 (partition on the west), "west" for H3.
 */
export function loft_ladder(g, x, z = 10, facing = "east", opts = {}) {
  const out = result();
  const back = { east: [-1, 0], west: [1, 0], north: [0, 1], south: [0, -1] }[facing];
  if (!back) throw new Error(`loft_ladder: bad facing ${facing}`);
  for (let y = 14; y <= 17; y++) {
    if (!SOLID_TEST(g, x + back[0], y, z + back[1])) {
      out.skipped.push({ at: [x, y, z], block: "ladder", why: "no wall behind" });
      continue;
    }
    put(g, out, opts.over, x, y, z, "ladder", { facing });
  }
  put(g, out, opts.over, x, 18, z, "dark_oak_trapdoor", { facing, half: "bottom", open: "true" });
  return out;
}

/**
 * Rear yard for a house: grass_block at y 1 over x a+1..a+11, z 25..31, with coarse_dirt patches (a fixed pattern,
 * so the same yard every run), a dirt_path from the rear door (doorX, z 25..27), and brick_wall at y 2 round x a and
 * x a+12 (z 25..32) and along z 32.
 */
export function yard(g, a, doorX, opts = {}) {
  const out = result();
  for (let x = a + 1; x <= a + 11; x++)
    for (let z = 25; z <= 31; z++) {
      const path = x === doorX && z <= 27;
      const patch = (x * 7 + z * 3) % 11 === 0;
      put(g, out, opts.over, x, 1, z, path ? "dirt_path" : patch ? "coarse_dirt" : "grass_block");
    }
  for (let z = 25; z <= 32; z++) {
    put(g, out, opts.over, a, 2, z, "brick_wall");
    put(g, out, opts.over, a + 12, 2, z, "brick_wall");
  }
  for (let x = a; x <= a + 12; x++) put(g, out, opts.over, x, 2, 32, "brick_wall");
  return out;
}

/**
 * Product column on a pier's street face: one block per row from y0 to y1 at (x, z). Defaults z 5, y 5..7 (in front
 * of the pier, clear of the z 6..7 customers' strip). An anvil falls, so it is placed once, at y0, and only if the
 * cell under it is solid.
 */
export function product_panel(g, x, product, opts = {}) {
  if (!PRODUCTS.has(product)) throw new Error(`product_panel: ${product} is not a PALETTE product`);
  const { z = 5, y0 = 5, y1 = 7, over = false } = opts;
  const out = result();
  if (product === "anvil") {
    if (!SOLID_TEST(g, x, y0 - 1, z)) out.skipped.push({ at: [x, y0, z], block: product, why: "anvil needs solid below" });
    else put(g, out, over, x, y0, z, product);
    return out;
  }
  for (let y = y0; y <= y1; y++) put(g, out, over, x, y, z, product);
  return out;
}
