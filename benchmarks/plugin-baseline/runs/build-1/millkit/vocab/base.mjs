// Shared constants for the mill village row: palette ids (palette.json only), plan.md site coordinates, a seeded rng.
// Coordinates are plan.md's: ground surface y 0, x 0..95, z 0..18 (front = north, -z). Y_LOW..Y_HIGH is the full height.

// ---- site (plan.md SITE) ---------------------------------------------------------------------------------------------
/** Row width in x (0..95). */
export const SITE_X = 96;
/** Row depth in z (0..18). */
export const SITE_Z = 19;
/** Lowest y the build uses (the well shaft's water, y -3). */
export const Y_LOW = -3;
/** Highest y the build uses (chimney fires, roof ridges). */
export const Y_HIGH = 15;
/** Ground surface: grass/coarse dirt at y 0; standing level outdoors y 1. */
export const GROUND_Y = 0;
/** Standing level outdoors. */
export const STAND_Y = 1;
/** Solid ground fill runs y -2..-1 (stone at -2, dirt at -1). */
export const FILL_Y0 = -2;
/** Top of the solid ground fill. */
export const FILL_Y1 = -1;
/** Lane strip: z 0..4 (gravel centre z 1..3, dirt_path ruts at z 1 and 3, coarse_dirt edges z 0 and 4). */
export const LANE_Z0 = 0;
/** Lane strip south edge. */
export const LANE_Z1 = 4;
/** First plot row z (the picket fence line). */
export const PLOT_Z0 = 5;
/** Last plot row z (back fence line). */
export const PLOT_Z1 = 18;
/** Plot / module width in x. Module i covers x 12i..12i+11. */
export const MODULE_W = 12;
/** Number of plots in the row. */
export const PLOTS = 8;
/** First x of plot i. */
export const plotX0 = (i) => MODULE_W * i;
/** Middle gate / door x pair of plot i (x 12i+5..6). */
export const gateX = (i) => MODULE_W * i + 5;
/** Lantern post x positions on the lane's south edge (z 4): one per module on its west column, plus x 95. */
export const LAMP_XS = [0, 12, 24, 36, 48, 60, 72, 84, 95];
/** Lantern post z (lane south edge). */
export const LAMP_Z = 4;

// ---- houses (plan.md FLOORS, FACADES, RESERVED) ----------------------------------------------------------------------
/** Brick pier / skirting levels shared by the houses. */
export const PIER_Y = 1;
/** Floor deck y (the deck is the sill of the walls). */
export const DECK_Y = 2;
/** First wall course y. */
export const WALL_Y0 = 3;
/** Last wall course y (head plate). */
export const WALL_Y1 = 6;
/** First roof course y. */
export const ROOF_Y0 = 7;
/** Front step z (stairs at y 1). */
export const STEP_Z = 6;
/** Porch deck / posts z rows (z 7..8). */
export const PORCH_Z = [7, 8];
/** Front wall z of the house bodies (z 9). */
export const FRONT_Z = 9;
/** Plot 0 shotgun body: x 3..8, z 9..17, y 1..6 (+ roof). */
export const P0_BODY = { x0: 3, x1: 8, y0: 1, y1: 6, z0: 9, z1: 17 };
/** Plot 1 saddlebag duplex body: x 13..22, z 9..16, y 1..6 (+ roof). */
export const P1_BODY = { x0: 13, x1: 22, y0: 1, y1: 6, z0: 9, z1: 16 };
/** Plot 2 hall-and-parlour body: x 26..34, z 9..16, y 1..6 (+ roof). */
export const P2_BODY = { x0: 26, x1: 34, y0: 1, y1: 6, z0: 9, z1: 16 };
/** Plot 3 shotgun body (mirror of plot 0): x 39..44, z 9..17, y 1..6 (+ roof). */
export const P3_BODY = { x0: 39, x1: 44, y0: 1, y1: 6, z0: 9, z1: 17 };
/** Chimney stacks, each [x0, y0, z0, x1, y1, z1] (own footing from y 1; cap and fire above y1). */
export const CHIMNEYS = {
  p0: [9, 1, 12, 10, 11, 13],
  p1: [17, 1, 12, 18, 13, 13],
  p2: [25, 1, 12, 26, 13, 13],
  p3: [37, 1, 12, 38, 11, 13],
};
/** Stove cells beside each chimney (lit smoker/furnace, y 3). */
export const STOVES = {
  p0: [7, 3, 12],
  p1w: [16, 3, 12],
  p1e: [19, 3, 12],
  p2: [27, 3, 13],
  p3: [40, 3, 12],
};
/** Bed cells per room, [x0, y, z0, x1, y, z1] (plan.md RESERVED): two clear blocks above (y 4..5) are kept air. */
export const BEDS = {
  p0back: [4, 3, 15, 5, 3, 16],
  p1w: [14, 3, 14, 14, 3, 15],
  p1e: [21, 3, 14, 21, 3, 15],
  p2hall: [27, 3, 14, 27, 3, 15],
  p2parlour: [33, 3, 14, 33, 3, 15],
  p3back: [43, 3, 15, 43, 3, 16],
};
/** Partition doors (open, no leaf) and entrance doors per plot, [x, z] of the wall cell. */
export const DOORS = {
  p0front: [5, 9], p0back: [6, 17], p0partition: [5, 13],
  p1front: [[15, 9], [20, 9]],
  p2front: [29, 9], p2back: [28, 16], p2partition: [30, 14],
  p3front: [41, 9], p3back: [41, 17], p3partition: [42, 13],
};

