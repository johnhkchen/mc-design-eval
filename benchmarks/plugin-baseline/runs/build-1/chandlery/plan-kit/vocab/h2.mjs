// Helpers from plan.md VOCABULARY (h2 share): the stone quoin, the jetty bracket, the gable frame, the wall sign, the
// firebox, the hive stand, the apple tree and the dipping wheel. Each takes the grid first, then its position (and
// facing or axis where it has one) as arguments, and returns the [x, y, z] cells it wrote. Writes go only into air
// (g.isAir) unless opts.overwrite is true; a refused cell is skipped, not thrown. Nothing is written outside the
// footprint the helper is given, so no ground, sand or floor is touched. Block ids are plan.md's PALETTE literals.
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const HORIZONTAL = ["north", "south", "east", "west"];
// the wall run from a quoin's corner cell, for the long course
const RUN = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

function dirName(f) {
  if (!HORIZONTAL.includes(f)) throw new Error(`bad horizontal facing: ${f}`);
  return f;
}

// one cell, only into air unless opts.overwrite: anything already there (an earlier part's block) is left as it is
function put(g, out, opts, x, y, z, block, state, nbt) {
  if (!opts.overwrite && !g.isAir(x, y, z)) return;
  g.set(x, y, z, block, state, nbt);
  out.push([x, y, z]);
}

/**
 * A quoin at the corner cell (x, z): stone bricks alternating long and short up y0..y1. Even y is two blocks wide, the
 * corner cell and the one beside it one step along `side` (the run of the wall from the corner); odd y is the corner
 * cell alone.
 */
export function quoin(g, x, z, y0, y1, side, opts = {}) {
  const out = [], run = RUN[side];
  if (!run) throw new Error(`bad quoin side: ${side}`);
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
    put(g, out, opts, x, y, z, "stone_bricks");
    if (y % 2 === 0) put(g, out, opts, x + run[0], y, z + run[1], "stone_bricks");
  }
  return out;
}

/**
 * A jetty bracket: a dark oak stair upside down (half top) at (x, y, z), its back to the wall. `facing` is the
 * direction into the wall (south for the street front, where the bracket projects north over the pavement).
 */
export function jettyBracket(g, x, y, z, facing = "south", opts = {}) {
  const out = [];
  const [block, state] = B.stairs("dark_oak", dirName(facing), "top");
  put(g, out, opts, x, y, z, block, state);
  return out;
}

/**
 * A gable triangle on the plane x, cells z0..z1 by y0..y1 (inclusive). The triangle narrows one cell per row from each
 * side, as the 45 degree roof does, so row y spans z0+(y-y0)..z1-(y-y0). On it: a king post (stripped dark oak log,
 * axis y) on the centre line, a collar beam (stripped dark oak wood, axis z) across the triangle at collarY, a 1x1
 * glass pane at opts.window = {z, y} (default: two cells in front of the post, one row above the base; null for none),
 * and calcite in the rest. Members are planned first so none is overwritten by the calcite.
 */
export function gableFrame(g, x, z0, z1, y0, y1, opts = {}) {
  const out = [], lo = Math.min(z0, z1), hi = Math.max(z0, z1), b = Math.min(y0, y1), t = Math.max(y0, y1);
  const kingZ = opts.kingZ ?? Math.floor((lo + hi) / 2);
  const collarY = opts.collarY ?? b + 2;
  const win = opts.window === undefined ? { z: kingZ + 2, y: b + 1 } : opts.window;
  const span = (y) => [lo + (y - b), hi - (y - b)];
  const planned = new Map();
  const plan = (y, z, block, state) => {
    const k = `${y},${z}`;
    if (!planned.has(k)) planned.set(k, [y, z, block, state]);
  };
  for (let y = b; y <= t; y++) plan(y, kingZ, "stripped_dark_oak_log", { axis: "y" });
  const [cA, cB] = span(collarY);
  for (let z = cA; z <= cB; z++) plan(collarY, z, "stripped_dark_oak_wood", { axis: "z" });
  if (win) plan(win.y, win.z, "glass_pane", { north: "true", south: "true" });
  for (let y = b; y <= t; y++) {
    const [a, c] = span(y);
    for (let z = a; z <= c; z++) plan(y, z, "calcite");
  }
  for (const [y, z, block, state] of planned.values()) put(g, out, opts, x, y, z, block, state);
  return out;
}

/**
 * A dark oak wall sign at (x, y, z) pointing out toward `facing`, with `text` on its front (lines split on newlines,
 * four at most). A wall sign hangs on the block behind it, the cell opposite `facing`; with air there it is not placed.
 */
