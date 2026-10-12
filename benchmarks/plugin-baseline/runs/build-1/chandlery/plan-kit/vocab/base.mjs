// Base kit: the palette as constants (palette.json's ids only), plan.md's site coordinates, and a seeded rng.
// Every block id here is a palette.json id; the ranges are inclusive, as in plan.md.

// wall: ground-storey walls and the chimneys' body
/** Red brick wall body (role wall). */
export const BRICKS = "bricks";
/** Brick stairs (role wall). */
export const BRICK_STAIRS = "brick_stairs";
/** Brick slab (role wall, also the chimney cap). */
export const BRICK_SLAB = "brick_slab";
/** Brick wall (role wall). */
export const BRICK_WALL = "brick_wall";

// plinth: stone plinth, quoins, sills, steps
/** Stone brick (role plinth). */
export const STONE_BRICKS = "stone_bricks";
/** Mossy stone brick, about 1 in 8 near the ground and corners (role plinth). */
export const MOSSY_STONE_BRICKS = "mossy_stone_bricks";
/** Stone brick stairs for steps (role plinth). */
export const STONE_BRICK_STAIRS = "stone_brick_stairs";
/** Stone brick slab (role plinth). */
export const STONE_BRICK_SLAB = "stone_brick_slab";
/** Stone brick wall (role plinth). */
export const STONE_BRICK_WALL = "stone_brick_wall";

// frame: posts, beams, braces, jetty brackets, daub
/** Stripped dark oak log, axis y, for posts (role frame). */
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";
/** Stripped dark oak wood, axis x or z, for beams (role frame). */
export const STRIPPED_DARK_OAK_WOOD = "stripped_dark_oak_wood";
/** Dark oak stairs for braces, brackets and the stair (role frame). */
export const DARK_OAK_STAIRS = "dark_oak_stairs";
/** Calcite daub infill (role frame). */
export const CALCITE = "calcite";

// trim: shopfront, signs, doors, shutters, glass
/** Dark oak planks (role trim, also the upstairs floor). */
export const DARK_OAK_PLANKS = "dark_oak_planks";
/** Dark oak slab (role trim). */
export const DARK_OAK_SLAB = "dark_oak_slab";
/** Dark oak fence (role trim, sign arm and candle racks). */
export const DARK_OAK_FENCE = "dark_oak_fence";
/** Dark oak trapdoor (role trim, lean-to shelves). */
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";
/** Dark oak wall sign (role trim). */
export const DARK_OAK_WALL_SIGN = "dark_oak_wall_sign";
/** Dark oak hanging sign (role trim). */
export const DARK_OAK_HANGING_SIGN = "dark_oak_hanging_sign";
/** Dark oak door (role trim). */
export const DARK_OAK_DOOR = "dark_oak_door";
/** Spruce door, the workshop side door (role trim). */
export const SPRUCE_DOOR = "spruce_door";
/** Spruce trapdoor, the open shutters (role trim). */
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
/** Glass pane, windows (role trim). */
export const GLASS_PANE = "glass_pane";

// roof: slate palette (renders tuff-grey) and its stairs and slabs
/** Cobbled deepslate, slate roof (role roof). */
export const COBBLED_DEEPSLATE = "cobbled_deepslate";
/** Deepslate tiles, slate roof (role roof). */
export const DEEPSLATE_TILES = "deepslate_tiles";
/** Polished deepslate, slate roof (role roof). */
export const POLISHED_DEEPSLATE = "polished_deepslate";
/** Cobbled deepslate stairs (role roof). */
export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs";
/** Cobbled deepslate slab (role roof). */
export const COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab";
/** Deepslate tile stairs (role roof). */
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";
/** Deepslate tile slab (role roof). */
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";
/** Polished deepslate stairs (role roof). */
export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs";
/** Polished deepslate slab (role roof). */
export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";
/** Tuff brick stairs, the slate eave course (role roof). */
export const TUFF_BRICK_STAIRS = "tuff_brick_stairs";
/** Tuff brick slab, the slate eave course (role roof). */
export const TUFF_BRICK_SLAB = "tuff_brick_slab";

// chimney: stacks, bands, fireboxes
/** Deepslate bricks, the chimney band (role chimney). */
export const DEEPSLATE_BRICKS = "deepslate_bricks";
/** Campfire, the lit fireboxes (role chimney). */
export const CAMPFIRE = "campfire";
/** Hay bale under the signal fire (role chimney). */
export const HAY_BLOCK = "hay_block";

