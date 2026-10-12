// Shared constants for every part: palette ids (palette.json only), plan.md's site coordinates, and a seeded rng.
// Every export is one line; coordinates are absolute (plan.md), never offset.

// ---- palette: block ids, named by role (palette.json) -----------------------------------------------------------
export const STUCCO = "white_concrete"; // body walls, partitions, breeze-block screen
export const STRUCT = "dark_oak_log"; // posts, beams, beam ends, mullions (axis per use)
export const HEADER = "dark_oak_planks"; // header course under the eave (y=5)
export const FASCIA = "dark_oak_slab"; // dark eave line (type bottom or top to match its band)
export const BASE = "smooth_stone"; // base course, driveway, sidewalk, patio, pool deck
export const BASE_SLAB = "smooth_stone_slab"; // carport and roof deck slab (type bottom)
export const GLASS = "glass_pane"; // walls, clerestory, atrium ring, car windscreen
export const LEDGE = "mud_bricks"; // ledgestone feature wall and fireplace base
export const LEDGE_PACKED = "packed_mud"; // ~25% of the ledgestone for texture
export const LEDGE_CAP = "mud_brick_slab"; // ledgestone cap (type bottom)
export const FRONT_DOOR = "acacia_door"; // orange front door
export const UTILITY_DOOR = "dark_oak_door"; // kitchen utility door (open, facing west)
export const ACCENT = "orange_concrete"; // door surround and transom
export const CAR_BODY = "cyan_concrete"; // car lower body
export const CAR_TRIM = "iron_block"; // car bumpers, chrome, grille
export const TYRE = "black_concrete"; // car tyres, flue, fireplace
export const LAMP_FRONT = "yellow_concrete"; // car headlamps
export const LAMP_BACK = "red_concrete"; // car tail lamps
export const JOINT = "light_gray_concrete"; // driveway joint rows, terrazzo flecks
export const SAND = "sand"; // front yard, side strips, under cacti
export const GRAVEL = "gravel"; // gravel beds
export const GRASS = "grass_block"; // back lawn, atrium patch
export const DIRT = "dirt"; // bedding, atrium planting
export const WATER = "water"; // kidney pool water
export const POOL_LINER = "light_blue_concrete"; // kidney pool floor and liner
export const COPING = "smooth_quartz_slab"; // pool coping (type bottom); lounger foot; patio tabletop
export const QUARTZ = "smooth_quartz"; // pit floor, bath floors
export const QUARTZ_STAIRS = "smooth_quartz_stairs"; // pit benches, loungers, patio chairs
export const QUARTZ_SLAB = "quartz_slab"; // counters and furniture tops
export const QUARTZ_STAIRS_PLAIN = "quartz_stairs"; // WC and benches
export const JUNGLE_LOG = "jungle_log"; // palm trunks
export const JUNGLE_LEAVES = "jungle_leaves"; // palm crowns (persistent=true)
export const CACTUS = "cactus"; // cacti
export const POTTED_CACTUS = "potted_cactus"; // potted cacti on the wall tops and sideboards
export const LARGE_FERN = "large_fern"; // atrium ferns
export const DEAD_BUSH = "dead_bush"; // front-yard sand
export const SHORT_GRASS = "short_grass"; // lawn tufts
export const FENCE = "dark_oak_fence"; // mailbox post, lamp posts, patio table legs
export const SPRUCE_PLANKS = "spruce_planks"; // bedroom floors, ceiling, headboards
export const SPRUCE_SLAB = "spruce_slab"; // coffee and dining tops
export const SPRUCE_FENCE = "spruce_fence"; // table and nightstand legs
export const SPRUCE_TRAPDOOR = "spruce_trapdoor"; // wall panelling, wardrobe fronts (open=true)
export const SPRUCE_STAIRS = "spruce_stairs"; // panelling and trim
export const BIRCH_PLANKS = "birch_planks"; // furniture
export const BIRCH_SLAB = "birch_slab"; // sideboard tops, bench, stool seats
export const BIRCH_STAIRS = "birch_stairs"; // dining chairs
export const BIRCH_TRAPDOOR = "birch_trapdoor"; // cabinet fronts
export const IRON_TRAPDOOR = "iron_trapdoor"; // sofa backs, egg chair shell
export const SOFA_STAIRS = "smooth_red_sandstone_stairs"; // orange upholstery: sofas, egg chair seat
export const ORANGE_CARPET = "orange_carpet"; // pit cushions, rugs
export const WHITE_CARPET = "white_carpet"; // rugs
export const CYAN_CARPET = "cyan_carpet"; // rugs
export const YELLOW_CARPET = "yellow_carpet"; // rugs
export const LECTERN = "lectern"; // display stand
export const BOOKSHELF = "bookshelf"; // shelving
export const FLOWER_POT = "flower_pot"; // potted plants on tables
export const ITEM_FRAME = "item_frame"; // art, not a block: place via entities, never as a set() block
export const BARREL = "barrel"; // storage
export const SMOKER = "smoker"; // mailbox box, kitchen appliance
export const FURNACE = "furnace"; // kitchen appliance
export const CAULDRON = "cauldron"; // bath basin
export const ORANGE_BED = "orange_bed"; // master bedroom bed
export const CYAN_BED = "cyan_bed"; // bedroom 1 bed
export const YELLOW_BED = "yellow_bed"; // bedroom 2 bed
export const LIGHT_BLUE_BED = "light_blue_bed"; // spare-room bed colour
export const WHITE_BED = "white_bed"; // white bed option
export const CAMPFIRE = "campfire"; // lit fireplace firebox (lit=true)
export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // fireplace cap (type bottom)
export const LANTERN = "lantern"; // hanging or post lights (hanging=true or false)
export const SEA_LANTERN = "sea_lantern"; // bath light
export const END_ROD = "end_rod"; // floor lamp stand
export const DAYLIGHT_DETECTOR = "daylight_detector"; // light-sensor detail on the lights

