// Shared vocabulary for the Germanic bakery: palette constants (palette.json ids only), plan.md site coordinates, and one
// helper per plan.md VOCABULARY item (41). Each helper is helper(g, ...args): it writes through g.set with the build
// library's B.* states and returns the [x, y, z] cells it wrote.
// Conventions (plan.md): a run is a0..a1 along `axis` ("x" or "z"); `fixed` is the other horizontal coordinate; y is height.
// Stair `facing` = the side of the full-height back (toolkit). Cells a later part must own are left unset here.
import { B, DIRS, OPPOSITE, roof, load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";

// ---- palette (palette.json ids only) ------------------------------------------------------------------------------------
export const DEEPSLATE_BRICKS = "deepslate_bricks";
export const DEEPSLATE_BRICK_STAIRS = "deepslate_brick_stairs";
export const DEEPSLATE_BRICK_SLAB = "deepslate_brick_slab";
export const DEEPSLATE_BRICK_WALL = "deepslate_brick_wall";
export const POLISHED_DEEPSLATE = "polished_deepslate";
export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs";
export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";
export const COBBLED_DEEPSLATE = "cobbled_deepslate";
export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs";
export const COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab";
export const COBBLED_DEEPSLATE_WALL = "cobbled_deepslate_wall";
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";
export const STRIPPED_SPRUCE_WOOD = "stripped_spruce_wood";
export const SPRUCE_STAIRS = "spruce_stairs";
export const WHITE_WOOL = "white_wool";
export const DEEPSLATE_TILES = "deepslate_tiles";
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";
export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks";
export const POLISHED_BLACKSTONE_BRICK_STAIRS = "polished_blackstone_brick_stairs";  // roof tool's eave stairs (not in plan PALETTE)
export const POLISHED_BLACKSTONE_BRICK_SLAB = "polished_blackstone_brick_slab";      // roof tool's eave slabs (not in plan PALETTE)
export const SPRUCE_PLANKS = "spruce_planks";
export const SPRUCE_SLAB = "spruce_slab";
export const BRICKS = "bricks";
export const BRICK_STAIRS = "brick_stairs";
export const BRICK_SLAB = "brick_slab";
export const BRICK_WALL = "brick_wall";
export const GLASS_PANE = "glass_pane";
export const SPRUCE_DOOR = "spruce_door";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
export const SPRUCE_FENCE = "spruce_fence";
export const SPRUCE_FENCE_GATE = "spruce_fence_gate";
export const SPRUCE_HANGING_SIGN = "spruce_hanging_sign";
export const SPRUCE_WALL_SIGN = "spruce_wall_sign";
export const LANTERN = "lantern";
export const CAMPFIRE = "campfire";
export const CANDLE = "candle";
export const WHITE_CANDLE = "white_candle";
export const IRON_CHAIN = "iron_chain";
export const POTTED_RED_TULIP = "potted_red_tulip";
export const POTTED_POPPY = "potted_poppy";
export const FLOWER_POT = "flower_pot";
export const GRAVEL = "gravel";
export const COBBLESTONE = "cobblestone";
export const MOSSY_COBBLESTONE = "mossy_cobblestone";
export const GRASS_BLOCK = "grass_block";
export const PODZOL = "podzol";
export const COARSE_DIRT = "coarse_dirt";
export const DIRT_PATH = "dirt_path";
export const FARMLAND = "farmland";
export const WHEAT = "wheat";
export const SPRUCE_LOG = "spruce_log";
export const SPRUCE_LEAVES = "spruce_leaves";
export const SMOKER = "smoker";
export const BLAST_FURNACE = "blast_furnace";
export const FURNACE = "furnace";
export const BARREL = "barrel";
export const HAY_BLOCK = "hay_block";
export const COMPOSTER = "composter";
export const GRINDSTONE = "grindstone";
export const CAULDRON = "cauldron";
export const WATER_CAULDRON = "water_cauldron";
export const LOOM = "loom";
export const CHEST = "chest";
export const LECTERN = "lectern";
export const CRAFTING_TABLE = "crafting_table";
export const BOOKSHELF = "bookshelf";
export const CHISELED_BOOKSHELF = "chiseled_bookshelf";
export const DECORATED_POT = "decorated_pot";
export const CAKE = "cake";
export const CANDLE_CAKE = "candle_cake";
export const LADDER = "ladder";
export const WHITE_BED = "white_bed";
export const RED_BED = "red_bed";
export const WHITE_CARPET = "white_carpet";
export const RED_CARPET = "red_carpet";
export const BROWN_CARPET = "brown_carpet";
export const RED_WOOL = "red_wool";
export const BROWN_WOOL = "brown_wool";

// ---- site (plan.md SITE; all ranges inclusive) -----------------------------------------------------------------------
export const LOT = { x0: 0, x1: 23, z0: 0, z1: 31, height: 24 };
export const GROUND_Y = 0;
export const WALK_Y = 1;
export const STREET_Z = { z0: 0, z1: 2 };
export const KERB_Z = 3;
export const SIDEWALK_Z = { z0: 4, z1: 7 };
export const FRONT_STEP = { x0: 10, x1: 12, y: 1, z: 8 };
export const MAIN_GROUND = { x0: 6, x1: 16, y0: 1, y1: 5, z0: 9, z1: 22 };
export const MAIN_UPPER = { x0: 6, x1: 16, y0: 6, y1: 10, z0: 8, z1: 22 };
export const FRONT_Z = 9;   // ground-storey front wall
export const JETTY_Z = 8;   // upper storey and jetty line
export const BACK_Z = 22;   // back wall of the main body
export const MAIN_ROOF = { x0: 5, x1: 17, y0: 11, y1: 21, z0: 7, z1: 23, ridgeX: 11, ridgeY: 21 };
export const WING = { x0: 17, x1: 21, y0: 1, y1: 5, z0: 13, z1: 22 };
export const WING_ROOF = { x0: 17, x1: 22, y0: 6, y1: 8, z0: 12, z1: 23, ridgeX: 19 };
export const OVEN = { x0: 17, x1: 21, y0: 1, y1: 5, z0: 23, z1: 26 };
export const OVEN_MOUTH = { x: 19, y: 2, z: 22 };
export const OVEN_FIRE = { x: 19, y: 2, z: 24 };
export const SMOKER_AT = { x: 18, y: 2, z: 21 };
export const CHIMNEY = { x0: 19, x1: 20, y0: 4, y1: 17, z0: 24, z1: 25, flue: { x: 19, z: 24 }, top: 17, band: 12 };
export const CHIMNEY_FIRE = { x: 19, y: 17, z: 24 };
export const HOIST = { x: 11, y: 19, z0: 5, z1: 8, chainY: [18, 17], barrelY: 16 };
export const SIGN = { x: 16, y: 6, z: 6, arm: 7 };
export const BENCH = { x0: 2, x1: 4, y: 1, z: 10 };
export const WOODPILE = { x0: 7, x1: 10, z0: 24, z1: 25 };
export const WHEAT_PATCH = { x0: 2, x1: 5, z0: 24, z1: 28 };
export const PROPS = { x0: 12, x1: 15, z0: 24, z1: 26 };
export const YARD_RUNS = [[1, 30, 23, 30], [1, 10, 1, 30], [23, 10, 23, 30]];
export const YARD_GATES = [{ x: 1, y: 1, z: 20 }, { x: 23, y: 1, z: 16 }];
export const STAIR_HOUSING = { x0: 7, x1: 8, y0: 2, y1: 6, z0: 14, z1: 18 };
export const ATTIC_LADDER = { x: 9, z: 20, y0: 7, y1: 11, backingZ: 21 };
export const GABLE = { collarX0: 8, collarX1: 14, collarY: 14, kingX: 11, kingY0: 11, kingY1: 13, front: FRONT_Z - 1, back: BACK_Z };

// ---- helpers ---------------------------------------------------------------------------------------------------------
const put = (g, out, [x, y, z], [block, state, nbt]) => { g.set(x, y, z, block, state, nbt); out.push([x, y, z]); return out; };
const at = (axis, a, fixed, y) => (axis === "x" ? [a, y, fixed] : [fixed, y, a]);
const cellsOf = (x0, x1, y0, y1, z0, z1) => { const c = []; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) c.push([x, y, z]); return c; };
const keyOf = ([x, y, z]) => `${x},${y},${z}`;
/** Cell -> "block+state" for every cell in g, to find what a call changed (the roof tool reports a count, not cells). */
const snapshot = (g) => new Map([...g].map((c) => [keyOf(c.pos), c.block + JSON.stringify(c.state ?? {})]));
const changedCells = (g, before) => [...g].filter((c) => before.get(keyOf(c.pos)) !== c.block + JSON.stringify(c.state ?? {})).map((c) => c.pos);
const DIRNAME = { e: "east", w: "west", n: "north", s: "south" };
const FENCE_SIDES = { north: [0, 0, -1], south: [0, 0, 1], west: [-1, 0, 0], east: [1, 0, 0] };
/** Fence connection states from the set of neighbour keys ("x,y,z") that connect (fences, gates, posts). */
const fenceState = (links, [x, y, z]) => Object.fromEntries(Object.entries(FENCE_SIDES).map(([side, [dx, dy, dz]]) => [side, links.has(`${x + dx},${y + dy},${z + dz}`) ? "true" : "false"]));

