// Shared vocabulary for the McMansion (plan.md VOCABULARY): palette constants, site coordinates, one helper per item.
// Convention: helpers that place blocks take the grid first, helper(g, ...); veneer() and siding() are pure and
// return a block id. Every helper writes through g.set, so run inside runParts. Ranges are inclusive, as in plan.md.
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- palette (palette.json ids only) ----------------------------------------------------------------------------
export const BIRCH_PLANKS = "birch_planks";
export const BIRCH_SLAB = "birch_slab";
export const BIRCH_STAIRS = "birch_stairs";
export const BIRCH_FENCE = "birch_fence";
export const BIRCH_DOOR = "birch_door";
export const BIRCH_TRAPDOOR = "birch_trapdoor";
export const STONE_BRICKS = "stone_bricks";
export const ANDESITE = "andesite";
export const TUFF_BRICKS = "tuff_bricks";
export const COBBLESTONE = "cobblestone";
export const STONE_BRICK_STAIRS = "stone_brick_stairs";
export const STONE_BRICK_SLAB = "stone_brick_slab";
export const STONE_BRICK_WALL = "stone_brick_wall";
export const CHISELED_STONE_BRICKS = "chiseled_stone_bricks";
export const SMOOTH_QUARTZ = "smooth_quartz";
export const QUARTZ_BLOCK = "quartz_block";
export const QUARTZ_PILLAR = "quartz_pillar";
export const CHISELED_QUARTZ_BLOCK = "chiseled_quartz_block";
export const QUARTZ_BRICKS = "quartz_bricks";
export const QUARTZ_STAIRS = "quartz_stairs";
export const QUARTZ_SLAB = "quartz_slab";
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";
export const COBBLED_DEEPSLATE = "cobbled_deepslate";
export const DEEPSLATE_TILES = "deepslate_tiles";
export const POLISHED_DEEPSLATE = "polished_deepslate";
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";
export const DARK_OAK_DOOR = "dark_oak_door";
export const DARK_OAK_PLANKS = "dark_oak_planks";
export const DARK_OAK_STAIRS = "dark_oak_stairs";
export const DARK_OAK_SLAB = "dark_oak_slab";
export const DARK_OAK_FENCE = "dark_oak_fence";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
export const GLASS_PANE = "glass_pane";
export const GLASS = "glass";
export const OAK_PLANKS = "oak_planks";
export const POLISHED_DIORITE = "polished_diorite";
export const SMOOTH_STONE = "smooth_stone";
export const POLISHED_ANDESITE = "polished_andesite";
export const WHITE_CONCRETE = "white_concrete";
export const WHITE_CARPET = "white_carpet";
export const LIGHT_GRAY_CARPET = "light_gray_carpet";
export const GRASS_BLOCK = "grass_block";
export const PODZOL = "podzol";
export const BRICKS = "bricks";
export const GRAY_CONCRETE = "gray_concrete";
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";
export const DIRT_PATH = "dirt_path";
export const AZALEA_LEAVES = "azalea_leaves";
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";
export const BIRCH_LOG = "birch_log";
export const BIRCH_LEAVES = "birch_leaves";
export const WHITE_TULIP = "white_tulip";
export const RED_TULIP = "red_tulip";
export const PEONY = "peony";
export const ROSE_BUSH = "rose_bush";
export const LILAC = "lilac";
export const SHORT_GRASS = "short_grass";
export const POTTED_FERN = "potted_fern";
export const FLOWER_POT = "flower_pot";
export const SPRUCE_PLANKS = "spruce_planks";
export const SPRUCE_FENCE = "spruce_fence";
export const SPRUCE_STAIRS = "spruce_stairs";
export const SPRUCE_SLAB = "spruce_slab";
export const SPRUCE_PRESSURE_PLATE = "spruce_pressure_plate";
export const LANTERN = "lantern";
export const IRON_CHAIN = "iron_chain";
export const CAMPFIRE = "campfire";
export const LIGHTNING_ROD = "lightning_rod";
export const END_ROD = "end_rod";
export const SMOKER = "smoker";
export const BARREL = "barrel";
export const BOOKSHELF = "bookshelf";
export const IRON_BARS = "iron_bars";
export const WATER_CAULDRON = "water_cauldron";
export const WHITE_BED = "white_bed";
export const LIGHT_GRAY_BED = "light_gray_bed";
export const RED_BED = "red_bed";
export const BLACK_CONCRETE = "black_concrete";
export const ITEM_FRAME = "item_frame";
export const CALCITE = "calcite";
export const SMOOTH_SANDSTONE = "smooth_sandstone";
export const OAK_FENCE = "oak_fence";
export const IRON_TRAPDOOR = "iron_trapdoor";

