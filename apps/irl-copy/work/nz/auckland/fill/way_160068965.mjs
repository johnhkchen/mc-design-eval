// The Docks: a waterfront commercial block of the 1990s (white cladding, blue glazing, a dark-wood shopfront on a
// basalt-grey plinth), stepped from a 32-block tower down to lower wings. Each footprint cell is a solid column up to its
// tier top (rounded to a 4-block storey from the lidar's median); facade bands are chosen per exposed face, windows sit
// one block proud of an air gap, and the tower's roof gets plant boxes while the wings get terrace planters.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_160068965.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 74, D = 63, H = 45;

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { g: ground, r: roof });

// Tier tops: the median roof of the 5x5 around each cell (lidar noise out, zero pixels ignored), rounded to a storey.
const top = new Map();
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number), v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const c = cell.get(`${x + dx},${z + dz}`); if (c && c.r > 0) v.push(c.r);
  }
  v.sort((a, b) => a - b);
  const med = v.length ? v[v.length >> 1] : 4;
  top.set(key, Math.min(32, Math.max(4, Math.round(med / 4) * 4)));
}
const T = (x, z) => top.get(`${x},${z}`);

// Faces open to the air or to a lower neighbour at height y (outward direction + its name).
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = T(x + dx, z + dz); return n === undefined || y >= n; });

const g = new Voxels([W, H, D]);

// Pass 1: solid columns, facade bands per exposed face, roof membrane on the interior top.
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number), t = T(x, z);
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, z, y);
    if (!ex.length) { g.set(x, y, z, y === t - 1 ? "smooth_stone" : "light_gray_concrete"); continue; }
    const [dx] = ex[0], along = dx !== 0 ? z : x;
    let block;
    if (y === 0) block = "polished_andesite";                                   // base course
    else if (y === t - 1) block = "stone_bricks";                               // cornice
    else if (y < 4) block = y === 3 ? "stone_bricks" : along % 3 === 0 ? "dark_oak_planks" : "light_blue_stained_glass"; // shopfront
    else if (y % 4 === 0) block = "light_gray_concrete";                        // storey line
    else if (y % 4 === 3) block = "white_concrete";                             // spandrel
    else block = along % 3 === 0 ? "light_gray_concrete" : "light_blue_stained_glass"; // window grid, mullions as frames
    g.set(x, y, z, block);
  }
  if (exposed(x, z, t - 1).length) g.set(x, t, z, "stone_bricks");              // parapet on the perimeter
}

// Pass 2: the air gap behind each window (one block in), lit in some of them.
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number), t = T(x, z);
  for (let y = 1; y < t; y++) {
    const ex = exposed(x, z, y);
    if (!ex.length || y < 4 || y % 4 === 0 || y % 4 === 3) continue;
    const [dx, dz] = ex[0], along = dx !== 0 ? z : x;
    if (along % 3 === 0) continue;                                              // a mullion, no niche
    const bx = x - dx, bz = z - dz;
    if (!cell.has(`${bx},${bz}`) || exposed(bx, bz, y).length || y >= T(bx, bz)) continue;
    const h = (x * 7 + z * 3 + y * 5) % 11;
    if (h === 0) g.set(bx, y, bz, "glowstone");
    else if (h === 4 && y % 4 === 1) g.set(bx, y, bz, "lantern", { hanging: "false", waterlogged: "false" });
    else g.set(bx, y, bz, "air");
  }
}

// Pass 3: the entrance, on the longest run of ground-level street frontage; a canopy over three bays.
const runs = new Map();                                                         // face -> cells along it at y=1
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number), ex = exposed(x, z, 1);
  for (const [dx, dz, name] of ex) {
    const along = dx !== 0 ? z : x;
    if (!runs.has(name)) runs.set(name, new Map());
    runs.get(name).set(along, { x, z, name, dx, dz });
  }
}
let best = null;
for (const [name, byAlong] of runs) {
  const seen = new Set();
  for (const [along, c] of byAlong) {
    if (seen.has(along)) continue;
    let lo = along, hi = along;
    while (byAlong.has(lo - 1)) lo--;
    while (byAlong.has(hi + 1)) hi++;
    for (let a = lo; a <= hi; a++) seen.add(a);
    if (!best || hi - lo > best.hi - best.lo) best = { name, lo, hi, byAlong };
  }
}
if (best) {
  const mid = Math.floor((best.lo + best.hi) / 2);
  const door = best.byAlong.get(mid);
  const facing = { east: "east", west: "west", south: "south", north: "north" }[door.name];
  g.set(door.x, 1, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, 2, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(door.x - door.dx, 1, door.z - door.dz, "air");
  g.set(door.x - door.dx, 2, door.z - door.dz, "air");
  for (let a = mid - 1; a <= mid + 1; a++) {
    const c = best.byAlong.get(a); if (!c) continue;
    g.set(c.x, 3, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 4: roof plant on the tower, planters on the wings' terraces.
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number), t = T(x, z);
  if (exposed(x, z, t - 1).length) continue;
  if (t === 32 && x % 9 === 4 && z % 9 === 4) { g.set(x, t, z, "light_gray_concrete"); g.set(x, t + 1, z, "iron_bars"); }
  else if (t <= 16 && x % 6 === 1 && z % 6 === 1) g.set(x, t, z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
}

const stats = g.save(`${DIR}/way_160068965.nbt`);
console.log(`way_160068965: ${stats.blocks} blocks, ${stats.palette} block states, tower top y=${Math.max(...[...top.values()])}`);
