// Shared constants for every part: palette ids (palette.json only), site coordinates from plan.md, and a seeded rng.

// ---- palette (palette.json ids only; the comment names the palette role) -----------------------------------------
export const QUARTZ_BRICKS = "quartz_bricks"; // white_brick
export const SMOOTH_QUARTZ = "smooth_quartz"; // trim
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // trim
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // trim
export const STONE_BRICKS = "stone_bricks"; // down_under
export const CRACKED_STONE_BRICKS = "cracked_stone_bricks"; // down_under
export const MOSSY_STONE_BRICKS = "mossy_stone_bricks"; // down_under
export const STONE_BRICK_STAIRS = "stone_brick_stairs"; // down_under
export const STONE_BRICK_SLAB = "stone_brick_slab"; // down_under
export const STONE_BRICK_WALL = "stone_brick_wall"; // down_under
export const COBBLED_DEEPSLATE = "cobbled_deepslate"; // plinth
export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs"; // plinth
export const GREEN_CONCRETE = "green_concrete"; // posts
export const DARK_OAK_PLANKS = "dark_oak_planks"; // timber
export const DARK_OAK_STAIRS = "dark_oak_stairs"; // timber
export const DARK_OAK_SLAB = "dark_oak_slab"; // timber
export const DARK_OAK_FENCE = "dark_oak_fence"; // timber
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor"; // timber
export const DARK_OAK_DOOR = "dark_oak_door"; // timber
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log"; // timber
export const RED_WOOL = "red_wool"; // awning
export const WHITE_WOOL = "white_wool"; // awning
export const DEEPSLATE_TILES = "deepslate_tiles"; // roofs
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // roofs
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // roofs
export const SMOOTH_STONE = "smooth_stone"; // deck
export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // deck
export const POLISHED_ANDESITE = "polished_andesite"; // deck
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab"; // deck
export const GLASS_PANE = "glass_pane"; // glass
export const OCHRE_FROGLIGHT = "ochre_froglight"; // glass
export const BRICKS = "bricks"; // chimney
export const WHITE_CONCRETE = "white_concrete"; // objects
export const IRON_BARS = "iron_bars"; // objects
export const RED_STAINED_GLASS = "red_stained_glass"; // objects
export const RED_STAINED_GLASS_PANE = "red_stained_glass_pane"; // objects
export const GLOWSTONE = "glowstone"; // objects
export const REDSTONE_LAMP = "redstone_lamp"; // objects
export const RED_CONCRETE = "red_concrete"; // objects
export const BLACK_CONCRETE = "black_concrete"; // objects
export const PACKED_ICE = "packed_ice"; // objects
export const DRIED_KELP_BLOCK = "dried_kelp_block"; // objects
export const PINK_WOOL = "pink_wool"; // objects
export const LIGHT_GRAY_WOOL = "light_gray_wool"; // objects
export const ORANGE_WOOL = "orange_wool"; // objects
export const BARREL = "barrel"; // objects
export const MELON = "melon"; // objects
export const PUMPKIN = "pumpkin"; // objects
export const HAY_BLOCK = "hay_block"; // objects
export const YELLOW_WOOL = "yellow_wool"; // objects
export const GREEN_WOOL = "green_wool"; // objects
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves"; // objects
export const MOSS_BLOCK = "moss_block"; // objects
export const FLOWER_POT = "flower_pot"; // objects
export const POTTED_RED_TULIP = "potted_red_tulip"; // objects
export const POTTED_POPPY = "potted_poppy"; // objects
export const POTTED_CORNFLOWER = "potted_cornflower"; // objects
export const POTTED_ALLIUM = "potted_allium"; // objects
export const POTTED_ORANGE_TULIP = "potted_orange_tulip"; // objects
export const CAULDRON = "cauldron"; // objects
export const COMPOSTER = "composter"; // objects
export const CANDLE = "candle"; // objects
export const LANTERN = "lantern"; // objects
export const CHAIN = "chain"; // objects
export const DARK_OAK_HANGING_SIGN = "dark_oak_hanging_sign"; // objects
export const DARK_OAK_WALL_SIGN = "dark_oak_wall_sign"; // objects
export const RED_BANNER = "red_banner"; // objects
export const WHITE_BANNER = "white_banner"; // objects
export const BROWN_BANNER = "brown_banner"; // objects

