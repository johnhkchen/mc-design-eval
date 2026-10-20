// Shared constants for the Ferry Building kit: palette block ids (palette.json only), site coordinates from plan.md, and a seeded rng.

// Ground and flat decks
export const SMOOTH_STONE = "smooth_stone";                              // ground course y 0 and flat decks
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";                    // grey bay-side sills, ground slab
// Front wall and white stone (land front, pavilion, tower)
export const CALCITE = "calcite";                                        // land-front walls, upper wall, frieze
export const SMOOTH_QUARTZ = "smooth_quartz";                            // pavilion and tower body, trim, string courses
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";                  // sills, string courses, balustrade rail
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";              // voussoir rings, verges, dome ring
export const QUARTZ_STAIRS = "quartz_stairs";                            // cornices (upside down), lantern cornice
export const QUARTZ_SLAB = "quartz_slab";                                // cap courses
export const QUARTZ_PILLAR = "quartz_pillar";                            // pilasters, columns, balustrade posts, finial
export const QUARTZ_BRICKS = "quartz_bricks";                            // quoins, keystones, pilaster caps
export const DIORITE_WALL = "diorite_wall";                              // balusters
// Grey bay side
export const POLISHED_ANDESITE = "polished_andesite";                    // plinth, bay walls, gables, nave floor
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";      // nave-end coping
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";          // grey slabs
export const STONE_BRICKS = "stone_bricks";                              // bay-side pilasters, plinth detail
export const STONE_BRICK_STAIRS = "stone_brick_stairs";                  // bay-side cornice course
export const STONE_BRICK_WALL = "stone_brick_wall";                      // nave gallery railings
export const ANDESITE_WALL = "andesite_wall";                            // bay-side parapet
// Roofs
export const DEEPSLATE_TILES = "deepslate_tiles";                        // roof covering
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";            // nave slope, hip stairs
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";                // half courses on the slope
export const POLISHED_DEEPSLATE = "polished_deepslate";                  // monitor ribs, ridge, beams
export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs";
export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";                // interior trusses
// Glass and doors
export const GLASS = "glass";                                            // skylight roof and walls
export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";        // windows (reads dark, like the photo)
export const DARK_OAK_DOOR = "dark_oak_door";                            // both halves
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";                    // shelves, hatches
// Clock, light, flag, bell, stalls, ladder
export const WHITE_CONCRETE = "white_concrete";                          // clock dials
export const BLACK_CONCRETE = "black_concrete";                          // bezels, hour marks, hands
export const GLOWSTONE = "glowstone";                                    // behind each dial
export const LANTERN = "lantern";                                        // hanging and standing lights
export const CHAIN = "chain";                                            // hangs lanterns (1.21.1 name; not iron_chain)
export const SEA_LANTERN = "sea_lantern";                                // monitor ribs if needed
export const END_ROD = "end_rod";                                        // flag finial
export const IRON_BARS = "iron_bars";                                    // flagpole
export const WHITE_WOOL = "white_wool";                                  // flag
export const RED_WOOL = "red_wool";                                      // flag
export const BLUE_WOOL = "blue_wool";                                    // flag
export const SPRUCE_SLAB = "spruce_slab";                                // stall counters
export const BARREL = "barrel";                                          // stall bases, room furniture
export const BELL = "bell";                                              // belfry bell
export const LADDER = "ladder";                                          // tower shaft ladder

// Site (plan.md): the full site is 102 x 105 x 80 blocks, x 0..101, y 0..104, z 0..79
export const SITE = [102, 105, 80];
export const GROUND_Y = 0;                                               // ground course
export const WALK_Y = 1;                                                 // floor level people stand on (y 1)
// Plots, inclusive x0..x1, z 0..79, with the highest block y1
export const PLOTS = {
  plot0: { x0: 0, x1: 47, z0: 0, z1: 79, maxY: 104 },                    // clock tower, entrance pavilion, bay hall
  plot1: { x0: 48, x1: 63, z0: 0, z1: 79, maxY: 38 },                    // wing section (tiles every 16 along x)
  plot2: { x0: 64, x1: 101, z0: 0, z1: 79, maxY: 42 },                   // east end pavilion, corner block, bay hall
};
export const CENTRE_X = 23;                                              // plot 0 axis: pavilion, tower, gable, dial
export const TOWER_X = [16, 30];                                         // tower shaft x (15 wide)
export const TOWER_Z = [1, 15];                                          // tower shaft z
export const NAVE_Z = [15, 63];                                          // nave z span (open hall)
export const BAY_Z = [64, 78];                                           // bay-side bar z span (grey)
export const ENTRANCE = [23, 1, -1];                                     // street cell in front of the entrance (rooms.json)
// Room inner air boxes [x0, y0, z0, x1, y1, z1] (rooms.json)
export const ROOM_BOXES = {
  arcadeWalk: [48, 1, 5, 63, 11, 8],                                     // arcade walk (plot 1)
  entranceHall: [11, 1, 3, 35, 21, 14],                                  // entrance hall
  navemarket: [48, 1, 15, 63, 36, 63],                                   // nave marketplace (plot 1)
  bayHall: [65, 1, 65, 99, 32, 77],                                      // bay hall (plot 2)
  clockRoom: [17, 57, 2, 29, 69, 14],                                    // clock room
};

// A seeded rng: rng(seed)() returns a float in [0, 1), the same sequence for the same seed
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
