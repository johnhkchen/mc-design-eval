// Shared vocabulary for the McMansion (plan.md VOCABULARY). Every helper takes the grid `g` first and places real
// blocks with valid states through the build library. Coordinates are structure-local (x east, y up, z south);
// the street is z < 0 side: FRONT = NORTH (z0 is the street edge).
import { B, DIRS, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- palette (palette.json ids only) ------------------------------------------------------------------------------
export const STONE_BRICKS = "stone_bricks", ANDESITE = "andesite", COBBLESTONE = "cobblestone";
export const STONE_BRICK_STAIRS = "stone_brick_stairs", STONE_BRICK_SLAB = "stone_brick_slab", STONE_BRICK_WALL = "stone_brick_wall";
export const COBBLESTONE_WALL = "cobblestone_wall";
export const SMOOTH_SANDSTONE = "smooth_sandstone", SANDSTONE = "sandstone", SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab", SANDSTONE_STAIRS = "sandstone_stairs", SANDSTONE_SLAB = "sandstone_slab";
export const SMOOTH_QUARTZ = "smooth_quartz", QUARTZ_BLOCK = "quartz_block", QUARTZ_PILLAR = "quartz_pillar";
export const CHISELED_QUARTZ_BLOCK = "chiseled_quartz_block", QUARTZ_STAIRS = "quartz_stairs", SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";
export const QUARTZ_SLAB = "quartz_slab", SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab", QUARTZ_BRICKS = "quartz_bricks";
export const DEEPSLATE_TILES = "deepslate_tiles", DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs", DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";
export const COBBLED_DEEPSLATE = "cobbled_deepslate", COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs", COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab";
export const BLACKSTONE = "blackstone", BLACKSTONE_STAIRS = "blackstone_stairs", BLACKSTONE_SLAB = "blackstone_slab";
export const POLISHED_BLACKSTONE = "polished_blackstone", POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab", POLISHED_BLACKSTONE_STAIRS = "polished_blackstone_stairs";
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor", DARK_OAK_DOOR = "dark_oak_door", DARK_OAK_FENCE = "dark_oak_fence";
export const DARK_OAK_PLANKS = "dark_oak_planks", DARK_OAK_STAIRS = "dark_oak_stairs", DARK_OAK_SLAB = "dark_oak_slab";
export const DARK_OAK_FENCE_GATE = "dark_oak_fence_gate", IRON_BARS = "iron_bars", BLACK_CONCRETE = "black_concrete";
export const GLASS_PANE = "glass_pane", GLASS = "glass", WHITE_STAINED_GLASS_PANE = "white_stained_glass_pane";
export const OAK_PLANKS = "oak_planks", SPRUCE_PLANKS = "spruce_planks", BIRCH_PLANKS = "birch_planks", BIRCH_DOOR = "birch_door";
export const BIRCH_TRAPDOOR = "birch_trapdoor", OAK_STAIRS = "oak_stairs", SPRUCE_STAIRS = "spruce_stairs", SPRUCE_SLAB = "spruce_slab";
export const OAK_SLAB = "oak_slab", OAK_DOOR = "oak_door", OAK_TRAPDOOR = "oak_trapdoor", OAK_FENCE = "oak_fence";
export const BOOKSHELF = "bookshelf", SMOOTH_STONE = "smooth_stone", POLISHED_ANDESITE = "polished_andesite";
export const GRAY_CONCRETE = "gray_concrete", LIGHT_GRAY_CONCRETE = "light_gray_concrete", LIGHT_GRAY_TERRACOTTA = "light_gray_terracotta";
export const WHITE_TERRACOTTA = "white_terracotta", GRAY_TERRACOTTA = "gray_terracotta", STONE = "stone";
export const GRASS_BLOCK = "grass_block", COARSE_DIRT = "coarse_dirt", GRAVEL = "gravel";
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs", POLISHED_ANDESITE_SLAB = "polished_andesite_slab";
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
export const AZALEA_LEAVES = "azalea_leaves", FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves", BIRCH_LOG = "birch_log";
export const BIRCH_LEAVES = "birch_leaves", OAK_LEAVES = "oak_leaves", SHORT_GRASS = "short_grass", FERN = "fern";
export const ALLIUM = "allium", PINK_TULIP = "pink_tulip", RED_TULIP = "red_tulip", WHITE_TULIP = "white_tulip";
export const AZURE_BLUET = "azure_bluet", CORNFLOWER = "cornflower", POPPY = "poppy", PEONY = "peony", ROSE_BUSH = "rose_bush";
export const LILAC = "lilac", POTTED_AZALEA_BUSH = "potted_azalea_bush", POTTED_FERN = "potted_fern", FLOWER_POT = "flower_pot";
export const LANTERN = "lantern", COPPER_LANTERN = "copper_lantern", IRON_CHAIN = "iron_chain", COPPER_CHAIN = "copper_chain";
export const END_ROD = "end_rod", CANDLE = "candle", WHITE_CANDLE = "white_candle", CAMPFIRE = "campfire", LIGHTNING_ROD = "lightning_rod";
export const WHITE_BED = "white_bed", RED_BED = "red_bed", BLUE_BED = "blue_bed", GRAY_BED = "gray_bed", LIGHT_BLUE_BED = "light_blue_bed";
export const WHITE_CARPET = "white_carpet", GRAY_CARPET = "gray_carpet", LIGHT_GRAY_CARPET = "light_gray_carpet";
export const BROWN_CARPET = "brown_carpet", RED_CARPET = "red_carpet", BLUE_CARPET = "blue_carpet", BLACK_CARPET = "black_carpet";
export const CRAFTING_TABLE = "crafting_table", FURNACE = "furnace", SMOKER = "smoker", BLAST_FURNACE = "blast_furnace";
export const BARREL = "barrel", CHEST = "chest", CAULDRON = "cauldron", WATER_CAULDRON = "water_cauldron", LECTERN = "lectern";
export const STONECUTTER = "stonecutter", GRINDSTONE = "grindstone", LOOM = "loom", BREWING_STAND = "brewing_stand";
export const JUKEBOX = "jukebox", HOPPER = "hopper", ITEM_FRAME = "item_frame", OAK_SIGN = "oak_sign", OAK_WALL_SIGN = "oak_wall_sign";
export const OAK_HANGING_SIGN = "oak_hanging_sign", OAK_PRESSURE_PLATE = "oak_pressure_plate", STONE_PRESSURE_PLATE = "stone_pressure_plate";
export const STONE_BUTTON = "stone_button", DAYLIGHT_DETECTOR = "daylight_detector", LEVER = "lever", SCAFFOLDING = "scaffolding";
export const LADDER = "ladder", BLACK_STAINED_GLASS_PANE = "black_stained_glass_pane", GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";
export const WHITE_WOOL = "white_wool", LIGHT_GRAY_WOOL = "light_gray_wool", BLACK_WOOL = "black_wool", MOSS_CARPET = "moss_carpet";
export const IRON_BLOCK = "iron_block", WATER = "water", NETHERRACK = "netherrack";

// ---- site (plan.md SITE, ROOMS, OPENINGS anchors) -----------------------------------------------------------------
export const SIZE = [44, 15, 32];          // x 0..43, y 0..14, z 0..31
export const DATA_VERSION = 5023;          // 26.3: the toolkit's latest; the plan's ids (iron_chain...) need it
export const ROOF_PALETTE = "dark-slate";  // roof tool palette for every roof piece (plan: not the cottage's spruce)
export const MASS = {
  garage: { x0: 0, x1: 12, z0: 6, z1: 19 },
  centre: { x0: 12, x1: 33, z0: 8, z1: 23 },
  east: { x0: 33, x1: 43, z0: 12, z1: 27 },
  turret: { x0: 29, x1: 33, z0: 4, z1: 8 },        // chamfers (29,4) and (33,4) are omitted
  portico: { x0: 19, x1: 26, z0: 4, z1: 7 },
  chimney: { x0: 37, x1: 39, y1: 14, z0: 10, z1: 12 },
  deck: { x0: 14, x1: 32, z0: 24, z1: 30 },
  foyerVoid: { x0: 20, x1: 25, y: 5, z0: 9, z1: 13 },
  firebox: { x0: 37, x1: 39, y0: 2, y1: 3, z: 12 },
};
export const ENTRY_DOOR = { x: 22, y: 2, z: 8 };        // double door x22..23, y2..3, z8
export const PORTICO_COLUMNS = [[19, 5], [21, 5], [24, 5], [26, 5]];
export const FOYER_STAIR_X = [20, 22];                  // flight at x20..22
export const DECK_STEPS = { x0: 22, x1: 24, y: 1, z: 31 };
export const YOUNG_TREE = { x: 38, z: 5 };
// the last four light the dark pockets of the side yard, rear lawn, front-of-deck strip and street end (light --y 1)
export const LAMP_POSTS = [[20, 2], [25, 2], [13, 2], [6, 25], [3, 30], [12, 29], [18, 31], [30, 31], [41, 2]];

// ---- cell registry: openings and reserved cells that wall helpers must never write ----------------------------------
// Shell order: call reserve()/window() for every opening BEFORE the wall loops; wallCell() and turret() skip reserved
// cells. P3/P5 fill openings with window({fill:true}); that writes glass into cells the shell left alone.
const RESERVED = new Set();
const key = (x, y, z) => `${x},${y},${z}`;
export function reserve(x0, y0, z0, x1 = x0, y1 = y0, z1 = z0) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) RESERVED.add(key(x, y, z));
}
export const isReserved = (x, y, z) => RESERVED.has(key(x, y, z));
export function clearReserved() { RESERVED.clear(); }
// the firebox (plan RESERVED) is always air: it is never walled
reserve(MASS.firebox.x0, MASS.firebox.y0, MASS.firebox.z, MASS.firebox.x1, MASS.firebox.y1, MASS.firebox.z);

