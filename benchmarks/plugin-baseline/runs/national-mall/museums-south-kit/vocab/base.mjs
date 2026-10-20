// Site coordinates, palette and helpers for the museums-south-kit build (plan.md). Kit frame: north = low z, east = high
// x, y 0 = the lowest ground. A cell with ground value g has its ground block at y g; you stand at g + 1.
// Every block id below is in palette.json. Parts import from here and need no numbers from plan.md.
// NOTE: the grid starts at y 0, so the pond bed at y -1 (NMAI_POND) cannot be placed; its water at y 0 has no bed.

// ---- grid and plots ----
export const SITE_SIZE = [140, 30, 31];                                  // grid: x 0..139, y 0..29, z 0..30
export const NASM_BOX = { x0: 0, x1: 87, z0: 0, z1: 30, cap: 20 };       // plot 0, National Air and Space Museum
export const NMAI_BOX = { x0: 92, x1: 139, z0: 0, z1: 28, cap: 29 };     // plot 1, National Museum of the American Indian
export const NASM_AXIS_X = 43.5;                                         // NASM's symmetry axis (x)

// ---- NASM masses (inclusive cell ranges) ----
export const NASM_PLINTH_Y = 1;                                          // plinth and ground floor block y (stand at y 2)
export const NASM_CUBES = [                                              // marble cubes: walls y 2..10, coping y 11
  { x0: 2, x1: 14, y0: 2, y1: 11, z0: 4, z1: 26 },                       // C1 (west)
  { x0: 25, x1: 37, y0: 2, y1: 11, z0: 4, z1: 26 },                      // C2
  { x0: 50, x1: 62, y0: 2, y1: 11, z0: 4, z1: 26 },                      // C3
  { x0: 73, x1: 85, y0: 2, y1: 11, z0: 4, z1: 26 },                      // C4 (east)
];
export const NASM_BAYS = [                                               // glass bays: curtain y 2..8, roof glass y 9
  { x0: 15, x1: 24, y0: 2, y1: 9, z0: 5, z1: 25 },                       // G1
  { x0: 38, x1: 49, y0: 2, y1: 9, z0: 6, z1: 24 },                       // G2, central entrance bay (2 behind the cubes)
  { x0: 63, x1: 72, y0: 2, y1: 9, z0: 5, z1: 25 },                       // G3
];
export const NASM_DOORS = {                                              // entrance door cells (iron_door pairs), y 2..3
  north: { x0: 42, x1: 45, y0: 2, y1: 3, z: 6 },
  south: { x0: 42, x1: 45, y0: 2, y1: 3, z: 24 },
};
export const NASM_SPIRE = { x: 35, z: 2, y0: 2, y1: 17 };                // Ad Astra spire: shaft to y 13, lightning rod to 17
export const NASM_TERRACES = [                                           // paving terraces at y 1: west, Ad Astra, east forecourt
  { x0: 0, x1: 10, z0: 2, z1: 3 },
  { x0: 26, x1: 36, z0: 1, z1: 3 },
  { x0: 51, x1: 87, z0: 1, z1: 3 },
];

