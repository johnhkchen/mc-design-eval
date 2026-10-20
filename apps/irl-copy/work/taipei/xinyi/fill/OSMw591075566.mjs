import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low commercial block, c. 1990s Taipei: white concrete frame, granite base,
// tinted glazing in the bays, shopfront on the street face, flat roof with parapet.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw591075566.cells.json", "utf8"));

const W = 19, H = 20, D = 7;
const g = new Voxels([W, H, D]);

const ROOF = 8;      // roof slab, about 8 blocks above lowest ground
const PARAPET = 9;   // parapet course on the perimeter
const GLASS = "cyan_stained_glass_pane";
const FRAME = "white_concrete";

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

for (const [x, z, gr] of cells) {
  const per = isPerim(x, z);
  const pillar = x % 3 === 0; // bay frames every 3 blocks

  for (let y = 0; y <= PARAPET; y++) {
    // Foundation under the cell up to its own ground
    if (y < gr) { put(x, y, z, "polished_andesite"); continue; }
    // Floor slab / base course at the cell's ground
    if (y === gr) { put(x, y, z, per ? "polished_granite" : "smooth_stone"); continue; }
    // Interior storey floor at level 4
    if (y === 4) { put(x, y, z, per ? "smooth_stone" : "smooth_stone"); continue; }
    // Roof slab and cornice
    if (y === ROOF) { put(x, y, z, per ? "smooth_stone" : "light_gray_concrete"); continue; }
    // Parapet
    if (y === PARAPET) { if (per) put(x, y, z, FRAME); continue; }
    // Interior air: nothing else
    if (!per) continue;

    // Lintel / sign bands at the top of each storey
    if (y === 3 || y === 7) { put(x, y, z, FRAME); continue; }

    // Shopfront entrance on the street face (z = 0)
    if (z === 0 && x === 9 && y === gr + 1) {
      put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (z === 0 && x === 9 && y === gr + 2) {
      put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }

    // Window bays: frames on pillars, tinted glass between
    put(x, y, z, pillar ? FRAME : GLASS);
  }
}

// Warm interior lights on the floor behind the street-face windows
for (const x of [4, 13]) {
  if (has(x, 1) && !isPerim(x, 1) && ground.get(`${x},1`) + 1 <= 3) {
    put(x, ground.get(`${x},1`) + 1, 1, "lantern", { hanging: "false" });
  }
}
for (const x of [7, 16]) {
  if (has(x, 1) && !isPerim(x, 1) && ground.get(`${x},1`) < 4) {
    put(x, 5, 1, "lantern", { hanging: "false" });
  }
}

// Roof plant: two rooftop air-handling boxes
for (const [x0, z0] of [[4, 3], [13, 3]]) {
  for (let dx = 0; dx < 2; dx++) {
    for (let dz = 0; dz < 2; dz++) {
      const x = x0 + dx, z = z0 + dz;
      if (has(x, z) && !isPerim(x, z)) put(x, ROOF + 1, z, "light_gray_concrete");
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw591075566.nbt");
