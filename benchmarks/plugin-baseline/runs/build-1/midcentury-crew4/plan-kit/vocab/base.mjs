// Shared constants for every part: palette ids (palette.json only), plan.md site coordinates, and a seeded rng.
// Every export is documented on the line above it or after it.

// ---- grid and heights (plan.md: x 0..33 west→east, z 0..33 north→south, y = height) -----------------------------
/** Structure size: x 0..33, y 0..8 (chimney cap), z 0..33. */
export const GRID_SIZE = [34, 9, 34];
/** Bedding (dirt under the lot); cannot be stored in the grid, so the pool basin is dropped. */
export const BEDDING_Y = -1;
/** Ground top; sidewalk, sand and lawns sit here. */
export const GROUND_Y = 0;
/** House finished floor slab. */
export const FLOOR_Y = 1;
/** Standing height (first air cell above the floor). */
export const STANDING_Y = 2;
/** Top of the wall body; header course and beams sit here. */
export const HEADER_Y = 5;
/** Lower roof band and the raised ceiling vault over z=14..19. */
export const ROOF_LOW_Y = 6;
/** Ridge height (highest roof point). */
export const ROOF_HIGH_Y = 7;
/** Chimney cap (top of the fireplace stack). */
export const CHIMNEY_TOP_Y = 8;

// ---- structural rhythm ---------------------------------------------------------------------------------------------
/** Beam lines every 3 cells; every post, beam and beam end sits on one of these x values. */
export const BEAM_LINES = [10, 13, 16, 19, 22, 25, 28, 31];
/** Beam logs run along z between these two cells (exposed tails at 5 and 28). */
export const BEAM_Z = [5, 28];

// ---- site masses (inclusive x0..x1, z0..z1) ------------------------------------------------------------------------
/** The whole lot, bedding included. */
export const LOT = { x0: 0, x1: 33, z0: 0, z1: 33 };
/** Main house walls on the perimeter (floor y=1, walls y=1..5). */
export const HOUSE = { x0: 10, x1: 31, z0: 8, z1: 25 };
/** Main roof including overhangs (y=6..7). */
export const ROOF = { x0: 9, x1: 32, z0: 6, z1: 27 };
/** Atrium hole in the roof and open courtyard floor (y=1..). */
export const ATRIUM = { x0: 17, x1: 21, z0: 12, z1: 17 };
/** Carport under its flat deck at y=5. */
export const CARPORT = { x0: 0, x1: 9, z0: 7, z1: 21, deckY: 5 };
/** Freestanding fireplace and chimney cells. */
export const CHIMNEY = { x0: 20, x1: 21, z0: 21, z1: 22 };
/** Conversation pit (floor y=0, no slab at y=1). */
export const PIT = { x0: 13, x1: 17, z0: 20, z1: 23 };
/** Feature stone wall, freestanding 1-thick leaf at z=7. */
export const FEATURE_WALL = { x0: 11, x1: 17, z: 7, y0: 1, y1: 4 };
/** Driveway (smooth_stone), joint rows at z=4,8,12,16. */
export const DRIVEWAY = { x0: 1, x1: 8, z0: 1, z1: 21 };
/** Driveway joint rows (light_gray_concrete) at these z values. */
export const DRIVEWAY_JOINTS = [4, 8, 12, 16];
/** Entry landing under the eave (smooth_stone). */
export const LANDING = { x0: 18, x1: 20, z0: 6, z1: 7 };
/** Back patio under and behind the south eave. */
export const PATIO = { x0: 10, x1: 31, z0: 26, z1: 28 };
/** Pool deck around the kidney pool. */
export const POOL_DECK = { x0: 11, x1: 24, z0: 29, z1: 33 };
/** Car parked nose to the street (body y=1..2). */
export const CAR = { x0: 3, x1: 5, z0: 1, z1: 7 };
/** Mailbox post at the head of the driveway. */
export const MAILBOX = { x: 9, z: 1 };
/** Cactus bed on gravel (y=1..3). */
export const CACTUS_BED = { x0: 23, x1: 29, z0: 2, z1: 4 };
/** Palm base cells (trunk y=1..7 with a crown). */
export const PALMS = [[12, 3], [30, 4], [29, 31]];
/** Entry cell where the walker arrives (x,y,z). */
export const ENTRANCE = [19, 1, 7];
/** Front door cell (x=19, z=9, y=2..3), facing north. */
export const FRONT_DOOR = { x: 19, z: 9, y0: 2, y1: 3 };
/** Utility door from the carport into the kitchen (x=10, z=10, y=2..3). */
export const UTILITY_DOOR = { x: 10, z: 10, y0: 2, y1: 3 };
/** South sliders (2 wide, y=2..3, glass at y=4), by their first x. */
export const SLIDERS = [{ x0: 14, z: 25 }, { x0: 20, z: 25 }, { x0: 26, z: 25 }];
/** Atrium door pairs (2 wide, y=2..3): from the gallery at z=11 and to the living room at z=18. */
export const ATRIUM_DOORS = [{ x0: 19, z: 11 }, { x0: 19, z: 18 }];

