// Site constants, palette names and a seeded rng for the National Gallery of Art (plan.md). Every block id here is in
// palette.json (1.21.1 names: chain, not iron_chain); every coordinate is the plot frame of plan.md and the brief.

// ---- site ------------------------------------------------------------------------------------------------------------
export const SIZE = [154, 35, 40];                    // the full site: x 0..153, y 0..34 (the brief's ceiling), z 0..39
export const PLOT0 = { x0: 0, x1: 100, z0: 0, z1: 39 };     // West Building plot; GROUND_ROWS_0 is its height map
export const PLOT1 = { x0: 105, x1: 153, z0: 0, z1: 33 };   // East Building plot; GROUND_ROWS_1 is its height map
export const AXIS_X = 50;                             // West Building's axis: every mass is symmetric about x 50
export const LAMP_EVERY = 10;                         // lamp post every 10 blocks along the walks round both buildings

// Ground height above y 0, one character per cell (rows run along z, columns along x). A digit is the y of the grass
// block; "." is y 0. Cells outside both plots have no ground (x 101..104 is the gap).
export const GROUND_ROWS_0 = [
  "..........................1..............................................1111111111110000001.........",
  ".........1111111111111111111.............................................1111111111111111111.........",
  ".........1111111111111111111.............................................1111111111111111111.........",
  ".........1111111111111111111.............................................1111111111111111111.........",
  ".........1111111111111111111...............111111111111111...............1111111111111111111.........",
  ".........1111111111111111111...............111111111111111...............1111111111111111111.........",
  ".........1111111111111111111...............111111111111111...............1111111111111111111.........",
  ".........1111111111111111111...............111111111111111...............1111111111111111111.........",
  ".........1111111111111111111...............11111111111111111111.....111111111111111111111111111111111",
  ".111....111111111111111111111111111111111111112222222221111111111111111111111111111111111111111111111",
  "11111111111111111111111111111111111111111111222222222222221111111111111111111111111111111111111111111",
  "11111111111111111111111111111111111111222222222222222222222222111111111111111111111111111111111111111",
  "11111111222111111222222211111122222222222222222222222222222222222222111111111111111111111111111111221",
  ".1112222222222222222222222222222222222222222222222222222222222222222222111111111111111111111111122222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222221111111111111111111111222222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222211111111111111111112222222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222111111111111111122222222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222221111111111111222222222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222222211111111112222222222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222222222211111222222222222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222221",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222111",
  ".2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222221111",
  ".1111112222222222222222222222222222222222222222223332222222222222222222222222222222222222222222211111",
  ".11111112222222222222222222222222222222222222223333333322222222222222222222222222222222222222........",
  ".111111122222222222222222222................22333333333322................2222222222222222111........",
  ".........2222222222222222222................23333333333332................2222222222222211111........",
  ".........2222222222222222222................33333333333333................2222222222222111111........",
  ".........2222222222222222222................33333333333333................2222222222221111111........",
  ".........2222222222222222222................33333333333333................2222222222211111111........",
  ".........2222222222222222222................33334444333333................2222222221111111111........",
  ".........2222222222222222222..............................................2222222211111111111........",
  ".........2222222222222222222..............................................2222211111111111111........",
  ".........2222222222211112222.........................................................................",
];
export const GROUND_ROWS_1 = [
  "0................................................",
  "0000.............................................",
  "0000000..........................................",
  "0000000000.......................................",
  "0000000000000....................................",
  "0000000000000000.................................",
  "0000000000000000000..............................",
  "0000000000000000000000...........................",
  "0000000000000000000000000........................",
  "0000000000000000000000000000.....................",
  "0000000000000000000000000000011..................",
  "0000000000000000000000000000011000...............",
  "0000000000000000000000000000000000000............",
  "0000000000000000000000000000000000000000.........",
  "0000000000000000000000000000000000000000000......",
  "00000000000000000000000000000000000000000........",
  "00000000000000000000000000000000000000..........0",
  "00000000000000000000000000000000000...........000",
  "000000000000000000000000000000000..........000000",
  "00000000000000000000000000000000000.....000000000",
  "0000000000000000000000000000000000000000000000000",
  "0000000000000000000000000000000000000000000000000",
  "0000000000000000000000000000000000000000000000000",
  "0000000000000000000000000000000000000000000000000",
  "0000000111110000000000000000000000000000000000000",
  "0000001111111000000000000000000000000000000000000",
  "0000011111111000000000000000000000000000000000000",
  "000001111..11100000000000000000000000000000000000",
  "000011.....11000000000000000000000000000000000000",
  "000........11000000000000000000000000000000000000",
  "0..........10000000000000000000000000000000000000",
  "........11100000000000000000000000000000000000000",
  ".....1000000000000000000000000000000000000...0000",
  "...000000000000000000000000000000000000000......0",
];