// ---- NMAI masses (E(cx, cz, rx, rz) ellipses, see inEllipse; inclusive y ranges) ----
export const NMAI_TIERS = [                                              // stacked curved tiers, each a different ellipse
  { name: "T1", cx: 111, cz: 10, rx: 15, rz: 8, y0: 1, y1: 4 },         // ground storey; east doors at its east edge
  { name: "T2", cx: 111, cz: 10, rx: 16, rz: 9, y0: 5, y1: 8 },         // overhangs T1 by 1 all round
  { name: "T3", cx: 112, cz: 10, rx: 13, rz: 7, y0: 9, y1: 11 },        // steps back on west, north and south
  { name: "T4", cx: 110, cz: 10, rx: 10, rz: 6, y0: 12, y1: 13 },       // top tier, under the dome
];
export const NMAI_LOBES = [                                              // east entrance lobes over the porch
  { cx: 126, cz: 10, rx: 5, rz: 4, y0: 5, y1: 8 },                       // T2 lobe, cantilevers 5 past T1
  { cx: 124, cz: 10, rx: 5, rz: 3, y0: 9, y1: 11 },                      // T3 lobe
];
export const NMAI_PORCH = { x0: 127, x1: 131, z0: 6, z1: 14 };           // open porch under the lobes; floor at y 1
export const NMAI_PLAZA = { cx: 134, cz: 10, rx: 5, rz: 5 };             // east plaza ellipse, paving at y 1
export const NMAI_DOME = { cx: 110, cy: 14, cz: 10, r: 5 };              // Potomac dome: drum at y 14, crown y 16
export const NMAI_OCULUS = { x0: 109, x1: 111, y: 16, z0: 9, z1: 11 };   // glass oculus in the dome crown
export const NMAI_DOOR = { x: 125, y0: 2, y1: 3, z0: 8, z1: 11 };        // east entrance door cells (two pairs)
export const NMAI_POND = { cx: 99, cz: 22, rx: 5, rz: 2 };               // pond ellipse, on ground-0 cells only
export const NMAI_BOULDERS = [                                           // grandfather rocks: 2x2x2 from (x, z)
  { x: 132, z: 3 }, { x: 128, z: 14 }, { x: 106, z: 21 }, { x: 93, z: 26 },
];
export const NMAI_BIRCHES = [{ x: 95, z: 15 }, { x: 113, z: 22 }, { x: 121, z: 18 }];   // birch tree base cells

