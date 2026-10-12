// Helpers from plan.md VOCABULARY (h4 share): the porch bay, the hanging lantern, the knee brace, the saw carriage, the
// fieldstone chimney stack, the bunk bed, the spruce tree and the wall sign. Each takes the grid first, then its position
// (and facing) as arguments, and returns the cells it wrote as [x, y, z]. Writes go only into air (g.isAir) unless
// opts.overwrite is true; a refused cell is skipped, not thrown. A piece that hangs or sits on something (a lantern, a
// sign, a brace) writes nothing unless its support is there. Nothing is written outside a helper's footprint, so no
// ground, sand or floor under it is touched. Facings take n|s|e|w or the full names; a wall sign or brace faces what it
// hangs from or stands beside (build.mjs: a wall sign's facing is the way it points out).
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LONG = { n: "north", s: "south", e: "east", w: "west" };

function dirName(d) {
  const f = LONG[d] ?? d;
  if (!DIRS[f]) throw new Error(`bad horizontal facing: ${d}`);
  return f;
}

// A cell writer: air-only unless opts.overwrite, skips cells outside the grid, collects the cells it wrote.
function writer(g, opts = {}) {
  const cells = [];
  const set = (x, y, z, block, state, nbt) => {
    if (!g.inBounds(x, y, z)) return false;
    if (!opts.overwrite && !g.isAir(x, y, z)) return false;
    g.set(x, y, z, block, state, nbt);
    cells.push([x, y, z]);
    return true;
  };
  return { set, cells };
}

// All-or-nothing check for a piece that only makes sense whole: every cell free (air, or overwrite).
function free(g, cells, opts = {}) {
  return opts.overwrite || cells.every(([x, y, z]) => g.inBounds(x, y, z) && g.isAir(x, y, z));
}

// Deterministic 0..1 roll per cell, so the same build comes out the same every run (mossy cells, uneven leaves).
function roll(x, y, z, salt = 0) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ Math.imul(salt, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// The porch bay: deck planks on y=1 over x0..x1 (z, z+1, z+2), a stripped spruce post at each end on y=2..3 (at z), and a
// spruce_fence rail on y=2 between them. opts.skip: x cells with no post and no rail (the porch step's gap); the deck stays.
// Call it per bay: porchBay(g, 5, 9) and porchBay(g, 9, 17, 5, { skip: [13] }).
export function porchBay(g, x0, x1, z = 5, opts = {}) {
  const w = writer(g, opts);
  const a = Math.min(x0, x1), b = Math.max(x0, x1);
  const skip = new Set(opts.skip ?? []);
  const posts = new Set([a, b].filter((x) => !skip.has(x)));
  const rails = new Set();
  for (let x = a + 1; x < b; x++) if (!skip.has(x)) rails.add(x);
  const solid = new Set([...posts, ...rails]); // fence arms reach a neighbouring rail or post, not a gap
  for (let x = a; x <= b; x++) for (let dz = 0; dz <= 2; dz++) w.set(x, 1, z + dz, "spruce_planks");
  for (const x of posts) for (let y = 2; y <= 3; y++) w.set(x, y, z, ...B.log("stripped_spruce", "y"));
  for (const x of rails) {
    const state = { north: "false", south: "false", east: String(solid.has(x + 1)), west: String(solid.has(x - 1)) };
    w.set(x, 2, z, "spruce_fence", state);
  }
  return w.cells;
}

// A lantern (hanging true) at (x, y, z) on an iron_chain of length `chain` above it (chain 0: it hangs straight from the
// block above). The support is the block over the chain; with no support it writes nothing.
export function hangLantern(g, x, y, z, chain = 0, opts = {}) {
  const plan = [];
  for (let i = 1; i <= chain; i++) plan.push([x, y + i, z, ...B.chain("y")]);
  plan.push([x, y, z, ...B.lantern(true)]);
  if (!g.inBounds(x, y + chain + 1, z) || g.isAir(x, y + chain + 1, z)) return [];
  if (!free(g, plan.map(([a, b, c]) => [a, b, c]), opts)) return [];
  const w = writer(g, opts);
  for (const [a, b, c, block, state] of plan) w.set(a, b, c, block, state);
  return w.cells;
}

// One knee brace at (x, y, z): an upside-down spruce stair (half top) facing `facing`, the way of the post it rises
// toward. The post stands in the next cell that way; with no post there it writes nothing. y defaults to plan's 5.
export function kneeBrace(g, x, z, facing, y = 5, opts = {}) {
  const f = dirName(facing);
  const [dx, , dz] = DIRS[f];
  if (!g.inBounds(x + dx, y, z + dz) || g.isAir(x + dx, y, z + dz)) return [];
  if (!free(g, [[x, y, z]], opts)) return [];
  const w = writer(g, opts);
  w.set(x, y, z, ...B.stairs("spruce", f, "top"));
  return w.cells;
}

// The saw carriage down the centre of a mill bay: stripped spruce rails at x-1 and x+1 on y=1 from z0 to z1, a spruce log
// riding the centre line (opts.log: [za, zb], default z0..z0+2), and the saw, a stonecutter, at (x, 1, opts.saw) (default
// z0+5). opts.facing: the saw's facing (default north). The floor under it is not touched.
export function sawCarriage(g, x, z0, z1, opts = {}) {
  const a = Math.min(z0, z1), b = Math.max(z0, z1);
  const [logA, logB] = opts.log ?? [a, a + 2];
  const sawZ = opts.saw ?? a + 5;
  const w = writer(g, opts);
  for (let z = a; z <= b; z++) {
    w.set(x - 1, 1, z, ...B.log("stripped_spruce", "z"));
    w.set(x + 1, 1, z, ...B.log("stripped_spruce", "z"));
  }
  for (let z = logA; z <= logB; z++) w.set(x, 1, z, ...B.log("spruce", "z"));
  w.set(x, 1, sawZ, "stonecutter", { facing: opts.facing ?? "north" });
  return w.cells;
}

// The cook chimney: a 2x2 cobblestone shaft at (x..x+1, z..z+1) from y=1 to yTop, mossy cobblestone about 1 in 6 (1 in 3
// at y<=4), a stone_bricks band at bandY, the top course three cobblestone and a lit campfire (signal_fire false) at
// (x+1, yTop, z+1), and a cobblestone_slab (bottom) ring one cell out at yTop+1 on the four sides, the 2x2 left open.
// Plan's cap ring at y=17 has nothing under it: the stack top is only the 2x2, so the ring is unsupported in the build.
export function fieldstoneStack(g, x, z, yTop, bandY, opts = {}) {
  const w = writer(g, opts);
  for (let y = 1; y <= yTop; y++) {
    for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) {
      const cx = x + dx, cz = z + dz;
      if (y === bandY) w.set(cx, y, cz, "stone_bricks");
      else if (y === yTop) {
        if (dx === 1 && dz === 1) w.set(cx, y, cz, "campfire", { lit: "true", signal_fire: "false" });
        else w.set(cx, y, cz, "cobblestone");
      } else {
        const rate = y <= 4 ? 1 / 3 : 1 / 6;
        w.set(cx, y, cz, roll(cx, y, cz) < rate ? "mossy_cobblestone" : "cobblestone");
      }
    }
  }
  for (let cx = x - 1; cx <= x + 2; cx++) for (let cz = z - 1; cz <= z + 2; cz++) {
    const inStack = cx >= x && cx <= x + 1 && cz >= z && cz <= z + 1;
    if (!inStack) w.set(cx, yTop + 1, cz, ...B.slab("cobblestone", "bottom"));
  }
  return w.cells;
}

