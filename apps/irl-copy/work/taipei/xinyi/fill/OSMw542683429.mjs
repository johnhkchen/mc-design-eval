import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542683429.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542683429.nbt";

const W = 14, H = 23, D = 13;

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const k = (x, z) => x + "," + z;
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(k(x, z), Math.round(gr));
const base = Math.min(...foot.values());

// Storey lines and roof, relative to the lowest ground (y 0)
const L1 = base + 5;   // second floor line
const R = base + 11;   // roof slab level

const has = (x, z) => foot.has(k(x, z));
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const SLAB_B = { type: "bottom", waterlogged: "false" };

for (const [key, gr] of foot) {
  const [x, z] = key.split(",").map(Number);
  const gg = gr - base;

  // Foundation up to this cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  const isEdge = edge(x, z);

  if (!isEdge) {
    // Interior: floor slabs only, no interior fit-out
    put(x, gg, z, "smooth_stone");
    if (L1 > gg) put(x, L1, z, "smooth_stone");
    put(x, R, z, "smooth_stone");
    continue;
  }

  // Perimeter facade
  const isCorner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const m = (z === 0 || z === D - 1) ? x : z;   // position along the face
  const pier = isCorner || m % 3 === 0;

  for (let y = gg; y <= R - 1; y++) {
    if (y === gg) {
      put(x, y, z, "stone_bricks");                       // base course
    } else if (y === R - 1) {
      put(x, y, z, "smooth_stone_slab", SLAB_B);          // cornice / parapet cap
    } else if (y === L1) {
      put(x, y, z, "stone_bricks");                       // storey belt course
    } else if (y < L1) {
      // Ground storey: shopfront
      if (y === L1 - 1 || pier) {
        put(x, y, z, "stone_bricks");
      } else if (z === 0 && x === 7 && y <= gg + 2) {
        // Entrance door (front face is north, z = 0)
        const half = y === gg + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", PANE);
        // Warm light on the floor slab just inside the shopfront
        if (y === gg + 1 && m % 6 === 1) {
          const dx = x === 0 ? 1 : (x === W - 1 ? -1 : 0);
          const dz = z === 0 ? 1 : (z === D - 1 ? -1 : 0);
          const ix = x + dx, iz = z + dz;
          if (has(ix, iz) && !edge(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    } else {
      // Upper storey: window grid with stone piers
      if (pier) {
        put(x, y, z, "stone_bricks");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", PANE);
        if (y === L1 + 1 && m % 6 === 1) {
          const dx = x === 0 ? 1 : (x === W - 1 ? -1 : 0);
          const dz = z === 0 ? 1 : (z === D - 1 ? -1 : 0);
          const ix = x + dx, iz = z + dz;
          if (has(ix, iz) && !edge(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Roof slab over the perimeter cell
  put(x, R, z, "smooth_stone");
}

// Roof equipment: two small plant boxes on interior roof cells
for (const [bx, bz] of [[3, 3], [9, 7]]) {
  for (let dx = 0; dx <= 1; dx++) {
    for (let dz = 0; dz <= 1; dz++) {
      const x = bx + dx, z = bz + dz;
      if (has(x, z) && !edge(x, z)) {
        put(x, R + 1, z, "light_gray_concrete");
        put(x, R + 2, z, "light_gray_concrete");
      }
    }
  }
}

g.save(OUT);
