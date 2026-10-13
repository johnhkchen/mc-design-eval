// Helpers for plan.md VOCABULARY (h1 set). Each takes the grid first, then its position; boxes are inclusive
// [x0, y0, z0, x1, y1, z1]. A helper writes only inside its footprint, only into air (gardenBed also replaces
// ground at its soil layer), and never below its footprint. Each returns { placed, refused }: placed is
// [x, y, z, block] per write, refused is writes skipped because the cell was not air.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ns = (b) => (b.startsWith("minecraft:") ? b : `minecraft:${b}`);
const GROUND = ["grass_block", "coarse_dirt", "podzol", "dirt", "dirt_path", "gravel"].map(ns);
// blocks a fence does not join to (stairs, slabs, doors, signs and the like)
const NOT_LINKED = /(stairs|slab|trapdoor|door|sign|lantern|ladder|cauldron|composter|water|carpet|torch|campfire|pressure_plate|wheat|carrots|potatoes|beetroots|barrel)$/;

const norm = ([x0, y0, z0, x1, y1, z1]) => [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)];
const inside = (b, x, y, z) => x >= b[0] && y >= b[1] && z >= b[2] && x <= b[3] && y <= b[4] && z <= b[5];
const bbox = (cells) => {
  const axes = [0, 1, 2];
  return [...axes.map((i) => Math.min(...cells.map((c) => c[i]))), ...axes.map((i) => Math.max(...cells.map((c) => c[i])))];
};
const cellsOf = (b) => {
  const out = [];
  for (let x = b[0]; x <= b[3]; x++) for (let y = b[1]; y <= b[4]; y++) for (let z = b[2]; z <= b[5]; z++) out.push([x, y, z]);
  return out;
};
const done = (w) => ({ placed: w.placed, refused: w.refused });

// One writer per helper: the footprint guard, and the air-only rule. pair = [block, state?, nbt?] from B, or a bare id.
function writer(g, foot) {
  const w = { placed: [], refused: [] };
  w.put = (x, y, z, pair, over = []) => {
    if (!inside(foot, x, y, z)) throw new Error(`${pair} at ${x},${y},${z} is outside its footprint ${foot}`);
    const [block, state, nbt] = Array.isArray(pair) ? pair : [pair];
    const cur = ns(g.blockAt(x, y, z));
    if (!g.isAir(x, y, z) && over !== "*" && !over.includes(cur)) { w.refused.push([x, y, z, ns(block)]); return false; }
    g.set(x, y, z, block, state, nbt);
    w.placed.push([x, y, z, ns(block)]);
    return true;
  };
  return w;
}

// Fence connections: a fence joins each neighbour that is a fence, wall or full block. Set after neighbours are placed,
// and only on cells that really hold this fence (a refused cell is someone else's block).
function linkFences(g, cells, mat) {
  const joins = (x, y, z, dx, dz) => { const n = g.blockAt(x + dx, y, z + dz); return n !== "minecraft:air" && !NOT_LINKED.test(n); };
  for (const [x, y, z] of cells) {
    if (g.blockAt(x, y, z) !== ns(`${mat}_fence`)) continue;
    const state = { north: joins(x, y, z, 0, -1), east: joins(x, y, z, 1, 0), south: joins(x, y, z, 0, 1), west: joins(x, y, z, -1, 0) };
    g.set(x, y, z, `${mat}_fence`, Object.fromEntries(Object.entries(state).map(([k, v]) => [k, String(v)])));
  }
}

const fits = (foot, room) => {
  if (!room) return;
  const r = norm(room);
  if (!inside(r, foot[0], foot[1], foot[2]) || !inside(r, foot[3], foot[4], foot[5])) throw new Error(`footprint ${foot} does not fit room ${r}`);
};

// A solid wall box: bricks, with a polished_deepslate plinth on its lowest two rows; openings stay air.
export function brickWall(g, box, plinth = true, openings = []) {
  const b = norm(box), w = writer(g, b), open = openings.map(norm);
  for (const [x, y, z] of cellsOf(b)) {
    if (open.some((o) => inside(o, x, y, z))) continue;
    w.put(x, y, z, plinth && y < b[1] + 2 ? "polished_deepslate" : "bricks");
  }
  return done(w);
}

