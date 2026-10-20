import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377775";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 58, H = 23, D = 28;
const TOP = 11;               // roof level from lidar (about 11 blocks above lowest ground)
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inside = new Map();
for (const [x, z, gr] of cells) inside.set(key(x, z), Math.round(gr));

const set = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Outward direction of an edge cell: first 4-neighbour not in the footprint.
function outwardOf(x, z) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dz] of dirs) {
    if (!inside.has(key(x + dx, z + dz))) return [dx, dz];
  }
  return null;
}

// Foundations, floor slab, roof slab and base for every footprint cell.
for (const [cx, cz, cg] of cells) {
  const x = cx, z = cz;
  const gr = Math.round(cg);
  const top = Math.max(TOP, gr + 6);
  const F = top - 6;          // second-storey floor line (storey about 5 blocks)

  // Solid foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  // Floor slab between storeys.
  if (F >= gr) set(x, F, z, "light_gray_concrete");

  // Roof slab.
  set(x, top, z, "smooth_stone");
}

// Walls, shopfronts, windows and the entrance on edge cells.
for (const [cx, cz, cg] of cells) {
  const x = cx, z = cz;
  const gr = Math.round(cg);
  const top = Math.max(TOP, gr + 6);
  const F = top - 6;

  const out = outwardOf(x, z);
  if (!out) continue;
  const [dx, dz] = out;

  // Index along the facade.
  const idx = dz !== 0 ? x : z;

  // Body of the wall.
  for (let y = gr; y <= top - 1; y++) set(x, y, z, "white_concrete");

  // Base course and cornice.
  set(x, gr, z, "stone_bricks");
  set(x, top - 1, z, "smooth_stone");

  // Parapet.
  set(x, top + 1, z, "white_concrete");

  // Ground storey: shopfront with piers and transom.
  const isEntrance = dz === 1 && Math.abs(idx - 29) <= 1;
  for (let y = gr + 1; y <= F - 1; y++) {
    if (y === F - 1) {
      set(x, y, z, "light_gray_concrete"); // transom
      continue;
    }
    if (idx % 4 === 0) {
      set(x, y, z, "white_concrete");      // pier
    } else {
      set(x, y, z, "glass_pane");          // shopfront glazing
    }
  }

  // Entrance: open doorway and canopy.
  if (isEntrance && idx === 29) {
    set(x, gr + 1, z, "air");
    set(x, gr + 2, z, "air");
    // Warm light just inside the doorway.
    set(x - dx, gr + 2, z - dz, "glowstone");
  }
  if (dz === 1 && Math.abs(idx - 29) <= 2) {
    set(x, gr + 3, z, "light_gray_concrete"); // canopy
  }

  // Upper storey: window bays with piers every third column.
  for (let y = F + 1; y <= top - 2; y++) {
    if (idx % 3 === 0) {
      set(x, y, z, "white_concrete");
    } else {
      set(x, y, z, "glass_pane");
    }
  }

  // Warm lights behind a scattering of upper windows.
  if (idx % 3 !== 0 && (idx * 5 + z * 3) % 13 === 0) {
    const ix = x - dx, iz = z - dz;
    if (inside.has(key(ix, iz))) set(ix, F + 2, iz, "glowstone");
  }
}

// Rooftop plant boxes on a few interior roof cells.
for (const [cx, cz, cg] of cells) {
  const x = cx, z = cz;
  const gr = Math.round(cg);
  const top = Math.max(TOP, gr + 6);
  if (outwardOf(x, z)) continue;
  if (x % 16 === 8 && z % 10 === 5) {
    set(x, top + 1, z, "light_gray_concrete");
    set(x, top + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
