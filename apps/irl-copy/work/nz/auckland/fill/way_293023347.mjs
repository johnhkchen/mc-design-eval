// Winsun Heights (way 293023347), Auckland: a 1980s reinforced-concrete office tower, 30 x 28 blocks, its roof about 48
// blocks above the lowest ground (lidar: the core reads 46-47, flat). Eleven storeys of 4 blocks stand on a 4-block
// polished-andesite plinth; storey lines sit on the global 4-block grid, so every tier lines up across the slope and the
// downhill side shows its extra storeys over the plinth. The lidar's edge cells that read 43-45 become a lower wing one
// storey down. Facade: white concrete piers every 4 blocks, light-grey spandrels on each storey line, blue tinted glass
// between. The street side is the lowest ground: a shopfront with a dark-oak entrance, a canopy band over it and lanterns
// beside the door. The roof has a white parapet and rooftop plant. Interiors are air behind the glass with a floor slab
// per storey; glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(`${HERE}way_293023347.cells.json`, "utf8"));
const W = 30, D = 28, HEIGHT = 60;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0);                                 // ground (y 0 = lowest ground), lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
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

// B: the first storey line above the ground (a multiple of 4; solid plinth below it). T: the tier's roof (a multiple of 4):
// the lidar's 3x3 median, snapped to the storey grid, so 46-47 become 48 and the 43-45 edge cells a lower wing at 44.
const B = grid(0), T = grid(0);
for (const [x, z] of cellsIn) B[x][z] = 4 * Math.ceil(G[x][z] / 4);
for (const [x, z] of cellsIn) T[x][z] = Math.max(B[x][z] + 4, 4 * Math.round(med3(R, x, z) / 4));
const TMAX = Math.max(...cellsIn.map(([x, z]) => T[x][z]));

// the street face: the outward side with the most ring cells on the lowest ground, its middle three cells the entrance bay
const outward = (x, z) => Object.keys(DIRS).filter((k) => !inside(x + DIRS[k][0], z + DIRS[k][1]));
const ring = cellsIn.filter(([x, z]) => dist[x][z] === 1);
const minG = Math.min(...ring.map(([x, z]) => G[x][z]));
const sideCount = {};
for (const [x, z] of ring) if (G[x][z] === minG) for (const k of outward(x, z)) sideCount[k] = (sideCount[k] || 0) + 1;
const street = Object.keys(sideCount).sort((a, b) => sideCount[b] - sideCount[a])[0];
const faceCells = ring.filter(([x, z]) => outward(x, z).includes(street));
const along = (x, z, k) => (k === "N" || k === "S" ? x : z);
const alongs = faceCells.map(([x, z]) => along(x, z, street)).sort((a, b) => a - b);
const mid = alongs[alongs.length >> 1];
const bay = (x, z) => faceCells.some(([fx, fz]) => fx === x && fz === z) && Math.abs(along(x, z, street) - mid) <= 1;
const door = (x, z) => bay(x, z) && along(x, z, street) === mid;
const lantern = (x, z) => bay(x, z) && !door(x, z);

// the faces of (x, z) that open to air at height y: outside the footprint, or above a neighbour's roof
const outSides = (x, z, y) => Object.keys(DIRS).filter((k) => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || y > T[nx][nz];
});

// a facade block: a spandrel on each storey line, white piers every 4 along a face and at corners, blue glass between;
// the ground storey is a polished-andesite base and piers, with shopfront glass
const windows = [];
const facade = (x, z, y, sides) => {
  const corner = sides.some((s) => s === "N" || s === "S") && sides.some((s) => s === "E" || s === "W");
  const a = along(x, z, sides[0]);
  const ground = y < B[x][z] + 4;
  const r = y % 4;
  if (r === 0 || r === 3) return ground && r === 0 ? "polished_andesite" : "light_gray_concrete";
  if (corner || a % 4 === 0) return ground ? "polished_andesite" : "white_concrete";
  windows.push([x, z, y, sides[0]]);
  return "light_blue_stained_glass";
};

const g = new Voxels([W, HEIGHT, D]);
for (const [x, z] of cellsIn) {
  const b = B[x][z], t = T[x][z], edge = dist[x][z] === 1;
  for (let y = 0; y < b; y++) g.set(x, y, z, "polished_andesite");                 // foundation and plinth up to the first storey line
  for (let y = b; y < t; y++) {
    if (bay(x, z) && y >= b + 1 && y <= b + 2 && outward(x, z).includes(street)) {   // the entrance bay: door, lantern
      if (door(x, z)) {
        g.set(x, y, z, "dark_oak_door", { facing: FACING[street], half: y === b + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (lantern(x, z) && y === b + 2) {
        g.set(x, y, z, "lantern", { hanging: "true" });
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
      continue;
    }
    if (bay(x, z) && y === b + 3) { g.set(x, y, z, "smooth_stone"); continue; }   // the canopy band over the entrance
    const sides = outSides(x, z, y);
    if (sides.length) { g.set(x, y, z, facade(x, z, y, sides)); continue; }
    if (y % 4 === 0) g.set(x, y, z, "light_gray_concrete");                       // floor slab
  }
  // the tier's roof: a light cornice on the ring, grey roof membrane inside; a white parapet on the ring above it
  g.set(x, t, z, edge ? "white_concrete" : "gray_concrete");
  if (edge) g.set(x, t + 1, z, "light_gray_concrete");
}

// the warm lights: glowstone on the air behind a share of the glass (the inner cell, clear of the walls)
const lit = (x, y, z) => ((x * 73856093) ^ (z * 19349663) ^ (y * 83492791)) >>> 0;
for (const [x, z, y, s] of windows) {
  if (lit(x, y, z) % 4 !== 0) continue;
  const [dx, dz] = DIRS[s], ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || dist[ix][iz] < 2 || y >= T[ix][iz] || outSides(ix, iz, y).length) continue;
  g.set(ix, y, iz, "glowstone");
}

// rooftop plant: a few 2-high units with a metal cap, set in from the parapet on the top tier
for (const [x, z] of cellsIn) {
  if (T[x][z] !== TMAX || dist[x][z] < 4 || x % 5 !== 2 || z % 5 !== 2) continue;
  g.set(x, TMAX + 1, z, "light_gray_concrete");
  g.set(x, TMAX + 2, z, "iron_block");
}

const stats = g.save(`${HERE}way_293023347.nbt`);
const tiers = {}; for (const [x, z] of cellsIn) tiers[T[x][z]] = (tiers[T[x][z]] || 0) + 1;
console.log(JSON.stringify({ cells: cellsIn.length, street, entrance: mid, tiers, maxY: TMAX + 2, ...stats }));
