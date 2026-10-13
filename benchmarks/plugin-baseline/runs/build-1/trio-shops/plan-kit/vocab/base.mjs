// Shared constants for every part: palette ids (palette.json only), plan.md's site coordinates (world frame), a seeded rng.

// WALLS: the brick body
/** Wall body block. */
export const BRICKS = "bricks";
/** Brick stairs. */
export const BRICK_STAIRS = "brick_stairs";
/** Brick slab. */
export const BRICK_SLAB = "brick_slab";
/** Yard wall block. */
export const BRICK_WALL = "brick_wall";

// TRIM: the cream sandstone skeleton
/** Smooth sandstone, the trim block. */
export const SMOOTH_SANDSTONE = "smooth_sandstone";
/** Smooth sandstone stairs (cornices, sills, copings). */
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";
/** Smooth sandstone slab (string, deck). */
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";
/** Cut sandstone, the pier faces. */
export const CUT_SANDSTONE = "cut_sandstone";
/** Sandstone wall. */
export const SANDSTONE_WALL = "sandstone_wall";

// FASCIA: dark oak joinery
/** Fascia boards, frames. */
export const DARK_OAK_PLANKS = "dark_oak_planks";
/** Dark oak stairs (awning, stair flights). */
export const DARK_OAK_STAIRS = "dark_oak_stairs";
/** Dark oak slab. */
export const DARK_OAK_SLAB = "dark_oak_slab";
/** Dark oak door (lobby doors). */
export const DARK_OAK_DOOR = "dark_oak_door";
/** Dark oak fence (rails, lamp posts, sign arms). */
export const DARK_OAK_FENCE = "dark_oak_fence";
/** Dark oak trapdoor (loft hatch). */
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";
/** Dark oak hanging sign (shop sign). */
export const DARK_OAK_HANGING_SIGN = "dark_oak_hanging_sign";

// ROOF: slate palette
/** Cobbled deepslate (roof body). */
export const COBBLED_DEEPSLATE = "cobbled_deepslate";
/** Deepslate tiles (roof body). */
export const DEEPSLATE_TILES = "deepslate_tiles";
/** Polished deepslate (roof body). */
export const POLISHED_DEEPSLATE = "polished_deepslate";
/** Polished blackstone bricks (eave). */
export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks";
/** Stone bricks (ridge, and the base course). */
export const STONE_BRICKS = "stone_bricks";

// BASE: the grey stone footing
/** Stone brick stairs (base and plinth). */
export const STONE_BRICK_STAIRS = "stone_brick_stairs";
/** Stone brick slab (base and plinth). */
export const STONE_BRICK_SLAB = "stone_brick_slab";

// PAVING, ROAD, GLASS
/** Polished andesite (sidewalk). */
export const POLISHED_ANDESITE = "polished_andesite";
/** Cobblestone (road setts). */
export const COBBLESTONE = "cobblestone";
/** Andesite (road setts, about 1 in 4). */
export const ANDESITE = "andesite";
/** Glass pane (windows, fanlights). */
export const GLASS_PANE = "glass_pane";

// SHOP: awning stripes, shop colours and banners
/** H1 awning stripe (blue shop). */
export const DARK_PRISMARINE_STAIRS = "dark_prismarine_stairs";
/** H2 awning stripe (green shop). */
export const WAXED_OXIDIZED_CUT_COPPER_STAIRS = "waxed_oxidized_cut_copper_stairs";
/** H3 awning stripe (red shop). */
export const RED_NETHER_BRICK_STAIRS = "red_nether_brick_stairs";
/** Quartz stairs, the awning's contrast stripe. */
export const QUARTZ_STAIRS = "quartz_stairs";
/** Blue wall banner (shop name). */
export const BLUE_WALL_BANNER = "blue_wall_banner";
/** Green wall banner (shop name). */
export const GREEN_WALL_BANNER = "green_wall_banner";
/** Red wall banner (shop name). */
export const RED_WALL_BANNER = "red_wall_banner";
/** White wall banner (shop name). */
export const WHITE_WALL_BANNER = "white_wall_banner";

