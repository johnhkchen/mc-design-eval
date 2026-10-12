// Shared vocabulary for the sfvictorian-split2 build (plan.md: SITE, PALETTE, VOCABULARY).
// Every helper takes the build grid `g` first and writes real blocks with valid states through build.mjs.
// Coordinates are absolute as in plan.md: x east, y up, z south; the street is north (z0 is the sidewalk).
// Helpers only ADD into air; a part that calls them must not overwrite the shell.
import { B, DIRS, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- SITE (plan.md, inclusive ranges) ----------------------------------------------------------------------------
export const LOT = { x: [0, 15], y: [0, 20], z: [0, 49] };        // chimneys rise to y22 (plan ROOFS), so grids need y0..22
export const FRONT_Z = 7;                                          // street face of the main body
export const BACK_Z = 32;                                          // back face of the main body
export const SIDEWALK = { x: [0, 15], y: 0, z: [0, 1] };
export const STREET_LAMP = { x: 0, y: [1, 4], z: 1 };
export const DRIVEWAY = { x: [1, 6], y: 0, z: [2, 6] };
export const FRONT_GARDEN = { x: [7, 8], y: 0, z: [3, 6] };        // RESERVED for the podzol bed
export const IRON_FENCE = { x: [6, 8], y: 1, z: [2, 6] };
export const FRONT_STAIR = { x: [10, 13], y: [0, 4], z: [2, 6] };
export const STAIR_CHEEKS_X = [9, 14];
export const MAIN_BODY = { x: [1, 14], y: [0, 16], z: [7, 32] };
export const ANGLED_BAY = { x: [1, 6], y: [3, 17], z: [4, 6] };
export const PORCH_RECESS = { x: [10, 13], y: [4, 8], z: [7, 9] };
export const PORCH_COLUMNS_X = [10, 13];
export const FALSE_FRONT = { x: [1, 14], y: [17, 20], z: 7 };
export const WEST_NEIGHBOUR = { x: 0, y: [0, 14], z: [7, 32] };
export const EAST_NEIGHBOUR = { x: 15, y: [0, 17], z: [7, 32] };
export const ROOF_ZONE = { x: [0, 15], y: [17, 19], z: [7, 33] };
export const ROOF_FOOTPRINT = [[1, 7, 14, 32]];
export const BACK_DECK = { x: [2, 13], y: [0, 5], z: [33, 37] };
export const DECK_STAIR = { x: [11, 13], y: [0, 3], z: [38, 40] };
export const PATIO = { x: [2, 13], y: 0, z: [33, 37] };
export const BACK_GARDEN = { x: [1, 14], y: 0, z: [38, 48] };
export const GARDEN_TREE = { x: 4, y: [1, 7], z: 44 };
export const VEGETABLE_BED = { x: [7, 9], y: 0, z: [44, 47] };
export const GARDEN_FENCE = { y: [1, 2], sidesX: [0, 15], sideZ: [33, 49], backZ: 49, backX: [0, 15] };
export const GARAGE_DOOR = { x: [2, 5], y: [1, 3], z: FRONT_Z };
export const FLOOR_Y = { garage: 0, main: 4, second: 8, top: 12 };  // floor slab y of each level (plan FLOORS)

// ---- PALETTE: every id from palette.json as a named constant --------------------------------------------------------
// teal body
export const WARPED_PLANKS = "warped_planks";
export const WARPED_SLAB = "warped_slab";
export const WARPED_STAIRS = "warped_stairs";
// gold shingle
export const BAMBOO_MOSAIC = "bamboo_mosaic";
export const BAMBOO_MOSAIC_SLAB = "bamboo_mosaic_slab";
export const BAMBOO_MOSAIC_STAIRS = "bamboo_mosaic_stairs";
// burgundy
export const CRIMSON_PLANKS = "crimson_planks";
export const CRIMSON_SLAB = "crimson_slab";
export const CRIMSON_STAIRS = "crimson_stairs";
export const CRIMSON_DOOR = "crimson_door";
export const CRIMSON_TRAPDOOR = "crimson_trapdoor";
// cream trim
export const SMOOTH_QUARTZ = "smooth_quartz";
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";
export const QUARTZ_PILLAR = "quartz_pillar";
export const CHISELED_QUARTZ_BLOCK = "chiseled_quartz_block";
export const QUARTZ_STAIRS = "quartz_stairs";
export const QUARTZ_SLAB = "quartz_slab";
// sea-green base
export const DARK_PRISMARINE = "dark_prismarine";
export const DARK_PRISMARINE_SLAB = "dark_prismarine_slab";
export const DARK_PRISMARINE_STAIRS = "dark_prismarine_stairs";
// interior structure
export const BIRCH_PLANKS = "birch_planks";
export const BIRCH_STAIRS = "birch_stairs";
export const BIRCH_SLAB = "birch_slab";
export const BIRCH_FENCE = "birch_fence";
export const BIRCH_DOOR = "birch_door";
export const BIRCH_TRAPDOOR = "birch_trapdoor";
export const SMOOTH_STONE = "smooth_stone";
export const DARK_OAK_PLANKS = "dark_oak_planks";
export const SPRUCE_PLANKS = "spruce_planks";
// masonry
export const BRICKS = "bricks";
export const BRICK_STAIRS = "brick_stairs";
export const BRICK_SLAB = "brick_slab";
export const NETHERRACK = "netherrack";
export const FIRE = "fire";
// roof
export const DEEPSLATE_TILES = "deepslate_tiles";
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";
export const IRON_BARS = "iron_bars";
// neighbours
export const YELLOW_TERRACOTTA = "yellow_terracotta";
export const LIGHT_BLUE_TERRACOTTA = "light_blue_terracotta";
// glass
export const GLASS_PANE = "glass_pane";
export const WHITE_STAINED_GLASS_PANE = "white_stained_glass_pane";
// iron & light
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";
export const LANTERN = "lantern";
export const SOUL_LANTERN = "soul_lantern";
export const IRON_CHAIN = "iron_chain";
export const END_ROD = "end_rod";
// ground
export const POLISHED_ANDESITE = "polished_andesite";
export const GRASS_BLOCK = "grass_block";
export const PODZOL = "podzol";
export const COARSE_DIRT = "coarse_dirt";
export const FARMLAND = "farmland";
export const WATER = "water";
// deck
export const SPRUCE_LOG = "spruce_log";
export const SPRUCE_FENCE = "spruce_fence";
export const SPRUCE_STAIRS = "spruce_stairs";
export const SPRUCE_SLAB = "spruce_slab";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
// plants
export const OAK_LOG = "oak_log";
export const OAK_LEAVES = "oak_leaves";
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";
export const FLOWERING_AZALEA = "flowering_azalea";
export const ROSE_BUSH = "rose_bush";
export const AZURE_BLUET = "azure_bluet";
export const ALLIUM = "allium";
export const POPPY = "poppy";
export const LILAC = "lilac";
export const PEONY = "peony";
export const WHEAT = "wheat";
export const CARROTS = "carrots";
export const SHORT_GRASS = "short_grass";
export const TALL_GRASS = "tall_grass";
export const FLOWER_POT = "flower_pot";
export const POTTED_FERN = "potted_fern";
// objects (furniture, rooms)
export const BOOKSHELF = "bookshelf";
export const LECTERN = "lectern";
export const CRAFTING_TABLE = "crafting_table";
export const FURNACE = "furnace";
export const SMOKER = "smoker";
export const BLAST_FURNACE = "blast_furnace";
export const BARREL = "barrel";
export const CHEST = "chest";
export const CAULDRON = "cauldron";
export const WATER_CAULDRON = "water_cauldron";
export const HOPPER = "hopper";
export const LOOM = "loom";
export const CARTOGRAPHY_TABLE = "cartography_table";
export const SMITHING_TABLE = "smithing_table";
export const STONECUTTER = "stonecutter";
export const GRINDSTONE = "grindstone";
export const DECORATED_POT = "decorated_pot";
export const JUKEBOX = "jukebox";
export const WHITE_BED = "white_bed";
export const RED_BED = "red_bed";
export const BLUE_BED = "blue_bed";
export const CYAN_BED = "cyan_bed";
export const RED_CARPET = "red_carpet";
export const WHITE_CARPET = "white_carpet";
export const BLUE_CARPET = "blue_carpet";
export const GREEN_CARPET = "green_carpet";
export const PURPLE_CARPET = "purple_carpet";
export const LIGHT_GRAY_CARPET = "light_gray_carpet";
export const MAGENTA_CARPET = "magenta_carpet";
export const BROWN_CARPET = "brown_carpet";
export const YELLOW_CARPET = "yellow_carpet";
export const WHITE_WOOL = "white_wool";
export const RED_WOOL = "red_wool";
export const CYAN_WOOL = "cyan_wool";
export const CANDLE = "candle";
export const BREWING_STAND = "brewing_stand";
export const ITEM_FRAME = "item_frame";
export const DARK_OAK_STAIRS = "dark_oak_stairs";
export const DARK_OAK_SLAB = "dark_oak_slab";
export const DARK_OAK_FENCE = "dark_oak_fence";
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";
export const DARK_OAK_DOOR = "dark_oak_door";
export const DARK_OAK_PRESSURE_PLATE = "dark_oak_pressure_plate";
export const OAK_STAIRS = "oak_stairs";
export const OAK_SLAB = "oak_slab";
export const OAK_PLANKS = "oak_planks";
export const SPRUCE_PRESSURE_PLATE = "spruce_pressure_plate";
export const DAYLIGHT_DETECTOR = "daylight_detector";
export const IRON_BLOCK = "iron_block";
export const IRON_TRAPDOOR = "iron_trapdoor";
export const IRON_DOOR = "iron_door";
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";

// ---- local shorthands: stairs and slabs take the palette id, B.* takes the material stem ------------------------
const stairs = (id, facing, half = "bottom") => B.stairs(id.replace(/_stairs$/, ""), facing, half);
const slab = (id, type = "bottom") => B.slab(id.replace(/_slab$/, ""), type);
const NO_LINKS = { north: "false", south: "false", east: "false", west: "false" };

// ---- VOCABULARY helpers ----------------------------------------------------------------------------------------------

/** Block for a wall course on the street or back face (the bay uses the same course). */
export function frontWallZone(y) {
  if (y <= 3) return DARK_PRISMARINE;
  if (y === 4 || y === 16) return CRIMSON_PLANKS;
  if (y === 8 || y === 12) return BAMBOO_MOSAIC;
  return WARPED_PLANKS;
}

/** Gold fish-scale course along cells [[x, z], ...] at height y. */
export function fishScaleBand(g, y, cells) {
  for (const [x, z] of cells) g.set(x, y, z, BAMBOO_MOSAIC);
}

/** Glass sash over the box; a 3-high window gets a meeting rail (smooth_quartz_slab) in its middle row. */
export function sashWindow(g, { x0, x1, y0, y1, z }) {
  const pane = { north: "false", south: "false", east: "true", west: "true" };   // panes run along x in a wall on z
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      if (y1 - y0 === 2 && y === y0 + 1) g.set(x, y, z, ...slab(SMOOTH_QUARTZ_SLAB, "bottom"));
      else g.set(x, y, z, GLASS_PANE, pane);
    }
}