// ---- yards, coop, store, well, tree (plan.md SITE table) -------------------------------------------------------------
/** Plot 4 kitchen garden fence ring: x 48..59, z 5..18 (gate x 53..54 at z 5). */
export const GARDEN = { x0: 48, x1: 59, z0: 5, z1: 18 };
/** Plot 4 water channel: z 11, x 49..52 and 55..58 (bridged by the path x 53..54). */
export const CHANNEL_Z = 11;
/** Plot 5 coop box (floor y 1, walls y 2..4): x 63..68, z 12..16. */
export const COOP = { x0: 63, x1: 68, y0: 1, y1: 4, z0: 12, z1: 16 };
/** Plot 5 nest room inner air (plan): x 64..67, y 2..4, z 13..15. */
export const NEST = { x0: 64, y0: 2, x1: 67, y1: 4, z0: 13, z1: 15 };
/** Plot 6 well ring (cobblestone) x 76..79, z 9..12; shaft x 77..78, z 10..11, water y -3..0. */
export const WELL = { x0: 76, x1: 79, z0: 9, z1: 12 };
/** Plot 6 shade tree trunk (x 81, z 15) and crown box. */
export const TREE = { trunkX: 81, trunkZ: 15, crown: [78, 5, 12, 82, 9, 17] };
/** Plot 7 company store body: x 85..94, z 9..17, y 1..7 (+ roof); false front y 3..12 at z 9. */
export const STORE = { x0: 85, x1: 94, y0: 1, y1: 7, z0: 9, z1: 17, frontZ: 9 };
/** Store false-front band for the STORE banner: y 9..10 at x 87..91, z 8 (plan.md RESERVED). */
export const STORE_BANNER_Y = [9, 10];

// ---- palette: roles (palette.json) ------------------------------------------------------------------------------------
// ground
/** Ground surface mix (plan GROUND): 60% grass_block. */
export const GRASS_BLOCK = "grass_block";
/** Ground surface mix: 25% coarse_dirt; also lane edges. */
export const COARSE_DIRT = "coarse_dirt";
/** Ground under the tree and the coop. */
export const PODZOL = "podzol";
/** Ground near fences. */
export const ROOTED_DIRT = "rooted_dirt";
/** Lane wheel ruts. */
export const DIRT_PATH = "dirt_path";
/** Lane centre. */
export const GRAVEL = "gravel";
/** Ground fill y -1. */
export const DIRT = "dirt";
/** Ground fill y -2. */
export const STONE = "stone";
/** Garden farmland (crop beds). */
export const FARMLAND = "farmland";
/** Channel and shaft water. */
export const WATER = "water";

