// Quest, Auckland (way 293020892): a 1980s office tower on a dark basalt base, 33 x 28 blocks, about 61 blocks to its roof
// (lidar, median-smoothed and snapped to a 4-block storey grid). The lidar's core reads 56-60 and the edges step down to
// 8-24, so the massing is a tall slab with setback wings, a plant room on the top tier, and a basalt plinth that follows
// the slope: the downhill west face shows two extra storeys over the basalt. Storey lines sit on the global 4-block grid,
// so every tier lines up across the slope. Facade: white precast piers every 4 blocks, light-grey spandrels, blue glass
// ribbons, a white header; the ground floor is a shopfront with a dark-oak entrance and a basalt portico on the downhill
// face. Interiors are air behind the glass with a floor slab per storey; glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(`${HERE}way_293020892.cells.json`, "utf8"));
const W = 33, D = 28, HEIGHT = 73;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0);                                 // ground (y 0 = lowest ground), lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const med3 = (A, x, z) => { const v = []; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(A[x + dx][z + dz]); return med(v); };
const cellsIn = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) cellsIn.push([x, z]);

// edge distance (1 on the outside ring)
const dist = grid(0), queue = [];
for (const [x, z] of cellsIn) if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { dist[x][z] = 1; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of Object.values(DIRS)) { const nx = x + dx, nz = z + dz; if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); } }
}

// B: the first storey line above the ground (multiple of 4; solid basalt below it). T: the tier's roof (multiple of 4).
const B = grid(0), T = grid(0), Q = grid(0);
for (const [x, z] of cellsIn) B[x][z] = 4 * Math.ceil(G[x][z] / 4);
for (const [x, z] of cellsIn) Q[x][z] = Math.max(B[x][z] + 4, 4 * Math.round(med3(R, x, z) / 4));
for (const [x, z] of cellsIn) T[x][z] = Math.max(B[x][z] + 4, 4 * Math.round(med3(Q, x, z) / 4));
const TMAX = Math.max(...cellsIn.map(([x, z]) => T[x][z]));

// the entrance: the middle of the lowest-ground west face (the street side of the slope)
const westCells = cellsIn.filter(([x, z]) => !inside(x - 1, z));
const minG = Math.min(...westCells.map(([x, z]) => G[x][z]));
const westLow = westCells.filter(([x, z]) => G[x][z] === minG).map(([, z]) => z).sort((a, b) => a - b);
const zc = westLow[westLow.length >> 1];
const entranceOK = zc !== undefined && inside(1, zc);

// faces of (x, z) that open to air at height y: outside the footprint, or above a neighbour's roof
const outSides = (x, z, y) => Object.keys(DIRS).filter((k) => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || y > T[nx][nz];
});

// a facade block: white piers every 4 along the face and at corners, spandrel bands on the storey line, a white header
// course; the ground storey is a basalt base course and a shopfront's fascia
const windows = [];
const facade = (x, z, y, sides, base, ground) => {
  const corner = sides.some((s) => s === "N" || s === "S") && sides.some((s) => s === "E" || s === "W");
  const along = sides[0] === "N" || sides[0] === "S" ? x : z;
  const r = (y - base) % 4;
  if (r === 0) return ground ? "polished_basalt" : "light_gray_concrete";
  if (r === 3) return ground ? "polished_basalt" : "white_concrete";
  if (corner || along % 4 === 0) return "white_concrete";
  windows.push([x, z, y, sides[0]]);
  return "cyan_stained_glass";
};

const g = new Voxels([W, HEIGHT, D]);
for (const [x, z] of cellsIn) {
  const b = B[x][z], t = T[x][z], ring = dist[x][z] === 1;
  for (let y = 0; y < b; y++) g.set(x, y, z, "polished_basalt");           // foundation and plinth up to the storey line
  g.set(x, t, z, ring ? "light_gray_concrete" : "gray_concrete");          // the tier's roof (cornice on the ring)
  if (ring) g.set(x, t + 1, z, "white_concrete");                          // parapet
  for (let y = b; y < t; y++) {
    if (entranceOK && x === 0 && z === zc && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const sides = outSides(x, z, y);
    if (sides.length) { g.set(x, y, z, facade(x, z, y, sides, b, y < b + 4 && sides.includes("W"))); continue; }
    if (y % 4 === 0) g.set(x, y, z, "light_gray_concrete");              // floor slab
  }
  if (!ring && t <= 24 && dist[x][z] >= 3 && (x * 3 + z * 5) % 11 === 0) g.set(x, t + 1, z, "iron_block");   // wing plant
}

// the plant room on the top tier, set in 5 blocks from the ring; storeys 61-64 under a roof at 65
for (const [x, z] of cellsIn) {
  if (T[x][z] !== TMAX || dist[x][z] < 5) continue;
  for (let y = TMAX + 1; y < TMAX + 5; y++) {
    const sides = outSides(x, z, y);
    g.set(x, y, z, sides.length ? facade(x, z, y, sides, TMAX + 1, false) : "light_gray_concrete");
  }
  g.set(x, TMAX + 5, z, "gray_concrete");
}

// the warm lights: glowstone on the air behind a share of the glass
const lit = (x, y, z) => ((x * 73856093) ^ (z * 19349663) ^ (y * 83492791)) >>> 0;
for (const [x, z, y, f] of windows) {
  if (lit(x, y, z) % 5 !== 0) continue;
  const [dx, dz] = DIRS[f], ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || y % 4 === 0 || y >= T[ix][iz] || outSides(ix, iz, y).length) continue;
  g.set(ix, y, iz, "glowstone");
}

// the entrance portico: posts and a canopy on the downhill face, a hanging lantern under it
if (entranceOK) {
  for (const z of [zc - 1, zc + 1]) if (inside(1, z)) {
    g.set(1, 1, z, "polished_basalt"); g.set(1, 2, z, "polished_basalt"); g.set(1, 3, z, "polished_basalt");
  }
  for (const z of [zc - 1, zc, zc + 1]) if (inside(1, z)) g.set(1, 3, z, "polished_basalt");
  g.set(1, 2, zc, "lantern", { hanging: "true" });
}

const stats = g.save(`${HERE}way_293020892.nbt`);
console.log(JSON.stringify({ cells: cellsIn.length, maxY: TMAX + 5, entranceZ: zc, ...stats }));
