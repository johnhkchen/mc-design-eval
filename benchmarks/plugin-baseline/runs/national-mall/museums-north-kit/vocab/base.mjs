// Shared constants for the three museums: palette.json's blocks by name, plan.md's site coordinates, a seeded rng.

// ---- palette (palette.json ids only) ------------------------------------------------------------------------------
export const CALCITE = "minecraft:calcite";                                 // NMNH wall body (pale granite)
export const STONE_BRICKS = "minecraft:stone_bricks";                       // NMNH rusticated ground storey
export const STONE_BRICK_SLAB = "minecraft:stone_brick_slab";               // NMNH rustic slab course
export const POLISHED_DIORITE = "minecraft:polished_diorite";               // NMNH plinth course
export const SMOOTH_QUARTZ = "minecraft:smooth_quartz";                     // NMNH and NMAH trim, string courses, attics
export const SMOOTH_QUARTZ_SLAB = "minecraft:smooth_quartz_slab";           // NMNH coping and sills; NMAH band underside
export const QUARTZ_SLAB = "minecraft:quartz_slab";                         // NMNH column bases
export const QUARTZ_STAIRS = "minecraft:quartz_stairs";                     // NMNH cornices, lintels, voussoirs
export const QUARTZ_PILLAR = "minecraft:quartz_pillar";                     // NMNH columns and pilasters (axis y)
export const CHISELED_QUARTZ_BLOCK = "minecraft:chiseled_quartz_block";     // NMNH column capitals
export const DIORITE_WALL = "minecraft:diorite_wall";                       // NMNH balustrade
export const BRICK_STAIRS = "minecraft:brick_stairs";                       // NMNH red-tile roof (hip courses)
export const GRANITE_STAIRS = "minecraft:granite_stairs";                   // NMNH red-tile roof (hip courses)
export const POLISHED_GRANITE_SLAB = "minecraft:polished_granite_slab";     // NMNH red-tile roof (ridge slabs)
export const OXIDIZED_COPPER = "minecraft:oxidized_copper";                 // NMNH dome body
export const OXIDIZED_CUT_COPPER = "minecraft:oxidized_cut_copper";         // NMNH dome ribs
export const OXIDIZED_CUT_COPPER_SLAB = "minecraft:oxidized_cut_copper_slab"; // NMNH lantern cap
export const OXIDIZED_CUT_COPPER_STAIRS = "minecraft:oxidized_cut_copper_stairs"; // NMNH dome foot courses
export const GLASS_PANE = "minecraft:glass_pane";                           // NMNH portico door, thermal window, drum; NMAH entrance
export const GRAY_STAINED_GLASS_PANE = "minecraft:gray_stained_glass_pane"; // NMNH wings; NMAH window slots
export const GLASS = "minecraft:glass";                                     // NMNH lantern sides; NMAH skylight
export const IRON_DOOR = "minecraft:iron_door";                             // NMNH doors
export const WHITE_TERRACOTTA = "minecraft:white_terracotta";               // NMAH wall panels, cornice band, mullions
export const SMOOTH_STONE = "minecraft:smooth_stone";                       // NMAH plinth and roof deck; paving; NMAAHC deck
export const SMOOTH_STONE_SLAB = "minecraft:smooth_stone_slab";             // NMAH deck top; NMAAHC porch canopy top
export const LIGHT_GRAY_STAINED_GLASS = "minecraft:light_gray_stained_glass"; // NMAH penthouse clerestory
export const WAXED_COPPER_GRATE = "minecraft:waxed_copper_grate";           // NMAAHC corona lattice (see-through skin)
export const WAXED_CUT_COPPER = "minecraft:waxed_cut_copper";               // NMAAHC solid bronze edges and corner columns
export const WAXED_CUT_COPPER_SLAB = "minecraft:waxed_cut_copper_slab";     // NMAAHC canopy edge
export const WAXED_CUT_COPPER_STAIRS = "minecraft:waxed_cut_copper_stairs"; // NMAAHC bronze steps
export const WAXED_COPPER_TRAPDOOR = "minecraft:waxed_copper_trapdoor";     // NMAAHC bronze hatches
export const BROWN_STAINED_GLASS = "minecraft:brown_stained_glass";         // NMAAHC glass one cell inside the lattice
export const BLACK_STAINED_GLASS = "minecraft:black_stained_glass";         // NMAAHC base glass curtain and shadow bands
export const POLISHED_DEEPSLATE_WALL = "minecraft:polished_deepslate_wall"; // NMAAHC porch posts
export const WATER = "minecraft:water";                                     // NMAAHC reflecting pools
export const OCHRE_FROGLIGHT = "minecraft:ochre_froglight";                 // warm hidden light (NMNH, NMAH, NMAAHC)
export const LANTERN = "minecraft:lantern";                                 // hanging or standing lights
export const LIGHTNING_ROD = "minecraft:lightning_rod";                     // NMNH lantern top
export const OAK_FENCE = "minecraft:oak_fence";                             // lamp posts
export const LIGHT_GRAY_CONCRETE = "minecraft:light_gray_concrete";         // walks
export const GRAVEL = "minecraft:gravel";                                   // NMNH Mall-side walk, if any
export const GRASS_BLOCK = "minecraft:grass_block";                         // lawn; ground top
export const AZALEA_LEAVES = "minecraft:azalea_leaves";                     // planting beds (persistent)
export const OAK_LOG = "minecraft:oak_log";                                 // tree trunks (axis y)
export const OAK_LEAVES = "minecraft:oak_leaves";                           // tree crowns (persistent)

