// Palette ids (palette.json's ids only), plan.md's site coordinates, and a seeded rng: every part imports from here.
// The grid is 0-based, so the grass surface y 0 is its bottom layer; the buried foundation (y -2..-1) is not stored.

// ---- site ---------------------------------------------------------------------------------------------------------
export const SITE_SIZE = [96, 25, 19]; // grid build.mjs makes: x 0..95, y 0..24 (tower apex y 22, rod y 23), z 0..18
export const GROUND_Y = 0; // grass_block surface: the bottom layer of the grid
export const STAND_Y = 1; // outdoor standing level (the player stands on y1)
export const LANE_Z = [0, 4]; // lane rows z0..4 at y0: coarse edges z0/z4, dirt_path ruts z1/z3, gravel z2
export const LAMP_XS = [0, 12, 24, 36, 48, 60, 72, 84, 95]; // lamp posts on the lane's south edge z4
export const PLOT_WIDTH = 12; // module cut: plot i is x 12i..12i+11
export const PLOTS = 8; // plots 0..7
/** The first x of plot i (x 12i). */
export const plotX0 = (i) => PLOT_WIDTH * i;
/** The plot index that owns column x (x 12i..12i+11). */
export const plotOf = (x) => Math.floor(x / PLOT_WIDTH);

// Masses from plan.md's SITE table: { plot, mass, box: [x0, y0, z0, x1, y1, z1] } in inclusive absolute cells.
export const MASSES = [
  { plot: 0, mass: "double shotgun body", box: [1, 1, 9, 10, 6, 16] },
  { plot: 0, mass: "party wall", box: [5, 3, 9, 6, 11, 16] },
  { plot: 0, mass: "west unit interior", box: [2, 3, 10, 4, 6, 15] },
  { plot: 0, mass: "east unit interior", box: [7, 3, 10, 9, 6, 15] },
  { plot: 0, mass: "shared front porch", box: [1, 1, 7, 10, 7, 8] },
  { plot: 0, mass: "front steps", box: [5, 1, 6, 6, 1, 6] },
  { plot: 0, mass: "twin back stack", box: [3, 1, 17, 8, 10, 18] },
  { plot: 0, mass: "back stoop west", box: [2, 2, 17, 2, 2, 17] },
  { plot: 0, mass: "back stoop east", box: [9, 2, 17, 9, 2, 17] },
  { plot: 1, mass: "Creole cottage body", box: [15, 1, 10, 22, 6, 17] },
  { plot: 1, mass: "engaged galerie", box: [15, 1, 7, 22, 6, 9] },
  { plot: 1, mass: "front steps", box: [17, 1, 6, 18, 1, 6] },
  { plot: 1, mass: "west gable-end chimney", box: [13, 1, 12, 14, 14, 14] },
  { plot: 2, mass: "American Foursquare body", box: [27, 1, 9, 34, 11, 16] },
  { plot: 2, mass: "full-width front porch", box: [27, 1, 7, 34, 7, 8] },
  { plot: 2, mass: "front steps", box: [29, 1, 6, 30, 1, 6] },
  { plot: 2, mass: "front dormer", box: [29, 12, 10, 32, 15, 12] },
  { plot: 2, mass: "west chimney", box: [25, 1, 11, 26, 16, 13] },
  { plot: 3, mass: "Queen Anne main body", box: [39, 1, 9, 45, 11, 16] },
  { plot: 3, mass: "corner tower", box: [43, 1, 7, 46, 15, 10] },
  { plot: 3, mass: "wraparound porch front leg", box: [37, 1, 7, 42, 7, 8] },
  { plot: 3, mass: "wraparound porch west leg", box: [37, 1, 9, 38, 7, 14] },
  { plot: 3, mass: "front steps", box: [41, 1, 6, 42, 1, 6] },
  { plot: 3, mass: "back chimney", box: [40, 1, 17, 42, 16, 18] },
  { plot: 4, mass: "front gable block", box: [53, 1, 9, 58, 8, 16] },
  { plot: 4, mass: "side wing", box: [49, 1, 12, 53, 6, 16] },
  { plot: 4, mass: "porch in the angle", box: [49, 1, 9, 52, 7, 11] },
  { plot: 4, mass: "porch steps", box: [51, 1, 8, 52, 1, 8] },
  { plot: 4, mass: "back chimney", box: [50, 1, 17, 52, 12, 18] },
  { plot: 5, mass: "mule barn", box: [61, 1, 9, 68, 7, 15] },
  { plot: 5, mass: "wagon lean-to", box: [69, 1, 9, 70, 5, 15] },
  { plot: 5, mass: "paddock", box: [61, 1, 16, 70, 1, 18] },
  { plot: 5, mass: "hay hoist beam", box: [64, 10, 8, 65, 10, 8] },
  { plot: 6, mass: "picnic pavilion", box: [74, 1, 7, 81, 4, 11] },
  { plot: 6, mass: "long table and benches", box: [76, 1, 8, 79, 1, 10] },
  { plot: 6, mass: "brick bread oven", box: [73, 1, 14, 77, 4, 17] },
  { plot: 6, mass: "oven stack", box: [74, 1, 16, 76, 9, 17] },
  { plot: 6, mass: "oven apron", box: [73, 0, 13, 77, 0, 13] },
  { plot: 6, mass: "water tank", box: [79, 1, 14, 82, 9, 17] },
  { plot: 6, mass: "rain barrels", box: [79, 1, 13, 82, 1, 13] },
  { plot: 7, mass: "company duplex body", box: [85, 1, 9, 94, 11, 16] },
  { plot: 7, mass: "party wall", box: [89, 3, 9, 90, 11, 16] },
  { plot: 7, mass: "west unit interior", box: [86, 3, 10, 88, 11, 15] },
  { plot: 7, mass: "east unit interior", box: [91, 3, 10, 93, 11, 15] },
  { plot: 7, mass: "two-storey porch", box: [85, 1, 7, 94, 11, 8] },
  { plot: 7, mass: "front steps", box: [88, 1, 6, 91, 1, 6] },
  { plot: 7, mass: "west back stack", box: [86, 1, 17, 88, 15, 18] },
  { plot: 7, mass: "east back stack", box: [91, 1, 17, 93, 15, 18] },
];