// ---- small utilities ----------------------------------------------------------------------------------------------
/** The plan's deterministic per-cell hash (0..19): material mixes read as texture without randomness. */
export const hash = (x, y, z) => (x * 7 + z * 13 + y * 5) % 20;
/** Place a [block, state] or [block, state, nbt] pair from the B helpers. */
const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const block = (name) => [name, {}];
const pillar = (name) => [name, { axis: "y" }];

// ---- walls --------------------------------------------------------------------------------------------------------
/**
 * One wall cell (plan E09..E12). y0 and y1: stone_bricks. y2..4: veneer hash on a north-facing plane (north: true),
 * else beige siding. y5: smooth_quartz belt. y6..8: siding. y9: smooth_quartz cornice. Siding: even y smooth_sandstone,
 * odd y sandstone. partition: an interior wall (smooth_sandstone all the way up, no belt; the y9 top plate stays white).
 * Reserved cells are skipped.
 */
export function wallCell(g, x, y, z, { north = false, partition = false } = {}) {
  if (isReserved(x, y, z)) return;
  if (y <= 1) return put(g, x, y, z, block(STONE_BRICKS));
  if (y === 9) return put(g, x, y, z, block(SMOOTH_QUARTZ));
  if (partition) return put(g, x, y, z, block(SMOOTH_SANDSTONE));
  if (y === 5) return put(g, x, y, z, block(SMOOTH_QUARTZ));
  if (y <= 4 && north) {
    const h = hash(x, y, z);
    return put(g, x, y, z, block(h < 11 ? STONE_BRICKS : h < 16 ? ANDESITE : COBBLESTONE));
  }
  return put(g, x, y, z, block(y % 2 === 0 ? SMOOTH_SANDSTONE : SANDSTONE));
}

