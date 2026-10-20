import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455229";
const W = 17, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gr));
}

const b0 = Math.min(...ground.values());   // lowest ground under footprint
const T = b0 + 11;                          // roof top (exclusive): about 11 blocks above lowest ground
const has = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);

// Entrance: the exposed south-facing (max z) perimeter cell, lowest x
let maxZ = -1, doorX = -1;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (perim(x, z)) {
    if (z > maxZ || (z === maxZ && x < doorX)) { maxZ = z; doorX = x; }
  }
}
const doorZ = maxZ;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const isPerim = perim(x, z);
  const u = x + z; // position along facade for mullion rhythm

  // Foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  if (isPerim) {
    for (let y = gr; y < T && y < H; y++) {
      const rel = y - b0;
      let blk;
      if (y === gr) {
        blk = "polished_granite";                       // base course
      } else if (rel < 5) {                              // storey 1: shopfront
        if (y <= gr + 2) {
          blk = (u % 3 === 0) ? "white_concrete" : "light_blue_stained_glass";
        } else if (y === gr + 3) {
          blk = "smooth_quartz";                         // shopfront transom line
        } else {
          blk = "white_concrete";
        }
      } else if (rel < 10) {                             // storey 2: office windows
        if (y === b0 + 5) blk = "smooth_quartz";         // storey line
        else if (y >= b0 + 6 && y <= b0 + 8) {
          blk = (u % 3 === 0) ? "white_concrete" : "light_blue_stained_glass";
        } else blk = "white_concrete";                   // spandrel
      } else {
        blk = "smooth_quartz";                           // parapet cornice
      }
      // warm lights behind some glass
      if (blk === "light_blue_stained_glass" && (x * 5 + z * 3 + y) % 7 === 0) blk = "glowstone";
      g.set(x, y, z, blk);
    }

    // Entrance with canopy
    if (x === doorX && z === doorZ && gr < T) {
      g.set(x, gr, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "white_concrete");
      for (const dx of [-1, 0, 1]) {
        if (has(x + dx, z)) g.set(x + dx, gr + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  } else {
    // Interior: air gap behind glass, floor slab per storey, roof deck
    if (b0 + 5 >= gr && b0 + 5 < H) g.set(x, b0 + 5, z, "smooth_stone");
    if (b0 + 9 >= gr && b0 + 9 < H) g.set(x, b0 + 9, z, "light_gray_concrete");
    // Roof equipment boxes on the deck
    if (x % 4 === 2 && z % 4 === 2 && b0 + 10 < H) {
      g.set(x, b0 + 10, z, "gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