// ---- helpers ----
export const inEllipse = (x, z, cx, cz, rx, rz) => ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2 <= 1;   // plan's E(cx, cz, rx, rz) test for cell (x, z)
export function rng(seed) {                                              // seeded PRNG (mulberry32): call it for floats in [0, 1)
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- palette: every id is in palette.json (plan.md PALETTE) ----
// NASM
export const WHITE_TERRACOTTA = "white_terracotta";                       // NASM body: pink Tennessee marble
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";                  // NASM cube coping (bottom slab)
export const SMOOTH_STONE = "smooth_stone";                              // NASM roof deck field
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";                    // NASM roof deck (bottom slab)
export const POLISHED_GRANITE = "polished_granite";                      // NASM plinth, terraces, steps
export const POLISHED_GRANITE_SLAB = "polished_granite_slab";            // NASM terrace edges, entry steps (bottom slab)
export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs";        // NASM stairs (not on the main way)
export const GRANITE = "granite";                                        // NASM planter curbs; boulder mix
export const GRANITE_WALL = "granite_wall";                              // NASM lamp posts and curbs
export const GRAY_STAINED_GLASS = "gray_stained_glass";                  // NASM bay glass, walls and roofs
export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";        // NASM cockpit glass
export const POLISHED_BLACKSTONE = "polished_blackstone";                // NASM steel frames: mullions, transoms, sills
export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab";      // NASM roof grid and rim slabs
export const TINTED_GLASS = "tinted_glass";                              // NASM clerestory slot glass
export const IRON_DOOR = "iron_door";                                    // NASM entrance door pairs
export const DARK_OAK_DOOR = "dark_oak_door";                            // NMAI entrance door pairs
// aircraft and spire
export const WHITE_CONCRETE = "white_concrete";                          // aircraft fuselage, rocket body
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";                // aircraft nose, rocket fins
export const IRON_BLOCK = "iron_block";                                  // aircraft and rocket caps, spire shaft
export const IRON_TRAPDOOR = "iron_trapdoor";                            // aircraft wings (open false, top half)
export const IRON_CHAIN = "iron_chain";                                  // aircraft hangers (axis y)
export const RED_CONCRETE = "red_concrete";                              // one tail stripe; rocket band
export const LIGHTNING_ROD = "lightning_rod";                            // spire tip
export const END_ROD = "end_rod";                                        // spire burst
// NMAI
export const SANDSTONE = "sandstone";                                    // NMAI strata and base
export const SMOOTH_SANDSTONE = "smooth_sandstone";                      // NMAI strata, plaza, dome
export const CUT_SANDSTONE = "cut_sandstone";                            // NMAI strata, door frames, dome drum
export const ORANGE_TERRACOTTA = "orange_terracotta";                    // NMAI warm band (y 8)
export const YELLOW_TERRACOTTA = "yellow_terracotta";                    // NMAI weathered stone, sparse
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";            // NMAI step rings (bottom slab)
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";                  // NMAI dome-ring slab (y 14)
export const SANDSTONE_SLAB = "sandstone_slab";                          // NMAI slab variant
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";        // NMAI dome edges (cut_sandstone_stairs does not exist)
export const SANDSTONE_STAIRS = "sandstone_stairs";                      // NMAI stairs
export const BROWN_STAINED_GLASS = "brown_stained_glass";                // NMAI windows, slits, porch glass
export const LIGHT_GRAY_STAINED_GLASS = "light_gray_stained_glass";      // NMAI oculus
// ground and plants
export const GRASS_BLOCK = "grass_block";                                // ground surface (laid by build.mjs)
export const PODZOL = "podzol";                                          // wetland meadow patches
export const COARSE_DIRT = "coarse_dirt";                                // ground under the surface; meadow patches
export const GRAVEL = "gravel";                                          // wetland edges
export const DIRT_PATH = "dirt_path";                                    // NMAI north walk
export const WATER = "water";                                            // NMAI pond
export const LILY_PAD = "lily_pad";                                      // pond
export const SUGAR_CANE = "sugar_cane";                                  // pond rim
export const SHORT_GRASS = "short_grass";                                // meadow and planters
export const TALL_GRASS = "tall_grass";                                  // meadow
export const LARGE_FERN = "large_fern";                                  // meadow
export const AZURE_BLUET = "azure_bluet";                                // meadow
export const BLUE_ORCHID = "blue_orchid";                                // meadow near water
export const AZALEA = "azalea";                                          // NASM planters
export const FLOWERING_AZALEA = "flowering_azalea";                      // NASM planters
export const BIRCH_LOG = "birch_log";                                    // birch trunks (axis y)
export const BIRCH_LEAVES = "birch_leaves";                              // birch crowns (persistent true)
// boulders
export const TUFF = "tuff";                                              // grandfather rocks
export const ANDESITE = "andesite";                                      // grandfather rocks
// light
export const LANTERN = "lantern";                                        // lamp posts, porch and garden lights
export const PEARLESCENT_FROGLIGHT = "pearlescent_froglight";            // NASM glow floor
export const OCHRE_FROGLIGHT = "ochre_froglight";                        // NMAI dome and base floodlights
export const SEA_LANTERN = "sea_lantern";                                // under the pond

// ---- site maps: copied verbatim from brief.txt ('#' = build here; ground digits = g per cell; rows are z, columns x) ----
export const NASM_FOOTPRINT = [
  "....................................................................................####",
  "...........................##########..............#####################################",
  "###########...............###########..............#####################################",
  "###########...............##############################################################",
  "########################################################################################",
  "########################################################################################",
  "########################################################################################",
  "########################################################################################",
  "########################################################################################",
  "########################################################################################",
  "########################################################################################",
  "######################################################################################..",
  ".######################################################################################.",
  "..#####################################################################################.",
  "..#####################################################################################.",
  "..#####################################################################################.",
  "..#####################################################################################.",
  "..#####################################################################################.",
  "..######################################################################################",
  "..######################################################################################",
  ".#######################################################################################",
  ".#######################################################################################",
  ".#######################################################################################",
  ".#######################################################################################",
  ".#######################################################################################",
  ".#######################################################################################",
  ".#######################################################################################",
  ".##########################################################################..###########",
  ".###########..##########..###########...#########...###########..##########..###########",
  ".###########..##########..###########...#########...###########..########....#..........",
  ".###########............................................................................",
];
export const NASM_GROUND = [
  "....................................................................................0000",
  "...........................0000000000..............0000000000000000000000000000000000000",
  "11111111111...............00000000000..............0000000000000000000000000000000000000",
  "11111111111...............00000000000000000000000000000000000000000000000000000000000000",
  "1111111111111000000000000000000000000000000000000000000000000000000000000000000000000000",
  "1111111111111111111110000000000000000000000000000000000000000000000000000000000000000000",
  "1111111111111111111111000000000000000000000000000000000000000000000000000000000000000000",
  "1111111111111111111111000000000000000000000000000000000000000000000000000000000000000000",
  "1111111111111111111111000000000000000000000000000000000000000000000000000000000000000000",
  "1111111111111111111111000000000000000000000000000000000000000000000000000000000000000000",
  "1111111111111111111110000000000000000000000000000000000000000000000000000000000000000000",
  "11111111111111111111100000000000000000000000000000000000000000000000000000000000000000..",
  ".11111111111111111111000000000000000000000000000000000000000000000000000000000000000000.",
  "..1111111111111111110000000000000000000000000000000000000000000000000000000000000000000.",
  "..0111111111111111110000000000000000000000000000000000000000000000000000000000000000000.",
  "..0011111111111111110000000000000000000000000000000000000000000000000000000000000000000.",
  "..0011111111111111100000000000000000000000000000000000000000000000000000000000000000000.",
  "..0011111111111111100000000000000000000000000000000000000000000000000000000000000000000.",
  "..01111111111111110000000000000000000000000000000000000000000000000000000000000000000000",
  "..11111111111111110000000000000000000000000000000000000000000000000000000000000000000000",
  ".111111111111111100000000000000000000000000000000000000000000000000000000000000000000000",
  ".111111111111111000000000000000000000000000000000000000000000000000000000000000000000000",
  ".111111111111111000000000000000000000000000000000000000000000000000000000000000000000000",
  ".111111111111110000000000000000000000000000000000000000000000000000000000000000000000000",
  ".111111111111110000000000000000000000000000000000000000000000000000000000000000000000000",
  ".111111111111100000000000000000000000000000000000000000000000000000000000000000000000000",
  ".111111111111000000000000000000000000000000000000000000000000000000000000000000000000000",
  ".11111111111000000000000000000000000000000000000000000000000000000000000000..00000000000",
  ".11111111111..0000000000..00000000000...000000000...00000000000..0000000000..00000000000",
  ".11111111110..0000000000..00000000000...000000000...00000000000..00000000....0..........",
  ".11111111110............................................................................",
];
export const NMAI_FOOTPRINT = [
  "....#.....#...#..##..###..###########...........",
  "..########################################......",
  ".###########################################....",
  "#############################################...",
  "##############################################..",
  "###############################################.",
  "###############################################.",
  "################################################",
  "################################################",
  "################################################",
  "################################################",
  "################################################",
  "################################################",
  "#############################################...",
  "##########################################......",
  "########################################........",
  "##################################..............",
  "#################################...............",
  "###############################.................",
  "##########################......................",
  "########################........................",
  "######################..........................",
  "####################............................",
  "#################...............................",
  "#############...................................",
  "###########.....................................",
  "#########.......................................",
  "#####...........................................",
  "###.............................................",
];
export const NMAI_GROUND = [
  "....1.....1...1..11..111..00000000000...........",
  "..1111111111111111111111100000000000000111......",
  ".0011111111111111111111110000000000000011111....",
  "000001111111111111111111000000000000000111111...",
  "0000000011111111111111110000000000000001111111..",
  "00000000000011111111111000000000000000011111111.",
  "00000000000000011111110000000000000000111111111.",
  "000000000000000000000000000000000000001111111111",
  "000000000000000000000000000000000000001111111111",
  "000000000000000000000000000000000000001111111111",
  "000000000000000000000000000000000000011111111111",
  "000000000000000000000000000000000000011111111111",
  "000000000000000000000000000000000000011111111111",
  "000000000000000000000000000000000000111111111...",
  "000000000000000000000000000000000000111111......",
  "0000000000000000000000000000000000111111........",
  "0000000000000000000000000000111111..............",
  "000000000000000000000000000111111...............",
  "0000000000000000000000000011111.................",
  "00000000000000000000000000......................",
  "000000000000000000000000........................",
  "0000000000000000000000..........................",
  "00000000000000000000............................",
  "00000001111110000...............................",
  "0000011111111...................................",
  "00011111111.....................................",
  "001111111.......................................",
  "11111...........................................",
  "111.............................................",
];
export const SITE_MAPS = {
  nasm: { x0: NASM_BOX.x0, z0: NASM_BOX.z0, footprint: NASM_FOOTPRINT, ground: NASM_GROUND },
  nmai: { x0: NMAI_BOX.x0, z0: NMAI_BOX.z0, footprint: NMAI_FOOTPRINT, ground: NMAI_GROUND },
};
