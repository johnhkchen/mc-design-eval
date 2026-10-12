// Shared vocabulary for the sfvictorian build: palette.json ids as constants, plan.md SITE/LEVELS coordinates, and one
// helper per plan.md VOCABULARY item. Every helper takes the grid first (g), then the plan's parameters.
// Shell and ground helpers (wallCell, wallLine, slab, gardenBed, vegBed, citrusTree's podzol) write their own cells.
// Everything else adds into air only: a cell another part already owns is skipped, never overwritten (put()).
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- palette (palette.json ids only) --------------------------------------------------------------------------------
export const WARPED_PLANKS = "warped_planks";
export const WARPED_SLAB = "warped_slab";
export const WARPED_STAIRS = "warped_stairs";
export const WARPED_FENCE = "warped_fence";
export const WARPED_TRAPDOOR = "warped_trapdoor";
export const BAMBOO_MOSAIC = "bamboo_mosaic";
export const BAMBOO_MOSAIC_SLAB = "bamboo_mosaic_slab";
export const BAMBOO_MOSAIC_STAIRS = "bamboo_mosaic_stairs";
export const CRIMSON_PLANKS = "crimson_planks";
export const CRIMSON_DOOR = "crimson_door";
export const CRIMSON_TRAPDOOR = "crimson_trapdoor";
export const CRIMSON_STAIRS = "crimson_stairs";
export const CRIMSON_SLAB = "crimson_slab";
export const CRIMSON_FENCE = "crimson_fence";
export const SMOOTH_QUARTZ = "smooth_quartz";
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
export const QUARTZ_BLOCK = "quartz_block";
export const QUARTZ_PILLAR = "quartz_pillar";
export const QUARTZ_STAIRS = "quartz_stairs";
export const QUARTZ_SLAB = "quartz_slab";
export const CHISELED_QUARTZ_BLOCK = "chiseled_quartz_block";
export const QUARTZ_BRICKS = "quartz_bricks";
export const CYAN_TERRACOTTA = "cyan_terracotta";
export const BIRCH_PLANKS = "birch_planks";
export const BIRCH_DOOR = "birch_door";
export const BIRCH_FENCE = "birch_fence";
export const BIRCH_TRAPDOOR = "birch_trapdoor";
export const YELLOW_TERRACOTTA = "yellow_terracotta";
export const LIGHT_BLUE_TERRACOTTA = "light_blue_terracotta";
export const DEEPSLATE_TILES = "deepslate_tiles";
export const COBBLED_DEEPSLATE = "cobbled_deepslate";
export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks";
export const CRACKED_DEEPSLATE_TILES = "cracked_deepslate_tiles";
export const POLISHED_DEEPSLATE = "polished_deepslate";
export const BRICKS = "bricks";
export const GLASS_PANE = "glass_pane";
export const SMOOTH_STONE = "smooth_stone";
export const DARK_OAK_PLANKS = "dark_oak_planks";
export const POLISHED_DIORITE = "polished_diorite";
export const SPRUCE_PLANKS = "spruce_planks";
export const WHITE_CONCRETE = "white_concrete";
export const DARK_OAK_STAIRS = "dark_oak_stairs";
export const DARK_OAK_FENCE = "dark_oak_fence";
export const IRON_BARS = "iron_bars";
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";
export const LANTERN = "lantern";
export const IRON_CHAIN = "iron_chain";
export const POLISHED_ANDESITE = "polished_andesite";
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
export const GRASS_BLOCK = "grass_block";
export const PODZOL = "podzol";
export const BRICK_SLAB = "brick_slab";
export const FARMLAND = "farmland";
export const WATER = "water";
export const ROSE_BUSH = "rose_bush";
export const PEONY = "peony";
export const LILAC = "lilac";
export const AZALEA = "azalea";
export const FLOWERING_AZALEA = "flowering_azalea";
export const FERN = "fern";
export const LARGE_FERN = "large_fern";
export const OAK_LOG = "oak_log";
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";
export const OAK_LEAVES = "oak_leaves";
export const CARROTS = "carrots";
export const BEETROOTS = "beetroots";
export const POTATOES = "potatoes";
export const POTTED_FERN = "potted_fern";
export const POTTED_RED_TULIP = "potted_red_tulip";
export const FLOWER_POT = "flower_pot";
export const SPRUCE_LOG = "spruce_log";
export const SPRUCE_FENCE = "spruce_fence";
export const SPRUCE_STAIRS = "spruce_stairs";
export const SPRUCE_SLAB = "spruce_slab";
export const SPRUCE_PRESSURE_PLATE = "spruce_pressure_plate";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
export const CAMPFIRE = "campfire";
export const BOOKSHELF = "bookshelf";
export const SMOKER = "smoker";
export const BARREL = "barrel";
export const CAULDRON = "cauldron";
export const WATER_CAULDRON = "water_cauldron";
export const IRON_TRAPDOOR = "iron_trapdoor";
export const CRAFTING_TABLE = "crafting_table";
export const WHITE_BED = "white_bed";
export const RED_BED = "red_bed";
export const WHITE_CARPET = "white_carpet";
export const RED_CARPET = "red_carpet";
export const CYAN_CARPET = "cyan_carpet";
export const WHITE_WOOL = "white_wool";
export const LIGHTNING_ROD = "lightning_rod";
export const END_ROD = "end_rod";
export const OAK_PLANKS = "oak_planks";

