import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86673.cells.json`, "utf8"));

// 1121 Vermont Ave NW: Hotel-Large, ~20 blocks tall from lidar.
// Brick commercial hotel: granite base, brick walls, calcite string course
// each storey (3 blocks), glass windows, shopfront ground storey, calcite
// parapet, mechanical penthouse on the roof.
const W = 15, H = 32, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const top = Math.min(H - 3, Math.max(ground + 3, Math.round(rf)));
  map.set(key(x, z), { gr: ground, top });
}
const has = (x, z) => map.has(key(x, z));
const isEdge = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !has(x + dx, z + dz));

for (const [k, { gr, top }] of map) {
  const [x, z] = k.split(",").map(Number);
  const edge = isEdge(x, z);

  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!edge) {
    // Solid core: floor slabs stand on the core, nothing hangs in the air
    for (let y = gr; y < top; y++) {
      const rel = (y - gr) % 3;
      if (y === top - 1) g.set(x, y, z, "stone");
      else if (rel === 0) g.set(x, y, z, "smooth_stone");
      else g.set(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  for (let y = gr; y < top; y++) {
    const rel = (y - gr) % 3;
    const storey = Math.floor((y - gr) / 3);

    if (y === top - 1) { // parapet / coping
      g.set(x, y, z, "calcite");
      continue;
    }
    if (y === gr) { // base course
      g.set(x, y, z, "polished_granite");
      continue;
    }
    if (storey === 0) { // shopfront storey
      if (rel >= 1 && (x + z) % 3 !== 0) g.set(x, y, z, "glass");
      else g.set(x, y, z, "polished_granite");
      continue;
    }
    if (rel === 0) { // storey string course
      g.set(x, y, z, "calcite");
      continue;
    }
    // Upper windows: solid glass bays with brick piers, some lit
    if ((x + z) % 3 !== 0) {
      const lit = (x * 7 + z * 3 + storey * 5) % 9 === 0;
      g.set(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

// Entrance on the street-facing edge, centre of the front
for (let z = 0; z < D; z++) {
  if (has(7, z) && !has(7, z - 1)) {
    const gr = map.get(key(7, z)).gr;
    g.set(7, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(7, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(7, gr + 2, z, "calcite"); // lintel
    // flanking granite piers so the door reads at street level
    if (has(6, z)) g.set(6, gr + 1, z, "polished_granite");
    if (has(8, z)) g.set(8, gr + 1, z, "polished_granite");
    break;
  }
}

// Roof mechanical penthouse on the centre of the roof, stands on the roof slab
for (let x = 5; x <= 9; x++) {
  for (let z = 5; z <= 9; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    const { top } = map.get(key(x, z));
    g.set(x, top, z, "stone_bricks");
    g.set(x, top + 1, z, "stone_bricks");
  }
}

g.save(`${DIR}/DC86673.nbt`);
