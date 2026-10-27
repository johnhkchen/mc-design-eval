// Te Whare Āwhina Accommodation (OSM way 44403786): a 1960s-70s reinforced-concrete block for a hostel. Five storeys
// on the crest of the lot, stepping down through setbacks to two on the low eastern wing. Walls are one block thick:
// piers and spandrels of concrete, glass panes in a 3-cell bay grid, air behind the glass, a slab on every floor line.
// The lidar roof is smoothed (3x3 median) and snapped to floor lines, so each tier stands on the one below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_44403786.cells.json`, "utf8"));
const SIZE = [49, 33, 33];

const LINES = [2, 6, 10, 14, 18, 22];                 // floor lines: a storey runs from one line to the next (4 blocks)
const DIRS = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
const NAME = { E: "east", W: "west", S: "south", N: "north" };

const C = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { x, z, g, r }]));
const cell = (x, z) => C.get(`${x},${z}`);

// lidar noise: 3x3 median of the roof over the footprint, then the nearest floor line (ties go down)
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[(s.length - 1) >> 1]; };
const nearest = (v) => LINES.reduce((best, L) => (Math.abs(L - v) < Math.abs(best - v) ? L : best));
for (const c of C.values()) {
  const win = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell(c.x + dx, c.z + dz); if (n) win.push(n.r); }
  c.rs = median(win);
  let T = nearest(c.rs);
  while (T < c.g + 3) T = LINES[LINES.indexOf(T) + 1];   // at least a storey of room above the ground
  c.T = T;                                                // roof slab
  c.p = Math.max(0, Math.min(2, c.rs - T));               // parapet above the slab, up to 2 blocks
  // slab rows: the ground, the roof, and every floor line between. Shared lines keep neighbours' walls on solid rows.
  c.F = new Set([c.g, T, ...LINES.filter((L) => L > c.g && L < T)]);
}

// the faces a column shows at height y: outside the footprint, or above a lower neighbour's roof
const exposed = (c, y) => Object.keys(DIRS).filter((k) => { const n = cell(c.x + DIRS[k][0], c.z + DIRS[k][1]); return !n || y > n.T; });
const along = (k, c) => (k === "E" || k === "W" ? c.z : c.x);

// the front: the face with the most ground-storey wall, entered at the middle of its run
const front = {};
for (const c of C.values()) { const ex = exposed(c, c.g + 1); if (ex.length === 1 && c.g + 1 < c.T) (front[ex[0]] ??= []).push(c); }
const frontDir = Object.keys(front).sort((a, b) => front[b].length - front[a].length)[0];
const run = front[frontDir].sort((a, b) => along(frontDir, a) - along(frontDir, b));
const door = run[run.length >> 1];
const [ox, oz] = DIRS[frontDir];
const [ax, az] = frontDir === "E" || frontDir === "W" ? [0, 1] : [1, 0];

const grid = new Map();
const put = (x, y, z, block, state = null, normal = null) => grid.set(`${x},${y},${z}`, { x, y, z, block, state, normal });

for (const c of C.values()) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");                  // foundation up to this cell's ground
  for (let y = c.g; y <= c.T + c.p; y++) {
    const ex = exposed(c, y);
    if (y > c.T) { if (ex.length) put(c.x, y, c.z, "white_concrete"); continue; }   // parapet
    if (c.F.has(y)) {                                                              // slab rows: string courses, roof, base
      if (y === c.T) put(c.x, y, c.z, ex.length ? "white_concrete" : "stone");
      else put(c.x, y, c.z, ex.length ? (y === c.g ? "polished_andesite" : "white_concrete") : "smooth_stone");
      continue;
    }
    if (!ex.length) continue;                                                      // room air
    const F = [...c.F];
    const b = Math.max(...F.filter((f) => f <= y)), h = Math.min(...F.filter((f) => f > y)) - b, rel = y - b;
    if (rel === h - 1) { put(c.x, y, c.z, "stone"); continue; }                    // spandrel under each slab
    if (ex.length > 1) { put(c.x, y, c.z, "white_concrete"); continue; }           // corner column
    const k = ex[0], lobby = b === c.g && k === frontDir;
    if (along(k, c) % 3 === 0 && !lobby) { put(c.x, y, c.z, "white_concrete"); continue; }   // pier, every third cell
    put(c.x, y, c.z, "light_blue_stained_glass_pane", null, DIRS[k]);
    // a warm light on the floor of some rooms, right behind the glass
    if (rel === 1 && (c.x * 5 + c.z * 3 + y * 7) % 5 === 0) {
      const inner = cell(c.x - DIRS[k][0], c.z - DIRS[k][1]);
      if (inner && !exposed(inner, y).length) put(inner.x, y, inner.z, "glowstone");
    }
  }
}