// ---- site (plan.md SITE and LEVELS). Boxes are inclusive [x0, y0, z0, x1, y1, z1]. Front = north (z0 = sidewalk). --
export const LOT = [0, 0, 0, 15, 20, 49];
export const SIDEWALK = [0, 0, 0, 15, 0, 1];
export const DRIVE = [1, 0, 2, 5, 0, 6];
export const FRONT_GARDEN = [7, 0, 3, 9, 0, 6];
export const FRONT_STAIR = [10, 0, 2, 14, 5, 6];
export const HOUSE = [1, 0, 7, 14, 16, 30];
export const BAY = [1, 3, 4, 6, 17, 6];
export const PORCH = [11, 4, 6, 13, 8, 9];
export const FALSE_FRONT = [1, 17, 7, 14, 20, 7];
export const LIGHTWELL = [1, 5, 19, 2, 20, 23];
export const ROOF = [0, 17, 7, 15, 20, 31];
export const DECK = [2, 0, 31, 13, 5, 38];
export const BACK_GARDEN = [1, 0, 31, 14, 2, 48];
export const FRONT_FACE_Z = 7;
export const BACK_FACE_Z = 30;
export const PARTY_WEST_X = 1;
export const PARTY_EAST_X = 14;
export const GROUND_Y = 0;
export const FLOOR_MAIN_Y = 4;
export const FLOOR_2ND_Y = 8;
export const FLOOR_TOP_Y = 12;
export const PLATE_Y = 16;
export const ROOF_Y = 17;
export const PEDIMENT_Y = 20;
export const WINDOW_YB = { main: 5, second: 9, top: 13 };
export const CARRIAGE_OPENING = [2, 1, 7, 5, 3, 7];
export const ENTRY_DOOR = { x: 12, y: 5, z: 10 };
export const FRONT_STEPS = { x0: 11, x1: 13, z0: 2, y0: 1, n: 4 };
export const RAIL_X = [10, 14];
export const RAIL_Z = [3, 6];
export const PORCH_COLUMNS = [[10, 7], [14, 7]];
export const HALL_LAMPS = [[12, 7, 14], [12, 7, 22], [12, 11, 22]];
export const CITRUS_TREE = { x: 4, z: 44 };
export const VEG_BED = [10, 0, 42, 13, 0, 46];
export const VEG_WATER = [[11, 0, 44], [12, 0, 44]];
export const VEG_CROPS = [
  { block: CARROTS, age: 7, box: [10, 42, 13, 43] },
  { block: BEETROOTS, age: 3, box: [10, 45, 13, 46] },
  { block: POTATOES, age: 7, box: [10, 44, 10, 44] },
  { block: POTATOES, age: 7, box: [13, 44, 13, 44] },
];
export const BENCH = { x0: 6, x1: 8, z: 48 };
export const LAMP_POST = { x: 9, z: 46 };

const DOUBLE_PLANTS = new Set([ROSE_BUSH, PEONY, LILAC, LARGE_FERN]);

