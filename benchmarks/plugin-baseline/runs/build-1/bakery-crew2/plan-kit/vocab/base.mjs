// Constants for the Bäckerei build: palette ids (palette.json, one per export), plan.md's site coordinates, and a
// seeded rng. Coordinates are inclusive corner-origin cells (x east, y up, z south; the front faces north, -z).

// ---- palette: every id in palette.json, named (the role(s) it is used for follow the comment) ----------------------
export const BARREL = "barrel"; // object
export const BLAST_FURNACE = "blast_furnace"; // object
export const BOOKSHELF = "bookshelf"; // object
export const BRICK_SLAB = "brick_slab"; // oven
export const BRICK_STAIRS = "brick_stairs"; // oven
export const BRICK_WALL = "brick_wall"; // oven
export const BRICKS = "bricks"; // oven
export const BROWN_CARPET = "brown_carpet"; // object
export const BROWN_WOOL = "brown_wool"; // object
export const CAKE = "cake"; // object
export const CAMPFIRE = "campfire"; // object
export const CANDLE = "candle"; // object
export const CANDLE_CAKE = "candle_cake"; // object
export const CAULDRON = "cauldron"; // object
export const CHEST = "chest"; // object
export const CHISELED_BOOKSHELF = "chiseled_bookshelf"; // object
export const COARSE_DIRT = "coarse_dirt"; // yard
export const COBBLED_DEEPSLATE = "cobbled_deepslate"; // wing_walls, roof, street
export const COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab"; // wing_walls
export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs"; // wing_walls
export const COBBLED_DEEPSLATE_WALL = "cobbled_deepslate_wall"; // wing_walls
export const COBBLESTONE = "cobblestone"; // street
export const COMPOSTER = "composter"; // object
export const CRAFTING_TABLE = "crafting_table"; // object
export const DECORATED_POT = "decorated_pot"; // object
export const DEEPSLATE_BRICK_SLAB = "deepslate_brick_slab"; // ground_walls, roof, roof_ridge, chimney_band
export const DEEPSLATE_BRICK_STAIRS = "deepslate_brick_stairs"; // ground_walls, roof
export const DEEPSLATE_BRICK_WALL = "deepslate_brick_wall"; // ground_walls
export const DEEPSLATE_BRICKS = "deepslate_bricks"; // ground_walls, roof, roof_ridge, chimney_band
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // roof
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // roof
export const DEEPSLATE_TILES = "deepslate_tiles"; // roof
export const DIRT_PATH = "dirt_path"; // yard
export const FARMLAND = "farmland"; // yard
export const FLOWER_POT = "flower_pot"; // shutters_and_flower_boxes
export const FURNACE = "furnace"; // object
export const GLASS_PANE = "glass_pane"; // glass
export const GRASS_BLOCK = "grass_block"; // yard
export const GRAVEL = "gravel"; // street
export const GRINDSTONE = "grindstone"; // object
export const HAY_BLOCK = "hay_block"; // object
export const IRON_CHAIN = "iron_chain"; // object
export const LADDER = "ladder"; // object
export const LANTERN = "lantern"; // object
export const LECTERN = "lectern"; // object
export const LOOM = "loom"; // object
export const MOSSY_COBBLESTONE = "mossy_cobblestone"; // street
export const PODZOL = "podzol"; // yard
export const POLISHED_BLACKSTONE_BRICK_SLAB = "polished_blackstone_brick_slab"; // roof_eave
export const POLISHED_BLACKSTONE_BRICK_STAIRS = "polished_blackstone_brick_stairs"; // roof_eave
export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks"; // roof_eave
export const POLISHED_DEEPSLATE = "polished_deepslate"; // plinth, roof
export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab"; // plinth
export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs"; // plinth
export const POTTED_POPPY = "potted_poppy"; // object
export const POTTED_RED_TULIP = "potted_red_tulip"; // shutters_and_flower_boxes
export const RED_BED = "red_bed"; // object
export const RED_CARPET = "red_carpet"; // object
export const RED_WOOL = "red_wool"; // object
export const SMOKER = "smoker"; // object
export const SPRUCE_DOOR = "spruce_door"; // object
export const SPRUCE_FENCE = "spruce_fence"; // frame, yard_enclosure
export const SPRUCE_FENCE_GATE = "spruce_fence_gate"; // yard_enclosure
export const SPRUCE_HANGING_SIGN = "spruce_hanging_sign"; // object
export const SPRUCE_LEAVES = "spruce_leaves"; // yard
export const SPRUCE_LOG = "spruce_log"; // yard
export const SPRUCE_PLANKS = "spruce_planks"; // frame, verge_floor
export const SPRUCE_SLAB = "spruce_slab"; // frame, roof_eave, verge_floor, shutters_and_flower_boxes
export const SPRUCE_STAIRS = "spruce_stairs"; // frame, roof_eave, verge_floor
export const SPRUCE_TRAPDOOR = "spruce_trapdoor"; // shutters_and_flower_boxes
export const SPRUCE_WALL_SIGN = "spruce_wall_sign"; // object
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log"; // frame
export const STRIPPED_SPRUCE_WOOD = "stripped_spruce_wood"; // frame
export const WATER_CAULDRON = "water_cauldron"; // object
export const WHEAT = "wheat"; // yard
export const WHITE_BED = "white_bed"; // object
export const WHITE_CANDLE = "white_candle"; // object
export const WHITE_CARPET = "white_carpet"; // object
export const WHITE_WOOL = "white_wool"; // daub

