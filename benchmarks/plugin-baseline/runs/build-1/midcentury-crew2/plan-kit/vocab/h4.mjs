// Vocabulary part 4: glazing, the ledgestone wall, the carport, the car, the front and back fittings, and the
// living, dining and bedroom furniture named in plan.md's VOCABULARY. Every helper takes the grid first, then its
// position (and facing where it has one), and returns { placed, skipped }.
// Each helper writes only into air: a cell already holding a block (an earlier part's, or a sentinel) is left alone
// and counted in `skipped`. Ground and floor are never written, except carport's `floor` option.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Writes one block into air only, and counts what it placed and what it left alone.
function writer(g) {
  const out = { placed: 0, skipped: 0 };
  const w = (x, y, z, spec) => {
    const [block, state, nbt] = typeof spec === "string" ? [spec] : spec;
    if (!g.isAir(x, y, z)) { out.skipped++; return; }
    g.set(x, y, z, block, state, nbt);
    out.placed++;
  };
  return { w, out };
}

// The beam lines of the structure: x = 10, 13, 16, ..., 31.
const onBeamLine = (x) => ((x - 10) % 3 + 3) % 3 === 0;

// A per-cell pseudo-random number in [0, 1), so the stone pattern does not depend on write order.
const unit = (x, y, z, seed) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519) ^ Math.imul(seed, 3266489917);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/**
 * Glass pane run in a wall, y0..y1 inclusive. Default: along x, from x=a to x=b at z=fixed.
 * { along: "z" }: along z, from z=a to z=b at x=fixed.
 */
export function glass_bay(g, a, b, fixed, y0, y1, { along = "x" } = {}) {
  const { w, out } = writer(g);
  for (let y = y0; y <= y1; y++)
    for (let t = Math.min(a, b); t <= Math.max(a, b); t++) {
      if (along === "x") w(t, y, fixed, B.pane());
      else w(fixed, y, t, B.pane());
    }
  return out;
}

/**
 * Freestanding ledgestone wall at z (x0..x1, y0..y1): mud_bricks with ~25% packed_mud (seeded), and a mud_brick_slab
 * cap at y1+1 on every cell that is not a beam line (plan: x=11,12,14,15,17 on the north wall).
 */
export function ledgestone_wall(g, x0, x1, z = 7, y0 = 1, y1 = 4, seed = 7) {
  const { w, out } = writer(g);
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = y0; y <= y1; y++) w(x, y, z, unit(x, y, z, seed) < 0.25 ? "packed_mud" : "mud_bricks");
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    if (!onBeamLine(x)) w(x, y1 + 1, z, B.slab("mud_brick", "bottom"));
  return out;
}

const GROUND = new Set(["minecraft:dirt", "minecraft:grass_block", "minecraft:sand", "minecraft:gravel"]);

/**
 * Flat carport over x0..x1, z0..z1 (plan: 0, 7, 9, 21). Posts at x0+1 on z0+1, z0+7, z0+13 (y 1..3); dark_oak beams
 * along x at y=4 on the same rows; smooth_stone_slab deck at y=5; dark_oak_slab fascia on x=x0, z=z0 and z=z1.
 * { floor: true } also lays smooth_stone at y=0 over ground and air (off by default: the site part owns the ground).
 */
export function carport(g, x0 = 0, z0 = 7, x1 = 9, z1 = 21, { floor = false } = {}) {
  const { w, out } = writer(g);
  const rows = [z0 + 1, z0 + 7, z0 + 13];
  for (const z of rows) for (let y = 1; y <= 3; y++) w(x0 + 1, y, z, B.log("dark_oak", "y"));
  for (const z of rows) for (let x = x0; x <= x1; x++) w(x, 4, z, B.log("dark_oak", "x"));
  // fascia first, so the deck's slab does not take the edge cells
  for (let z = z0; z <= z1; z++) w(x0, 5, z, B.slab("dark_oak", "bottom"));
  for (let x = x0 + 1; x <= x1; x++) { w(x, 5, z0, B.slab("dark_oak", "bottom")); w(x, 5, z1, B.slab("dark_oak", "bottom")); }
  for (let x = x0 + 1; x <= x1; x++) for (let z = z0 + 1; z <= z1 - 1; z++) w(x, 5, z, B.slab("smooth_stone", "bottom"));
  if (floor) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (g.isAir(x, 0, z) || GROUND.has(g.blockAt(x, 0, z))) { g.set(x, 0, z, "smooth_stone"); out.placed++; }
  }
  return out;
}

