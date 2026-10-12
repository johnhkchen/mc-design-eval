// Shared vocabulary for villa-sonnet (plan.md): the palette as named constants (ids from palette.json only), one helper
// per plan VOCABULARY item, and the site coordinates. Helpers take the grid (or a runParts view) as their first argument
// and write real blocks with states. Coordinates are structure-local: x east, y up, z south; the street is at z < 0.
// Conventions the helpers share: `axis` for a wall = the axis the wall RUNS along ('x' for a wall at z = const, 'z' for a
// wall at x = const); `open` boxes are [x0,y0,z0,x1,y1,z1] like ROOMS.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- palette (palette.json roles and objects) -----------------------------------------------------------------------
// plaster / dado / plinth / cornice
export const SMOOTH_SANDSTONE = "smooth_sandstone";
export const END_STONE_BRICKS = "end_stone_bricks";
export const SANDSTONE = "sandstone";
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";
export const RED_TERRACOTTA = "red_terracotta";
export const STONE_BRICKS = "stone_bricks";
export const STONE_BRICK_STAIRS = "stone_brick_stairs";
export const STONE_BRICK_SLAB = "stone_brick_slab";
export const STONE_BRICK_WALL = "stone_brick_wall";
export const CHISELED_STONE_BRICKS = "chiseled_stone_bricks";
export const CUT_SANDSTONE = "cut_sandstone";
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";
// white marble
export const QUARTZ_BLOCK = "quartz_block";
export const SMOOTH_QUARTZ = "smooth_quartz";
export const QUARTZ_PILLAR = "quartz_pillar";
export const CHISELED_QUARTZ_BLOCK = "chiseled_quartz_block";
export const QUARTZ_STAIRS = "quartz_stairs";
export const QUARTZ_SLAB = "quartz_slab";
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";
export const DIORITE_WALL = "diorite_wall";
export const POLISHED_DIORITE = "polished_diorite";
// roof (red-tile mix, see roof-texture.mjs) and its stairs/slabs (objects)
export const BRICKS = "bricks";
export const GRANITE = "granite";
export const POLISHED_GRANITE = "polished_granite";
export const MANGROVE_PLANKS = "mangrove_planks";
export const MUD_BRICKS = "mud_bricks";
export const BRICK_STAIRS = "brick_stairs";
export const BRICK_SLAB = "brick_slab";
export const GRANITE_STAIRS = "granite_stairs";
export const GRANITE_SLAB = "granite_slab";
export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs";
export const POLISHED_GRANITE_SLAB = "polished_granite_slab";
export const MANGROVE_STAIRS = "mangrove_stairs";
export const MANGROVE_SLAB = "mangrove_slab";
export const MUD_BRICK_STAIRS = "mud_brick_stairs";
export const MUD_BRICK_SLAB = "mud_brick_slab";
// timber
export const SPRUCE_PLANKS = "spruce_planks";
export const SPRUCE_SLAB = "spruce_slab";
export const SPRUCE_STAIRS = "spruce_stairs";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
export const SPRUCE_DOOR = "spruce_door";
export const SPRUCE_FENCE = "spruce_fence";
export const DARK_OAK_PLANKS = "dark_oak_planks";
export const DARK_OAK_LOG = "dark_oak_log";
export const DARK_OAK_SLAB = "dark_oak_slab";
export const DARK_OAK_STAIRS = "dark_oak_stairs";
export const DARK_OAK_FENCE = "dark_oak_fence";
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";
export const DARK_OAK_DOOR = "dark_oak_door";
// bronze
export const COPPER_LANTERN = "copper_lantern";
export const COPPER_CHAIN = "copper_chain";
export const COPPER_BARS = "copper_bars";
export const COPPER_BLOCK = "copper_block";
export const CUT_COPPER = "cut_copper";
export const CUT_COPPER_SLAB = "cut_copper_slab";
export const CUT_COPPER_STAIRS = "cut_copper_stairs";
export const COPPER_TRAPDOOR = "copper_trapdoor";
// mosaic tesserae
export const POLISHED_BLACKSTONE = "polished_blackstone";
export const BLACK_TERRACOTTA = "black_terracotta";
export const WHITE_TERRACOTTA = "white_terracotta";
export const YELLOW_TERRACOTTA = "yellow_terracotta";
export const BLUE_TERRACOTTA = "blue_terracotta";
export const TERRACOTTA = "terracotta";
export const ORANGE_TERRACOTTA = "orange_terracotta";
export const CYAN_GLAZED_TERRACOTTA = "cyan_glazed_terracotta";
export const BLUE_GLAZED_TERRACOTTA = "blue_glazed_terracotta";
export const ORANGE_GLAZED_TERRACOTTA = "orange_glazed_terracotta";
export const SMOOTH_STONE = "smooth_stone";
export const POLISHED_ANDESITE = "polished_andesite";
// ground and garden
export const GRASS_BLOCK = "grass_block";
export const DIRT = "dirt";
export const GRAVEL = "gravel";
export const DIRT_PATH = "dirt_path";
export const ANDESITE = "andesite";
export const COARSE_DIRT = "coarse_dirt";
export const PODZOL = "podzol";
// plants
export const AZALEA_LEAVES = "azalea_leaves";
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";
export const POPPY = "poppy";
export const AZURE_BLUET = "azure_bluet";
export const ALLIUM = "allium";
export const CORNFLOWER = "cornflower";
export const RED_TULIP = "red_tulip";
export const WHITE_TULIP = "white_tulip";
export const ROSE_BUSH = "rose_bush";
export const LILAC = "lilac";
export const PEONY = "peony";
export const SHORT_GRASS = "short_grass";
export const FERN = "fern";
export const POTTED_FERN = "potted_fern";
export const POTTED_AZALEA_BUSH = "potted_azalea_bush";
export const POTTED_FLOWERING_AZALEA_BUSH = "potted_flowering_azalea_bush";
export const POTTED_CORNFLOWER = "potted_cornflower";
export const POTTED_ALLIUM = "potted_allium";
export const POTTED_POPPY = "potted_poppy";
export const POTTED_CACTUS = "potted_cactus";
// water
export const WATER = "water";
export const WATER_CAULDRON = "water_cauldron";
export const CAULDRON = "cauldron";
// furniture and functional
export const RED_BED = "red_bed";
export const WHITE_BED = "white_bed";
export const CAMPFIRE = "campfire";
export const FURNACE = "furnace";
export const SMOKER = "smoker";
export const CRAFTING_TABLE = "crafting_table";
export const BARREL = "barrel";
export const CHEST = "chest";
export const BOOKSHELF = "bookshelf";
export const LECTERN = "lectern";
export const DECORATED_POT = "decorated_pot";
export const CANDLE = "candle";
export const RED_CARPET = "red_carpet";
export const WHITE_CARPET = "white_carpet";
export const BLACK_CARPET = "black_carpet";
export const YELLOW_CARPET = "yellow_carpet";
export const ITEM_FRAME = "item_frame";
export const SKELETON_SKULL = "skeleton_skull";
export const LOOM = "loom";
export const BREWING_STAND = "brewing_stand";
export const END_ROD = "end_rod";

