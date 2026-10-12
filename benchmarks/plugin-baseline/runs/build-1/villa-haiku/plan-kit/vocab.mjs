// villa-haiku: the palette (palette.json), the site (plan.md SITE, OPENINGS, ROOMS), and one helper per VOCABULARY item.
// Every helper takes the grid first, then plan.md's parameters. Coordinates are PLAN coordinates: x 0..35, y 0..9,
// z 0..47, the street at z -4..-1 (SiteGrid shifts them into the file). Runs and floors are [x0, z0, x1, z1]
// (inclusive); solids are [x0, y0, z0, x1, y1, z1] (inclusive).
import { readFileSync } from "node:fs";
import { Grid, B, DIRS, carve, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- site: plan.md SITE; rooms.json is the plan's room list ----------------------------------------------------------
export const SITE = { w: 36, h: 10, d: 48, street: 4 };       // street: plan z -4..-1 is file z 0..3
const ROOMS_FILE = JSON.parse(readFileSync(new URL("./rooms.json", import.meta.url), "utf8"));
export const ENTRANCE = ROOMS_FILE.entrance;                  // [17, 1, -1]: on the street paving
export const ROOMS = ROOMS_FILE.rooms;                        // [{ name, box: [x0, y0, z0, x1, y1, z1] }]
export const POCKET = [16, 2, 0, 19, 5, 0];                   // fauces recess carved in the street wall
export const FAUCES_DOOR_X = 17;                              // leaves at x17 and x18, z=1
export const SHOP_OPENINGS = [[2, 5], [10, 13], [22, 25], [30, 33]];     // x0..x1 at z=0, y2..4
export const STREET_SHUTTERS = [1, 6, 9, 14, 21, 26, 29, 34];            // wall cells beside the shop openings
export const PEDIMENT = [16, 19, 0];                          // x0, x1, z of the fauces gable
export const IMPLUVIUM = [15, 12, 20, 17];                    // 6x6 with its rim
export const FOUNTAIN = [15, 31, 20, 36];                     // 6x6 with its rim
export const COURT = [12, 30, 23, 37];                        // grass court inside the colonnade
export const STATUES = [[13, 33], [22, 33]];
export const ATRIUM_LAMPS = [[10, 9], [25, 9], [10, 20], [25, 20]];
export const POCKET_LAMPS = [[16, 0], [19, 0]];
export const STREET_LAMPS = [[13, -2], [22, -2]];             // base y1 (on the paving)
export const WALKWAY_POTS = [[9, 28], [26, 28], [9, 39], [26, 39]];
export const STREET_PAVING = [12, -4, 23, -1];

/** The site grid: plan coordinates in, a file whose z starts at the street (nbt cannot hold negative z). */
export class SiteGrid extends Grid {
  constructor() { super([SITE.w, SITE.h, SITE.d + SITE.street]); }
  set(x, y, z, block, state, nbt) { return super.set(x, y, z + SITE.street, block, state, nbt); }
  get(x, y, z) { return super.get(x, y, z + SITE.street); }
  unset(x, y, z) { return super.unset(x, y, z + SITE.street); }
}
export const siteGrid = () => new SiteGrid();

// ---- palette: plan.md PALETTE (every id is in palette.json) ----------------------------------------------------------
export const WALL = "smooth_quartz";
export const DADO = "red_terracotta";
export const PILLAR = "quartz_pillar";
export const QUARTZ_SLAB = "quartz_slab";
export const QUARTZ_BLOCK = "quartz_block";
export const PLINTH = "polished_andesite";
export const MOSAIC_FIELD = "white_terracotta";
export const MOSAIC_EDGE = "black_terracotta";
export const GRASS = "grass_block";
export const PATH = "smooth_stone";
export const PATH_SLAB = "smooth_stone_slab";
export const HEDGE = "azalea_leaves";
export const ROSE = "rose_bush";
export const CORNFLOWER = "cornflower";
export const POPPY = "poppy";
export const RIM_SLAB = "smooth_quartz_slab";
export const WATER = "water";
export const STATUE = "oxidized_copper";
export const STATUE_CAP = "oxidized_cut_copper_slab";
export const DOOR = "dark_oak_door";
export const SHUTTER = "dark_oak_trapdoor";
export const BARS = "iron_bars";
export const LANTERN = "lantern";
export const POT_FERN = "potted_fern";
export const POT_AZALEA = "potted_azalea_bush";
export const ROOF_TILE = "bricks";
export const ROOF_TILE_RED = "red_nether_bricks";
export const PEDIMENT_STAIRS = "quartz_stairs";
export const COUCH = "dark_oak_stairs";
export const CUSHION = "red_carpet";
export const TABLE_SLAB = "dark_oak_slab";
export const HEARTH = "campfire";
export const STONE_BRICKS = "stone_bricks";
export const SMOKER = "smoker";
export const BARREL = "barrel";
export const BED = "red_bed";
export const BOOKSHELF = "bookshelf";
export const LECTERN = "lectern";
// the roof tool's RoofTile: field 3 : 2 red, eave bricks, ridge quartz_slab, verge quartz_block
export const ROOF_MATERIAL = { mix: [[ROOF_TILE, 3], [ROOF_TILE_RED, 2]], eave: ROOF_TILE, ridge: QUARTZ_SLAB, verge: QUARTZ_BLOCK };

// ---- helpers ---------------------------------------------------------------------------------------------------------
const level = ([x0, z0, x1, z1], y) => [[x0, y, z0], [x1, y, z1]];      // a flat box at one height, for g.fill

/** plaster: a wall run: smooth_quartz at y2..top, red_terracotta dado at y2..3. top 5 for a plain wall; higher where a roof's high side is walled. */
export function plaster(g, run, top = 5) {
  g.fill([run[0], 2, run[1]], [run[2], top, run[3]], WALL);
  g.fill([run[0], 2, run[1]], [run[2], 3, run[3]], DADO);
  return g;
}

/** mosaicFloor: the floor at y1 of a box: white_terracotta field, black_terracotta border one cell in from each wall. */
export function mosaicFloor(g, [x0, z0, x1, z1]) {
  g.fill(...level([x0, z0, x1, z1], 1), MOSAIC_FIELD);
  for (const [a, b, c, d] of [[x0, z0, x1, z0], [x0, z1, x1, z1], [x0, z0, x0, z1], [x1, z0, x1, z1]])
    g.fill([a, 1, b], [c, 1, d], MOSAIC_EDGE);
  return g;
}

/** doorway: one door in the wall cell (x, z): dark_oak_door lower y2 + upper y3 (hinge left); quartz_block jambs at y2..3 beside it; smooth_quartz lintel at y4..5. axis = the way the wall runs: "z" (an x-wall) or "x" (a z-wall). */
export function doorway(g, x, z, axis = "z") {
  const facing = axis === "z" ? "east" : "south";
  const [jx, jz] = axis === "z" ? [0, 1] : [1, 0];
  g.set(x, 2, z, ...B.door("dark_oak", facing, "lower", "left"));
  g.set(x, 3, z, ...B.door("dark_oak", facing, "upper", "left"));
  for (const s of [-1, 1]) g.fill([x + s * jx, 2, z + s * jz], [x + s * jx, 3, z + s * jz], QUARTZ_BLOCK);
  g.fill([x, 4, z], [x, 5, z], WALL);
  return g;
}

/** doorwayFacing: the fauces door, two leaves at x and x+1 in the z wall, facing south, hinges outside; quartz_block jambs at x-1 and x+2; smooth_quartz lintel at y4..5 over both leaves. */
export function doorwayFacing(g, x, z) {
  g.set(x, 2, z, ...B.door("dark_oak", "south", "lower", "left"));
  g.set(x, 3, z, ...B.door("dark_oak", "south", "upper", "left"));
  g.set(x + 1, 2, z, ...B.door("dark_oak", "south", "lower", "right"));
  g.set(x + 1, 3, z, ...B.door("dark_oak", "south", "upper", "right"));
  for (const jx of [x - 1, x + 2]) g.fill([jx, 2, z], [jx, 3, z], QUARTZ_BLOCK);
  g.fill([x, 4, z], [x + 1, 5, z], WALL);
  return g;
}

/** opening: a box in a wall carved to air. box = [x0, y0, z0, x1, y1, z1]. */
export function opening(g, box) {
  return carve(g, box.slice(0, 3), box.slice(3, 6));
}

/** shutter: open dark_oak_trapdoors on the wall cells x, z from y0 to y1; facing = the side toward the opening. */
export function shutter(g, x, y0, y1, z, facing) {
  for (let y = y0; y <= y1; y++) g.set(x, y, z, ...B.trapdoor("dark_oak", facing, "bottom", true));
  return g;
}

/** window: iron_bars at y3 and y4 in the wall cell (x, z). */
export function window(g, x, z) {
  g.fill([x, 3, z], [x, 4, z], BARS);
  return g;
}

/** shopOpening: a street opening x0..x1 at z=0 carved to air at y2..4; smooth_quartz counter at z=1, y2; open shutters on the cells x0-1 and x1+1. */
export function shopOpening(g, x0, x1) {
  carve(g, [x0, 2, 0], [x1, 4, 0]);
  g.fill([x0, 2, 1], [x1, 2, 1], WALL);
  shutter(g, x0 - 1, 2, 4, 0, "east");
  shutter(g, x1 + 1, 2, 4, 0, "west");
  return g;
}

/** column: a colonnade column at (x, z): quartz_pillar axis y at y2..4; quartz_slab bottom capital at y5. */
export function column(g, x, z) {
  g.fill([x, 2, z], [x, 4, z], PILLAR, { axis: "y" });
  g.set(x, 5, z, ...B.slab("quartz", "bottom"));
  return g;
}

/** lamp: a standing lamp at (x, z): quartz_pillar axis y at y=base (2; 1 for the street lamps), a lantern hanging=false on top. */
export function lamp(g, x, z, base = 2) {
  g.set(x, base, z, ...B.pillar(PILLAR, "y"));
  g.set(x, base + 1, z, ...B.lantern(false));
  return g;
}

const POT_KINDS = { fern: POT_FERN, azalea: POT_AZALEA, [POT_FERN]: POT_FERN, [POT_AZALEA]: POT_AZALEA };
/** pot: a potted plant at y2 on the floor: kind "fern" or "azalea" (the potted block is the pot). */
export function pot(g, x, z, kind = "fern") {
  if (!POT_KINDS[kind]) throw new Error(`pot: unknown kind ${kind}`);
  g.set(x, 2, z, POT_KINDS[kind]);
  return g;
}

/** hedge: a row of 1-high azalea_leaves (persistent) at y2 over the run [x0, z0, x1, z1]. */
export function hedge(g, run) {
  g.fill([run[0], 2, run[1]], [run[2], 2, run[3]], HEDGE, { persistent: "true" });
  return g;
}

/** bed: a planted bed on the court box: grass at y1; rose_bush (2 high) at the four corners; cornflower and poppy at y2 on the rest, in a checker. */
export function bed(g, [x0, z0, x1, z1]) {
  g.fill(...level([x0, z0, x1, z1], 1), GRASS);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    if (corner) {
      g.set(x, 2, z, ROSE, { half: "lower" });
      g.set(x, 3, z, ROSE, { half: "upper" });
    } else g.set(x, 2, z, (x + z) % 2 ? CORNFLOWER : POPPY);
  }
  return g;
}

