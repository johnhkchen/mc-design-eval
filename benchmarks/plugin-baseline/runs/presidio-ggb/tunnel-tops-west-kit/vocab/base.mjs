// Shared constants for every part: palette ids (palette.json only), plan.md site coordinates, a seeded rng.
// Coordinates are module coordinates (x 0..119, z 0..145, y 0..30; module y 0 = world y 2). Ranges are inclusive.

// ---- palette: block ids, one constant per palette.json id ---------------------------------------------------
// Paths (decomposed granite): smooth_sandstone, smooth_sandstone_slab, smooth_sandstone_stairs
export const SMOOTH_SANDSTONE = "smooth_sandstone";
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";
// Walks and masonry: smooth_stone, smooth_stone_slab, polished_andesite, stone, tuff, andesite
export const SMOOTH_STONE = "smooth_stone";
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
export const POLISHED_ANDESITE = "polished_andesite";
export const STONE = "stone";
export const TUFF = "tuff";
export const ANDESITE = "andesite";
// Calcite (seating walls, portal trim, planters) and light paving
export const CALCITE = "calcite";
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";
// Roads and markings: gray_concrete, white_concrete, yellow_concrete
export const GRAY_CONCRETE = "gray_concrete";
export const WHITE_CONCRETE = "white_concrete";
export const YELLOW_CONCRETE = "yellow_concrete";
// Tunnel interior: black_concrete back wall, sea_lantern ceiling lights
export const BLACK_CONCRETE = "black_concrete";
export const SEA_LANTERN = "sea_lantern";
// Timber, spruce: spruce_planks, spruce_slab, spruce_stairs, spruce_fence, spruce_fence_gate, spruce_trapdoor, ladder
export const SPRUCE_PLANKS = "spruce_planks";
export const SPRUCE_SLAB = "spruce_slab";
export const SPRUCE_STAIRS = "spruce_stairs";
export const SPRUCE_FENCE = "spruce_fence";
export const SPRUCE_FENCE_GATE = "spruce_fence_gate";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
export const LADDER = "ladder";
// Timber, logs: stripped_spruce_log, spruce_log, stripped_oak_log, mangrove_roots, dark_oak_fence, dark_oak_log
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";
export const SPRUCE_LOG = "spruce_log";
export const STRIPPED_OAK_LOG = "stripped_oak_log";
export const MANGROVE_ROOTS = "mangrove_roots";
export const DARK_OAK_FENCE = "dark_oak_fence";
export const DARK_OAK_LOG = "dark_oak_log";
// Ground: grass_block, dirt, clay, coarse_dirt, gravel, sand, podzol, rooted_dirt, moss_block, water
export const GRASS_BLOCK = "grass_block";
export const DIRT = "dirt";
export const CLAY = "clay";
export const COARSE_DIRT = "coarse_dirt";
export const GRAVEL = "gravel";
export const SAND = "sand";
export const PODZOL = "podzol";
export const ROOTED_DIRT = "rooted_dirt";
export const MOSS_BLOCK = "moss_block";
export const WATER = "water";
// Planting, leaves and shrubs: azalea_leaves, flowering_azalea_leaves, dark_oak_leaves, spruce_leaves (persistent)
export const AZALEA_LEAVES = "azalea_leaves";
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";
export const DARK_OAK_LEAVES = "dark_oak_leaves";
export const SPRUCE_LEAVES = "spruce_leaves";
// Planting, plants: azalea, flowering_azalea, tall_grass, short_grass, fern, large_fern, dead_bush, sweet_berry_bush, moss_carpet
export const AZALEA = "azalea";
export const FLOWERING_AZALEA = "flowering_azalea";
export const TALL_GRASS = "tall_grass";
export const SHORT_GRASS = "short_grass";
export const FERN = "fern";
export const LARGE_FERN = "large_fern";
export const DEAD_BUSH = "dead_bush";
export const SWEET_BERRY_BUSH = "sweet_berry_bush";
export const MOSS_CARPET = "moss_carpet";
// Planting, flowers: allium, cornflower, dandelion, sunflower
export const ALLIUM = "allium";
export const CORNFLOWER = "cornflower";
export const DANDELION = "dandelion";
export const SUNFLOWER = "sunflower";
// Light: lantern (lamp heads), light (hidden light, level 15)
export const LANTERN = "lantern";
export const LIGHT = "light";