// ---- site (plan.md SITE, ROOMS, OPENINGS, ROOF pieces, PARTS coordinates) -------------------------------------------
/** Grid size: x 0..35, z 0..47, y 0..10 (ridges y9; one chimney may reach y10). dataVersion 5023 = 26.3, the palette's version. */
export const SITE = { size: [36, 11, 48], dataVersion: 5023 };
/** Levels: ground y0, house floor y1 (podium), inside air y2..5, wall top and ceiling y6, roofs from y7. */
export const LEVEL = { ground: 0, floor: 1, air: 2, ceiling: 6, roofBase: 7 };
/** The house footprint: front wall z=2, back wall z=45, side walls x=0 and x=35. Street at z 0..1, rear lane 46..47. */
export const HOUSE = { x0: 0, x1: 35, z0: 2, z1: 45 };

/** Inner air boxes [x0,y0,z0,x1,y1,z1], the same order as plan.md ROOMS (= rooms.json). */
export const ROOMS = [
  { name: "Fauces (entrance passage)", box: [16, 2, 2, 19, 5, 9] },
  { name: "Taberna W1", box: [1, 2, 3, 7, 5, 8] },
  { name: "Taberna W2", box: [9, 2, 3, 14, 5, 8] },
  { name: "Taberna E3", box: [21, 2, 3, 26, 5, 8] },
  { name: "Taberna E4", box: [28, 2, 3, 34, 5, 8] },
  { name: "Atrium", box: [10, 2, 10, 25, 5, 21] },
  { name: "Cubiculum C1 (NW)", box: [1, 2, 10, 8, 5, 14] },
  { name: "Cubiculum C2 (SW)", box: [1, 2, 16, 8, 5, 21] },
  { name: "Cubiculum C3 (NE)", box: [27, 2, 10, 34, 5, 14] },
  { name: "Cubiculum C4 (SE)", box: [27, 2, 16, 34, 5, 21] },
  { name: "Tablinum", box: [11, 2, 23, 24, 5, 30] },
  { name: "Culina (kitchen)", box: [1, 2, 23, 9, 5, 30] },
  { name: "Triclinium", box: [26, 2, 23, 34, 5, 30] },
  { name: "Cubiculum C5 (SW of court)", box: [1, 2, 32, 5, 5, 37] },
  { name: "Lararium (C6)", box: [1, 2, 39, 5, 5, 44] },
  { name: "Cubiculum C7 (SE of court)", box: [30, 2, 32, 34, 5, 37] },
  { name: "Storeroom C8 (apotheca)", box: [30, 2, 39, 34, 5, 44] },
  { name: "Peristyle colonnade (covered walkway)", box: [7, 2, 32, 28, 5, 44] },
];

