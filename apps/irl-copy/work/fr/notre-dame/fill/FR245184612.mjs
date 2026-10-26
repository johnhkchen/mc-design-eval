// FR245184612: a Haussmann-era residential block (1869, seven storeys) on the lidar footprint. Pale limestone walls
// (calcite) with smooth-stone string courses and lintels; a slate mansard on the highest core (its top at y 30, seven
// storeys of 4 blocks from a 2-block plinth); flat stone-capped wings lower down. Storey floors sit on y = 2 + 4k, so
// every string course and lintel falls on the same line across the block. Windows are glass panes in the outer
// course with an air pocket behind them and a stone floor and lintel either side; a few pockets hold glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184612.cells.json`, "utf8"));

const W = 32, H = 35, D = 32;
const TIERS = [14, 18, 22, 26, 30];   // lidar roofs smoothed into storey-aligned tops (every top sits on a storey line)
const CORE = 30;                      // the highest tier: the mansard
const FIRST_FLOOR = 2;                // storey floors at y = 2, 6, ..., 26; string course on each, lintel 3 above
const MANSARD = 26;                   // the seventh storey is under the slate

const fp = new Map();                 // "x,z" -> { g, lidar, T }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, T: 0 });
const cell = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => cell(x, z)?.T ?? 0;   // no building: open air
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// Smooth the lidar: 5x5 median (the 3x3 left a ragged stair on the wings), then snap to the nearest tier.
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = cell(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = TIERS.reduce((best, t) => (Math.abs(t - med) < Math.abs(best - med) ? t : best));
}

// Distance inward from the core's edge (edge = 0), so the mansard steps in one block per course.
const coreDist = new Map(), queue = [];
for (const [key, c] of fp) {
  if (c.T !== CORE) continue;
  const [x, z] = key.split(",").map(Number);
  if (DIRS.some(([, dx, dz]) => topAt(x + dx, z + dz) !== CORE)) { coreDist.set(key, 0); queue.push(key); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i].split(",").map(Number), d = coreDist.get(queue[i]);
  for (const [, dx, dz] of DIRS) {
    const k = `${x + dx},${z + dz}`;
    if (topAt(x + dx, z + dz) === CORE && !coreDist.has(k)) { coreDist.set(k, d + 1); queue.push(k); }
  }
}
const cdist = (x, z) => coreDist.get(`${x},${z}`) ?? 99;
// The way out at core distance d: the non-core side for the edge, else the neighbour one step nearer the edge.
function outwardOf(x, z, d) {
  for (const [name, dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (d === 0 ? topAt(nx, nz) !== CORE : cdist(nx, nz) === d - 1) return name;
  }
  return "north";
}

// The sides of a cell at height y that face air (no building cell beside it that reaches that row).
const exposedAt = (x, z, y) => DIRS.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y).map(([n]) => n);

// The solid block of a footprint cell at y, before windows, doors and chimneys.
function solidAt(x, z, y) {
  const c = cell(x, z);
  if (!c || y < 0 || y >= c.T) return null;
  if (y < FIRST_FLOOR) return ["stone_bricks"];                     // the plinth
  if (c.T === CORE && y >= MANSARD) {
    const k = y - MANSARD, d = cdist(x, z);
    if (d >= k + 1) return ["deepslate_tiles"];                     // the slate deck, inside the step
    if (d === k) return ["deepslate_tile_stairs", { facing: outwardOf(x, z, d), half: "bottom", shape: "straight", waterlogged: "false" }];
    return null;                                                    // the slope's open air
  }
  const ex = exposedAt(x, z, y).length > 0, row = (y - FIRST_FLOOR) % 4;
  if (y === c.T - 1) return ex ? ["smooth_stone"] : ["deepslate_tiles"];   // cornice on the facade, roof inside
  if (ex && (row === 0 || row === 3)) return ["smooth_stone"];             // string course, lintel
  return ["calcite"];
}

