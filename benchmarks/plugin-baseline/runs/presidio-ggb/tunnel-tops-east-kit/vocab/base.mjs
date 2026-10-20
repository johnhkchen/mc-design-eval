// Shared constants for every part: the palette's block ids (palette.json only), plan.md's site coordinates, a seeded rng.
// Coordinates are module x, y, z. Boxes are [x0, x1, z0, z1] (inclusive) unless the name says otherwise.

// ---- site ---------------------------------------------------------------------------------------------------------
/** Site x range, inclusive: x 0..85 (west to east). */
export const SITE_X = [0, 85];
/** Site z range, inclusive: z 0..145 (north at z 0, south at z 145). */
export const SITE_Z = [0, 145];
/** Highest y a part may build: y 0..30. */
export const SITE_Y_MAX = 30;
/** Base stone layer y (the ground rule's y1); build.mjs lays it, the ground part lays the rest up to the height map. */
export const GROUND_BASE_Y = 1;

// ---- palette: ground ----------------------------------------------------------------------------------------------
/** ground: y1 fill and the body under the surface. */
export const STONE = "stone";
/** ground: subsoil y2..H-1. */
export const DIRT = "dirt";
/** ground: lawn and bed surface. */
export const GRASS_BLOCK = "grass_block";
/** ground: bed mulch patches (15%). */
export const COARSE_DIRT = "coarse_dirt";
/** ground: bed mulch patches (15%). */
export const ROOTED_DIRT = "rooted_dirt";
/** ground: bed mulch patches. */
export const PODZOL = "podzol";
/** ground: Outpost play area ground. */
export const GRAVEL = "gravel";
/** ground: fill under water cells (no water on this map). */
export const CLAY = "clay";

// ---- palette: paths and lawn edge ---------------------------------------------------------------------------------
/** paths: pale decomposed granite surface. */
export const SMOOTH_SANDSTONE = "smooth_sandstone";
/** paths: half steps (bottom type). */
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";
/** paths: campfire aisles only. */
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";
/** lawnEdge: low stone edging on the lower cell of a lawn rise. */
export const MOSSY_COBBLESTONE_SLAB = "mossy_cobblestone_slab";

// ---- palette: seating and earthworks ------------------------------------------------------------------------------
/** seating: body of seating walls. */
export const WHITE_TERRACOTTA = "white_terracotta";
/** seating: wall cap and bench ends (bottom type). */
export const BIRCH_SLAB = "birch_slab";
/** seating: bench seats (facing south, half bottom). */
export const BIRCH_STAIRS = "birch_stairs";
/** seating: picnic table legs, umbrella poles. */
export const BIRCH_FENCE = "birch_fence";

// ---- palette: campfire --------------------------------------------------------------------------------------------
/** campfire: circle floor. */
export const STONE_BRICKS = "stone_bricks";
/** campfire: ring around the hearth, seat rows. */
export const STONE_BRICK_SLAB = "stone_brick_slab";
/** campfire: lit hearth (lit true, signal_fire true). */
export const CAMPFIRE = "campfire";
/** campfire: hidden under the campfire. */
export const HAY_BLOCK = "hay_block";

// ---- palette: Field Station ---------------------------------------------------------------------------------------
/** station: posts and fascia (axis y). */
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";
/** station: cladding. */
export const DARK_OAK_PLANKS = "dark_oak_planks";
/** station: cladding caps. */
export const DARK_OAK_SLAB = "dark_oak_slab";
/** station: glazing. */
export const GLASS = "glass";
/** station: glazing panes. */
export const GLASS_PANE = "glass_pane";
/** station: double door. */
export const DARK_OAK_DOOR = "dark_oak_door";
/** station: floor and plinth line. */
export const POLISHED_ANDESITE = "polished_andesite";
/** station: deck. */
export const SPRUCE_PLANKS = "spruce_planks";
/** station: deck edge. */
export const SPRUCE_SLAB = "spruce_slab";

// ---- palette: Outpost ---------------------------------------------------------------------------------------------
/** outpost: play logs lying on gravel (axis x or z). */
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";
/** outpost posts (axis y); also the Monterey pine trunks (6-8 high). */
export const SPRUCE_LOG = "spruce_log";
/** outpost: boulders. */
export const ANDESITE = "andesite";
/** outpost: boulders. */
export const TUFF = "tuff";
/** outpost: step softening. */
export const ANDESITE_SLAB = "andesite_slab";
/** outpost, lights, planting: moss on boulders, beds, and under shroomlights. */
export const MOSS_CARPET = "moss_carpet";