/** Openings left AIR by the shell (OPENINGS table), as [x0,y0,z0,x1,y1,z1] boxes for wallLine({ open }). */
export const OPENINGS = {
  fauceStreet: [16, 2, 2, 19, 5, 2],
  fauceAtrium: [16, 2, 9, 19, 5, 9],
  shopStreet: [[3, 2, 2, 5, 4, 2], [10, 2, 2, 13, 4, 2], [22, 2, 2, 25, 4, 2], [30, 2, 2, 32, 4, 2]],
  atriumToTablinum: [15, 2, 22, 20, 5, 22],
  tablinumToPeristyle: [15, 2, 31, 20, 5, 31],
  kitchenToColonnade: [7, 2, 31, 8, 4, 31],
  triclinumToColonnade: [27, 2, 31, 28, 4, 31],
  rearDoor: [17, 2, 45, 18, 3, 45],
  windows: [[0, 3, 12, 0, 4, 12], [0, 3, 18, 0, 4, 18], [0, 3, 26, 0, 4, 26], [0, 3, 35, 0, 4, 35],
    [35, 3, 12, 35, 4, 12], [35, 3, 18, 35, 4, 18], [35, 3, 26, 35, 4, 26], [35, 3, 35, 35, 4, 35],
    [3, 3, 45, 3, 4, 45], [32, 3, 45, 32, 4, 45]],
};
/** Compluvium: the open roof and ceiling hole x14..21, z13..18 ([x0,z0,x1,z1]). Pool x15..20, z14..17. */
export const COMPLUVIUM = { x0: 14, z0: 13, x1: 21, z1: 18 };
export const POOL = { x0: 15, z0: 14, x1: 20, z1: 17 };
export const IMPLUVIUM_COLUMNS = [[14, 13], [21, 13], [14, 18], [21, 18]];
/** Garden court: open sky x11..24, z35..41. Fountain basin x15..20, z36..40. */
export const GARDEN_COURT = { x0: 11, z0: 35, x1: 24, z1: 41 };
export const FOUNTAIN = { x0: 15, z0: 36, x1: 20, z1: 40 };
/** Kitchen flue: the open cell in the ceiling above the hearth. */
export const FLUE = [2, 6, 26];
/** The fauces: street opening x16..19, doors at z=4, inner opening to the atrium at z=9. */
export const FAUCES = { x0: 16, x1: 19, zStreet: 2, zDoors: 4, zAtrium: 9 };
/** Shop counters (x0..x1 at z=2) and the shutters (x at z=1, y3 and y4). */
export const SHOP_WINDOWS = [{ x0: 3, x1: 5 }, { x0: 10, x1: 13 }, { x0: 22, x1: 25 }, { x0: 30, x1: 32 }];
export const SHUTTER_XS = [2, 6, 9, 14, 21, 26, 29, 33];
/** Entrance step (x16..19 at y1, z=1) and the kerb row at z=0 (x0..35 except x16..19). */
export const STEP = { x0: 16, x1: 19, z: 1 };
/** Sidewalk furniture (base y1): lampstands and potted ferns. */
export const SIDEWALK_LAMPSTANDS = [[14, 1], [21, 1]];
export const SIDEWALK_POTS = [[13, 1], [22, 1]];
/** Fauces lampstands (base y2, at z=3) and rear lampstands (z=44). */
export const FAUCES_LAMPSTANDS = [[16, 3], [19, 3]];
export const REAR_LAMPSTANDS = [[16, 44], [19, 44]];
/** Interior doorways: [x, z] with the wall running along z (a wall at x = const), y2..3. */
export const INTERIOR_DOORWAYS = [[15, 6], [20, 6], [8, 6], [27, 6], [9, 12], [9, 18], [26, 12], [26, 18], [10, 27], [25, 27]];
export const PERISTYLE_DOORWAYS = [[6, 35], [6, 41], [29, 35], [29, 41]];
/** Pilasters (wall cells, y2..6): fauces at z=2, atrium at z=9, tablinum north at z=22, south at z=31. */
export const PILASTERS = {
  fauces: [[15, 2], [20, 2]],
  atrium: [[15, 9], [20, 9]],
  tablinumNorth: [[14, 22], [21, 22]],
  tablinumSouth: [[14, 31], [21, 31]],
};
/** Atrium niches and hung lamps, corner pots (P4). */
export const STATUE_NICHES = [[11, 12], [24, 12]];
export const ATRIUM_HANG_LAMPS = [[12, 11], [23, 11], [12, 20], [23, 20]];
export const ATRIUM_POTS = [[10, 10], [25, 10], [10, 21], [25, 21]];
/** The plants that cycle through the pots, in order. */
export const PLANT_CYCLE = ["fern", "azalea", "flowering_azalea", "cornflower", "allium"];
/** The peristyle: 18 columns on the rectangle x10..25, z34..42 (architrave y6, stylobate y1). */
export const COLONNADE_COLUMNS = [
  [10, 34], [13, 34], [16, 34], [19, 34], [22, 34], [25, 34],
  [10, 42], [13, 42], [16, 42], [19, 42], [22, 42], [25, 42],
  [10, 36], [10, 38], [10, 40], [25, 36], [25, 38], [25, 40],
];
export const COLONNADE_HANG_LAMPS = [[12, 33], [15, 33], [20, 33], [23, 33], [8, 36], [8, 40], [27, 36], [27, 40], [12, 43], [15, 43], [20, 43], [23, 43]];
export const COLONNADE_BENCHES = [[13, 33], [22, 33], [13, 43], [22, 43]];
export const COLONNADE_STATUES = [[8, 33], [27, 33]];
export const COURT_STATUES = [[13, 38], [22, 38]];
export const COURT_CORNER_ROSES = [[11, 35], [24, 35]];
export const COURT_CORNER_LILACS = [[11, 41], [24, 41]];
/** Parterre beds (3x5). The W bed: poppy at z37, azure bluet at z39; the E bed: allium at z37, cornflower at z39. */
export const GARDEN_BEDS = [
  { x0: 12, z0: 36, x1: 14, z1: 40, flowers: [POPPY, AZURE_BLUET] },
  { x0: 21, z0: 36, x1: 23, z1: 40, flowers: [ALLIUM, CORNFLOWER] },
];
/** Potted plants and pots left for P6 (the atrium corners are P4's). */
export const FINISH_POTS = [[14, 32], [21, 32], [9, 33], [26, 33], [9, 43], [26, 43], [16, 46], [19, 46]];
/** Rear door pair at x17..18, z=45 and the back-wall windows (grilles) for P6. */
export const REAR_DOOR = { x0: 17, x1: 18, z: 45 };
export const WINDOWS = [
  ...[12, 18, 26, 35].map((z) => ({ x: 0, y: 3, z, axis: "z" })),
  ...[12, 18, 26, 35].map((z) => ({ x: 35, y: 3, z, axis: "z" })),
  { x: 3, y: 3, z: 45, axis: "x" },
  { x: 32, y: 3, z: 45, axis: "x" },
];
/** Roof pieces R1..R16 (plan.md roof table). rect = [x0,z0,x1,z1]; low = the eave side for sheds; ridge = the ridge axis for gables. */
export const ROOF_PIECES = [
  { id: "R1", rect: [0, 2, 35, 9], style: "gable", ridge: "x", overhang: { north: 1 } },
  { id: "R2", rect: [0, 10, 9, 21], style: "gable", ridge: "z", overhang: 0 },
  { id: "R3", rect: [26, 10, 35, 21], style: "gable", ridge: "z", overhang: 0 },
  { id: "R4", rect: [10, 10, 21, 12], style: "shed", low: "south", overhang: 0 },
  { id: "R5", rect: [22, 10, 25, 18], style: "shed", low: "west", overhang: 0 },
  { id: "R6", rect: [14, 19, 25, 21], style: "shed", low: "north", overhang: 0 },
  { id: "R7", rect: [10, 13, 13, 21], style: "shed", low: "east", overhang: 0 },
  { id: "R8", rect: [0, 22, 9, 31], style: "gable", ridge: "z", overhang: 0 },
  { id: "R9", rect: [10, 22, 25, 31], style: "gable", ridge: "x", overhang: 0 },
  { id: "R10", rect: [26, 22, 35, 31], style: "gable", ridge: "z", overhang: 0 },
  { id: "R11", rect: [7, 32, 24, 34], style: "shed", low: "south", overhang: 0 },
  { id: "R12", rect: [25, 32, 28, 41], style: "shed", low: "west", overhang: 0 },
  { id: "R13", rect: [11, 42, 28, 45], style: "shed", low: "north", overhang: 0 },
  { id: "R14", rect: [7, 35, 10, 45], style: "shed", low: "east", overhang: 0 },
  { id: "R15", rect: [0, 32, 6, 45], style: "gable", ridge: "z", overhang: 0 },
  { id: "R16", rect: [29, 32, 35, 45], style: "gable", ridge: "z", overhang: 0 },
];
/** Kitchen chimney stack (hollow 3x3, core at (2, y6..9, 26)). */
export const CHIMNEY = { x0: 1, z0: 25, x1: 3, z1: 27, y0: 6, y1: 9 };

