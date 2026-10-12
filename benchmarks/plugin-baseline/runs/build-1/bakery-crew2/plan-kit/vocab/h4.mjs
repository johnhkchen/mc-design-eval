// Vocabulary helpers, batch h4 (plan.md VOCABULARY). Each takes its position (and facing) as arguments and writes only
// into air inside its own footprint, so it never overwrites an earlier part. Each returns the cells it wrote, [x, y, z].
import { B, DIRS, OPPOSITE, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// The one writer every helper uses: a block goes in only where the cell is air, inside the box, and not in a skipped cell.
function site(g, from, to, skip = new Set()) {
  const lo = from.map((v, i) => Math.min(v, to[i])), hi = from.map((v, i) => Math.max(v, to[i]));
  const wrote = [];
  const put = (x, y, z, [block, state, nbt]) => {
    const inside = [x, y, z].every((v, i) => v >= lo[i] && v <= hi[i]);
    if (!inside || skip.has(`${x},${y},${z}`) || !g.inBounds(x, y, z) || !g.isAir(x, y, z)) return false;
    g.set(x, y, z, block, state, nbt);
    wrote.push([x, y, z]);
    return true;
  };
  return { put, wrote };
}

// A Mann brace: one spruce stair, top half, its full-height back toward the post it braces.
const brace = (s, x, y, z, toward) => s.put(x, y, z, B.stairs("spruce", toward, "top"));

/**
 * A half-timber wall: posts, sill (y0), breast rail (y0+1), head plate (y1) and white daub between the posts.
 * axis "x": the wall runs along x at z = fixed; axis "z": along z at x = fixed. a0..a1 are the wall ends (use posts there).
 * windows: [a0, a1, ya, yb] boxes left unset. braced: post-to-post panel indices (from the low end) that get a Mann brace.
 */
export function fachwerkWall(g, axis, fixed, a0, a1, y0, y1, posts, windows = [], braced = []) {
  const at = (p, y) => (axis === "x" ? [p, y, fixed] : [fixed, y, p]);
  const xs = [...posts].sort((p, q) => p - q);
  const skip = new Set();
  for (const [wa, wb, ya, yb] of windows) for (let p = wa; p <= wb; p++) for (let y = ya; y <= yb; y++) skip.add(at(p, y).join());
  const s = site(g, at(a0, y0), at(a1, y1), skip);
  // posts first, then beams, braces and daub: each piece only fills the cells the ones before it left open
  for (const p of xs) for (let y = y0 + 1; y <= y1; y++) s.put(...at(p, y), ["stripped_spruce_log", { axis: "y" }]);
  const beam = ["stripped_spruce_wood", { axis }];
  for (let p = a0; p <= a1; p++) for (const y of [y0, y0 + 1, y1]) s.put(...at(p, y), beam);
  const spans = xs.slice(0, -1).map((p, k) => [p + 1, xs[k + 1] - 1]);      // the cells between each pair of posts
  const [low, high] = axis === "x" ? ["west", "east"] : ["north", "south"];
  spans.forEach(([p0, p1], k) => {
    if (!braced.includes(k)) return;
    const isLow = k < spans.length / 2;
    brace(s, ...at(isLow ? p0 : p1, y0 + 2), isLow ? low : high);
  });
  for (const [p0, p1] of spans) for (let p = p0; p <= p1; p++) for (let y = y0 + 2; y <= y1 - 1; y++) s.put(...at(p, y), ["white_wool"]);
  return s.wrote;
}

/**
 * A gable frame in the plane z: a collar beam (stripped spruce, axis x) at y = collar[2] from collar[0] to collar[1],
 * and a king post under its middle (three cells, y-3..y-1). skip: "x,y,z" strings left unset (e.g. the reserved cells).
 */
export function gableFrame(g, z, { king = true, collar = [8, 14, 14], skip = [] } = {}) {
  const [x0, x1, y] = collar, mid = Math.floor((x0 + x1) / 2);
  const s = site(g, [x0, y - 3, z], [x1, y, z], new Set(skip));
  for (let x = x0; x <= x1; x++) s.put(x, y, z, ["stripped_spruce_wood", { axis: "x" }]);
  if (king) for (let k = y - 3; k <= y - 1; k++) s.put(mid, k, z, ["stripped_spruce_log", { axis: "y" }]);
  return s.wrote;
}

/**
 * Open trapdoors lying flat on a wall: one per row (y0..y1) at column x, facing faceDir (the wall side).
 * second: a second column, for two per row (one leaf each side of a window).
 */
export function shutterPair(g, x, y0, y1, z, faceDir, { second } = {}) {
  const cols = second == null ? [x] : [x, second];
  const s = site(g, [Math.min(...cols), y0, z], [Math.max(...cols), y1, z]);
  for (let y = y0; y <= y1; y++) for (const cx of cols) s.put(cx, y, z, B.trapdoor("spruce", faceDir, "bottom", true));
  return s.wrote;
}

/**
 * A sign arm on the street side: spruce fences at (x,y,z) and (x,y,z-1), a hanging sign under the second one at y-1, and a
 * hanging lantern under the first (it hangs from the fence above). rotation: the sign's standing direction (4 = west).
 */
export function signArm(g, x, y, z, { text = "Bäckerei", rotation = 4 } = {}) {
  const s = site(g, [x, y - 1, z - 1], [x, y, z]);
  s.put(x, y, z, ["spruce_fence", { north: "true", east: "false", south: "false", west: "false", waterlogged: "false" }]);
  s.put(x, y, z - 1, ["spruce_fence", { north: "false", east: "false", south: "true", west: "false", waterlogged: "false" }]);
  s.put(x, y - 1, z - 1, B.sign("spruce", [text], { wall: false, hanging: true, rotation, dataVersion: g.dataVersion }));
  s.put(x, y - 1, z, B.lantern(true));
  return s.wrote;
}

/**
 * The wing roof: a gable over one rect (its wall footprint) with its eave at course y, ridge along z, slate, white gable
 * ends and a deepslate brick ridge cap. overhang: per side. Writes only into air (every existing block is protected).
 */
export function roofWing(g, rect = [17, 13, 21, 22], y = 6, overhang = { west: 0, north: 1, south: 1, east: 1 }) {
  const side = (d) => (typeof overhang === "object" ? overhang[d] ?? 1 : overhang);
  const [x0, z0, x1, z1] = [rect[0] - side("west"), rect[1] - side("north"), rect[2] + side("east"), rect[3] + side("south")];
  const protect = new Set();
  for (const c of g.cells.values()) if (!g.isAir(...c.pos)) protect.add(c.pos.join());
  const before = new Map([...g.cells.values()].map((c) => [c.pos.join(), JSON.stringify([c.block, c.state])]));
  // the plan's slate palette, spelled out: the tool's own slate has dark oak verges and a tuff eave, and its contrast check may swap it
  const slate = { mix: [["cobbled_deepslate", 45], ["deepslate_tiles", 35], ["polished_deepslate", 20]], eave: "polished_blackstone_bricks", verge: "spruce" };
  const r = roof(g, [rect], "gable", { y, material: slate, contrast: false, ridgeAxis: "z", overhang, gable: "white_wool", ridge: "deepslate_brick_slab", protect });
  if (r.shift?.some(Boolean)) throw new Error(`roofWing: the overhang grew the site (shift ${r.shift}); give it a larger grid`);
  const changed = [...g.cells.values()].filter((c) => before.get(c.pos.join()) !== JSON.stringify([c.block, c.state]));
  // the roof can spill past its own footprint (a corner detail): those cells were air, so give them back as air
  const placed = [];
  for (const c of changed) {
    const [x, , z] = c.pos;
    if (x < x0 || x > x1 || z < z0 || z > z1) g.unset(...c.pos);
    else placed.push(c.pos);
  }
  return placed;
}

/**
 * Yard fence along straight runs [x0, z0, x1, z1] at height y, with gates [[x, z, facing]] in the runs (a gate's cell is
 * not fenced). Each fence cell's connections follow its neighbours: fence, gate line, or an existing fence.
 */
export function yardFence(g, runs, { y = 1, gates = [] } = {}) {
  const gateFacing = new Map(gates.map(([x, z, facing]) => [`${x},${z}`, facing]));
  const fence = new Set();
  for (const [x0, z0, x1, z1] of runs)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) if (!gateFacing.has(`${x},${z}`)) fence.add(`${x},${z}`);
  const all = [...fence, ...gateFacing.keys()].map((k) => k.split(",").map(Number));
  const s = site(g, [Math.min(...all.map((c) => c[0])), y, Math.min(...all.map((c) => c[1]))], [Math.max(...all.map((c) => c[0])), y, Math.max(...all.map((c) => c[1]))]);
  const DIR = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  const joins = (x, z, d) => {
    const [dx, dz] = DIR[d], k = `${x + dx},${z + dz}`;
    if (fence.has(k)) return true;
    if (gateFacing.has(k)) return ["east", "west"].includes(gateFacing.get(k)) === (d === "north" || d === "south");   // a gate joins across its line
    return g.blockAt(x + dx, y, z + dz).endsWith("_fence");
  };
  for (const k of fence) {
    const [x, z] = k.split(",").map(Number);
    const state = Object.fromEntries(Object.keys(DIR).map((d) => [d, String(joins(x, z, d))]));
    s.put(x, y, z, ["spruce_fence", { ...state, waterlogged: "false" }]);
  }
  for (const [x, z, facing] of gates) s.put(x, y, z, ["spruce_fence_gate", { facing, in_wall: "false", open: "false" }]);
  return s.wrote;
}