// ---- palette: tunnel portal ---------------------------------------------------------------------------------------
/** portal: the east-facing face and the wing walls' concrete. */
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";
/** portal: the tunnel back wall (mouths read dark). */
export const BLACK_CONCRETE = "black_concrete";
/** portal: mouth surround, coping, lid walk paving. */
export const SMOOTH_STONE = "smooth_stone";
/** portal: half-step surround and lid edges. */
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
/** portal: parapet rail on the coping and wing walls. */
export const IRON_BARS = "iron_bars";
/** portal and lights: hanging lanterns (hanging true) and standing lanterns (hanging false). */
export const LANTERN = "lantern";
/** portal, roads: road and apron body. */
export const GRAY_CONCRETE = "gray_concrete";
/** portal, roads: dashed centre line and walk bands. */
export const WHITE_CONCRETE = "white_concrete";
/** portal, roads: double line on the parkway median. */
export const YELLOW_CONCRETE = "yellow_concrete";

// ---- palette: lights ----------------------------------------------------------------------------------------------
/** lights: lamp post column (three blocks). */
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";
/** lights: hidden light, the surface block under moss carpet. */
export const SHROOMLIGHT = "shroomlight";

// ---- palette: planting --------------------------------------------------------------------------------------------
/** planting: moss mounds and carpets. */
export const MOSS_BLOCK = "moss_block";
/** planting: shrub mounds (persistent). */
export const AZALEA_LEAVES = "azalea_leaves";
/** planting: shrub mounds, purple-blue drift (persistent). */
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";
/** planting: shrub mounds, cypress and pine crowns (persistent). */
export const SPRUCE_LEAVES = "spruce_leaves";
/** planting: cypress crowns (persistent). */
export const DARK_OAK_LEAVES = "dark_oak_leaves";
/** planting: young meadow tree crowns (persistent). */
export const BIRCH_LEAVES = "birch_leaves";
/** planting: grey-green drift. */
export const FERN = "fern";
/** planting: grey-green and ochre drifts. */
export const SHORT_GRASS = "short_grass";
/** planting: ochre drift. */
export const TALL_GRASS = "tall_grass";
/** planting: ochre drift. */
export const DEAD_BUSH = "dead_bush";
/** planting: ochre drift, at most 1 per 40 cells. */
export const SUNFLOWER = "sunflower";
/** planting: purple-blue drift. */
export const ALLIUM = "allium";
/** planting: purple-blue drift. */
export const CORNFLOWER = "cornflower";
/** planting: purple-blue drift. */
export const LILAC = "lilac";
/** planting: coastal scrub drift (age 3). */
export const SWEET_BERRY_BUSH = "sweet_berry_bush";
/** planting: accent drift near the paths. */
export const TORCHFLOWER = "torchflower";
/** planting: accent drift near the paths. */
export const ORANGE_TULIP = "orange_tulip";

// ---- palette: trees -----------------------------------------------------------------------------------------------
/** trees: Monterey cypress trunks (2-3 high). */
export const DARK_OAK_LOG = "dark_oak_log";
// Monterey pine trunks (6-8 high) use SPRUCE_LOG, documented under outpost above.
/** trees: young meadow tree trunks (4 high). */
export const BIRCH_LOG = "birch_log";

// ---- palette: umbrellas -------------------------------------------------------------------------------------------
/** umbrellas: canopy banner (on a birch fence pole). */
export const ORANGE_BANNER = "orange_banner";
/** umbrellas: alternate canopy banner. */
export const WHITE_BANNER = "white_banner";