// ---- helpers --------------------------------------------------------------------------------------------------------
const inBox = (b, x, y, z) => x >= b[0] && y >= b[1] && z >= b[2] && x <= b[3] && y <= b[4] && z <= b[5];
const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);
/** The plaster hash (plan.md wallCell): smooth_sandstone 70 / end_stone_bricks 20 / sandstone 10, by position. */
const plasterAt = (x, y, z) => {
  const h = (x * 7 + z * 13 + y * 5) % 10;
  return h < 7 ? SMOOTH_SANDSTONE : h < 9 ? END_STONE_BRICKS : SANDSTONE;
};
const need = (ok, msg) => { if (!ok) throw new RangeError(msg); };

// ---- walls and shell ------------------------------------------------------------------------------------------------
/**
 * One wall cell at height y (1..6): stone_bricks plinth (y1), red_terracotta dado (y2..3), hashed plaster (y4..5), cut_sandstone
 * cornice (y6). kind ext|int is the same finish inside and out (plan E21, E22).
 */
export function wallCell(g, x, y, z, kind = "int") {
  need(kind === "ext" || kind === "int", `wallCell: kind ${kind} (ext|int)`);
  need(y >= 1 && y <= 6, `wallCell: y ${y} is outside the wall (1..6)`);
  const block = y === 1 ? STONE_BRICKS : y <= 3 ? RED_TERRACOTTA : y <= 5 ? plasterAt(x, y, z) : CUT_SANDSTONE;
  g.set(x, y, z, block);
}

