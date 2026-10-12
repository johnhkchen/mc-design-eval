// Palette ids (palette.json's ids only), plan.md's site coordinates, and a seeded rng: every part imports from here.

// ---- palette ----------------------------------------------------------------------------------------------------
export const WHITE_CONCRETE = "white_concrete"; // white body: canopy fascia, shop walls, stall stripes
export const SMOOTH_QUARTZ = "smooth_quartz"; // canopy soffit, columns, shop body
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // storefront awning (top type)
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // quartz steps and trim
export const GRAY_CONCRETE = "gray_concrete"; // grey: service block, partitions, pylon footing
export const GRAY_CONCRETE_SLAB = "gray_concrete_slab"; // grey slab caps
export const GRAY_CONCRETE_STAIRS = "gray_concrete_stairs"; // grey steps and trim
export const GRAY_CONCRETE_POWDER = "gray_concrete_powder"; // matte asphalt: street and forecourt
export const RED_CONCRETE = "red_concrete"; // brand accent: canopy stripe, sign band, pylon head, logo
export const BLACK_CONCRETE = "black_concrete"; // frames, mullions, plinth course, price board
export const SMOOTH_STONE = "smooth_stone"; // coping, apron, sidewalk, roof deck
export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // pump island caps, coping slabs
export const POLISHED_ANDESITE = "polished_andesite"; // pump island curbs, column bases, pylon footing
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab"; // stone slab trim
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs"; // stone steps and trim
export const LIGHT_BLUE_GLASS_PANE = "light_blue_stained_glass_pane"; // shop storefront glass
export const GRAY_GLASS_PANE = "gray_stained_glass_pane"; // service slot window glass
export const WHITE_GLASS_PANE = "white_stained_glass_pane"; // white glass trim
export const IRON_DOOR = "iron_door"; // store and service doors
export const IRON_TRAPDOOR = "iron_trapdoor"; // rooftop HVAC lids
export const IRON_BARS = "iron_bars"; // propane cage
export const SEA_LANTERN = "sea_lantern"; // canopy soffit light grid, price rows
export const LANTERN = "lantern"; // light poles
export const END_ROD = "end_rod"; // light fitting accents
export const YELLOW_CONCRETE = "yellow_concrete"; // centre line, bollards
export const IRON_BLOCK = "iron_block"; // HVAC body, air station
export const LEVER = "lever"; // pump nozzle, EV cable switch
export const HOPPER = "hopper"; // air station hint
export const DISPENSER = "dispenser"; // fittings detail
export const CAULDRON = "cauldron"; // propane stand
export const BARREL = "barrel"; // dumpster and stock fittings
export const CHEST = "chest"; // stock fittings
export const HAY_BLOCK = "hay_block"; // stock fittings
export const IRON_CHAIN = "iron_chain"; // hoses, EV cable
export const STONE_BUTTON = "stone_button"; // pylon and pump detail
export const STONE_PRESSURE_PLATE = "stone_pressure_plate"; // mat detail
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete"; // HVAC side vent patch, ice chest
export const FLOWER_POT = "flower_pot"; // planter detail
export const GRASS_BLOCK = "grass_block"; // verges and ground
export const COARSE_DIRT = "coarse_dirt"; // ground patches
export const SHORT_GRASS = "short_grass"; // verge plants
export const DANDELION = "dandelion"; // verge flowers
export const BIRCH_LOG = "birch_log"; // tree trunks (axis y)
export const BIRCH_LEAVES = "birch_leaves"; // tree crowns (persistent)
export const AZALEA_LEAVES = "azalea_leaves"; // back hedge (persistent)
export const FLOWERING_AZALEA = "flowering_azalea"; // hedge flowers (persistent)