/** couch: a run of three cells (a line): dark_oak_stairs at y2 facing the table, red_carpet at y2 in front of each. facing = the way the seats face. */
export function couch(g, [x0, z0, x1, z1], facing) {
  const [dx, , dz] = DIRS[facing];
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
    g.set(x, 2, z, ...B.stairs("dark_oak", facing));
    g.set(x + dx, 2, z + dz, CUSHION);
  }
  return g;
}

/** statue: polished_andesite plinth at y2; oxidized_copper figure at y3..4; oxidized_cut_copper_slab cap (bottom) at y5. */
export function statue(g, x, z) {
  g.set(x, 2, z, PLINTH);
  g.fill([x, 3, z], [x, 4, z], STATUE);
  g.set(x, 5, z, ...B.slab("oxidized_cut_copper", "bottom"));
  return g;
}

/** basin: the 6x6 box at y1: smooth_quartz_slab bottom around the ring, water inside. */
function basin(g, [x0, z0, x1, z1]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const rim = x === x0 || x === x1 || z === z0 || z === z1;
    if (rim) g.set(x, 1, z, ...B.slab("smooth_quartz", "bottom"));
    else g.set(x, 1, z, WATER);
  }
  return g;
}

/** impluvium: the rain pool in the 6x6 box: rim smooth_quartz_slab at y1, water 4x4 at y1 inside. */
export function impluvium(g, box) {
  return basin(g, box);
}

