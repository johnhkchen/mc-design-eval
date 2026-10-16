// Vocabulary helpers, set 3: fence runs, shingles, shutters, steps, a hearth face, a chair, a hanging lantern,
// a wagon, a picnic table and a cornice. Absolute coordinates; the caller applies the plot offset (12 * i).
// Every helper writes only into air (a cell that is not air is skipped, never overwritten) and returns how many
// blocks it placed. States are written exactly as `mcd states` lists them for 26.x (no waterlogged keys on these).
import { DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

/** Place one block only if its cell is inside the grid and is air. Returns true when placed. */
const put = (g, x, y, z, block, state) => {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
};

const LINK = { north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0] };

/** Set the connection states of fences and walls we placed, from their neighbours in the grid at this moment. */
function relink(g, cells) {
  for (const [x, y, z] of cells) {
    const b = g.blockAt(x, y, z);
    if (/_fence$/.test(b)) {
      const s = {};
      for (const [d, [dx, dy, dz]] of Object.entries(LINK)) s[d] = /_fence$|_fence_gate$/.test(g.blockAt(x + dx, y + dy, z + dz));
      g.set(x, y, z, b, s);
    } else if (/_wall$/.test(b)) {
      const s = { up: "true" };
      for (const [d, [dx, dy, dz]] of Object.entries(LINK)) s[d] = /_wall$|_fence_gate$/.test(g.blockAt(x + dx, y + dy, z + dz)) ? "low" : "none";
      g.set(x, y, z, b, s);
    }
  }
}

/**
 * Plot fences: side columns at x0 and x0 + 11 (z 5..18), a front picket at z 5 of `wood` (a fence or brick_wall)
 * with a 2-wide gate at gateX..gateX+1, and a back line at z 18. x0 = the plot's west x (12 * i). `gate` is the wood
 * of the gate. `open` = [[xa, xb], ...] spans of the back line left clear for a stack. All at y 1.
 */
export function fence_run(g, x0, wood, gateX, { gate = "spruce", open = [] } = {}) {
  const x1 = x0 + 11, placed = [];
  const set = (x, y, z, block, state) => { if (put(g, x, y, z, block, state)) placed.push([x, y, z]); };
  const gap = (x) => x === gateX || x === gateX + 1;
  for (let z = 5; z <= 18; z++) { set(x0, 1, z, "spruce_fence"); set(x1, 1, z, "spruce_fence"); }
  for (let x = x0 + 1; x < x1; x++) {
    if (!gap(x)) set(x, 1, 5, wood);
    if (!open.some(([a, b]) => x >= a && x <= b)) set(x, 1, 18, "spruce_fence");
  }
  for (const x of [gateX, gateX + 1]) set(x, 1, 5, `${gate}_fence_gate`, { facing: "north", in_wall: "false", open: "false" });
  relink(g, placed);
  return placed.length;
}

/**
 * Fishscale shingles over the box [x0, y0, z0, x1, y1, z1]: each row alternates between a full course of block `a`
 * (e.g. birch_planks) and a top-slab course of `b` (e.g. birch_slab), starting with the full course at y0.
 */
export function fishscale(g, [x0, y0, z0, x1, y1, z1], a, b) {
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    n += (y - y0) % 2 === 0 ? put(g, x, y, z, a) : put(g, x, y, z, b, { type: "top" });
  }
  return n;
}

/**
 * A window shutter: an open trapdoor in the cell at [x, y, z] (one cell out from the wall), hinged on the `facing`
 * side so it lies flat against the wall behind it. `height` cells stacked upward from y.
 */
export function shutter(g, [x, y, z], facing, wood = "spruce", { height = 1 } = {}) {
  let n = 0;
  for (let i = 0; i < height; i++) n += put(g, x, y + i, z, `${wood}_trapdoor`, { facing, half: "bottom", open: "true" }) ? 1 : 0;
  return n;
}

/**
 * Front steps at y 1 from x0 to x1 on row z, one stair per cell, facing south (the full back toward the deck, the
 * walk up from the lane runs north to south). `material` is the wood of the stairs.
 */
export function front_steps(g, x0, x1, z, { material = "dark_oak" } = {}) {
  let n = 0;
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    n += put(g, x, 1, z, `${material}_stairs`, { facing: "south", half: "bottom", shape: "straight" }) ? 1 : 0;
  }
  return n;
}

/**
 * A hearth face set into a wall at mouth [x, y, z]: stone_bricks around the mouth (3 wide, 2 high, the mouth cell
 * itself left as it is), an upside-down stone-brick stair lintel over it, and a top brick slab in front of it in the
 * room. facing = the way the mouth looks, into the room (north for a hearth on a back wall at the south of its room).
 */
