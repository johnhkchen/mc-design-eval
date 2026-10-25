// Site constants, the site maps and the palette for the Abbey of Mont-Saint-Michel (plan.md; plot 0).
// Coordinates are plot-local: x east 0..129, z south 0..120, y up 0..153. A map cell (c, r) covers x 3c..3c+2, z 3r..3r+2.

// ---- site ----
/** Grid size [x, y, z] for the whole plot: 130 x 154 x 121. */
export const GRID = [130, 154, 121];
/** Side of one footprint / ground map cell in blocks. */
export const MAP_CELL = 3;
/** The church axis: the crossing tower's centre line, z. */
export const CHURCH_Z = 64;
/** The west front's x (pilasters at x 14, door and classical front at x 15). */
export const WEST_FRONT_X = 15;
/** The apse's east end x (the round apse reaches x 97). */
export const APSE_X = 97;
/** The spire's centre column [x, z]; the spire body sits x 50..60, z 59..69 from y 99 up. */
export const SPIRE_CENTER = [55, 64];
/** Lowest y of the spire (the crossing tower's balustraded platform is y 99..100). */
export const SPIRE_BASE_Y = 99;
/** Top of the spire needle (y 142). */
export const SPIRE_TOP_Y = 142;
/** The archangel's sword tip [x, y, z]: the build's single highest block (y 151). */
export const ANGEL_TIP = [56, 151, 64];
/** Top y of the whole build (nothing above it). */
export const MAX_Y = 151;
/** The north face of the Merveille (z 7, the sheer wall over the bay). */
export const MERV_NORTH_Z = 7;
/** The east gable of the Merveille (x 107). */
export const MERV_EAST_X = 107;

