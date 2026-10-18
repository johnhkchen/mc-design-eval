// Shared constants for every part of the Sears row: the server version, the site (plan.md SITE), the palette ids
// (palette.json only) and a seeded random generator. Written once by the scaffold; parts import from here.

// the server's Minecraft version (DataVersion 3955): every block id and state must exist in 1.21.1
export const SERVER_VERSION = "1.21.1";
// the site in cells [x, y, z]: x 0..127 (eight plots of 16), y 0..23, z 0..24 (street z 0..4, plots z 5..24)
export const SITE_SIZE = [128, 24, 25];
// the eight plots (plan.md): plot i covers x 16i .. 16i+15 and is PLOT_WIDTH wide; local x (lx) = absolute x - 16i
export const PLOT_COUNT = 8;
export const PLOT_WIDTH = 16;
// the first and last z of a plot's lawn and back yard (the street is z 0..4)
export const LAWN_Z0 = 5;
export const LAWN_Z1 = 24;
// the street: gravel z 0..2 (y 0), smooth_stone z 3..4 (y 0)
export const STREET_GRAVEL_Z1 = 2;
export const STREET_STONE_Z1 = 4;
// the level of each floor layer (plan.md SITE levels): the lawn y, the ground floor's floor block, the upper floor's
export const GROUND_Y = 0;
export const LAWN_WALK_Y = 1;
export const GROUND_FLOOR_Y = 1;
export const UPPER_FLOOR_Y = 5;
// the top of a two-storey wall (one-storey walls end at y 4), and the Magnolia attic floor
export const WALL_PLATE_Y = 8;
export const ATTIC_FLOOR_Y = 9;
// the absolute x of plot i's first cell (plot 0 starts at x 0)
export const plotX0 = (i) => PLOT_WIDTH * i;
// the house in each plot (plan.md order): Magnolia, Alhambra, Vallonia, Puritan, Cornell, Stanford, Winona, Craftsman
export const PLOT_HOUSES = ["Magnolia", "Alhambra", "Vallonia", "Puritan", "Cornell", "Stanford", "Winona", "Craftsman"];

