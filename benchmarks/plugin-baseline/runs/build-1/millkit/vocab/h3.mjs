// Mill village kit, plan.md VOCABULARY (H3 set): fence_line, porch, window, chimney, channel, coop, tree, store_sign.
// Coordinates are plan.md's: ground surface y 0, x and z as the caller passes them. Every helper writes only into air
// inside its own footprint, so an earlier part's cells are never overwritten. The one exception is channel(), which cuts
// the water into the ground it sits in (its footprint only).
import { B, bannerWord, signboard } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = /(^|:)(cave_|void_)?air$/;
const SIDES = ["north", "east", "south", "west"];

/** One write, only into air inside the grid. Returns 1 when it placed the block, 0 when it left the cell alone. */
function put(g, x, y, z, block, state) {
  if (!g.inBounds(x, y, z) || !AIR.test(g.blockAt(x, y, z))) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

/** Fence and pane connection states for the sides that connect (the toolkit's fence/pane shape). */
const connect = (dirs) => Object.fromEntries([...SIDES.map((d) => [d, String(dirs.includes(d))]), ["waterlogged", "false"]]);

/** A straight fence run at x from z0 to z1 (either order) on y 1; each fence connects to its neighbours in the run. */
export function fence_line(g, x, z0, z1, block) {
  const a = Math.min(z0, z1), b = Math.max(z0, z1);
  let n = 0;
  for (let z = a; z <= b; z++) {
    const dirs = [...(z > a ? ["north"] : []), ...(z < b ? ["south"] : [])];
    n += put(g, x, 1, z, block, connect(dirs));
  }
  return n;
}

/**
 * A porch on the front of a house: deck y 2 over z 7..8 from x0 to x1; posts y 3..5 at z 7 (post = { block, xs }, a
 * stripped log and the x of each post; a bare block id puts posts at x0 and x1); a rail fence y 3 along z 7 except at
 * `gaps`; and a step (stairs facing south, y 1, z 6) in each gap. The stairs take the deck's wood (oak_planks -> oak_stairs).
 */
export function porch(g, x0, x1, deck, post, rail, gaps = []) {
  const wood = deck.replace(/_planks$/, ""), P = typeof post === "string" ? { block: post, xs: [x0, x1] } : post;
  let n = 0;
  for (let x = x0; x <= x1; x++) for (const z of [7, 8]) n += put(g, x, 2, z, deck);
  for (const x of P.xs) for (let y = 3; y <= 5; y++) n += put(g, x, y, 7, P.block, { axis: "y" });
  const run = [];
  for (let x = x0; x <= x1; x++) if (!gaps.includes(x)) run.push(x);
  for (const x of run) {
    const dirs = [...(run.includes(x - 1) || P.xs.includes(x - 1) ? ["west"] : []), ...(run.includes(x + 1) || P.xs.includes(x + 1) ? ["east"] : [])];
    n += put(g, x, 3, 7, rail, connect(dirs));
  }
  for (const x of gaps) n += put(g, x, 1, 6, ...B.stairs(wood, "south"));
  return n;
}

/**
 * A window in an outside wall: w by h glass_pane, connected along the wall. (x, y, z) is the wall cell at the window's
 * bottom-left, seen from outside; face is the way the wall looks (north/south: the window runs along x; east/west: along z).
 * A top slab of `${wood}` sits under it and a stripped log lintel over it. Those two rows are only placed where the wall
 * is air: a closed wall keeps its own sill and head plate, so only the panes go in.
 */
export function window(g, x, y, z, face, w = 1, h = 2, wood = "birch") {
  const along = face === "north" || face === "south" ? "x" : "z";
  const at = (i, dy) => (along === "x" ? [x + i, y + dy, z] : [x, y + dy, z + i]);
  const dirs = along === "x" ? ["east", "west"] : ["north", "south"];
  let n = 0;
  for (let i = 0; i < w; i++) {
    for (let dy = 0; dy < h; dy++) n += put(g, ...at(i, dy), "glass_pane", connect(dirs));
    n += put(g, ...at(i, -1), `${wood}_slab`, { type: "top", waterlogged: "false" });
    n += put(g, ...at(i, h), `stripped_${wood}_log`, { axis: along });
  }
  return n;
}

/**
 * A brick chimney stack, 2x2 at x..x+1, z..z+1, from y 1. Bricks up to `height`, with a deepslate_bricks band at row
 * `band`; a ring of upside-down brick_stairs steps out at `height`; a brick_slab cap at capY (must be height + 1) with
 * a hay_block in the corner; a lit campfire (signal_fire) on the hay at capY + 1.
 */
export function chimney(g, x, z, height, band, capY) {
  if (capY !== height + 1) throw new RangeError(`chimney: capY ${capY} must be height + 1 (${height + 1})`);
  let n = 0;
  for (let y = 1; y <= height; y++) for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++)
    n += put(g, x + dx, y, z + dz, y === band ? "deepslate_bricks" : "bricks");
  for (let dx = -1; dx <= 2; dx++) for (let dz = -1; dz <= 2; dz++) {
    if (dx >= 0 && dx <= 1 && dz >= 0 && dz <= 1) continue;
    // the lip points out: facing = the direction into the wall (north and south rows take the corners)
    const facing = dz === -1 ? "south" : dz === 2 ? "north" : dx === -1 ? "east" : "west";
    n += put(g, x + dx, height, z + dz, ...B.stairs("brick", facing, "top"));
  }
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) {
    n += dx === 0 && dz === 0
      ? put(g, x, capY, z, "hay_block", { axis: "y" })
      : put(g, x + dx, capY, z + dz, "brick_slab", { type: "bottom", waterlogged: "false" });
  }
  return n + put(g, x, capY + 1, z, "campfire", { facing: "north", lit: "true", signal_fire: "true", waterlogged: "false" });
}

