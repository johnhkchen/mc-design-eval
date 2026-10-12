// Shared constants for every part: palette ids (palette.json only), plan.md's site coordinates, and a seeded rng.

// ---- palette ids (named; every id is in palette.json) ----------------------------------------------------------------
/** Body stucco walls, white_concrete. */
export const STUCCO = "white_concrete";
/** Posts, beams, beam ends and mullions, dark_oak_log. */
export const STRUCTURE = "dark_oak_log";
/** Continuous dark header course under the eave, dark_oak_planks. */
export const HEADER = "dark_oak_planks";
/** Dark eave line and hole edges, dark_oak_slab. */
export const FASCIA = "dark_oak_slab";
/** Base course, driveway, patio and pool deck, smooth_stone. */
export const PAVING = "smooth_stone";
/** Pale grey roof deck and bottom slabs, smooth_stone_slab. */
export const ROOF_DECK = "smooth_stone_slab";
/** Driveway joint rows, light_gray_concrete. */
export const JOINT = "light_gray_concrete";
/** Tan desert ledgestone, mud_bricks. */
export const LEDGE = "mud_bricks";
/** Ledgestone texture (about 25%), packed_mud. */
export const LEDGE_TEXTURE = "packed_mud";
/** Ledgestone cap, mud_brick_slab. */
export const LEDGE_CAP = "mud_brick_slab";
/** Glass walls, clerestory and ring, glass_pane. */
export const GLASS = "glass_pane";
/** Front door, acacia_door. */
export const FRONT_DOOR = "acacia_door";
/** Utility door (kitchen to carport), dark_oak_door. */
export const UTILITY_DOOR = "dark_oak_door";
/** Door surround, transom and entry panels, orange_concrete. */
export const ACCENT = "orange_concrete";
/** Car body, teal, cyan_concrete. */
export const CAR_BODY = "cyan_concrete";
/** Car roof and two-tone flash, white_concrete. */
export const CAR_WHITE = "white_concrete";
/** Car bumpers and chrome, iron_block. */
export const CHROME = "iron_block";
/** Car tyres and chimney flue, black_concrete. */
export const BLACK = "black_concrete";
/** Headlamps, yellow_concrete. */
export const HEADLAMP = "yellow_concrete";
/** Tail lamps, red_concrete. */
export const TAILLAMP = "red_concrete";
/** Sand yard, side strips and cactus beds, sand. */
export const SAND = "sand";
/** Gravel beds, gravel. */
export const GRAVEL = "gravel";
/** Back lawns, grass_block. */
export const GRASS = "grass_block";
/** Bedding under the lot and under the house, dirt. */
export const DIRT = "dirt";
/** Pool water, water. */
export const WATER = "water";
/** Pool liner, light_blue_concrete. */
export const LINER = "light_blue_concrete";
/** Pool coping (bottom slab), smooth_quartz_slab. */
export const COPING = "smooth_quartz_slab";
/** Pit floor and quartz trim, smooth_quartz. */
export const QUARTZ = "smooth_quartz";
/** Pit steps and quartz stair benches, smooth_quartz_stairs. */
export const QUARTZ_STAIRS = "smooth_quartz_stairs";
/** Palm trunks, jungle_log. */
export const JUNGLE_LOG = "jungle_log";
/** Palm crowns, jungle_leaves. */
export const JUNGLE_LEAVES = "jungle_leaves";
/** Saguaro and barrel cacti, cactus. */
export const CACTUS = "cactus";
/** Public-room floor base, smooth_stone (terrazzo flecks are light_gray_concrete and white_concrete). */
export const TERRAZZO = "smooth_stone";
/** Terrazzo fleck, light_gray_concrete. */
export const TERRAZZO_FLECK = "light_gray_concrete";
/** Terrazzo fleck, white_concrete. */
export const TERRAZZO_WHITE = "white_concrete";
/** Bedroom floor and ceiling between beams, spruce_planks. */
export const SPRUCE_PLANKS = "spruce_planks";
/** Wall panelling strips, spruce_trapdoor. */
export const PANEL = "spruce_trapdoor";
/** Panelling stairs, spruce_stairs. */
export const SPRUCE_STAIRS = "spruce_stairs";
/** Panelling slab, spruce_slab. */
export const SPRUCE_SLAB = "spruce_slab";
/** Panelling and table legs, spruce_fence. */
export const SPRUCE_FENCE = "spruce_fence";
/** Interior partitions, white_concrete. */
export const PARTITION = STUCCO;
/** Sofa and egg-chair upholstery, smooth_red_sandstone_stairs (orange). */
export const UPHOLSTERY = "smooth_red_sandstone_stairs";
/** Orange cushions and carpets, orange_carpet. */
export const CARPET_ORANGE = "orange_carpet";
/** White carpets, white_carpet. */
export const CARPET_WHITE = "white_carpet";
/** Teal carpets, cyan_carpet. */
export const CARPET_CYAN = "cyan_carpet";
/** Yellow carpets, yellow_carpet. */
export const CARPET_YELLOW = "yellow_carpet";
/** Quartz stairs (WC, bath seats), quartz_stairs. */
export const QUARTZ_STAIR = "quartz_stairs";
/** Quartz slab (tables, counters), quartz_slab. */
export const QUARTZ_SLAB = "quartz_slab";
/** Birch planks (chairs, cabinets), birch_planks. */
export const BIRCH_PLANKS = "birch_planks";
/** Birch slab (table tops, sideboards), birch_slab. */
export const BIRCH_SLAB = "birch_slab";
/** Birch stairs (dining chairs), birch_stairs. */
export const BIRCH_STAIRS = "birch_stairs";
/** Birch trapdoor (cabinet fronts), birch_trapdoor. */
export const BIRCH_TRAPDOOR = "birch_trapdoor";
/** Iron trapdoor (sofa and chair backs), iron_trapdoor. */
export const IRON_TRAPDOOR = "iron_trapdoor";
/** Lectern, lectern. */
export const LECTERN = "lectern";
/** Bookshelf, bookshelf. */
export const BOOKSHELF = "bookshelf";
/** Flower pot, flower_pot. */
export const FLOWER_POT = "flower_pot";
/** Potted cactus, potted_cactus. */
export const POTTED_CACTUS = "potted_cactus";
/** Item frame, item_frame. */
export const ITEM_FRAME = "item_frame";
/** Barrel, barrel. */
export const BARREL = "barrel";
/** Smoker (mailbox and kitchen), smoker. */
export const SMOKER = "smoker";
/** Furnace (kitchen hob), furnace. */
export const FURNACE = "furnace";
/** Cauldron (basin), cauldron. */
export const CAULDRON = "cauldron";
/** Orange bed, orange_bed. */
export const BED_ORANGE = "orange_bed";
/** Teal bed, cyan_bed. */
export const BED_CYAN = "cyan_bed";
/** Yellow bed, yellow_bed. */
export const BED_YELLOW = "yellow_bed";
/** Sea-blue bed, light_blue_bed. */
export const BED_BLUE = "light_blue_bed";
/** White bed, white_bed. */
export const BED_WHITE = "white_bed";
/** Fireplace firebox, campfire. */
export const CAMPFIRE = "campfire";
/** Fireplace cap and roof-stack cap, smooth_stone_slab. */
export const CAP_SLAB = "smooth_stone_slab";
/** Lantern (hanging or on a post), lantern. */
export const LANTERN = "lantern";
/** Sea lantern (bath light), sea_lantern. */
export const SEA_LANTERN = "sea_lantern";
/** End rod (floor lamp), end_rod. */
export const END_ROD = "end_rod";
/** Dark oak fence (mailbox, garden lamp posts, patio legs), dark_oak_fence. */
export const DARK_FENCE = "dark_oak_fence";