// ---- West Building (plot 0) ------------------------------------------------------------------------------------------
export const WEST = {
  spine: { x0: 1, x1: 99, z0: 9, z1: 30, y0: 4, y1: 14 },        // the wings: cornice y 12, attic y 13..14, coping y 15
  pavilionW: { x0: 9, x1: 27, z0: 1, z1: 38, y0: 4, y1: 14 },    // projects 8 north and 8 south of the spine
  pavilionE: { x0: 73, x1: 91, z0: 1, z1: 38, y0: 4, y1: 14 },   // mirror of pavilionW
  central: { x0: 40, x1: 60, z0: 9, z1: 30, y0: 4, y1: 17 },     // raised attic y 13..16, coping y 17; carries the drum
  porticoN: { x0: 42, x1: 58, z0: 3, z1: 8, y0: 4, y1: 16 },     // 8 columns at z 4, pediment over
  porticoS: { x0: 42, x1: 58, z0: 31, z1: 36, y0: 4, y1: 16 },   // 8 columns at z 35, pediment over
  stepsN: { x0: 41, x1: 59, z0: 0, z1: 2, y0: 2, y1: 3 },        // half-steps down to Constitution Ave
  stepsS: { x0: 41, x1: 59, z0: 37, z1: 39, y0: 2, y1: 3 },      // half-steps down to the Mall
  drum: { x: 50, z: 19, r: 7, y0: 18, y1: 20 },                  // drum wall ring r 7; cornice ring r 8 at y 21
  dome: { x: 50, z: 19, y0: 21, y1: 24, lantern: 25, top: 26 },  // stepped dome rings (r 7 at y 21 down to r 4 at y 24)
  deckY: 13,                                                     // West spine and pavilion decks (bottom slabs)
  doorX: [49, 51],                                               // north and south main doors, y 4..8
};
export const WEST_LEVEL = { floor: 3, walk: 4, wallTop: 10, frieze: 11, cornice: 12, deck: 13, coping: 15, centralTop: 17 };

// ---- East Building (plot 1) ------------------------------------------------------------------------------------------
export const EAST = {
  bodyTop: 12, bodyCap: 13, coping: 14,                          // body walls y 0..12, calcite course 13, coping 14
  towerTop: 19, towerCoping: 20,                                 // towers y 0..19, coping 20 (6 above the body roof)
  slot: { x0: 108, x1: 110, z0: 13, z1: 18, y0: 0, y1: 4 },      // entrance slot, empty; tinted glass back at x 111
  recess: { x0: 105, x1: 107, z0: 9, z1: 21 },                   // west recess (the H between the towers), paving at y 0
  wedge: { z0: 27, z1: 33 },                                     // open wedge slot ending in the prow; paving at y 0
  atrium: { x0: 114, x1: 135, z0: 9, z1: 23, y0: 1, y1: 13 },    // atrium court under the glass space frame (y 14)
  atriumGlass: 14,                                               // space frame glass course; ribs at y 14, lifts to y 15
};

// ---- palette names (palette.json ids only) ---------------------------------------------------------------------------
export const WHITE_TERRACOTTA = "white_terracotta";            // marble body, both buildings
export const CALCITE = "calcite";                              // upper courses, frieze, attic, East coping, tympanum
export const SMOOTH_QUARTZ = "smooth_quartz";                  // West trim: cornice, pilasters, base course, surrounds
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";    // West cornice ring, upside down, facing out
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";        // West coping, step treads, stepped edges
export const QUARTZ_SLAB = "quartz_slab";                      // alternate trim slab
export const QUARTZ_PILLAR = "quartz_pillar";                  // West portico columns, axis y
export const POLISHED_GRANITE = "polished_granite";            // West podium and plinth
export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs"; // podium step flanks
export const POLISHED_GRANITE_SLAB = "polished_granite_slab";  // podium step flanks, slab form
export const WEATHERED_CUT_COPPER = "weathered_cut_copper";    // dome and lantern
export const WEATHERED_CUT_COPPER_STAIRS = "weathered_cut_copper_stairs"; // dome ring edges, facing out
export const WEATHERED_CUT_COPPER_SLAB = "weathered_cut_copper_slab";     // lantern cap
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";          // roof decks (bottom type only)
export const GLASS = "glass";                                  // skylight strips and atrium panes
export const LIGHT_GRAY_STAINED_GLASS = "light_gray_stained_glass"; // raised middle row of the West skylights
export const GLASS_PANE = "glass_pane";                        // oculus sides, raised atrium pyramid cells
export const SMOOTH_STONE = "smooth_stone";                    // West skylight frame ribs
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";      // East atrium ribs
export const GRAY_STAINED_GLASS = "gray_stained_glass";        // East dark window bands
export const TINTED_GLASS = "tinted_glass";                    // recess backs of the doorways
export const PEARLESCENT_FROGLIGHT = "pearlescent_froglight";  // hidden floor light, flush
export const SHROOMLIGHT = "shroomlight";                      // warm uplights at the bases
export const LANTERN = "lantern";                              // hanging and post lamps
export const CHAIN = "chain";                                  // hanging-lamp chain, axis y (1.21.1 name for iron_chain)
export const OAK_FENCE = "oak_fence";                          // lamp post shaft
export const COBBLESTONE_WALL = "cobblestone_wall";            // alternate lamp post shaft
export const GRASS_BLOCK = "grass_block";                      // lawn: the ground's top course
export const SMOOTH_SANDSTONE = "smooth_sandstone";            // walks and the East plaza
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";  // walk edges, slab form
export const DIRT_PATH = "dirt_path";                          // worn walk paths

// ---- rng -------------------------------------------------------------------------------------------------------------
/** A seeded rng(seed) (mulberry32): returns a function giving floats in [0, 1), the same sequence for the same seed. */
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

/** The ground's height above y 0 at (x, z) (0 for "."), or null outside both plots. */
export function groundAt(x, z) {
  for (const [rows, p] of [[GROUND_ROWS_0, PLOT0], [GROUND_ROWS_1, PLOT1]]) {
    if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue;
    const ch = rows[z - p.z0][x - p.x0];
    return ch === "." ? 0 : Number(ch);
  }
  return null;
}
