// Shared constants for the shop row. Block ids are palette.json's (checked with mcd blocks --check). Coordinates are WORLD
// coordinates from plan.md, and build.nbt uses the same coordinates. Never write a block by its id.

// ---- palette roles: walls, trim, fascia, base, roof, glass, joinery, floors, ground, functional ----
export const BRICKS = "bricks";                                     // walls
export const BRICK_STAIRS = "brick_stairs";                         // walls: stairs
export const BRICK_SLAB = "brick_slab";                             // walls: slab
export const BRICK_WALL = "brick_wall";                             // walls: yard coping, rails
export const SANDSTONE = "smooth_sandstone";                        // trim: bands, pilasters, sills
export const SANDSTONE_STAIRS = "smooth_sandstone_stairs";          // trim: cornice, consoles
export const SANDSTONE_SLAB = "smooth_sandstone_slab";              // trim: caps, hood, coping
export const CUT_SANDSTONE = "cut_sandstone";                       // trim: quoins, keystones
export const FASCIA = "dark_prismarine";                            // fascia boards
export const FASCIA_SLAB = "dark_prismarine_slab";                  // fascia edge
export const POLISHED_ANDESITE = "polished_andesite";               // base: plinth, kerb
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs"; // base: stairs
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";     // base: slab
export const DEEPSLATE_TILES = "deepslate_tiles";                   // roof
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";       // roof: stairs
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";           // roof: slab
export const DEEPSLATE_TILE_WALL = "deepslate_tile_wall";           // roof: wall
export const IRON_BARS = "iron_bars";                               // roof crest
export const GLASS_PANE = "glass_pane";                             // glass
export const DARK_OAK_DOOR = "dark_oak_door";                       // joinery: doors
export const DARK_OAK_FENCE = "dark_oak_fence";                     // joinery: rails, sign arms
export const DARK_OAK_FENCE_GATE = "dark_oak_fence_gate";           // joinery: yard gates
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";               // joinery: letterboxes, fascia
export const DARK_OAK_PLANKS = "dark_oak_planks";                   // joinery: boxes, window boxes
export const OAK_PLANKS = "oak_planks";                             // floors: flats
export const SMOOTH_STONE = "smooth_stone";                         // floors: pavement
export const OAK_STAIRS = "oak_stairs";                             // floors: flight treads
export const GRASS_BLOCK = "grass_block";                           // ground: lot edges
export const DIRT = "dirt";                                         // ground fill
export const STONE = "stone";                                       // ground fill, deep
export const ANDESITE = "andesite";                                 // road
export const COBBLESTONE = "cobblestone";                           // yard paving
// ---- objects (not role blocks; in palette.json "objects") ----
export const WHITE_BANNER = "white_banner";                         // plaque letters (standing)
export const WHITE_WALL_BANNER = "white_wall_banner";               // plaque letters (wall)
export const DARK_OAK_HANGING_SIGN = "dark_oak_hanging_sign";       // shop name signs
export const DARK_OAK_WALL_SIGN = "dark_oak_wall_sign";             // FLATS sign
export const HAY_BLOCK = "hay_block";                               // chimney flue base
export const CAMPFIRE = "campfire";                                 // signal fires (lit, signal_fire)
export const LANTERN = "lantern";                                   // lamps, keeper aisles, lamp posts
export const LADDER = "ladder";                                     // stair joiner: where a stair can't fit

// ---- site (plan.md SITE and FLOORS), world coordinates ----
export const LOT = { x0: 0, x1: 29, y0: 0, y1: 34, z0: -8, z1: 28 }; // the whole lot, as plan.md gives it
// The lowest z a structure can hold is 0: the yard and rear lane (z -8..-1) plan.md places below it are NOT in the build.
export const BUILD_Z0 = 0;
export const GROUND_TOP = 5;          // top of the ground fill: road course and garden level
export const PAVE_Y = 6;              // pavement, shop floor block: people stand at y 7 (counter level)
export const FRONT_Z = 19;            // street face (south): the walls' outer front
export const REAR_Z = 2;              // rear face (north)
export const BODY = { x0: 3, x1: 26, z0: 2, z1: 19 }; // shops + flats + stair bay, outer walls (the one roof rect)
export const FLOOR_Y = { shop: 6, first: 13, second: 18 }; // floor block y per storey (interior starts one above)
export const ROOF_Y = 24;             // roof course: walls end with the cornice at y 23
export const SHOP_KEEP_CLEAR = { x0: 4, x1: 20, y0: 7, y1: 9, z0: 19, z1: 20 }; // nothing at all here
export const CHIMNEYS = {             // footprint x0,z0,x1,z1 (2x2 stacks, y 6..33)
  W: { x0: 1, z0: 9, x1: 2, z1: 10 }, C: { x0: 12, z0: 0, x1: 13, z1: 1 }, E: { x0: 27, z0: 9, x1: 28, z1: 10 },
};

/**
 * rng(seed): a seeded random function returning 0..1 (mulberry32), so a part's variation is the same on every rebuild.
 */
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