// ---- internals ------------------------------------------------------------------------------------------------------
const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
// Add into air only. Returns false (and writes nothing) when another element already owns the cell.
function put(g, x, y, z, block, state) {
  if (!isAir(g, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}
// A cell list or box list: [x, y, z] is one cell, [x0, y0, z0, x1, y1, z1] an inclusive box.
const inBoxes = (list, x, y, z) => list.some((c) => (c.length === 3
  ? c[0] === x && c[1] === y && c[2] === z
  : x >= Math.min(c[0], c[3]) && x <= Math.max(c[0], c[3]) && y >= Math.min(c[1], c[4]) && y <= Math.max(c[1], c[4])
    && z >= Math.min(c[2], c[5]) && z <= Math.max(c[2], c[5])));
const isZWall = (out) => out === "north" || out === "south";
// Wall geometry. `along` is x on a north/south wall and z on an east/west wall; `plane` is the wall's own coordinate
// (z on a north/south wall, x on an east/west wall). `out` is the outward direction of the wall.
const onWall = (along, y, plane, out) => (isZWall(out) ? [along, y, plane] : [plane, y, along]);
const oneOut = (along, y, plane, out) => {
  const [dx, , dz] = DIRS[out];
  return isZWall(out) ? [along, y, plane + dz] : [plane + dx, y, along];
};
// Facing of a stair that climbs toward +along and toward -along: [toward +along, toward -along].
const alongFacings = (out) => (isZWall(out) ? ["east", "west"] : ["south", "north"]);

// ---- shell -----------------------------------------------------------------------------------------------------------
// Front and back courses: y0..3 base, y4 belt, siding, fish-scale bands y8/y12, frieze y16, parapet y17..18.
// Party and lightwell walls are cyan base then birch; inner partitions are birch.
export function wallCell(g, x, y, z, kind) {
  let block = null;
  if (kind === "front" || kind === "back") {
    if (y <= 3) block = CYAN_TERRACOTTA;
    else if (y === 4) block = SMOOTH_QUARTZ;
    else if (y === 8 || y === 12 || y === 18) block = y === 18 && [1, 5, 10, 14].includes(x) ? SMOOTH_QUARTZ : BAMBOO_MOSAIC;
    else if (y === 16) block = CRIMSON_PLANKS;
    else if (y === 5 || y === 6 || y === 7 || y === 9 || y === 10 || y === 11 || y === 13 || y === 14 || y === 15 || y === 17) block = WARPED_PLANKS;
  } else if (kind === "party") {
    if (y <= 3) block = CYAN_TERRACOTTA;
    else if (y <= 16) block = BIRCH_PLANKS;
  } else if (kind === "inner") {
    block = BIRCH_PLANKS;
  } else {
    throw new Error(`wallCell: unknown kind ${kind}`);
  }
  if (block) g.set(x, y, z, block);
}

// A straight or rectangular run of wallCell, minus open cells (left unset).
export function wallLine(g, x0, z0, x1, z1, y0, y1, kind, { open = [] } = {}) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
        if (!inBoxes(open, x, y, z)) wallCell(g, x, y, z, kind);
}

// Floor fill at height y. block is an id or [id, state]; holes are cells or boxes left unset.
export function slab(g, y, x0, z0, x1, z1, block, { holes = [] } = {}) {
  const [id, state] = Array.isArray(block) ? block : [block, undefined];
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
      if (!inBoxes(holes, x, y, z)) g.set(x, y, z, id, state);
}

// ---- front facade -----------------------------------------------------------------------------------------------------
// 1-wide, 3-tall glass in a wall (x on a north/south wall, z on an east/west wall) with a sill 1 out; hood 1 out above.
export function tallWindow(g, along, yb, plane, out, { hood = false } = {}) {
  const [towardPlus, towardMinus] = alongFacings(out);
  for (let k = 0; k < 3; k++) put(g, ...onWall(along, yb + k, plane, out), ...B.pane());
  put(g, ...oneOut(along, yb - 1, plane, out), ...B.slab("smooth_quartz", "top"));
  if (hood) {
    put(g, ...oneOut(along - 1, yb + 3, plane, out), ...B.stairs("smooth_quartz", towardPlus, "bottom"));
    put(g, ...oneOut(along, yb + 3, plane, out), CHISELED_QUARTZ_BLOCK);
    put(g, ...oneOut(along + 1, yb + 3, plane, out), ...B.stairs("smooth_quartz", towardMinus, "bottom"));
  }
}

// Bay front: 2-wide glass on z5 at x3..4, sill on z4, pediment hood on z4 from x2 to x5.
export function pairedWindow(g, yb) {
  for (let y = yb; y <= yb + 2; y++) for (const x of [3, 4]) put(g, x, y, 5, ...B.pane());
  for (const x of [3, 4]) put(g, x, yb - 1, 4, ...B.slab("smooth_quartz", "top"));
  put(g, 2, yb + 3, 4, ...B.stairs("smooth_quartz", "east", "bottom"));
  for (const x of [3, 4]) put(g, x, yb + 3, 4, CHISELED_QUARTZ_BLOCK);
  put(g, 5, yb + 3, 4, ...B.stairs("smooth_quartz", "west", "bottom"));
}

// Angled-bay diagonal face at x 1 or 6: glass on z6, sill and hood on z5.
export function diagWindow(g, x, yb) {
  for (let y = yb; y <= yb + 2; y++) put(g, x, y, 6, ...B.pane());
  put(g, x, yb - 1, 5, ...B.slab("smooth_quartz", "top"));
  put(g, x, yb + 3, 5, ...B.slab("smooth_quartz", "bottom"));
}

// Cornice pieces: a bracket and a crown lip toward the street, the corbel under the bay (y3).
export function bracket(g, x, y, z) {
  put(g, x, y, z, ...B.stairs("quartz", "south", "top"));
}
export function crown(g, x, y, z) {
  put(g, x, y, z, ...B.stairs("smooth_quartz", "south", "top"));
}
export function corbel(g, x, z) {
  put(g, x, 3, z, ...B.stairs("smooth_quartz", "south", "top"));
}

// Porch column: quartz base, pillar, chiseled capital.
export function column(g, x, z) {
  put(g, x, 5, z, QUARTZ_BLOCK);
  put(g, x, 6, z, ...B.pillar("quartz_pillar", "y"));
  put(g, x, 7, z, CHISELED_QUARTZ_BLOCK);
}

// E5 exactly: the front door at (12, 5..6, 10) with glass sidelights and a transom.
export function entryDoor(g) {
  const { x, y, z } = ENTRY_DOOR;
  door(g, x, y, z, "north", "left", "crimson");
  for (const sx of [x - 1, x + 1]) for (const sy of [y, y + 1]) put(g, sx, sy, z, ...B.pane());
  for (const tx of [x - 1, x, x + 1]) put(g, tx, y + 2, z, ...B.pane());
}

// E2 exactly: two pairs of crimson carriage doors at y1..2 on z7, glass transom at y3.
export function carriageDoor(g) {
  const [x0, y0, z, x1, y1] = CARRIAGE_OPENING;
  [[2, "left"], [3, "right"], [4, "left"], [5, "right"]].forEach(([x, hinge]) => door(g, x, y0, z, "north", hinge, "crimson"));
  for (let x = x0; x <= x1; x++) put(g, x, y1, z, ...B.pane());
}

// Two-cell door: lower at y, upper at y+1. wood is a palette wood (birch, crimson).
export function door(g, x, y, z, facing, hinge, wood = "birch") {
  put(g, x, y, z, ...B.door(wood, facing, "lower", hinge));
  put(g, x, y + 1, z, ...B.door(wood, facing, "upper", hinge));
}

// ---- stairs, rails, lamps ---------------------------------------------------------------------------------------------
// n stairs, each one up and one along `facing`. block is a stairs id (e.g. quartz_stairs).
export function stairFlight(g, x, z0, y0, n, facing, block) {
  const [dx, , dz] = DIRS[facing];
  for (let i = 0; i < n; i++) put(g, x + i * dx, y0 + i, z0 + i * dz, ...B.stairs(block.replace(/_stairs$/, ""), facing, "bottom"));
}

// Stringer from the base up to the tread height beside each cell of the front stair, then a birch fence rail above it.
export function stairRail(g, x, z0, z1) {
  const { z0: sz0, y0, n } = FRONT_STEPS;
  for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
    const tread = Math.min(Math.max(z - sz0 + y0, y0), y0 + n - 1);
    for (let y = 1; y <= tread; y++) put(g, x, y, z, CYAN_TERRACOTTA);
    put(g, x, tread + 1, z, ...B.fence("birch"));
  }
}