// ---- site (plan.md SITE): lot x 0..41, z 0..37, front faces north (-z) ------------------------------------------
export const SITE_SIZE = [42, 16, 38]; // grid size build.mjs makes: x, y (pylon top y13 plus headroom), z
export const GROUND_Y = 0; // ground surface layer; everything stands on y=1; store floor at y0
export const STREET = { x0: 0, x1: 41, z0: 0, z1: 4 }; // asphalt street, yellow dashes on z=2
export const SIDEWALK = { x0: 0, x1: 41, z0: 5, z1: 6 }; // smooth stone walk
export const CURB_CUT_IN = { x0: 7, x1: 14 }; // asphalt cut through the sidewalk, in
export const CURB_CUT_OUT = { x0: 27, x1: 34 }; // asphalt cut through the sidewalk, out
export const FORECOURT = { x0: 6, x1: 35, z0: 7, z1: 23 }; // the drive, dark matte asphalt
export const APRON = { x0: 9, x1: 32, z0: 21, z1: 23 }; // smooth stone paving in front of the store
export const WEST_VERGE = { x0: 0, x1: 5, z0: 7, z1: 20 }; // grass, two birch trees
export const EAST_VERGE = { x0: 36, x1: 41, z0: 7, z1: 20 }; // grass, price pylon and one tree
export const CANOPY_DECK = { x0: 6, x1: 34, y: 7, z0: 9, z1: 20 }; // flat deck; underside y7, top y9
export const CANOPY_COLUMNS = [[13, 12], [13, 17], [26, 12], [26, 17]]; // [x0, z] of each 2x1 column (y2..6)
export const ISLAND_A = { x0: 13, x1: 14, z0: 11, z1: 18 }; // raised pump island (curb y1)
export const ISLAND_B = { x0: 26, x1: 27, z0: 11, z1: 18 }; // raised pump island (curb y1)
export const SHOP_BOX = { x0: 9, x1: 23, y0: 1, y1: 7, z0: 24, z1: 33 }; // glass volume: walls y1..5, deck y6, parapet y7
export const SERVICE_BOX = { x0: 24, x1: 32, y0: 1, y1: 9, z0: 24, z1: 33 }; // taller grey block: walls y1..7, deck y8, parapet y9
export const SHOP_ROOF_Y = 6; // shop roof deck
export const SERVICE_ROOF_Y = 8; // service block roof deck
export const AWNING = { x0: 10, x1: 23, y: 5, z0: 22, z1: 23 }; // cantilever over the storefront
export const MAIN_DOOR = { x0: 16, x1: 17, y0: 1, y1: 2, z: 24 }; // double glass doors, north face
export const SLOT_WINDOW = { x: 28, y0: 2, y1: 6, z: 25 }; // recessed service slot window (glass at z25)
export const PARKING_STALLS = [[24, 26], [27, 29], [30, 32]]; // [z0, z1] of the three west stalls (x 1..7)
export const PRICE_PYLON = { x0: 37, x1: 40, y0: 1, y1: 13, z0: 8, z1: 9 }; // footing 38..39 y1..2, panel y4..13
export const LIGHT_POLES = [{ x: 5, z: 21 }, { x: 36, z: 21 }]; // height y1..6
export const TREES = [[2, 10], [2, 17], [40, 16]]; // birch trunk cells on the grass (x, z)
export const DUMPSTER = { x0: 35, x1: 39, y0: 1, y1: 2, z0: 29, z1: 33 }; // 3-sided enclosure, open on the west
export const HEDGE = { x0: 0, x1: 41, y0: 1, y1: 2, z: 36 }; // azalea hedge on the back strip

// ---- rooms (rooms.json boxes, inner air) -----------------------------------------------------------------------
export const ROOM_BOXES = {
  sales: [10, 1, 25, 22, 5, 32], // Sales floor
  restroomA: [25, 1, 25, 26, 7, 28], // Restroom A
  restroomB: [30, 1, 25, 31, 7, 28], // Restroom B
  hall: [28, 1, 26, 28, 7, 28], // Hall, one wide
  stock: [25, 1, 30, 31, 7, 32], // Stock room
};

// ---- helpers ---------------------------------------------------------------------------------------------------
// Seeded rng(seed): returns () => float in [0, 1); the same seed gives the same sequence in every part.
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