// ---- Frame and walls ---------------------------------------------------------------------------------------------------
/** 1. Horizontal stripped_spruce_wood run from a0 to a1 along axis, at the other horizontal coordinate `fixed`, height y. */
export function beamRun(g, axis, a0, a1, fixed, y) {
  const out = [];
  for (let a = a0; a <= a1; a++) put(g, out, at(axis, a, fixed, y), B.wood("stripped_spruce", axis));
  return out;
}

/** 2. Vertical stripped_spruce_log (axis y) at (x, y0..y1, z). */
export function postRun(g, x, y0, y1, z) {
  const out = [];
  for (let y = y0; y <= y1; y++) put(g, out, [x, y, z], B.log("stripped_spruce", "y"));
  return out;
}

/**
 * 3. white_wool daub over the box a0..a1 (along axis) x y0..y1 (at `fixed`). skip: [x,y,z] cells left unset (windows).
 * brace: null | "left" | "right" puts one upside-down spruce_stairs (mannBrace) at the first or last run cell, bottom row,
 * with its back toward the nearest post (left = a0 side, right = a1 side); that cell is not filled with daub.
 */
export function daubPanel(g, axis, a0, a1, y0, y1, fixed, { brace = null, skip = [] } = {}) {
  const out = [], skipped = new Set(skip.map(keyOf));
  const braceA = brace === "left" ? a0 : brace === "right" ? a1 : null;
  for (let a = a0; a <= a1; a++) for (let y = y0; y <= y1; y++) {
    const p = at(axis, a, fixed, y);
    if (skipped.has(keyOf(p)) || (a === braceA && y === y0)) continue;
    put(g, out, p, B.block(WHITE_WOOL));
  }
  if (braceA != null) {
    const toward = brace === "left" ? (axis === "x" ? "w" : "n") : (axis === "x" ? "e" : "s");
    mannBrace(g, ...at(axis, braceA, fixed, y0), toward).forEach((c) => out.push(c));
  }
  return out;
}