// ---- site: plan.md coordinates (absolute) -------------------------------------------------------------------------
export const GRID = [34, 9, 34]; // grid size: x 0..33, y 0..8 (chimney top), z 0..33
export const GROUND_Y = 0; // ground top; bedding at y=-1 is below the grid and not stored
export const FLOOR_Y = 1; // house floor slab and base course
export const WALL_Y0 = 2; // lowest body row (standing height)
export const WALL_Y1 = 4; // highest body row
export const HEADER_Y = 5; // header course, beams and ceiling
export const ROOF_Y0 = 6; // roof band bottom
export const ROOF_Y1 = 7; // ridge
export const CHIMNEY_TOP = 8; // cap of the fireplace flue
export const BEAM_X = [10, 13, 16, 19, 22, 25, 28, 31]; // beam lines (every 3 cells, the structural rhythm)
export const BEAM_Z = [5, 28]; // beam run along z: from z=5 (front tail) to z=28 (back tail)
export const HOUSE = { x0: 10, x1: 31, z0: 8, z1: 25 }; // main shell footprint, perimeter walls on it
export const INTERIOR = { x0: 11, x1: 30, z0: 9, z1: 24 }; // inside the perimeter walls
export const ATRIUM = { x0: 17, x1: 21, z0: 12, z1: 17 }; // open courtyard in the glass ring (no roof, no floor slab)
export const ATRIUM_DOORS = [{ x: [19, 20], z: 11 }, { x: [19, 20], z: 18 }]; // 2w x 2h, y=2..3
export const ENTRY_NICHE = { x0: 18, x1: 20, y0: 2, y1: 4, z: 8 }; // air niche 3w x 3h x 1d
export const FRONT_DOOR_CELL = [19, 2, 9]; // acacia_door lower half; upper half at y=3
export const ENTRANCE_CELL = [19, 1, 7]; // the entrance cell at the head of the landing
export const FEATURE_WALL = { x0: 11, x1: 17, y0: 1, y1: 4, z: 7 }; // freestanding ledgestone leaf at z=7
export const CLERESTORY_X = [22, 23, 24, 26, 27, 29, 30]; // glass cells on the north clerestory strip (y=4, z=8)
export const CLERESTORY_MULLIONS = [25, 28]; // dark_oak_log mullions on the clerestory
export const SLIDERS = [{ x: [14, 15], z: 25 }, { x: [20, 21], z: 25 }, { x: [26, 27], z: 25 }]; // south sliders, 2w x 2h
export const UTILITY_DOOR_CELL = [10, 2, 10]; // west wall, kitchen to carport
export const DINING_WINDOW = { x: 10, z0: 14, z1: 16, y0: 3, y1: 4 }; // west window of the dining room
export const BED1_WINDOW = { x: 31, z0: 10, z1: 12, y0: 3, y1: 4 }; // east window of bedroom 1
export const CARPORT = { x0: 0, x1: 9, y0: 1, y1: 5, z0: 7, z1: 21 }; // carport deck on posts, open N and W
export const CARPORT_POST_Z = [8, 14, 20]; // posts at x=1 and beams at x=0..9
export const BREEZE_Z = 21; // breeze-block screen at the carport's south edge
export const CAR = { x0: 3, x1: 5, y0: 1, y1: 2, z0: 1, z1: 7 }; // reserved: car parked nose to the street
export const CHIMNEY = { x0: 20, x1: 21, y0: 1, y1: 8, z0: 21, z1: 22 }; // freestanding fireplace and flue
export const PIT = { x0: 13, x1: 17, y0: 0, y1: 4, z0: 20, z1: 23 }; // conversation pit (floor y=0)
export const PALMS = [[12, 3], [30, 4], [29, 31]]; // palm trunk cells (crown radius 2 at y=6..7)
export const CACTUS_BED = { x0: 23, x1: 29, y0: 1, y1: 3, z0: 2, z1: 4 }; // gravel bed for the cactus cluster
export const MAILBOX = [9, 1, 1]; // mailbox post cell at the head of the driveway
export const PATIO = { x0: 10, x1: 31, z0: 26, z1: 28 }; // back patio, under the south eave
export const POOL_DECK = { x0: 11, x1: 24, z0: 29, z1: 33 }; // smooth_stone deck around the pool
// kidney pool cells (plan.md RESERVED): ground and bedding left empty; keyed by z, [x0, x1] runs
export const POOL = { 29: [[14, 17], [20, 21]], 30: [[13, 22]], 31: [[13, 22]], 32: [[14, 21]] };
export const inPool = (x, z) => (POOL[z] ?? []).some(([a, b]) => x >= a && x <= b); // true on a kidney-pool cell
// room inner air boxes [x0,y0,z0,x1,y1,z1] (plan.md ROOMS): the air each interior designer fills
export const ROOM_BOX = {
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

// ---- rng ----------------------------------------------------------------------------------------------------------
/** Seeded rng(seed): returns a function giving a float in [0,1) each call (mulberry32; same seed, same sequence). */
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