// ---- site (plan.md SITE, OPENINGS, ROOMS; all inclusive [x0,y0,z0,x1,y1,z1] or per-axis) ----------------------------
export const SITE = { x: [0, 43], y: [0, 17], z: [0, 31] };
export const ENTRANCE = [16, 2, 8];
export const MAIN = { x0: 2, z0: 11, x1: 29, z1: 25, yFloor: 1, yCeil: 9 };
export const ENTRY_PROJECTION = { x0: 12, z0: 9, x1: 21, z1: 11 };
export const PORTICO = { x0: 11, z0: 4, x1: 22, z1: 8, yTop: 9 };
export const TURRET = { x0: 2, z0: 7, x1: 7, z1: 11, yTop: 11 };
export const GARAGE = { x0: 29, z0: 13, x1: 41, z1: 25, yFloor: 0, yCeil: 9 };
export const CHIMNEY = { x0: 0, z0: 20, x1: 1, z1: 23, yTop: 15 };
export const DECK = { x0: 6, z0: 26, x1: 24, z1: 30, y: 1 };
export const DRIVEWAY = { x0: 29, z0: 2, x1: 41, z1: 12 };
export const FOYER_VOID = [13, 2, 10, 20, 8, 17];
export const STAIR = { x0: 18, z0: 11, x1: 20, z1: 15 };
export const FIREBOX = [2, 2, 21, 2, 3, 22];
export const GARAGE_STEP = [30, 1, 22];
export const ROOM_BOX = {
  foyer: [13, 2, 10, 20, 8, 17],
  office: [3, 2, 12, 11, 4, 17],
  "dining room": [22, 2, 12, 28, 4, 17],
  "family room": [3, 2, 19, 13, 4, 24],
  kitchen: [14, 2, 19, 24, 4, 24],
  mudroom: [26, 2, 19, 28, 4, 24],
  garage: [30, 1, 14, 40, 4, 24],
  "upper hall and gallery": [3, 6, 16, 28, 8, 17],
  "bedroom 2": [3, 6, 12, 11, 8, 14],
  "bedroom 3": [22, 6, 12, 28, 8, 14],
  "primary bedroom": [3, 6, 19, 11, 8, 24],
  "walk-in closet": [13, 6, 19, 15, 8, 24],
  "primary bathroom": [17, 6, 19, 21, 8, 24],
  "bedroom 4": [23, 6, 19, 28, 8, 24],
  "bonus room": [30, 6, 14, 40, 8, 24],
};

// ---- internal helpers --------------------------------------------------------------------------------------------
const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const leaves = (name) => [name, { persistent: "true" }];
const within = (x, y, z, boxes = []) => boxes.some(([x0, y0, z0, x1, y1, z1]) =>
  x >= Math.min(x0, x1) && x <= Math.max(x0, x1) && y >= Math.min(y0, y1) && y <= Math.max(y0, y1) &&
  z >= Math.min(z0, z1) && z <= Math.max(z0, z1));
function eachCell([x0, y0, z0], [x1, y1, z1], fn) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) fn(x, y, z);
}

// ---- walls ---------------------------------------------------------------------------------------------------------
/** Stone veneer block for a front cell: the hash mix stone_bricks 45 / andesite 25 / tuff_bricks 20 / cobblestone 10. */
export function veneer(x, y, z) {
  const h = (x * 7 + y * 5 + z * 13) % 20;
  return h < 9 ? STONE_BRICKS : h < 14 ? ANDESITE : h < 18 ? TUFF_BRICKS : COBBLESTONE;
}

/** Beige siding block. */
export function siding(x, y, z) {
  return BIRCH_PLANKS;
}

