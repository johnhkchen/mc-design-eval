// Way 292861512, on the record's own footprint and lidar roofs: a 1970s concrete office block on a volcanic-basalt plinth.
// Three flat tiers (wing 36, main body 40, tower 44) stepped inside each other; storey lines on one datum (y 4 + 4k) so
// the floors run level across the slope; the foundation fills down to each cell's ground. Glass bays sit in the outer
// layer with an air gap behind them, and the core is solid with a slab line per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_292861512.cells.json`, "utf8"));
const SIZE = [52, 58, 43];
const BASE = 4;                                       // storey datum: lines at 4 + 4k; the basalt plinth is below it
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// lidar roof heights -> three flat tiers (noise smoothed away by the thresholds)
const tierOf = (r) => (r <= 37 ? 36 : r <= 42 ? 40 : 44);
const cell = new Map();                               // "x,z" -> { g: ground, T: top of the mass }
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, T: tierOf(r) });
const key = (x, y, z) => `${x},${y},${z}`;
const at = (x, z) => cell.get(`${x},${z}`);
const inside = (x, y, z) => { const c = at(x, z); return !!c && y >= 0 && y < c.T; };
const outward = (x, y, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, y, z + dz));
const along = (dx, x, z) => (dx ? z : x);             // a facade's running coordinate: the bays are counted along it
const storey = (y) => Math.floor((y - BASE) / 4), level = (y) => (y - BASE) % 4;
const clean = (x, z, T, r) => { for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) { const c = at(x + a, z + b); if (!c || c.T !== T) return false; } return true; };

// A window bay: a facade cell at storey level 1-2, one bay off the pilasters, whose cell behind is deep inside the mass
// (so the glass has a closed air gap behind it, not a hole through a thin wing). Returns the outward direction or null.
function windowDir(x, y, z) {
  const c = at(x, z);
  if (!c || y < BASE || y < c.g || y >= c.T - 1) return null;
  const w = level(y); if (w !== 1 && w !== 2) return null;
  const ex = outward(x, y, z);
  if (ex.length !== 1 || along(ex[0][0], x, z) % 3 === 0) return null;
  const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
  if (!inside(ix, y, iz) || !DIRS.every(([ax, az]) => inside(ix + ax, y, iz + az))) return null;
  return ex[0];
}

// Every window bay, its air gap (pockets: lit or dark), and the entrances on the longest street-level runs.
const winSet = new Map(), pockets = new Map();       // winSet: outer key -> dir; pockets: air key -> lit
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = BASE; y < c.T - 1; y++) {
    const dir = windowDir(x, y, z); if (!dir) continue;
    winSet.set(key(x, y, z), dir);
    pockets.set(key(x - dir[0], y, z - dir[1]), level(y) === 1 && (x * 7 + z * 13 + y * 5) % 4 === 0);
  }
}

// street-level facade cells on one face (pilasters included: a door takes a bay, its pilaster and all)
const runsByFace = new Map();
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (c.g > 5 || !inside(x, 5, z)) continue;
  const ex = outward(x, 5, z);
  if (ex.length !== 1) continue;
  const dir = ex[0], line = dir[0] ? x : z, u = dir[0] ? z : x, gk = `${dir[0]},${dir[1]},${line}`;
  if (!runsByFace.has(gk)) runsByFace.set(gk, { dir, line, us: [] });
  runsByFace.get(gk).us.push(u);
}
const runs = [];
for (const { dir, line, us } of runsByFace.values()) {
  us.sort((a, b) => a - b);
  let run = [us[0]];
  for (let i = 1; i <= us.length; i++) {
    if (i < us.length && us[i] === us[i - 1] + 1) run.push(us[i]);
    else { runs.push({ dir, line, us: run }); run = [us[i]]; }
  }
}
runs.sort((a, b) => b.us.length - a.us.length);
const entrances = [];
for (const r of runs) {
  if (entrances.length === 2) break;
  if (entrances.some((e) => e.dir[0] === r.dir[0] && e.dir[1] === r.dir[1])) continue;
  if (r.us.length < 3) continue;
  entrances.push({ dir: r.dir, line: r.line, u: r.us[Math.floor(r.us.length / 2)] });
}
const at3 = (dir, line, u, y) => (dir[0] ? [line, y, u] : [u, y, line]);

