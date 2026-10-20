// Shared constants for every part: palette names, the site frame, the plots' footprint and ground maps, a seeded rng.
// Site frame: x east, y up, z south; 1.4 blocks per metre; 1.21.1 block ids. Parts write in SITE coordinates; the
// plan.md coordinates of each plot are plot-LOCAL, so add the plot's origin (PLOT0 or PLOT1) to them.

// Site grid size in blocks: world x 151..359, z 146..485, y 0..117.
export const SITE_SIZE = [209, 118, 340];
// Plot origins in site coordinates: plot 0 local (0,0,0) and plot 1 local (0,0,0) (plot 0 world x232 z146; plot 1 world x151 z286).
export const PLOT0 = [81, 0, 0];
export const PLOT1 = [0, 0, 140];
// Plot sizes in blocks (local x, z) and highest allowed y, as plan.md states them.
export const PLOT0_SIZE = { x: 128, z: 340, top: 117 };
export const PLOT1_SIZE = { x: 81, z: 133, top: 86 };
// Deck heights (y of the deck; walk = deck + 1) from plan.md: MarketFront tiers, the plaza, housing, M1, plot 1 terraces.
export const DECKS = {
  W0: 6, T1: 13, T2: 20, T3: 28, T3N: 22, PLAZA: 28, PLAZA_WALK: 29, H_FLOORS: [20, 27, 34], H_ROOF: 41,
  M1_FLOORS: [34, 40, 46], M1_ROOF: 52, M2_FLOOR: 31, M2_ROOF: 37, TOWER_CAP: 35, K_CAP: 40,
  D0: 2, D1: 9, D2: 16, D3: 23, PLOT1_STAIR_TOPS: [9, 16, 23],
};

// Palette: the palette.json ids as named constants (1.21.1). Groups follow palette.json's roles.
// plinth
export const STONE_BRICKS = "stone_bricks";
export const MOSSY_STONE_BRICKS = "mossy_stone_bricks";
export const STONE_BRICK_STAIRS = "stone_brick_stairs";
export const STONE_BRICK_SLAB = "stone_brick_slab";
export const POLISHED_ANDESITE = "polished_andesite";
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";
// decks
export const SMOOTH_STONE = "smooth_stone";
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
export const STONE_STAIRS = "stone_stairs";
export const SPRUCE_PLANKS = "spruce_planks";
// metal_panels
export const GRAY_CONCRETE = "gray_concrete";
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";
// timber
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";
export const STRIPPED_SPRUCE_WOOD = "stripped_spruce_wood";
export const SPRUCE_SLAB = "spruce_slab";
export const SPRUCE_STAIRS = "spruce_stairs";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
export const SPRUCE_FENCE = "spruce_fence";
export const SPRUCE_DOOR = "spruce_door";
// housing
export const WHITE_CONCRETE = "white_concrete";
export const IRON_BARS = "iron_bars";
// old_market
export const QUARTZ_BRICKS = "quartz_bricks";
export const SMOOTH_QUARTZ = "smooth_quartz";
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";
export const QUARTZ_STAIRS = "quartz_stairs";
// glass
export const GLASS_PANE = "glass_pane";
export const GLASS = "glass";
// rails_posts
export const ANDESITE_WALL = "andesite_wall";
// bronze
export const WAXED_COPPER_BLOCK = "waxed_copper_block";
export const WAXED_CUT_COPPER_STAIRS = "waxed_cut_copper_stairs";
export const WAXED_CUT_COPPER_SLAB = "waxed_cut_copper_slab";
// dusk_light
export const SHROOMLIGHT = "shroomlight";
export const OCHRE_FROGLIGHT = "ochre_froglight";
export const LANTERN = "lantern";
export const CHAIN = "chain";
export const CANDLE = "candle";
// planting
export const GRASS_BLOCK = "grass_block";
export const MOSS_BLOCK = "moss_block";
export const SHORT_GRASS = "short_grass";
export const TALL_GRASS = "tall_grass";
export const AZALEA = "azalea";
export const FLOWERING_AZALEA = "flowering_azalea";
export const OAK_LOG = "oak_log";
export const OAK_LEAVES = "oak_leaves";
// awning
export const RED_WOOL = "red_wool";
export const WHITE_WOOL = "white_wool";
export const RED_CARPET = "red_carpet";
export const WHITE_CARPET = "white_carpet";
// lift
export const SOUL_SAND = "soul_sand";
export const BUBBLE_COLUMN = "bubble_column";
export const LADDER = "ladder";
// signs
export const SPRUCE_WALL_SIGN = "spruce_wall_sign";