// ---- site coordinates (plan.md) -----------------------------------------------------------------------------------
/** Field Station pavilion footprint [x0, x1, z0, z1]: walls y4..8, floor y3, roof deck y9. */
export const STATION_BOX = [4, 14, 23, 32];
/** Field Station roof overhang footprint [x0, x1, z0, z1]: deck x3..15, z21..33. */
export const STATION_ROOF_BOX = [3, 15, 21, 33];
/** Station deck [x0, x1, z0, z1] at y3, under the roof overhang at z21..22. */
export const STATION_DECK = [4, 14, 19, 22];
/** Main (north) door x range at z23, y4..5. */
export const STATION_DOOR_N_X = [9, 10];
/** Service (south) door position [x, y, z] at z32, y4..5. */
export const STATION_DOOR_S = [6, 4, 32];
/** Visitor entrance cell on the deck [x, y, z]. */
export const ENTRANCE = [9, 4, 21];
/** Street cell where link L1 joins the main spine [x, y, z]. */
export const STREET = [9, 4, 17];
/** Outpost play area footprints [x0, x1, z0, z1] (east end, two parts). */
export const OUTPOST_BOXES = [[0, 20, 34, 44], [16, 20, 24, 33]];
/** Outpost gravel strip at the west seam, z range (x 0..20). */
export const OUTPOST_GRAVEL_Z = [18, 42];
/** Big Lawn box [x0, x1, z0, z1] at y6..7 (east end; joins the west seam at z 54..84). */
export const BIG_LAWN = [0, 9, 54, 84];
/** Picnic terraces x range; A z40..44 (y4), B z45..50 (y5), C z51..59 (y6). */
export const TERRACE_X = [20, 58];
export const TERRACE_A_Z = [40, 44];
export const TERRACE_B_Z = [45, 50];
export const TERRACE_C_Z = [51, 59];
/** Picnic table spots [x, z]: terrace A, then terrace C (each 2x1 along x, bench row at z +-1). */
export const PICNIC_TABLES = [[32, 42], [44, 42], [26, 54], [34, 56], [42, 54], [50, 56]];
/** East Meadow mound centre [x, z]: lawn r < 9.5 at y7, crown r < 6 at y8, ring path 9.5 <= r < 11.5 at y7. */
export const MEADOW_CENTRE = [22, 73];
export const MEADOW_R = { lawn: 9.5, crownSlab: 6, ringIn: 9.5, ringOut: 11.5 };
/** Campfire circle centre [x, z] and radius: floor y4 r < 3.5; seat rings y5/y6/y7; rim path r 8..10 at y7. */
export const CAMPFIRE_CENTRE = [48, 97];
export const CAMPFIRE_R = 10;
/** Lit campfire [x, y, z]: stands on the floor block y4, so the hearth sits at y5. */
export const CAMPFIRE_HEARTH = [48, 5, 97];
/** Campfire aisles, x range 47..49: north z87..94, south z100..107 (stairs and slabs only). */
export const CAMPFIRE_AISLE_X = [47, 49];
export const CAMPFIRE_AISLE_N_Z = [87, 94];
export const CAMPFIRE_AISLE_S_Z = [100, 107];
/** Overlook terraces [x0, x1, z0, z1]: y6 z94..99, y7 z100..105, y8 z106..110. */
export const OVERLOOK = [2, 44, 94, 110];
/** East tunnel portal face [x0, x1, z0, z1] (concrete, y2..6). */
export const PORTAL_FACE = [74, 75, 46, 65];
/** Tunnel mouths, open voids y3..5 (air). Each is [x0, x1, z0, z1]. */
export const BORE_NORTH = [65, 75, 48, 53];
export const BORE_SOUTH = [65, 75, 57, 62];
export const BORE_Y = [3, 5];
/** Centre pier between the mouths, z range. */
export const PORTAL_PIER_Z = [54, 56];
/** Lid over the bores [x0, x1, z0, z1], surface only at y6. */
export const LID_BOX = [65, 73, 48, 62];
/** Lid walk, W cells on the lid [x0, x1, z0, z1] at y6. */
export const LID_WALK = [66, 73, 50, 55];
/** Parkway apron road box [x0, x1, z0, z1] at y2 (x84..85 at map height via slab). */
export const APRON = [76, 83, 46, 63];
/** North and south wing retaining walls [x0, x1, z0, z1]: x74..75, top y6 stepping to y4. */
export const WING_NORTH = [74, 75, 36, 45];
export const WING_SOUTH = [74, 75, 66, 83];
/** Overlook seating wall z pairs (wall on the lower level's edge, bench on the upper): upper z99/100, lower z105/106. */
export const OVERLOOK_WALL_Z = { upper: [99, 100], lower: [105, 106] };

/** Tree trunk cells [x, z] by type. Shift 1-2 blocks if on a path; not on the lid. */
export const CYPRESS_TRUNKS = [[62, 18], [68, 24], [64, 32], [70, 38], [66, 43], [24, 14], [44, 16], [54, 14], [62, 70], [67, 76], [60, 82], [56, 86], [36, 95], [40, 87], [56, 87], [60, 96], [58, 104], [38, 104], [4, 92], [30, 92]];
export const PINE_TRUNKS = [[56, 26], [46, 30], [8, 52], [44, 70], [58, 62]];
export const YOUNG_TRUNKS = [[22, 59], [35, 66], [36, 80], [9, 80], [8, 66], [22, 87]];

/** Ground-rule building footprints [x0, x1, z0, z1]: flat grass at the surrounding height, nothing on top. */
export const B_FOOTPRINTS = [[16, 33, 16, 23], [64, 85, 84, 145], [4, 47, 120, 145]];

// ---- rng ----------------------------------------------------------------------------------------------------------
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
