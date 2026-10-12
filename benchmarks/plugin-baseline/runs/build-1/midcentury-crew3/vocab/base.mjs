// Shared constants for every part: palette ids (palette.json only), plan.md site coordinates, and a seeded rng.
// Coordinates are plan.md's absolute ones; x 0..33 (west→east), z 0..33 (z=0 street, north), y=0 ground top.

export const AIR = "air";

// ---- palette ids (one name per palette.json id) -----------------------------------------------------------------
export const WHITE_CONCRETE = "white_concrete"; // stucco body, partitions, breeze-block, car roof
export const DARK_OAK_LOG = "dark_oak_log"; // posts, beams, beam ends, mullions (axis=y/z/x)
export const DARK_OAK_FENCE = "dark_oak_fence"; // lamp posts, parasol pole
export const DARK_OAK_PLANKS = "dark_oak_planks"; // header course under the eave
export const DARK_OAK_SLAB = "dark_oak_slab"; // fascia, eave line
export const SMOOTH_STONE = "smooth_stone"; // base course, driveway, sidewalk, patio, pool deck, terrazzo base
export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // roof deck, fireplace cap
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete"; // driveway joints, terrazzo flecks
export const MUD_BRICKS = "mud_bricks"; // ledgestone feature wall, fireplace base
export const PACKED_MUD = "packed_mud"; // ledgestone flecks (~25%)
export const MUD_BRICK_SLAB = "mud_brick_slab"; // ledgestone cap, mailbox
export const GLASS_PANE = "glass_pane"; // walls, clerestory, ring, car windows
export const ACACIA_DOOR = "acacia_door"; // front door (orange)
export const DARK_OAK_DOOR = "dark_oak_door"; // utility door, carport-kitchen
export const ORANGE_CONCRETE = "orange_concrete"; // door surround, transom, bold accent
export const WATER = "water"; // pool water
export const LIGHT_BLUE_CONCRETE = "light_blue_concrete"; // pool liner
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // pool coping, benches
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // pit steps, benches
export const SMOOTH_QUARTZ = "smooth_quartz"; // pit floor, bath floors
export const SAND = "sand"; // front yard, side strips, carport ground
export const GRAVEL = "gravel"; // gravel beds
export const GRASS_BLOCK = "grass_block"; // back lawn
export const DIRT = "dirt"; // bedding, ground under the house, atrium planting
export const SPRUCE_PLANKS = "spruce_planks"; // bedroom floors, ceilings, panelling
export const SPRUCE_TRAPDOOR = "spruce_trapdoor"; // wall panelling (open=true)
export const SPRUCE_STAIRS = "spruce_stairs"; // wall panelling, seats
export const SPRUCE_SLAB = "spruce_slab"; // wall panelling, shelves
export const SPRUCE_FENCE = "spruce_fence"; // wall panelling, floor-lamp post, bench legs
export const BLACK_CONCRETE = "black_concrete"; // fireplace flue, tyres, mailbox
export const CAMPFIRE = "campfire"; // fireplace firebox (lit=true)
export const CYAN_CONCRETE = "cyan_concrete"; // car lower body (teal)
export const IRON_BLOCK = "iron_block"; // car chrome, fridge
export const IRON_TRAPDOOR = "iron_trapdoor"; // hob/fridge trapdoors
export const SEA_LANTERN = "sea_lantern"; // bath 1 light
export const CACTUS = "cactus"; // cactus bed, atrium
export const JUNGLE_LOG = "jungle_log"; // palm trunks, sapling
export const JUNGLE_LEAVES = "jungle_leaves"; // palm crowns, sapling (persistent=true)
export const DEAD_BUSH = "dead_bush"; // front yard
export const SHORT_GRASS = "short_grass"; // lawns
export const LARGE_FERN = "large_fern"; // atrium
export const LANTERN = "lantern"; // entry and garden lights (hanging=true), room lights
export const BIRCH_SLAB = "birch_slab"; // gallery bench, poolside furniture
export const YELLOW_CONCRETE = "yellow_concrete"; // car headlamps
export const RED_CONCRETE = "red_concrete"; // car tail lamps
export const POTTED_CACTUS = "potted_cactus"; // atrium, decor
export const END_ROD = "end_rod"; // floor lamp
export const DAYLIGHT_DETECTOR = "daylight_detector"; // decor (lights)
export const ORANGE_CARPET = "orange_carpet"; // living-room rugs, cushions
export const WHITE_CARPET = "white_carpet"; // bath/bedroom rugs
export const CYAN_CARPET = "cyan_carpet"; // bed 1 rug
export const YELLOW_CARPET = "yellow_carpet"; // bed 2 rug
export const SMOOTH_RED_SANDSTONE_STAIRS = "smooth_red_sandstone_stairs"; // orange sofa upholstery
export const QUARTZ_STAIRS = "quartz_stairs"; // benches, seats
export const QUARTZ_SLAB = "quartz_slab"; // tables, shelves
export const BIRCH_PLANKS = "birch_planks"; // gallery and dining furniture
export const BIRCH_STAIRS = "birch_stairs"; // chairs (stairs as seats)
export const BIRCH_TRAPDOOR = "birch_trapdoor"; // shelves, table tops
export const LECTERN = "lectern"; // kitchen/study
export const BOOKSHELF = "bookshelf"; // living decor
export const FLOWER_POT = "flower_pot"; // tables, shelves
export const ITEM_FRAME = "item_frame"; // art (not a block: placed as an entity)
export const BARREL = "barrel"; // storage
export const SMOKER = "smoker"; // kitchen
export const FURNACE = "furnace"; // kitchen
export const CAULDRON = "cauldron"; // decor
export const ORANGE_BED = "orange_bed"; // master bed
export const CYAN_BED = "cyan_bed"; // bed 1
export const YELLOW_BED = "yellow_bed"; // bed 2
export const LIGHT_BLUE_BED = "light_blue_bed"; // bed 1 accent
export const WHITE_BED = "white_bed"; // spare