// A bunk: the lower bed at y=2 (foot at (x, z), head one cell along `facing`), posts at both ends on y=2..3 outside the bed,
// a spruce_slab (top) on y=3 under the upper bed, and the upper bed at y=4. Ground floor only; opts.upper: false for a single
// bed (the loft). The bed sits against a wall on one side, the lane past it (the cells beside it) stays clear. All or nothing.
export function bunkBed(g, x, z, facing, opts = {}) {
  const f = dirName(facing);
  const [dx, , dz] = DIRS[f];
  const upper = opts.upper ?? true;
  const plan = [
    [x, 2, z, "red_bed", { facing: f, part: "foot" }],
    [x + dx, 2, z + dz, "red_bed", { facing: f, part: "head" }],
  ];
  if (upper) {
    plan.push([x - dx, 2, z - dz, ...B.log("stripped_spruce", "y")], [x - dx, 3, z - dz, ...B.log("stripped_spruce", "y")]);
    plan.push([x + 2 * dx, 2, z + 2 * dz, ...B.log("stripped_spruce", "y")], [x + 2 * dx, 3, z + 2 * dz, ...B.log("stripped_spruce", "y")]);
    plan.push([x, 3, z, ...B.slab("spruce", "top")], [x + dx, 3, z + dz, ...B.slab("spruce", "top")]);
    plan.push([x, 4, z, "red_bed", { facing: f, part: "foot" }], [x + dx, 4, z + dz, "red_bed", { facing: f, part: "head" }]);
  }
  if (!free(g, plan.map(([a, b, c]) => [a, b, c]), opts)) return [];
  const w = writer(g, opts);
  for (const [a, b, c, block, state] of plan) w.set(a, b, c, block, state);
  return w.cells;
}

// A spruce tree rooted at (x, 1, z): spruce_log trunk on y=1..7; persistent spruce_leaves in cones, radius 2 at y=3..4,
// radius 1 at y=5..8, a tip at y=9..10; outer leaves trimmed unevenly. The trunk is written first; leaves stay out of it.
export function spruceTree(g, x, z, opts = {}) {
  const w = writer(g, opts);
  for (let y = 1; y <= 7; y++) w.set(x, y, z, ...B.log("spruce", "y"));
  const radius = (y) => (y <= 4 ? 2 : y <= 8 ? 1 : 0);
  for (let y = 3; y <= 10; y++) {
    const r = radius(y);
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      const d2 = dx * dx + dz * dz;
      if (d2 > r * r + (r > 0 ? 1 : 0)) continue;
      if (r > 0 && d2 >= r * r && roll(x + dx, y, z + dz, 7) < 0.35) continue;
      w.set(x + dx, y, z + dz, "spruce_leaves", { persistent: "true" });
    }
  }
  return w.cells;
}

// A wall sign with text (a \n splits lines, up to four), black ink, pointing out in `facing`, on the block behind it (the
// wall it hangs from). With no block behind it writes nothing.
export function wallSign(g, x, y, z, facing, text, opts = {}) {
  const f = dirName(facing);
  const [dx, , dz] = DIRS[f];
  if (!g.inBounds(x - dx, y, z - dz) || g.isAir(x - dx, y, z - dz)) return [];
  const w = writer(g, opts);
  w.set(x, y, z, ...B.sign("spruce", String(text).split("\n"), { wall: true, facing: f, color: "black", dataVersion: g.dataVersion }));
  return w.cells;
}