/** A straight 1-thick wall from (x0,z0) to (x1,z1), y1..6, with wallCell on every cell except those inside an `open` box. */
export function wallLine(g, x0, z0, x1, z1, { open = [], kind = "int" } = {}) {
  need(x0 === x1 || z0 === z1, "wallLine: a wall runs along x or along z");
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) for (let y = 1; y <= 6; y++) {
    if (open.some((b) => inBox(b, x, y, z))) continue;
    wallCell(g, x, y, z, kind);
  }
}

/** A quartz pilaster in a wall cell: quartz_block (y2), quartz_pillar (y3..4), chiseled quartz (y5), smooth_quartz cap (y6). */
export function pilaster(g, x, z) {
  g.set(x, 2, z, QUARTZ_BLOCK);
  g.set(x, 3, z, QUARTZ_PILLAR, { axis: "y" });
  g.set(x, 4, z, QUARTZ_PILLAR, { axis: "y" });
  g.set(x, 5, z, CHISELED_QUARTZ_BLOCK);
  g.set(x, 6, z, SMOOTH_QUARTZ);
}

/** A peristyle column on its stylobate: smooth_stone (y1), quartz base (y2), quartz shaft (y3..4), chiseled capital (y5). */
export function column(g, x, z) {
  g.set(x, 1, z, SMOOTH_STONE);
  g.set(x, 2, z, QUARTZ_BLOCK);
  g.set(x, 3, z, QUARTZ_PILLAR, { axis: "y" });
  g.set(x, 4, z, QUARTZ_PILLAR, { axis: "y" });
  g.set(x, 5, z, CHISELED_QUARTZ_BLOCK);
}

