// Hand-placed details from plan.md VOCABULARY: waterTable, windowHood, entablatureBand, towerBand, bellHang,
// chimneyStack, ladderShaft, lampPost. Each takes its position (and facing) as arguments, places blocks through the
// build library, and returns { placed, skipped }: skipped counts cells already built, which are left alone.
//
// Writes stay inside the footprint the caller gives, and only into air, unless opts.over is set: a flush dressing laid
// into a wall the shell already built (a band, an arch, the tower's cornice ring) needs { over: true }; a proud piece
// (a hood, a water table's stairs, the tower cornice's lips) and furniture stay air-only. Nothing is written below the
// y the caller gives, so ground, sand and floor are never touched. Leaves are persistent=true; a hanging light
// (bell) hangs from the block above it.
//
// Coordinates: x east, y up, z south. For a face (north/south/east/west), `plane` is the wall-plane coordinate
// (z for north and south, x for east and west), and `x0`/`x1` run along the face (x for north/south, z for east/west).
// "Proud" cells sit `proud` steps outward from the plane (north is −z).
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = "minecraft:air";
const tally = () => ({ placed: 0, skipped: 0 });

// Place one block, air-only unless over. Returns nothing; counts into t.
function put(g, [x, y, z], block, state, { over = false } = {}, t) {
  if (!over && !g.isAir(x, y, z)) { t.skipped++; return; }
  g.set(x, y, z, block, state);
  t.placed++;
}

// The cell at along-face coordinate s, y, pushed `proud` steps outward from the wall plane.
function at(face, plane, s, y, proud = 0) {
  const northSouth = face === "north" || face === "south";
  const p = northSouth ? [s, y, plane] : [plane, y, s];
  const n = northSouth ? 2 : 0;
  p[n] += proud * DIRS[face][n];
  return p;
}

/**
 * Plinth cap / water table: stone_bricks ring at y on the box x0..x1, z0..z1, with upside-down stone_brick_stairs proud
 * +1 on the north, west and east sides (their backs to the wall, so the lip reads).
 */
export function waterTable(g, { x0, x1, z0, z1, y = 3 }, opts = {}) {
  const t = tally();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x === x0 || x === x1 || z === z0 || z === z1) put(g, [x, y, z], "stone_bricks", undefined, opts, t);
  }
  const [stairs, state] = B.stairs("stone_brick", "south", "top");
  for (let x = x0; x <= x1; x++) put(g, [x, y, z0 - 1], stairs, state, opts, t);
  const [west, westState] = B.stairs("stone_brick", "east", "top");
  const [east, eastState] = B.stairs("stone_brick", "west", "top");
  for (let z = z0; z <= z1; z++) {
    put(g, [x0 - 1, y, z], west, westState, opts, t);
    put(g, [x1 + 1, y, z], east, eastState, opts, t);
  }
  return t;
}

/**
 * Hood over an upper window: upside-down quartz_stairs proud +1 across x0..x1 at y, backs into the wall.
 * face, plane: the wall the window is in (plane 10 for the front range, 9 for a pavilion).
 */
export function windowHood(g, { face, x0, x1, y, plane }, opts = {}) {
  const t = tally();
  const [block, state] = B.stairs("quartz", OPPOSITE[face], "top");
  for (let s = x0; s <= x1; s++) put(g, at(face, plane, s, y, 1), block, state, opts, t);
  return t;
}

/**
 * Entablature over a portico: smooth_quartz architrave at y, quartz_block frieze at y + 1, solid across x0..x1, z0..z1.
 */
export function entablatureBand(g, { x0, x1, z0, z1, y = 15 }, opts = {}) {
  const t = tally();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    put(g, [x, y, z], "smooth_quartz", undefined, opts, t);
    put(g, [x, y + 1, z], "quartz_block", undefined, opts, t);
  }
  return t;
}

/**
 * A quartz_block course round the clock tower shaft (the ring of the box x0..x1, z0..z1) at y. proud: upside-down
 * quartz_stairs one cell outside the ring on all four sides, the cornice's lip.
 */