/**
 * A water channel across x0..x1 at row z: water at row y (a source, level 0) over a stone bed at y - 1. This is the one
 * helper that cuts: it replaces the ground in its own footprint and nothing beside it. Stone banks are not laid, because
 * the beds either side of the plan's channel are farmland. The bed is skipped where the grid has no row below y.
 */
export function channel(g, x0, x1, z, y = 0) {
  let n = 0;
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    if (g.inBounds(x, y - 1, z)) { g.set(x, y - 1, z, "stone"); n++; }
    if (g.inBounds(x, y, z)) { g.set(x, y, z, "water", { level: "0" }); n++; }
  }
  return n;
}

/**
 * A shade tree on (x, z): an oak_log trunk (axis y) from y 1 to y h, and a crown of persistent oak_leaves five layers
 * deep from y h-1 to y h+3, two out from the trunk on each side, corners dropped so it reads ragged. The trunk and crown
 * only fill air.
 */
export function tree(g, x, z, h) {
  let n = 0;
  for (let y = 1; y <= h; y++) n += put(g, x, y, z, "oak_log", { axis: "y" });
  const base = h - 1, leaf = { persistent: "true", distance: "1", waterlogged: "false" };
  for (let dy = 0; dy <= 4; dy++) {
    const r = dy <= 1 ? 2 : dy <= 3 ? 1 : 0;
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (r > 0 && Math.abs(dx) === r && Math.abs(dz) === r) continue;
      n += put(g, x + dx, base + dy, z + dz, "oak_leaves", leaf);
    }
  }
  return n;
}

/**
 * A worker's coop, footprint x0..x0+5 by z0..z0+4, floor y 1, walls y 2..4 (spruce planks, stripped spruce corners) on
 * cobblestone corner piers. North face: a chicken door (open trapdoor, x0+1, y 2), a keeper door (x0+3, y 2..3) and a
 * vent (open trapdoor, x0+4, y 3). Inside on the back row (z0+3): hay_block and barrels (facing up) alternate along y 2.
 * The roof is the roof part's.
 */
export function coop(g, x0, z0) {
  const x1 = x0 + 5, z1 = z0 + 4;
  let n = 0;
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) n += put(g, x, 1, z, "cobblestone");
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) n += put(g, x, 1, z, "spruce_planks");
  // openings before the walls, so the walls leave them air
  n += put(g, x0 + 1, 2, z0, ...B.trapdoor("spruce", "north", "bottom", true));
  n += put(g, x0 + 3, 2, z0, ...B.door("spruce", "north", "lower", "left"));
  n += put(g, x0 + 3, 3, z0, ...B.door("spruce", "north", "upper", "left"));
  n += put(g, x0 + 4, 3, z0, ...B.trapdoor("spruce", "north", "bottom", true));
  for (let y = 2; y <= 4; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x > x0 && x < x1 && z > z0 && z < z1) continue;
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    n += corner ? put(g, x, y, z, "stripped_spruce_log", { axis: "y" }) : put(g, x, y, z, "spruce_planks");
  }
  for (let x = x0 + 1; x <= x1 - 1; x++) {
    n += put(g, x, 2, z1 - 1, x % 2 === 0 ? "hay_block" : "barrel", x % 2 === 0 ? { axis: "y" } : { facing: "up", open: "false" });
  }
  return n;
}

/**
 * The company store's sign: STORE in banner letters on the false front (bannerWord: `center` is the middle letter, face
 * the way it looks) and, when `sign` is given, the hanging board (MILL CO) at that anchor under the porch roof.
 * Returns the number of blocks placed.
 */
export function store_sign(g, { center, face = "north", sign = null, banner = "STORE", board = "MILL CO" }) {
  const letters = bannerWord(g, banner, { center, face, letter: "black", base: "white" });
  const hung = sign ? signboard(g, board, { at: sign, face, mode: "hanging", width: 2, wood: "dark_oak" }).cells : 0;
  return letters + hung;
}