// ---- site (plan.md SITE, OPENINGS and ROOFS; every coordinate is in the kit's one frame) ----------------------------
export const SITE_SIZE = [216, 46, 46];                                     // the grid: x 0..215, y 0..45, z 0..45
export const NMNH_PLOT = { x0: 0, x1: 114, z0: 0, z1: 45, cap: 37 };        // Plot 0, Natural History: x and z extent, top cap y
export const NMAH_PLOT = { x0: 119, x1: 183, z0: 0, z1: 28, cap: 20 };      // Plot 1, American History: x and z extent, top cap y
export const NMAAHC_PLOT = { x0: 188, x1: 215, z0: 0, z1: 33, cap: 45 };    // Plot 2, African American History and Culture
export const NMNH_AXIS_X = 57;                                              // NMNH symmetry axis (north-south)
export const NMNH_FRONT_Z = 41;                                             // NMNH south range wall face (the Mall front)
export const NMNH_PORTICO_Z = 42;                                           // NMNH portico column line and pediment face
export const NMNH_DRUM = { x0: 48, x1: 66, y0: 12, y1: 19, z0: 18, z1: 36 }; // NMNH rotunda drum (octagon), y 12..19
export const NMNH_DOME_CENTRE = [57, 20, 27];                               // NMNH dome centre (x, y, z); base radius 8, top y 26
export const NMNH_LANTERN = { x0: 56, x1: 58, y0: 27, y1: 28, z0: 26, z1: 28 }; // NMNH 3x3 glazed lantern, slab cap y 28
export const NMNH_STEPS = { x0: 50, x1: 64, y0: 1, y1: 4, z0: 43, z1: 45 }; // NMNH grand steps down to the Mall
export const NMAH_AXIS_X = 152;                                             // NMAH symmetry axis (north-south)
export const NMAH_FRONT_Z = 24;                                             // NMAH south glass front (recessed under the overhang)
export const NMAH_ATRIUM = { x0: 146, x1: 158, y0: 1, y1: 12, z0: 11, z1: 17 }; // NMAH atrium, open from y 1 to the skylight at y 12
export const NMAAHC_CENTRE = [201, 13];                                     // NMAAHC corona centre (x, z); symmetric about x 201, z 13
export const NMAAHC_CORONA = { x0: 188, x1: 214, z0: 0, z1: 26, top: 19 };  // NMAAHC top tier square; roof deck top y 19, coping y 20
export const NMAAHC_FLOOR_Y = 4;                                            // NMAAHC lobby floor (the glass base is y 4..7)

// ---- randomness ----------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed) returns a function giving floats in [0, 1); the same seed, the same sequence. */
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