// ---- site: the plot ----------------------------------------------------------------------------------------
/** Grid size [x, y, z] for the whole plot: x 0..119, y 0..30 (module), z 0..145. */
export const SIZE = [120, 31, 146];
/** World y = module y + WORLD_Y_OFFSET (module y 0 is the land model's world y 2). */
export const WORLD_Y_OFFSET = 2;
/** Outer blocks of every edge that stay exactly at the mapped height and role. */
export const EDGE_LOCK = 2;
/** Path crossings at x 119 that continue straight into the east module: { z0, z1, y }. */
export const CROSSINGS = {
  toePath: { z0: 44, z1: 46, y: 4 },
  cliffWalk: { z0: 58, z1: 60, y: 7 },
  lawnSouth: { z0: 86, z1: 88, y: 7 },
  promenade: { z0: 104, z1: 107, y: 8 },
  runnel: { z0: 38, z1: 38, y: 3 },
};

// ---- site: roads, parking, water ---------------------------------------------------------------------------
/** Parkway roadway (two carriageways): x 0..40, z 80..91, road at y 4. */
export const PARKWAY = { x0: 0, x1: 40, z0: 80, z1: 91, y: 4 };
/** Parkway median barrier (polished_andesite, 1 high at y 5): x 0..40, z 85..86. */
export const PARKWAY_MEDIAN = { x0: 0, x1: 40, z0: 85, z1: 86 };
/** Crissy Field Avenue (gray_concrete, yellow double centre line z 25..26): x 0..49, z 22..29, y 3. */
export const CRISSY_AVE = { x0: 0, x1: 49, z0: 22, z1: 29, y: 3 };
/** Parking lot (white stall lines every 3 along x, rows at z 34, 44, 54, 64): x 0..45, z 30..75, y 3. */
export const PARKING = { x0: 0, x1: 45, z0: 30, z1: 75, y: 3 };
/** Marsh water (water over clay): x 0..13 at z 0, x 0..11 at z 1, x 8..9 at z 4..5. y 2. */
export const MARSH = { z0: 0, z1: 5, y: 2 };
/** Small pond (water over clay, smooth_stone kerb): x 38..39, z 24..25, y 2. */
export const POND = { x0: 38, x1: 39, z0: 24, z1: 25, y: 2 };
/** Water play runnel (stone channel, water source at y 3): x 90..117, z 38, y 3 (continues to x 119). */
export const RUNNEL = { x0: 90, x1: 117, z: 38, y: 3 };

// ---- site: tunnel portal and cut ---------------------------------------------------------------------------
/** West tunnel portal face (faces west): x 41..42, z 76..95, y 5..10. */
export const PORTAL_FACE = { x0: 41, x1: 42, z0: 76, z1: 95, y0: 5, y1: 10 };
/** North mouth (northbound) air: x 41..49, z 80..84, y 5..8. */
export const MOUTH_N = { x0: 41, x1: 49, z0: 80, z1: 84, y0: 5, y1: 8 };
/** South mouth (southbound) air: x 41..49, z 87..91, y 5..8. */
export const MOUTH_S = { x0: 41, x1: 49, z0: 87, z1: 91, y0: 5, y1: 8 };
/** Pier between the two mouths (lantern on its face at x 40, y 7): x 41..49, z 85..86. */
export const PIER = { z0: 85, z1: 86 };
/** Centre lines of the two bores (sea_lantern at y 8, x 43, 46, 49). */
export const BORE_Z = [82, 89];
/** Black_concrete back wall of the bores at x 50, y 5..8. */
export const BORE_BACK_X = 50;
/** Tunnel lid (park over it, ceiling slab y 9, grass on top at y 10): x 41..53, z 76..95. Soil to y 10 from x 43. */
export const LID = { x0: 41, x1: 53, z0: 76, z1: 95, y: 9, soilFromX: 43 };
/** Bore air (no planting roots or light blocks): x 43..49 over both mouths, y 5..8. */
export const BORE_AIR = { x0: 43, x1: 49, y0: 5, y1: 8 };
/** Retaining walls of the cut: north z 78..79, south z 92..93, x 28..40; height steps down west. */
export const RETAIN = { x0: 28, x1: 40, zN: [78, 79], zS: [92, 93] };