// ---- kidney pool (reserved; ground and bedding left empty). Keyed by z: [x0, x1] runs. -----------------------------
/** Kidney pool cells by z, each row a list of inclusive [x0, x1] runs. */
export const POOL_CELLS = { 29: [[14, 17], [20, 21]], 30: [[13, 22]], 31: [[13, 22]], 32: [[14, 21]] };

// ---- room air boxes [x0,y0,z0,x1,y1,z1] (plan.md ROOMS; the interior designers fill these) ----------------------------
/** Room inner-air boxes by name, in the order of rooms.json. */
export const ROOM_BOXES = {
  gallery: [16, 2, 10, 22, 4, 10],
  kitchen: [11, 2, 9, 15, 4, 13],
  dining: [11, 2, 14, 15, 4, 18],
  living: [11, 2, 19, 21, 4, 24],
  atrium: [17, 1, 12, 21, 4, 17],
  corridor: [23, 2, 9, 24, 4, 21],
  "bedroom 1": [26, 2, 9, 30, 4, 12],
  "bath 1": [26, 2, 14, 27, 4, 16],
  "bath 2": [29, 2, 14, 30, 4, 16],
  "bedroom 2": [26, 2, 18, 30, 4, 20],
  "master bedroom": [23, 2, 22, 30, 4, 24],
};

