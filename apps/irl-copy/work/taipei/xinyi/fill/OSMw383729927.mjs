import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw383729927";
const W = 58, H = 114, D = 30;
const ROOF = 102; // roof height above lowest ground, from lidar

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookups -------------------------------------------------
const key = (x, z) => x + "," + z;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), gr);
const inFp = (x, z) => groundOf.has(key(x, z));

let gmax = 0, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  gmax = Math.max(gmax, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outwardOf = (x, z) =>
  Object.keys(DIRS).filter(n => !inFp(x + DIRS[n][0], z + DIRS[n][1]));

const cellList = cells.map(([x, z, gr]) => ({ x, z, gr, outs: outwardOf(x, z) }));
const isEdge = (x, z) => outwardOf(x, z).length > 0;

// ---- storeys -----------------------------------------------------------
// Floors every 5 blocks starting just above the highest ground; the top
// slab sits below a 3-block parapet so the roof lands near ROOF.
const N = Math.floor((ROOF - gmax - 1 - 3) / 5); // storeys
const yOf = k => gmax + 1 + 5 * k;               // floor slab of storey k
const topY = yOf(N);                              // roof slab
const bayOf = (x, z, outs) =>
  outs.some(o => o === "north" || o === "south") ? x : z;

// ---- 1. foundations and plinth ----------------------------------------
for (const { x, z, gr } of cellList) {
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone");
  for (let y = gr + 1; y <= gmax; y++) g.set(x, y, z, "stone_bricks");
}

// ---- 2. slabs (floor plates and roof) ----------------------------------
for (const { x, z, outs } of cellList) {
  const edge = outs.length > 0;
  for (let k = 0; k <= N; k++) {
    const y = yOf(k);
    let id = edge ? "white_concrete" : "light_gray_concrete";
    if (k === 0) id = edge ? "polished_andesite" : "light_gray_concrete";
    g.set(x, y, z, id);
  }
}

// ---- 3. facade: window grid, mullions, spandrels, base and lintel ------
for (const { x, z, outs } of cellList) {
  if (!outs.length) continue;
  const bay = bayOf(x, z, outs);
  for (let k = 0; k < N; k++) {
    const y0 = yOf(k);
    for (let dy = 1; dy <= 4; dy++) {
      let id;
      if (dy === 4) id = k === 0 ? "smooth_stone" : "white_concrete";
      else id = bay % 3 === 0 ? "light_gray_concrete" : "light_blue_stained_glass";
      g.set(x, y0 + dy, z, id);
    }
  }
}

// ---- 4. warm lights behind selected glass (air gap inside) ------------
for (const { x, z, outs } of cellList) {
  if (!outs.length) continue;
  const bay = bayOf(x, z, outs);
  if (bay % 3 === 0) continue;
  const o = outs[0];
  const [dx, dz] = DIRS[o];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || isEdge(ix, iz)) continue;
  for (let k = 1; k < N; k++) {
    if (k % 2 === 1 && (bay + k) % 6 === 1) {
      g.set(ix, yOf(k) + 2, iz, "shroomlight");
    }
  }
}

// ---- 5. entrance: doors, lintel canopy ---------------------------------
const facadeCells = cellList.filter(c => c.outs.length);
const cx = (minX + maxX) / 2;
let pool = facadeCells.filter(c => c.outs.includes("south"));
if (!pool.length) pool = facadeCells.filter(c => c.outs.includes("north"));
if (!pool.length) pool = facadeCells;
pool.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
const door = pool[0];
const doorDir = door.outs.includes("south") ? "south"
  : door.outs.includes("north") ? "north" : door.outs[0];

// lintel / canopy band over the entrance bay on the ground storey
for (const c of facadeCells) {
  if (!c.outs.includes(doorDir)) continue;
  const near = (doorDir === "north" || doorDir === "south")
    ? Math.abs(c.x - door.x) <= 2
    : Math.abs(c.z - door.z) <= 2;
  if (near) g.set(c.x, yOf(0) + 4, c.z, "smooth_stone");
}

// double-leaf iron door pair (lower + upper half) at the entrance
const doorProps = half => ({
  facing: doorDir, half, hinge: "left", open: "false", powered: "false",
});
g.set(door.x, yOf(0) + 1, door.z, "iron_door", doorProps("lower"));
g.set(door.x, yOf(0) + 2, door.z, "iron_door", doorProps("upper"));
// recessed entrance surround
g.set(door.x, yOf(0) + 3, door.z, "smooth_stone");

// ---- 6. parapet and roof edge ------------------------------------------
for (const { x, z, outs } of cellList) {
  if (!outs.length) continue;
  g.set(x, topY + 1, z, "white_concrete");
  g.set(x, topY + 2, z, "white_concrete");
  g.set(x, topY + 3, z, "smooth_stone");
}

// ---- 7. roof plant: penthouse box with cap and corner lights -----------
const padX = Math.floor((maxX - minX + 1) * 0.3);
const padZ = Math.floor((maxZ - minZ + 1) * 0.3);
const bx0 = minX + padX, bx1 = maxX - padX;
const bz0 = minZ + padZ, bz1 = maxZ - padZ;
const phBase = topY + 1;
if (phBase <= ROOF - 1) {
  for (let x = bx0; x <= bx1; x++) {
    for (let z = bz0; z <= bz1; z++) {
      if (!inFp(x, z)) continue;
      const wall = x === bx0 || x === bx1 || z === bz0 || z === bz1;
      if (wall) {
        for (let y = phBase; y < ROOF; y++) {
          const louvre = (y - phBase) % 2 === 1 && (x + z) % 2 === 0;
          g.set(x, y, z, louvre ? "iron_bars" : "light_gray_concrete");
        }
      }
      g.set(x, ROOF, z, "smooth_stone");
    }
  }
  const corners = [[bx0, bz0], [bx1, bz0], [bx0, bz1], [bx1, bz1]];
  for (const [x, z] of corners) {
    if (inFp(x, z)) g.set(x, ROOF + 1, z, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
