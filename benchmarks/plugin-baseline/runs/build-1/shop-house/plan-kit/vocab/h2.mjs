// Shop-house vocabulary, batch 2 (plan.md VOCABULARY): quoinPair, fascia, hood, doorPair, chimneyStack,
// ladderHatch, pathRun, lampPost, waterButt. Each helper:
//   - takes its position (and facing) as arguments, in plan.md's order where it gives one; the grid comes first;
//   - writes only the cells of its own footprint, and only into AIR. opts.over: true lets it replace a non-air
//     block in its own footprint (quoins on brick, the surface row of a path, the chimney base on grass). Nothing
//     below the footprint is ever written, so the ground and floor an earlier part laid stay as they are;
//   - returns { placed, refused }: refused lists [x, y, z, block, why] for every write it did not make
//     (not air, outside the grid, or refused by guard()). Report it; never assume a write landed.
// Block states are the ones `mcd states` lists for this version (no waterlogged on these blocks).
import { plaque, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIRY = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air", "minecraft:structure_void"]);

/** One helper call's writer: put(g, x, y, z, block, state, opts) with the footprint bookkeeping in `out`. */
function writer() {
  const out = { placed: 0, refused: [] }, done = new Set();
  const put = (g, x, y, z, block, state, o = {}) => {
    const k = `${x},${y},${z}`;
    if (done.has(k)) return;                      // a cell this helper already wrote (overlapping rings, path corners)
    done.add(k);
    if (!g.inBounds(x, y, z)) return out.refused.push([x, y, z, block, "outside grid"]);
    const cur = g.blockAt(x, y, z);
    if (!AIRY.has(cur) && !o.over) return out.refused.push([x, y, z, block, `not air (${cur})`]);
    const before = g.refused?.length ?? 0;
    g.set(x, y, z, block, state);
    if ((g.refused?.length ?? 0) > before) return out.refused.push([x, y, z, block, "guard"]);
    out.placed++;
  };
  return { out, put };
}

/** Two `smooth_quartz` blocks stacked at (x, z), y and y+1: one quoin pair on a corner of brick. Use over: true on brick. */
export function quoinPair(g, x, z, y, opts = {}) {
  const { out, put } = writer();
  put(g, x, y, z, "smooth_quartz", undefined, opts);
  put(g, x, y + 1, z, "smooth_quartz", undefined, opts);
  return out;
}

/**
 * Shop name board: a solid board x0..x1, y0..y1 at plane z (red_nether_bricks by default), with the name in banner
 * letters on the plane in front of it (z - 1, facing north, read left to right from the street). The letters go
 * only on air; they never replace a block. material: the board block; null keeps the wall as the board.
 */
export function fascia(g, x0, x1, y0, y1, z, name, material = "red_nether_bricks", opts = {}) {
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1), bot = Math.min(y0, y1), top = Math.max(y0, y1);
  const { out, put } = writer();
  if (material) for (let x = lo; x <= hi; x++) for (let y = bot; y <= top; y++) put(g, x, y, z, material, undefined, opts);
  // plaque's north frame runs its u axis west, so the band's origin is its east end (hi), at the bottom row. Its
  // banners hang one cell out from `at` on the board plane z, so letters land on z - 1 (in front of the board)
  const plan = plaque(g, name, {
    at: [hi, bot, z], face: "north", width: hi - lo + 1, height: top - bot + 1,
    material: null, style: "banner", avoid: (p) => !AIRY.has(g.blockAt(...p)),
  });
  // letter cells plaque could not place (not air, outside the grid) are counted here; plaque's notes say why
  return { placed: out.placed + (plan?.cells ?? 0), refused: out.refused, letterSkips: plan?.skipped ?? 0, notes: plan?.notes ?? [] };
}

/**
 * Hood over a door or window: a bottom `dark_oak_slab` row x0..x1 at (y, z), carried on upside-down `dark_oak_stairs`
 * at both ends (y - 1, backs into the wall). Two hanging lanterns sit under the slab's inner cells; each hangs from
 * the slab above it. (plan.md puts the lanterns at the ends in front of the wall; the ends carry the stairs, so the
 * lanterns go to the next cells in, where a block is above them.) facing: the way the hood projects, e.g. "north".
 */
export function hood(g, x0, x1, y, z, facing = "north", opts = {}) {
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
  const into = OPPOSITE[facing];
  const { out, put } = writer();
  for (let x = lo; x <= hi; x++) put(g, x, y, z, "dark_oak_slab", { type: "bottom" }, opts);
  for (const x of [lo, hi]) put(g, x, y - 1, z, "dark_oak_stairs", { facing: into, half: "top", shape: "straight" }, opts);
  for (const x of new Set([lo + 1, hi - 1])) if (x > lo && x < hi) put(g, x, y - 1, z, "lantern", { hanging: "true" }, opts);
  return out;
}

/**
 * Double door (two `dark_oak_door` leaves side by side, both halves each) with its face toward `facing`. The leaves
 * are at (x, z) and the next cell along the wall (x + 1 for north/south, z + 1 for east/west). Hinges sit on the outer
 * edges, so the leaves open away from each other. material: the wood (dark_oak by default).
 */
