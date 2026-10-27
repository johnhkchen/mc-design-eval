// Shared constants for every part: palette ids (palette.json), plan.md site coordinates, the GROUND map, a seeded rng.

// ---- palette (bare ids, exactly palette.json's; the build library adds minecraft:) ----
export const SMOOTH_SANDSTONE = "smooth_sandstone";                    // wall body (~60%)
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";      // wall body (~60%)
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";          // wall body (~60%)
export const CUT_SANDSTONE = "cut_sandstone";                          // dressed trim, jambs, string courses
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";                // dressed trim, jambs, string courses
export const CHISELED_SANDSTONE = "chiseled_sandstone";                // carved detail: tympana, kings, gargoyles, apexes
export const SANDSTONE = "sandstone";                                  // weathered accent (~10%, low courses, pier faces)
export const SANDSTONE_STAIRS = "sandstone_stairs";                    // weathered accent (~10%, low courses, pier faces)
export const SANDSTONE_SLAB = "sandstone_slab";                        // weathered accent (~10%, low courses, pier faces)
export const SANDSTONE_WALL = "sandstone_wall";                        // tracery, colonnettes, balustrades, pinnacle shafts
export const END_STONE_BRICKS = "end_stone_bricks";                    // light-stone accent: rose spokes, finials
export const END_STONE_BRICK_STAIRS = "end_stone_brick_stairs";        // light-stone accent: rose spokes, finials
export const END_STONE_BRICK_SLAB = "end_stone_brick_slab";            // light-stone accent: rose spokes, finials
export const END_STONE_BRICK_WALL = "end_stone_brick_wall";            // light-stone accent: rose spokes, finials
export const STONE_BRICKS = "stone_bricks";                            // plinth (stone_bricks + 1/10 cracked, smooth_stone top course)
export const CRACKED_STONE_BRICKS = "cracked_stone_bricks";            // plinth (stone_bricks + 1/10 cracked, smooth_stone top course)
export const SMOOTH_STONE = "smooth_stone";                            // plinth (stone_bricks + 1/10 cracked, smooth_stone top course)
export const STONE_BRICK_STAIRS = "stone_brick_stairs";                // plinth (stone_bricks + 1/10 cracked, smooth_stone top course)
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";                  // plinth (stone_bricks + 1/10 cracked, smooth_stone top course)
export const DEEPSLATE_TILES = "deepslate_tiles";                      // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)
export const POLISHED_DEEPSLATE = "polished_deepslate";                // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";          // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)
export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs";  // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";              // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)
export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";      // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)
export const IRON_BARS = "iron_bars";                                  // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)
export const DEEPSLATE_TILE_WALL = "deepslate_tile_wall";              // spire ribs and inner frame
export const POLISHED_DEEPSLATE_WALL = "polished_deepslate_wall";      // spire ribs and inner frame
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";          // spire ribs and inner frame
export const OXIDIZED_COPPER = "oxidized_copper";                      // apostles: copper body, slab head
export const OXIDIZED_CUT_COPPER_STAIRS = "oxidized_cut_copper_stairs"; // apostles: copper body, slab head
export const OXIDIZED_CUT_COPPER_SLAB = "oxidized_cut_copper_slab";    // apostles: copper body, slab head
export const BLUE_STAINED_GLASS_PANE = "blue_stained_glass_pane";      // lancet glass (blue 60 / purple 20 / red 20)
export const PURPLE_STAINED_GLASS_PANE = "purple_stained_glass_pane";  // lancet glass (blue 60 / purple 20 / red 20)
export const RED_STAINED_GLASS_PANE = "red_stained_glass_pane";        // lancet glass (blue 60 / purple 20 / red 20)
export const BLUE_STAINED_GLASS = "blue_stained_glass";                // rose glass: blue field, red/magenta ring, yellow eye
export const RED_STAINED_GLASS = "red_stained_glass";                  // rose glass: blue field, red/magenta ring, yellow eye
export const MAGENTA_STAINED_GLASS = "magenta_stained_glass";          // rose glass: blue field, red/magenta ring, yellow eye
export const YELLOW_STAINED_GLASS = "yellow_stained_glass";            // rose glass: blue field, red/magenta ring, yellow eye
export const BLACK_STAINED_GLASS_PANE = "black_stained_glass_pane";    // belfry panes behind open spruce trapdoors
export const SHROOMLIGHT = "shroomlight";                              // dusk light: shroomlight behind glass, ochre_froglight floodlights
export const OCHRE_FROGLIGHT = "ochre_froglight";                      // dusk light: shroomlight behind glass, ochre_froglight floodlights
export const DARK_OAK_DOOR = "dark_oak_door";                          // doors (both halves)
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";                      // belfry louvres (open)
export const LANTERN = "lantern";                                      // standing and hanging lanterns
export const LIGHTNING_ROD = "lightning_rod";                          // rooster tip at (94,137,38)
export const END_ROD = "end_rod";                                      // spire mast and cross arms

