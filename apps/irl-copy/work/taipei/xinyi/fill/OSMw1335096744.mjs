import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1335096744";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 2, H = 15, D = 24;
const g = new Voxels([W, H, D]);

// Ground per cell, normalised so the lowest ground under the footprint is y 0.
const key = (x, z) => `${x},${z}`;
const gMap = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const v = Math.round(gr);
  gMap.set(key(x, z), v);
  minG = Math.min(minG, v);
}
for (const [k, v] of gMap) gMap.set(k, Math.min(2, v - minG));

const has = (x, z) => gMap.has(key(x, z));

// Roof surface sits at y 3 (about 3 blocks above lowest ground); walls run y gy..2.
const ROOF_Y = 3;
const TOP_WALL = 2;

// Door on the exposed west face, near the south-west corner (z 1 or 2).
let doorCell = null;
for (const z of [1, 2, 3, 0]) {
  if (has(0, z) && !has(-1, z) && gMap.get(key(0, z)) + 1 <= TOP_WALL) {
    doorCell = { x: 0, z, gy: gMap.get(key(0, z)) };
    break;
  }
}

for (const [x, z] of cells) {
  const gy = gMap.get(key(x, z));

  // Foundation fill from y 0 up to the cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  const westExposed = !has(x - 1, z);
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;

  // Base course at ground level.
  g.set(x, gy, z, "polished_andesite");

  // Storey wall above the base, up to the cornice.
  for (let y = gy + 1; y <= TOP_WALL; y++) {
    if (y === TOP_WALL) {
      // Cornice band just under the roof slab.
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (westExposed) {
      // Glazed street face: pillars every 4 blocks, glass between, warm lights now and then.
      if (z % 4 === 0) {
        g.set(x, y, z, "quartz_pillar", { axis: "y" });
      } else if (z % 12 === 5) {
        g.set(x, y, z, "sea_lantern");
      } else {
        g.set(x, y, z, "glass_pane");
      }
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // Roof edge slab on top of the walls, at y 3.
  g.set(x, ROOF_Y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Entrance door on the west face: two blocks tall.
  if (isDoor) {
    const dy = gy;
    g.set(x, dy, z, "oak_door", {
      facing: "west", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, dy + 1, z, "oak_door", {
      facing: "west", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Small canopy line above the door, inside the footprint height.
    if (dy + 2 <= TOP_WALL) {
      g.set(x, dy + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  }
}

g.save(`${dir}/${id}.nbt`);
