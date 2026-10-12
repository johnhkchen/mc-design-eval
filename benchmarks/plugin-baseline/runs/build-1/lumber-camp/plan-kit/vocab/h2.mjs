// Lumber camp helpers, part 2 (plan.md VOCABULARY 2, 6, 10, 14, 18, 22, 26, 30): logs, shutters, the loft ladder, the
// mill's half wall, the log deck, the cook hearth mouth, cordwood and the logging-road ruts.
// Each takes the grid first (g), then its position (and facing where it has one), and writes only into air, so an
// earlier part's blocks are never touched. The two named exceptions: loftLadder carves its hatch cell (on by default),
// and ruts replaces the ground surface at y=0. A write that would land on anything else is refused and listed in the
// returned `blocked` as [x, y, z, what was there]. Every helper returns { placed, blocked }.
import { DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = "minecraft:air";
const GROUND = new Set(["minecraft:grass_block", "minecraft:coarse_dirt", "minecraft:podzol", "minecraft:rooted_dirt",
  "minecraft:dirt", "minecraft:gravel", "minecraft:dirt_path"]);

const result = () => ({ placed: 0, blocked: [] });

// One block into a cell that is air, or into a cell `ok` accepts (the block already there); anything else is refused.
function put(g, out, x, y, z, block, state, ok = () => false) {
  if (!g.inBounds(x, y, z)) return void out.blocked.push([x, y, z, "outside the grid"]);
  if (!g.isAir(x, y, z) && !ok(g.blockAt(x, y, z))) return void out.blocked.push([x, y, z, g.blockAt(x, y, z)]);
  g.set(x, y, z, block, state);
  out.placed++;
}

/**
 * A straight course of spruce_log lying along axis x or z. The run is x0..x1 (inclusive); `at` is the coordinate the
 * run is fixed at: the z of an x-run, or the x of a z-run (so an east or west wall passes its own x as `at`). `skip` is
 * a list of opening cells to leave alone, as [x, y, z] triples or "x,y,z" keys. The log's axis state is the run's axis.
 */
export function logCourse(g, x0, x1, y, at, axis = "x", skip = []) {
  if (axis !== "x" && axis !== "z") throw new Error(`logCourse: axis is x or z, got ${axis}`);
  const out = result(), left = new Set([...skip].map((c) => (Array.isArray(c) ? c.join(",") : c)));
  for (let i = Math.min(x0, x1); i <= Math.max(x0, x1); i++) {
    const [x, z] = axis === "x" ? [i, at] : [at, i];
    if (!left.has(`${x},${y},${z}`)) put(g, out, x, y, z, "spruce_log", { axis });
  }
  return out;
}

/**
 * Two 2-high columns of open spruce_trapdoor, one either side of a window `span` cells wide. (x, y, z) is the window's
 * first cell in the wall (its lower row); `facing` is the way out of the wall, as for a ladder. The shutters stand one
 * cell out from the wall, and each panel hinges on the wall, so it lies flat against it.
 */
export function shutterPair(g, x, y, z, facing, span) {
  const out = result(), [dx, , dz] = DIRS[facing];
  const along = facing === "north" || facing === "south" ? [1, 0] : [0, 1];
  for (const i of [-1, span]) for (const dy of [0, 1]) {
    put(g, out, x + i * along[0] + dx, y + dy, z + i * along[1] + dz, "spruce_trapdoor", { facing, half: "bottom", open: "true" });
  }
  return out;
}

/**
 * A ladder column (y0..y1, inclusive) against the wall at (x, z); `facing` is the way out of the wall (a ladder facing
 * north is fixed to the wall on its south). The hatch is the loft floor cell right above the column, y1 + 1, carved to
 * air unless { hatch: false }. For the plan's ladder up to the hatch at (5,5,16): loftLadder(g, 5, 16, 2, 4, "north").
 */
export function loftLadder(g, x, z, y0, y1, facing, { hatch = true } = {}) {
  const out = result();
  for (let y = y0; y <= y1; y++) put(g, out, x, y, z, "ladder", { facing });
  if (hatch) put(g, out, x, y1 + 1, z, AIR, undefined, () => true);
  return out;
}

/** The mill's half wall on x: spruce_planks at y=1..2 strictly between the posts at z0 and z1 (the posts are not written). */
export function halfWall(g, x, z0, z1) {
  const out = result();
  for (let z = Math.min(z0, z1) + 1; z < Math.max(z0, z1); z++) for (let y = 1; y <= 2; y++) put(g, out, x, y, z, "spruce_planks");
  return out;
}

/**
 * The log deck (SITE table): stripped_spruce_log skids along z at y=1 on x0, the middle and x1; spruce_log tiers along
 * x at y=2 (rows z0..z1) and y=3 (rows z0+1..z1-1) over x0+1..x1-1; spruce_log chocks (axis y) at the four corners of
 * y=2. Footprint: x0..x1, y=1..3, z0..z1. logDeck(g, 24, 34, 4, 7) is the plan's deck.
 */
export function logDeck(g, x0, x1, z0, z1) {
  const out = result(), mid = Math.floor((x0 + x1) / 2);
  for (const x of [x0, mid, x1]) for (let z = z0; z <= z1; z++) put(g, out, x, 1, z, "stripped_spruce_log", { axis: "z" });
  for (let x = x0 + 1; x < x1; x++) {
    for (let z = z0; z <= z1; z++) put(g, out, x, 2, z, "spruce_log", { axis: "x" });
    for (let z = z0 + 1; z < z1; z++) put(g, out, x, 3, z, "spruce_log", { axis: "x" });
  }
  for (const x of [x0, x1]) for (const z of [z0, z1]) put(g, out, x, 2, z, "spruce_log", { axis: "y" });
  return out;
}

/**
 * A cook hearth in a wall. The firebox is the 2-wide opening through the wall: (x, y, z) and its neighbour along the
 * wall, with the top row (y+1) left as air. `facing` is the way into the room. A lit campfire at (x, y, z), a lit smoker
 * beside it, and a cobblestone_stairs lintel (half top, back to the wall) on the room side of both cells at y+2.
 * hearthMouth(g, 18, 2, 12, "west") is the plan's hearth in the east wall. The floor below is the caller's.
 */
export function hearthMouth(g, x, y, z, facing) {
  const out = result(), [dx, , dz] = DIRS[facing];
  const along = facing === "north" || facing === "south" ? [1, 0] : [0, 1];
  put(g, out, x, y, z, "campfire", { facing, lit: "true" });
  put(g, out, x + along[0], y, z + along[1], "smoker", { facing, lit: "true" });
  for (const k of [0, 1]) {
    put(g, out, x + dx + k * along[0], y + 2, z + dz + k * along[1], "cobblestone_stairs", { facing: OPPOSITE[facing], half: "top", shape: "straight" });
  }
  return out;
}

/** Cordwood: a solid block fill of spruce_log, logs lying along `axis` (z by default), x0..x1 by z0..z1 by y0..y1. */
export function cordwood(g, x0, z0, x1, z1, y0, y1, axis = "z") {
  const out = result();
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = y0; y <= y1; y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) put(g, out, x, y, z, "spruce_log", { axis });
  return out;
}

/**
 * A wheel rut along x at z, on the ground surface (y=0): dirt_path, with about 1 cell in 7 gravel. The pattern is fixed
 * by position, so the same build comes out every time. It replaces ground blocks only (grass, dirt, coarse dirt, ...).
 */
export function ruts(g, x0, x1, z) {
  const out = result();
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    const h = (Math.imul(x, 73856093) ^ Math.imul(z, 19349663)) >>> 0;
    put(g, out, x, 0, z, h % 100 < 15 ? "gravel" : "dirt_path", undefined, (b) => GROUND.has(b));
  }
  return out;
}