// ---- footprint and ground (from brief.txt: FOOTPRINT and GROUND maps; 44 columns x 41 rows) ----
// FOOTPRINT: '#' = build here, '.' = nothing. Clip every block to it.
const FOOTPRINT_ROWS = [
  "................................###.........",
  "...........................#########........",
  ".....................###############........",
  "..............#######################.......",
  "........#############################.......",
  "..####################################......",
  "#########################################...",
  "########################################....",
  ".#######################################....",
  "..######################################....",
  "...###############################...##.....",
  "....##############################....#.....",
  "....##############################....##....",
  ".....########################.........#####.",
  "....###################................####.",
  "..##################.....#####.........####.",
  ".##############################........#..#.",
  ".################################.######..#.",
  ".##########################################.",
  ".##########################################.",
  "..#########################################.",
  "...########################################.",
  "...########################################.",
  "....#####################################...",
  "....#####################################...",
  "....##################################......",
  ".....################################.......",
  ".....################################.......",
  ".....###############################........",
  "......##############################........",
  "......##########.##################.........",
  "......#####......##################.........",
  ".......##..........#################........",
  ".......#...........##...############........",
  ".....###................###########.........",
  "...######.............###########...........",
  "...######..........#########..##............",
  "...######.......##########..................",
  "........#.......########....................",
  ".................#####......................",
  "............................................",
];
// GROUND: first air course per cell (rock fills y < g); '.' = no ground value in that cell.
const GROUND_ROWS = [
  ". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 2 2 2 1 1 0 . . . . . . . .",
  ". . . . . . . . . . . . . . . . . . . . . . . . . 7 7 7 7 7 7 7 7 6 6 4 . . . . . . . .",
  ". . . . . . . . . . . . . . . . . . . 6 6 6 6 6 6 7 7 7 7 7 7 7 7 6 6 4 2 . . . . . . .",
  ". . . . . . . . . . . . 22 22 25 25 25 22 22 17 12 12 12 12 12 13 13 13 13 13 14 14 14 14 14 11 7 . . . . . . .",
  ". . . . . . 12 12 15 17 17 19 22 22 25 25 25 22 22 17 12 12 12 12 12 13 13 13 13 13 14 14 14 14 14 11 7 . . . . . . .",
  "7 2 9 16 16 9 33 33 37 37 38 39 40 40 41 41 38 31 25 25 20 20 18 18 18 18 19 19 19 19 20 21 21 21 14 18 13 13 3 3 3 . . .",
  "7 7 9 16 16 26 33 33 37 38 38 39 40 41 41 41 38 31 31 25 20 20 18 18 18 19 19 19 19 19 20 21 21 21 21 18 13 13 6 3 3 . . .",
  "7 7 9 16 16 26 33 33 37 38 39 39 40 41 41 41 38 31 31 25 20 20 18 18 18 19 19 19 19 19 20 21 21 21 21 18 13 13 6 3 3 . . .",
  "12 12 13 21 21 30 38 38 42 42 42 42 42 42 42 42 41 38 38 33 27 27 24 24 24 25 25 25 25 25 26 27 27 27 27 23 17 17 11 5 . . . .",
  "12 . 13 21 21 30 38 38 42 42 42 42 42 42 42 42 41 38 38 33 27 24 24 24 24 25 25 25 25 25 26 27 27 27 27 23 17 17 11 5 . . . .",
  ". . . 21 18 30 38 38 42 42 42 42 42 42 42 42 41 39 39 37 34 34 30 30 30 31 31 31 31 31 32 32 32 32 27 . . 19 14 8 . . . .",
  ". . . 18 18 26 36 36 42 42 42 42 42 42 42 42 41 39 39 37 34 34 30 30 30 31 31 31 31 31 32 32 32 32 . . . 14 14 8 . . . .",
  ". . . . 23 28 36 36 42 42 42 42 42 42 42 42 41 39 39 37 35 35 34 33 33 33 33 33 33 33 33 34 34 34 . . . . 17 14 . 6 6 .",
  ". . . . 23 28 35 35 41 42 42 42 42 42 41 41 40 38 38 36 35 34 34 33 33 33 33 33 33 33 33 . . . . . . . 17 14 14 10 6 .",
  ". . . 32 32 35 38 38 42 42 42 42 42 42 41 41 40 38 38 36 35 35 34 33 33 33 33 . . . . . . . . . . . 18 16 16 12 7 .",
  ". 23 28 32 32 35 38 38 42 42 42 42 42 42 41 41 39 38 38 36 34 . 33 33 33 33 31 31 31 31 32 32 . . . . . . 18 16 16 12 7 7",
  "23 30 37 32 32 42 42 38 42 42 42 42 42 42 41 41 39 38 38 36 34 34 33 33 33 33 31 31 31 31 32 32 . . . . . . . 16 16 12 8 8",
  "30 30 37 40 40 42 42 42 43 43 42 42 42 42 41 41 40 38 38 36 35 33 33 33 33 32 31 31 29 28 28 29 29 28 28 25 21 21 18 17 17 13 8 8",
  ". 30 37 40 40 42 42 42 43 43 42 42 42 42 41 41 40 38 38 36 35 35 33 33 33 32 31 29 29 28 28 29 29 28 28 25 21 21 18 17 17 13 8 8",
  ". 42 43 43 43 43 43 43 43 43 43 43 43 43 41 41 40 38 38 37 35 35 33 32 32 32 31 29 29 28 28 26 25 28 28 23 20 21 19 17 17 14 8 8",
  ". 42 43 43 43 43 43 43 43 43 43 43 43 43 41 41 40 38 38 37 35 35 33 32 32 32 31 29 29 27 26 26 25 24 24 23 20 20 19 17 17 14 8 .",
  ". . 43 43 43 43 43 43 43 43 43 43 43 43 41 41 40 38 38 37 35 33 33 32 32 32 31 30 29 27 26 26 25 24 24 23 20 20 19 18 18 15 11 .",
  ". . . 43 43 43 43 43 43 43 43 43 43 43 41 41 39 38 38 37 35 35 33 32 32 31 30 29 29 27 25 25 23 22 22 21 20 20 19 18 18 15 11 .",
  ". . . 43 43 43 43 43 43 43 43 43 43 43 41 41 39 38 38 37 35 35 34 32 32 31 30 29 29 27 25 25 23 22 22 21 20 20 19 18 18 15 . .",
  ". . . . 43 43 43 43 43 43 43 43 43 43 41 41 38 37 37 36 35 35 34 32 31 31 30 29 29 27 25 25 23 22 22 21 19 19 18 17 17 13 . .",
  ". . . . 43 43 43 43 43 43 43 43 43 43 41 41 38 37 37 36 35 34 34 32 32 31 30 30 29 27 25 25 24 22 22 21 19 19 . . 17 13 . .",
  ". . . . 43 43 43 43 43 43 43 43 43 43 41 41 38 36 36 35 34 34 33 32 32 30 29 28 28 27 25 25 24 22 22 20 18 18 . . . . . .",
  ". . . . 43 43 43 43 43 43 43 43 43 43 41 41 38 36 36 35 34 34 33 32 32 30 29 28 28 27 25 25 24 22 22 20 18 . . . . . . .",
  ". . . . . 43 43 43 44 44 44 43 43 43 41 41 38 35 35 33 32 32 32 31 30 30 29 28 28 27 24 24 21 19 19 17 16 . . . . . . .",
  ". . . . . 43 43 43 44 44 44 43 43 43 41 41 38 35 35 33 32 32 32 31 31 30 29 29 28 27 24 24 21 19 19 17 . . . . . . . .",
  ". . . . . . 43 43 44 44 44 43 43 43 41 41 38 35 35 33 32 32 32 31 31 30 29 28 28 27 24 24 21 19 17 17 . . . . . . . .",
  ". . . . . . 43 43 44 44 43 43 41 41 . 39 . 35 35 33 32 32 31 30 30 29 28 26 26 23 19 19 16 14 14 13 . . . . . . . .",
  ". . . . . . 43 43 44 44 . . . . . . . . . 33 32 32 31 30 29 29 28 26 26 23 19 19 16 14 14 13 6 . . . . . . .",
  ". . . . . . . 42 . . . . . . . . . . . 33 31 30 30 . 27 27 24 24 21 17 14 14 11 9 9 8 6 . . . . . . .",
  ". . . . 33 43 43 42 42 . . . . . . . . . . 33 . . . . 27 27 24 21 21 17 14 14 11 9 9 . . . . . . . . .",
  ". . 34 34 33 32 32 31 32 . . . . . . . . . . . . 26 26 24 24 22 19 15 15 12 10 10 7 4 . . . . . . . . . .",
  ". . 34 34 33 32 32 31 32 . . . . . . . 34 31 31 29 28 28 26 24 22 22 19 15 15 . 10 10 7 . . . . . . . . . . .",
  ". . . 20 13 13 14 14 15 15 . . . . . . 23 23 23 22 21 21 18 16 13 13 11 . . . . . . . . . . . . . . . . .",
  ". . . 13 13 . . 14 15 15 . . . . . . 23 23 23 22 21 21 18 16 16 . . . . . . . . . . . . . . . . . . .",
  ". . . . . . . . . . . . . . . . 13 23 23 22 13 13 18 . . . . . . . . . . . . . . . . . . . . .",
  ". . . . . . . . . . . . . . . . 11 13 13 . . 13 . . . . . . . . . . . . . . . . . . . . . .",
];
const GROUND = GROUND_ROWS.map((row) => row.trim().split(/\s+/).map((v) => (v === "." ? null : Number(v))));

