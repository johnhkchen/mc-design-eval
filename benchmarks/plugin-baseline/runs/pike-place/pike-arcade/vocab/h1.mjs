// H1 vocabulary (plan.md VOCABULARY): post_bay, stall, stall_sign, cornice, du_window, quoins, stack, market_clock.
// Every helper takes its own position (and facing) as arguments, writes only the cells it computes, only into air
// (ground, walls and earlier parts are left alone), and returns how many blocks it placed.
// Stairs `facing` = the side of the full-height back, so a bracket or cornice faces INTO the wall it sits on.
// 1.21.1 ids: `chain`, not `iron_chain` (B.chain defaults to the newer name, so it is not used here).
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Screen-right for a viewer standing outside each face (the view the sign and clock letters are read from).
const RIGHT = { east: [0, 0, -1], west: [0, 0, 1], south: [1, 0, 0], north: [-1, 0, 0] };
const POTS = ["potted_red_tulip", "potted_poppy", "potted_cornflower", "potted_allium", "potted_orange_tulip"];
const FISH = ["packed_ice", "red_wool", "pink_wool", "packed_ice", "orange_wool", "light_gray_wool"];

// Writes are collected by cell (the last write to a cell wins), then committed.
const plan = () => new Map();
function put(m, [x, y, z], block, state, nbt) {
  const s = /_leaves$/.test(block) ? { persistent: "true", ...state } : state; // leaves never decay
  m.set(`${x},${y},${z}`, [x, y, z, block, s, nbt]);
}
// Air-only unless `force` (force is for the parts the plan puts inside a wall or roof on purpose).
function commit(g, m, { force = false } = {}) {
  let n = 0;
  for (const [x, y, z, block, state, nbt] of m.values()) {
    if (!g.inBounds(x, y, z) || (!force && !g.isAir(x, y, z))) continue;
    g.set(x, y, z, block, state, nbt);
    n++;
  }
  return n;
}

/**
 * One arcade post: green_concrete column y0..y0+h-1, two upside-down dark_oak_stairs brackets either side along z at
 * beamY-1 (lips point away from the post), dark_oak_planks beam at beamY over beamZ = [z0, z1] (default: this post).
 * The footing is not written (the ground belongs to an earlier part).
 */
export function post_bay(g, { x, z, y0, h, beamY, beamZ = [z, z] }) {
  const m = plan(), [b0, b1] = beamZ;
  for (let y = y0; y < y0 + h; y++) put(m, [x, y, z], "green_concrete");
  put(m, [x, beamY - 1, z + 1], ...B.stairs("dark_oak", "north", "top")); // back against the post (to the north, -z)
  put(m, [x, beamY - 1, z - 1], ...B.stairs("dark_oak", "south", "top"));
  for (let k = Math.min(b0, b1); k <= Math.max(b0, b1); k++) put(m, [x, beamY, k], "dark_oak_planks");
  return commit(g, m);
}

// Goods on the counter at gy (= y+1); cap cells at gy+1. i is a running index so each stall mixes its goods.
const GOODS = {
  produce: (m, x, gy, z, i) => {
    if (i % 4 === 3) { put(m, [x, gy, z], "red_wool"); put(m, [x, gy + 1, z], "green_wool"); } // apple heap, leaf cap
    else put(m, [x, gy, z], ["melon", "pumpkin", "hay_block"][i % 4]);
  },
  flowers: (m, x, gy, z, i) => {
    if (i % 4 === 3) { put(m, [x, gy, z], "cauldron"); put(m, [x, gy + 1, z], "flowering_azalea_leaves"); } // bucket
    else put(m, [x, gy, z], POTS[i % POTS.length]);
  },
  fish: (m, x, gy, z, i) => put(m, [x, gy, z], FISH[i % FISH.length]),
  honey: (m, x, gy, z, i) => {
    put(m, [x, gy, z], "honeycomb_block");
    if (i % 3 === 2) put(m, [x, gy + 1, z], "candle", { lit: "true" });
  },
  crates: (m, x, gy, z, i) => {
    if (i % 2) return;
    put(m, [x, gy, z], "barrel", { facing: "up", open: "false" });
    put(m, [x, gy + 1, z], ...B.trapdoor("dark_oak", "north", "bottom"));
  },
};

/**
 * Market counter x0..x1 by z0..z1: dark_oak_planks base at y, the front column x1 a top dark_oak_slab lip at y+1,
 * goods on the other columns at y+1 (caps at y+2). kind: produce | flowers | fish | honey | crates.
 */
export function stall(g, { x0, x1, z0, z1, y, kind }) {
  const goods = GOODS[kind];
  if (!goods) throw new Error(`stall: unknown kind "${kind}"`);
  const m = plan();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(m, [x, y, z], "dark_oak_planks");
  for (let z = z0; z <= z1; z++) put(m, [x1, y + 1, z], ...B.slab("dark_oak", "top"));
  for (let x = x0; x < x1; x++) for (let z = z0; z <= z1; z++) goods(m, x, y + 1, z, (z - z0) + (x - x0));
  return commit(g, m);
}

const ROT = { south: 0, west: 4, north: 8, east: 12 }; // hanging-sign rotation = the way its text faces
/**
 * Hand-painted hanging sign: dark_oak_fence bracket at (x, y+1, z) under the beam at (x, y+2, z), dark_oak_hanging_sign
 * at (x, y, z) reading toward `face`. text: lines split on "\n" or "|" (up to 4). Returns 0 if nothing is above it.
 */