export function wallSign(g, x, y, z, text, facing = "north", opts = {}) {
  const out = [], f = dirName(facing), [dx, , dz] = DIRS[f];
  if (g.isAir(x - dx, y, z - dz)) return out;
  const lines = String(text).split("\n").slice(0, 4);
  const [block, state, nbt] = B.sign("dark_oak", lines, { wall: true, facing: f, dataVersion: g.dataVersion });
  put(g, out, opts, x, y, z, block, state, nbt);
  return out;
}

/**
 * A firebox into a stack: a two-wide mouth at (x, z) with its second cell across the width, two deep along +axis
 * (into the stack). Lit campfires on the back row at y, and a stripped dark oak lintel over the mouth at y+2, running
 * across the width. The mouth and the back cells between floor and lintel stay air. The stone floor under them is the
 * shell's (the rule is no floor written under a part), so it is not written here.
 */
export function firebox(g, x, y, z, axis, opts = {}) {
  if (axis !== "x" && axis !== "z") throw new Error(`bad firebox axis: ${axis}`);
  const out = [];
  const depth = axis === "x" ? [1, 0] : [0, 1], width = axis === "x" ? [0, 1] : [1, 0];
  const at = (i, j) => [x + depth[0] * i + width[0] * j, z + depth[1] * i + width[1] * j];   // i: 0 mouth, 1 back; j: 0..1
  const facing = axis === "x" ? "west" : "north";   // campfire faces back out through the mouth
  const lintelAxis = axis === "x" ? "z" : "x";
  for (let j = 0; j < 2; j++) {
    const [bx, bz] = at(1, j), [mx, mz] = at(0, j);
    put(g, out, opts, bx, y, bz, "campfire", { facing, lit: "true" });
    put(g, out, opts, mx, y + 2, mz, "stripped_dark_oak_wood", { axis: lintelAxis });
  }
  return out;
}

/**
 * A beehive on the ground at (x, y, z), facing `facing` (north in the yard), empty, with an oxeye daisy on the cell east
 * of it. The ground under it is not written.
 */
export function hiveStand(g, x, y, z, facing = "north", opts = {}) {
  const out = [];
  put(g, out, opts, x, y, z, "beehive", { facing: dirName(facing), honey_level: "0" });
  put(g, out, opts, x + 1, y, z, "oxeye_daisy");
  return out;
}

/**
 * An apple tree whose trunk stands on (x, y, z): four oak log cells up, then a crown of four layers from the trunk top,
 * radius 2 in the two lower layers and 1 above, the corners of the wide layers cut. A fixed pattern drops some leaves,
 * so the crown is uneven. Leaves are persistent, so they never decay. Only air is written.
 */
export function appleTree(g, x, y, z, opts = {}) {
  const out = [];
  for (let dy = 0; dy < 4; dy++) put(g, out, opts, x, y + dy, z, "oak_log", { axis: "y" });
  const radius = [2, 2, 1, 1];
  radius.forEach((r, i) => {
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (dx * dx + dz * dz > r * r + (r === 2 ? 1 : 0)) continue;
      if (((dx + 2) * 3 + (dz + 2) * 5 + i) % 4 === 0) continue;
      put(g, out, opts, x + dx, y + 3 + i, z + dz, "oak_leaves", { persistent: "true" });
    }
  });
  return out;
}

/**
 * A candle-dipping wheel standing on the floor at (x, y, z): a dark oak fence post, and a crossbar of dark oak fences
 * from x-2 to x+2 at y+1 (joined along the bar). Iron chains hang from the bar at x-1 and x+1, and a three-candle lit
 * cluster stands on the bar at x-2, x and x+2, at y+2. The candles stand on the bar, since a candle cannot hang. The
 * footprint is five wide, three high and one deep, so the cells either side along z stay clear for a 2-high lane.
 * The workshop is seven wide (x 6..12), so x 8..10 fits it.
 */
export function dippingWheel(g, x, y, z, opts = {}) {
  const out = [];
  put(g, out, opts, x, y, z, "dark_oak_fence");
  for (let dx = -2; dx <= 2; dx++) {
    const state = {};
    if (dx < 2) state.east = "true";
    if (dx > -2) state.west = "true";
    put(g, out, opts, x + dx, y + 1, z, "dark_oak_fence", state);
  }
  for (const dx of [-1, 1]) put(g, out, opts, x + dx, y, z, "iron_chain", { axis: "y" });
  for (const dx of [-2, 0, 2]) put(g, out, opts, x + dx, y + 2, z, "candle", { candles: "3", lit: "true" });
  return out;
}