/** Sill under a window: smooth_quartz_slab top, one row below y (the window's bottom row), proud at z. */
export function sill(g, x0, x1, y, z) {
  for (let x = x0; x <= x1; x++) g.set(x, y - 1, z, ...slab(SMOOTH_QUARTZ_SLAB, "top"));
}

/** Hood over the window's top row at y. ornate adds a stair either side (facing out); plain is the slab alone. */
export function hood(g, x0, x1, y, z, ornate = false) {
  if (ornate) {
    g.set(x0 - 1, y, z, ...stairs(SMOOTH_QUARTZ_STAIRS, "east", "top"));
    g.set(x1 + 1, y, z, ...stairs(SMOOTH_QUARTZ_STAIRS, "west", "top"));
  }
  for (let x = x0; x <= x1; x++) g.set(x, y, z, ...slab(SMOOTH_QUARTZ_SLAB, "top"));
}

/** One cornice bracket: smooth_quartz_stairs, half top, lip toward the street (facing south). */
export function bracket(g, x, y, z) {
  g.set(x, y, z, ...stairs(SMOOTH_QUARTZ_STAIRS, "south", "top"));
}

/** Cornice run: solid smooth_quartz on zSolid, the crown stairs one cell toward the street on zCrown. */
export function corniceRun(g, x0, x1, y, zSolid, zCrown) {
  for (let x = x0; x <= x1; x++) {
    g.set(x, y, zSolid, SMOOTH_QUARTZ);
    g.set(x, y, zCrown, ...stairs(SMOOTH_QUARTZ_STAIRS, "south", "top"));
  }
}