/** One wall cell by height. face "front" (north faces: veneer, belt, siding, plate) or "other". Turret y10..11: siding + cap. */
export function wallCell(g, x, y, z, face) {
  const front = face === "front";
  let block;
  if (y >= 10) block = y === 11 ? SMOOTH_QUARTZ : BIRCH_PLANKS;
  else if (front && y <= 4) block = veneer(x, y, z);
  else if (front && y === 5) block = SMOOTH_QUARTZ;
  else if (y === 9) block = SMOOTH_QUARTZ;
  else if (!front && y === 1) block = STONE_BRICKS;
  else block = BIRCH_PLANKS;
  put(g, x, y, z, B.block(block));
  return block;
}

/** A straight wall run (x0,z0)..(x1,z1) from y1 to yTo (default 9), leaving cells in open:[[x0,y0,z0,x1,y1,z1],...] unset. */
export function wallLine(g, x0, z0, x1, z1, face, { open = [], yTo = 9 } = {}) {
  eachCell([x0, 1, z0], [x1, yTo, z1], (x, y, z) => {
    if (!within(x, y, z, open)) wallCell(g, x, y, z, face);
  });
}

/**
 * Corner column of quartz_bricks at (x,z) on yFrom..yTo. Every course has the corner cell; an extra cell goes along
 * dirA on even y, along dirB on odd y (dirB null: only dirA, as on the fronts). Directions: "north"|"south"|"east"|"west".
 */
export function quoin(g, x, z, dirA, dirB, yFrom, yTo) {
  for (let y = yFrom; y <= yTo; y++) {
    put(g, x, y, z, B.block(QUARTZ_BRICKS));
    const dir = y % 2 === 0 ? dirA : dirB;
    if (dir) put(g, x + DIRS[dir][0], y, z + DIRS[dir][2], B.block(QUARTZ_BRICKS));
  }
}

/** Birch interior partition over the box (x0,y0,z0)..(x1,y1,z1); cells in open:[boxes] stay unset (doorways). */
export function partition(g, x0, z0, x1, z1, y0, y1, { open = [] } = {}) {
  eachCell([x0, y0, z0], [x1, y1, z1], (x, y, z) => {
    if (!within(x, y, z, open)) put(g, x, y, z, B.block(BIRCH_PLANKS));
  });
}

// ---- windows and shutters -------------------------------------------------------------------------------------------
// Arch shoulder facings per outward direction (the plan's rule: left west / right east on north; mirrored on south).
const ARCH_FACING = { north: ["west", "east"], south: ["east", "west"], west: ["north", "south"], east: ["south", "north"] };

/**
 * One shutter: dark_oak_trapdoor, open, facing = the wall's outward side, placed in the cell (x,y,z) beside the opening.
 */
export function shutter(g, x, y, z, out) {
  put(g, x, y, z, B.trapdoor("dark_oak", out, "bottom", true));
}

/**
 * Arched 2-wide window. a0 = the low end along the wall, plane = the wall's coordinate (z for north/south faces, x for
 * west/east), y0 = bottom row, out = outward direction. Glass rows y0..y0+1, arch row y0+2 (quartz_stairs shoulders),
 * sill slab one cell out at y0-1, black shutters beside both edges.
 */
export function archWindow(g, a0, y0, plane, out) {
  const d = DIRS[out];
  const alongX = out === "north" || out === "south";
  const at = (s, y) => (alongX ? [a0 + s, y, plane] : [plane, y, a0 + s]);
  const [fl, fr] = ARCH_FACING[out];
  for (const s of [0, 1]) {
    const [x, , z] = at(s, y0);
    for (let y = y0; y <= y0 + 1; y++) put(g, x, y, z, B.pane());
    put(g, x, y0 + 2, z, B.stairs("quartz", s === 0 ? fl : fr, "top"));
    put(g, x + d[0], y0 - 1, z + d[2], B.slab("smooth_quartz", "top"));
  }
  for (const b of [a0 - 1, a0 + 2]) for (let y = y0; y <= y0 + 2; y++) {
    shutter(g, alongX ? b : plane + d[0], y, alongX ? plane + d[2] : b, out);
  }
}

/**
 * Glazed rectangle: cells = [[x,z],...] on one wall line (1 or 2 wide), yRange = [yLo, yHi] (2..3 tall), out = outward.
 * Glass panes, a slab sill one cell out at yLo-1 under each cell, shutters on both sides.
 */