// ---- site (plan.md SITE): lot x 0..23, z 0..31, height to y=24; the grid is 24 x 25 x 32 ----------------------------
export const SITE = { size: [24, 25, 32], lot: { x0: 0, z0: 0, x1: 23, z1: 31 } };   // the grid and the lot it sits on
export const STREET_Z = 2;               // last gravel row of the street lane (z 0..2); kerb of cobbled_deepslate at z=3
export const SIDEWALK = { z0: 4, z1: 7 };  // cobblestone sidewalk rows in front of the building
export const GROUND_Y = 0;               // the grass ground block; street, kerb and sidewalk sit on it
export const FLOOR_Y = 1;                // ground-storey floor block and the plinth course; walk y = 2 inside
export const UPPER_FLOOR_Y = 6;          // upper-storey floor and the jetty sill course; walk y = 7
export const ATTIC_FLOOR_Y = 11;         // attic floor (flour loft); walk y = 12
export const EAVE_Y = 10;                // head of the upper walls (head plate); the main roof starts at ROOF_Y
export const ROOF_Y = 11;                // eave course of the main roof (wall top + 1)
export const RIDGE_Y = 21;               // main roof ridge along z at x=11
export const WING_ROOF_Y = 6;            // eave course of the wing roof (ridge along z at x=19, y=8)
export const CHIMNEY_TOP_Y = 17;         // top course of the chimney; the smoking campfire sits at (19,17,24)
export const MAIN = { x0: 6, x1: 16, z0: 9, z1: 22 };      // main body ground storey footprint (plinth to z=9)
export const JETTY_Z = 8;                // front plane of the upper storey (projects 1 north over the shop front)
export const FRONT_DOOR = { x: 11, y0: 2, y1: 3, z: 9 };   // front door cells (step at (11,1,8))
export const WING = { x0: 17, x1: 21, z0: 13, z1: 22 };    // bakehouse wing (single storey, gable to the street)
export const OVEN = { x0: 17, x1: 21, z0: 23, z1: 26 };    // bread oven footprint (projects south of the wing)
export const OVEN_CHAMBER = { x0: 18, x1: 20, z0: 23, z1: 25, y0: 2, y1: 3 };   // inside air of the oven
export const OVEN_MOUTH = { x0: 19, x1: 19, z0: 22, z1: 22, y0: 2, y1: 3 };     // opening from the wing into the oven
export const CHIMNEY = { x0: 19, x1: 20, z0: 24, z1: 25, y0: 4, y1: 17 };       // chimney stack; flue (19,4..16,24) is air
export const HOIST = { x: 11, y: 19, z0: 5, z1: 8 };       // hoist beam (stripped_spruce_log axis z), chain and barrel below
export const LOFT_DOOR = { x: 11, y0: 15, y1: 16, z: 8 };  // open loft door in the front gable (air)
export const STAIR_HOLE = { x0: 7, x1: 8, y: 6, z0: 14, z1: 17 };    // stairwell hole in the upper floor
export const ATTIC_HOLE = { x0: 8, x1: 9, y: 11, z0: 19, z1: 20 };   // attic ladder hole in the flour loft floor

// ---- the six rooms' inner air boxes [x0,y0,z0,x1,y1,z1] (rooms.json; each room's designer fills its box) --------------
export const ROOM_BOX = {
  shop: [7, 2, 10, 15, 5, 15],           // Verkaufsraum, the sales floor behind the shop windows
  backstube: [7, 2, 17, 15, 5, 21],      // prep and proofing room; stairs up start in its SW corner
  bakehouse: [18, 2, 14, 20, 7, 21],     // single-storey wing open to the rafters; oven mouth on its south wall
  stube: [7, 7, 9, 15, 10, 13],          // living room over the street
  schlafkammer: [9, 7, 15, 15, 10, 21],  // bedroom at the back
  mehlboden: [9, 12, 9, 13, 16, 21],     // flour loft under the slate roof
};

// ---- rng: a seeded, deterministic [0,1) generator (mulberry32), so a rebuild is byte-identical ---------------------
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