/** Corbel under a projecting course: the same stair as a bracket. */
export function corbel(g, x, y, z) {
  g.set(x, y, z, ...stairs(SMOOTH_QUARTZ_STAIRS, "south", "top"));
}

/** Column: quartz_pillar (axis y) from y0 to y1-1, chiseled capital at y1. */
export function column(g, x, y0, y1, z) {
  for (let y = y0; y < y1; y++) g.set(x, y, z, ...B.pillar(QUARTZ_PILLAR, "y"));
  g.set(x, y1, z, CHISELED_QUARTZ_BLOCK);
}

/** Arch spring: a row of cream half-top stairs (facing south) from x0 to x1. */
export function archSpring(g, x0, x1, y, z) {
  for (let x = x0; x <= x1; x++) g.set(x, y, z, ...stairs(SMOOTH_QUARTZ_STAIRS, "south", "top"));
}

/**
 * Parapet course at y, from x0 to x1 on z: warped_planks at the posts, bamboo_mosaic panels between.
 * coping: [[xa, xb], ...] ranges that get a smooth_quartz_slab (bottom) at y+1 (the plan's coping; not in the
 * VOCABULARY signature, so it is an optional seventh argument).
 */
export function parapet(g, x0, x1, y, z, posts, coping = []) {
  for (let x = x0; x <= x1; x++) g.set(x, y, z, posts.includes(x) ? WARPED_PLANKS : BAMBOO_MOSAIC);
  for (const [xa, xb] of coping)
    for (let x = xa; x <= xb; x++) g.set(x, y + 1, z, ...slab(SMOOTH_QUARTZ_SLAB, "bottom"));
}