export function hearth_face(g, x, y, z, facing) {
  const [dx, , dz] = DIRS[facing];
  const [ax, az] = dz !== 0 ? [1, 0] : [0, 1];
  let n = 0;
  for (const s of [-1, 1]) for (const dy of [0, 1]) n += put(g, x + ax * s, y + dy, z + az * s, "stone_bricks") ? 1 : 0;
  n += put(g, x, y + 1, z, "stone_brick_stairs", { facing: OPPOSITE[facing], half: "top", shape: "straight" }) ? 1 : 0;
  n += put(g, x + dx, y, z + dz, "brick_slab", { type: "top" }) ? 1 : 0;
  return n;
}

/**
 * A spruce stair chair at [x, y, z] for a sitter facing `facing` (toward the table). The stair's full back is on the
 * far side, so its facing is the opposite of the sitter's. Leave the two cells in front of it clear at y+1..y+2.
 */
export function chair(g, x, y, z, facing) {
  return put(g, x, y, z, "spruce_stairs", { facing: OPPOSITE[facing], half: "bottom", shape: "straight" }) ? 1 : 0;
}

/**
 * A lantern hanging at [x, y, z]. If the cell above is solid it hangs from it; otherwise iron chain runs up from the
 * lantern to the first solid block within `reach` cells. Places nothing (returns 0) when there is no ceiling to hang
 * from or the lantern cell is not air.
 */
export function hanging_lantern(g, x, y, z, { reach = 4 } = {}) {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return 0;
  let k = 1;
  while (k <= reach && g.isAir(x, y + k, z)) k++;
  if (k > reach) return 0;
  let n = 0;
  for (let i = 1; i < k; i++) n += put(g, x, y + i, z, "iron_chain", { axis: "y" }) ? 1 : 0;
  return n + (put(g, x, y, z, "lantern", { hanging: "true" }) ? 1 : 0);
}

/**
 * A wagon at x (two cells wide, x..x+1) with its bed four long from z to z+3: a spruce slab top bed at y 2, four
 * open dark-oak trapdoor wheels under the corners at y 1, and a spruce fence tongue at the front end (z-1 when dir is
 * north, z+4 when dir is south).
 */
export function wagon(g, x, z, dir = "north", { wood = "spruce", wheel = "dark_oak" } = {}) {
  const placed = [];
  const set = (x, y, z, block, state) => { if (put(g, x, y, z, block, state)) placed.push([x, y, z]); };
  for (let dz = 0; dz <= 3; dz++) for (let dx = 0; dx <= 1; dx++) set(x + dx, 2, z + dz, `${wood}_slab`, { type: "top" });
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 3], [1, 3]]) set(x + dx, 1, z + dz, `${wheel}_trapdoor`, { facing: "east", half: "bottom", open: "true" });
  set(x, 1, dir === "south" ? z + 4 : z - 1, `${wood}_fence`);
  relink(g, placed);
  return placed.length;
}

/**
 * A picnic table: a top slab on spruce fence legs at x0 and x1, row z, with a spruce stair bench on each long side
 * (z-1 facing north, z+1 facing south) so each bench's back is away from the table. Slab top at y 2, legs and
 * benches at y 1.
 */
export function picnic_table(g, x0, x1, z) {
  let n = 0;
  const legs = [];
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    n += put(g, x, 2, z, "spruce_slab", { type: "top" }) ? 1 : 0;
    n += put(g, x, 1, z - 1, "spruce_stairs", { facing: "north", half: "bottom", shape: "straight" }) ? 1 : 0;
    n += put(g, x, 1, z + 1, "spruce_stairs", { facing: "south", half: "bottom", shape: "straight" }) ? 1 : 0;
  }
  for (const x of [x0, x1]) if (put(g, x, 1, z, "spruce_fence")) { legs.push([x, 1, z]); n++; }
  relink(g, legs);
  return n;
}

/**
 * A cornice under an eave on row z from x0 to x1 at height y: upside-down stone-brick stairs whose lip points out
 * (out = the street side, north for a north front), so each stair's back is into the wall.
 */
export function cornice(g, x0, x1, z, y, { out = "north", material = "stone_brick" } = {}) {
  let n = 0;
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    n += put(g, x, y, z, `${material}_stairs`, { facing: OPPOSITE[out], half: "top", shape: "straight" }) ? 1 : 0;
  }
  return n;
}
