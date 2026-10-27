// Science Centre 303S, Auckland: a 1970s reinforced-concrete institutional block on a diagonal site. A ten-storey
// slab (roof 42) with a two-cell setback at storey 8 (roof 37), a podium to the south-west, and a five-storey wing
// in the north-west corner (roof 21). Concrete piers and spandrels, blue-grey vision glass, a stone plinth, a cornice,
// a canopied door on the north-east face, and warm lights behind some panes. Floors sit on one datum (y 5 + 4k).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_833362076.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_833362076.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const X = 59, Y = 56, Z = 60;
const k2 = (x, z) => z * X + x;
const ground = new Int32Array(X * Z).fill(-1);
const roofRaw = new Int32Array(X * Z);
for (const [x, z, g, r] of cells) { ground[k2(x, z)] = g; roofRaw[k2(x, z)] = r; }
const fp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && ground[k2(x, z)] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

const M = {
  plinth: "stone_bricks", band: "white_concrete", pier: "white_concrete", spandrel: "gray_concrete",
  glass: "cyan_stained_glass_pane", cornice: "stone_bricks", roof: "gray_concrete", slab: "smooth_stone",
  plant: "light_gray_concrete", canopy: "gray_concrete", lamp: "glowstone", door: "dark_oak_door",
};
const FLOORS = [5, 9, 13, 17, 21, 25, 29, 33, 37, 41];

// 1. Lidar roofs snapped to three flat tiers: under 12 is dropout noise (take the neighbours' median).
const TIERS = [21, 37, 42];
const snap = (v) => TIERS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
const tier = new Int32Array(X * Z);
for (const [x, z, , r] of cells) {
  let v = r;
  if (v < 12) {
    const near = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (fp(x + dx, z + dz) && roofRaw[k2(x + dx, z + dz)] >= 12) near.push(roofRaw[k2(x + dx, z + dz)]);
    }
    v = near.length ? median(near) : 37;
  }
  tier[k2(x, z)] = snap(v);
}

// 2. Majority of the 3x3 neighbourhood, so tier edges run straight (a cell keeps its own tier on a tie).
const smooth = new Int32Array(tier);
for (const [x, z] of cells) {
  const count = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!fp(x + dx, z + dz)) continue;
    const t = tier[k2(x + dx, z + dz)]; count.set(t, (count.get(t) || 0) + 1);
  }
  const self = tier[k2(x, z)];
  let best = self;
  for (const [t, n] of count) if (n > (count.get(best) || 0)) best = t;
  smooth[k2(x, z)] = best;
}

// 3. The tower's outer two cells step back to the podium roof (a setback); the core rises the last 5 blocks.
const onTower = (x, z) => fp(x, z) && smooth[k2(x, z)] === 42;
const ring = new Int32Array(X * Z);   // distance in cells from the tower's edge (1 = edge)
const queue = [];
for (const [x, z] of cells) {
  if (onTower(x, z) && DIRS.some(([dx, dz]) => !onTower(x + dx, z + dz))) { ring[k2(x, z)] = 1; queue.push([x, z]); }
}
for (let q = 0; q < queue.length; q++) {
  const [x, z] = queue[q], d = ring[k2(x, z)];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (onTower(nx, nz) && !ring[k2(nx, nz)]) { ring[k2(nx, nz)] = d + 1; queue.push([nx, nz]); }
  }
}
const top = new Int32Array(X * Z);
for (const [x, z] of cells) {
  const i = k2(x, z);
  top[i] = smooth[i] === 42 && ring[i] >= 1 && ring[i] <= 2 ? 37 : smooth[i];
}
const TOP = (x, z) => (fp(x, z) ? top[k2(x, z)] : 0);
const present = (x, y, z) => fp(x, z) && y >= 0 && y < TOP(x, z);
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !present(x + dx, y, z + dz));

// The voxel grid, written out at the end; a cell is { block, state } or null (air).
const W = new Array(X * Y * Z).fill(null);
const at = (x, y, z) => (z * Y + y) * X + x;
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) return;
  W[at(x, y, z)] = { block, state };
};
const paneNormal = new Map();   // glass cell -> its outward normal, so the pane connects along its wall only