// ---- site (plan.md SITE) ----
export const SITE_SIZE = [189, 140, 111];                            // plot 0: x 0..188, y 0..139, z 0..110
export const FLOOR_Y = 3;                                            // interior floor and plinth top everywhere
export const AXIS_Z = 38;                                            // nave axis; north mirrors south about it
export const mirrorZ = (z) => 76 - z;                                // z(north) = 76 - z(south)
export const CELL = 5;                                               // footprint/GROUND cell size (col c = x 5c..5c+4)
export const WEST_FRONT_X = 2;                                       // west front plane (towers x 2..22)
export const CHEVET_CENTRE = [152, 38];                              // apse polar centre C (x, z); chevet at x >= 152
export const CROSSING_X = 94;                                        // transept axis / R2 ridge row
export const SPIRE_BOX = { from: [90, 48, 34], to: [98, 137, 42] };  // RESERVED for P5 (x, y, z inclusive)
export const SPIRE_TIP = [94, 137, 38];                              // lightning_rod: the build's highest block
export const EAVE_Y = 48;                                            // R1/R2 eave (behind the parapet)
export const RIDGE_R1_Y = 59;                                        // nave + choir ridge (row z 38)
export const RIDGE_R2_Y = 57;                                        // transept ridge (row x 94)
export const TOWER_TOP_Y = 95;                                       // tower roof decks; parapet 96..97
export const ENTRANCE = [5, 3, 38];                                  // player in the Last Judgement portal recess

// FOOTPRINT (brief, '#' = build here): row r = z 5r..5r+4, col c = x 5c..5c+4.
export const FOOTPRINT = [
  ".................##.##.......###......",
  ".####.#############################...",
  "####################################..",
  "#####################################.",
  "#####################################.",
  "#####################################.",
  "######################################",
  "######################################",
  "######################################",
  "#####################################.",
  "#####################################.",
  "####################################..",
  "###################################...",
  ".####.###########################.....",
  ".....................#..#####.........",
  "........................#####.........",
  ".......................#######........",
  ".......................########.......",
  ".......................########.......",
  ".......................########.......",
  "...........................###........",
  "...........................###........",
  "......................................",
];
/** inFootprint(x, z): true when the cell's 5x5 column is a '#' of the FOOTPRINT. */
export const inFootprint = (x, z) => FOOTPRINT[Math.floor(z / CELL)]?.[Math.floor(x / CELL)] === "#";

// GROUND (brief): rock top y per 5x5 cell ('.' = no reading: null).
export const GROUND = [
  [null,3,3,2,3,2,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,null,null,null,null],
  [3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,null,null],
  [3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,null],
  [3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,null],
  [3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,2],
  [3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3],
  [3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3],
  [3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,3],
  [3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,1,1,1,1,2,2,2,2],
  [3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,2,1,1,2,2,2,1,1,1,1,2,2,2,2],
  [3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,null],
  [3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,null],
  [3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,null,null],
  [3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null],
  [null,3,3,3,2,null,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,1,null,null,1,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,1,1,2,2,1,1,0,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,2,1,1,0,0,0,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,1,1,1,1,1,1,0,0,0,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,1,1,1,1,1,0,1,0,0,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,1,1,1,1,1,1,1,1,0,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,1,null,1,1,1,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,0,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,null,1,null,null,null,null,null,null,null,null],
];
/** groundAt(x, z): the rock top y at a block column; a '.' cell takes its nearest read cell (0 if none). */
export function groundAt(x, z) {
  const r0 = Math.min(GROUND.length - 1, Math.max(0, Math.floor(z / CELL))), c0 = Math.min(GROUND[0].length - 1, Math.max(0, Math.floor(x / CELL)));
  for (let d = 0; d < 40; d++) {
    let best = null;
    for (let r = r0 - d; r <= r0 + d; r++) for (let c = c0 - d; c <= c0 + d; c++) {
      if (Math.max(Math.abs(r - r0), Math.abs(c - c0)) !== d) continue;
      const v = GROUND[r]?.[c];
      if (v != null) best = Math.max(best ?? v, v);
    }
    if (best != null) return best;
  }
  return 0;
}

// ---- rng ----
/** rng(seed): a seeded generator (mulberry32) returning floats in [0, 1); the same seed gives the same sequence. */
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