// ---- palette: one constant per palette.json id, the role after each -------------------------------------------------
export const GRASS_BLOCK = "grass_block"; // ground
export const COARSE_DIRT = "coarse_dirt"; // ground
export const PODZOL = "podzol"; // ground
export const ROOTED_DIRT = "rooted_dirt"; // ground
export const DIRT_PATH = "dirt_path"; // ground
export const GRAVEL = "gravel"; // ground
export const PACKED_MUD = "packed_mud"; // ground
export const STONE = "stone"; // ground
export const DIRT = "dirt"; // ground
export const BRICKS = "bricks"; // foundation
export const BRICK_STAIRS = "brick_stairs"; // foundation
export const BRICK_SLAB = "brick_slab"; // foundation
export const BRICK_WALL = "brick_wall"; // foundation
export const STONE_BRICKS = "stone_bricks"; // foundation
export const MOSSY_STONE_BRICKS = "mossy_stone_bricks"; // foundation
export const STONE_BRICK_STAIRS = "stone_brick_stairs"; // foundation
export const STONE_BRICK_SLAB = "stone_brick_slab"; // foundation
export const STONE_BRICK_WALL = "stone_brick_wall"; // foundation
export const COBBLESTONE = "cobblestone"; // foundation
export const MOSSY_COBBLESTONE = "mossy_cobblestone"; // foundation
export const COBBLESTONE_WALL = "cobblestone_wall"; // foundation
export const COBBLED_DEEPSLATE = "cobbled_deepslate"; // foundation
export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs"; // foundation
export const COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab"; // foundation
export const DEEPSLATE_BRICKS = "deepslate_bricks"; // foundation
export const DARK_OAK_PLANKS = "dark_oak_planks"; // decks_floors
export const DARK_OAK_SLAB = "dark_oak_slab"; // decks_floors
export const DARK_OAK_STAIRS = "dark_oak_stairs"; // decks_floors
export const JUNGLE_PLANKS = "jungle_planks"; // decks_floors
export const JUNGLE_SLAB = "jungle_slab"; // decks_floors
export const SPRUCE_PLANKS = "spruce_planks"; // decks_floors
export const SPRUCE_SLAB = "spruce_slab"; // decks_floors
export const SPRUCE_STAIRS = "spruce_stairs"; // decks_floors
export const LIGHT_BLUE_TERRACOTTA = "light_blue_terracotta"; // walls
export const CHERRY_PLANKS = "cherry_planks"; // walls
export const CHERRY_SLAB = "cherry_slab"; // walls
export const YELLOW_TERRACOTTA = "yellow_terracotta"; // walls
export const CRIMSON_PLANKS = "crimson_planks"; // walls
export const BIRCH_PLANKS = "birch_planks"; // walls
export const CYAN_TERRACOTTA = "cyan_terracotta"; // walls
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log"; // walls
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log"; // walls
export const STRIPPED_OAK_LOG = "stripped_oak_log"; // walls
export const STRIPPED_SPRUCE_WOOD = "stripped_spruce_wood"; // walls
export const STRIPPED_BIRCH_LOG = "stripped_birch_log"; // trim
export const STRIPPED_BIRCH_WOOD = "stripped_birch_wood"; // trim
export const BIRCH_SLAB = "birch_slab"; // trim
export const BIRCH_STAIRS = "birch_stairs"; // trim
export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // trim
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab"; // trim
export const SMOOTH_QUARTZ = "smooth_quartz"; // trim
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // trim
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // trim
export const RED_NETHER_BRICKS = "red_nether_bricks"; // roof
export const RED_NETHER_BRICK_STAIRS = "red_nether_brick_stairs"; // roof
export const RED_NETHER_BRICK_SLAB = "red_nether_brick_slab"; // roof
export const NETHER_BRICKS = "nether_bricks"; // roof
export const NETHER_BRICK_STAIRS = "nether_brick_stairs"; // roof
export const NETHER_BRICK_SLAB = "nether_brick_slab"; // roof
export const POLISHED_BLACKSTONE_BRICK_SLAB = "polished_blackstone_brick_slab"; // roof
export const DEEPSLATE_TILES = "deepslate_tiles"; // roof
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // roof
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // roof
export const WEATHERED_CUT_COPPER = "weathered_cut_copper"; // roof
export const WEATHERED_CUT_COPPER_STAIRS = "weathered_cut_copper_stairs"; // roof
export const WEATHERED_CUT_COPPER_SLAB = "weathered_cut_copper_slab"; // roof
export const OXIDIZED_CUT_COPPER = "oxidized_cut_copper"; // roof
export const OXIDIZED_CUT_COPPER_STAIRS = "oxidized_cut_copper_stairs"; // roof
export const OXIDIZED_CUT_COPPER_SLAB = "oxidized_cut_copper_slab"; // roof
export const COPPER_BLOCK = "copper_block"; // roof
export const MUD_BRICKS = "mud_bricks"; // roof
export const MUD_BRICK_STAIRS = "mud_brick_stairs"; // roof
export const MUD_BRICK_SLAB = "mud_brick_slab"; // roof
export const DARK_PRISMARINE = "dark_prismarine"; // roof
export const DARK_PRISMARINE_STAIRS = "dark_prismarine_stairs"; // roof
export const DARK_PRISMARINE_SLAB = "dark_prismarine_slab"; // roof
export const MANGROVE_PLANKS = "mangrove_planks"; // roof
export const MANGROVE_SLAB = "mangrove_slab"; // roof
export const MANGROVE_STAIRS = "mangrove_stairs"; // roof
export const GLASS_PANE = "glass_pane"; // glass
export const ORANGE_STAINED_GLASS_PANE = "orange_stained_glass_pane"; // glass
export const BAMBOO_DOOR = "bamboo_door"; // doors_shutters
export const DARK_OAK_DOOR = "dark_oak_door"; // doors_shutters
export const SPRUCE_DOOR = "spruce_door"; // doors_shutters
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor"; // doors_shutters
export const WARPED_TRAPDOOR = "warped_trapdoor"; // doors_shutters
export const SPRUCE_TRAPDOOR = "spruce_trapdoor"; // doors_shutters
export const BIRCH_TRAPDOOR = "birch_trapdoor"; // doors_shutters
export const IRON_TRAPDOOR = "iron_trapdoor"; // doors_shutters
export const SPRUCE_FENCE = "spruce_fence"; // fences
export const SPRUCE_FENCE_GATE = "spruce_fence_gate"; // fences
export const DARK_OAK_FENCE = "dark_oak_fence"; // fences
export const BIRCH_FENCE = "birch_fence"; // fences
export const OAK_FENCE = "oak_fence"; // fences
export const CAMPFIRE = "campfire"; // fire_functional
export const HAY_BLOCK = "hay_block"; // fire_functional
export const FURNACE = "furnace"; // fire_functional
export const SMOKER = "smoker"; // fire_functional
export const CAULDRON = "cauldron"; // fire_functional
export const WATER_CAULDRON = "water_cauldron"; // fire_functional
export const COMPOSTER = "composter"; // fire_functional
export const SMITHING_TABLE = "smithing_table"; // fire_functional
export const BARREL = "barrel"; // fire_functional
export const LADDER = "ladder"; // fire_functional
export const IRON_CHAIN = "iron_chain"; // fire_functional
export const LANTERN = "lantern"; // fire_functional
export const LIGHTNING_ROD = "lightning_rod"; // fire_functional
export const WHITE_WOOL = "white_wool"; // fire_functional
export const OAK_LEAVES = "oak_leaves"; // plants
export const JUNGLE_LEAVES = "jungle_leaves"; // plants
export const AZALEA = "azalea"; // plants
export const LILAC = "lilac"; // plants
export const PEONY = "peony"; // plants
export const ROSE_BUSH = "rose_bush"; // plants
export const CORNFLOWER = "cornflower"; // plants
export const POPPY = "poppy"; // plants
export const DANDELION = "dandelion"; // plants
export const SUNFLOWER = "sunflower"; // plants
export const SHORT_GRASS = "short_grass"; // plants
export const FERN = "fern"; // plants
export const BLUE_BED = "blue_bed"; // object
export const CYAN_BED = "cyan_bed"; // object
export const PINK_BED = "pink_bed"; // object
export const YELLOW_BED = "yellow_bed"; // object
export const PURPLE_BED = "purple_bed"; // object
export const LIME_BED = "lime_bed"; // object
export const RED_BED = "red_bed"; // object
export const ORANGE_BED = "orange_bed"; // object
export const FLOWER_POT = "flower_pot"; // object

// ---- rng ------------------------------------------------------------------------------------------------------------
/** A seeded random source (mulberry32): rng(seed)() -> 0..1, the same sequence for the same seed. */
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
