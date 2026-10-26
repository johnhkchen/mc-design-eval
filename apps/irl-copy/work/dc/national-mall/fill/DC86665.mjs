import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86665.cells.json`, "utf8"));

// 23 x 22 footprint, ~19 blocks to roof from lidar: 1980s-style tinted-glass office
// on a stone base. Storeys are 2 blocks (floor band + window band).
const W = 23, H = 31, D = 22;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, gr, rf] of cells) info.set(key(x, z), { gr, rf });
const has = (x, z) => info.has(key(x, z));

// Smooth lidar roof noise: average over a 5x5 footprint neighbourhood, snap to 2-block storeys.
const roof = new Map();
for (const [x, z, gr] of cells) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const k = key(x + dx, z + dz);
    if (info.has(k)) { sum += info.get(k).rf; n++; }
  }
  let r = Math.round((sum / n) / 2) * 2;
  r = Math.min(28, Math.max(r, gr + 4));
  roof.set(key(x, z), r);
}

// Front entrance: the footprint cell on the lowest-z edge nearest the middle.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
let doorKey = null, bestDist = Infinity;
for (const [x, z] of cells) {
  if (z !== minZ) continue;
  const d = Math.abs(x - (W - 1) / 2);
  if (d < bestDist) { bestDist = d; doorKey = key(x, z); }
}
const [doorX, doorZ] = doorKey.split(",").map(Number);

for (const [x, z, gr] of cells) {
  const k = key(x, z);
  const r = roof.get(k);
  const edge = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  const nearDoor = Math.abs(x - doorX) <= 1 && z === doorZ;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) {
    g.set(x, y, z, edge ? "stone_bricks" : "smooth_stone");
  }

  // Massing from ground to roof.
  for (let y = gr; y < r; y++) {
    const rel = y - gr;
    if (!edge) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (rel === 0) {
      // Stone base course / ground floor. Storefront glass beside the entrance.
      if (k === doorKey) continue; // entrance opening
      if (nearDoor) g.set(x, y, z, "light_blue_stained_glass");
      else g.set(x, y, z, "polished_andesite");
      continue;
    }
    if (rel === 1) {
      // Lobby / ground-floor window band.
      if (k === doorKey) continue; // entrance opening
      if (nearDoor) g.set(x, y, z, "light_blue_stained_glass");
      else if (x % 3 === 0 || z % 3 === 0) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "light_blue_stained_glass");
      continue;
    }
    if (rel % 2 === 1) {
      // Window band: tinted glass with white mullions, sparse warm light.
      if (x % 3 === 0 || z % 3 === 0) {
        g.set(x, y, z, "white_concrete");
      } else if ((x * 7 + z * 5 + rel) % 29 === 0) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    } else if (k === doorKey && rel === 2) {
      // Stone lintel over the entrance.
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    } else if (y === r - 1) {
      // Cornice band under the parapet.
      g.set(x, y, z, "smooth_quartz");
    } else {
      // Floor spandrel / storey line.
      g.set(x, y, z, "light_gray_concrete");
    }
  }

  if (edge) {
    // Parapet one block above the roof line.
    g.set(x, r, z, "white_concrete");
  } else {
    // Roof surface on interior cells.
    g.set(x, r - 1, z, "light_gray_concrete");
    // Small mechanical penthouses on a loose grid.
    if (x % 5 === 2 && z % 5 === 2 && r + 1 < H) {
      g.set(x, r, z, "white_concrete");
      g.set(x, r + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/DC86665.nbt`);