/**
 * A quoin at a wall corner (plan E12). corner (x,z); dirs = [alongFrontFace, alongSideFace], e.g. the NW corner of a
 * south-east-facing block is ["east", "south"]. y2..4 and y6..8: corner smooth_quartz; the neighbour along the front
 * face at even y, along the side face at odd y, also smooth_quartz (long-short stones).
 */
export function quoin(g, x, z, [frontDir, sideDir]) {
  for (const y of [2, 3, 4, 6, 7, 8]) {
    put(g, x, y, z, block(SMOOTH_QUARTZ));
    const [dx, , dz] = DIRS[y % 2 === 0 ? frontDir : sideDir];
    put(g, x + dx, y, z + dz, block(SMOOTH_QUARTZ));
  }
}

/** The cells of an opening. north/south: wall plane z = z0, cells x0..x0+w-1. east/west: plane x = x0, cells z0..z0+w-1. */
function openingCells(x0, y0, z0, face, w, h) {
  const out = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const along = face === "north" || face === "south";
    out.push(along ? [x0 + i, y0 + j, z0] : [x0, y0 + j, z0 + i]);
  }
  return out;
}

/**
 * A window opening (plan window()). Shell mode (default): reserves the opening so the walls leave it AIR, and builds the
 * white sill row (smooth_quartz) at y0-1 across w cells. fill mode (P3/P5): glass_pane in every opening cell.
 * north/south: x0..x0+w-1 at z0; east/west: z0..z0+w-1 at x0.
 */