// ---- palette: one constant per palette.json id -----------------------------------------------------------------
// Stucco, structure, header, fascia and base
/** Stucco body walls. */
export const WHITE_CONCRETE = "white_concrete";
/** Posts, beams, beam ends and mullions (structure). */
export const DARK_OAK_LOG = "dark_oak_log";
/** Mailbox post, patio table legs and garden lamp posts. */
export const DARK_OAK_FENCE = "dark_oak_fence";
/** Continuous header course under the eave. */
export const DARK_OAK_PLANKS = "dark_oak_planks";
/** Fascia and dark roof edge, and entry soffit. */
export const DARK_OAK_SLAB = "dark_oak_slab";
/** Base course, slab edge, paving, entry and roof-deck slab. */
export const SMOOTH_STONE = "smooth_stone";
/** Smooth stone slab (roof deck gravel; fireplace cap). */
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
/** Driveway joint rows. */
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";
/** Ledgestone feature wall. */
export const MUD_BRICKS = "mud_bricks";
/** Ledgestone flecks (about 25% of the feature wall). */
export const PACKED_MUD = "packed_mud";
/** Ledgestone cap. */
export const MUD_BRICK_SLAB = "mud_brick_slab";
/** Glass walls, clerestory, ring and car windows. */
export const GLASS_PANE = "glass_pane";
/** Front door (acacia, reads orange). */
export const ACACIA_DOOR = "acacia_door";
/** Utility door from the carport. */
export const DARK_OAK_DOOR = "dark_oak_door";
/** Door surround, transom and bold accent. */
export const ORANGE_CONCRETE = "orange_concrete";
/** Pool water. */
export const WATER = "water";
/** Pool liner. */
export const LIGHT_BLUE_CONCRETE = "light_blue_concrete";
/** Pool coping slab and lounger foot. */
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
/** Lounger head, patio chairs and pit steps. */
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";
/** Pit floor and bath floors. */
export const SMOOTH_QUARTZ = "smooth_quartz";
// Ground cover
/** Front yard and patio sand. */
export const SAND = "sand";
/** Gravel beds. */
export const GRAVEL = "gravel";
/** Back lawn. */
export const GRASS_BLOCK = "grass_block";
/** Bedding and atrium planting soil. */
export const DIRT = "dirt";
// Interior surfaces
/** Bedroom floors and the ceiling between beams. */
export const SPRUCE_PLANKS = "spruce_planks";
/** Wall panelling (open trapdoors against the wall). */
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
/** Panelling and stair-style trim. */
export const SPRUCE_STAIRS = "spruce_stairs";
/** Panelling, shelves and cabinet tops. */
export const SPRUCE_SLAB = "spruce_slab";
/** Panelling, table legs and bench posts. */
export const SPRUCE_FENCE = "spruce_fence";
/** Dark fireplace flue and car tyres. */
export const BLACK_CONCRETE = "black_concrete";
/** Lit campfire in the fireplace firebox. */
export const CAMPFIRE = "campfire";
/** Car lower body (saturated teal). */
export const CYAN_CONCRETE = "cyan_concrete";
/** Car chrome, bumpers and the kitchen fridge. */
export const IRON_BLOCK = "iron_block";
/** Iron trapdoors used as sofa backs and the egg chair shell. */
export const IRON_TRAPDOOR = "iron_trapdoor";
/** Bright light fixture (bath 1 ceiling light). */
export const SEA_LANTERN = "sea_lantern";
// Planting and garden
/** Desert cacti (saguaro and barrel cacti). */
export const CACTUS = "cactus";
/** Palm trunk and atrium sapling trunk. */
export const JUNGLE_LOG = "jungle_log";
/** Palm crown and atrium sapling leaves. */
export const JUNGLE_LEAVES = "jungle_leaves";
/** Dead bush on the sand. */
export const DEAD_BUSH = "dead_bush";
/** Short grass on the lawns. */
export const SHORT_GRASS = "short_grass";
/** Large ferns in the atrium. */
export const LARGE_FERN = "large_fern";
/** Hung lanterns and garden lamps (hanging=true for ceilings). */
export const LANTERN = "lantern";
// Furniture and objects
/** Birch slab tops (sideboard, bench, stools). */
export const BIRCH_SLAB = "birch_slab";
/** Gray concrete for the street, if used. */
export const GRAY_CONCRETE = "gray_concrete";
/** Car headlamps. */
export const YELLOW_CONCRETE = "yellow_concrete";
/** Car tail lamps. */
export const RED_CONCRETE = "red_concrete";
/** Potted cacti on sills and tables. */
export const POTTED_CACTUS = "potted_cactus";
/** Floor lamp top (end_rod on a fence). */
export const END_ROD = "end_rod";
/** Daylight detector (palette lighting option). */
export const DAYLIGHT_DETECTOR = "daylight_detector";
/** Orange carpets (seats, cushions, rugs). */
export const ORANGE_CARPET = "orange_carpet";
/** White carpets. */
export const WHITE_CARPET = "white_carpet";
/** Cyan carpets. */
export const CYAN_CARPET = "cyan_carpet";
/** Yellow carpets. */
export const YELLOW_CARPET = "yellow_carpet";
/** Orange upholstered seats (sofas, egg chair). */
export const SMOOTH_RED_SANDSTONE_STAIRS = "smooth_red_sandstone_stairs";
/** Quartz stairs (WC, benches). */
export const QUARTZ_STAIRS = "quartz_stairs";
/** Quartz slab (tables, counters). */
export const QUARTZ_SLAB = "quartz_slab";
/** Birch planks (chair seats, shelves). */
export const BIRCH_PLANKS = "birch_planks";
/** Birch stairs (dining chairs). */
export const BIRCH_STAIRS = "birch_stairs";
/** Birch trapdoors (cabinet fronts). */
export const BIRCH_TRAPDOOR = "birch_trapdoor";
/** Lectern (reading desk). */
export const LECTERN = "lectern";
/** Bookshelf. */
export const BOOKSHELF = "bookshelf";
/** Flower pot (tulip and small plants). */
export const FLOWER_POT = "flower_pot";
/** Item frame id (art; the item itself is not a block). */
export const ITEM_FRAME = "item_frame";
/** Barrel (storage). */
export const BARREL = "barrel";
/** Smoker (mailbox slot, kitchen appliance). */
export const SMOKER = "smoker";
/** Furnace (kitchen hob). */
export const FURNACE = "furnace";
/** Cauldron (basin). */
export const CAULDRON = "cauldron";
/** Orange bed (master bedroom). */
export const ORANGE_BED = "orange_bed";
/** Cyan bed. */
export const CYAN_BED = "cyan_bed";
/** Yellow bed (bedroom 2). */
export const YELLOW_BED = "yellow_bed";
/** Light blue bed (bedroom 1). */
export const LIGHT_BLUE_BED = "light_blue_bed";
/** White bed (palette option). */
export const WHITE_BED = "white_bed";

// ---- seeded random: same seed, same build -----------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1); same seed, same sequence. */
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