// Quartz newel with a standing lantern on top.
export function newelLamp(g, x, z) {
  put(g, x, 1, z, QUARTZ_PILLAR, { axis: "y" });
  put(g, x, 2, z, QUARTZ_PILLAR, { axis: "y" });
  put(g, x, 3, z, ...B.lantern(false));
}

// Iron bar runs at y1. Each run is an ordered list of [x, z]; its two end cells are polished blackstone wall posts y1..2.
export function ironFence(g, runs) {
  for (const run of runs) {
    run.forEach(([x, z], i) => {
      if (i === 0 || i === run.length - 1) {
        put(g, x, 1, z, POLISHED_BLACKSTONE_WALL, {});
        put(g, x, 2, z, POLISHED_BLACKSTONE_WALL, {});
      } else {
        put(g, x, 1, z, IRON_BARS, {});
      }
    });
  }
}

// ---- garden, ground, trees -------------------------------------------------------------------------------------------
// Podzol bed over box (ground, written directly); plants [x, z, id] at y1. Double plants fill y1 and y2.
export function gardenBed(g, box, plants) {
  const [x0, y0, z0, x1, , z1] = box;
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) g.set(x, y0, z, PODZOL);
  for (const [x, z, id] of plants) {
    if (DOUBLE_PLANTS.has(id)) {
      put(g, x, 1, z, id, { half: "lower" });
      put(g, x, 2, z, id, { half: "upper" });
    } else {
      put(g, x, 1, z, id, {});
    }
  }
}