export function window(g, x0, y0, z0, face, w, h, { fill = false } = {}) {
  const cells = openingCells(x0, y0, z0, face, w, h);
  if (fill) {
    for (const [x, y, z] of cells) put(g, x, y, z, block(GLASS_PANE));
    return;
  }
  for (const [x, y, z] of cells) reserve(x, y, z);
  for (const [x, , z] of openingCells(x0, y0 - 1, z0, face, w, 1)) {
    reserve(x, y0 - 1, z);
    put(g, x, y0 - 1, z, block(SMOOTH_QUARTZ));
  }
}

/**
 * An arched window (plan archWin): glass across the opening (fill), with the top-row corners as smooth_quartz_stairs
 * half=top facing outward (left corner faces west and right faces east on a north/south wall; north and south on an
 * east/west wall). w 3 or 4, h 2 or 3.
 */
export function archWin(g, x0, y0, z0, face, w, h) {
  window(g, x0, y0, z0, face, w, h, { fill: true });
  const top = y0 + h - 1;
  const along = face === "north" || face === "south";
  const [lo, hi] = along ? [[x0, top, z0], [x0 + w - 1, top, z0]] : [[x0, top, z0], [x0, top, z0 + w - 1]];
  const [fLo, fHi] = along ? ["west", "east"] : ["north", "south"];
  put(g, ...lo, B.stairs("smooth_quartz", fLo, "top"));
  put(g, ...hi, B.stairs("smooth_quartz", fHi, "top"));
}

/**
 * Black shutters (plan shutterPair): dark_oak_trapdoor open, half bottom, facing = the outward direction, in the AIR cells
 * beside the window (a0-1 and a1+1) just outside the wall plane. a0..a1 = the window's extent along the wall, fixed =
 * the wall plane (z on a north/south wall, x on an east/west wall). Cells that are not air are skipped.
 */
export function shutterPair(g, a0, a1, y0, y1, fixed, face) {
  const [ox, , oz] = DIRS[face];
  const along = face === "north" || face === "south";
  for (let y = y0; y <= y1; y++) for (const a of [a0 - 1, a1 + 1]) {
    const x = along ? a : fixed + ox, z = along ? fixed + oz : a;
    if (!g.isAir(x, y, z)) continue;
    put(g, x, y, z, B.trapdoor("dark_oak", face, "bottom", true));
  }
}

/** The turret bay walls (plan turret()): the outer ring of x29..33 z4..8 minus the chamfers (29,4),(33,4), y1..9. */
export function turret(g) {
  const { x0, x1, z0, z1 } = MASS.turret;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const ring = x === x0 || x === x1 || z === z0 || z === z1;
    const chamfer = (x === x0 || x === x1) && z === z0;
    if (!ring || chamfer) continue;
    for (let y = 0; y <= 9; y++) wallCell(g, x, y, z, { north: z === z0 || z === 8 });
  }
}

/** A portico column (plan column): quartz base y2, quartz pillars y3..7, chiseled capital y8. */
export function column(g, x, z) {
  put(g, x, 2, z, block(QUARTZ_BLOCK));
  for (let y = 3; y <= 7; y++) put(g, x, y, z, pillar(QUARTZ_PILLAR));
  put(g, x, 8, z, block(CHISELED_QUARTZ_BLOCK));
}

/** The chimney stack (plan chimneyStack): x37..39 z10..12 solid y1..13 (firebox air), y13 collar, y14 pots and campfire. */
export function chimneyStack(g) {
  const { x0, x1, z0, z1 } = MASS.chimney;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = 1; y <= 13; y++) {
    if (isReserved(x, y, z)) continue;
    put(g, x, y, z, block(hash(x, y, z) < 11 ? STONE_BRICKS : ANDESITE));
  }
  for (let x = 36; x <= 40; x++) for (let z = 9; z <= 13; z++) {
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) continue;  // the 3x3 centre stays stone
    put(g, x, 13, z, B.slab("stone_brick", "bottom"));
  }
  for (const [x, z] of [[37, 10], [39, 10], [37, 12], [39, 12]]) put(g, x, 14, z, block(STONE_BRICK_WALL));
  put(g, 38, 14, 11, ["campfire", { lit: "true", facing: "north", signal_fire: "false", waterlogged: "false" }]);
}