/** Pediment: the architect's rows (rake stairs, gold tympanum, keystone pair, drip stairs). */
export function pediment(g) {
  for (let x = 6; x <= 9; x++) g.set(x, 19, 7, BAMBOO_MOSAIC);
  g.set(5, 19, 7, ...stairs(SMOOTH_QUARTZ_STAIRS, "east"));
  g.set(10, 19, 7, ...stairs(SMOOTH_QUARTZ_STAIRS, "west"));
  g.set(6, 20, 7, ...stairs(SMOOTH_QUARTZ_STAIRS, "east"));
  g.set(9, 20, 7, ...stairs(SMOOTH_QUARTZ_STAIRS, "west"));
  g.set(7, 20, 7, CHISELED_QUARTZ_BLOCK);
  g.set(8, 20, 7, CHISELED_QUARTZ_BLOCK);
  for (let x = 5; x <= 10; x++) g.set(x, 19, 6, ...stairs(SMOOTH_QUARTZ_STAIRS, "south", "top"));   // drip, proud at z6
}

/** Bay wall ring at height y: pillars at x2 and x5 on z5, course cells between, diagonals at (1,y,6) and (6,y,6). */
export function bayCourse(g, y) {
  g.set(2, y, 5, ...B.pillar(QUARTZ_PILLAR, "y"));
  g.set(5, y, 5, ...B.pillar(QUARTZ_PILLAR, "y"));
  g.set(3, y, 5, frontWallZone(y));
  g.set(4, y, 5, frontWallZone(y));
  g.set(1, y, 6, frontWallZone(y));
  g.set(6, y, 6, frontWallZone(y));
}

/** Garage door: crimson trapdoors (vertical, facing north, open) filling x2..5, y1..3 on the street face. */
export function garageDoor(g) {
  for (let x = GARAGE_DOOR.x[0]; x <= GARAGE_DOOR.x[1]; x++)
    for (let y = GARAGE_DOOR.y[0]; y <= GARAGE_DOOR.y[1]; y++)
      g.set(x, y, GARAGE_DOOR.z, ...B.trapdoor("crimson", "north", "bottom", true));
}

/** Two-wide door: lower and upper halves at x (hinge left) and x+1 (hinge right), both facing `facing`. */
export function doorPair(g, x, y, z, facing, mat = "crimson") {
  for (const [dx, hinge] of [[0, "left"], [1, "right"]])
    for (const [dy, half] of [[0, "lower"], [1, "upper"]])
      g.set(x + dx, y + dy, z, ...B.door(mat, facing, half, hinge));
}