// masonry
/** House piers. */
export const BRICKS = "bricks";
/** Chimney cap ring. */
export const BRICK_STAIRS = "brick_stairs";
/** Chimney cap. */
export const BRICK_SLAB = "brick_slab";
/** Chimney band. */
export const DEEPSLATE_BRICKS = "deepslate_bricks";
/** Store, coop and well piers. */
export const COBBLESTONE = "cobblestone";
/** 1 in 10 pier and well blocks. */
export const MOSSY_COBBLESTONE = "mossy_cobblestone";
/** Store / well stairs. */
export const COBBLESTONE_STAIRS = "cobblestone_stairs";

// plot 0 (shotgun, birch)
/** Plot 0 walls. */
export const BIRCH_PLANKS = "birch_planks";
/** Plot 0 corner posts and head plate (also plot 2 trim). */
export const STRIPPED_BIRCH_LOG = "stripped_birch_log";
/** Plot 0 rail and garden fences. */
export const BIRCH_FENCE = "birch_fence";
/** Plot 0 front gate. */
export const BIRCH_FENCE_GATE = "birch_fence_gate";
/** Plot 0 front and back doors. */
export const BIRCH_DOOR = "birch_door";
/** Plot 0 shutters. */
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";
/** Plot 0 and plot 1 roof (tin). */
export const POLISHED_ANDESITE = "polished_andesite";
/** Roof stairs (tin). */
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";
/** Roof slabs (tin). */
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";

// plot 1 (saddlebag duplex, spruce)
/** Plot 1 walls (board-and-batten field). */
export const SPRUCE_PLANKS = "spruce_planks";
/** Plot 1 battens and posts. */
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";
/** Plot 1 side fences and skirting. */
export const SPRUCE_FENCE = "spruce_fence";
/** Plot 1 gate and fence gates. */
export const SPRUCE_FENCE_GATE = "spruce_fence_gate";
/** Plot 1 front doors (and coop keeper door). */
export const SPRUCE_DOOR = "spruce_door";
/** Plot 1 roof (rusted tin). */
export const MANGROVE_PLANKS = "mangrove_planks";
/** Plot 1 roof stairs. */
export const MANGROVE_STAIRS = "mangrove_stairs";
/** Plot 1 roof slabs. */
export const MANGROVE_SLAB = "mangrove_slab";
/** Plot 1 and plot 3 verge stairs (dark_oak). */
export const DARK_OAK_STAIRS = "dark_oak_stairs";
/** Plot 1 and plot 3 verge slabs (dark_oak). */
export const DARK_OAK_SLAB = "dark_oak_slab";

// plot 2 (hall and parlour, oak clapboard)
/** Plot 2 walls and decks. */
export const OAK_PLANKS = "oak_planks";
/** Plot 2 front and back doors. */
export const OAK_DOOR = "oak_door";
/** Plot 2 shutters. */
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
/** Plot 2 roof (spruce shingle) and coop stairs. */
export const SPRUCE_STAIRS = "spruce_stairs";
/** Plot 2 roof (spruce shingle) slab. */
export const SPRUCE_SLAB = "spruce_slab";

// plot 3 (shotgun, jungle)
/** Plot 3 walls. */
export const JUNGLE_PLANKS = "jungle_planks";
/** Plot 3 corner posts. */
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";
/** Plot 3 side fences and skirting. */
export const DARK_OAK_FENCE = "dark_oak_fence";
/** Plot 3 front gate. */
export const DARK_OAK_FENCE_GATE = "dark_oak_fence_gate";
/** Plot 3 front and back doors. */
export const JUNGLE_DOOR = "jungle_door";
/** Plot 3 shutters. */
export const BIRCH_TRAPDOOR = "birch_trapdoor";
/** Plot 3 roof (green tin). */
export const WEATHERED_CUT_COPPER = "weathered_cut_copper";
/** Plot 3 roof stairs. */
export const WEATHERED_CUT_COPPER_STAIRS = "weathered_cut_copper_stairs";
/** Plot 3 roof slabs. */
export const WEATHERED_CUT_COPPER_SLAB = "weathered_cut_copper_slab";