/**
 * 4. A timber-framed wall: sill beam at y0 (full run), breast rail at y0+1 and head plate at y1 between the posts,
 * posts (stripped_spruce_log) at y0+1..y1 at the `posts` positions, daub between them at y0+2..y1-1. windows: [a0,a1,ya,yb]
 * boxes left unset; braced: span indexes (spans left to right, between posts) that get a Mann brace.
 */
export function fachwerkWall(g, axis, fixed, a0, a1, y0, y1, posts = [], windows = [], braced = []) {
  const out = [], isPost = new Set(posts);
  for (let a = a0; a <= a1; a++) {
    put(g, out, at(axis, a, fixed, y0), B.wood("stripped_spruce", axis));
    if (!isPost.has(a)) {
      put(g, out, at(axis, a, fixed, y0 + 1), B.wood("stripped_spruce", axis));
      put(g, out, at(axis, a, fixed, y1), B.wood("stripped_spruce", axis));
    }
  }
  for (const p of posts) {
    const [px, pz] = axis === "x" ? [p, fixed] : [fixed, p];
    postRun(g, px, y0 + 1, y1, pz).forEach((c) => out.push(c));
  }
  const skip = windows.flatMap(([w0, w1, ya, yb]) => cellsOf(...(axis === "x" ? [w0, w1, ya, yb, fixed, fixed] : [fixed, fixed, ya, yb, w0, w1])));
  const bounds = [a0 - 1, ...[...posts].sort((p, q) => p - q), a1 + 1];
  let spanIndex = 0;
  for (let i = 0; i < bounds.length - 1; i++) {
    const lo = bounds[i] + 1, hi = bounds[i + 1] - 1;
    if (lo > hi) continue;
    const brace = braced.includes(spanIndex) ? (isPost.has(bounds[i]) ? "left" : "right") : null;
    daubPanel(g, axis, lo, hi, y0 + 2, y1 - 1, fixed, { brace, skip }).forEach((c) => out.push(c));
    spanIndex++;
  }
  return out;
}

/** 5. One spruce_stairs (half top, upside down) with its back toward the post at `toward` (e|w|n|s). */
export function mannBrace(g, x, y, z, toward) {
  return put(g, [], [x, y, z], B.stairs("spruce", DIRNAME[toward], "top"));
}

/**
 * 6. deepslate_bricks courses over a0..a1 x y0..y1 at `fixed`; a polished_deepslate plinth at y0 (plinth: true).
 * openings: [a0,a1,ya,yb] boxes left unset. piers: pier positions are masonry already (listed, nothing extra written).
 */
export function masonryWall(g, axis, fixed, a0, a1, y0, y1, { plinth = true, piers = [], openings = [] } = {}) {
  const out = [], skipped = new Set(openings.flatMap(([o0, o1, ya, yb]) => cellsOf(...(axis === "x" ? [o0, o1, ya, yb, fixed, fixed] : [fixed, fixed, ya, yb, o0, o1]))).map(keyOf));
  for (let a = a0; a <= a1; a++) for (let y = y0; y <= y1; y++) {
    const p = at(axis, a, fixed, y);
    if (skipped.has(keyOf(p))) continue;
    put(g, out, p, B.block(plinth && y === y0 ? POLISHED_DEEPSLATE : DEEPSLATE_BRICKS));
  }
  return out;
}

/** 7. Jetty bracket: spruce_stairs half top, back against the wall (facing south for the front jetty). */
export function jettyBracket(g, x, y, z, facing = "south") {
  return put(g, [], [x, y, z], B.stairs("spruce", facing, "top"));
}

/** 8. Gable frame at z (GABLE.front = 8, GABLE.back = 22): collar beam (stripped_spruce_wood, axis x) and king post. */
export function gableFrame(g, z, { king = true, collar = [GABLE.collarX0, GABLE.collarX1, GABLE.collarY] } = {}) {
  const out = beamRun(g, "x", collar[0], collar[1], z, collar[2]);
  if (king) postRun(g, GABLE.kingX, GABLE.kingY0, GABLE.kingY1, z).forEach((c) => out.push(c));
  return out;
}

// ---- Openings ----------------------------------------------------------------------------------------------------------
/** 9. glass_pane over a0..a1 x y0..y1 at `fixed`, connected along the wall axis. */
export function glazedWindow(g, axis, a0, a1, y0, y1, fixed) {
  const out = [];
  const links = axis === "x" ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" };
  for (let a = a0; a <= a1; a++) for (let y = y0; y <= y1; y++) put(g, out, at(axis, a, fixed, y), [GLASS_PANE, links]);
  return out;
}

