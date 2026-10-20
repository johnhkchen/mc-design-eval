// Shared constants for the MoPOP kit: palette block ids (palette.json only), site coordinates from plan.md, and a seeded rng.

// Site and levels
export const SITE = [102, 47, 153];                                       // plot 0: x 0..101, y 0..46, z 0..152
export const GROUND_Y = 0;                                                // ground course (smooth_stone), every ground surface stands on it
export const FLOOR_Y = 1;                                                 // first floor level; floors and doors start here
export const STREET = { x0: 43, x1: 51, y0: 8, y1: 17, z0: 0, z1: 152 };  // monorail street: train corridor, no shell, floor or decor (beams, pylon caps, train excepted)
export const MAIN_DOOR_Z = 22;                                            // north curtain wall and main double doors D1/D2
export const ENTRANCE = [31, 1, 21];                                      // entrance cell, in front of the main doors
export const STREET_CELL = [44, 1, 16];                                   // street cell on the paved monorail street

// Footprint mask (plan.md, 1 char = 4x4): building spans per z band; anything outside is plaza or garden
export const FOOTPRINT = [
  { z0: 0, z1: 3, spans: [[68, 87]] },
  { z0: 4, z1: 7, spans: [[64, 91]] },
  { z0: 8, z1: 11, spans: [[56, 95]] },
  { z0: 12, z1: 15, spans: [[52, 99]] },
  { z0: 16, z1: 19, spans: [[20, 27], [52, 99]] },
  { z0: 20, z1: 23, spans: [[8, 39], [48, 95]] },
  { z0: 24, z1: 27, spans: [[8, 91]] },
  { z0: 28, z1: 35, spans: [[8, 99]] },
  { z0: 36, z1: 47, spans: [[0, 99]] },
  { z0: 48, z1: 55, spans: [[0, 95]] },
  { z0: 56, z1: 59, spans: [[4, 95]] },
  { z0: 60, z1: 67, spans: [[12, 99]] },
  { z0: 68, z1: 79, spans: [[8, 95]] },
  { z0: 80, z1: 83, spans: [[8, 99]] },
  { z0: 84, z1: 87, spans: [[8, 95]] },
  { z0: 88, z1: 99, spans: [[12, 95]] },
  { z0: 100, z1: 103, spans: [[8, 95]] },
  { z0: 104, z1: 107, spans: [[4, 95]] },
  { z0: 108, z1: 111, spans: [[8, 91]] },
  { z0: 112, z1: 119, spans: [[8, 87]] },
  { z0: 120, z1: 123, spans: [[8, 91]] },
  { z0: 124, z1: 135, spans: [[8, 87]] },
  { z0: 136, z1: 139, spans: [[12, 87]] },
  { z0: 140, z1: 143, spans: [[12, 83]] },
  { z0: 144, z1: 147, spans: [[12, 71]] },
  { z0: 148, z1: 151, spans: [[16, 67]] },
];
/** True if the cell (x, z) lies inside the footprint mask (every shell is clipped to it). */
export const inFootprint = (x, z) => FOOTPRINT.some((b) => z >= b.z0 && z <= b.z1 && b.spans.some(([a, c]) => x >= a && x <= c));

// Palette: silver, purple, red, blue, gold, magenta shells
export const SILVER = "iron_block";                                       // silver body
export const SILVER_STAIRS = "polished_diorite_stairs";                   // silver curve steps and crown
export const SILVER_SLAB = "polished_diorite_slab";                       // silver crown slabs
export const SILVER_SHADOW = "light_gray_concrete";                       // silver fold shadow
export const PURPLE = "purple_concrete";                                  // purple drum body
export const PURPLE_STAIRS = "purpur_stairs";                             // purple rim and crown steps
export const PURPLE_SLAB = "purpur_slab";                                 // purple rim and crown slabs
export const PURPLE_STREAK = "magenta_concrete";                          // purple shimmer streaks and fold F4
export const RED = "red_concrete";                                        // red body (also the train stripe)
export const RED_STAIRS = "red_nether_brick_stairs";                      // red steps
export const RED_SLAB = "red_nether_brick_slab";                          // red slabs
export const RED_FOLD = "red_terracotta";                                 // red fold shadow
export const BLUE = "light_blue_concrete";                                // blue body and bridge lobe
export const BLUE_STAIRS = "smooth_quartz_stairs";                        // blue steps and crown (white glint)
export const BLUE_SLAB = "smooth_quartz_slab";                            // blue crown slabs
export const BLUE_FOLD = "light_blue_terracotta";                         // blue fold shadow
export const GOLD = "gold_block";                                         // gold body
export const GOLD_STAIRS = "bamboo_mosaic_stairs";                        // gold steps and crown
export const GOLD_SLAB = "bamboo_mosaic_slab";                            // gold crown slabs
export const GOLD_FOLD = "yellow_terracotta";                             // gold fold shadow
export const MAGENTA = "magenta_concrete";                                // magenta body
export const MAGENTA_STAIRS = "crimson_stairs";                           // magenta steps
export const MAGENTA_SLAB = "crimson_slab";                               // magenta slabs
export const MAGENTA_FOLD = "magenta_terracotta";                         // magenta fold shadow
// Glass, lobbies, paving
export const GLASS_PANE = "glass_pane";                                   // curtain walls
export const GLASS = "glass";                                             // bridge soffit strip
export const TRAIN_GLASS = "light_gray_stained_glass_pane";               // train windows
export const ANDESITE = "polished_andesite";                              // mullions, lobby floors, plaza paving, rooms floors
export const ANDESITE_SLAB = "polished_andesite_slab";                    // lobby roofs, kerbs, rooms slabs
export const ANDESITE_STAIRS = "polished_andesite_stairs";                // room stair flights
export const ANDESITE_WALL = "andesite_wall";                             // lamp posts, amphitheatre rails
// Monorail, train, doors, ground, planting, light
export const MONORAIL = "light_gray_concrete";                            // beams and T-pylon columns
export const WHITE = "white_concrete";                                    // train body and roof
export const GRAY = "gray_concrete";                                      // train door panels
export const BLACK = "black_concrete";                                    // train windscreen
export const DOOR = "birch_door";                                         // all doors
export const GROUND = "smooth_stone";                                     // ground course y 0
export const GROUND_SLAB = "smooth_stone_slab";                           // amphitheatre bottom step
export const GRASS = "grass_block";                                       // planting beds and garden
export const MOSS = "moss_block";                                         // grass patches
export const BIRCH_LOG = "birch_log";                                     // birch trunks
export const BIRCH_LEAVES = "birch_leaves";                               // birch crowns (persistent)
export const LANTERN = "lantern";                                         // lamps and hanging lights
export const SEA_LANTERN = "sea_lantern";                                 // ceiling lights set into floors

// Seeded PRNG (mulberry32): rng(seed)() in [0,1), the same sequence for the same seed
export function rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