export function windowRect(g, cells, [yLo, yHi], out) {
  const d = DIRS[out];
  const alongX = out === "north" || out === "south";
  const plane = alongX ? cells[0][1] : cells[0][0];
  const along = cells.map(([x, z]) => (alongX ? x : z));
  for (const [x, z] of cells) {
    for (let y = yLo; y <= yHi; y++) put(g, x, y, z, B.pane());
    put(g, x + d[0], yLo - 1, z + d[2], B.slab("smooth_quartz", "top"));
  }
  for (const b of [Math.min(...along) - 1, Math.max(...along) + 1]) for (let y = yLo; y <= yHi; y++) {
    shutter(g, alongX ? b : plane + d[0], y, alongX ? plane + d[2] : b, out);
  }
}

// ---- entry, portico, garage ----------------------------------------------------------------------------------------
/** Portico column at (x,z): quartz base y2, quartz pillar shaft y3..7, chiseled capital y8. */
export function column(g, x, z) {
  put(g, x, 2, z, B.block(QUARTZ_BLOCK));
  for (let y = 3; y <= 7; y++) put(g, x, y, z, B.pillar(QUARTZ_PILLAR, "y"));
  put(g, x, 8, z, B.block(CHISELED_QUARTZ_BLOCK));
}

/** Portico entablature: smooth_quartz beam y9 across x11..22 at z5 and returns at x11/x22 z6..8; slab ceiling x12..21 z6..8. */
export function entablature(g) {
  for (let x = 11; x <= 22; x++) put(g, x, 9, 5, B.block(SMOOTH_QUARTZ));
  for (let z = 6; z <= 8; z++) {
    put(g, 11, 9, z, B.block(SMOOTH_QUARTZ));
    put(g, 22, 9, z, B.block(SMOOTH_QUARTZ));
  }
  for (let x = 12; x <= 21; x++) for (let z = 6; z <= 8; z++) put(g, x, 9, z, B.slab("smooth_quartz", "top"));
}

/** Front door at z9: dark_oak door pair x16/x17, glass sidelights x15/x18, fanlight row y4, quartz pillar casing x14/x19. */
export function entryDoor(g) {
  put(g, 16, 2, 9, B.door("dark_oak", "north", "lower", "left"));
  put(g, 16, 3, 9, B.door("dark_oak", "north", "upper", "left"));
  put(g, 17, 2, 9, B.door("dark_oak", "north", "lower", "right"));
  put(g, 17, 3, 9, B.door("dark_oak", "north", "upper", "right"));
  for (const y of [2, 3]) {
    put(g, 15, y, 9, B.pane());
    put(g, 18, y, 9, B.pane());
  }
  put(g, 15, 4, 9, B.stairs("quartz", "west", "top"));
  put(g, 16, 4, 9, B.pane());
  put(g, 17, 4, 9, B.pane());
  put(g, 18, 4, 9, B.stairs("quartz", "east", "top"));
  for (const x of [14, 19]) for (let y = 2; y <= 4; y++) put(g, x, y, 9, B.pillar(QUARTZ_PILLAR, "y"));
}

/** Garage carriage door, opening x0..x0+2, y1..3 at z13: spruce trapdoors y1..2, glass y3, smooth quartz header y4. */
export function carriageDoor(g, x0) {
  for (let x = x0; x <= x0 + 2; x++) {
    put(g, x, 1, 13, B.trapdoor("spruce", "south", "bottom", true));
    put(g, x, 2, 13, B.trapdoor("spruce", "south", "bottom", true));
    put(g, x, 3, 13, B.pane());
    put(g, x, 4, 13, B.block(SMOOTH_QUARTZ));
  }
}

/** Garage coach light at (x,z): smooth quartz slab bracket at y4, hanging lantern at y3. */
export function coachLight(g, x, z) {
  put(g, x, 4, z, B.slab("smooth_quartz", "top"));
  put(g, x, 3, z, B.lantern(true));
}