/** 10. Shop window on the front (z=9): glass at y=3..4, deepslate_bricks breast at y=2, counter slab at z=8. */
export function shopWindow(g, x0, x1) {
  const out = glazedWindow(g, "x", x0, x1, 3, 4, FRONT_Z);
  for (let x = x0; x <= x1; x++) put(g, out, [x, 2, FRONT_Z], B.block(DEEPSLATE_BRICKS));
  counterSlab(g, x0, x1, JETTY_Z).forEach((c) => out.push(c));
  return out;
}

/** 11. spruce_slab top at (x0..x1, y=2, z). */
export function counterSlab(g, x0, x1, z) {
  const out = [];
  for (let x = x0; x <= x1; x++) put(g, out, [x, 2, z], B.slab("spruce", "top"));
  return out;
}

/** 12. Open spruce_trapdoors in a column at x, y0..y1, z; faceDir = the wall side so each lies flat against it. */
export function shutterPair(g, x, y0, y1, z, faceDir) {
  const out = [];
  for (let y = y0; y <= y1; y++) put(g, out, [x, y, z], B.trapdoor("spruce", faceDir, "bottom", true));
  return out;
}

/** 13. spruce_door, lower at (x,y,z) and upper at (x,y+1,z), closed, hinge left. */
export function doorAt(g, x, y, z, facing) {
  const out = [];
  put(g, out, [x, y, z], B.door("spruce", facing, "lower", "left"));
  put(g, out, [x, y + 1, z], B.door("spruce", facing, "upper", "left"));
  return out;
}

/** 14. Front step: cobbled_deepslate_stairs at (11,1,8) with its low side to the street (facing south), slabs at x=10, 12. */
export function frontStep(g) {
  const out = [];
  put(g, out, [11, FRONT_STEP.y, FRONT_STEP.z], B.stairs("cobbled_deepslate", "south", "bottom"));
  put(g, out, [10, FRONT_STEP.y, FRONT_STEP.z], B.slab("cobbled_deepslate", "bottom"));
  put(g, out, [12, FRONT_STEP.y, FRONT_STEP.z], B.slab("cobbled_deepslate", "bottom"));
  return out;
}

/** 15. Flower box on a spruce_slab top at (x0..x1, 7, z); a potted flower on each slab: tulip at even x, poppy at odd x. */
export function flowerBox(g, x0, x1, z) {
  const out = [];
  for (let x = x0; x <= x1; x++) {
    put(g, out, [x, 7, z], B.slab("spruce", "top"));
    put(g, out, [x, 8, z], B.block(x % 2 === 0 ? POTTED_RED_TULIP : POTTED_POPPY));
  }
  return out;
}

/** 16. Bakery sign arm: spruce_fence out from the jetty corner, hanging sign "Bäckerei", lantern hanging beneath. */
export function signArm(g) {
  const out = [];
  put(g, out, [SIGN.x, SIGN.arm, 7], [SPRUCE_FENCE, fenceState(new Set([`${SIGN.x},${SIGN.arm},6`, `${SIGN.x},${SIGN.arm},8`]), [SIGN.x, SIGN.arm, 7])]);
  put(g, out, [SIGN.x, SIGN.arm, 6], [SPRUCE_FENCE, fenceState(new Set([`${SIGN.x},${SIGN.arm},7`]), [SIGN.x, SIGN.arm, 6])]);
  const [, , signNbt] = B.sign("spruce", ["Bäckerei"], { wall: false, hanging: true, rotation: 4 });
  put(g, out, [SIGN.x, SIGN.y, SIGN.z], [SPRUCE_HANGING_SIGN, { attached: "false", rotation: "4" }, signNbt]);
  hangingLantern(g, SIGN.x, SIGN.y, 7).forEach((c) => out.push(c));
  return out;
}

/**
 * 17. Hanging lantern at (x,y,z). Solid block above: hangs directly. Air above with a solid block two up: an iron_chain
 * links it. Nothing to hang from: the lantern is placed on its own (the caller must give it a support).
 */
export function hangingLantern(g, x, y, z) {
  const out = [];
  if (!g.isAir(x, y + 1, z)) return put(g, out, [x, y, z], B.lantern(true));
  if (!g.isAir(x, y + 2, z)) {
    put(g, out, [x, y + 1, z], B.chain("y"));
  }
  return put(g, out, [x, y, z], B.lantern(true));
}

/** 18. Flour-loft hoist: stripped_spruce_log beam (axis z), iron chains, a barrel load, and two open shutters on the gable. */
export function hoistAssembly(g) {
  const out = [];
  for (let z = HOIST.z0; z <= HOIST.z1; z++) put(g, out, [HOIST.x, HOIST.y, z], B.log("stripped_spruce", "z"));
  for (const y of HOIST.chainY) put(g, out, [HOIST.x, y, HOIST.z0], B.chain("y"));
  put(g, out, [HOIST.x, HOIST.barrelY, HOIST.z0], [BARREL, { facing: "up", open: "false" }]);
  for (const x of [HOIST.x - 1, HOIST.x + 1]) for (const y of [15, 16]) put(g, out, [x, y, 7], B.trapdoor("spruce", "south", "bottom", true));
  return out;
}