export function towerBand(g, { x0, x1, z0, z1, y, proud = false }, opts = {}) {
  const t = tally();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x === x0 || x === x1 || z === z0 || z === z1) put(g, [x, y, z], "quartz_block", undefined, opts, t);
  }
  if (!proud) return t;
  const [north, northState] = B.stairs("quartz", "south", "top");
  const [south, southState] = B.stairs("quartz", "north", "top");
  const [west, westState] = B.stairs("quartz", "east", "top");
  const [east, eastState] = B.stairs("quartz", "west", "top");
  for (let x = x0; x <= x1; x++) {
    put(g, [x, y, z0 - 1], north, northState, opts, t);
    put(g, [x, y, z1 + 1], south, southState, opts, t);
  }
  for (let z = z0; z <= z1; z++) {
    put(g, [x0 - 1, y, z], west, westState, opts, t);
    put(g, [x1 + 1, y, z], east, eastState, opts, t);
  }
  return t;
}

/**
 * A bell hung from a ceiling attachment at (x, y, z), under a dark_oak_log beam at y + 1 three long along `axis`
 * (centred on the bell). Leaves y - 1 and below clear, so a 2-high lane stays under it.
 */
export function bellHang(g, { x, y, z, axis = "x", facing = "north" }, opts = {}) {
  const t = tally();
  put(g, [x, y, z], "bell", { attachment: "ceiling", facing }, opts, t);
  const [dx, dz] = axis === "x" ? [1, 0] : [0, 1];
  for (const k of [-1, 0, 1]) put(g, [x + k * dx, y + 1, z + k * dz], "dark_oak_log", { axis }, opts, t);
  return t;
}

/**
 * A 2x2 chimney stack at x0..x0+1, z0..z0+1: bricks from base to cap - 1, a deepslate_bricks band at cap - 2, a
 * stone_brick_slab cap at cap stepped out 1 on every side, and a lit campfire (not a signal fire) on the corner cell
 * (x0, z0) one above the cap.
 */
export function chimneyStack(g, { x0, z0, base = 1, cap = 23 }, opts = {}) {
  const t = tally();
  const band = cap - 2;
  for (let y = base; y < cap; y++) for (let x = x0; x <= x0 + 1; x++) for (let z = z0; z <= z0 + 1; z++) {
    if (y === band) put(g, [x, y, z], "deepslate_bricks", undefined, opts, t);
    else put(g, [x, y, z], "bricks", undefined, opts, t);
  }
  const [slab, slabState] = B.slab("stone_brick", "bottom");
  for (let x = x0 - 1; x <= x0 + 2; x++) for (let z = z0 - 1; z <= z0 + 2; z++) {
    put(g, [x, cap, z], slab, slabState, opts, t);
  }
  put(g, [x0, cap + 1, z0], "campfire", { lit: "true", facing: "north" }, opts, t);
  return t;
}

/**
 * A ladder up the column (x, z) from y0 to y1, facing `facing` (the wall it leans on is the opposite side). holes: the
 * floor y's to clear at this column first (the one exception to air-only: a floor left with a ladder hole).
 */
export function ladderShaft(g, { x, z, y0, y1, facing = "north", holes = [] }, opts = {}) {
  const t = tally();
  for (const y of holes) g.set(x, y, z, AIR);
  for (let y = y0; y <= y1; y++) put(g, [x, y, z], "ladder", { facing }, opts, t);
  return t;
}

/**
 * A lamp post on the column (x, z): stone_brick_wall base at y, dark_oak_fence at y + 1 and y + 2, a standing lantern
 * at y + 3 on the fence.
 */
export function lampPost(g, { x, z, y = 1 }, opts = {}) {
  const t = tally();
  put(g, [x, y, z], "stone_brick_wall", { up: "true" }, opts, t);
  const [fence, fenceState] = B.fence("dark_oak");
  put(g, [x, y + 1, z], fence, fenceState, opts, t);
  put(g, [x, y + 2, z], fence, fenceState, opts, t);
  const [lantern, lanternState] = B.lantern(false);
  put(g, [x, y + 3, z], lantern, lanternState, opts, t);
  return t;
}