// Chain at y and a hanging lantern at y-1 under a ceiling at y+1 (drop 2). drop 1: just the lantern at y.
export function hangLamp(g, x, y, z, { drop = 2 } = {}) {
  if (isAir(g, x, y + 1, z)) throw new Error(`hangLamp at ${x},${y},${z}: no ceiling directly above`);
  if (drop === 2) {
    put(g, x, y, z, ...B.chain("y"));
    put(g, x, y - 1, z, ...B.lantern(true));
  } else {
    put(g, x, y, z, ...B.lantern(true));
  }
}

// Dark oak post y1..2 with a standing lantern at y3.
export function lampPost(g, x, z) {
  put(g, x, 1, z, DARK_OAK_FENCE, {});
  put(g, x, 2, z, DARK_OAK_FENCE, {});
  put(g, x, 3, z, ...B.lantern(false));
}

// Trunk x,z at y1..3 on a 3x3 podzol base; persistent leaves: flowering azalea (ring at y3, plus y4 and y5), oak corners at y4.
export function citrusTree(g, x, z) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) g.set(x + dx, 0, z + dz, PODZOL);
  for (let y = 1; y <= 3; y++) put(g, x, y, z, ...B.log("oak", "y"));
  const leaf = (lx, ly, lz, id) => put(g, lx, ly, lz, id, { persistent: "true" });
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) leaf(x + dx, 3, z + dz, FLOWERING_AZALEA_LEAVES);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const corner = Math.abs(dx) === 1 && Math.abs(dz) === 1;
    leaf(x + dx, 4, z + dz, corner ? OAK_LEAVES : FLOWERING_AZALEA_LEAVES);
  }
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) leaf(x + dx, 5, z + dz, FLOWERING_AZALEA_LEAVES);
}

// Farmland bed over box at y0 with water cells, crops at y1 (VEG_CROPS, E29), and closed spruce trapdoor edging at y1 on
// the orthogonal cells just outside the bed (skip: cells or boxes left bare, e.g. the path).
export function vegBed(g, box, water, { skip = [], crops = VEG_CROPS } = {}) {
  const [x0, y0, z0, x1, , z1] = box;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (inBoxes(water, x, y0, z)) g.set(x, y0, z, WATER);
    else g.set(x, y0, z, FARMLAND, { moisture: "7" });
  }
  for (const c of crops) {
    const [cx0, cz0, cx1, cz1] = c.box;
    for (let x = cx0; x <= cx1; x++) for (let z = cz0; z <= cz1; z++) put(g, x, 1, z, c.block, { age: String(c.age) });
  }
  const rim = [];
  for (let x = x0; x <= x1; x++) rim.push([x, z0 - 1], [x, z1 + 1]);
  for (let z = z0; z <= z1; z++) rim.push([x0 - 1, z], [x1 + 1, z]);
  for (const [x, z] of rim) if (!inBoxes(skip, x, 1, z)) put(g, x, 1, z, ...B.trapdoor("spruce", "north", "bottom", false));
}

// ---- deck and back garden -------------------------------------------------------------------------------------------
// Spruce fence rail at y5 on each [x, z] cell.
export function deckRail(g, cells) {
  for (const [x, z] of cells) put(g, x, 5, z, ...B.fence("spruce"));
}

// Table: fence y5 + pressure plate y6; chairs on the north and south sides, each facing away from the table.
export function deckTable(g, x, z) {
  put(g, x, 5, z, ...B.fence("spruce"));
  put(g, x, 6, z, SPRUCE_PRESSURE_PLATE, {});
  put(g, x, 5, z - 1, ...B.stairs("spruce", "north", "bottom"));
  put(g, x, 5, z + 1, ...B.stairs("spruce", "south", "bottom"));
}

// Seat x0..x1 at y1 on z, facing south (the house); open trapdoor arms one cell beyond each end.
export function bench(g, x0, x1, z) {
  for (let x = x0; x <= x1; x++) put(g, x, 1, z, ...B.stairs("spruce", "south", "bottom"));
  put(g, x0 - 1, 1, z, ...B.trapdoor("spruce", "south", "bottom", true));
  put(g, x1 + 1, 1, z, ...B.trapdoor("spruce", "south", "bottom", true));
}
