import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0222-";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 100, D = 11;
const ROOF = 88;          // roof level above lowest ground (lidar)
const SETBACK = 58;       // upper tower steps in here
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inFp = (x, z) => ground.has(key(x, z));
const perim = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// distance in cells from the outside edge
const dist = new Map();
const queue = [];
for (const [x, z] of cells) if (perim(x, z)) { dist.set(key(x, z), 0); queue.push([x, z]); }
for (let qi = 0; qi < queue.length; qi++) {
  const [x, z] = queue[qi];
  const d = dist.get(key(x, z));
  for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]) {
    if (!inFp(nx, nz)) continue;
    const k = key(nx, nz);
    if (!dist.has(k)) { dist.set(k, d + 1); queue.push([nx, nz]); }
  }
}
const distOf = (x, z) => dist.get(key(x, z)) ?? 0;

// centroid of footprint
let cx = 0, cz = 0;
for (const [x, z] of cells) { cx += x; cz += z; }
cx /= cells.length; cz /= cells.length;

// mast on the inner cell nearest the centroid
let mastCell = null, best = Infinity;
for (const [x, z] of cells) {
  if (distOf(x, z) < 2) continue;
  const d2 = (x - cx) ** 2 + (z - cz) ** 2;
  if (d2 < best) { best = d2; mastCell = [x, z]; }
}

// entrance: south-facing perimeter cell (missing z+1 neighbour) nearest the centroid x
let entCell = null, eBest = Infinity;
for (const [x, z] of cells) {
  if (!perim(x, z) || inFp(x, z + 1)) continue;
  const d2 = Math.abs(x - cx);
  if (d2 < eBest) { eBest = d2; entCell = [x, z]; }
}
const entKey = entCell ? key(entCell[0], entCell[1]) : null;

// columns that carry a pilaster: corners and every third cell along each face
const isPilaster = (x, z) => ((x + z) % 3 === 0) || (x % 4 === 0) || (z % 4 === 0);

for (const [x, z, gr] of cells) {
  // foundation
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const isP = perim(x, z);
  const d = distOf(x, z);
  // cells above the setback keep only the inner core
  const top = d >= 1 && d < 99 ? ROOF : ROOF;

  for (let y = gr; y < ROOF; y++) {
    const k = Math.floor((y - gr) / 5);
    const j = (y - gr) % 5;

    // setback: outer ring stops at SETBACK, leaving a terrace on the inner cells
    if (y >= SETBACK && isP) continue;

    if (!isP) {
      if (y === SETBACK) { g.set(x, y, z, "gray_concrete"); continue; }   // setback terrace
      if (j === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    const pil = isPilaster(x, z);
    if (k === 0) {
      if (j === 0) g.set(x, y, z, "polished_andesite");              // base course
      else if (j === 4) g.set(x, y, z, "light_gray_concrete");        // shop lintel
      else g.set(x, y, z, pil ? "white_concrete" : "light_blue_stained_glass");
    } else {
      if (j === 0) g.set(x, y, z, "light_gray_concrete");             // storey line
      else g.set(x, y, z, pil ? "white_concrete" : "light_blue_stained_glass");
    }
  }

  // sparse warm light behind glass
  if (isP) {
    for (let k = 0; ; k++) {
      const y = gr + k * 5 + 2;
      if (y >= SETBACK) break;
      if ((x * 7 + z * 3 + k * 5) % 9 !== 0) continue;
      for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]) {
        if (inFp(nx, nz) && !perim(nx, nz)) { g.set(nx, y, nz, "glowstone"); break; }
      }
    }
  }

  // roof slab over the whole footprint
  g.set(x, ROOF - 1, z, "gray_concrete");

  // parapet on the perimeter of the upper tower
  if (isP && (x + z) % 2 === 0) {
    g.set(x, ROOF, z, "white_concrete");
    g.set(x, ROOF + 1, z, "white_concrete");
  } else if (isP) {
    g.set(x, ROOF, z, "light_gray_concrete");
  }

  // mechanical penthouse on inner cells
  if (d >= 2) {
    g.set(x, ROOF, z, "light_gray_concrete");
    g.set(x, ROOF + 1, z, "cyan_stained_glass");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
}

// entrance: two-bay opening with lintel, canopy on the ground storey
for (const [x, z, gr] of cells) {
  if (key(x, z) !== entKey) continue;
  for (let y = gr + 1; y <= gr + 2; y++) g.set(x, y, z, "air");
  g.set(x, gr + 3, z, "white_concrete");
  g.set(x, gr + 4, z, "light_gray_concrete");
  // warm lantern light over the door
  g.set(x, gr + 2, z, "air");
  const lim = [x - 1, x + 1].filter((nx) => inFp(nx, z) && perim(nx, z) && !inFp(nx, z + 1));
  for (const nx of lim) for (let y = gr + 1; y <= gr + 2; y++) g.set(nx, y, z, "air");
}

// mast
if (mastCell) {
  const [mx, mz] = mastCell;
  for (let y = ROOF + 3; y <= ROOF + 6; y++) g.set(mx, y, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