// ---- site (plan.md SITE, FOOTPRINT, MASSES, FLOORS, ROOMS; y 0 = the lowest ground) ------------------------------
/** Plot 0 in cells: x 0..42, y 0..82, z 0..311. Column x 42 is never built (outside the footprint). */
export const SITE = { x: 43, y: 83, z: 312 };
/** The footprint, one row per z band: [z0, z1, x0, x1] inclusive (plan.md footprint table). */
export const FOOTPRINT = [[0, 132, 28, 34], [133, 160, 28, 41], [161, 188, 21, 41], [189, 223, 14, 41], [224, 251, 7, 41], [252, 307, 0, 41], [308, 311, 7, 41]];
/** True when (x, z) is a footprint cell: the only columns a part may build in. */
export const inFootprint = (x, z) => FOOTPRINT.some(([z0, z1, x0, x1]) => z >= z0 && z <= z1 && x >= x0 && x <= x1);
/** Ground top y of column (x, z). PLACEHOLDER: plan.md names a GROUND map per 7x7 cell but gives no values; this is a
 *  linear fit to its two stated edges (y 4 at x 0, y 20..23 at the street x 41). Replace with the real per-cell map. */
export const groundY = (x, z) => Math.round(4 + (16 * x) / 41 + (3 * z) / 311);
/** Masses as [x0, y0, z0, x1, y1, z1] inclusive (plan.md masses table). S's floor is 20 (z 161..188) or 22 (z 189..279). */
export const MASSES = {
  A: [28, 19, 0, 34, 28, 132], B1: [28, 20, 133, 41, 31, 160], B2: [21, 20, 161, 33, 36, 188],
  C: [14, 22, 189, 33, 45, 279], S: [34, 20, 161, 41, 29, 279], D: [14, 23, 280, 41, 43, 311],
  SG: [37, 43, 279, 39, 70, 310], MP: [41, 42, 281, 41, 45, 299],
};
/** Floor block y per mass (plan.md FLOORS). A person stands at floor + 1. */
export const FLOORS = { A: [19], B1: [20], B2: [20, 26], C: [22, 28, 34], D: [23, 29, 35], S_NORTH: [20], S_MAIN: [22] };
/** Down Under level floors; the walk is at f + 1 and each level is 5 tall (plan.md DU). */
export const DU_LEVELS = [2, 7, 12, 17];
/** Eave, wall-top, deck and parapet lines (plan.md ROOFS and FACADES). */
export const HEIGHTS = { B2_WALL_TOP: 31, B2_EAVE: 32, C_WALL_TOP: 39, C_EAVE: 40, D_WALL_TOP: 41, DECK_Y: 42, PARAPET_Y: 43, R_C_RIDGE: 45 };
/** Aisle slab-ramp lines where the street floor steps: [z before, z after]; the ramp sits at x 34..39. */
export const RAMP_Z = [[132, 133], [188, 189], [279, 280]];
/** Aisle columns that stay clear of counters, stalls and posts. */
export const AISLE_X = { x0: 34, x1: 36 };
/** Chimney stack corners (2x2, x and z of the low corner) on the roof keep cells; R-C twice, R-B2 once. */
export const STACKS = [[23, 214], [23, 254], [27, 174]];
/** The PUBLIC MARKET CENTER sign SG: letters at x 39, board y 48..69, legs at x 38 on these z (plan.md SG). */
export const SIGN = { x0: 37, x1: 39, y0: 43, y1: 70, z0: 279, z1: 310, legZ: [281, 289, 297, 305] };
/** Market clocks: east face at x 41 (y 35..41, z 302..308); south face at z 311 (y 35..41, x 33..39). */
export const CLOCK = { east: { x: 41, y0: 35, y1: 41, z0: 302, z1: 308 }, south: { z: 311, y0: 35, y1: 41, x0: 33, x1: 39 } };
/** MEET THE PRODUCER board: x 41, y 42..45, z 281..299 (raised parapet). */
export const PRODUCER_BOARD = { x: 41, y0: 42, y1: 45, z0: 281, z1: 299 };
/** Fish ice beds: x 35..40, z 296..309; trough y 24, ice y 25 (plan.md RESERVED). */
export const ICE_BED = { x0: 35, x1: 40, z0: 296, z1: 309 };
/** The main entrance (inside the open arcade storey of D) and the street point just outside the plot (plan.md ROOMS). */
export const ENTRANCE = { door: [41, 23, 285], street: [43, 23, 285] };

/** A seeded random source: rng(seed)() gives the next float in [0, 1). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