// ---- portico, entry, fanlight, doors --------------------------------------------------------------------------------
/**
 * The two-storey portico (plan portico): 4 columns, a ceiling/entablature over x19..26 z5..7, porch floor y1 with a
 * smooth_quartz border (x19, x26, z5), and the front steps (stone_brick_stairs y1 z4 x20..25 facing south).
 */
export function portico(g) {
  for (const [x, z] of PORTICO_COLUMNS) column(g, x, z);
  for (let x = 19; x <= 26; x++) for (let z = 5; z <= 7; z++) put(g, x, 9, z, block(SMOOTH_QUARTZ));
  for (let x = 19; x <= 26; x++) for (let z = 5; z <= 7; z++) {
    const border = x === 19 || x === 26 || z === 5;
    put(g, x, 1, z, block(border ? SMOOTH_QUARTZ : SMOOTH_STONE));
  }
  for (let x = 20; x <= 25; x++) put(g, x, 1, 4, B.stairs("stone_brick", "south", "bottom"));
}

/** Two dark oak door halves (2 blocks tall) at (x, y, z); hinge left or right, facing the outward direction. */
function doorPair(g, x, y, z, { mat = "dark_oak", facing = "north", hinge = "left", open = true } = {}) {
  const st = (half) => ({ facing, half, hinge, open: String(open), powered: "false" });
  put(g, x, y, z, [`${mat}_door`, st("lower")]);
  put(g, x, y + 1, z, [`${mat}_door`, st("upper")]);
}

/** The entry: dark oak double door (22..23, 2..3, 8) facing north, with a glass transom (22..23, 4, 8). */
export function entryDoor(g) {
  doorPair(g, 22, 2, 8, { hinge: "left" });
  doorPair(g, 23, 2, 8, { hinge: "right" });
  put(g, 22, 4, 8, block(GLASS_PANE));
  put(g, 23, 4, 8, block(GLASS_PANE));
}

/** The fanlight over the door: glass x21..24 y5, x22..23 y6, quartz shoulders, then the arched window x21..24 y7..8. */
export function fanlight(g) {
  for (let x = 21; x <= 24; x++) put(g, x, 5, 8, block(GLASS_PANE));
  for (let x = 22; x <= 23; x++) put(g, x, 6, 8, block(GLASS_PANE));
  put(g, 21, 6, 8, B.stairs(SMOOTH_QUARTZ, "west", "top"));
  put(g, 24, 6, 8, B.stairs(SMOOTH_QUARTZ, "east", "top"));
  archWin(g, 21, 7, 8, "north", 4, 2);
}

/** A carriage door leaf (3 wide, x0..x0+2): birch planks y2..3 and a glass strip y4 on the leaf plane z7; dark oak straps. */
export function carriageDoor(g, x0) {
  for (let x = x0; x <= x0 + 2; x++) {
    for (let y = 2; y <= 3; y++) put(g, x, y, 7, block(BIRCH_PLANKS));
    put(g, x, 4, 7, block(GLASS_PANE));
  }
  for (const [x, y] of [[x0, 2], [x0, 3], [x0 + 2, 2], [x0 + 2, 3]]) put(g, x, y, 6, B.trapdoor("dark_oak", "north", "bottom", true));
}

/**
 * A wall lamp (plan wallLamp): a dark oak fence stub at (x,y,z) on the outside of the wall, connected to the wall behind
 * it (face = the outward direction, the wall lies opposite), and a hanging lantern under it at (x,y-1,z).
 */
export function wallLamp(g, x, y, z, face) {
  const toWall = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  toWall[{ north: "south", south: "north", east: "west", west: "east" }[face]] = "true";
  put(g, x, y, z, [DARK_OAK_FENCE, toWall]);
  put(g, x, y - 1, z, [LANTERN, { hanging: "true", waterlogged: "false" }]);
}

/** The house-number plaque: oak wall sign on the wall plane's front face at (x,y,z), facing north. */
export function plaque(g, x, y, z) {
  put(g, x, y, z, B.sign("oak", ["1428", "OAK CT"], { wall: true, facing: "north" }));
}

/** A door planter (plan planter): stone brick wall pedestal at y1, potted azalea bush at y2. */
export function planter(g, x, z) {
  put(g, x, 1, z, block(STONE_BRICK_WALL));
  put(g, x, 2, z, block(POTTED_AZALEA_BUSH));
}

