// Shared constants for the Pacific Science Center kit: palette block ids, site coordinates from plan.md, and a seeded rng.

// Block ids (palette.json only; 1.21.1 names)
export const WHITE_CONCRETE = "white_concrete";                   // wall panels and bodies
export const QUARTZ_PILLAR = "quartz_pillar";                     // ribs, piers, finials (axis y)
export const SMOOTH_QUARTZ = "smooth_quartz";                     // arches, crowns, plinths, string courses, pool rims
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";       // arch curves, shoulders, fork steps
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";           // walks, decks, coping, lattice nodes
export const CALCITE = "calcite";                                 // recess backs (shadow tone)
export const END_ROD = "end_rod";                                 // arch lattice runs, lamp lines
export const DIORITE_WALL = "diorite_wall";                       // promenade railings
export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane"; // glazing
export const IRON_DOOR = "iron_door";                             // door pairs
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";         // roof deck (hidden); helix rungs
export const LANTERN = "lantern";                                 // hung lamps
export const CHAIN = "chain";                                     // lamp chains (1.21.1 name)
export const SEA_LANTERN = "sea_lantern";                         // dome porch soffit
export const WATER = "water";                                     // pool and fountain water
export const IRON_BLOCK = "iron_block";                           // helix strands
export const BLUE_BANNER = "blue_banner";                         // accent banners (standing)
export const WHITE_BANNER = "white_banner";                       // banner letters (standing)
export const BLUE_WALL_BANNER = "blue_wall_banner";               // accent banners (on a wall)
export const WHITE_WALL_BANNER = "white_wall_banner";             // banner letters (on a wall)
export const BIRCH_LOG = "birch_log";                             // tree trunks
export const BIRCH_LEAVES = "birch_leaves";                       // tree crowns (persistent)
export const GRASS_BLOCK = "grass_block";                         // planting beds
export const SMOOTH_STONE = "smooth_stone";                       // the given ground layer at y 0

// Site (plan.md): the plot is x 0..144, z 0..177, y 0..50 (inclusive); the grid is that size
export const SITE = [145, 51, 178];
export const PLOT = { x0: 0, z0: 0, x1: 144, z1: 177, y1: 50 };
export const GROUND_Y = 0;                                        // smooth_stone ground
export const WALK_Y = 1;                                          // walk surface (every building's ground floor)
export const ENTRANCE = [39, 1, 46];                              // main entrance outside cell (west face of B)

// Masses (inclusive boxes [x0, y0, z0, x1, y1, z1]): tall blocks and low wings
export const MASS = {
  N1: [84, 1, 0, 131, 28, 23],                                    // north block (tall lattice box)
  N1_STAIR_BAY: [80, 1, 8, 83, 19, 15],                           // low entry and stair bay, N1's west side
  B: [40, 1, 24, 143, 28, 51],                                    // main tall block; west face x 40 fronts the plaza
  B_PRIME: [40, 1, 52, 135, 28, 59],                              // tall block stepped back east
  B2: [40, 1, 60, 131, 20, 75],                                   // courtyard-north wing (low)
  E: [60, 1, 76, 131, 20, 159],                                   // east wing (low)
  S: [0, 1, 160, 131, 20, 171],                                   // south wing (low)
  S_TAIL: [0, 1, 172, 59, 20, 175],                               // south tail
  S_TAIL_END: [0, 1, 176, 55, 20, 177],                           // south tail end
  W_STUB: [0, 1, 140, 3, 20, 159],                                // west-wing stub at the plot edge
};

// Roof levels: tall blocks deck at 26 (coping 27, rib finials 28); low wings deck at 18 (coping 19, finials 20)
export const ROOF_Y = { tallDeck: 26, tallCoping: 27, tallTop: 28, lowDeck: 18, lowCoping: 19, lowTop: 20 };

// Promenade decks (elevated walkways, floor y 10, railing y 11)
export const PROMENADE = {
  E: [57, 10, 76, 59, 10, 156],                                   // east deck, columns at x 59, z 80+8k
  S: [4, 10, 157, 59, 10, 159],                                   // south deck, columns at z 157, x 8+8k
  stair: [52, 1, 148, 53, 10, 156],                               // promenade stair (side flight, not the main way in)
};