/** Front stair to the porch: solid dark_prismarine under treads (z2..4 at y1..3), cream landing (z5..6, y4), cheeks. */
export function frontStair(g) {
  const treads = [[2, 1], [3, 2], [4, 3]];               // [z, tread y]: the stair rises toward +z (south), so facing south
  const rise = (z) => (z <= 4 ? treads.find(([tz]) => tz === z)[1] : 4);
  for (let x = FRONT_STAIR.x[0]; x <= FRONT_STAIR.x[1]; x++) {
    for (let z = FRONT_STAIR.z[0]; z <= FRONT_STAIR.z[1]; z++) {
      const top = rise(z);
      for (let y = 0; y < top; y++) g.set(x, y, z, DARK_PRISMARINE);
      if (z <= 4) g.set(x, top, z, ...stairs(SMOOTH_QUARTZ_STAIRS, "south", "bottom"));
      else g.set(x, top, z, SMOOTH_QUARTZ);
    }
  }
  for (const x of STAIR_CHEEKS_X)
    for (let z = FRONT_STAIR.z[0]; z <= FRONT_STAIR.z[1]; z++) {
      const top = rise(z);
      for (let y = FRONT_STAIR.y[0] + 1; y <= top; y++) g.set(x, y, z, DARK_PRISMARINE);
      g.set(x, top + 1, z, ...slab(SMOOTH_QUARTZ_SLAB, "bottom"));
    }
}

/** Newel post: quartz_pillar at y1..2 and a standing lantern at y3. */
export function newel(g, x, z) {
  g.set(x, 1, z, ...B.pillar(QUARTZ_PILLAR, "y"));
  g.set(x, 2, z, ...B.pillar(QUARTZ_PILLAR, "y"));
  g.set(x, 3, z, ...B.lantern(false));
}

/**
 * Stair run of n steps rising toward dir ("north" or "south"; facing = dir = the ascent direction). Step k sits at
 * (x0..x1, yStart+k, zStart+k*dz). Under each step, the cells from yStart up to the step are filled with birch_planks
 * (the floor, at yStart-1, is left alone).
 */
export function stairRun(g, x0, x1, zStart, yStart, dir, n, mat = BIRCH_STAIRS) {
  if (dir !== "north" && dir !== "south") throw new Error(`stairRun: dir must be north or south, got ${dir}`);
  const dz = DIRS[dir][2];
  for (let k = 0; k < n; k++) {
    const y = yStart + k, z = zStart + k * dz;
    for (let x = x0; x <= x1; x++) {
      for (let fy = yStart; fy < y; fy++) g.set(x, fy, z, BIRCH_PLANKS);
      g.set(x, y, z, ...B.stairs(mat.replace(/_stairs$/, ""), dir, "bottom"));
    }
  }
}

/** Neighbour house wall: terracotta at x for z7..32, y0..hStone, a smooth_quartz_slab cap at capY. */
export function neighbour(g, x, hStone, capY, stone) {
  for (let z = MAIN_BODY.z[0]; z <= MAIN_BODY.z[1]; z++) {
    for (let y = 0; y <= hStone; y++) g.set(x, y, z, stone);
    g.set(x, capY, z, ...slab(SMOOTH_QUARTZ_SLAB, "bottom"));
  }
}

/**
 * The roof(...) call from plan ROOFS (shop preset, held low behind the false front). Changed from the plan's options
 * for the grid frame and the palette, and noted in the file header of the part:
 *  - overhang per side (front 0): the plan's eaves sit on x0 and x15; a uniform 1 plus the fascia pushes them to x-1
 *    and x16, and roof() then grows and shifts the whole grid (shift [1,0,0]).
 *  - edges { fascia: false, soffit: false }: no cell outside the lot, and no soffit slab at z7 (the plan: nothing at z<=7).
 *  - texture: false with material deepslate_tiles: the tool's dark-slate mix uses cobbled and blackstone blocks, which
 *    are not in palette.json; the plan's roof role is deepslate tiles, stairs and slabs.
 *  - no chimneys here: a size-1 chimney puts a campfire on top (not in palette), and plan P3 builds the two chimneys with chimney().
 * Returns roof()'s result (shift, warnings, facts), so the part can read the warnings (ROOF_NO_OVERHANG is by design).
 */