// ---- Roof, oven, chimney -------------------------------------------------------------------------------------------------
/** The slate roof of plan.md MATERIALS (both roofs): the roof tool's mix, eave and ridge blocks. */
export const SLATE_ROOF = { mix: [[COBBLED_DEEPSLATE, 45], [DEEPSLATE_TILES, 35], [POLISHED_DEEPSLATE, 20]], eave: POLISHED_BLACKSTONE_BRICKS, ridge: DEEPSLATE_BRICK_SLAB };

/** The architect's roof spec (plan.md ROOFS, main). keep = the gable timber cells, the loft door and the hoist column. */
export const MAIN_ROOF_SPEC = {
  preset: "shop", ridgeAxis: "z", front: "n", gable: WHITE_WOOL, verge: "spruce", alt: [],
  material: SLATE_ROOF,
  keep: [
    { from: [8, 14, 8], to: [14, 14, 8] }, { from: [9, 11, 8], to: [13, 13, 8] }, { from: [10, 15, 7], to: [12, 16, 8] },
    { from: [8, 14, 22], to: [14, 14, 22] }, { from: [11, 11, 22], to: [11, 13, 22] }, { from: [11, 15, 22], to: [11, 16, 22] },
    { from: [11, 15, 5], to: [11, 19, 8] },
  ],
};

/**
 * 19. Main slate roof: runs `mcd roof --spec` (preset shop, footprint [6,8,16,22], eave y=10) on a copy of the grid and
 * merges the cells that changed back into g. Returns the cells merged. Throws if the roof tool resized the grid.
 */