// Courtyard: pools (water 1 deep at y 1, rim smooth_quartz), fountain bowls, helix, walks
export const POOLS = {
  NW: [8, 82, 29, 110],                                           // [x0, z0, x1, z1], rim included
  NE: [34, 82, 55, 110],
  SW: [8, 115, 29, 152],
  SE: [34, 115, 55, 152],
};
export const FOUNTAINS = {
  NW: { cx: 16, cz: 103, box: [14, 1, 101, 18, 4, 105] },         // pedestal, saucer and water source at y 4
  SW: { cx: 17, cz: 143, box: [15, 1, 141, 19, 4, 145] },
  SE: { cx: 46, cz: 143, box: [44, 1, 141, 48, 4, 145] },
};
export const HELIX = [45, 1, 102, 47, 12, 104];                   // double helix in the NE pool
export const WALK = {
  central_ns: [30, 1, 76, 33, 1, 159],                            // central N-S walk under the tallest arch
  central_ew: [4, 1, 111, 59, 1, 114],                            // central E-W walk
};

// Arches A1..A5 (arch plane = x-y). Legs are 2x2 at the listed corners; straight to `springY`, ribs above it.
export const ARCHES = {
  A1: { box: [24, 1, 100, 38, 47, 109], legs: [[24, 100], [37, 100], [24, 108], [37, 108]], springY: 30, crownY: 47 },
  A2: { box: [8, 1, 86, 20, 41, 93], legs: [[8, 86], [19, 86], [8, 92], [19, 92]], springY: 26, crownY: 41 },
  A3: { box: [42, 1, 86, 54, 41, 93], legs: [[42, 86], [53, 86], [42, 92], [53, 92]], springY: 26, crownY: 41 },
  A4: { box: [10, 1, 124, 23, 44, 131], legs: [[10, 124], [22, 124], [10, 130], [22, 130]], springY: 28, crownY: 44 },
  A5: { box: [40, 1, 124, 53, 44, 131], legs: [[40, 124], [52, 124], [40, 130], [52, 130]], springY: 28, crownY: 44 },
};

// Lamp posts every 8 along the walks; the lamp-post columns of the promenade
export const LAMP_POST_X = [5, 30, 33];                           // x of the lamp-post lines (z 80..156, every 8)

// IMAX dome: centre (19.5, 35.5), drum y 1..5 (r 18), hemisphere to a 3x3 cap at y 23
export const DOME = { cx: 19.5, cz: 35.5, drumR: 18, drumY1: 5, capY: 23, box: [2, 1, 18, 37, 23, 53] };
export const DOME_PORCH = [17, 1, 54, 22, 5, 56];                 // flat-roofed porch on the dome's south side
export const DOME_ENTRANCE = [18, 1, 53, 21, 3, 54];              // dome entrance through the porch

// Openings the shell leaves as air (inclusive boxes), so later parts can fill them
export const OPENINGS = {
  main_entrance: [40, 1, 45, 40, 3, 48],                          // west x 40, 4 wide, iron door pairs
  b_second_entrance: [40, 1, 30, 40, 2, 31],
  n1_north_door: [106, 1, 0, 109, 3, 0],
  n1_stair_bay_door: [80, 1, 11, 80, 2, 12],
  e_loggia_doors: [[63, 1, 89, 63, 2, 90], [63, 1, 113, 63, 2, 114], [63, 1, 137, 63, 2, 138]],
  s_loggia_doors: [[14, 1, 163, 15, 2, 163], [30, 1, 163, 31, 2, 163], [46, 1, 163, 47, 2, 163]],
  b2_loggia_door: [49, 1, 72, 50, 2, 72],
  promenade_doors: [[60, 11, 101, 60, 12, 102], [60, 11, 125, 60, 12, 126], [22, 11, 160, 23, 12, 160], [38, 11, 160, 39, 12, 160]],
  e_service_door: [131, 1, 116, 131, 2, 117],
};

// Stairs between floors (plan.md): N1 stair bay, B (lobby to upper floors), E wing
export const STAIRS = {
  n1_bay: [80, 1, 8, 83, 19, 15],
  b_main: [41, 1, 25, 44, 25, 34],                                // x 41..44 z 25..34, west wall
  e_wing: [128, 1, 77, 130, 19, 90],
  promenade: PROMENADE.stair,
};

// Room boxes (inner air, inclusive): the interior designers' rooms, from rooms.json
export const ROOM_BOX = {
  lobby: [41, 1, 25, 142, 9, 50],                                 // main lobby and exhibit hall
  b_upper: [41, 11, 25, 142, 17, 50],                             // B upper exhibit floor
  planetarium: [41, 19, 25, 134, 25, 58],                         // planetarium and labs
  n1_hall: [85, 1, 1, 130, 9, 22],                                // N1 north hall
  e_exhibit: [64, 1, 77, 130, 9, 158],                            // E wing exhibit halls
  e_upper: [61, 11, 77, 130, 17, 158],                            // E wing upper halls
  s_halls: [1, 1, 164, 130, 9, 170],                              // S wing halls
  imax: [3, 1, 19, 36, 22, 52],                                   // IMAX theatre
};

// A seeded rng: rng(seed)() returns a float in [0, 1), the same sequence for the same seed (mulberry32)
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