export function stall_sign(g, { x, y, z, text, face = "east" }) {
  if (g.isAir(x, y + 2, z)) return 0; // hangs from the beam
  const lines = String(text).split(/\n|\|/).slice(0, 4);
  const m = plan();
  put(m, [x, y + 1, z], "dark_oak_fence");
  put(m, [x, y, z], ...B.sign("dark_oak", lines, { wall: false, hanging: true, rotation: ROT[face], dataVersion: g.dataVersion }));
  return commit(g, m);
}

/**
 * Cornice along z on an east or west face at plane x: smooth_quartz_stairs (half top, facing into the wall) at y over
 * z0..z1, with a smooth_quartz_slab (top) course under it at y-1. Proud of the wall by one, so x is the outer column.
 */
export function cornice(g, { x, y, z0, z1, face }) {
  const m = plan();
  for (let z = z0; z <= z1; z++) {
    put(m, [x, y, z], ...B.stairs("smooth_quartz", OPPOSITE[face], "top"));
    put(m, [x, y - 1, z], ...B.slab("smooth_quartz", "top"));
  }
  return commit(g, m);
}

/**
 * Down Under window on the wall plane `at` of an outward `face` (west, east, north or south). Panes (3 wide, 2 tall,
 * y f+2..f+3) in the 6-bay starting at `start` along the face; stone_brick sill and lintel proud of the wall;
 * one ochre_froglight behind each pane column. Writes nothing (returns 0) where f+1 <= ground: the window is underground.
 */
export function du_window(g, { at, face, f, start, ground = -Infinity }) {
  if (f + 1 <= ground) return 0;
  const across = face === "east" || face === "west"; // east/west: plane x = at; north/south: plane z = at
  const cell = (k, y, out) => (across ? [at + out * DIRS[face][0], y, start + k] : [start + k, y, at + out * DIRS[face][2]]);
  const pane = across ? { north: "true", south: "true" } : { east: "true", west: "true" };
  const m = plan();
  for (let k = 1; k <= 3; k++) {
    for (let y = f + 2; y <= f + 3; y++) put(m, cell(k, y, 0), "glass_pane", pane);
    put(m, cell(k, f + 1, 1), ...B.slab("stone_brick", "top"));
    put(m, cell(k, f + 4, 1), ...B.stairs("stone_brick", OPPOSITE[face], "top"));
    put(m, cell(k, f + 2, -1), "ochre_froglight");
  }
  return commit(g, m);
}

/** Corner quoins: smooth_quartz at column (x, z) in pairs, 2 on then 2 off, from y0 up to y1. */
export function quoins(g, { x, z, y0, y1 }) {
  const m = plan();
  for (let y = y0; y <= y1; y++) if (Math.floor((y - y0) / 2) % 2 === 0) put(m, [x, y, z], "smooth_quartz");
  return commit(g, m);
}

/**
 * Dummy chimney (no flue): 2x2 bricks from y0 to ridgeY+3, a stone_bricks band at ridgeY+1, a 4x4 stone_brick_slab cap
 * stepped out at ridgeY+4. Pass through: true when the stack must pass through a roof already laid (the cap stays air-only).
 */
export function stack(g, { x, z, y0, ridgeY, through = false }) {
  const col = plan(), cap = plan(), top = ridgeY + 3;
  for (let y = y0; y <= top; y++) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++)
    put(col, [x + dx, y, z + dz], y === ridgeY + 1 ? "stone_bricks" : "bricks");
  for (let dx = -1; dx <= 2; dx++) for (let dz = -1; dz <= 2; dz++) put(cap, [x + dx, top + 1, z + dz], ...B.slab("stone_brick", "bottom"));
  return commit(g, col, { force: through }) + commit(g, cap);
}

/**
 * Round clock on the wall plane through `center` (the dial's middle cell), seen from outside `face` (east, west, south,
 * north). Radius R: white_concrete dial, red_concrete bezel ring (red_stained_glass with glowstone one cell in when neon,
 * the glow written into the wall on purpose), black_concrete marks at 12/3/6/9 and hands at 10:10.
 * The square surround and the PUBLIC MARKET banner lie outside the reserved box and are not written.
 */
export function market_clock(g, { center: [cx, cy, cz], face, radius: R = 3, neon = false }) {
  const [rx, , rz] = RIGHT[face], [ox, , oz] = DIRS[face];
  const cell = (a, b, out = 0) => [cx + a * rx + out * ox, cy + b, cz + a * rz + out * oz];
  const dial = new Map(), set = (a, b, block) => dial.set(`${a},${b}`, [a, b, block]), ring = [];
  for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) {
    const d2 = a * a + b * b;
    if (d2 <= (R - 1) ** 2) set(a, b, "white_concrete");
    else if (d2 <= R * R) { set(a, b, neon ? "red_stained_glass" : "red_concrete"); ring.push([a, b]); }
  }
  for (const [a, b] of [[0, R - 1], [R - 1, 0], [0, 1 - R], [1 - R, 0]]) set(a, b, "black_concrete");
  const hand = (deg, len) => {
    const r = (deg * Math.PI) / 180;
    for (let t = 0.5; t <= len; t += 0.5) set(Math.round(t * Math.sin(r)), Math.round(t * Math.cos(r)), "black_concrete");
  };
  hand(305, R - 1.5); // hour hand at 10
  hand(60, R - 0.5); // minute hand at 2
  set(0, 0, "black_concrete");
  const plane = plan(), glow = plan();
  for (const [a, b, block] of dial.values()) put(plane, cell(a, b), block);
  if (neon) for (const [a, b] of ring) put(glow, cell(a, b, -1), "glowstone");
  return commit(g, plane) + commit(g, glow, { force: true });
}
