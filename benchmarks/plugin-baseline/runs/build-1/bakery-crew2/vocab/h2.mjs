// Vocabulary helpers, set 2 (plan.md VOCABULARY): frame, openings, oven chimney, yard and furniture.
// Every helper takes the grid (or runParts view) first, then its position and facing as arguments: nothing is
// hard-wired to a spot. It writes only into AIR (an earlier part owns every other cell, the ground included) and
// returns the [x, y, z] cells it wrote. Exceptions are named options (wheatPatch ground). Coordinates: x east,
// y up, z south; the street is at z < 0, so "south" faces the building from the street.
// Furniture footprints sit inside the room boxes of plan.md ROOMS; the caller keeps the 2-high lane past them clear.
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// one cell, only into air: anything already there (an earlier part's block, the ground) is left as it is
function put(g, out, x, y, z, block, state, nbt) {
  if (!g.isAir(x, y, z)) return;
  g.set(x, y, z, block, state, nbt);
  out.push([x, y, z]);
}
// one cell, replacing whatever is there (only for the ground row when a helper's option says so)
function putOver(g, out, x, y, z, block, state, nbt) {
  g.set(x, y, z, block, state, nbt);
  out.push([x, y, z]);
}
// inclusive integer range, either order
const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

// ---- frame and walls --------------------------------------------------------------------------------------------

/** Vertical stripped spruce post at (x, y0..y1, z), axis y. */
export function postRun(g, x, y0, y1, z) {
  const out = [];
  for (const y of span(y0, y1)) put(g, out, x, y, z, ...B.log("stripped_spruce", "y"));
  return out;
}

/**
 * Deepslate wall, a run from a0 to a1 along `axis` (x: the wall lies along x at z = fixed; z: at x = fixed), y0..y1.
 * plinth: the row y0 is polished_deepslate, the rest deepslate_bricks. piers: positions along the wall that stay
 * solid even inside an opening. openings: [a0, a1, ya, yb] boxes left unset (air) for windows and doors.
 */
export function masonryWall(g, axis, fixed, a0, a1, y0, y1, { plinth = true, piers = [], openings = [] } = {}) {
  const out = [];
  for (const a of span(a0, a1)) for (const y of span(y0, y1)) {
    const inOpening = openings.some(([p0, p1, q0, q1]) => a >= Math.min(p0, p1) && a <= Math.max(p0, p1) && y >= Math.min(q0, q1) && y <= Math.max(q0, q1));
    if (inOpening && !piers.includes(a)) continue;
    const block = plinth && y === y0 ? "polished_deepslate" : "deepslate_bricks";
    const [x, z] = axis === "x" ? [a, fixed] : [fixed, a];
    put(g, out, x, y, z, block, {});
  }
  return out;
}

// ---- shop front -------------------------------------------------------------------------------------------------

/**
 * Shop window on a front wall at z, x0..x1: the breast row at y (deepslate_bricks), glass two rows above it
 * (y+1..y+2) with the connections running along the wall, and a spruce_slab counter on the street side (z-1) at y.
 */