// entrance: a glazed door in the middle of the front, a canopy over it, a lantern in the lobby
const dState = { facing: NAME[frontDir], hinge: "left", open: "false", powered: "false" };
put(door.x, door.g + 1, door.z, "oak_door", { ...dState, half: "lower" });
put(door.x, door.g + 2, door.z, "oak_door", { ...dState, half: "upper" });
for (const s of [-1, 0, 1]) {
  const n = cell(door.x + ax * s, door.z + az * s);
  if (n && door.g + 3 < n.T) put(n.x, door.g + 3, n.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
const lobbyIn = cell(door.x - ox, door.z - oz);
if (lobbyIn) put(lobbyIn.x, door.g + 1, lobbyIn.z, "lantern", { hanging: "false", waterlogged: "false" });

// the lift overrun: a 2x2 of the top tier, nearest the middle of the lot, with a concrete box and a cap
const Tmax = Math.max(...[...C.values()].map((c) => c.T));
let best = null;
for (const c of C.values()) {
  const sq = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => cell(c.x + dx, c.z + dz));
  if (sq.some((n) => !n || n.T !== Tmax || exposed(n, Tmax).length)) continue;
  const d = Math.hypot(c.x - 24, c.z - 16);
  if (!best || d < best.d) best = { d, sq };
}
if (best) for (const n of best.sq) {
  put(n.x, Tmax + 1, n.z, "light_gray_concrete"); put(n.x, Tmax + 2, n.z, "light_gray_concrete"); put(n.x, Tmax + 3, n.z, "stone");
}

// roof plant: a few units on the low wing's roof
const wing = [...C.values()].filter((c) => c.T === 6 && !exposed(c, 6).length).sort((a, b) => a.x - b.x || a.z - b.z);
for (let i = 3; i < wing.length; i += 7) put(wing[i].x, wing[i].T + 1, wing[i].z, "iron_block");

// panes connect to solid neighbours along the wall only (never across it, into the room or out into the air)
for (const v of grid.values()) if (v.block === "light_blue_stained_glass_pane") {
  const st = {};
  for (const [k, [dx, dz]] of Object.entries(DIRS)) {
    const across = v.normal[0] ? dx !== 0 : dz !== 0;
    st[NAME[k]] = String(!across && grid.has(`${v.x + dx},${v.y},${v.z + dz}`));
  }
  v.state = { ...st, waterlogged: "false" };
}

// nothing hangs in the air: each block has a block under it or beside it (a floor slab spans its room on the walls)
let floating = 0;
for (const v of grid.values()) {
  if (v.y === 0 || grid.has(`${v.x},${v.y - 1},${v.z}`)) continue;
  if (!Object.values(DIRS).some(([dx, dz]) => grid.has(`${v.x + dx},${v.y},${v.z + dz}`))) floating++;
}

const g = new Voxels(SIZE);
for (const v of grid.values()) g.set(v.x, v.y, v.z, v.block, v.state);
const out = g.save(`${DIR}/way_44403786.nbt`);
const glass = [...grid.values()].filter((v) => v.block.includes("pane")).length;
const glow = [...grid.values()].filter((v) => v.block === "glowstone").length;
console.log(JSON.stringify({ frontDir, door: [door.x, door.z], Tmax, tiers: [...new Set([...C.values()].map((c) => c.T))], glass, glow, floating, ...out }));
