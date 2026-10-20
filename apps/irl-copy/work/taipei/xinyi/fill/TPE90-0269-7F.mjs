import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE90-0269-7F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 75, H = 47, D = 42;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

// 2001 telecom machine room: 7 storeys of 5 blocks, flat roof at y 35.
const ROOF = 35;
const FLOORS = [5, 10, 15, 20, 25, 30];

let minZ = Infinity, minX = Infinity, maxX = -Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

// Perimeter = any 4-neighbour outside the footprint
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// 1. Foundations
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "gray_concrete");
}

// 2. Interior floor slabs
for (const [x, z, gr] of cells) {
  for (const fl of FLOORS) {
    if (fl >= gr) g.set(x, fl, z, "light_gray_concrete");
  }
}

// 3. Roof slab
for (const [x, z] of cells) g.set(x, ROOF, z, "light_gray_concrete");

// 4. Perimeter walls
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;

  let along, inwardDx, inwardDz;
  if (!has(x, z - 1)) { along = x; inwardDx = 0; inwardDz = 1; }
  else if (!has(x, z + 1)) { along = x; inwardDx = 0; inwardDz = -1; }
  else if (!has(x - 1, z)) { along = z; inwardDx = 1; inwardDz = 0; }
  else { along = z; inwardDx = -1; inwardDz = 0; }

  const inwardExists = has(x + inwardDx, z + inwardDz) && !isEdge(x + inwardDx, z + inwardDz);
  const rib = along % 5 === 0;

  for (let y = gr; y <= ROOF - 1; y++) {
    const k = Math.floor(y / 5);
    const fl = 5 * k;
    const r = y - fl;

    if (k === 0) {
      // ground storey: dark base course
      g.set(x, y, z, rib ? "stone_bricks" : "gray_concrete");
      continue;
    }
    if (r === 0 || r === 4) {
      g.set(x, y, z, "light_gray_concrete"); // floor line and spandrel bands
      continue;
    }
    if (rib) {
      g.set(x, y, z, "smooth_quartz"); // vertical ribs give the facade depth
      continue;
    }
    const win = along % 5 === 1 || along % 5 === 2;
    if (win) {
      g.set(x, y, z, "light_blue_stained_glass");
      if (r === 2 && along % 10 === 1 && inwardExists) {
        g.set(x + inwardDx, y, z + inwardDz, "glowstone");
      }
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // parapet / cornice above roof line
  g.set(x, ROOF, z, "light_gray_concrete");
  g.set(x, ROOF + 1, z, "white_concrete");
  g.set(x, ROOF + 2, z, "white_concrete");
}

// 4b. Entrance: recessed opening on the minZ face, centred, with jambs,
// glazed back wall and a warm light; the spandrel above acts as canopy.
const entranceX = (x) => Math.abs(x - cx) <= 3;
for (const [x, z, gr] of cells) {
  if (z !== minZ || !entranceX(x) || !has(x, minZ)) continue;
  for (let y = gr; y <= gr + 3; y++) g.set(x, y, z, "air");
  // inner back wall of the recess
  if (has(x, z + 1)) {
    for (let y = gr; y <= gr + 2; y++) g.set(x, y, z + 1, "light_blue_stained_glass");
  }
}
// jambs at the edges of the opening
for (const [x, z, gr] of cells) {
  if (z !== minZ || !has(x, minZ)) continue;
  if (Math.abs(x - cx) === 4) {
    for (let y = gr; y <= gr + 3; y++) g.set(x, y, z, "stone_bricks");
  }
}
// warm light in the entrance
if (has(cx, minZ + 1)) g.set(cx, 4, minZ + 1, "glowstone");

// 5. Rooftop mechanical penthouse
const PH = { x0: cx - 14, x1: cx + 14, z0: cz - 7, z1: cz + 7 };
for (const [x, z] of cells) {
  if (x < PH.x0 || x > PH.x1 || z < PH.z0 || z > PH.z1) continue;
  const border = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  if (border) {
    for (let y = ROOF + 1; y <= 39; y++) g.set(x, y, z, "light_gray_concrete");
    if ((x + z) % 3 === 0) {
      g.set(x, 37, z, "iron_bars");
      g.set(x, 38, z, "iron_bars");
    }
  } else {
    g.set(x, ROOF + 1, z, "gray_concrete");
    if (x % 4 === 0 && z % 4 === 0) {
      g.set(x, ROOF + 2, z, "iron_block");
      g.set(x, ROOF + 3, z, "iron_block");
    }
  }
  g.set(x, 40, z, "smooth_stone");
}

// 6. Antenna mast
if (has(cx, cz)) {
  for (let y = 41; y <= 45; y++) g.set(cx, y, cz, "iron_bars");
  g.set(cx, 46, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