export function roofMain(g) {
  const dir = mkdtempSync(join(tmpdir(), "bakery-roof-"));
  try {
    const inFile = join(dir, "in.nbt"), outFile = join(dir, "out.nbt"), specFile = join(dir, "roof.json");
    g.save(inFile);
    writeFileSync(specFile, JSON.stringify(MAIN_ROOF_SPEC, null, 1));
    execFileSync(process.execPath, [MCD, "roof", inFile, outFile, "--spec", specFile, "--footprint", "6,8,16,22", "--y", "10"], { stdio: ["ignore", "pipe", "pipe"] });
    const after = load(outFile);
    if (after.size.join() !== g.size.join()) throw new Error(`roofMain: the roof tool resized the grid ${g.size} -> ${after.size}; shift the build before merging`);
    const out = [];
    for (const c of after) {
      const before = g.get(...c.pos);
      if (!before || before.block !== c.block || JSON.stringify(before.state ?? {}) !== JSON.stringify(c.state ?? {})) {
        g.set(...c.pos, c.block, c.state, c.nbt);
        out.push(c.pos);
      }
    }
    return out;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** 20. Wing roof: gable on the bakehouse rects [[17,13,21,22]], eave y=6, ridge along z, slate, overhang 1 except west 0. */
export function roofWing(g) {
  const before = snapshot(g);
  roof(g, [[WING.x0, WING.z0, WING.x1, WING.z1]], "gable", {
    y: WING_ROOF.y0, ridgeAxis: "z", material: SLATE_ROOF, overhang: { west: 0, north: 1, south: 1, east: 1 },
    gable: WHITE_WOOL, ridge: "slab", verge: "spruce", edges: { fascia: "spruce", soffit: "spruce" },
    // the tone check would swap the plan's slate for dark_oak over the grey cobbled wing walls; plan.md keeps the slate
    contrast: false, why: "plan.md MATERIALS: slate over the cobbled wing walls, the one roof material the plan names",
  });
  return changedCells(g, before);
}

/**
 * 21. Bread oven: cobbled plinth (y=1), bricks ring at y=2..3 around the chamber x=18..20 z=23..25 (north side is the
 * wing wall), brick_stairs at x=17 (back west) and x=21 (back east) and bricks at y=4, brick_slab bottoms at y=5. The
 * chimney flue (19,4,24) and the chimney cells at y=5 are left to chimneyStack. Campfire lit at (19,2,24); smoker at (18,2,21).
 */
export function ovenVault(g) {
  const out = [];
  const inChamber = (x, z) => x >= 18 && x <= 20 && z >= 23 && z <= 25;
  const inChimney = (x, z) => x >= CHIMNEY.x0 && x <= CHIMNEY.x1 && z >= CHIMNEY.z0 && z <= CHIMNEY.z1;
  const isFlue = (x, y, z) => x === CHIMNEY.flue.x && y === CHIMNEY.y0 && z === CHIMNEY.flue.z;
  for (let x = OVEN.x0; x <= OVEN.x1; x++) for (let z = OVEN.z0; z <= OVEN.z1; z++) {
    put(g, out, [x, 1, z], B.block(COBBLED_DEEPSLATE));                                  // plinth, whole footprint
    if (!inChamber(x, z)) for (const y of [2, 3]) put(g, out, [x, y, z], B.block(BRICKS)); // body ring round the chamber
    if (x === OVEN.x0 || x === OVEN.x1) put(g, out, [x, 4, z], B.stairs("brick", x === OVEN.x0 ? "west" : "east", "bottom"));
    else if (!isFlue(x, 4, z)) put(g, out, [x, 4, z], B.block(BRICKS));                  // vault course
    if (x >= 18 && x <= 20 && !inChimney(x, z)) put(g, out, [x, 5, z], B.slab("brick", "bottom")); // crown
  }
  put(g, out, [OVEN_FIRE.x, OVEN_FIRE.y, OVEN_FIRE.z], [CAMPFIRE, { facing: "north", lit: "true" }]);
  put(g, out, [SMOKER_AT.x, SMOKER_AT.y, SMOKER_AT.z], [SMOKER, { facing: "south", lit: "false" }]);
  return out;
}

/**
 * 22. Chimney: bricks x=19..20 z=24..25 from y=4 to 16 with the flue (19,y,24) left unset (air); deepslate_bricks band at
 * y=12; top ring at y=17: brick_slab top at the three non-smoke cells and a lit campfire at (19,17,24).
 */
export function chimneyStack(g) {
  const out = [];
  const isFlue = (x, y, z) => x === CHIMNEY.flue.x && z === CHIMNEY.flue.z && y < CHIMNEY.top;
  for (let y = CHIMNEY.y0; y < CHIMNEY.top; y++) for (let x = CHIMNEY.x0; x <= CHIMNEY.x1; x++) for (let z = CHIMNEY.z0; z <= CHIMNEY.z1; z++) {
    if (isFlue(x, y, z)) continue;
    const band = y === CHIMNEY.band;
    put(g, out, [x, y, z], B.block(band ? DEEPSLATE_BRICKS : BRICKS));
  }
  put(g, out, [20, CHIMNEY.top, 24], B.slab("brick", "top"));
  put(g, out, [19, CHIMNEY.top, 25], B.slab("brick", "top"));
  put(g, out, [20, CHIMNEY.top, 25], B.slab("brick", "top"));
  put(g, out, [CHIMNEY_FIRE.x, CHIMNEY_FIRE.y, CHIMNEY_FIRE.z], [CAMPFIRE, { facing: "north", lit: "true" }]);
  return out;
}

// ---- Yard ---------------------------------------------------------------------------------------------------------------
/** 23. Woodpile (oven fuel): spruce_log axis x in two rows (y=1..2) over x0..x1 z0..z1; a bottom spruce_slab lid at y=3. */
export function woodpile(g, x0, x1, z0, z1) {
  const out = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    for (const y of [1, 2]) put(g, out, [x, y, z], B.log("spruce", "x"));
    put(g, out, [x, 3, z], B.slab("spruce", "bottom"));
  }
  return out;
}

/** 24. spruce_fence along runs [[x0,z0,x1,z1], ...] at y=1 (connections set), with the spruce_fence_gates of YARD_GATES. */
export function yardFence(g, runs) {
  const out = [], links = new Set(), gates = new Set(YARD_GATES.map(({ x, y, z }) => `${x},${y},${z}`));
  const cells = runs.flatMap(([x0, z0, x1, z1]) => cellsOf(x0, x1, WALK_Y, WALK_Y, z0, z1));
  for (const c of cells) links.add(keyOf(c));
  for (const c of cells) if (!gates.has(keyOf(c))) put(g, out, c, [SPRUCE_FENCE, fenceState(links, c)]);
  for (const { x, y, z } of YARD_GATES) put(g, out, [x, y, z], [SPRUCE_FENCE_GATE, { facing: "east", in_wall: "false", open: "false" }]);
  return out;
}

/** 25. Bench: spruce_stairs (bottom) in a row at x0..x1, z, at y=1; facing as given (plan: north; back = the stair's full side). */
export function benchRun(g, x0, x1, z, facing = "north") {
  const out = [];
  for (let x = x0; x <= x1; x++) put(g, out, [x, BENCH.y, z], B.stairs("spruce", facing, "bottom"));
  return out;
}

/** 26. Wheat patch: farmland (moisture 7) at y=0 inside, coarse_dirt ring at y=0, wheat at y=1 (age 7; some age 5). */
export function wheatPatch(g, x0, x1, z0, z1) {
  const out = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (edge) { put(g, out, [x, GROUND_Y, z], B.block(COARSE_DIRT)); continue; }
    put(g, out, [x, GROUND_Y, z], [FARMLAND, { moisture: "7" }]);
    put(g, out, [x, WALK_Y, z], [WHEAT, { age: (x * 3 + z) % 4 === 0 ? "5" : "7" }]);
  }
  return out;
}

/** 27. Small spruce at (x,z): spruce_log trunk y=1..h-2; persistent spruce_leaves: a 3x3 ring at h-4, a plus at h-3, a tip at h-1. */
export function smallSpruce(g, x, z, h) {
  const out = [];
  for (let y = 1; y <= h - 2; y++) put(g, out, [x, y, z], B.log("spruce", "y"));
  const leaf = [SPRUCE_LEAVES, { persistent: "true" }];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) put(g, out, [x + dx, h - 4, z + dz], leaf);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(g, out, [x + dx, h - 3, z + dz], leaf);
  put(g, out, [x, h - 1, z], leaf);
  return out;
}