// ground: street, kerb, pavement, yard paths
/** Cobblestone, the street (role ground). */
export const COBBLESTONE = "cobblestone";
/** Gravel patches in the street (role ground). */
export const GRAVEL = "gravel";
/** Polished andesite, the pavement (role ground). */
export const POLISHED_ANDESITE = "polished_andesite";
/** Grass block, the lot's ground (role ground). */
export const GRASS_BLOCK = "grass_block";
/** Coarse dirt, beds and patches (role ground). */
export const COARSE_DIRT = "coarse_dirt";
/** Podzol, patches by the fences and hives (role ground). */
export const PODZOL = "podzol";
/** Dirt path, the passage and yard paths (role ground). */
export const DIRT_PATH = "dirt_path";

// yard: fences, hives, tree, woodpile, barrels, flowers
/** Spruce fence (role yard). */
export const SPRUCE_FENCE = "spruce_fence";
/** Spruce fence gate (role yard). */
export const SPRUCE_FENCE_GATE = "spruce_fence_gate";
/** Spruce log, the woodpile (role yard). */
export const SPRUCE_LOG = "spruce_log";
/** Spruce slab, the woodpile lid (role yard). */
export const SPRUCE_SLAB = "spruce_slab";
/** Barrel (role yard). */
export const BARREL = "barrel";
/** Cauldron, the dipping vats and the tallow pot (role yard). */
export const CAULDRON = "cauldron";
/** Water cauldron (role yard). */
export const WATER_CAULDRON = "water_cauldron";
/** Beehive (role yard). */
export const BEEHIVE = "beehive";
/** Oak log, the apple tree trunk (role yard). */
export const OAK_LOG = "oak_log";
/** Persistent oak leaves, the apple tree crown (role yard). */
export const OAK_LEAVES = "oak_leaves";
/** Sweet berry bush, the herb strip (role yard). */
export const SWEET_BERRY_BUSH = "sweet_berry_bush";
/** Dandelion, the bee flower bed (role yard). */
export const DANDELION = "dandelion";
/** Poppy, the bee flower bed (role yard). */
export const POPPY = "poppy";
/** Cornflower, the bee flower bed (role yard). */
export const CORNFLOWER = "cornflower";
/** Oxeye daisy, the bee flower bed and by the hives (role yard). */
export const OXEYE_DAISY = "oxeye_daisy";
/** Allium, the bee flower bed (role yard). */
export const ALLIUM = "allium";

// light: candles, lanterns, honeycomb accents, chains
/** Candle (role light). */
export const CANDLE = "candle";
/** White candle, drying racks (role light). */
export const WHITE_CANDLE = "white_candle";
/** Yellow candle (role light). */
export const YELLOW_CANDLE = "yellow_candle";
/** Honeycomb block, shop shelf accents only (role light). */
export const HONEYCOMB_BLOCK = "honeycomb_block";
/** Lantern (role light). */
export const LANTERN = "lantern";
/** Iron chain, the dipping wheel arms (role light). */
export const IRON_CHAIN = "iron_chain";

// objects: interior furniture and floors (rooms)
/** Spruce planks, the shop floor (object). */
export const SPRUCE_PLANKS = "spruce_planks";
/** Oak planks, the family hall floor (object). */
export const OAK_PLANKS = "oak_planks";
/** White carpet, rugs (object). */
export const WHITE_CARPET = "white_carpet";
/** White bed (object). */
export const WHITE_BED = "white_bed";
/** Red bed (object). */
export const RED_BED = "red_bed";
/** Bookshelf (object). */
export const BOOKSHELF = "bookshelf";
/** Lectern (object). */
export const LECTERN = "lectern";
/** Grindstone (object). */
export const GRINDSTONE = "grindstone";
/** Smoker (object). */
export const SMOKER = "smoker";
/** Furnace (object). */
export const FURNACE = "furnace";
/** Flower pot (object). */
export const FLOWER_POT = "flower_pot";
/** Potted poppy, window boxes (object). */
export const POTTED_POPPY = "potted_poppy";
/** Potted dandelion, window boxes (object). */
export const POTTED_DANDELION = "potted_dandelion";
/** Decorated pot (object). */
export const DECORATED_POT = "decorated_pot";
/** Chest (object). */
export const CHEST = "chest";
/** Crafting table (object). */
export const CRAFTING_TABLE = "crafting_table";

