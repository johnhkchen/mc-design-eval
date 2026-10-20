// Shared constants for the Space Needle kit: palette block ids, site coordinates from plan.md, and a seeded rng.

// Block ids (palette.json only; the 1.21.1 names: no chain, no pale oak)
export const SMOOTH_QUARTZ = "smooth_quartz";                     // legs, ties, floors, roof steps, dome
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";       // leg steps, roof step rims, dome edge
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";           // pair and radial ties, halo hoops, table tops
export const WHITE_CONCRETE = "white_concrete";                   // core posts, band rings, mullions, halo fins, spire base
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";         // saucer underside soffit
export const GRAY_CONCRETE = "gray_concrete";                     // saucer throat
export const IRON_BARS = "iron_bars";                             // core lattice faces, halo mid rail
export const GLASS = "glass";                                     // elevator shafts, Pavilion wall
export const GLASS_PANE = "glass_pane";                           // deck rail
export const GRAY_STAINED_GLASS = "gray_stained_glass";           // SkyLine walls, restaurant wall
export const BLACK_STAINED_GLASS = "black_stained_glass";         // observation inner wall
export const GOLD_BLOCK = "gold_block";                           // elevator car
export const ORANGE_TERRACOTTA = "orange_terracotta";             // drum band (galaxy gold)
export const END_ROD = "end_rod";                                 // spire
export const SEA_LANTERN = "sea_lantern";                         // hidden lights, spire tip
export const SMOOTH_STONE = "smooth_stone";                       // ground
export const LADDER = "ladder";                                   // core ladder, facing north

// Site (plan.md): the full site is 64 x 260 x 64; the plot is inclusive x0..x1 / z0..z1
export const SITE = [64, 260, 64];
export const PLOT = { x0: 0, z0: 0, x1: 63, z1: 63 };
export const CENTRE = [32, 32];                                   // the tower's axis cell (x, z)
export const GROUND_Y = 0;                                        // smooth_stone ground
export const WALK_Y = 1;                                          // walk surface and the Pavilion floor
export const TOP_Y = 258;                                         // the spire's sea lantern tip
export const ENTRANCE = [32, 2, 16];                              // the Pavilion door's outside cell
export const STREET = [18, 1, 19];                                // the street, where the ramp starts

// Legs (LEG TABLE): pair angles from north clockwise, the R(y) profile, the leg top
export const LEG_ANGLES = { S: 180, NE: 60, NW: 300 };            // pair centre angles (degrees)
export const LEG_R = { feet: 22, waist: 8, waistY: 120, top: 14 }; // R(y): feet at y1, waist at waistY, top at y205
export const LEG_TOP_Y = 205;                                     // legs meet the saucer's underside here
export const LEG_TIE_Y = [13, 25, 37, 61, 73, 85, 97, 109, 121, 133, 145, 157, 169, 181, 193]; // pair ties
export const LEG_RADIAL_TIE_Y = [73, 97, 121, 145, 169, 193];     // radial ties from pair to core

// Core lattice and elevators: the 7 x 7 core and its north face
export const CORE = { x0: 29, z0: 29, x1: 35, z1: 35, y0: 1, y1: 222 };
export const CORE_DOORWAY_X = [31, 33];                           // doorway cells x31..33 at z29
export const CORE_LADDER = [32, 34];                              // ladder cell (x, z); climbs y2..221
export const ELEVATOR_Z = [27, 28];                               // shaft cells on the north face
export const ELEVATOR_SHAFTS_X = [[29, 30], [34, 35]];            // x of the two glass shafts
export const ELEVATOR_CAR = { x0: 34, x1: 35, z0: 27, z1: 28, y0: 150, y1: 152 }; // gold car, written last
export const LADDER_HOLES = [[32, 34, 42], [32, 34, 212], [32, 34, 218]]; // [x, z, y] ladder holes in floors

// Pavilion (ticket hall): disc r<=14, glass wall y2..7, roof disc r<=15 at y8
export const PAVILION = { r: 14, roofR: 15, floorY: 1, glassY0: 2, glassY1: 7, roofY: 8 };
export const PAVILION_DOOR = { x0: 31, x1: 33, z: 18, y0: 2, y1: 4 }; // main door, north
export const PAVILION_BOX = [19, 2, 19, 45, 7, 45];               // inner air of the ticket hall

// Roofs and the crown: the stepped saucer roof, drum, dome and spire
export const ROOF = {
  pavilionY: 8,                                                   // Pavilion roof disc
  skylineY: 48,                                                   // SkyLine roof
  stepsY: [223, 224, 225, 226], stepsR: [22, 20, 18, 16],         // saucer roof steps (r per level)
  drumY0: 227, drumY1: 229, drumR: 12,                            // drum disc, orange band y228..229
  domeBaseY: 230, domeApexY: 235, domeR: 12,                      // shallow dome
  spireY0: 236, spireY1: 258,                                     // spire from base to sea lantern tip
};

// SkyLine (hexagon, 30 m): the soffit, floor, glass walls and roof
export const SKYLINE = { soffitY: 41, floorY: 42, wallY0: 43, wallY1: 47, roofY: 48, apothem: { soffit: 15, floor: 16, wall: 13 } };
export const SKYLINE_BOX = [18, 43, 20, 46, 47, 44];              // inner air of the event hall

// Saucer and halo: the throat, the underside cone, the restaurant, the deck and the halo
export const SAUCER = {
  throatY0: 196, throatY1: 204, undersideY0: 205, undersideY1: 211, // cone: r 14 at y205 to r 27.7 at y211
  floorY: 212, restaurantY0: 213, restaurantY1: 217,                 // restaurant r<=23 inside glass at r=24
  deckFloorY: 218, observeY0: 219, observeY1: 222,                   // deck floor r<=27; inner glass at r=21
  haloR0: 28, haloR1: 30, haloY0: 212, haloY1: 222,                  // halo fins and hoops
  doorwayCutsY: [213, 219],                                        // doorway cuts through the floors
};
export const RESTAURANT_BOX = [9, 213, 9, 55, 217, 55];           // inner air of The Loupe
export const OBSERVATION_BOX = [12, 219, 12, 52, 222, 52];        // inner air of the observation deck
export const OUTDOOR_DECK_BOX = [5, 219, 5, 59, 222, 59];         // ring r22..27, open sky

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