// PRODUCT: what the pier faces show
/** Bookshelf (books). */
export const BOOKSHELF = "bookshelf";
/** Flower pot. */
export const FLOWER_POT = "flower_pot";
/** Potted azalea bush. */
export const POTTED_AZALEA_BUSH = "potted_azalea_bush";
/** Potted pink tulip. */
export const POTTED_PINK_TULIP = "potted_pink_tulip";
/** Anvil (ironmonger). */
export const ANVIL = "anvil";
/** Barrel. */
export const BARREL = "barrel";

// GROUND: the solid mass under the site
/** Ground fill, laid by build.mjs under everything. */
export const STONE = "stone";

// YARD and loose fittings (palette objects)
/** Grass block (yard ground). */
export const GRASS_BLOCK = "grass_block";
/** Coarse dirt (yard patches). */
export const COARSE_DIRT = "coarse_dirt";
/** Dirt path (from each rear door). */
export const DIRT_PATH = "dirt_path";
/** Iron bars (Juliet rails). */
export const IRON_BARS = "iron_bars";
/** Lantern. */
export const LANTERN = "lantern";
/** Iron chain (ironmonger's). */
export const IRON_CHAIN = "iron_chain";
/** Ladder (loft). */
export const LADDER = "ladder";
/** Hay block (chimney flue). */
export const HAY_BLOCK = "hay_block";
/** Campfire (chimney signal fire). */
export const CAMPFIRE = "campfire";

// SITE: plan.md's coordinates, world frame (x east, y up, z south; the street is north, z 0 is the lot's north edge)
/** Lot extents: x 0..38, z 0..32, world y -5..28 (ground to chimney top). */
export const SITE = { x0: 0, x1: 38, z0: 0, z1: 32, yMin: -5, yMax: 28 };
/** Ground top: the road surface. */
export const ROAD_Y = 0;
/** Sidewalk and kerb-level top, and the shop floor block. */
export const SHOP_FLOOR_Y = 1;
/** Street-side kerb block y. */
export const KERB_Y = 1;
/** Street face z (the houses' front wall). */
export const STREET_Z = 7;
/** Counter edge z (sockets begin here, envelope runs south). */
export const COUNTER_Z = 8;
/** Rear face z (the rear wall). */
export const REAR_Z = 24;
/** Storey floors: shop, flat 1, flat 2, loft. */
export const FLOOR_Y = { shop: 1, flat1: 8, flat2: 13, loft: 18 };
/** Top of the walls, under the main cornice. */
export const WALLS_TOP_Y = 18;
/** Eave height (roof sits on this). */
export const ROOF_Y = 19;
/** Ridge height. */
export const RIDGE_Y = 25;
/** Chimney stack top (the signal campfire). */
export const CHIMNEY_TOP_Y = 28;
/** The three houses, from high x (H1, left as seen from the street) to low x (H3). a = the low-x party or end wall. */
export const HOUSES = {
  H1: { name: "bookseller", a: 25, x0: 25, x1: 37, lobby: [34, 36], colour: "blue" },
  H2: { name: "florist", a: 13, x0: 13, x1: 25, lobby: [22, 24], colour: "green" },
  H3: { name: "ironmonger", a: 1, x0: 1, x1: 13, lobby: [2, 4], colour: "red" },
};
/** Lamp post x positions (on the kerb). */
export const LAMP_POST_X = [1, 13, 25, 37];
/** Chimney stack x (flue x, the stack spans flue-1..flue+1 at z 25..26). */
export const CHIMNEY_FLUE_X = { H1: 31, H2: 19, H3: 7 };

/**
 * Seeded random numbers: rng(seed)() returns a float in [0, 1). The same seed gives the same sequence (mulberry32).
 */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