// Site (plan.md SITE, FLOORS, OPENINGS, RESERVED). Ground blocks sit at y=0; players stand at y=1 outdoors.
/** Lot size in blocks: x 0..25, y 0..22, z 0..33. */
export const SITE_SIZE = [26, 23, 34];
/** The ground layer's y. */
export const GROUND_Y = 0;
/** Ground-storey interior floor block y (players stand at y=2). */
export const FLOOR_Y = 1;
/** Upstairs floor block y (players stand at y=7). */
export const UPPER_FLOOR_Y = 6;
/** Street rows: cobblestone z 0..3, kerb z=4, pavement z 5..7. */
export const STREET = { x0: 0, x1: 25, z0: 0, z1: 3 };
/** Main house ground storey (the shop, hall and kitchen). */
export const MAIN_GROUND = { x0: 5, x1: 17, y0: 1, y1: 5, z0: 8, z1: 17 };
/** Shop bay window, projecting one north of the ground wall at z=7. */
export const BAY = { x0: 9, x1: 13, y0: 1, y1: 5, z: 7 };
/** Main house upper storey, jettied to z=7. */
export const MAIN_UPPER = { x0: 5, x1: 17, y0: 6, y1: 10, z0: 7, z1: 17 };
/** Main roof box: eaves z=6 and z=18 at y=11, ridge y=16 along x at z=12. */
export const MAIN_ROOF = { x0: 4, x1: 18, y0: 11, y1: 16, z0: 6, z1: 18 };
/** Workshop: single storey, open to the rafters. */
export const WORKSHOP = { x0: 5, x1: 13, y0: 1, y1: 5, z0: 18, z1: 27 };
/** Workshop roof box: ridge y=10 along z at x=9. */
export const WORKSHOP_ROOF = { x0: 4, x1: 14, y0: 6, y1: 10, z0: 18, z1: 28 };
/** East chimney stack (the house hearth), z 11..12, through the east gable. */
export const EAST_STACK = { x0: 18, x1: 19, y0: 1, y1: 19, z0: 11, z1: 12 };
/** Workshop chimney stack (the rendering hearth), x 8..9, through the south gable. */
export const WORKSHOP_STACK = { x0: 8, x1: 9, y0: 1, y1: 13, z0: 28, z1: 29 };
/** Drying lean-to, open on the east and south. */
export const LEAN_TO = { x0: 15, x1: 18, y0: 1, y1: 5, z0: 18, z1: 24 };
/** Woodpile (hearth fuel), x 10..12, z 29..30. */
export const WOODPILE = { x0: 10, x1: 12, y0: 1, y1: 2, z0: 29, z1: 30 };
/** Beehive x positions (y=1, z=31) and the apple tree at (3,1,22). */
export const BEEHIVE_XS = [15, 17, 19, 21];
export const APPLE_TREE = { x: 3, y: 1, z: 22 };

// Doors and openings (1 wide, 2 high, y=2..3 for the lower half).
/** Shop door, north wall; its step at (7,1,7). */
export const SHOP_DOOR = { x: 7, y: 2, z: 8 };
/** Family door, north wall; its step at (15,1,7). */
export const FAMILY_DOOR = { x: 15, y: 2, z: 8 };
/** Back door, south wall into the lean-to. */
export const BACK_DOOR = { x: 16, y: 2, z: 17 };
/** Open doorway from the shop into the workshop (no door). */
export const SHOP_TO_WORKSHOP = { x: 10, y: 2, z: 17 };
/** Workshop side door, east wall, into the lean-to. */
export const WORKSHOP_SIDE_DOOR = { x: 13, y: 2, z: 21 };
/** Partition opening between the shop and the family hall (no door). */
export const PARTITION_OPENING = { x: 12, y: 2, z: 10 };
/** The stair from the family hall to the upstairs floor: x=16, z 13..16, rising north. */
export const MAIN_STAIR = { x: 16, z0: 13, z1: 16 };

// Room boxes (inclusive, [x0, y0, z0, x1, y1, z1]), from rooms.json.
export const ROOM_BOX = {
  shop: [6, 2, 9, 11, 5, 16],
  familyHall: [13, 2, 9, 16, 5, 16],
  workshop: [6, 2, 18, 12, 5, 26],
  leanTo: [15, 1, 18, 18, 3, 24],
  parlour: [6, 7, 8, 16, 10, 12],
  westBedchamber: [6, 7, 14, 10, 10, 16],
  eastBedchamber: [12, 7, 14, 14, 10, 16],
};

/** Seeded random generator (mulberry32): rng(seed)() gives a float in [0, 1). The same seed gives the same build. */
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