// ---- plan.md site coordinates (absolute; x 0..33 west to east, z 0..33 north (street) to south (back)) ----------------
/** Grid size: x 0..33, y 0..8 (chimney top), z 0..33. */
export const SIZE = [34, 9, 34];
/** Ground top (standing height is y=1 above it). */
export const GROUND_Y = 0;
/** Bedding under the lot (dropped by build.mjs, since the grid starts at y=0). */
export const BEDDING_Y = -1;
/** House floor slab (finished floor). */
export const FLOOR_Y = 1;
/** Top of the walls and the beam line (header course). */
export const HEADER_Y = 5;
/** Beam-line x positions: every post, beam and beam end sits on one of these. */
export const BEAM_X = [10, 13, 16, 19, 22, 25, 28, 31];
/** Beam z range: the beams run from z=5 to z=28 (outside the eaves). */
export const BEAM_Z = [5, 28];
/** House shell footprint: x 10..31, z 8..25 (walls on the perimeter). */
export const HOUSE = { x0: 10, x1: 31, z0: 8, z1: 25 };
/** Atrium (open to the sky): x 17..21, z 12..17; glass ring on x=16, x=22, z=11, z=18. */
export const ATRIUM = { x0: 17, x1: 21, z0: 12, z1: 17 };
/** Entry: front door at x=19, z=9 (the door wall); entry recess z=8. */
export const DOOR = { x: 19, z: 9 };
/** Entrance cell where the walk check starts. */
export const ENTRANCE = [19, 1, 7];
/** Freestanding fireplace and chimney footprint: x 20..21, z 21..22 (y=1..8). */
export const CHIMNEY = { x0: 20, x1: 21, z0: 21, z1: 22 };
/** Conversation pit: x 13..17, z 20..23 (floor y=0, no slab at y=1). */
export const PIT = { x0: 13, x1: 17, z0: 20, z1: 23 };
/** Carport footprint: x 0..9, z 7..21 (deck y=5 on posts at x=1). */
export const CARPORT = { x0: 0, x1: 9, z0: 7, z1: 21, deckY: 5 };
/** Car origin (nose north): x 3..5, z 1..7, y 1..2. */
export const CAR = { x: 3, z: 1 };
/** Palm positions (trunk base): jungle trunk y=1..7 with crown radius 2. */
export const PALMS = [[12, 3], [30, 4], [29, 31]];
/** Mailbox at the head of the driveway. */
export const MAILBOX = { x: 9, z: 1 };
/** Cactus bed (gravel): x 23..29, z 2..4. */
export const CACTUS_BED = { x0: 23, x1: 29, z0: 2, z1: 4 };
/** Kidney pool cells at z (plan.md RESERVED): these are never dirt or deck. */
export const POOL = { 29: [[14, 17], [20, 21]], 30: [[13, 22]], 31: [[13, 22]], 32: [[14, 21]] };
/** True when (x, z) is a kidney pool cell. */
export const inPool = (x, z) => (POOL[z] ?? []).some(([a, b]) => x >= a && x <= b);
/** Room air boxes [x0,y0,z0,x1,y1,z1] (ROOMS in plan.md), keyed by the room name in rooms.json. */
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

// ---- seeded randomness -----------------------------------------------------------------------------------------------
/** A seeded rng(seed) returning a function that gives floats in [0, 1) (mulberry32): the same seed gives the same build. */
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