// ---- stair and chandelier (inside the foyer void) -------------------------------------------------------------------
/**
 * The foyer flight (plan stairFlight, P6): dark oak stairs x20..22 at (z10,y2),(z11,y3),(z12,y4),(z13,y5) facing south;
 * quartz bullnose slabs (20..24, 2, 9); banister bars (23,3,10),(23,4,11),(23,5,12),(23,6,13); gallery rail (23..25,6,14).
 */
export function stairFlight(g) {
  for (const [z, y] of [[10, 2], [11, 3], [12, 4], [13, 5]])
    for (let x = 20; x <= 22; x++) put(g, x, y, z, B.stairs("dark_oak", "south", "bottom"));
  // the two cells in front of the entry door are white carpet, not a slab: a walk cannot step onto a slab, so the entrance
  // would be sealed (carpet is floor-level and walkable, and reads as a threshold runner)
  for (let x = 20; x <= 24; x++) put(g, x, 2, 9, x === 22 || x === 23 ? block("white_carpet") : B.slab(SMOOTH_QUARTZ, "bottom"));
  for (const [x, y, z] of [[23, 3, 10], [23, 4, 11], [23, 5, 12], [23, 6, 13]]) put(g, x, y, z, block(IRON_BARS));
  for (let x = 23; x <= 24; x++) put(g, x, 6, 14, block(IRON_BARS));
  // the rail's east end moves from (25,6,14) to (25,6,13): (25,6,14) is the approach to the bedroom 3 door, and (25,6,13)
  // still stops a step into the open foyer void
  put(g, 25, 6, 13, block(IRON_BARS));
}

/**
 * The chandelier (plan chandelier): chain (23,7..8,11); iron-bar plus at y6 centred (23,6,11); five hanging lanterns at y5.
 * A lantern is skipped where a bar already stands (the banister at (23,5,12) keeps its cell).
 */
export function chandelier(g) {
  for (const y of [7, 8]) put(g, 23, y, 11, B.chain("y"));
  for (const [x, z] of [[22, 11], [23, 11], [24, 11], [23, 10], [23, 12]]) put(g, x, 6, z, block(IRON_BARS));
  for (const [x, z] of [[22, 11], [24, 11], [23, 10], [23, 12], [23, 11]]) {
    if (!g.isAir(x, 5, z)) continue;
    put(g, x, 5, z, [LANTERN, { hanging: "true", waterlogged: "false" }]);
  }
}

// ---- site: street, walk, lawn, planting, tree, lamps --------------------------------------------------------------
/** The street (plan street, E21): z0 gray/black concrete hash, z1 sidewalk, kerb slabs at y1 z1 from kerbFrom to x1. */
export function street(g, x0, x1, { kerbFrom = 13 } = {}) {
  for (let x = x0; x <= x1; x++) {
    put(g, x, 0, 0, block(hash(x, 0, 0) % 10 < 7 ? GRAY_CONCRETE : BLACK_CONCRETE));
    put(g, x, 0, 1, block(POLISHED_ANDESITE));
    if (x >= kerbFrom) put(g, x, 1, 1, B.slab("stone_brick", "bottom"));
  }
}

/** The driveway (plan driveway, E22): hash of light gray concrete 75 / stone 15 / andesite 10; z%4==1 rows smooth_stone. */
export function driveway(g, x0, z0, x1, z1) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (z % 4 === 1) { put(g, x, 0, z, block(SMOOTH_STONE)); continue; }
    const h = hash(x, 0, z);
    put(g, x, 0, z, block(h < 15 ? LIGHT_GRAY_CONCRETE : h < 18 ? STONE : ANDESITE));
  }
}

/** The front walk (plan frontWalk, E23): polished andesite x22..23 z1..3 with stone brick borders at x21 and x24. */
export function frontWalk(g) {
  for (let z = 1; z <= 3; z++) {
    for (const x of [22, 23]) put(g, x, 0, z, block(POLISHED_ANDESITE));
    for (const x of [21, 24]) put(g, x, 0, z, block(STONE_BRICKS));
  }
}

/** The lawn (plan lawn, E24): grass_block y0 over x0..x1 z0..z1; a short_grass tuft where hash%10==0 and no cell within 1
 * is avoid(x,z) (a path or paving predicate). */