// The 1950s car in its own frame: u 0..2 across (u=1 the middle), v 0..6 from the nose (v=0 the front).
function carCell(u, v, y) {
  if (y === 1) {
    if (v === 0) return u === 1 ? "iron_block" : "yellow_concrete";              // front bumper, headlamps
    if (v === 1 || v === 5) return u === 1 ? "cyan_concrete" : "black_concrete"; // tyres at the four corners
    if (v >= 2 && v <= 4) return "cyan_concrete";                                // body
    if (v === 6) return u === 1 ? "iron_block" : "red_concrete";                 // rear bumper, tail lamps
  }
  if (y === 2) {
    if (v >= 2 && v <= 4) return v === 3 && u === 1 ? "white_concrete" : "glass_pane"; // cabin, white roof strip
    if (v === 6 && u !== 1) return "white_concrete";                             // tail fins
  }
  return null;
}

/**
 * Two-tone 1950s car, x..x+2 by z..z+6 when it faces north or south (x..x+6 by z..z+2 east or west), y=1..2.
 * (x, z) is the corner of its footprint with the smallest coordinates. facing = the nose's direction.
 */
export function car_50s(g, x = 3, z = 1, facing = "north") {
  const place = {
    north: (u, v) => [x + u, z + v],
    south: (u, v) => [x + u, z + 6 - v],
    east: (u, v) => [x + 6 - v, z + u],
    west: (u, v) => [x + v, z + 2 - u],
  }[facing];
  if (!place) throw new Error(`car_50s: facing must be north, south, east or west, not ${facing}`);
  const { w, out } = writer(g);
  for (const y of [1, 2]) for (let v = 0; v <= 6; v++) for (let u = 0; u <= 2; u++) {
    const c = carCell(u, v, y);
    if (!c) continue;
    const [wx, wz] = place(u, v);
    w(wx, y, wz, c === "glass_pane" ? B.pane() : c);
  }
  return out;
}

/** Low post and box at (x, z): dark_oak_fence at y=1, smoker at y=2 (the box, its slot facing `facing`). */
export function mailbox(g, x = 9, z = 1, facing = "east") {
  const { w, out } = writer(g);
  w(x, 1, z, B.fence("dark_oak"));
  w(x, 2, z, ["smoker", { facing, lit: "false" }]);
  return out;
}

/** Garden lamp at (x, z): dark_oak_fence at y=1..2, a standing lantern on top at y=3. */
export function garden_lamp(g, x, z) {
  const { w, out } = writer(g);
  w(x, 1, z, B.fence("dark_oak"));
  w(x, 2, z, B.fence("dark_oak"));
  w(x, 3, z, B.lantern(false));
  return out;
}

/**
 * Low sofa, len cells long along `axis` ("x" or "z"), at y=2 (the floor is y=1), two cells deep. (x, z) is the corner
 * with the smallest coordinates. `facing` is the way a sitter looks, so it must be across `axis`.
 * Front row: the arms at both ends (stairs turned outward), smooth_red_sandstone_stairs seats between them with their
 * full back to the backrest. Back row: open iron_trapdoors along the whole length, as the backrest.
 */