// ---- site: outpost, fort and play ground -------------------------------------------------------------------
/** Fort lookout tower: posts x 80..85 z 28..33, y 4..15. Deck y 12, mid platform y 8. */
export const FORT = { x0: 80, x1: 85, z0: 28, z1: 33, deckY: 12, midY: 8 };
/** Fort rope net (spruce_fence lattice): x 80..85, z 34..35, y 5..11. */
export const FORT_NET = { x0: 80, x1: 85, z0: 34, z1: 35, y0: 5, y1: 11 };
/** Fort entry (ground): x 82..83, z 28, y 4..6. */
export const FORT_ENTRY = { x0: 82, x1: 83, z: 28, y0: 4, y1: 6 };
/** Fort ladder hatch: x 82, z 29, y 12. */
export const FORT_HATCH = { x: 82, z: 29, y: 12 };
/** Climbing log pile: x 100..107, z 28..35, y 4..8. */
export const LOG_PILE = { x0: 100, x1: 107, z0: 28, z1: 35, y0: 4, y1: 8 };
/** Balance logs: x 70..79, z 34..41, y 4. */
export const BALANCE_LOGS = { x0: 70, x1: 79, z0: 34, z1: 41, y: 4 };
/** Sand pit (sand surface, boulders on the rim): x 92..99, z 21..27, y 3. */
export const SAND_PIT = { x0: 92, x1: 99, z0: 21, z1: 27, y: 3 };
/** Outpost play ground (coarse_dirt, gravel, sand patches): x 68..119, z 20..42, y 3. */
export const OUTPOST = { x0: 68, x1: 119, z0: 20, z1: 42, y: 3 };
/** Low timber fence lines (spruce_fence y 4): fence at z 19 and z 43, and at x 68; gates at (75,4,19) (110,4,19) (90..92,4,43). */
export const OUTPOST_FENCE = { zN: 19, zS: 43, xW: 68, y: 4 };
/** Boulder clusters (stone, tuff, andesite; 4..5 high) scattered in the outpost: z 20..42. */
export const BOULDER_BAND = { z0: 20, z1: 42, y0: 4, y1: 5 };

