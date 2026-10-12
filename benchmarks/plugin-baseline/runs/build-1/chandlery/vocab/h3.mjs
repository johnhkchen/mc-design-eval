// Helpers from plan.md VOCABULARY (h3 share): the shop bay window, the calcite frame panel, the window box, candle
// clusters, the drying lean-to bay, the picket fence, the shop counter and a bed. Each takes the grid first, then its
// position (and facing or axis where it has one) as arguments, and returns the [x, y, z] cells it wrote. Writes go only
// into air (g.isAir) unless opts.overwrite is true; a refused cell is skipped, not thrown. Nothing is written outside
// the footprint the helper is given, so no ground, sand or floor is touched. Block ids are plan.md's PALETTE literals.
import { DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LONG = { n: "north", s: "south", e: "east", w: "west" };
const HORIZONTAL = ["north", "south", "east", "west"];
const CANDLES = ["candle", "white_candle", "yellow_candle"];
const BEDS = ["white", "red"];

function dirName(d) {
  const f = LONG[d] ?? d;
  if (!HORIZONTAL.includes(f)) throw new Error(`bad horizontal facing: ${d}`);
  return f;
}

// one cell, only into air unless opts.overwrite: anything already there (an earlier part's block) is left as it is
function put(g, out, opts, x, y, z, block, state) {
  if (!opts.overwrite && !g.isAir(x, y, z)) return;
  g.set(x, y, z, block, state);
  out.push([x, y, z]);
}

/**
 * The shop bay: a brick sill row at y across x0..x1 on the plane z, posts at x0 and x1 rising y+1..y+3, glass panes
 * between them (connected east and west), a dark oak fascia at y+4. The wall behind the bay (z+1) is left as it is.
 */
export function bayWindow(g, x0, x1, y, z, opts = {}) {
  const out = [], a = Math.min(x0, x1), b = Math.max(x0, x1);
  for (let x = a; x <= b; x++) {
    put(g, out, opts, x, y, z, "stone_bricks");
    put(g, out, opts, x, y + 4, z, "dark_oak_planks");
  }
  for (const x of [a, b]) for (let dy = 1; dy <= 3; dy++) put(g, out, opts, x, y + dy, z, "stripped_dark_oak_log", { axis: "y" });
  for (let x = a + 1; x < b; x++) for (let dy = 1; dy <= 3; dy++)
    put(g, out, opts, x, y + dy, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true" });
  return out;
}

/**
 * A calcite infill panel in the plane z, cells x0..x1 by y0..y1. opts.hole = [x0, y0, x1, y1] (inclusive) is left
 * as air for a window; the glazing part fills it.
 */
export function framePanel(g, x0, x1, y0, y1, z, opts = {}) {
  const out = [], hole = opts.hole ?? null;
  const inHole = (x, y) => hole && x >= hole[0] && x <= hole[2] && y >= hole[1] && y <= hole[3];
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      if (!inHole(x, y)) put(g, out, opts, x, y, z, "calcite");
  return out;
}

/**
 * A window box on the sill row y across x0..x1 at plane z: dark oak top slabs, a pot on each cell above (potted
 * poppy on the first, dandelion on the next, alternating).
 */
export function windowBox(g, x0, x1, y, z, opts = {}) {
  const out = [], a = Math.min(x0, x1), b = Math.max(x0, x1);
  for (let x = a; x <= b; x++) {
    put(g, out, opts, x, y, z, "dark_oak_slab", { type: "top" });
    put(g, out, opts, x, y + 1, z, (x - a) % 2 === 0 ? "potted_poppy" : "potted_dandelion");
  }
  return out;
}

/** A lit candle cluster of n (1..4) candles at (x, y, z). color: "candle", "white_candle" or "yellow_candle". */
export function candleCluster(g, x, y, z, color, n, opts = {}) {
  if (!CANDLES.includes(color)) throw new Error(`bad candle colour: ${color}`);
  if (!Number.isInteger(n) || n < 1 || n > 4) throw new Error(`candles must be 1..4, got ${n}`);
  const out = [];
  put(g, out, opts, x, y, z, color, { candles: n, lit: "true" });
  return out;
}

/**
 * One bay of the drying lean-to: a post at (x, y 1..3, z) carrying the shed's slab course on the same z row. The
 * course runs x-3..x+1 (for the post at x=18: dark oak top slabs at x=15..16 y=5, top slabs at x=17..18 y=4, and the
 * bottom eave slab at x=19 y=4). Lay one call per z row; the caller tiles z.
 */
export function leanToBay(g, x, z, opts = {}) {
  const out = [];
  for (let y = 1; y <= 3; y++) put(g, out, opts, x, y, z, "stripped_dark_oak_log", { axis: "y" });
  for (const dx of [-3, -2]) put(g, out, opts, x + dx, 5, z, "dark_oak_slab", { type: "top" });
  for (const dx of [-1, 0]) put(g, out, opts, x + dx, 4, z, "dark_oak_slab", { type: "top" });
  put(g, out, opts, x + 1, 4, z, "dark_oak_slab", { type: "bottom" });
  return out;
}

/**
 * A spruce picket line from (x0, z0) to (x1, z1), one axis only, at row y. gates: [[x, z], ...] cells that get a
 * spruce_fence_gate instead of a post (facing across the run). A corner post shared with an earlier run keeps that
 * run's arms: its connections are merged, so the second call adds arms and writes nothing else.
 */
export function picketFence(g, x0, z0, x1, z1, y, gates = [], opts = {}) {
  if (x0 !== x1 && z0 !== z1) throw new Error("picketFence runs along one axis");
  const out = [], alongX = z0 === z1;
  const a = alongX ? Math.min(x0, x1) : Math.min(z0, z1), b = alongX ? Math.max(x0, x1) : Math.max(z0, z1);
  const gateAt = new Set(gates.map(([gx, gz]) => `${gx},${gz}`));
  for (let i = a; i <= b; i++) {
    const x = alongX ? i : x0, z = alongX ? z0 : i;
    if (gateAt.has(`${x},${z}`)) {
      put(g, out, opts, x, y, z, "spruce_fence_gate", { facing: alongX ? "north" : "east", in_wall: "false", open: "false" });
      continue;
    }
    const conn = alongX
      ? { north: "false", south: "false", east: String(i < b), west: String(i > a) }
      : { north: String(i > a), south: String(i < b), east: "false", west: "false" };
    const prev = g.get(x, y, z);
    if (prev && prev.block === "minecraft:spruce_fence" && prev.state) {
      for (const d of HORIZONTAL) if (prev.state[d] === "true") conn[d] = "true";
      if (HORIZONTAL.every((d) => prev.state[d] === conn[d])) continue;
      g.set(x, y, z, "spruce_fence", conn);
      out.push([x, y, z]);
      continue;
    }
    put(g, out, opts, x, y, z, "spruce_fence", conn);
  }
  return out;
}

/**
 * A shop counter across x0..x1 on the plane z: dark oak planks at row y with a dark oak top slab on them at y+1. Only
 * the counter's own cells; the 2-high lane past its ends is left for the caller to keep clear.
 */
export function counter(g, x0, x1, y, z, opts = {}) {
  const out = [], a = Math.min(x0, x1), b = Math.max(x0, x1);
  for (let x = a; x <= b; x++) {
    put(g, out, opts, x, y, z, "dark_oak_planks");
    put(g, out, opts, x, y + 1, z, "dark_oak_slab", { type: "top" });
  }
  return out;
}

/**
 * A bed: the foot at (x, y, z), the head one cell in the facing direction, both halves on row y with the same facing.
 * Two cells on the floor, one wide: it fits the 3x3 east bedchamber with a 2-high lane left past it. Both halves go in,
 * or neither does. color: "white" or "red".
 */
export function bed(g, x, y, z, facing, color, opts = {}) {
  const f = dirName(facing);
  if (!BEDS.includes(color)) throw new Error(`bad bed colour: ${color}`);
  const [dx, , dz] = DIRS[f], hx = x + dx, hz = z + dz;
  if (!opts.overwrite && (!g.isAir(x, y, z) || !g.isAir(hx, y, hz))) return [];
  const out = [];
  put(g, out, opts, x, y, z, `${color}_bed`, { facing: f, part: "foot" });
  put(g, out, opts, hx, y, hz, `${color}_bed`, { facing: f, part: "head" });
  return out;
}