// Footprint of plot 0: 1 char = 7x7 blocks, '#' = build here. Rows run along +z (north at row 0), columns along +x (west at column 0).
export const FOOT0 = [
  "..............##...",
  "..............##...",
  "..............##...",
  "..............##...",
  "..............###..",
  "..............###..",
  "...............##..",
  "...............##..",
  "...............##..",
  "........##.....##..",
  "......####.......#.",
  ".....#####.......#.",
  ".....#####.......#.",
  "....######.......#.",
  "....#####...######.",
  "....#####...#####..",
  "....#####..#######.",
  "....####...#######.",
  "...#####...#######.",
  "...######..#######.",
  "...###############.",
  "...###########.....",
  "..###############..",
  "..###############..",
  "..###############..",
  "..###############..",
  ".############..##..",
  ".################..",
  ".###############...",
  ".###############...",
  "###############....",
  "########.######....",
  "#######......##....",
  "..#####............",
  ".....####..........",
  "..........###......",
  "...................",
  "...................",
  "...................",
  "...................",
  "...................",
  "...................",
  "...................",
  "...............#...",
  "...............#...",
  "...............#...",
  "..............##...",
  "..............##...",
  "...................",
];
// Ground height above y 0 per 7x7 cell of plot 0 (blocks; 0 = no ground in that cell). Same layout as FOOT0.
export const GROUND0 = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 35, 35, 34, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 36, 35, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 37, 35, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 37, 36, 34, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 37, 36, 34, 33, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 37, 36, 34, 33, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 37, 34, 33, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 37, 34, 32, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 18, 18, 0, 0, 0, 0, 35, 34, 33, 32, 0],
  [0, 0, 0, 0, 0, 0, 11, 16, 18, 18, 0, 0, 0, 0, 0, 32, 32, 32, 0],
  [0, 0, 0, 0, 0, 6, 13, 16, 17, 17, 0, 0, 0, 0, 0, 0, 31, 31, 0],
  [0, 0, 0, 0, 6, 7, 13, 15, 16, 17, 0, 0, 0, 0, 0, 0, 30, 31, 0],
  [0, 0, 0, 0, 6, 7, 14, 15, 16, 17, 0, 0, 0, 0, 0, 0, 30, 31, 0],
  [0, 0, 0, 0, 6, 9, 14, 15, 16, 17, 0, 0, 0, 0, 0, 28, 30, 30, 0],
  [0, 0, 0, 0, 6, 12, 14, 15, 17, 17, 0, 0, 23, 25, 26, 28, 30, 30, 0],
  [0, 0, 0, 0, 5, 12, 14, 15, 18, 18, 0, 22, 23, 25, 26, 28, 29, 29, 0],
  [0, 0, 0, 3, 6, 13, 14, 15, 18, 0, 0, 21, 23, 24, 26, 27, 29, 29, 0],
  [0, 0, 0, 3, 8, 13, 14, 15, 16, 0, 0, 21, 23, 24, 26, 27, 28, 29, 0],
  [0, 0, 0, 6, 10, 12, 13, 14, 15, 0, 19, 21, 22, 24, 25, 27, 28, 28, 0],
  [0, 0, 0, 6, 10, 12, 13, 14, 15, 17, 19, 21, 22, 24, 25, 26, 28, 28, 0],
  [0, 0, 3, 6, 9, 11, 11, 13, 15, 17, 18, 20, 22, 24, 25, 26, 27, 28, 0],
  [0, 0, 3, 6, 9, 9, 10, 12, 14, 16, 18, 20, 22, 24, 25, 26, 27, 27, 0],
  [0, 0, 3, 5, 8, 8, 8, 11, 14, 16, 18, 20, 22, 24, 25, 27, 27, 27, 0],
  [0, 0, 3, 5, 6, 7, 8, 11, 13, 16, 18, 20, 22, 24, 26, 27, 27, 27, 0],
  [0, 2, 3, 5, 5, 5, 8, 11, 13, 16, 18, 20, 23, 25, 26, 27, 27, 26, 0],
  [0, 2, 4, 4, 4, 5, 8, 11, 13, 16, 18, 21, 23, 26, 26, 26, 26, 0, 0],
  [0, 3, 3, 4, 3, 6, 8, 11, 14, 16, 18, 21, 23, 26, 26, 26, 26, 0, 0],
  [0, 2, 3, 3, 3, 6, 9, 12, 14, 17, 18, 21, 23, 25, 26, 26, 26, 25, 0],
  [5, 5, 2, 2, 4, 7, 10, 13, 15, 17, 19, 20, 22, 24, 25, 25, 25, 0, 0],
  [5, 5, 3, 2, 4, 7, 11, 15, 17, 18, 19, 20, 22, 23, 24, 25, 0, 0, 0],
  [3, 3, 4, 3, 4, 7, 11, 19, 19, 19, 19, 20, 21, 22, 24, 24, 0, 0, 0],
  [3, 4, 4, 2, 4, 7, 11, 18, 19, 19, 19, 20, 21, 22, 23, 24, 0, 0, 0],
  [3, 4, 4, 2, 4, 6, 9, 10, 0, 0, 0, 19, 19, 21, 23, 0, 0, 0, 0],
  [3, 4, 4, 1, 3, 4, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23],
  [0, 0, 0, 1, 1, 2, 4, 6, 8, 10, 12, 0, 0, 0, 0, 0, 0, 0, 23],
  [0, 0, 0, 0, 0, 0, 0, 5, 7, 10, 13, 16, 20, 22, 0, 0, 0, 0, 24],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 22, 0, 0, 0, 0, 24],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 21, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21, 22, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21, 22, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 21, 23, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 21, 23, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 22, 24, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 24, 0, 0],
];
// Footprint of plot 1: 1 char = 3x3 blocks, '#' = build here. Rows along +z, columns along +x.
export const FOOT1 = [
  "............#..............",
  "...........####............",
  "...........######..........",
  "..........########.........",
  "..........##########.......",
  "..........############.....",
  "...........###############.",
  ".............#############.",
  "..............############.",
  "...............###########.",
  "...............###########.",
  "...............##########..",
  "..............###########..",
  "..............###########..",
  "..........###############..",
  "......###################..",
  "....####################...",
  "...#####################...",
  "..######################...",
  ".#######################...",
  ".######################....",
  ".################..........",
  ".################..........",
  "#################..........",
  "################...........",
  "################...........",
  "################...........",
  "################...........",
  "###############............",
  "###############............",
  "###############............",
  "##############.............",
  "##############.............",
  "##############.............",
  "#############..............",
  ".############..............",
  ".############..............",
  ".############..............",
  ".###########...............",
  ".###########...............",
  ".###########...............",
  ".#######..#................",
  ".#######...................",
  "...####....................",
  "...........................",
];
// Ground height above y 0 per 3x3 cell of plot 1 (blocks; 0 = no ground). Same layout as FOOT1.
export const GROUND1 = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 1, 1, 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 1, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 3, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 3, 3, 3, 3, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 3, 3, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 1, 1, 2, 2, 3, 3, 3, 3, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 1, 2, 2, 3, 3, 4, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 4, 4, 0, 0],
  [0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 4, 4, 0, 0],
  [0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 4, 5, 0, 0],
  [0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 5, 0, 0, 0],
  [0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 5, 5, 0, 0, 0],
  [0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 5, 5, 0, 0, 0],
  [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 5, 5, 0, 0, 0],
  [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 4, 5, 5, 0, 0, 0],
  [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 2, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 2, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 2, 2, 2, 1, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 2, 1, 2, 1, 1, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 2, 1, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 2, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// The map cell size of each plot, in blocks.
export const CELL = { 0: 7, 1: 3 };
// Footprint test for a plot-LOCAL block (plot 0 or 1): true when its cell is '#' on the footprint map.
export function onFootprint(plot, x, z) {
  const c = CELL[plot], foot = plot === 0 ? FOOT0 : FOOT1;
  const row = foot[Math.floor(z / c)];
  return row !== undefined && row[Math.floor(x / c)] === "#";
}
// Ground height (blocks above y 0) at a plot-LOCAL block (plot 0 or 1); 0 outside the map.
export function groundAt(plot, x, z) {
  const c = CELL[plot], ground = plot === 0 ? GROUND0 : GROUND1;
  const row = ground[Math.floor(z / c)];
  return row?.[Math.floor(x / c)] ?? 0;
}
// Seeded rng: rng(seed)() returns a float in [0, 1) (mulberry32); the same seed gives the same sequence.
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
