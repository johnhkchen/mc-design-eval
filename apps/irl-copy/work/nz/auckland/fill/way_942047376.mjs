// Mid-rise commercial block (Eden Terrace / CBD edge), c. 1980s: a pale concrete frame with blue-tinted glazing,
// a glazed shopfront at street level, and a 12-storey tower on a 5-storey wing. Built from the lidar roof field:
// the roof per cell is median-smoothed and rounded to whole 4-block storeys, so every tier is flat and stacked.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_942047376.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_942047376.nbt";
const X = 82, Z = 73, Y = 61;
const STOREY = 4, MAX_TOP = 52;

const G = Array.from({ length: Z }, () => Array(X).fill(-1));     // lowest-ground offset per cell (-1 = not footprint)
const RAW = Array.from({ length: Z }, () => Array(X).fill(0));    // lidar roof height above y0
for (const [x, z, g, r] of JSON.parse(readFileSync(CELLS, "utf8"))) { G[z][x] = g; RAW[z][x] = r; }
const fp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[z][x] >= 0;

// Smoothed tiers: 3x3 median of the lidar roof over footprint cells, rounded to whole storeys
const T = Array.from({ length: Z }, () => Array(X).fill(0));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp(x, z)) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (fp(x + dx, z + dz)) v.push(RAW[z + dz][x + dx]);
  v.sort((a, b) => a - b);
  const storeys = Math.max(1, Math.round(v[v.length >> 1] / STOREY));
  T[z][x] = Math.min(STOREY * storeys, MAX_TOP);
}

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
// exposed = some side has no building at this height (outside the footprint, or a lower tier)
const exposed = (x, y, z) => DIRS.some(([dx, dz]) => !fp(x + dx, z + dz) || y >= T[z + dz][x + dx]);
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const vox = new Voxels([X, Y, Z]);
const lit = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp(x, z)) continue;
  const t = T[z][x], g = G[z][x];
  for (let y = 0; y < t; y++) {
    if (y < g) { vox.set(x, y, z, "stone_bricks"); continue; }     // plinth up to the lowest ground
    const row = y % STOREY, ground = y < STOREY;
    if (!exposed(x, y, z)) {                                          // interior: floor slabs and a roof deck, air between
      if (y === t - 1) vox.set(x, y, z, "gray_concrete");
      else if (row === 0) vox.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === t - 1) { vox.set(x, y, z, "smooth_stone"); continue; }   // parapet coping
    if (row === 0) { vox.set(x, y, z, "polished_andesite"); continue; } // storey line
    if (row === 3) { vox.set(x, y, z, "white_concrete"); continue; }    // spandrel
    const pier = ground ? (x + z) % 3 === 0 : (x + z) % 4 === 0;
    if (pier) { vox.set(x, y, z, ground ? "black_concrete" : "light_gray_concrete"); continue; }
    vox.set(x, y, z, ground ? "glass" : ((hash(x, y, z) % 6 === 0) ? "cyan_stained_glass" : "light_blue_stained_glass"));
    if (!ground && hash(x, y, z) % 7 === 1) lit.push([x, y, z]);
  }
}

// Warm light: glowstone one cell inside a lit window (the air gap is kept, the glowstone sits behind the pane)
for (const [x, y, z] of lit) {
  const inward = DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) => fp(nx, nz) && !exposed(nx, y, nz) && y < T[nz][nx]);
  if (inward && vox.val(inward[0], y, inward[1]) === 0) vox.set(inward[0], y, inward[1], "glowstone");
}

// Street entrance: on the face with the most ground-storey exposure, a double-height iron door at the middle
// of that face, under a 3 x 2 canopy cantilevered from the storey-0 wall (attached, so nothing hangs)
const faceCells = DIRS.map(([dx, dz, name]) => {
  const cs = [];
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++)
    if (fp(x, z) && !fp(x + dx, z + dz) && G[z][x] + 2 < T[z][x]) cs.push([x, z]);
  return { dx, dz, name, cs };
}).sort((a, b) => b.cs.length - a.cs.length);
const face = faceCells[0];
const [dx, dz] = [face.dx, face.dz];
const along = face.cs.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
const [ex, ez] = along[along.length >> 1];
const g0 = G[ez][ex];
const dirState = { facing: face.name, hinge: "left", open: "false", powered: "false" };
vox.set(ex, g0, ez, "iron_door", { ...dirState, half: "lower" });
vox.set(ex, g0 + 1, ez, "iron_door", { ...dirState, half: "upper" });
const tx = dz !== 0 ? 1 : 0, tz = dx !== 0 ? 1 : 0;   // tangent along the face
for (let d = 1; d <= 2; d++) for (let t = -1; t <= 1; t++) {
  const cx = ex + dx * d + tx * t, cz = ez + dz * d + tz * t;
  vox.set(cx, g0 + 2, cz, "smooth_stone");
}

// Roof plant: 2 x 2 x 2 boxes on the flat roofs of the tiers, and warm lanterns on the tower's coping
for (let z = 0; z < Z - 1; z++) for (let x = 0; x < X - 1; x++) {
  if (x % 8 !== 3 || z % 8 !== 3) continue;
  const cells = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cells.every(([a, b]) => fp(a, b) && T[b][a] === T[z][x] && T[z][x] >= 16 && !exposed(a, T[z][x] - 1, b))) continue;
  for (const [a, b] of cells) for (let y = T[z][x]; y < T[z][x] + 2; y++) vox.set(a, y, b, "light_gray_concrete");
}
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp(x, z) || T[z][x] < 36 || (x + z) % 9 !== 0 || !exposed(x, T[z][x] - 1, z)) continue;
  vox.set(x, T[z][x], z, "lantern", { hanging: "false", waterlogged: "false" });
}

const stats = vox.save(OUT);
console.log("saved", OUT, stats);