/** A straight beam row at y6 from (x0,z0) to (x1,z1): smooth_quartz, or dark_oak_log whose axis follows the line. */
export function beamLine(g, x0, z0, x1, z1, block) {
  need(x0 === x1 || z0 === z1, "beamLine: a straight line");
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    if (block === DARK_OAK_LOG) g.set(x, 6, z, DARK_OAK_LOG, { axis: x0 !== x1 ? "x" : "z" });
    else g.set(x, 6, z, block);
  }
}

/** A Tuscan column: stone_bricks base (y2), dark_oak_log shaft (y3..4, axis y), dark_oak_planks capital (y5). */
export function tuscanColumn(g, x, z) {
  g.set(x, 2, z, STONE_BRICKS);
  g.set(x, 3, z, DARK_OAK_LOG, { axis: "y" });
  g.set(x, 4, z, DARK_OAK_LOG, { axis: "y" });
  g.set(x, 5, z, DARK_OAK_PLANKS);
}

// ---- street front --------------------------------------------------------------------------------------------------
/** A shop counter across the street opening x0..x1 at z=2: stone_brick_slab (bottom) at y2, one decorated_pot at (x0+1, 3, 2). */
export function shopWindow(g, x0, x1) {
  for (const x of span(x0, x1)) g.set(x, 2, 2, ...B.slab("stone_brick", "bottom"));
  g.set(x0 + 1, 3, 2, DECORATED_POT);
}

/** An open shutter on the sidewalk side of a shop window: spruce_trapdoor facing north at (x, y, z) and (x, y+1, z). */
export function shutter(g, x, y, z) {
  for (const yy of [y, y + 1]) g.set(x, yy, z, ...B.trapdoor("spruce", "north", "bottom", true));
}

/** A barred window: copper_bars at (x, y, z) and (x, y+1, z), joined to the wall on both sides. axis = the wall's run. */
export function windowGrille(g, x, y, z, axis) {
  need(axis === "x" || axis === "z", `windowGrille: axis ${axis} (x|z)`);
  const join = axis === "z" ? { north: "true", south: "true", east: "false", west: "false" } : { east: "true", west: "true", north: "false", south: "false" };
  for (const yy of [y, y + 1]) g.set(x, yy, z, COPPER_BARS, join);
}

// ---- doors ----------------------------------------------------------------------------------------------------------
function door(g, x, z, facing, hinge, open) {
  const state = (half) => ({ facing, half, hinge, open: String(open), powered: "false" });
  g.set(x, 2, z, SPRUCE_DOOR, state("lower"));
  g.set(x, 3, z, SPRUCE_DOOR, state("upper"));
}

/**
 * A closed interior door in a 1-wide opening (y2..3) with a plaster lintel at y4. The shell builds y4 wall beside the opening
 * (OPENINGS lists y2..3 only), so the lintel is written only where the cell is still air. facing defaults to east for an
 * axis 'z' wall and south for an axis 'x' wall; pass it to face the door out of the room.
 */
export function doorway(g, x, z, axis, facing) {
  need(axis === "x" || axis === "z", `doorway: axis ${axis} (x|z)`);
  door(g, x, z, facing ?? (axis === "z" ? "east" : "south"), "left", false);
  if (g.blockAt(x, 4, z) === "minecraft:air") g.set(x, 4, z, plasterAt(x, 4, z));
}

/** A 2-wide double door, both spruce_door open: the first hinged left, the second right. axis = the way the opening runs. */
export function doorPair(g, x, z, axis, facing = "north") {
  need(axis === "x" || axis === "z", `doorPair: axis ${axis} (x|z)`);
  const [dx, dz] = axis === "x" ? [1, 0] : [0, 1];
  door(g, x, z, facing, "left", true);
  door(g, x + dx, z + dz, facing, "right", true);
}