export function shopWindow(g, x0, x1, y, z) {
  const out = [];
  for (const x of span(x0, x1)) {
    put(g, out, x, y, z, "deepslate_bricks", {});
    put(g, out, x, y, z - 1, ...B.slab("spruce", "top"));
    for (const yy of [y + 1, y + 2]) put(g, out, x, yy, z, "glass_pane", { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" });
  }
  return out;
}

/**
 * The front step at (x, y, z): cobbled_deepslate_stairs with `facing` = the side of its full-height back (pass
 * "south" for a front on the north: the low side points at the street), and bottom slabs on both sides of it, along the wall.
 */
export function frontStep(g, x, y, z, facing) {
  const out = [];
  put(g, out, x, y, z, ...B.stairs("cobbled_deepslate", facing, "bottom"));
  const [dx, dz] = facing === "north" || facing === "south" ? [1, 0] : [0, 1];
  for (const s of [-1, 1]) put(g, out, x + s * dx, y, z + s * dz, ...B.slab("cobbled_deepslate", "bottom"));
  return out;
}

// ---- roof, hoist and loft ---------------------------------------------------------------------------------------

/**
 * Flour-loft hoist on the front gable: beam at (x, y, zWall-3..zWall) along z; iron chain under its far end, a barrel
 * (facing up) hung from the chain, and two shutters (x±1, y-4..y-3, at zWall-1) open flat against the gable wall.
 */
export function hoistAssembly(g, x, y, zWall) {
  const out = [], far = zWall - 3;
  for (const z of span(far, zWall)) put(g, out, x, y, z, ...B.log("stripped_spruce", "z"));
  for (const yy of [y - 1, y - 2]) put(g, out, x, yy, far, ...B.chain("y"));
  put(g, out, x, y - 3, far, "barrel", { facing: "up", open: "false" });
  for (const dx of [-1, 1]) for (const yy of [y - 4, y - 3]) put(g, out, x + dx, yy, zWall - 1, ...B.trapdoor("spruce", "south", "bottom", true));
  return out;
}

// ---- oven chimney -----------------------------------------------------------------------------------------------

/**
 * A 2x2 brick chimney on the columns x0..x0+1, z0..z0+1, from y0 up to the top ring at y1. The corner (x0, z0) is the
 * flue, left air below the top; the course at `band` is deepslate_bricks; the top ring is brick_slab (top) round
 * a lit campfire in the flue's mouth (x0, y1, z0).
 */
export function chimneyStack(g, x0, z0, y0, y1, band) {
  const out = [];
  for (let y = y0; y < y1; y++) for (const x of [x0, x0 + 1]) for (const z of [z0, z0 + 1]) {
    if (x === x0 && z === z0) continue;                                  // the flue
    put(g, out, x, y, z, y === band ? "deepslate_bricks" : "bricks", {});
  }
  for (const x of [x0, x0 + 1]) for (const z of [z0, z0 + 1]) {
    if (x === x0 && z === z0) put(g, out, x, y1, z, "campfire", { facing: "north", lit: "true" });
    else put(g, out, x, y1, z, ...B.slab("brick", "top"));
  }
  return out;
}

// ---- yard -------------------------------------------------------------------------------------------------------

/**
 * A wheat patch over x0..x1, z0..z1 at ground row y: coarse_dirt edge ring, farmland (moisture 7) inside, wheat
 * above it (age 7, every fourth cell 5). The ground row is grass from part 1, so by default nothing is written there
 * and no wheat is placed without its farmland. { ground: true } lets the patch replace the ground row (the yard's own).
 */
export function wheatPatch(g, x0, x1, z0, z1, { ground = false, y = 0 } = {}) {
  const out = [], write = ground ? putOver : put;
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (edge) { write(g, out, x, y, z, "coarse_dirt", {}); continue; }
    write(g, out, x, y, z, "farmland", { moisture: "7" });
    if (g.blockAt(x, y, z) !== "minecraft:farmland") continue;          // the ground refused it: no crop without soil
    put(g, out, x, y + 1, z, "wheat", { age: (x * 5 + z * 3) % 4 === 0 ? "5" : "7" });
  }
  return out;
}

// ---- furniture (plan.md ROOMS) ----------------------------------------------------------------------------------

/**
 * Shop counter along x0..x1 at (y, z): a row of spruce_planks (the body) with a cake on every other cell and a
 * candle_cake between, on the planks at y+1. Shop room: [7,2,10,15,5,15]; counter at y=2, z=14.
 */
export function shopCounter(g, x0, x1, y, z) {
  const out = [];
  for (const x of span(x0, x1)) {
    put(g, out, x, y, z, "spruce_planks", {});
    if ((x - x0) % 2 === 0) put(g, out, x, y + 1, z, "cake", { bites: "0" });
    else put(g, out, x, y + 1, z, "candle_cake", { lit: "false" });
  }
  return out;
}

/**
 * A baker's work table along x, x..x+len-1 at (y, z): spruce_planks top row at y, a crafting_table on the west end
 * at y+1, and a white_carpet flour cloth on the middle cells at y+1. Backstube room: [7,2,17,15,5,21]; y=2.
 */
export function workTable(g, x, y, z, len) {
  const out = [];
  for (const xx of span(x, x + len - 1)) put(g, out, xx, y, z, "spruce_planks", {});
  put(g, out, x, y + 1, z, "crafting_table", {});
  for (const xx of span(x + 1, x + len - 2)) put(g, out, xx, y + 1, z, "white_carpet", {});
  return out;
}

/**
 * A bed with its head at (x, y, z) against the wall it faces; `facing` points from the foot to the head (vanilla),
 * so pass the wall's side. Foot one cell away from the wall, chest one further out at the foot. Bedroom:
 * [9,7,15,15,10,21]; y=7 (walk level). The closed trapdoor of the plan has no free cell at the foot and is not placed.
 */
export function bedFrame(g, x, y, z, facing) {
  const out = [], [dx, , dz] = DIRS[facing];
  const fx = x - dx, fz = z - dz, cx = fx - dx, cz = fz - dz;
  put(g, out, x, y, z, "red_bed", { facing, part: "head" });
  put(g, out, fx, y, fz, "red_bed", { facing, part: "foot" });
  put(g, out, cx, y, cz, "chest", {});
  return out;
}