const vox = new Map();                 // "x,y,z" -> [block, state] (absent = air)
const key3 = (x, y, z) => `${x},${y},${z}`;
const get = (x, y, z) => vox.get(key3(x, y, z));
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.T; y++) { const s = solidAt(x, z, y); if (s) vox.set(key3(x, y, z), s); }
  // a parapet course on the flat tops of the lower wings
  if (c.T < CORE && exposedAt(x, z, c.T).length) vox.set(key3(x, c.T, z), ["stone_brick_slab", { type: "bottom", waterlogged: "false" }]);
}

// The door: the middle of the longest run of street-facing ground-floor cells (north, south, west or east).
const runs = Object.fromEntries(DIRS.map(([n]) => [n, []]));
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (c.T <= FIRST_FLOOR + 3) continue;
  for (const [n, dx, dz] of DIRS) if (!cell(x + dx, z + dz)) runs[n].push([x, z]);
}
const [doorDir, doorRun] = Object.entries(runs).reduce((a, b) => (b[1].length > a[1].length ? b : a));
const [dX, dZ] = doorRun.sort((a, b) => a[0] - b[0] || a[1] - b[1])[Math.floor(doorRun.length / 2)];
const isDoor = (x, z) => x === dX && z === dZ;
const DOOR = { facing: doorDir, hinge: "left", open: "false", powered: "false" };
vox.set(key3(dX, FIRST_FLOOR, dZ), ["dark_oak_door", { ...DOOR, half: "lower" }]);
vox.set(key3(dX, FIRST_FLOOR + 1, dZ), ["dark_oak_door", { ...DOOR, half: "upper" }]);
vox.set(key3(dX, FIRST_FLOOR + 2, dZ), ["calcite"]);                               // the transom over the door

// Windows: glass in the outer course on the rows between a string course and the next lintel, piers every third
// cell along each facade, and an air pocket behind each pane (floor and lintel stay), some with glowstone.
const pockets = [];
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = FIRST_FLOOR; y < c.T; y++) {
    const row = (y - FIRST_FLOOR) % 4;
    if (row === 0 || row === 3 || isDoor(x, z)) continue;
    const ex = exposedAt(x, z, y);
    if (!ex.length) continue;
    const dir = ex[0], along = dir === "north" || dir === "south" ? x : z;
    if (along % 3 === 0) continue;                                    // pier
    if (get(x, y, z)?.[0] !== "calcite") continue;
    vox.set(key3(x, y, z), ["glass_pane", {}]);
    const [, dx, dz] = DIRS.find(([n]) => n === dir);
    const ix = x - dx, iz = z - dz;
    if (cell(ix, iz) && topAt(ix, iz) > y && exposedAt(ix, iz, y).length === 0) pockets.push([ix, y, iz, row, x, z]);
  }
}
for (const [ix, y, iz, row, x, z] of pockets) {
  const light = row === 1 && (x * 7 + z * 3) % 9 === 0;               // a warm glowstone behind one window in nine
  if (light) vox.set(key3(ix, y, iz), ["glowstone"]);
  else vox.delete(key3(ix, y, iz));
}

// Chimney stacks on the slate deck, a few per block.
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (c.T !== CORE || cdist(x, z) < 5 || x % 6 !== 2 || z % 6 !== 2) continue;
  for (let y = CORE; y <= 33; y++) vox.set(key3(x, y, z), ["bricks"]);
  vox.set(key3(x, 34, z), ["stone_brick_slab", { type: "bottom", waterlogged: "false" }]);
}

// Panes connect to solid neighbours and to each other, not to air or light.
const solidNb = (x, y, z) => { const b = get(x, y, z)?.[0]; return !!b && b !== "glowstone" && b !== "shroomlight"; };
for (const [k, s] of vox) {
  if (s[0] !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  s[1] = {
    north: String(solidNb(x, y, z - 1)), south: String(solidNb(x, y, z + 1)),
    west: String(solidNb(x - 1, y, z)), east: String(solidNb(x + 1, y, z)), waterlogged: "false",
  };
}

const g = new Voxels([W, H, D]);
for (const [k, [block, state]] of vox) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const stats = g.save(`${DIR}/FR245184612.nbt`);
console.log(`door ${doorDir} at (${dX}, ${dZ}); ${stats.blocks} blocks, ${stats.palette} block states`);
