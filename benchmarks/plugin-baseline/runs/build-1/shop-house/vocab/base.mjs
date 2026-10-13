// SPDX-License-Identifier: AGPL-3.0-or-later
// Shared constants for every part: palette ids (palette.json only), plan.md's site coordinates, and a seeded rng.

// ---- site (plan.md SITE, FLOORS) -----------------------------------------------------------------------------------
/** Full lot size as grid dimensions: x 0..27, y 0..34, z 0..38. */
export const SITE_SIZE = [28, 35, 39];
/** Street edge is north (-z); the lot runs south to z 38. */
export const LOT = { x0: 0, x1: 27, y0: 0, y1: 34, z0: 0, z1: 38 };
/** Floor-block y of each storey (the top of the floor block; interiors start one above). */
export const FLOOR_Y = { shop: 5, first: 13, second: 18, loft: 23 };
/** Main body (shop + two home storeys): outer walls x 4 (W) and x 19 (E), front z 5, rear z 22. */
export const MAIN = { x0: 4, x1: 19, z0: 5, z1: 22, wallTop: 23 };
/** Back return (rear wing): walls x 4 and x 11, south wall z 30, shares the main rear wall z 22. */
export const WING = { x0: 4, x1: 11, z0: 22, z1: 30, wallTop: 18 };
/** Shop tenant unit (A1 + A2) at the street: wall lines x 10, 14, 18; counter edge z 6; fascia line z 5. */
export const SHOP = { x0: 10, x1: 18, z0: 5, z1: 21 };
/** Keep-clear in front of the counters: nothing is built here. */
export const KEEP_CLEAR = { x0: 10, x1: 18, y0: 6, y1: 8, z0: 4, z1: 5 };
/** Side passage from the pavement to the garden gate. */
export const PASSAGE = { x0: 20, x1: 25, y: 5, z0: 6, z1: 21 };
/** Garden gate: double spruce_fence_gate, x 22..23 at z 22, passage to garden. */
export const GARDEN_GATE = { x0: 22, x1: 23, y: 6, z: 22 };
/** Chimney stacks: E against the east wall x 19, S against the wing's south gable z 30. */
export const CHIMNEY_E = { x0: 20, x1: 21, z0: 13, z1: 14, y0: 5, y1: 31 };
export const CHIMNEY_S = { x0: 7, x1: 8, z0: 31, z1: 32, y0: 5, y1: 26 };
/** Garden water cells (y 5): the ground leaves them. */
export const WATER_CELLS = [[14, 32], [22, 31], [22, 26], [5, 34]];

// ---- palette (palette.json ids only) ---------------------------------------------------------------------------------
// ground and street
export const DIRT = "dirt";
export const STONE = "stone";
export const ANDESITE = "andesite";
export const POLISHED_ANDESITE = "polished_andesite";
export const SMOOTH_STONE = "smooth_stone";
// walls and trim
export const BRICK = "bricks";
export const BRICK_STAIRS = "brick_stairs";
export const BRICK_SLAB = "brick_slab";
export const BRICK_WALL = "brick_wall";
export const QUARTZ = "smooth_quartz";
export const QUARTZ_STAIRS = "smooth_quartz_stairs";
export const QUARTZ_SLAB = "smooth_quartz_slab";
export const PLINTH = "polished_deepslate";
export const PLINTH_STAIRS = "polished_deepslate_stairs";
// shopfront and joinery (dark oak)
export const TIMBER_LOG = "stripped_dark_oak_log";
export const TIMBER = "dark_oak_planks";
export const TIMBER_STAIRS = "dark_oak_stairs";
export const TIMBER_SLAB = "dark_oak_slab";
export const TIMBER_DOOR = "dark_oak_door";
export const TIMBER_TRAPDOOR = "dark_oak_trapdoor";
export const TIMBER_FENCE = "dark_oak_fence";
export const TIMBER_FENCE_GATE = "dark_oak_fence_gate";
export const TIMBER_HANGING_SIGN = "dark_oak_hanging_sign";
export const TIMBER_WALL_SIGN = "dark_oak_wall_sign";
export const TIMBER_PRESSURE_PLATE = "dark_oak_pressure_plate";
// fascia, letters and awning (tenant-swappable)
export const FASCIA = "red_nether_bricks";
export const LETTER_BANNER = "white_banner";
export const LETTER_BANNER_WALL = "white_wall_banner";
export const AWNING_RED = "red_wool";
export const AWNING_WHITE = "white_wool";
// roof
export const ROOF_TILE = "deepslate_tiles";
export const ROOF_COBBLE = "cobbled_deepslate";
export const ROOF_POLISHED = "polished_deepslate";
export const ROOF_SLAB = "deepslate_tile_slab";
export const ROOF_STAIRS = "deepslate_tile_stairs";
export const DEEPSLATE_BRICK = "deepslate_bricks";
// chimneys, hearths and lights
export const HAY = "hay_block";
export const CAMPFIRE = "campfire";
export const LANTERN = "lantern";
export const IRON_CHAIN = "iron_chain";
export const GLASS_PANE = "glass_pane";
// interior floors and furniture
export const FLOOR_STONE = "stone_bricks";
export const FLOOR_SPRUCE = "spruce_planks";
export const FLOOR_OAK = "oak_planks";
export const SPRUCE_STAIRS = "spruce_stairs";
export const SPRUCE_SLAB = "spruce_slab";
export const SPRUCE_FENCE = "spruce_fence";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
export const OAK_STAIRS = "oak_stairs";
export const OAK_SLAB = "oak_slab";
export const OAK_FENCE = "oak_fence";
export const OAK_TRAPDOOR = "oak_trapdoor";
export const LADDER = "ladder";
export const BARREL = "barrel";
export const BOOKSHELF = "bookshelf";
export const RED_BED = "red_bed";
export const RED_CARPET = "red_carpet";
export const WHITE_CARPET = "white_carpet";
export const FURNACE = "furnace";
export const SMOKER = "smoker";
export const BLAST_FURNACE = "blast_furnace";
export const CRAFTING_TABLE = "crafting_table";
export const CAULDRON = "cauldron";
export const CANDLE = "candle";
export const RED_CANDLE = "red_candle";
export const FLOWER_POT = "flower_pot";
// garden
export const GRASS = "grass_block";
export const COARSE_DIRT = "coarse_dirt";
export const PODZOL = "podzol";
export const DIRT_PATH = "dirt_path";
export const GRAVEL = "gravel";
export const FARMLAND = "farmland";
export const WATER = "water";
export const CARROTS = "carrots";
export const POTATOES = "potatoes";
export const BEETROOTS = "beetroots";
export const WHEAT = "wheat";
export const SPRUCE_FENCE_GATE = "spruce_fence_gate";
export const COMPOSTER = "composter";
export const WATER_CAULDRON = "water_cauldron";
export const OAK_LOG = "oak_log";
export const OAK_LEAVES = "oak_leaves";
// tenant display (butcher; sockets.json "display")
export const PORK = "pink_terracotta";
export const BAKED_CHICKEN = "brown_mushroom_block";
export const STEAK = "red_terracotta";

// ---- rng -------------------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1); the same seed gives the same sequence. */
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