// the palette: one constant per block id in palette.json (the role in each comment is its palette role)
// masonry: the bricks block
export const BRICKS = "bricks";
// masonry: the brick stairs block
export const BRICK_STAIRS = "brick_stairs";
// masonry: the brick slab block
export const BRICK_SLAB = "brick_slab";
// masonry: the brick wall block
export const BRICK_WALL = "brick_wall";
// masonry: the mud bricks block
export const MUD_BRICKS = "mud_bricks";
// masonry: the mud brick stairs block
export const MUD_BRICK_STAIRS = "mud_brick_stairs";
// masonry: the mud brick slab block
export const MUD_BRICK_SLAB = "mud_brick_slab";
// masonry: the cobblestone block
export const COBBLESTONE = "cobblestone";
// masonry: the cobblestone slab block
export const COBBLESTONE_SLAB = "cobblestone_slab";
// masonry: the mossy cobblestone block
export const MOSSY_COBBLESTONE = "mossy_cobblestone";
// masonry: the stone bricks block
export const STONE_BRICKS = "stone_bricks";
// masonry: the smooth quartz block
export const SMOOTH_QUARTZ = "smooth_quartz";
// masonry: the smooth quartz stairs block
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";
// masonry: the smooth quartz slab block
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
// masonry: the quartz pillar block
export const QUARTZ_PILLAR = "quartz_pillar";
// masonry: the quartz stairs block
export const QUARTZ_STAIRS = "quartz_stairs";
// masonry: the smooth stone block
export const SMOOTH_STONE = "smooth_stone";
// masonry: the smooth stone slab block
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
// masonry: the smooth sandstone block
export const SMOOTH_SANDSTONE = "smooth_sandstone";
// masonry: the white terracotta block
export const WHITE_TERRACOTTA = "white_terracotta";
// masonry: the granite stairs block
export const GRANITE_STAIRS = "granite_stairs";
// body: the white concrete block
export const WHITE_CONCRETE = "white_concrete";
// body: the lime terracotta block
export const LIME_TERRACOTTA = "lime_terracotta";
// body: the birch planks block
export const BIRCH_PLANKS = "birch_planks";
// body: the cyan terracotta block
export const CYAN_TERRACOTTA = "cyan_terracotta";
// body: the calcite block
export const CALCITE = "calcite";
// body: the spruce planks block
export const SPRUCE_PLANKS = "spruce_planks";
// body: the stripped birch log block
export const STRIPPED_BIRCH_LOG = "stripped_birch_log";
// body: the dark oak planks block
export const DARK_OAK_PLANKS = "dark_oak_planks";
// wood_trim: the stripped spruce log block
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";
// wood_trim: the stripped dark oak log block
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";
// wood_trim: the spruce slab block
export const SPRUCE_SLAB = "spruce_slab";
// wood_trim: the spruce stairs block
export const SPRUCE_STAIRS = "spruce_stairs";
// wood_trim: the spruce fence block
export const SPRUCE_FENCE = "spruce_fence";
// wood_trim: the dark oak stairs block
export const DARK_OAK_STAIRS = "dark_oak_stairs";
// wood_trim: the dark oak slab block
export const DARK_OAK_SLAB = "dark_oak_slab";
// wood_trim: the oak planks block
export const OAK_PLANKS = "oak_planks";
// wood_trim: the oak slab block
export const OAK_SLAB = "oak_slab";
// doors_glass: the dark oak door block
export const DARK_OAK_DOOR = "dark_oak_door";
// doors_glass: the spruce door block
export const SPRUCE_DOOR = "spruce_door";
// doors_glass: the oak door block
export const OAK_DOOR = "oak_door";
// doors_glass: the glass pane block
export const GLASS_PANE = "glass_pane";
// doors_glass: the iron bars block
export const IRON_BARS = "iron_bars";
// shutters: the dark oak trapdoor block
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";
// shutters: the warped trapdoor block
export const WARPED_TRAPDOOR = "warped_trapdoor";
// shutters: the spruce trapdoor block
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
// ground: the grass block block
export const GRASS_BLOCK = "grass_block";
// ground: the gravel block
export const GRAVEL = "gravel";
// ground: the oak leaves block
export const OAK_LEAVES = "oak_leaves";
// ground: the azalea block
export const AZALEA = "azalea";
// ground: the flowering azalea block
export const FLOWERING_AZALEA = "flowering_azalea";
// ground: the poppy block
export const POPPY = "poppy";
// ground: the dandelion block
export const DANDELION = "dandelion";
// ground: the allium block
export const ALLIUM = "allium";
// ground: the lilac block
export const LILAC = "lilac";
// ground: the potted poppy block
export const POTTED_POPPY = "potted_poppy";
// ground: the potted dandelion block
export const POTTED_DANDELION = "potted_dandelion";
// ground: the potted allium block
export const POTTED_ALLIUM = "potted_allium";
// ground: the potted azalea bush block
export const POTTED_AZALEA_BUSH = "potted_azalea_bush";
// ground: the coarse dirt block
export const COARSE_DIRT = "coarse_dirt";
// ground: the podzol block
export const PODZOL = "podzol";
// fire: the campfire block
export const CAMPFIRE = "campfire";
// fire: the hay block block
export const HAY_BLOCK = "hay_block";
// lighting: the lantern block
export const LANTERN = "lantern";
// lighting: the candle block
export const CANDLE = "candle";
// lighting: the wall torch block
export const WALL_TORCH = "wall_torch";
// furniture: the white bed block
export const WHITE_BED = "white_bed";
// furniture: the red bed block
export const RED_BED = "red_bed";
// furniture: the blue bed block
export const BLUE_BED = "blue_bed";
// furniture: the green bed block
export const GREEN_BED = "green_bed";
// furniture: the barrel block
export const BARREL = "barrel";
// furniture: the smoker block
export const SMOKER = "smoker";
// furniture: the furnace block
export const FURNACE = "furnace";
// furniture: the cauldron block
export const CAULDRON = "cauldron";
// furniture: the composter block
export const COMPOSTER = "composter";
// furniture: the chest block
export const CHEST = "chest";
// furniture: the bookshelf block
export const BOOKSHELF = "bookshelf";
// furniture: the oak fence block
export const OAK_FENCE = "oak_fence";
// furniture: the oak pressure plate block
export const OAK_PRESSURE_PLATE = "oak_pressure_plate";
// furniture: the spruce pressure plate block
export const SPRUCE_PRESSURE_PLATE = "spruce_pressure_plate";
// furniture: the oak stairs block
export const OAK_STAIRS = "oak_stairs";
// furniture: the birch stairs block
export const BIRCH_STAIRS = "birch_stairs";
// furniture: the white carpet block
export const WHITE_CARPET = "white_carpet";
// furniture: the red carpet block
export const RED_CARPET = "red_carpet";
// furniture: the brown carpet block
export const BROWN_CARPET = "brown_carpet";
// furniture: the flower pot block
export const FLOWER_POT = "flower_pot";
// furniture: the loom block
export const LOOM = "loom";
// furniture: the crafting table block
export const CRAFTING_TABLE = "crafting_table";
// furniture: the ladder block
export const LADDER = "ladder";
// object: the deepslate bricks block
export const DEEPSLATE_BRICKS = "deepslate_bricks";
// object: the deepslate tiles block
export const DEEPSLATE_TILES = "deepslate_tiles";
// object: the birch slab block
export const BIRCH_SLAB = "birch_slab";

// a seeded random generator (mulberry32): rng(seed)() gives the next float in [0, 1); the same seed gives the same build
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
