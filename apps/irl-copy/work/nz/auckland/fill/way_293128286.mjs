// Aspire2 International, Auckland (way 293128286): a late-1980s office block of 11 storeys (about 44 blocks to its roof
// on the lidar, 48 over the core), 35 x 27 blocks, on a stone plinth. The lidar's roof reads 44 across the wings and 48
// over a core toward the middle, with edge noise down to 38; each cell's roof is median-smoothed and snapped to the
// 4-block storey grid, so the massing is a flat wing tier at 44 with a one-storey core rising from it, and a plant room
// on the core. Storey lines sit on the global 4-block grid (y = 4, 8, ...), so every tier lines up. Facade: precast
// concrete piers every 4 blocks (a grid of cyan glass bays between them, frames of light grey), white spandrel bands at
// each floor, a grey header under each storey line; the ground storey is a polished andesite base band with a shopfront
// and a dark oak entrance on the lowest-ground face, under a stone brick canopy fascia. Interiors are air behind the
// glass with a floor slab per storey; a glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(`${HERE}way_293128286.cells.json`, "utf8"));
const W = 35, D = 27, HEIGHT = 61;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0);                                 // ground (y 0 = lowest ground), lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const med3 = (A, x, z) => { const v = []; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(A[x + dx][z + dz]); return med(v); };
const cellsIn = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) cellsIn.push([x, z]);
const ring = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz));

// T: each cell's roof, the lidar median-smoothed and snapped to the 4-block storey grid (wings 40-44, core 48)
const T = grid(0);
for (const [x, z] of cellsIn) T[x][z] = Math.max(8, 4 * Math.round(med3(R, x, z) / 4));
const core = (x, z) => inside(x, z) && T[x][z] >= 48;

// the entrance: the middle of the lowest-mean-ground face (the street side of the slope)
const faceCells = (side) => cellsIn.filter(([x, z]) => { const [dx, dz] = DIRS[side]; return !inside(x + dx, z + dz); });
const faceMean = (side) => { const f = faceCells(side); return f.reduce((s, [x, z]) => s + G[x][z], 0) / f.length; };
const entranceSide = Object.keys(DIRS).sort((a, b) => faceMean(a) - faceMean(b))[0];
const along = (side, x, z) => (side === "N" || side === "S" ? x : z);
const faceSorted = faceCells(entranceSide).sort((p, q) => along(entranceSide, p[0], p[1]) - along(entranceSide, q[0], q[1]));
const mid = faceSorted[faceSorted.length >> 1];
const entrance = new Map();                                       // "x,z" -> bay role, for the 3-wide bay on that face
const bay = faceSorted.filter(([x, z]) => Math.abs(along(entranceSide, x, z) - along(entranceSide, mid[0], mid[1])) <= 1);
for (const [x, z] of bay) entrance.set(`${x},${z}`, (x === mid[0] && z === mid[1]) ? "door" : "glass");

// faces of (x, z) that open to air at height y: outside the footprint, or beside a neighbour whose roof is below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((k) => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || T[nx][nz] <= y;
});

// a facade block at storey row y (y - 4 mod 4): piers every 4 along the face and at corners, a polished andesite base band
// on the ground storey and white spandrels above it, glass in between, a light grey header under each storey line
const facade = (x, z, y, sides) => {
  const r = (y - 4) % 4, ground = y < 8;
  const onX = sides.some((s) => s === "N" || s === "S"), onZ = sides.some((s) => s === "E" || s === "W");
  if (r === 0) return ground ? "polished_andesite" : "white_concrete";
  if (r === 3) return "light_gray_concrete";
  // piers on the bay grid of each axis the cell faces (a stepped diagonal edge keeps its glass between piers)
  if ((onX && x % 4 === 0) || (onZ && z % 4 === 0)) return "light_gray_concrete";
  return "cyan_stained_glass";
};

const g = new Voxels([W, HEIGHT, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [x, z] of cellsIn) {
  const t = T[x][z], edge = ring(x, z);
  for (let y = 0; y < 4; y++) put(x, y, z, "stone_bricks");                        // foundation to the ground, and the base course
  put(x, t, z, edge ? "light_gray_concrete" : "gray_concrete");                      // the tier's roof (cornice on the edge)
  if (edge) put(x, t + 1, z, "white_concrete");                                      // parapet
  for (let y = 4; y < t; y++) {
    const sides = exposed(x, z, y);
    if (sides.length) {
      if (y < 8 && entranceSide && sides.includes(entranceSide) && entrance.has(`${x},${z}`)) {
        const role = entrance.get(`${x},${z}`);
        if (role === "door") {
          const hinge = "left";
          put(x, y, z, "dark_oak_door", { facing: { N: "north", S: "south", E: "east", W: "west" }[entranceSide], half: y === 4 ? "lower" : "upper", hinge, open: "false", powered: "false" });
          continue;
        }
        if (y === 7) { put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }   // canopy fascia
        if (y === 4) { put(x, y, z, "polished_andesite"); continue; }
        put(x, y, z, "cyan_stained_glass"); continue;                                                   // shopfront glass
      }
      const block = facade(x, z, y, sides);
      put(x, y, z, block);
      // a warm light behind some panes, in the air gap inside
      if (block === "cyan_stained_glass" && (y - 4) % 4 === 1 && (x * 7 + z * 3 + y) % 9 === 0) {
        const [dx, dz] = DIRS[sides[0]], ix = x - dx, iz = z - dz;
        if (inside(ix, iz) && exposed(ix, iz, y).length === 0 && T[ix][iz] > y) put(ix, y, iz, "glowstone");
      }
      continue;
    }
    if (y % 4 === 0) put(x, y, z, "smooth_stone");                                  // floor slab
  }
}

// roof equipment: a plant room on the core, 3 blocks high, its ring louvred, capped, set in from the core's edge
const plant = new Set();
for (const [x, z] of cellsIn) {
  let inner = true;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (!core(x + dx, z + dz)) inner = false;
  if (inner) plant.add(`${x},${z}`);
}
const inPlant = (x, z) => plant.has(`${x},${z}`);
for (const key of plant) {
  const [x, z] = key.split(",").map(Number), t = T[x][z];
  const wall = Object.values(DIRS).some(([dx, dz]) => !inPlant(x + dx, z + dz));
  if (wall) for (let y = t + 1; y <= t + 3; y++) put(x, y, z, y === t + 2 ? "iron_bars" : "light_gray_concrete");
  put(x, t + 4, z, "gray_concrete");                                                // the plant room's cap
}

const sum = g.save(`${HERE}way_293128286.nbt`);
console.log(JSON.stringify({ entranceSide, mid, cells: cellsIn.length, ...sum }));