/** fountain: the court fountain in the 6x6 box: the basin as impluvium; quartz_block column 2x2 at y2..3 in the centre; water on top at y4 over the centre's first cell. */
export function fountain(g, box) {
  basin(g, box);
  const cx = box[0] + 2, cz = box[1] + 2;                    // x17..18 z33..34 for the box at x15 z31
  g.fill([cx, 2, cz], [cx + 1, 3, cz + 1], QUARTZ_BLOCK);
  g.set(cx, 4, cz, WATER);
  return g;
}

/** roofBand: one shed band over rects (a rect [x0, z0, x1, z1] or a union of them), low = the low side. Eave course y6, palette RoofTile; the soffit is the tile (no timber fascia: plan.md names no fascia). Returns the roof tool's report. */
export function roofBand(g, rects, low) {
  return roof(g, rects, "shed", { y: 6, low, material: ROOF_MATERIAL, soffit: ROOF_TILE, edges: { fascia: false, barge: false } });
}

/** pediment: the fauces gable over the pocket: quartz_stairs at y6 x0..x1 and y7 x0+1..x1-1 at z, turned to the street (facing north). */
export function pediment(g, x0, x1, z) {
  for (let x = x0; x <= x1; x++) g.set(x, 6, z, ...B.stairs("quartz", "north"));
  for (let x = x0 + 1; x <= x1 - 1; x++) g.set(x, 7, z, ...B.stairs("quartz", "north"));
  return g;
}

/** streetPaving: the approach: stone_bricks at y0 over the box; the edge row (z = z1, the row at z=-1) as smooth_stone_slab bottom. */
export function streetPaving(g, [x0, z0, x1, z1]) {
  g.fill([x0, 0, z0], [x1, 0, z1], STONE_BRICKS);
  for (let x = x0; x <= x1; x++) g.set(x, 0, z1, ...B.slab("smooth_stone", "bottom"));
  return g;
}