// Overrides set by name: the doors, a canopy over each door, which are placed before the core is built.
const overrides = new Map();
const DIRNAME = Object.fromEntries(DIRS.map(([dx, dz, n]) => [`${dx},${dz}`, n]));
for (const e of entrances) {
  const [x, , z] = at3(e.dir, e.line, e.u, 0);
  const facing = DIRNAME[`${e.dir[0]},${e.dir[1]}`];
  for (const [y, half] of [[5, "lower"], [6, "upper"]])
    overrides.set(key(x, y, z), { name: "dark_oak_door", state: { facing, half, hinge: "left", open: "false", powered: "false" } });
  for (const du of [-1, 0, 1]) {
    const [cx, , cz] = at3(e.dir, e.line, e.u + du, 0);
    if (inside(cx, 7, cz) && outward(cx, 7, cz).some((d) => d[0] === e.dir[0] && d[1] === e.dir[1]))
      overrides.set(key(cx, 7, cz), { name: "dark_oak_slab", state: { type: "bottom" } });
  }
}

// Facade and roof materials, by storey role. The pilasters are every third bay; corners are pilasters.
const PANE_ON = "true", PANE_OFF = "false";
function paneState(x, y, z, dir) {
  const sides = dir[0]
    ? { north: inside(x, y, z - 1), south: inside(x, y, z + 1), east: false, west: false }
    : { north: false, south: false, east: inside(x + 1, y, z), west: inside(x - 1, y, z) };
  return Object.fromEntries(Object.entries({ ...sides, waterlogged: false }).map(([k, v]) => [k, v ? PANE_ON : PANE_OFF]));
}
function blockAt(x, y, z) {
  const k = key(x, y, z);
  if (overrides.has(k)) return overrides.get(k);
  if (!inside(x, y, z)) return null;
  const c = at(x, z), ex = outward(x, y, z);
  if (pockets.has(k)) return pockets.get(k) ? { name: "lantern", state: { hanging: "false", waterlogged: "false" } } : null;
  if (y === c.T - 1) return { name: ex.length ? "smooth_stone" : "gray_concrete" };   // cornice on the edge, roof membrane inside
  if (!ex.length) return { name: "stone" };                                          // core
  if (y < c.g) return { name: "stone" };                                             // foundation down to the cell's ground
  if (y < BASE) return { name: "polished_basalt" };                                  // basalt plinth
  const w = level(y), pil = ex.length === 2 || along(ex[0][0], x, z) % 3 === 0;
  const win = winSet.has(k);
  if (storey(y) === 0) {                                                             // shopfront storey
    if ((w === 1 || w === 2) && !pil && win) return { name: "glass_pane", state: paneState(x, y, z, ex[0]) };
    return { name: "polished_basalt" };
  }
  if (w === 0) return { name: "smooth_stone" };                                      // string course
  if (w === 3) return { name: "light_gray_concrete" };                              // spandrel
  if (pil) return { name: "white_concrete" };                                       // pilaster
  if (win) return { name: "light_blue_stained_glass_pane", state: paneState(x, y, z, ex[0]) };
  return { name: "light_gray_concrete" };
}

const g = new Voxels(SIZE);
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.T; y++) { const b = blockAt(x, y, z); if (b) g.set(x, y, z, b.name, b.state); }
  if (DIRS.some(([dx, dz]) => !at(x + dx, z + dz))) g.set(x, c.T, z, "white_concrete");   // parapet on the footprint edge
}

// Roof plant: iron-block units on the main tier's clean roof, and a mast on the tower.
let plant = 0;
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (c.T !== 40 || x % 6 || z % 6 || !clean(x, z, 40, 2)) continue;
  for (const y of [40, 41]) for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(x + a, y, z + b, "iron_block");
  plant++;
}
let mast = null;
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (c.T !== 44 || !clean(x, z, 44, 1)) continue;
  if (!mast || Math.abs(x - 32) + Math.abs(z - 29) < Math.abs(mast[0] - 32) + Math.abs(mast[1] - 29)) mast = [x, z];
}
if (mast) {
  const [mx, mz] = mast;
  for (let y = 44; y <= 47; y++) g.set(mx, y, mz, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  g.set(mx, 48, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const stats = g.save(`${FILL}/way_292861512.nbt`);
console.log(JSON.stringify({ cells: cells.length, windows: winSet.size, pockets: pockets.size, lit: [...pockets.values()].filter(Boolean).length, entrances: entrances.length, plant, mast, ...stats }));
