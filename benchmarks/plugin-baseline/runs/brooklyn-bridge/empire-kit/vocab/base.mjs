// Shared constants for the Empire Stores + Jane's Carousel build: palette ids (palette.json only), site coordinates
// from plan.md (SITE, ROOFS, FLOORS), and a seeded rng. Every export is documented in one line.

// ---- palette (ids from palette.json; plain names, the library adds minecraft:) ----
// Brick body, weathering and relief
export const BRICKS = "bricks";                         // brick body (about 85 % of facades)
export const TERRACOTTA = "terracotta";                 // brick weathering patches
export const MUD_BRICKS = "mud_bricks";                 // ground-course weathering, rare
export const BRICK_STAIRS = "brick_stairs";             // arch heads, corbels, outer coping steps
export const BRICK_SLAB = "brick_slab";                 // brick slab
// Stone base, trim and quoins
export const STONE_BRICKS = "stone_bricks";             // plinth, cut paving, bridge
export const STONE_BRICK_STAIRS = "stone_brick_stairs"; // grand stair treads
export const STONE_BRICK_WALL = "stone_brick_wall";     // passage lamp posts
export const SMOOTH_STONE = "smooth_stone";             // string course, sills, lintels, keystones
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";   // coping, roof decks, drips
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab"; // carousel platform rim (cream)
export const POLISHED_ANDESITE = "polished_andesite";   // quoins
// Openings and iron
export const GLASS = "glass";                           // carousel box walls and drum glazing
export const GLASS_PANE = "glass_pane";                 // window glazing, shopfronts, pavilion
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";   // iron shutters (open)
export const DARK_OAK_DOOR = "dark_oak_door";           // shop doors
export const DARK_OAK_PLANKS = "dark_oak_planks";       // shopfront frames
// Pavilion and carousel box
export const BLACK_CONCRETE = "black_concrete";         // pavilion posts
export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab"; // black roof edges
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete"; // carousel plinth
export const WHITE_CONCRETE = "white_concrete";         // mullions, canopy wedges
// Garden
export const GRASS_BLOCK = "grass_block";               // lawn and site ground
export const MOSS_BLOCK = "moss_block";                 // planter and lawn variation
export const COARSE_DIRT = "coarse_dirt";               // garden patches
export const OAK_LOG = "oak_log";                       // tree trunks
export const OAK_FENCE = "oak_fence";                   // garden fences
export const OAK_STAIRS = "oak_stairs";                 // bench pairs
export const AZALEA_LEAVES = "azalea_leaves";           // tree crowns
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves"; // tree crowns (persistent)
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log"; // planter boxes
// Light
export const LANTERN = "lantern";                       // hanging and post lights
export const SHROOMLIGHT = "shroomlight";               // warm light behind panes, canopy ring
// Carousel
export const RED_CONCRETE = "red_concrete";             // canopy wedges, drum panels
export const YELLOW_CONCRETE = "yellow_concrete";       // horse accents
export const GOLD_BLOCK = "gold_block";                 // drum cornice, canopy centre
export const SMOOTH_QUARTZ = "smooth_quartz";           // drum panels, horse heads
export const WHITE_WOOL = "white_wool";                 // horse bodies
export const BROWN_WOOL = "brown_wool";                 // horse accents
export const RED_GLAZED_TERRACOTTA = "red_glazed_terracotta"; // drum panels
export const END_ROD = "end_rod";                       // horse poles
export const SPRUCE_SLAB = "spruce_slab";               // carousel platform

// ---- site (plan.md SITE; x along Water Street, north = -z = river) ----
export const SITE_X = 118;                              // grid width: x 0..117
export const SITE_Y = 25;                               // grid height: y 0..24 (plot 0 cap)
export const SITE_Z = 44;                               // grid depth: z 0..43
export const GROUND = "minecraft:grass_block";          // laid at y 0 before the parts (plinth and paving replace it)
export const PLOT0 = { x0: 0, x1: 97, z0: 0, z1: 43, yMax: 24 };          // Empire Stores footprint and height cap
export const PLOT1 = { x0: 102, x1: 117, z0: 0, z1: 15, yMax: 16 };       // Jane's Carousel footprint and height cap
export const MAIN_BAR = { x0: 4, x1: 93, y0: 0, y1: 11, z0: 4, z1: 28 };  // river block (brick), deck at y 11
export const WING = { x0: 4, x1: 73, y0: 0, y1: 11, z0: 29, z1: 40 };     // Water Street block, joined to the bar
export const CUT = { x0: 46, x1: 51, z0: 3, z1: 41 };                     // open-air passage through bay 4, no building above y 0
export const CUT_STAIR = { x0: 49, x1: 51, y0: 1, y1: 11, z0: 30, z1: 40 }; // grand stair to the roof garden
export const CUT_PASSAGE = { x0: 46, x1: 48, z0: 4, z1: 41 };             // ground passage kept clear beside the stair
export const BRIDGE = { x0: 46, x1: 51, y: 11, z0: 27, z1: 29 };          // roof bridge deck (walk y 12)
export const DECK_Y = 11;                               // roof deck block level (walk y 12)
export const ROOF_TOP_Y = 15;                           // top of the Empire Stores parapets
export const PAVILION_A = { x0: 56, x1: 91, z0: 6, z1: 26 };              // rooftop pavilion, north part
export const PAVILION_B = { x0: 56, x1: 71, z0: 27, z1: 38 };             // rooftop pavilion, south part
export const PAVILION_Y = { y0: 12, y1: 13, roof: 14 };                   // glass walls y 12..13, roof y 14
export const GARDEN = { x0: 31, x1: 44, z0: 5, z1: 39 };                  // roof garden west of the cut
export const TERRACE = { x0: 53, x1: 55, z0: 5, z1: 39 };                 // roof terrace east of the cut
export const BAYS = [[5, 16], [18, 29], [31, 42], [44, 53], [55, 66], [68, 79], [81, 92]]; // bay interiors (x from..to)
export const BAY_S = [5, 18, 31, 55, 68, 81];           // bay start x (s), bays 1-3, 5-7 (bay 4 is the cut)
export const PIERS_X = [4, 17, 30, 43, 54, 67, 80, 93]; // party piers and end walls
export const TREES = [[34, 12], [40, 22], [35, 33]];    // garden trees T1-T3, trunk centres (x, z)
export const CAROUSEL_BOX = { x0: 103, x1: 116, z0: 1, z1: 14, roofY: 7 }; // glass box, plinth x0..x1, z0..z1
export const CAROUSEL_PLATFORM = { x0: 105, x1: 114, z0: 3, z1: 12 };     // carousel footprint (diameter 10)
export const CAROUSEL_CENTRE = [109.5, 7.5];            // carousel centre (x, z)
export const CAROUSEL_DOORS = { north: { x0: 109, x1: 110, z: 1 }, south: { x0: 109, x1: 110, z: 14 } }; // door cells, y 1..2

// ---- seeded random ----
/** rng(seed): seeded random numbers in [0, 1) (mulberry32): the same seed gives the same sequence. */
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