/** 28. Props yard at (x0, z0): barrels, a hay bale stack, a composter and a grindstone on the floor (y=1). */
export function propCluster(g, x0, z0) {
  const out = [];
  put(g, out, [x0, 1, z0], B.block(BARREL));
  put(g, out, [x0 + 1, 1, z0], B.block(BARREL));
  put(g, out, [x0 + 2, 1, z0], [HAY_BLOCK, { axis: "y" }]);
  put(g, out, [x0 + 2, 2, z0], [HAY_BLOCK, { axis: "y" }]);
  put(g, out, [x0 + 3, 1, z0 + 1], [HAY_BLOCK, { axis: "y" }]);
  put(g, out, [x0, 1, z0 + 2], [COMPOSTER, { level: "1" }]);
  put(g, out, [x0 + 3, 1, z0], [GRINDSTONE, { face: "floor", facing: "north" }]);
  return out;
}

/** 29. Fills x0..x1 x z0..z1 at y=0 with base; a deterministic `ratio` of the cells get fleck instead (sidewalk, yard). */
export function scatterBlend(g, x0, x1, z0, z1, base, fleck, ratio) {
  const out = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const roll = (((x * 73856093) ^ (z * 19349663)) >>> 0) % 1000 / 1000;
    put(g, out, [x, GROUND_Y, z], B.block(roll < ratio ? fleck : base));
  }
  return out;
}

// ---- Furniture (room designers) -----------------------------------------------------------------------------------------
/** 30. Shop counter: spruce_planks body at y=2 along x0..x1 at z; cake and candle_cake alternate on the top at y=3. */
export function shopCounter(g, x0, x1, z) {
  const out = [];
  for (let x = x0; x <= x1; x++) {
    put(g, out, [x, 2, z], B.block(SPRUCE_PLANKS));
    const i = x - x0;
    if (i % 2 === 0) put(g, out, [x, 3, z], [CAKE, { bites: "0" }]);
  }
  return out;
}

/**
 * 31. Bread rack from (x, y, z) along axis for len cells: spruce_planks end columns y..y+3, spruce_slab bottoms at y+1 and
 * y+2 between them, a cake on every other shelf cell (y+3).
 */
export function breadRack(g, x, y, z, axis, len) {
  const out = [];
  for (let i = 0; i < len; i++) {
    const [px, pz] = axis === "x" ? [x + i, z] : [x, z + i];
    if (i === 0 || i === len - 1) {
      for (let dy = 0; dy <= 3; dy++) put(g, out, [px, y + dy, pz], B.block(SPRUCE_PLANKS));
    } else {
      put(g, out, [px, y + 1, pz], B.slab("spruce", "bottom"));
      put(g, out, [px, y + 2, pz], B.slab("spruce", "bottom"));
      if (i % 2 === 1) put(g, out, [px, y + 3, pz], [CAKE, { bites: "0" }]);
    }
  }
  return out;
}

/** 32. Flour store: two barrels (facing up) stacked at (x, y..y+1, z) with a hay_block sack on top. */
export function flourStore(g, x, y, z) {
  const out = [];
  put(g, out, [x, y, z], [BARREL, { facing: "up", open: "false" }]);
  put(g, out, [x, y + 1, z], [BARREL, { facing: "up", open: "false" }]);
  put(g, out, [x, y + 2, z], [HAY_BLOCK, { axis: "y" }]);
  return out;
}

/** 33. Kneading trough: empty cauldrons along x from x for len; spruce_stairs (bottom) on both long sides, backs outward; closed trapdoor lid. */
export function kneadingTrough(g, x, y, z, len) {
  const out = [];
  for (let i = 0; i < len; i++) {
    put(g, out, [x + i, y, z], B.block(CAULDRON));
    put(g, out, [x + i, y, z - 1], B.stairs("spruce", "north", "bottom"));
    put(g, out, [x + i, y, z + 1], B.stairs("spruce", "south", "bottom"));
  }
  put(g, out, [x, y + 1, z], B.trapdoor("spruce", "north", "top", false));
  return out;
}

/** 34. Work table: spruce_planks top along x for len at y; fence legs under both ends; crafting_table at the far end, white_carpet flour cloth between. */
export function workTable(g, x, y, z, len) {
  const out = [];
  for (let i = 0; i < len; i++) put(g, out, [x + i, y, z], B.block(SPRUCE_PLANKS));
  for (const lx of [x, x + len - 1]) put(g, out, [lx, y - 1, z], [SPRUCE_FENCE, fenceState(new Set(), [lx, y - 1, z])]);
  put(g, out, [x + len - 1, y + 1, z], B.block(CRAFTING_TABLE));
  for (let i = 1; i < len - 1; i++) put(g, out, [x + i, y + 1, z], B.block(WHITE_CARPET));
  return out;
}

/**
 * 35. Peel wall: a spruce_fence with a spruce_slab top on its head (the peel) at (x,y,z) facing `facing`; a grindstone
 * on the wall beside it and an open spruce_trapdoor flat on the wall on the other side.
 */
export function peelWall(g, x, y, z, facing) {
  const out = [];
  const side = facing === "north" || facing === "south" ? [1, 0, 0] : [0, 0, 1];
  put(g, out, [x, y, z], [SPRUCE_FENCE, fenceState(new Set(), [x, y, z])]);
  put(g, out, [x, y + 1, z], B.slab("spruce", "top"));
  put(g, out, [x + side[0], y, z + side[2]], [GRINDSTONE, { face: "wall", facing }]);
  put(g, out, [x - side[0], y, z - side[2]], B.trapdoor("spruce", OPPOSITE[facing], "top", true));
  return out;
}