export function roofCall(g) {
  return roof(g, ROOF_FOOTPRINT, "shop", {
    y: 17, pitch: "half", maxHeight: 3, overhang: { north: 0, south: 1, east: 1, west: 1 },
    material: DEEPSLATE_TILES, texture: false, gable: BAMBOO_MOSAIC,
    ridge: "crest", dormers: { count: 0 }, edges: { fascia: false, soffit: false },
    keep: [{ from: [0, 16, 3], to: [15, 21, 7] }],
  });
}

/** Chimney stack: bricks y16..21 at (x, *, z), a brick_slab (bottom) capping it at y22. */
export function chimney(g, x, z) {
  for (let y = 16; y <= 21; y++) g.set(x, y, z, BRICKS);
  g.set(x, 22, z, ...slab(BRICK_SLAB, "bottom"));
}

/** Iron fence along the front garden: polished_blackstone_wall posts at (6,1,2) and (6,1,6), iron bars between. */
export function ironFence(g) {
  g.set(6, 1, 2, POLISHED_BLACKSTONE_WALL, { up: "true" });
  g.set(6, 1, 6, POLISHED_BLACKSTONE_WALL, { up: "true" });
  g.set(7, 1, 2, IRON_BARS, { north: "false", south: "false", east: "true", west: "true" });
  g.set(8, 1, 2, IRON_BARS, { north: "false", south: "false", east: "true", west: "true" });
  for (let z = 3; z <= 5; z++) g.set(6, 1, z, IRON_BARS, { north: "true", south: "true", east: "false", west: "false" });
}

/** Street lamp at (0, *, 1): a polished_blackstone_wall post at y1..3 and a standing lantern at y4. */
export function streetLamp(g) {
  for (let y = 1; y <= 3; y++) g.set(0, y, 1, POLISHED_BLACKSTONE_WALL, { up: "true" });
  g.set(0, 4, 1, ...B.lantern(false));
}

/** Front garden bed: podzol at (7..8, 0, 3..6) with roses, azure bluet, allium, flowering azalea and poppy. */
export function gardenBed(g) {
  g.fill([7, 0, 3], [8, 0, 6], PODZOL);
  g.set(7, 1, 4, ROSE_BUSH, { half: "lower" });
  g.set(7, 2, 4, ROSE_BUSH, { half: "upper" });
  g.set(8, 1, 4, AZURE_BLUET);
  g.set(8, 1, 5, ALLIUM);
  g.set(7, 1, 6, FLOWERING_AZALEA);
  g.set(7, 1, 3, POPPY);
}

/** Back deck: smooth_stone patio at y0, spruce_planks floor at y4 over x2..13 z33..37, posts, and the rail with its gap. */
export function deck(g) {
  for (let x = PATIO.x[0]; x <= PATIO.x[1]; x++)
    for (let z = PATIO.z[0]; z <= PATIO.z[1]; z++) {
      g.set(x, PATIO.y, z, SMOOTH_STONE);
      g.set(x, FLOOR_Y.main, z, SPRUCE_PLANKS);
    }
  for (const x of [2, 7, 13]) for (let y = 0; y <= 3; y++) g.set(x, y, 37, ...B.pillar(SPRUCE_LOG, "y"));
  const rail = new Set();
  for (let x = 2; x <= 10; x++) rail.add(`${x},37`);                        // z37 run up to the gap
  for (let z = 33; z <= 37; z++) rail.add(`2,${z}`);                        // the west run
  for (let z = 33; z <= 36; z++) rail.add(`13,${z}`);                       // the east run stops before the gap
  for (const k of rail) {
    const [x, z] = k.split(",").map(Number);
    const link = (dx, dz) => (rail.has(`${x + dx},${z + dz}`) ? "true" : "false");
    g.set(x, 5, z, SPRUCE_FENCE, { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0) });
  }
}

/** Deck stair: spruce_stairs facing north at x11..13, z38 y3, z39 y2, z40 y1, solid spruce_planks under each step. */
export function deckStair(g) {
  for (const [z, y] of [[38, 3], [39, 2], [40, 1]])
    for (let x = DECK_STAIR.x[0]; x <= DECK_STAIR.x[1]; x++) {
      for (let fy = 0; fy < y; fy++) g.set(x, fy, z, SPRUCE_PLANKS);
      g.set(x, y, z, ...stairs(SPRUCE_STAIRS, "north", "bottom"));
    }
}