// A shop pilaster: stripped dark oak log to y1 - 1, a dark oak planks capital at y1, and an upside-down dark oak
// stair on the capital's street side (front = the street direction, the stair's lip points that way).
export function pilaster(g, x, z, { y0 = 5, y1 = 12, front = "north" } = {}) {
  const dz = DIRS[front][2], w = writer(g, norm([x, y0, z, x, y1, z + dz]));
  for (let y = y0; y < y1; y++) w.put(x, y, z, B.log("stripped_dark_oak", "y"));
  w.put(x, y1, z, B.block("dark_oak_planks"));
  w.put(x, y1, z + dz, B.stairs("dark_oak", OPPOSITE[front], "top"));
  return done(w);
}

// A hanging shop sign: a dark oak fence arm at y + 1 from (x, z) back to (x, z + 1) (joins the pilaster at x - 1),
// and the hanging sign below the arm's front end. rotation 8 faces north, the street.
export function hangingSign(g, x, z, y, text, { rotation = 8 } = {}) {
  const lines = Array.isArray(text) ? text : [text];
  const arm = [[x, y + 1, z], [x, y + 1, z + 1]], w = writer(g, norm([x, y, z, x, y + 1, z + 1]));
  for (const [ax, ay, az] of arm) w.put(ax, ay, az, ["dark_oak_fence", {}]);
  w.put(x, y, z, B.sign("dark_oak", lines, { wall: false, hanging: true, rotation, dataVersion: g.dataVersion }));
  linkFences(g, arm, "dark_oak");
  return done(w);
}

// A pair of open dark oak trapdoors either side of a window: x = the window's west column, y = its bottom row, z = the
// shutter plane. face = the way the facade looks out (north = the street), so each shutter hinges on the wall side.
export function shutterPair(g, x, y, z, face = "north", { width = 2, height = 3 } = {}) {
  const w = writer(g, norm([x - 1, y, z, x + width, y + height - 1, z]));
  for (const sx of [x - 1, x + width]) for (let dy = 0; dy < height; dy++) w.put(sx, y + dy, z, B.trapdoor("dark_oak", OPPOSITE[face], "bottom", true));
  return done(w);
}

// Bricks across the keeper's aisle at each x in xs (one number or an array), y0..y1, at plane z.
export function aislePartition(g, xs, z, { y0 = 5, y1 = 12 } = {}) {
  const list = [xs].flat(), w = writer(g, norm([Math.min(...list), y0, z, Math.max(...list), y1, z]));
  for (const x of list) for (let y = y0; y <= y1; y++) w.put(x, y, z, "bricks");
  return done(w);
}

// A straight spruce stair flight of `width` cells: step i sits at y0 + i, starting at (x, z) and walking in dir (its
// facing is the walking-up direction). stringer: a bottom slab under each step after the first (a solid flight).
// rails: which open sides get a dark oak fence rail at step height + 1, "neg" (x - 1 or z - 1) and/or "pos"; the
// top step gets none, so the arrival stays open. room: the box the flight must fit inside (throws if not).
export function stairFlight(g, x, z, y0, y1, dir, { width = 2, rails = ["neg", "pos"], stringer = true, room = null } = {}) {
  const n = y1 - y0 + 1, ux = DIRS[dir][0], uz = DIRS[dir][2], ax = uz ? 1 : 0, az = uz ? 0 : 1;
  const at = (i, k) => [x + i * ux + k * ax, y0 + i, z + i * uz + k * az];
  const steps = [], under = [], rail = [];
  for (let i = 0; i < n; i++) for (let k = 0; k < width; k++) steps.push(at(i, k));
  if (stringer) for (let i = 1; i < n; i++) for (let k = 0; k < width; k++) { const [a, b, c] = at(i, k); under.push([a, b - 1, c]); }
  for (let i = 0; i < n - 1; i++) for (const side of rails) { const [a, b, c] = at(i, side === "neg" ? -1 : width); rail.push([a, b + 1, c]); }
  const foot = bbox([...steps, ...under, ...rail]);
  fits(foot, room);
  const w = writer(g, foot);
  for (const [a, b, c] of steps) w.put(a, b, c, B.stairs("spruce", dir, "bottom"));
  for (const [a, b, c] of under) w.put(a, b, c, B.slab("spruce", "bottom"));
  for (const [a, b, c] of rail) w.put(a, b, c, ["dark_oak_fence", {}]);
  linkFences(g, rail, "dark_oak");
  return done(w);
}

