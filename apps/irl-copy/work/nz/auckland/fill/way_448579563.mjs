// A 1930s brick-and-stone office block on Mt Eden's east side: a 4-storey tower where the lidar roof is 15+, a 3-storey
// podium where it is 8-14, and one-storey shop wings everywhere else. Solid foundation to each cell's ground, a hollow
// shell with a floor slab per storey, a stone plinth, a brick facade with glass windows on a 3-block pier rhythm,
// shopfronts on the ground storey, a door on the south street face, warm glowstone behind some windows, a coping on
// every roof and some roof plant on the tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_448579563.cells.json`, "utf8"));
const W = 31, D = 24, Y = 22;

// the footprint: ground g and the lidar roof r per cell
const cell = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g, r] of cells) cell[z][x] = { g, r, H: 0 };
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && cell[z][x] !== null;

// lidar noise into clean flat tiers: the 3x3 median of the roof heights, then three tiers
const median = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) v.push(cell[z + dz][x + dx].r);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const cells2 = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (cell[z][x]) { cell[z][x].m = median(x, z); cells2.push([x, z]); }

// the tower is the largest connected mass of tall cells, grown by one cell so it is never a single-cell spike:
// its core stands 4 storeys, its ring steps down to the 3-storey podium, and the rest of the tall cells join the podium
const tall = (x, z) => inside(x, z) && cell[z][x].m >= 15;
const grown = (x, z) => inside(x, z) && (tall(x, z) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => tall(x + dx, z + dz)));
const seen = new Set(); let tower = new Set();
for (const [x, z] of cells2) {
  const k = `${x},${z}`; if (seen.has(k) || !grown(x, z)) continue;
  const comp = [], stack = [[x, z]]; seen.add(k);
  while (stack.length) {
    const [cx, cz] = stack.pop(); comp.push([cx, cz]);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nk = `${cx + dx},${cz + dz}`;
      if (!seen.has(nk) && grown(cx + dx, cz + dz)) { seen.add(nk); stack.push([cx + dx, cz + dz]); }
    }
  }
  if (comp.length > tower.size) tower = new Set(comp.map(([a, b]) => `${a},${b}`));
}
const inTower = (x, z) => tower.has(`${x},${z}`);
const rimOfTower = (x, z) => inTower(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inTower(x + dx, z + dz));
for (const [x, z] of cells2) {
  const c = cell[z][x];
  c.H = inTower(x, z) && !rimOfTower(x, z) ? 18 : c.m >= 8 || inTower(x, z) ? 12 : 5;
}

// a face is exposed where the air beside it is outside the footprint or above that neighbour's top
const exposedDirs = (x, y, z) => {
  const out = [];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz) || y >= cell[nz][nx].H) out.push([dx, dz]);
  }
  return out;
};

const FLOORS = [4, 8, 12, 16];
const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const DOOR_X = 25, DOOR_Z = D - 1;   // the south street face, under the east wing

const vox = new Voxels([W, Y, D]);
const windows = [];   // {x, y, z, dx, dz}: glass on the facade, for the glowstone pass

// the facade for one exposed voxel: plinth, storey bands, shopfront, piers and glass windows, fascia and spandrels
const facade = (x, y, z, [dx, dz]) => {
  const c = cell[z][x];
  const alongZ = dx !== 0;        // the face looks along x, so the wall runs along z
  const u = alongZ ? z : x;
  if (y === c.g) return vox.set(x, y, z, "stone_bricks");
  if (y % 4 === 0) return vox.set(x, y, z, "smooth_stone");
  if (dz === 1 && x === DOOR_X && z === DOOR_Z && (y === c.g + 1 || y === c.g + 2)) {
    return vox.set(x, y, z, "dark_oak_door", DOOR(y === c.g + 1 ? "lower" : "upper"));
  }
  const glassy = y < 4 ? (y === c.g + 1 || y === c.g + 2) : y % 4 !== 3;
  if (!glassy || u % 3 === 0) return vox.set(x, y, z, u % 3 === 0 && glassy ? "stone_bricks" : "bricks");
  vox.set(x, y, z, "glass_pane", alongZ ? GLASS_NS : GLASS_EW);
  windows.push({ x, y, z, dx, dz });
};

// the shell: foundation below the ground, a coping on every roof, floor slabs inside, the facade on the outside
for (const [x, z] of cells2) {
  const c = cell[z][x];
  for (let y = 0; y < c.H; y++) {
    if (y < c.g) { vox.set(x, y, z, "stone_bricks"); continue; }
    if (y === c.H - 1) { vox.set(x, y, z, "smooth_stone"); continue; }
    const dirs = exposedDirs(x, y, z);
    if (dirs.length) { facade(x, y, z, dirs[0]); continue; }
    if (y === c.g || FLOORS.includes(y)) vox.set(x, y, z, "smooth_stone");
  }
}

// a parapet slab on every exposed roof edge, at the roof's own height
for (const [x, z] of cells2) {
  const H = cell[z][x].H;
  if (exposedDirs(x, H, z).length) vox.set(x, H, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  else if (H === 18 && (x * 3 + z * 5) % 11 === 0) vox.set(x, H, z, "iron_block");   // roof plant on the tower
}

// warm light behind some windows: a glowstone in the room just inside the glass
let lights = 0;
for (const w of windows) {
  if ((w.x * 7 + w.y * 5 + w.z * 3) % 5 !== 0) continue;
  const ix = w.x - w.dx, iz = w.z - w.dz;
  if (!inside(ix, iz) || w.y >= cell[iz][ix].H - 1 || w.y < cell[iz][ix].g) continue;
  if (vox.get(ix, w.y, iz) || exposedDirs(ix, w.y, iz).length) continue;
  vox.set(ix, w.y, iz, "glowstone"); lights++;
}

const out = `${HERE}/way_448579563.nbt`;
const stats = vox.save(out);
console.log(JSON.stringify({ file: out, ...stats, lights, footprint: cells2.length }));