export function sofa_low(g, x, z, len, axis, facing) {
  const acrossNS = facing === "north" || facing === "south";
  if (axis !== "x" && axis !== "z") throw new Error(`sofa_low: axis must be x or z, not ${axis}`);
  if ((axis === "x") !== acrossNS) throw new Error(`sofa_low: facing ${facing} must be across the sofa's axis ${axis}`);
  if (len < 3) throw new Error("sofa_low: len must be 3 or more (two arms and a seat)");
  const { w, out } = writer(g);
  const back = OPPOSITE[facing];
  // the cell at position t along the sofa, in the front row or the back row
  const at = (t, front) => {
    if (axis === "x") return [x + t, facing === "south" ? (front ? z + 1 : z) : (front ? z : z + 1)];
    return [facing === "east" ? (front ? x + 1 : x) : (front ? x : x + 1), z + t];
  };
  const outward = axis === "x" ? ["west", "east"] : ["north", "south"];
  for (let t = 0; t < len; t++) {
    const [bx, bz] = at(t, false);
    w(bx, 2, bz, B.trapdoor("iron", back, "bottom", true));
    const [fx, fz] = at(t, true);
    if (t === 0 || t === len - 1) w(fx, 2, fz, B.stairs("smooth_red_sandstone", t === 0 ? outward[0] : outward[1], "bottom"));
    else w(fx, 2, fz, B.stairs("smooth_red_sandstone", back, "bottom"));
  }
  return out;
}

/**
 * Sunken conversation pit over x0..x1, z0..z1 (plan: 13, 20, 17, 23), its rim at y=1 and the pit floor at y=0 (the shell
 * lays the floor). Rim stairs (smooth_quartz_stairs) face outward, so their backs are on the outside edge and a sitter
 * faces into the pit; the corners are quartz slabs; an orange carpet cushion sits on each stair at y=2. A spruce_slab
 * coffee table stands in the middle of the pit, with a flower_pot on it.
 */
export function conversation_pit(g, x0, z0, x1, z1) {
  const a = Math.min(x0, x1), b = Math.max(x0, x1), c = Math.min(z0, z1), d = Math.max(z0, z1);
  if (b - a < 2 || d - c < 2) throw new Error("conversation_pit: needs at least a 3 by 3 pit");
  const { w, out } = writer(g);
  for (let x = a; x <= b; x++) for (let z = c; z <= d; z++) {
    const edgeX = x === a ? "west" : x === b ? "east" : null;
    const edgeZ = z === c ? "north" : z === d ? "south" : null;
    if (!edgeX && !edgeZ) continue;                                          // the inside: the coffee table
    if (edgeX && edgeZ) { w(x, 1, z, B.slab("smooth_quartz", "bottom")); continue; }
    w(x, 1, z, B.stairs("smooth_quartz", edgeX ?? edgeZ, "bottom"));
    w(x, 2, z, "orange_carpet");
  }
  const cx = Math.floor((a + b) / 2), cz = Math.floor((c + d) / 2);
  w(cx, 1, cz, B.slab("spruce", "bottom"));
  w(cx, 2, cz, "flower_pot");
  return out;
}

/**
 * Double bed with its foot at (x, z) and its head one cell along `facing` (the way the head lies), at y=2. A spruce_planks
 * headboard stands behind the head at y=2; a nightstand on each side of the head is a spruce_fence at y=2 with a
 * birch_slab on it at y=3. The footprint is 3 by 3 (headboard included), so it fits the 5 by 3 bedroom boxes.
 */
export function bed_double(g, x, z, facing, color = "orange") {
  const [dx, , dz] = DIRS[facing] ?? [];
  if (dx === undefined) throw new Error(`bed_double: facing must be north, south, east or west, not ${facing}`);
  const { w, out } = writer(g);
  const [px, pz] = [-dz, dx];                                                // the side, across the bed
  w(x, 2, z, [`${color}_bed`, { facing, part: "foot" }]);
  w(x + dx, 2, z + dz, [`${color}_bed`, { facing, part: "head" }]);
  w(x + 2 * dx, 2, z + 2 * dz, "spruce_planks");
  for (const s of [1, -1]) {
    const nx = x + dx + s * px, nz = z + dz + s * pz;
    w(nx, 2, nz, B.fence("spruce"));
    w(nx, 3, nz, B.slab("birch", "bottom"));
  }
  return out;
}