/** Garden tree at (4, *, 44): oak_log trunk y1..4 and a crown of oak leaves (a few flowering azalea) at y4..7. */
export function gardenTree(g) {
  const x = GARDEN_TREE.x, z = GARDEN_TREE.z;
  for (let y = 1; y <= 4; y++) g.set(x, y, z, ...B.log("oak", "y"));
  for (let lx = 1; lx <= 7; lx++)
    for (let y = 4; y <= 7; y++)
      for (let lz = 41; lz <= 47; lz++) {
        const d2 = (lx - x) ** 2 + (y - 5.5) ** 2 + (lz - z) ** 2;
        if (d2 > 6.25) continue;
        if (lx === x && lz === z && y <= 4) continue;                             // the trunk top
        const block = (lx + y + lz) % 5 === 0 ? FLOWERING_AZALEA_LEAVES : OAK_LEAVES;
        g.set(lx, y, lz, block, { persistent: "true" });
      }
}

/** Vegetable bed: farmland at x7..9 z44..47, one water cell at (8,0,45), wheat on three rows, carrots on the fourth. */
export function vegBed(g) {
  g.fill([7, 0, 44], [9, 0, 47], FARMLAND, { moisture: "7" });
  g.set(8, 0, 45, WATER);
  for (let x = 7; x <= 9; x++) {
    for (let z = 44; z <= 46; z++) g.set(x, 1, z, WHEAT, { age: "7" });
    g.set(x, 1, 47, CARROTS, { age: "7" });
  }
}

/**
 * Fireplace at z..z+2 in the west party wall (x1..3): bricks surround (the firebox and hearth are open),
 * netherrack firebox at (1,5,·) with fire at (1,6,·), brick_slab hearth at (2,5,·), smooth_quartz_slab mantel at (2,7,·).
 */
export function fireplace(g, z) {
  for (let x = 1; x <= 3; x++)
    for (let y = 5; y <= 7; y++)
      for (let zz = z - 1; zz <= z + 3; zz++) {
        const inner = zz >= z && zz <= z + 2;
        if (inner && x === 2 && y === 6) continue;                                // open above the hearth
        if (inner && ((x === 1 && y <= 6) || (x === 2 && (y === 5 || y === 7)))) continue;   // firebox, hearth, mantel
        g.set(x, y, zz, BRICKS);
      }
  for (let zz = z; zz <= z + 2; zz++) {
    g.set(1, 5, zz, NETHERRACK);
    g.set(1, 6, zz, FIRE);
    g.set(2, 5, zz, ...slab(BRICK_SLAB, "bottom"));
    g.set(2, 7, zz, ...slab(SMOOTH_QUARTZ_SLAB, "top"));
  }
}

/** Clawfoot tub: quartz_stairs at both ends facing outward, quartz_slab (bottom) between; `len` cells long. */
export function clawfootTub(g, x, y, z, axis, len = 2) {
  const [dx, dz] = axis === "x" ? [1, 0] : [0, 1];
  for (let i = 0; i < len; i++) {
    const X = x + i * dx, Z = z + i * dz;
    if (i === 0) g.set(X, y, Z, ...stairs(QUARTZ_STAIRS, axis === "x" ? "west" : "north"));
    else if (i === len - 1) g.set(X, y, Z, ...stairs(QUARTZ_STAIRS, axis === "x" ? "east" : "south"));
    else g.set(X, y, Z, ...slab(QUARTZ_SLAB, "bottom"));
  }
}

/** Bed of `color` (white, red, blue or cyan): foot at (x,y,z), head one cell in `facing`. */
export function bed(g, x, y, z, color, facing) {
  const [dx, , dz] = DIRS[facing];
  g.set(x, y, z, `${color}_bed`, { facing, part: "foot" });
  g.set(x + dx, y, z + dz, `${color}_bed`, { facing, part: "head" });
}

/** Nightstand: a barrel with its lid up. */
export function nightstand(g, x, y, z) {
  g.set(x, y, z, BARREL, { facing: "up", open: "false" });
}