// A ladder on a wall at (x, z), from y0 to y1, facing (away from the wall, north = the wall is south of it), and an
// open dark oak trapdoor one cell out in front of its top (the loft hatch). cut: the hatch may replace a floor cell.
export function ladderHatch(g, x, z, y0, y1, { facing = "north", cut = false, room = null } = {}) {
  const ladders = [], hatch = [x + DIRS[facing][0], y1 + 1, z + DIRS[facing][2]];
  for (let y = y0; y <= y1; y++) ladders.push([x, y, z]);
  const foot = bbox([...ladders, hatch]);
  fits(foot, room);
  const w = writer(g, foot);
  for (const [a, b, c] of ladders) w.put(a, b, c, ["ladder", { facing }]);
  w.put(hatch[0], hatch[1], hatch[2], B.trapdoor("dark_oak", facing, "bottom", true), cut ? "*" : []);
  return done(w);
}

// A garden bed: the box (x0..x1, z0..z1) at soil layer y (default 5). Farmland, with a water source at waterAt = [x, z]
// that replaces ground; crop (carrots, potatoes, beetroots, wheat) fully grown above the farmland at y + 1; and a
// ring of bottom spruce slabs at y + 1 round the bed (the border is part of the footprint).
export function gardenBed(g, x0, z0, x1, z1, waterAt, crop, { y = 5 } = {}) {
  const bed = norm([x0, y, z0, x1, y, z1]), foot = [bed[0] - 1, y, bed[2] - 1, bed[3] + 1, y + 1, bed[5] + 1];
  const w = writer(g, foot), age = String({ carrots: 7, potatoes: 7, beetroots: 3, wheat: 7 }[crop] ?? 0);
  const [wx, wz] = waterAt;
  for (const [x, , z] of cellsOf(bed)) {
    if (x === wx && z === wz) w.put(x, y, z, ["water", {}], GROUND);
    else w.put(x, y, z, ["farmland", { moisture: "7" }], GROUND);
  }
  for (const [x, , z] of cellsOf(bed)) {
    if (g.blockAt(x, y, z) === "minecraft:farmland") w.put(x, y + 1, z, [crop, { age }]);
  }
  for (let x = foot[0]; x <= foot[3]; x++) for (let z = foot[2]; z <= foot[5]; z++) {
    if (x < bed[0] || x > bed[3] || z < bed[2] || z > bed[5]) w.put(x, y + 1, z, B.slab("spruce", "bottom"));
  }
  return done(w);
}

// A double spruce fence gate, both leaves facing the same way, in the fence line at y: cells (x, z) and the one
// next to it across the line (x + 1 for a north/south facing gate, z + 1 for east/west).
export function gateDouble(g, x, z, facing = "south", { y = 6 } = {}) {
  const ax = facing === "north" || facing === "south" ? 1 : 0, az = 1 - ax;
  const cells = [0, 1].map((k) => [x + k * ax, y, z + k * az]), w = writer(g, bbox(cells));
  for (const [a, b, c] of cells) w.put(a, b, c, ["spruce_fence_gate", { facing, in_wall: "false", open: "false" }]);
  return done(w);
}

// Compost and stores against a rear wall at (x, z), a 3 x 2 block at y (default 6): two composters on the back row
// with barrels between and in front of them. Row 1 is the back row (the one against the wall).
export function compostStore(g, x, z, { y = 6 } = {}) {
  const rows = ["CBC", "BB."], legend = { C: ["composter", { level: "1" }], B: ["barrel", { facing: "up", open: "false" }] };
  const w = writer(g, [x, y, z, x + 2, y, z + 1]);
  rows.forEach((row, dz) => [...row].forEach((ch, dx) => { if (legend[ch]) w.put(x + dx, y, z + dz, legend[ch]); }));
  return done(w);
}
