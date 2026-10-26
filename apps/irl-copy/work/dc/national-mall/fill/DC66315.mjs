import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66315.cells.json`, "utf8"));

const W = 20, H = 33, D = 25;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = (x, z) => map.has(key(x, z));

// Base level: lowest ground under the footprint
const B = Math.min(...cells.map(c => c[2]));

// Snap lidar roofs to clean 3-block storey tiers, keep them above ground
const map = new Map();
for (const [x, z, gr, r] of cells) {
  let rt = B + 3 * Math.round((r - B) / 3);
  if (rt < gr + 3) rt = gr + 3;
  if (rt > H - 4) rt = H - 4;
  map.set(key(x, z), { gr, r: rt });
}
const maxR = Math.max(...[...map.values()].map(v => v.r));

function hash(x, y, z) {
  let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h >>> 0) % 1000) / 1000;
}

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { gr, r } = map.get(key(x, z));
  const north = !has(x, z - 1);
  const south = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const perimeter = north || south || west || east;

  let face = null;
  if (south) face = "south";
  else if (north) face = "north";
  else if (east) face = "east";
  else if (west) face = "west";

  const c = (face === "north" || face === "south") ? x : z;
  const isEntranceCell = face === "south" && x === 9;

  // foundation up to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // storeys
  for (let y = gr; y < r; y++) {
    const h = y - gr;

    if (!perimeter) {
      g.set(x, y, z, "calcite");
      continue;
    }

    let mat;
    if (y === r - 1) {
      mat = "stone_bricks"; // cornice course
    } else if (h === 0) {
      mat = "polished_andesite"; // base course
    } else if (h < 3) {
      mat = (c % 3 === 0) ? "calcite" : "tinted_glass"; // shopfront
    } else {
      const k = h % 3;
      if (k === 0) {
        mat = "smooth_stone"; // storey line
      } else if (c % 3 === 0) {
        mat = "calcite"; // pier
      } else {
        mat = hash(x, y, z) > 0.92 ? "glowstone" : "tinted_glass";
      }
    }
    g.set(x, y, z, mat);
  }

  // entrance on street face
  if (perimeter && isEntranceCell) {
    g.set(x, gr, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "calcite"); // lintel
  }

  // parapet on perimeter roof edge
  if (perimeter) {
    g.set(x, r, z, "cobblestone_wall");
  }

  // single rooftop core on the top tier only
  if (!perimeter && r === maxR && x >= 6 && x <= 13 && z >= 8 && z <= 16) {
    g.set(x, r, z, "calcite");
    g.set(x, r + 1, z, "tinted_glass");
    g.set(x, r + 2, z, "stone_bricks");
  }
}

g.save(`${DIR}/DC66315.nbt`);