/** A street step: stone_brick_stairs facing south at y1 across x0..x1 at row z. */
export function step(g, x0, x1, z) {
  for (const x of span(x0, x1)) g.set(x, 1, z, ...B.stairs("stone_brick", "south", "bottom"));
}

// ---- lamps, pots and statues ----------------------------------------------------------------------------------------
/** A bronze lamp hung from the y6 ceiling: copper_chain (y5) and a hanging copper_lantern (y4). */
export function hangLamp(g, x, z) {
  g.set(x, 5, z, COPPER_CHAIN, { axis: "y" });
  g.set(x, 4, z, COPPER_LANTERN, { hanging: "true" });
}

/** A standing bronze lamp: cut_copper_slab (base), copper_bars, copper_lantern on top. base 2 in a room, 1 on the sidewalk. */
export function lampStand(g, x, z, base = 2) {
  g.set(x, base, z, CUT_COPPER_SLAB, { type: "bottom" });
  g.set(x, base + 1, z, COPPER_BARS);
  g.set(x, base + 2, z, COPPER_LANTERN, { hanging: "false" });
}

const POT_OF = {
  fern: POTTED_FERN, azalea: POTTED_AZALEA_BUSH, flowering_azalea: POTTED_FLOWERING_AZALEA_BUSH,
  cornflower: POTTED_CORNFLOWER, allium: POTTED_ALLIUM, poppy: POTTED_POPPY,
};
/** A potted plant on a stone_bricks pedestal: pedestal at base, pot at base+1. base 2 in a room, 1 on the sidewalk. */
export function pot(g, x, z, plant, base = 2) {
  need(POT_OF[plant], `pot: plant ${plant} (${Object.keys(POT_OF).join("|")})`);
  g.set(x, base, z, STONE_BRICKS);
  g.set(x, base + 1, z, POT_OF[plant]);
}

/** A white statue: stone_bricks plinth (y2), diorite_wall robe (y3), quartz_pillar torso (y4), skeleton_skull head (y5). */
export function statue(g, x, z, rot = 8) {
  g.set(x, 2, z, STONE_BRICKS);
  g.set(x, 3, z, DIORITE_WALL);
  g.set(x, 4, z, QUARTZ_PILLAR, { axis: "y" });
  g.set(x, 5, z, SKELETON_SKULL, { rotation: String(rot) });
}

// ---- garden ---------------------------------------------------------------------------------------------------------
/** A low hedge cell at y2: azalea_leaves (persistent), or flowering_azalea_leaves. */
export function hedge(g, x, z, flowering = false) {
  g.set(x, 2, z, flowering ? FLOWERING_AZALEA_LEAVES : AZALEA_LEAVES, { persistent: "true" });
}

/**
 * A parterre bed x0..x1 by z0..z1 (3x5): grass_block at y1; a hedge ring at y2 with every 4th ring cell flowering; flowers at
 * y2 on the interior cells in z order (flowers[k % n]); the centre cell is left empty for the statue.
 */
export function gardenBed(g, x0, z0, x1, z1, flowers = [POPPY, AZURE_BLUET]) {
  const cx = Math.floor((x0 + x1) / 2), cz = Math.floor((z0 + z1) / 2);
  let ring = 0, k = 0;
  for (const z of span(z0, z1)) for (const x of span(x0, x1)) {
    g.set(x, 1, z, GRASS_BLOCK);
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (edge) hedge(g, x, z, ring++ % 4 === 3);
    else if (!(x === cx && z === cz)) g.set(x, 2, z, flowers[k++ % flowers.length]);
  }
}

/**
 * A fountain basin x0..x1 by z0..z1 (6x5): smooth_quartz rim at y2, blue_terracotta floor at y1, water at y2 on the interior
 * except the centre pedestal: quartz_pillar (y2..3) with water_cauldron (level 3) on top at y4 on each of its two cells.
 */