// ---- site: grid and house (plan.md SITE) ------------------------------------------------------------------------
export const GRID_SIZE = [34, 9, 34]; // x 0..33, y 0..8 (chimney top), z 0..33
export const HOUSE = { x0: 10, x1: 31, y0: 1, y1: 5, z0: 8, z1: 25 }; // main house shell, 22 wide x 18 deep
export const ROOF = { x0: 9, x1: 32, y0: 6, y1: 7, z0: 6, z1: 27 }; // main roof incl. overhangs
export const CHIMNEY_TOP_Y = 8; // chimney cap, one above the ridge band
export const BEAM_LINES = [10, 13, 16, 19, 22, 25, 28, 31]; // structural beam lines (x); every post sits on one
export const ENTRY = [19, 1, 7]; // entrance cell (plan entrance)
export const ENTRY_RECESS = { x0: 18, x1: 20, y0: 2, y1: 4, z: 8 }; // air niche in the north wall
export const FRONT_DOOR = { x: 19, z: 9, y0: 2, y1: 3 }; // acacia_door on the door wall
export const ATRIUM = { x0: 17, x1: 21, z0: 12, z1: 17 }; // open courtyard, glass ring on x=16/22, z=11/18
export const ATRIUM_DOORS = [
  { x0: 19, x1: 20, y0: 2, y1: 3, z: 11 }, // from the gallery
  { x0: 19, x1: 20, y0: 2, y1: 3, z: 18 }, // to the living room
];
export const CHIMNEY = { x0: 20, x1: 21, y0: 1, y1: 8, z0: 21, z1: 22 }; // freestanding fireplace stack
export const PIT = { x0: 13, x1: 17, y: 1, z0: 20, z1: 23 }; // conversation pit (no floor slab; smooth_quartz at y=0)
export const CARPORT = { x0: 0, x1: 9, y0: 1, y1: 5, z0: 7, z1: 21 }; // flat roof deck y=5 on posts
export const CAR = { x0: 3, x1: 5, y0: 1, y1: 2, z0: 1, z1: 7 }; // parked nose to the street
export const PATIO = { x0: 10, x1: 31, y: 0, z0: 26, z1: 28 }; // back patio, under the south eave
export const POOL_DECK = { x0: 11, x1: 24, y: 0, z0: 29, z1: 33 }; // smooth_stone around the pool
export const CACTUS_BED = { x0: 23, x1: 29, y0: 1, y1: 3, z0: 2, z1: 4 }; // on the gravel bed
export const MAILBOX = { x: 9, z: 1, y0: 1, y1: 2 }; // low post + box at the head of the driveway
export const PALMS = [{ x: 12, z: 3 }, { x: 30, z: 4 }, { x: 29, z: 31 }]; // jungle trunk + crown, y=1..7
export const STEPPING_PADS = [1, 3, 5].map((z) => ({ x0: 18, x1: 20, y: 0, z })); // 3x1 smooth_stone pads
export const DRIVEWAY_JOINT_ROWS = [4, 8, 12, 16]; // light_gray_concrete rows across the driveway (z)

// kidney pool cells (RESERVED): z → [x0, x1] runs; water at y=-1..0 (dropped below 0), floor at y=-2
export const POOL = {
  29: [[14, 17], [20, 21]],
  30: [[13, 22]],
  31: [[13, 22]],
  32: [[14, 21]],
};
export const inPool = (x, z) => (POOL[z] ?? []).some(([a, b]) => x >= a && x <= b);

// ---- seeded rng --------------------------------------------------------------------------------------------------
// rng(seed) → a function returning floats in [0, 1) (mulberry32); the same seed always gives the same sequence.
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