/** The foyer's sweeping stair (x18..20, z11..15, y2..5) with flared foot, planks beneath, birch banister and gallery railing. */
export function sweepStair(g) {
  const steps = [[2, 12], [3, 13], [4, 14], [5, 15]];
  for (const x of [18, 19, 20]) for (const [y, z] of steps) {
    put(g, x, y, z, B.stairs("dark_oak", "south", "bottom"));
    for (let yy = 2; yy < y; yy++) put(g, x, yy, z, B.block(DARK_OAK_PLANKS));
  }
  for (const x of [17, 18, 19, 20]) put(g, x, 2, 11, B.slab("dark_oak", "bottom"));
  for (const [y, z] of steps) put(g, 18, y + 1, z, B.fence("birch"));
  for (let x = 13; x <= 17; x++) put(g, x, 6, 15, B.fence("birch"));
}

/** Door pair or single door at (x,y,z): lower half at y, upper at y+1. material "birch" (interior) or "dark_oak" (exterior). */
export function door(g, x, y, z, facing, hinge, material = "birch") {
  put(g, x, y, z, B.door(material, facing, "lower", hinge));
  put(g, x, y + 1, z, B.door(material, facing, "upper", hinge));
}

/** Hanging lamp: iron chain at y, hanging lantern at y-1. */
export function hangLamp(g, x, y, z) {
  put(g, x, y, z, B.chain("y"));
  put(g, x, y - 1, z, B.lantern(true));
}

// ---- site and deck -------------------------------------------------------------------------------------------------
/** Shrub ball (azalea leaves, persistent) at (x,1,z) on mulch. */
export function shrub(g, x, z) {
  put(g, x, 1, z, leaves(AZALEA_LEAVES));
}

/**
 * Planting bed on mulch y0 over (x0,z0)..(x1,z1). The row nearest the house is z1 (every bed is on a front): flowering
 * azaleas at both ends, azalea shrubs every other cell, tulips alternating in the gaps. Other rows get tulips alternating.
 */
export function bed(g, x0, z0, x1, z1) {
  eachCell([x0, 0, z0], [x1, 0, z1], (x, y, z) => put(g, x, y, z, B.block(PODZOL)));
  for (let x = x0; x <= x1; x++) {
    const i = x - x0;
    if (x === x0 || x === x1) put(g, x, 1, z1, leaves(FLOWERING_AZALEA_LEAVES));
    else if (i % 2 === 0) shrub(g, x, z1);
    else put(g, x, 1, z1, B.block(i % 4 === 1 ? WHITE_TULIP : RED_TULIP));
    if (z0 !== z1) put(g, x, 1, z0, B.block(i % 2 === 0 ? WHITE_TULIP : RED_TULIP));
  }
}

/** Young birch at trunk (x,z): log y1..4, leaf ring y4, 3x3 y5, plus y6 (persistent), mulch 3x3 at y0. */
export function youngTree(g, x, z) {
  eachCell([x - 1, 0, z - 1], [x + 1, 0, z + 1], (cx, y, cz) => put(g, cx, y, cz, B.block(PODZOL)));
  for (let y = 1; y <= 4; y++) put(g, x, y, z, B.log("birch", "y"));
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (dx || dz) put(g, x + dx, 4, z + dz, leaves(BIRCH_LEAVES));
    put(g, x + dx, 5, z + dz, leaves(BIRCH_LEAVES));
  }
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) put(g, x + dx, 6, z + dz, leaves(BIRCH_LEAVES));
}

/** Lamp post at (x,z): dark oak fence y1..2, standing lantern y3. */
export function lampPost(g, x, z) {
  put(g, x, 1, z, B.fence("dark_oak"));
  put(g, x, 2, z, B.fence("dark_oak"));
  put(g, x, 3, z, B.lantern(false));
}

/** Mailbox at (x,z): stone brick wall y1, barrel facing north y2. */
export function mailbox(g, x, z) {
  put(g, x, 1, z, B.wall("stone_brick"));
  put(g, x, 2, z, ["barrel", { facing: "north", open: "false" }]);
}

/** Spruce fence rail at y2 on the outer edge of the deck box (x0 side, x1 side, z1 side; the z0 side is the house).
 *  gaps: [[x,z],...] left open (the steps). */
export function deckRail(g, x0, z0, x1, z1, { gaps = [] } = {}) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z1;
    if (edge && !gaps.some(([gx, gz]) => gx === x && gz === z)) put(g, x, 2, z, B.fence("spruce"));
  }
}