/** A yard prop group, 4 x 3 from (x0, z0) at height y: two barrels, a hay stack, a composter and a grindstone. */
export function propCluster(g, x0, z0, y = 1) {
  const s = site(g, [x0, y, z0], [x0 + 3, y + 1, z0 + 2]);
  const barrel = ["barrel", { facing: "up", open: "false" }], hay = ["hay_block", { axis: "y" }];
  s.put(x0, y, z0, barrel);
  s.put(x0 + 1, y, z0, barrel);
  s.put(x0 + 2, y, z0, hay);
  s.put(x0 + 2, y + 1, z0, hay);
  s.put(x0 + 3, y, z0 + 1, hay);
  s.put(x0, y, z0 + 2, ["composter"]);
  s.put(x0 + 3, y, z0, ["grindstone", { face: "floor", facing: "north" }]);
  return s.wrote;
}

/** Flour sacks: two barrels stacked (facing up) with a hay bale on top. One cell wide, three high, from (x, y, z). */
export function flourStore(g, x, y, z) {
  const s = site(g, [x, y, z], [x, y + 2, z]);
  s.put(x, y, z, ["barrel", { facing: "up", open: "false" }]);
  s.put(x, y + 1, z, ["barrel", { facing: "up", open: "false" }]);
  s.put(x, y + 2, z, ["hay_block", { axis: "y" }]);
  return s.wrote;
}