// The door's cell: a ground-storey bay on the north-east face (outward +x or -z), the middle of that run.
const neFace = [];
for (const [x, z] of cells) {
  const ex = exposed(x, 6, z);
  if (ex.length === 1 && ((ex[0][0] === 1 && ex[0][1] === 0) || (ex[0][0] === 0 && ex[0][1] === -1))) neFace.push([x, z]);
}
neFace.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
const [doorX, doorZ] = neFace[neFace.length >> 1];
const [doorDx, doorDz] = exposed(doorX, 6, doorZ)[0];

// 4. Solid to the ground, then the envelope: plinth, storey bands, piers, glass, spandrels, cornice.
for (const [x, z] of cells) {
  const g = ground[k2(x, z)], t = TOP(x, z);
  for (let y = 0; y < t; y++) {
    if (y < g) { put(x, y, z, M.plinth); continue; }
    const ex = exposed(x, y, z);
    if (y === t - 1) { put(x, y, z, ex.length ? M.cornice : M.roof); continue; }
    if (!ex.length) { if (y === g || FLOORS.includes(y)) put(x, y, z, M.slab); continue; }
    if (y < 5) { put(x, y, z, M.plinth); continue; }
    const r = (y - 5) % 4;                       // 0 storey band, 1-2 glass, 3 spandrel
    const [dx, dz] = ex[0];
    const along = dx !== 0 ? z : x;
    if (r === 0) put(x, y, z, M.band);
    else if (r === 3) put(x, y, z, M.spandrel);
    else if (ex.length > 1 || along % 4 === 0) put(x, y, z, M.pier);
    else { put(x, y, z, M.glass); paneNormal.set(at(x, y, z), [dx, dz]); }
  }
}

// 5. Door (two blocks high) and a canopy, three wide and two deep, cantilevered from the spandrel at y 8.
const [nx, nz] = [doorDx, doorDz];
const facing = FACING[`${nx},${nz}`];
put(doorX, 5, doorZ, M.door, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorX, 6, doorZ, M.door, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
for (let d = 1; d <= 2; d++) for (let j = -1; j <= 1; j++) {
  const cx = nx !== 0 ? doorX + nx * d : doorX + j;
  const cz = nz !== 0 ? doorZ + nz * d : doorZ + j;
  if (!fp(cx, cz)) put(cx, 8, cz, M.canopy);
}

// 6. Warm light: glowstone on the room side of about one pane in four, deterministic by position.
for (const [i, n] of paneNormal) {
  const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  if ((y - 5) % 4 !== 2) continue;
  const h = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
  if (h % 4) continue;
  const [ix, iz] = [x - n[0], z - n[1]];
  if (fp(ix, iz) && !W[at(ix, y, iz)]) put(ix, y, iz, M.lamp);
}

// 7. Roof plant: 2x2 boxes on the tower core, two blocks high.
for (const [x, z] of cells) {
  if (x % 9 !== 4 || z % 9 !== 4) continue;
  const quad = [[0, 0], [1, 0], [0, 1], [1, 1]];
  if (!quad.every(([a, b]) => onTower(x + a, z + b) && ring[k2(x + a, z + b)] >= 4)) continue;
  for (const [a, b] of quad) for (let y = 42; y < 44; y++) put(x + a, y, z + b, M.plant);
}

// 8. Panes connect to their neighbours along the wall plane only; anything else reads as a pier.
for (const [i, n] of paneNormal) {
  const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  const along = n[0] !== 0 ? [[0, -1, "north"], [0, 1, "south"]] : [[1, 0, "east"], [-1, 0, "west"]];
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const [ax, az, side] of along) {
    if (W[at(x + ax, y, z + az)]) state[side] = "true";
  }
  W[i] = { block: M.glass, state };
}

const g = new Voxels([X, Y, Z]);
for (let i = 0; i < W.length; i++) {
  if (!W[i]) continue;
  const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  g.set(x, y, z, W[i].block, W[i].state);
}
console.log(g.save(OUT));