// ---- site: meadow, bluffs, lawn, terraces ------------------------------------------------------------------
/** Outpost Meadow (tall_grass, short_grass, flower drifts): x 50..67, z 18..46, y 3. */
export const MEADOW = { x0: 50, x1: 67, z0: 18, z1: 46, y: 3 };
/** Mown loop of grass_block, 2 wide (no plants): inside MEADOW. */
export const MEADOW_MOWN_LOOP_WIDTH = 2;
/** Picnic tables (centre x, z; y 3): (54, 24), (62, 30), (56, 40). */
export const PICNIC_TABLES = [[54, 24], [62, 30], [56, 40]];
/** Lower Bluff Walk (toe path, smooth_sandstone 3 wide, gentle S-bend): x 50..119, z 44..46, y 3..4. */
export const TOE_PATH = { x0: 50, x1: 119, z0: 44, z1: 46 };
/** North bluff scrub (steep, coastal scrub): x 58..119, z 47..57, y 4..6. */
export const NORTH_BLUFF = { x0: 58, x1: 119, z0: 47, z1: 57, y0: 4, y1: 6 };
/** West bluff (wraps south, coastal scrub and cypress): x 50..61, z 46..78, rising 3 to 7 eastward. */
export const WEST_BLUFF = { x0: 50, x1: 61, z0: 46, z1: 78 };
/** Cliff Walk (smooth_sandstone 3 wide, y 7): x 62..119, z 58..60. Railing on z 57. */
export const CLIFF_WALK = { x0: 62, x1: 119, z0: 58, z1: 60, y: 7 };
/** Cliff Walk railing line: z 57, posts every 4 (y 8). Rail gaps at x 76..79 and x 102..105. */
export const CLIFF_RAIL = { z: 57, y: 8, gaps: [[76, 79], [102, 105]] };
/** Overlook West deck (spruce_planks, floor y 7): x 74..81, z 50..56. */
export const OVERLOOK_W = { x0: 74, x1: 81, z0: 50, z1: 56, deckY: 7 };
/** Overlook East deck (spruce_planks, floor y 7): x 100..107, z 50..56. */
export const OVERLOOK_E = { x0: 100, x1: 107, z0: 50, z1: 56, deckY: 7 };
/** Bluff switchback (2-wide smooth_sandstone, two diagonal legs, half steps): x 88..96, z 46..58. */
export const SWITCHBACK = { x0: 88, x1: 96, z0: 46, z1: 58 };
/** Big Lawn (grass_block only, y 7): x 66..119, z 62..85. */
export const BIG_LAWN = { x0: 66, x1: 119, z0: 62, z1: 85, y: 7 };
/** Big Lawn mound (+1, staggered single-block rows, the outline wanders): x 82..112, z 68..78. */
export const LAWN_MOUND = { x0: 82, x1: 112, z0: 68, z1: 78 };
/** Lawn edge paths (smooth_sandstone 3 wide, y 7): west edge x 63..65 z 60..88; south edge x 64..119 z 86..88. */
export const LAWN_EDGE = { west: { x0: 63, x1: 65, z0: 60, z1: 88 }, south: { x0: 64, x1: 119, z0: 86, z1: 88 } };
/** Overlook terraces, west bank: x 52..77, z 89..103, y 7..9 (tiers at y 9, 8, 7). */
export const TERRACE_W = { x0: 52, x1: 77, z0: 89, z1: 103 };
/** Overlook terraces, east bank: x 100..115, z 89..103, y 7..9. Aisle x 107..108. */
export const TERRACE_E = { x0: 100, x1: 115, z0: 89, z1: 103 };
/** Terrace tiers (z ranges, y): tier 1 z 99..102 y 9; tier 2 z 94..98 y 8; tier 3 z 89..93 y 7. */
export const TIERS = [{ z0: 99, z1: 102, y: 9 }, { z0: 94, z1: 98, y: 8 }, { z0: 89, z1: 93, y: 7 }];
/** Overlook Promenade (light_gray_concrete, calcite edge bands at z 104 and z 107, y 8): x 50..119, z 104..107. */
export const PROMENADE = { x0: 50, x1: 119, z0: 104, z1: 107, y: 8 };
/** Freestanding seat walls on the lawn's south path edge (calcite 1 high, spruce_slab top, facing north), at z 85. */
export const SEAT_WALLS = [{ x0: 70, x1: 79 }, { x0: 92, x1: 101 }, { x0: 104, x1: 113 }];
/** Lid path over the tunnel lid, linking the lawn's west edge to the lid crest and down to the promenade. */
export const LID_PATH = { x0: 44, x1: 60, z0: 76, z1: 100 };

// ---- site: planting and reserved cells ---------------------------------------------------------------------
/** Cypress and pine groves (6-10 trees each): SW forest edge x 10..40 z 96..140; west bluff x 50..60 z 60..76; over the lid x 44..54 z 78..94; south x 60..75 z 108..135; SE x 104..117 z 110..132; x 0..10 z 140..145; NW meadow x 52..58 z 18..26. */
export const GROVES = [
  { x0: 10, x1: 40, z0: 96, z1: 140 }, { x0: 50, x1: 60, z0: 60, z1: 76 }, { x0: 44, x1: 54, z0: 78, z1: 94 },
  { x0: 60, x1: 75, z0: 108, z1: 135 }, { x0: 104, x1: 117, z0: 110, z1: 132 }, { x0: 0, x1: 10, z0: 140, z1: 145 },
  { x0: 52, x1: 58, z0: 18, z1: 26 },
];
/** B pads, kept flat for buildings placed separately (build NOTHING on them, no trees within 1). */
export const B_PADS = [
  { x0: 78, x1: 99, z0: 88, z1: 103, y: 8 },   // flat at 8
  { x0: 20, x1: 29, z0: 100, z1: 109 },        // flat at mapped H
  { x0: 0, x1: 17, z0: 106, z1: 141 },         // exact B cells, mapped H (Main Post)
  { x0: 66, x1: 79, z0: 112, z1: 133 },        // exact B cells, mapped H
  { x0: 94, x1: 103, z0: 122, z1: 137 },       // exact B cells, mapped H
];

// ---- rng ------------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1). Same seed, same sequence. */
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
