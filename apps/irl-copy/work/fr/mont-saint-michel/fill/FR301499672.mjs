import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499672.cells.json`, "utf8"));

const W = 28, D = 15, HY = 40;
const g = new Voxels([W, HY, D]);

const cellMap = new Map();
for (const [x, z, gr, roof] of cells) cellMap.set(`${x},${z}`, { gr, roof });
const has = (x, z) => cellMap.has(`${x},${z}`);

const grounds = cells.map((c) => c[2]);
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const B = Math.min(...grounds);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const TOP = Math.max(B + 10, Math.min(34, Math.round(medRoof)));
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const zmin = Math.min(...zs), zmax = Math.max(...zs);

const perim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const corner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const put = (x, y, z, name, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= HY) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

const WALL = "calcite";        // cream render, Mont-Saint-Michel hotel facade
const BELT = "stone_bricks";   // storey belt courses and sills
const PIER = "polished_andesite";
const DOOR_X = 13;

for (const [x, z, gr] of cells) {
  const isPerim = perim(x, z);
  const front = z === zmin;
  const cor = corner(x, z);

  // Plain stone foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (isPerim) {
    for (let y = gr; y < TOP - 1; y++) {
      const rel = (y - B) % 5;
      const winCol = (x + z) % 3 !== 0 && !cor;

      if (front && y < gr + 5) {
        // Commercial ground floor: base, pilasters, glazed bays, entrance
        if (y === gr) { put(x, y, z, PIER); continue; }
        if (Math.abs(x - DOOR_X) <= 1) {
          // Entrance frame: pilasters either side of the door, dark lintel above
          if (y === gr + 3) { put(x, y, z, "dark_oak_planks"); continue; }
          if (x === DOOR_X && (y === gr + 1 || y === gr + 2)) {
            put(x, y, z, "dark_oak_door", {
              facing: "north", half: y === gr + 1 ? "lower" : "upper",
              hinge: "left", open: "false", powered: "false",
            });
            continue;
          }
          if (x !== DOOR_X) { put(x, y, z, PIER); continue; }
          put(x, y, z, "glass"); continue;
        }
        if (y === gr + 4) { put(x, y, z, "dark_oak_planks"); continue; }
        if (x % 4 === 0 || cor) { put(x, y, z, PIER); continue; }
        put(x, y, z, "glass");
        continue;
      }

      if (y === TOP - 2) { put(x, y, z, "chiseled_stone_bricks"); continue; } // cornice band
      if (rel === 0 && y > B) { put(x, y, z, BELT); continue; }               // storey belt
      if ((rel === 1 || rel === 2 || rel === 3) && winCol) {
        put(x, y, z, "glass_pane");
        continue;
      }
      put(x, y, z, cor ? PIER : WALL);
    }
  } else {
    // Interior: air gap, floor slab per storey only
    for (let y = gr; y < TOP; y++) {
      if (y > B && (y - B) % 5 === 0) put(x, y, z, BELT);
    }
  }

  // Roof cap across the whole footprint
  put(x, TOP, z, "deepslate_tiles");
}

// Warm light inside a few front bays, and above the entrance
for (const [x, z, gr] of cells) {
  if (z !== zmin || perim(x, zmin + 1)) continue;
  if (x === DOOR_X) { put(x, gr + 4, zmin + 1, "glowstone"); continue; }
  if (x % 6 !== 2) continue;
  for (let y = gr + 1; y < TOP - 1; y++) {
    if ((y - B) % 5 === 2 && y > gr + 4) put(x, y, zmin + 1, "glowstone");
  }
}

// Dormers on the front roof slope
const dormerCenters = [4, 10, 17, 23];
for (const c of dormerCenters) {
  if (!has(c, zmin + 1)) continue;
  for (let dx = -1; dx <= 1; dx++) {
    const x = c + dx;
    if (!has(x, zmin + 1)) continue;
    for (let y = TOP + 1; y <= TOP + 2; y++) {
      if (dx === 0) put(x, y, zmin + 1, "glass_pane");
      else put(x, y, zmin + 1, WALL);
    }
    put(x, TOP + 3, zmin + 1, "deepslate_tile_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Chimney stack
const chx = 21, chz = zmin + 4;
if (has(chx, chz)) {
  for (let y = TOP + 1; y <= TOP + 4; y++) put(chx, y, chz, BELT);
  put(chx, TOP + 5, chz, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/FR301499672.nbt`);