export function fountain(g, x0, z0, x1, z1) {
  const ix0 = x0 + 1, ix1 = x1 - 1, mid = (ix0 + ix1) / 2;
  const pedZ = Math.floor((z0 + z1) / 2), pedX = [Math.floor(mid), Math.ceil(mid)];
  for (const z of span(z0, z1)) for (const x of span(x0, x1)) {
    if (x === x0 || x === x1 || z === z0 || z === z1) { g.set(x, 2, z, SMOOTH_QUARTZ); continue; }
    g.set(x, 1, z, BLUE_TERRACOTTA);
    if (z === pedZ && pedX.includes(x)) {
      g.set(x, 2, z, QUARTZ_PILLAR, { axis: "y" });
      g.set(x, 3, z, QUARTZ_PILLAR, { axis: "y" });
      g.set(x, 4, z, WATER_CAULDRON, { level: "3" });
    } else g.set(x, 2, z, WATER);
  }
}

/**
 * The rain pool: water at y1 over POOL (x15..20, z14..17), and smooth_quartz_slab coping (bottom) at y2 on the ring of
 * COMPLUVIUM (x14..21, z13..18) without its four column corners: 20 cells.
 */
export function impluvium(g) {
  for (const x of span(POOL.x0, POOL.x1)) for (const z of span(POOL.z0, POOL.z1)) g.set(x, 1, z, WATER);
  const { x0, z0, x1, z1 } = COMPLUVIUM;
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    if (edge && !corner) g.set(x, 2, z, ...B.slab("smooth_quartz", "bottom"));
  }
}

// ---- floors ---------------------------------------------------------------------------------------------------------
/**
 * A floor mosaic at y1 over a ROOMS box (its x and z extents). style is one object or an array, applied in order:
 * {kind:"checker", a, b}  (x+z even -> a)
 * {kind:"border", field, b1, b2}  (outer ring b1, next ring b2, the rest field)
 * {kind:"meander", a, b, field?}  (outer ring alternates pairs of a and b; the inside is field, or left as it is)
 * {kind:"emblem", at: [x0,z0,x1,z1], block}  (a block over that rectangle)
 */
export function mosaic(g, box, style) {
  const [x0, , z0, x1, , z1] = box;
  for (const s of [style].flat()) {
    for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
      const depth = Math.min(x - x0, x1 - x, z - z0, z1 - z);
      const block = mosaicCell(s, x, z, depth);
      if (block) g.set(x, 1, z, block);
    }
  }
}
function mosaicCell(s, x, z, depth) {
  switch (s.kind) {
    case "checker": return (x + z) % 2 === 0 ? s.a : s.b;
    case "border": return (depth === 0 ? s.b1 : depth === 1 ? s.b2 : s.field) ?? null;
    case "meander": return depth === 0 ? ((x + z) % 4 < 2 ? s.a : s.b) : s.field ?? null;
    case "emblem": {
      const [ex0, ez0, ex1, ez1] = s.at;
      return x >= ex0 && x <= ex1 && z >= ez0 && z <= ez1 ? s.block : null;
    }
    default: throw new RangeError(`mosaic: unknown style ${s.kind}`);
  }
}

// ---- furniture ------------------------------------------------------------------------------------------------------
/**
 * A couch: red_bed pieces end to end along a row of len cells (len/2 beds; foot then head, facing along the row), with
 * dark_oak_slab rails on the wall side of each cell. facing = the way the couch faces, out from the wall; len must be even.
 */
export function couch(g, x, z, facing, len) {
  need(len % 2 === 0, "couch: len must be even (2 cells per bed)");
  need(["north", "south", "east", "west"].includes(facing), `couch: facing ${facing}`);
  const along = facing === "north" || facing === "south" ? "east" : "south";
  const [dx, , dz] = DIRS[along];
  const [bx, , bz] = DIRS[OPPOSITE[facing]];
  for (let i = 0; i < len; i++) {
    const cx = x + dx * i, cz = z + dz * i;
    g.set(cx, 2, cz, RED_BED, { facing: along, part: i % 2 === 0 ? "foot" : "head" });
    g.set(cx + bx, 2, cz + bz, ...B.slab("dark_oak", "bottom"));
  }
}

/** A low table: dark_oak_fence legs at the four corners (y2) and a dark_oak_slab top (type top) at y3 over w x d cells. */
export function table(g, x, z, w, d) {
  for (const cx of span(x, x + w - 1)) for (const cz of span(z, z + d - 1)) g.set(cx, 3, cz, ...B.slab("dark_oak", "top"));
  for (const [cx, cz] of [[x, z], [x + w - 1, z], [x, z + d - 1], [x + w - 1, z + d - 1]]) g.set(cx, 2, cz, DARK_OAK_FENCE);
}