export function doorPair(g, x, y, z, facing = "north", opts = {}) {
  const { out, put } = writer();
  const alongX = facing === "north" || facing === "south";
  const [sx, sz] = alongX ? [1, 0] : [0, 1];
  // the first leaf hinges on its outer (low-coordinate) edge: left of the facing for north and east, right otherwise
  const firstHinge = facing === "north" || facing === "east" ? "left" : "right";
  const hinges = [firstHinge, firstHinge === "left" ? "right" : "left"];
  const block = `${opts.material ?? "dark_oak"}_door`;
  for (let d = 0; d < 2; d++) {
    const lx = x + d * sx, lz = z + d * sz;
    put(g, lx, y, lz, block, { facing, half: "lower", hinge: hinges[d], open: "false" }, opts);
    put(g, lx, y + 1, lz, block, { facing, half: "upper", hinge: hinges[d], open: "false" }, opts);
  }
  return out;
}

/**
 * Chimney stack on a 2x2 footing at (x..x+1, z..z+1): bricks from `base` up to capY - 1, a `deepslate_bricks` band at
 * bandY, one hay_block at the top corner (x+1, hayY, z+1) with a lit campfire above it (signal fire) at capY, and a
 * `brick_slab` top cap ring one out at capY around the flue. hayY must be capY - 1 (the campfire sits on the hay).
 */
export function chimneyStack(g, x, z, base, bandY, hayY, capY, opts = {}) {
  if (hayY !== capY - 1) throw new Error(`chimneyStack: hay (y ${hayY}) must sit one below the cap (y ${capY})`);
  const { out, put } = writer();
  for (let y = base; y < capY; y++) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    const cx = x + dx, cz = z + dz;
    if (dx && dz && y === hayY) put(g, cx, y, cz, "hay_block", { axis: "y" }, opts);
    else put(g, cx, y, cz, y === bandY ? "deepslate_bricks" : "bricks", undefined, opts);
  }
  put(g, x + 1, capY, z + 1, "campfire", { facing: "north", lit: "true" }, opts);
  for (let dx = -1; dx <= 2; dx++) for (let dz = -1; dz <= 2; dz++) {
    if (dx >= 0 && dx <= 1 && dz >= 0 && dz <= 1) continue;   // the flue
    put(g, x + dx, capY, z + dz, "brick_slab", { type: "top" }, opts);
  }
  return out;
}

/**
 * Ladder up a wall at x, z from y0 to y1, facing `facing` (away from the wall, north for a wall on the south side).
 * An open trapdoor hatch sits in the floor at the top, one cell out in front of the ladder (y1 + 1), hinged toward the
 * ladder. The floor cell is left air by the shell (a reserved opening), so the hatch needs no over.
 */
export function ladderHatch(g, x, z, y0, y1, facing = "north", opts = {}) {
  const { out, put } = writer();
  for (let y = y0; y <= y1; y++) put(g, x, y, z, "ladder", { facing }, opts);
  const [dx, , dz] = DIRS[facing];
  put(g, x + dx, y1 + 1, z + dz, "dark_oak_trapdoor", { facing: OPPOSITE[facing], half: "bottom", open: "true" }, opts);
  return out;
}

/**
 * A path of `block` (dirt_path) at height y along the polyline pts = [[x, z], ...], `width` cells across, axis-aligned
 * segments only. The width is centred on the line (the extra cell goes to +x / +z). A surface path replaces the lot's
 * grass, so callers pass over: true.
 */
export function pathRun(g, pts, width, y, opts = {}) {
  const { out, put } = writer();
  const block = opts.block ?? "dirt_path";
  const lo = Math.floor((width - 1) / 2), hi = width - 1 - lo;
  if (pts.length === 1) { const [[x, z]] = pts; for (let a = -lo; a <= hi; a++) for (let b = -lo; b <= hi; b++) put(g, x + a, y, z + b, block, undefined, opts); return out; }
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
    if (x0 !== x1 && z0 !== z1) throw new Error(`pathRun: segment ${x0},${z0} -> ${x1},${z1} is not axis-aligned`);
    if (x0 !== x1) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let d = -lo; d <= hi; d++) put(g, x, y, z0 + d, block, undefined, opts);
    else for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) for (let d = -lo; d <= hi; d++) put(g, x0 + d, y, z, block, undefined, opts);
  }
  return out;
}

/** A garden lamp post: `spruce_fence` posts from y up `height` cells (3 by default), a standing lantern on top. */
export function lampPost(g, x, z, y, opts = {}) {
  const { out, put } = writer();
  const height = opts.height ?? 3;
  // no state: every side defaults to unconnected, so the post stands alone
  for (let h = 0; h < height; h++) put(g, x, y + h, z, "spruce_fence", undefined, opts);
  put(g, x, y + height, z, "lantern", { hanging: "false" }, opts);
  return out;
}

/** A water butt: a `water_cauldron` at level 3, one cell at (x, y, z). */
export function waterButt(g, x, z, y, opts = {}) {
  const { out, put } = writer();
  put(g, x, y, z, "water_cauldron", { level: "3" }, opts);
  return out;
}