/**
 * A tile stove (Kachelofen): a 2x2 brick body two high from (x, y, z), a lit furnace firebox in the front bottom cell,
 * and a cap course on top: brick stairs on the front (the lip toward the room) and brick slabs at the back.
 * facing: the side the front faces, which is the room (north, south, east, west).
 */
export function tileStove(g, x, y, z, facing = "north") {
  const s = site(g, [x, y, z], [x + 1, y + 2, z + 1]);
  const isFront = (cx, cz) => (facing === "north" ? cz === z : facing === "south" ? cz === z + 1 : facing === "west" ? cx === x : cx === x + 1);
  const [fx, fz] = [facing === "east" ? x + 1 : x, facing === "south" ? z + 1 : z];
  for (let cx = x; cx <= x + 1; cx++) for (let cz = z; cz <= z + 1; cz++) {
    s.put(cx, y + 1, cz, ["bricks"]);
    if (cx !== fx || cz !== fz) s.put(cx, y, cz, ["bricks"]);
    s.put(cx, y + 2, cz, isFront(cx, cz) ? B.stairs("brick", OPPOSITE[facing], "bottom") : B.slab("brick", "bottom"));
  }
  s.put(fx, y, fz, ["furnace", { facing, lit: "true" }]);
  return s.wrote;
}

/**
 * An attic ladder from (x, y0) to (x, y1) at z, facing facing: the ladder hangs against a backing of spruce planks on the
 * far side (y0..y1-1). Plan: atticLadder(g, 9, 7, 11, 20) gives ladder (9,7..11,20) facing north, backing (9,7..10,21).
 */
export function atticLadder(g, x, y0, y1, z, facing = "north") {
  const back = DIRS[OPPOSITE[facing]];
  const bx = x + back[0], bz = z + back[2];
  const s = site(g, [Math.min(x, bx), y0, Math.min(z, bz)], [Math.max(x, bx), y1, Math.max(z, bz)]);
  for (let y = y0; y <= y1; y++) s.put(x, y, z, ["ladder", { facing }]);
  for (let y = y0; y < y1; y++) s.put(bx, y, bz, ["spruce_planks"]);
  return s.wrote;
}
