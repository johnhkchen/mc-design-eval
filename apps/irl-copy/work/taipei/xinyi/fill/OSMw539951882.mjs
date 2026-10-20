import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951882";
const W = 20, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  if (gr < minG) minG = gr;
}
const inside = (x, z) => ground.has(key(x, z));

// Directions: name, outward offset
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const missingDirs = (x, z) => DIRS.filter(([, dx, dz]) => !inside(x + dx, z + dz));

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!inside(x, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Storey bands (absolute, relative to lowest ground)
const GF_TOP = minG + 4;   // ground-storey fascia row
const F2 = minG + 5;       // second-floor slab / string course
const UP_LO = minG + 6;    // upper sill row
const UP_HI = minG + 9;    // upper lintel row
const R = minG + 10;       // roof deck / cornice
const PAR = minG + 11;     // parapet course (roof ~11 above lowest ground)

// Entrance: median cell of the north-facing edge (street side), else any edge
const north = cells.filter(([x, z]) => !inside(x, z - 1)).sort((a, b) => a[0] - b[0]);
const pool = north.length ? north : cells.filter(([x, z]) => missingDirs(x, z).length > 0);
const entCell = pool[Math.floor(pool.length / 2)];
const entKey = entCell ? key(entCell[0], entCell[1]) : null;

// 1. Foundations, base course, floor slabs and roof deck on every footprint cell
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "polished_andesite");
  if (F2 > gr) put(x, F2, z, "light_gray_concrete");
  put(x, R, z, "light_gray_concrete");
}

// 2. Facades on edge cells
for (const [x, z, gr] of cells) {
  const miss = missingDirs(x, z);
  if (!miss.length) continue;

  const [dn, dx, dz] = miss[0];
  const idx = (dn === "N" || dn === "S") ? x : z;
  const isEnt = key(x, z) === entKey;

  // Ground storey: shopfront glass with white pillars, fascia on top
  for (let y = gr + 1; y <= GF_TOP; y++) {
    if (y === GF_TOP) {
      put(x, y, z, "smooth_quartz");
    } else if (isEnt && y <= gr + 2) {
      // open entrance
      continue;
    } else if (idx % 4 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }

  // String course at second floor level
  put(x, F2, z, "smooth_quartz");

  // Upper storeys: sills, lintels, window bays between white pillars
  for (let y = UP_LO; y <= UP_HI; y++) {
    if (y === UP_LO || y === UP_HI) put(x, y, z, "smooth_quartz");
    else if (idx % 3 === 1) put(x, y, z, "light_blue_stained_glass");
    else put(x, y, z, "white_concrete");
  }

  // Cornice and parapet
  put(x, R, z, "smooth_quartz");
  put(x, PAR, z, "white_concrete");

  // Warm light behind glass (inside the air gap)
  const ix = x - dx, iz = z - dz;
  if (inside(ix, iz) && missingDirs(ix, iz).length === 0) {
    if (idx % 6 === 1 && !isEnt) put(ix, UP_LO + 2, iz, "glowstone");
    if (idx % 4 === 2 && !isEnt) put(ix, gr + 2, iz, "glowstone");
  }

  // Entrance light
  if (isEnt) {
    if (inside(ix, iz)) put(ix, gr + 2, iz, "glowstone");
  }
}

// 3. Roof equipment: small plant boxes on interior roof cells
for (const [x, z] of cells) {
  if (missingDirs(x, z).length) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    put(x, R + 1, z, "gray_concrete");
    put(x, R + 2, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