/** Wardrobe, two cells along x: barrels at y, closed dark_oak_trapdoors above them at y+1. */
export function wardrobe(g, x, y, z, facing) {
  for (let dx = 0; dx <= 1; dx++) {
    g.set(x + dx, y, z, BARREL, { facing: "up", open: "false" });
    g.set(x + dx, y + 1, z, ...B.trapdoor("dark_oak", facing, "bottom", false));
  }
}

/** Desk, `len` cells along axis: dark_oak_fence legs at both ends, a dark_oak_slab (top) across at y+1. */
export function desk(g, x, y, z, len = 2, axis = "x") {
  const [dx, dz] = axis === "x" ? [1, 0] : [0, 1];
  for (let i = 0; i < len; i++) g.set(x + i * dx, y + 1, z + i * dz, ...slab(DARK_OAK_SLAB, "top"));
  g.set(x, y, z, DARK_OAK_FENCE, NO_LINKS);
  g.set(x + (len - 1) * dx, y, z + (len - 1) * dz, DARK_OAK_FENCE, NO_LINKS);
}

/** Sofa: a row of dark_oak_stairs (len cells) facing the room; the row runs along x for north or south, else along z. */
export function sofa(g, x, y, z, len, facing) {
  const along = facing === "north" || facing === "south";
  for (let i = 0; i < len; i++) g.set(along ? x + i : x, y, along ? z : z + i, ...stairs(DARK_OAK_STAIRS, facing, "bottom"));
}

/** Table: a dark_oak_fence post with a dark_oak_pressure_plate on top. */
export function table(g, x, y, z) {
  g.set(x, y, z, DARK_OAK_FENCE, NO_LINKS);
  g.set(x, y + 1, z, DARK_OAK_PRESSURE_PLATE, { powered: "false" });
}

/** Chair: a dark_oak_stairs seat facing `facing`, with an open dark_oak_trapdoor back on the cell behind at y+1. */
export function chair(g, x, y, z, facing) {
  const [dx, , dz] = DIRS[facing];
  g.set(x, y, z, ...stairs(DARK_OAK_STAIRS, facing, "bottom"));
  g.set(x - dx, y + 1, z - dz, ...B.trapdoor("dark_oak", facing, "bottom", true));
}

/** Rug: carpet of `color` over x0..x1, z0..z1 at y. */
export function rug(g, x0, x1, y, z0, z1, color = "red") {
  g.fill([x0, y, z0], [x1, y, z1], `${color}_carpet`);
}

/** Bookwall: stacks of bookshelf, h high, along x0..x1 at z. */
export function bookwall(g, x0, x1, y, z, h = 2) {
  for (let x = x0; x <= x1; x++) for (let dy = 0; dy < h; dy++) g.set(x, y + dy, z, BOOKSHELF);
}

/** Lamp post: two birch_fence cells at y, y+1 and a standing lantern at y+2. */
export function lampPost(g, x, y, z) {
  g.set(x, y, z, BIRCH_FENCE, NO_LINKS);
  g.set(x, y + 1, z, BIRCH_FENCE, NO_LINKS);
  g.set(x, y + 2, z, ...B.lantern(false));
}

/** Stove: a smoker at (x,y,z) and a blast_furnace at (x+1,y,z), both lit false, facing `facing`. */
export function stove(g, x, y, z, facing) {
  g.set(x, y, z, SMOKER, { facing, lit: "false" });
  g.set(x + 1, y, z, BLAST_FURNACE, { facing, lit: "false" });
}

/** Counter: barrels at (x0..x1, y, z) with a smooth_stone_slab (bottom) top at y+1. */
export function counter(g, x0, x1, y, z) {
  for (let x = x0; x <= x1; x++) {
    g.set(x, y, z, BARREL, { facing: "up", open: "false" });
    g.set(x, y + 1, z, ...slab(SMOOTH_STONE_SLAB, "bottom"));
  }
}

/** Window seat: a birch_slab (bottom) bench from x0 to x1 at y, red_carpet on it. The panes are the window's sashWindow. */
export function windowSeat(g, x0, x1, y, z) {
  for (let x = x0; x <= x1; x++) {
    g.set(x, y, z, ...slab(BIRCH_SLAB, "bottom"));
    g.set(x, y + 1, z, RED_CARPET);
  }
}