/** 36. Tile stove (Kachelofen): 2x2 bricks at y..y+1, brick_slab top caps, a lit furnace on the front facing the room, a brick_stairs cap above it. */
export function tileStove(g, x, y, z, facing = "south") {
  const out = [];
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) {
    for (let dy = 0; dy <= 1; dy++) put(g, out, [x + dx, y + dy, z + dz], B.block(BRICKS));
    put(g, out, [x + dx, y + 2, z + dz], B.slab("brick", "top"));
  }
  const [dx, , dz] = DIRS[facing];
  const fx = x + (dx > 0 ? 2 : dx < 0 ? -1 : 0), fz = z + (dz > 0 ? 2 : dz < 0 ? -1 : 0);
  put(g, out, [fx, y, fz], [FURNACE, { facing, lit: "true" }]);
  put(g, out, [fx, y + 1, fz], B.stairs("brick", OPPOSITE[facing], "bottom"));
  return out;
}

/** 37. Table set: spruce_fence leg at (x,y,z), spruce_slab top at y+1; two spruce_stairs seats west and east of it, backs away from the table. */
export function tableSet(g, x, y, z) {
  const out = [];
  put(g, out, [x, y, z], [SPRUCE_FENCE, fenceState(new Set(), [x, y, z])]);
  put(g, out, [x, y + 1, z], B.slab("spruce", "top"));
  put(g, out, [x - 1, y, z], B.stairs("spruce", "west", "bottom"));
  put(g, out, [x + 1, y, z], B.stairs("spruce", "east", "bottom"));
  return out;
}

/** 38. Bed: red_bed with the head at (x,y,z)+facing against the wall and the foot at (x,y,z); a chest at the foot; a closed trapdoor on the foot. */
export function bedFrame(g, x, y, z, facing) {
  const out = [];
  const [dx, , dz] = DIRS[facing];
  put(g, out, [x, y, z], [RED_BED, { facing, part: "foot" }]);
  put(g, out, [x + dx, y, z + dz], [RED_BED, { facing, part: "head" }]);
  put(g, out, [x - dx, y, z - dz], B.block(CHEST));
  put(g, out, [x, y + 1, z], B.trapdoor("spruce", facing, "top", false));
  return out;
}

/**
 * 39. Shelf wall: bookshelf (h-1 rows) and a chiseled_bookshelf top row along axis from (x,y,z) for len, with the room side
 * `facing`; a lectern on the floor in front of the first cell.
 */
export function shelfWall(g, x, y, z, axis, len, h, facing = axis === "x" ? "south" : "east") {
  const out = [];
  for (let i = 0; i < len; i++) for (let dy = 0; dy < h; dy++) {
    const [px, pz] = axis === "x" ? [x + i, z] : [x, z + i];
    if (dy === h - 1) {
      const slots = Object.fromEntries([0, 1, 2, 3, 4, 5].map((s) => [`slot_${s}_occupied`, "true"]));
      put(g, out, [px, y + dy, pz], [CHISELED_BOOKSHELF, { facing, ...slots }]);
    } else put(g, out, [px, y + dy, pz], B.block(BOOKSHELF));
  }
  const [dx, , dz] = DIRS[facing];
  put(g, out, [x + dx, y, z + dz], [LECTERN, { facing }]);
  return out;
}

/** 40. Attic ladder: spruce_planks backing at (9, 7..10, 21) and a ladder facing north at (9, 7..11, 20). */
export function atticLadder(g) {
  const out = [];
  for (let y = ATTIC_LADDER.y0; y <= ATTIC_LADDER.y1 - 1; y++) put(g, out, [ATTIC_LADDER.x, y, ATTIC_LADDER.backingZ], B.block(SPRUCE_PLANKS));
  for (let y = ATTIC_LADDER.y0; y <= ATTIC_LADDER.y1; y++) put(g, out, [ATTIC_LADDER.x, y, ATTIC_LADDER.z], [LADDER, { facing: "north" }]);
  return out;
}

/**
 * 41. Stair housing: spruce_stairs (facing north, bottom) rising north from z=18 (y=2) to z=14 (y=6), two wide at x=7..8, with
 * spruce_planks under each step; spruce_fence rails at (9,7,14..17) and (7..8,7,18).
 */
export function stairHousing(g) {
  const out = [];
  for (let k = 0; k <= 4; k++) {
    const z = 18 - k, y = 2 + k;
    for (let x = STAIR_HOUSING.x0; x <= STAIR_HOUSING.x1; x++) {
      put(g, out, [x, y, z], B.stairs("spruce", "north", "bottom"));
      for (let fy = 1; fy < y; fy++) put(g, out, [x, fy, z], B.block(SPRUCE_PLANKS));
    }
  }
  const rails = new Set([...[14, 15, 16, 17].map((z) => `9,7,${z}`), "7,7,18", "8,7,18"]);
  for (const c of [[9, 7, 14], [9, 7, 15], [9, 7, 16], [9, 7, 17], [7, 7, 18], [8, 7, 18]]) put(g, out, c, [SPRUCE_FENCE, fenceState(rails, c)]);
  return out;
}