export function lawn(g, x0, z0, x1, z1, { avoid = () => false } = {}) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    put(g, x, 0, z, block(GRASS_BLOCK));
    const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => avoid(x + dx, z + dz));
    if (hash(x, 0, z) % 10 === 0 && !near) put(g, x, 1, z, block(SHORT_GRASS));
  }
}

/** A shrub (plan shrub, E25): azalea leaves y1..2 persistent; kind "flower" puts flowering azalea at y2; coarse dirt mulch y0. */
export function shrub(g, x, z, kind = "plain") {
  put(g, x, 0, z, block(COARSE_DIRT));
  put(g, x, 1, z, [AZALEA_LEAVES, { persistent: "true" }]);
  put(g, x, 2, z, [kind === "flower" ? FLOWERING_AZALEA_LEAVES : AZALEA_LEAVES, { persistent: "true" }]);
}

/**
 * A foundation bed (plan bed, E25): coarse dirt mulch over x0..x1 z0..z1; shrubs on the back row (every 3rd flowering);
 * the front row (the side facing `front`: north, south, east or west) carries allium / pink tulip / azure bluet at y1.
 */
export function bed(g, x0, z0, x1, z1, front = "north") {
  const frontCells = [], backCells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    put(g, x, 0, z, block(COARSE_DIRT));
    const onFront = { north: z === z0, south: z === z1, west: x === x0, east: x === x1 }[front];
    const onBack = { north: z === z1, south: z === z0, west: x === x1, east: x === x0 }[front];
    if (onFront) frontCells.push([x, z]);
    else if (onBack) backCells.push([x, z]);
  }
  backCells.forEach(([x, z], i) => shrub(g, x, z, i % 3 === 2 ? "flower" : "plain"));
  const flowers = [ALLIUM, PINK_TULIP, AZURE_BLUET];
  frontCells.forEach(([x, z], i) => put(g, x, 1, z, block(flowers[i % 3])));
}

/** A young birch (plan youngTree, E26): trunk y1..5, leaf crown, two oak fence stakes at x±2, coarse dirt mulch 3x3. */
export function youngTree(g, x, z) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) put(g, x + dx, 0, z + dz, block(COARSE_DIRT));
  for (let y = 1; y <= 5; y++) put(g, x, y, z, [BIRCH_LOG, { axis: "y" }]);
  const leaf = [BIRCH_LEAVES, { persistent: "true" }];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;   // the four corners
    if (dx === 0 && dz === 0) continue;                       // the trunk
    put(g, x + dx, 4, z + dz, leaf);
    put(g, x + dx, 5, z + dz, leaf);
  }
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) put(g, x + dx, 6, z + dz, leaf);
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) put(g, x + dx, 7, z + dz, leaf);
  for (const dx of [-2, 2]) for (const y of [1, 2]) put(g, x + dx, y, z, block(OAK_FENCE));
}

/** A lamp post (plan lampPost, E27): stone brick wall y1..3 with a standing lantern at y4. */
export function lampPost(g, x, z) {
  for (let y = 1; y <= 3; y++) put(g, x, y, z, block(STONE_BRICK_WALL));
  put(g, x, 4, z, [LANTERN, { hanging: "false", waterlogged: "false" }]);
}

/** The back deck (plan deck, E28): boards y1 (spruce on even z, oak on odd z), coarse dirt y0, and a dark oak rail
 * y2 along the sides listed in `rail` ("north" | "south" | "east" | "west"), except cells where skip(x,z) is true (a
 * step gap). Corner posts (fence y2..3, slab cap y4) stand on every corner that touches a railed side. */
export function deck(g, x0, z0, x1, z1, { rail = [], skip = () => false } = {}) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    put(g, x, 0, z, block(COARSE_DIRT));
    put(g, x, 1, z, block(z % 2 === 0 ? SPRUCE_PLANKS : OAK_PLANKS));
  }
  const railed = (side) => rail.includes(side);
  const onRail = (x, z) => (z === z0 && railed("north")) || (z === z1 && railed("south")) || (x === x0 && railed("west")) || (x === x1 && railed("east"));
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!onRail(x, z) || skip(x, z)) continue;
    const alongX = z === z0 || z === z1;
    const links = alongX ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" };
    put(g, x, 2, z, [DARK_OAK_FENCE, links]);
  }
  const corners = [[x0, z0, ["north", "west"]], [x1, z0, ["north", "east"]], [x0, z1, ["south", "west"]], [x1, z1, ["south", "east"]]];
  for (const [x, z, sides] of corners) {
    if (!sides.some(railed)) continue;
    put(g, x, 2, z, [DARK_OAK_FENCE, {}]);
    put(g, x, 3, z, [DARK_OAK_FENCE, {}]);
    put(g, x, 4, z, B.slab("dark_oak", "bottom"));
  }
}