/** True if the block column (x, z) is inside the footprint's `#` cells and inside the plot. */
export function onFootprint(x, z) {
  if (x < 0 || z < 0 || x >= GRID[0] || z >= GRID[2]) return false;
  return FOOTPRINT_ROWS[Math.floor(z / MAP_CELL)]?.[Math.floor(x / MAP_CELL)] === "#";
}

/** The ground value g of the block column (x, z) (rock fills y < g), or null where the map has no value ('.'). */
export function groundTop(x, z) {
  if (x < 0 || z < 0 || x >= GRID[0] || z >= GRID[2]) return null;
  return GROUND[Math.floor(z / MAP_CELL)]?.[Math.floor(x / MAP_CELL)] ?? null;
}

// ---- seeded random ----
/** A seeded random function: rng(seed)() returns a float in [0, 1), the same sequence for the same seed. */
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

// ---- palette (palette.json ids only; one constant per id) ----
// Wall: STONE_BRICKS, STONE_BRICK_STAIRS, STONE_BRICK_SLAB, STONE_BRICK_WALL (granite body, string courses, tracery).
export const STONE_BRICKS = "stone_bricks";
export const STONE_BRICK_STAIRS = "stone_brick_stairs";
export const STONE_BRICK_SLAB = "stone_brick_slab";
export const STONE_BRICK_WALL = "stone_brick_wall";
// Weathering: CRACKED_STONE_BRICKS, MOSSY_STONE_BRICKS (low courses, at most 1 in 10).
export const CRACKED_STONE_BRICKS = "cracked_stone_bricks";
export const MOSSY_STONE_BRICKS = "mossy_stone_bricks";
// Accents: ANDESITE, TUFF, TUFF_BRICKS (at most 1 in 10).
export const ANDESITE = "andesite";
export const TUFF = "tuff";
export const TUFF_BRICKS = "tuff_bricks";
// Plinth and rock footing: COBBLESTONE, MOSSY_COBBLESTONE, STONE (the rock fill itself is STONE).
export const COBBLESTONE = "cobblestone";
export const MOSSY_COBBLESTONE = "mossy_cobblestone";
export const STONE = "stone";
// Trim (quoins, entablature): CHISELED_STONE_BRICKS, POLISHED_ANDESITE, POLISHED_ANDESITE_STAIRS, POLISHED_ANDESITE_SLAB.
export const CHISELED_STONE_BRICKS = "chiseled_stone_bricks";
export const POLISHED_ANDESITE = "polished_andesite";
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";
// Roofs: DEEPSLATE_TILES, DEEPSLATE_TILE_STAIRS, DEEPSLATE_TILE_SLAB, DEEPSLATE_TILE_WALL, COBBLED_DEEPSLATE, CRACKED_DEEPSLATE_TILES.
export const DEEPSLATE_TILES = "deepslate_tiles";
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";
export const DEEPSLATE_TILE_WALL = "deepslate_tile_wall";
export const COBBLED_DEEPSLATE = "cobbled_deepslate";
export const CRACKED_DEEPSLATE_TILES = "cracked_deepslate_tiles";
// Spire: POLISHED_DEEPSLATE, POLISHED_BLACKSTONE_WALL, POLISHED_DEEPSLATE_WALL (body, ribs, pinnacles).
export const POLISHED_DEEPSLATE = "polished_deepslate";
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";
export const POLISHED_DEEPSLATE_WALL = "polished_deepslate_wall";
// Archangel: GOLD_BLOCK, LIGHTNING_ROD, LIGHT_WEIGHTED_PRESSURE_PLATE, BLACKSTONE, BLACKSTONE_SLAB.
export const GOLD_BLOCK = "gold_block";
export const LIGHTNING_ROD = "lightning_rod";
export const LIGHT_WEIGHTED_PRESSURE_PLATE = "light_weighted_pressure_plate";
export const BLACKSTONE = "blackstone";
export const BLACKSTONE_SLAB = "blackstone_slab";
// Glass: GRAY_STAINED_GLASS_PANE (church, Merveille), LIGHT_GRAY_STAINED_GLASS_PANE (logis).
export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";
export const LIGHT_GRAY_STAINED_GLASS_PANE = "light_gray_stained_glass_pane";
// Louvres and doors: DARK_OAK_TRAPDOOR, DARK_OAK_DOOR.
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";
export const DARK_OAK_DOOR = "dark_oak_door";
// Cloister: QUARTZ_PILLAR (columns on the polished andesite stylobate).
export const QUARTZ_PILLAR = "quartz_pillar";
// Garth and paving: GRASS_BLOCK (garth), GRAVEL (terraces and courts).
export const GRASS_BLOCK = "grass_block";
export const GRAVEL = "gravel";
// Light: LANTERN, SHROOMLIGHT (hidden behind glass inside the choir and refectory).
export const LANTERN = "lantern";
export const SHROOMLIGHT = "shroomlight";
// Chimneys: CAMPFIRE (fire at the bottom), HAY_BLOCK (the flue's top).
export const CAMPFIRE = "campfire";
export const HAY_BLOCK = "hay_block";
// Interior (objects): OAK_PLANKS, SPRUCE_PLANKS, BARREL, BOOKSHELF, CANDLE, IRON_BARS, RED_CARPET.
export const OAK_PLANKS = "oak_planks";
export const SPRUCE_PLANKS = "spruce_planks";
export const BARREL = "barrel";
export const BOOKSHELF = "bookshelf";
export const CANDLE = "candle";
export const IRON_BARS = "iron_bars";
export const RED_CARPET = "red_carpet";