// decks, porches, yards
/** Porch deck stairs and bench. */
export const OAK_STAIRS = "oak_stairs";
/** Porch deck slabs. */
export const OAK_SLAB = "oak_slab";
/** Bench armrests. */
export const OAK_TRAPDOOR = "oak_trapdoor";
/** Garden and wash-line fences; scarecrow post. */
export const OAK_FENCE = "oak_fence";
/** Garden gate (plot 4) and the coop run gate. */
export const OAK_FENCE_GATE = "oak_fence_gate";
/** Shade tree trunk, well ridge beam, bridge deck. */
export const OAK_LOG = "oak_log";
/** Shade tree crown (persistent). */
export const OAK_LEAVES = "oak_leaves";

// store
/** Store walls and sales floor. */
export const DARK_OAK_PLANKS = "dark_oak_planks";
/** Store false front face (painted cream). */
export const STORE_FALSE_FRONT = "birch_planks";
/** Store cornice (upside down). */
export const STORE_CORNICE = "dark_oak_stairs";
/** Store cornice brackets. */
export const STORE_CORNICE_SLAB = "dark_oak_slab";
/** Store front door. */
export const DARK_OAK_DOOR = "dark_oak_door";
/** Store windows and transom. */
export const GLASS_PANE = "glass_pane";
/** Store steps. */
export const STORE_STEPS = "spruce_stairs";

// coop
/** Coop nest boxes and straw. */
export const HAY_BLOCK = "hay_block";
/** Nest boxes (facing up) and store/yard barrels. */
export const BARREL = "barrel";

// garden and yard
/** Crop beds. */
export const WHEAT = "wheat";
/** Crop beds. */
export const CARROTS = "carrots";
/** Crop beds. */
export const POTATOES = "potatoes";
/** Crop beds. */
export const BEETROOTS = "beetroots";
/** Garden composter and store job site. */
export const COMPOSTER = "composter";
/** Rain barrel and well water. */
export const WATER_CAULDRON = "water_cauldron";
/** Scarecrow head. */
export const CARVED_PUMPKIN = "carved_pumpkin";
/** Wash-line sheets. */
export const WHITE_WOOL = "white_wool";
/** Rug and carpets. */
export const WHITE_CARPET = "white_carpet";
/** Flower beds and shelves. */
export const FLOWER_POT = "flower_pot";
/** Flower beds. */
export const POTTED_POPPY = "potted_poppy";

// hearth
/** Chimney fire and signal fire. */
export const CAMPFIRE = "campfire";
/** Stove beside plots 0, 1, 3 (lit). */
export const SMOKER = "smoker";
/** Stove beside plot 2. */
export const FURNACE = "furnace";

// job sites and store furniture
/** Store job site (loom). */
export const LOOM = "loom";
/** Store job site (fletching table). */
export const FLETCHING_TABLE = "fletching_table";
/** Store crates and stock. */
export const CHEST = "chest";
/** Store pottery. */
export const DECORATED_POT = "decorated_pot";
/** Store and room candles. */
export const CANDLE = "candle";
/** Pressure plate (store trade plate). */
export const OAK_PRESSURE_PLATE = "oak_pressure_plate";

// light and beds
/** Porch and room lanterns. */
export const LANTERN = "lantern";
/** Well and porch hangers. */
export const IRON_CHAIN = "iron_chain";
/** Family beds (red). */
export const RED_BED = "red_bed";
/** Family beds (white). */
export const WHITE_BED = "white_bed";

// ---- seeded rng -------------------------------------------------------------------------------------------------------
/** rng(seed) -> () => float in [0, 1) (mulberry32): the same seed gives the same build. */
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