/** A patio table and four chairs (plan patioSet): fence post with a pressure plate top; spruce stair chairs facing in. */
export function patioSet(g, x, z) {
  put(g, x, 2, z, block(DARK_OAK_FENCE));
  put(g, x, 3, z, block(OAK_PRESSURE_PLATE));
  put(g, x - 1, 2, z, B.stairs("spruce", "west", "bottom"));
  put(g, x + 1, 2, z, B.stairs("spruce", "east", "bottom"));
  put(g, x, 2, z - 1, B.stairs("spruce", "north", "bottom"));
  put(g, x, 2, z + 1, B.stairs("spruce", "south", "bottom"));
}

/** A French door pair (plan frenchDoor): birch doors (x,2..3,z) and (x+1,2..3,z) facing south, glass transom y4. */
export function frenchDoor(g, x, z) {
  doorPair(g, x, 2, z, { mat: "birch", facing: "south", hinge: "left" });
  doorPair(g, x + 1, 2, z, { mat: "birch", facing: "south", hinge: "right" });
  put(g, x, 4, z, block(GLASS_PANE));
  put(g, x + 1, 4, z, block(GLASS_PANE));
}

// ---- roofs --------------------------------------------------------------------------------------------------------
// The four pieces (plan ROOF PIECES). Each is one roof() call on the cottage preset with the dark-slate palette; the
// cottage preset's own chimney is suppressed (the chimney stack is built by the shell). maxHeight keeps the ridge at y13
// (R3, R1), y14 (R2) and the cone at y13 (R5).
const ROOF_PIECES = {
  R3: { footprint: [[0, 6, 12, 19]], o: { style: "gable", ridgeAxis: "x", pitch: "half", overhang: { north: 1, west: 1, south: 1, east: 0 }, maxHeight: 4, gable: SMOOTH_SANDSTONE, dormers: { face: "north", count: 2, style: "gable", width: 3, height: 2, window: GLASS_PANE } } },
  R1: { footprint: [[12, 8, 33, 23], [33, 12, 43, 27]], o: { style: "hip", pitch: "half", overhang: 1, eave: "plain", ridge: "slab", maxHeight: 4, dormers: { face: "south", count: 2, style: "gable", width: 3, height: 2 }, keep: [{ from: [37, 1, 10], to: [39, 14, 12] }] } },
  R2: { footprint: [[18, 4, 27, 14]], o: { style: "gable", ridgeAxis: "z", pitch: 45, eave: "cornice", trim: SMOOTH_QUARTZ, verge: SMOOTH_QUARTZ, gable: SMOOTH_QUARTZ, ridge: "none", maxHeight: 5 } },
  R5: { footprint: [[29, 4, 33, 8]], preset: "tower-cap", o: { maxHeight: 4 } },
};

/**
 * One roof piece by id (R3, R1, R2, R5; plan P2). Build in the order R3, R1, R2, R5. dryRun: compute only, write nothing,
 * return the tool's facts (plan: dry-run first). After a real R2 build, its attic window (glass in an iron-bar frame,
 * x22..23 y11 z4) is placed; a finial lightning rod sits above the R5 cone at (31,14,6).
 */
export function roofPiece(g, id, { dryRun = false } = {}) {
  const piece = ROOF_PIECES[id];
  if (!piece) throw new Error(`roofPiece: unknown id ${id}`);
  const opts = { y: 10, material: ROOF_PALETTE, chimneys: [], ...piece.o, dryRun };
  const r = roof(g, piece.footprint, piece.preset ?? "cottage", opts);
  if (dryRun) return r;
  if (id === "R2") {
    for (const [x, y, z] of [[21, 11, 4], [24, 11, 4], [22, 12, 4], [23, 12, 4]]) put(g, x, y, z, block(IRON_BARS));
    for (const x of [22, 23]) put(g, x, 11, 4, block(GLASS_PANE));
  }
  if (id === "R5") put(g, 31, 14, 6, block(LIGHTNING_ROD));
  return r;
}
